
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { unformatRut } from '../utils/format';
import type { User, Company, CompanyData, ChartOfAccount, Subject, CostCenter, Item, Employee, Institution, MonthlyParameter, Voucher, Invoice, FeeInvoice, WarehouseMovement, Payslip, AccountGroup, FamilyAllowanceBracket, Notification, UserData, IncomeTaxBracket, PeriodStatus, VoucherData, VoucherEntry } from '../types';

interface SessionContextType {
    currentUser: User | null;
    companies: Company[];
    activeCompany: Company | null;
    activeCompanyId: number | null;
    activePeriod: string;
    periods: { value: string; label: string; }[];
    isLoading: boolean;
    notifications: (Notification & { id: number })[];
    chartOfAccounts: ChartOfAccount[];
    subjects: Subject[];
    costCenters: CostCenter[];
    items: Item[];
    employees: Employee[];
    institutions: Institution[];
    monthlyParameters: MonthlyParameter[];
    vouchers: Voucher[];
    invoices: Invoice[];
    feeInvoices: FeeInvoice[];
    warehouseMovements: WarehouseMovement[];
    payslips: Payslip[];
    users: User[];
    accountGroups: AccountGroup[];
    familyAllowanceBrackets: FamilyAllowanceBracket[];
    incomeTaxBrackets: IncomeTaxBracket[];
    periodStatuses: PeriodStatus[];
    login: (email: string, pass: string) => Promise<User>;
    logout: () => void;
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    setActiveCompanyId: (id: number | null) => void;
    setActivePeriod: (period: string) => void;
    sendPasswordResetEmail: (email: string) => Promise<void>;
    fetchDataForCompany: (companyId: number) => Promise<void>;
    addUser: (userData: UserData, password: string, setLoadingMessage: (message: string) => void) => Promise<User>;
    updateUser: (user: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    handleApiError: (error: any, context: string) => void;
    addCompany: (company: CompanyData) => Promise<void>;
    updateCompany: (id: number, data: Partial<Company>) => Promise<void>;
    deleteCompany: (id: number | string) => Promise<void>;
    addVoucher: (voucherData: VoucherData) => Promise<void>;
    updateVoucher: (voucher: Voucher) => Promise<void>;
    deleteVoucher: (voucherId: number) => Promise<void>;
    addSubject: (subject: Omit<Subject, 'id' | 'company_id'>) => Promise<void>;
    updateSubject: (subject: Subject) => Promise<void>;
    deleteSubject: (id: number | string) => Promise<void>;
    closePeriod: (period: string) => Promise<void>;
    reopenPeriod: (period: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

const generatePeriods = () => {
    const periods = [];
    const startYear = new Date().getFullYear() - 2;
    for (let i = 0; i < 5; i++) {
        const year = startYear + i;
        for (let month = 1; month <= 12; month++) {
            const formattedMonth = month.toString().padStart(2, '0');
            periods.push({ value: `${year}-${formattedMonth}`, label: `${formattedMonth}/${year}` });
        }
    }
    return periods.reverse();
};

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [monthlyParameters, setMonthlyParameters] = useState<MonthlyParameter[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [feeInvoices, setFeeInvoices] = useState<FeeInvoice[]>([]);
    const [warehouseMovements, setWarehouseMovements] = useState<WarehouseMovement[]>([]);
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([]);
    const [familyAllowanceBrackets, setFamilyAllowanceBrackets] = useState<FamilyAllowanceBracket[]>([]);
    const [incomeTaxBrackets, setIncomeTaxBrackets] = useState<IncomeTaxBracket[]>([]);
    const [periodStatuses, setPeriodStatuses] = useState<PeriodStatus[]>([]);
    const [activeCompanyId, setActiveCompanyIdState] = useState<number | null>(null);
    const [activePeriod, setActivePeriodState] = useState<string>(() => {
        const today = new Date();
        return `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
    });
    const [periods] = useState(generatePeriods());
    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState<(Notification & { id: number })[]>([]);

    const activeCompany = useMemo(() => {
        return companies.find(c => c.id === activeCompanyId) || null;
    }, [companies, activeCompanyId]);

    const addNotification = (notification: Omit<Notification, 'id'>) => {
        const newId = Date.now();
        setNotifications(prev => [...prev, { ...notification, id: newId }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newId));
        }, 5000);
    };

    const handleApiError = (error: any, context: string) => {
        const message = error.message || `Error desconocido ${context}`;
        addNotification({ type: 'error', message });
        console.error(`Error context: ${context}`, error);
    };

    const fetchAndSetData = async (tableName: string, setter: React.Dispatch<React.SetStateAction<any>>, companyId?: number) => {
        try {
            let query = supabase.from(tableName).select('*');
            if (companyId) {
                query = query.eq('company_id', companyId);
            }
            const { data, error } = await query;
            if (error) throw error;
            setter(data || []);
        } catch (error: any) {
            handleApiError(error, `al cargar ${tableName}`);
        }
    };
    
    const refreshVouchers = async () => {
        if (activeCompanyId) {
            await fetchAndSetData('vouchers', setVouchers, activeCompanyId);
        }
    };

    const refreshPeriodStatuses = async () => {
        if (activeCompanyId) {
            await fetchAndSetData('period_statuses', setPeriodStatuses, activeCompanyId);
        }
    };

    const fetchDataForCompany = async (companyId: number) => {
        if (!companyId) return;
        addNotification({ type: 'info', message: `Sincronizando datos para la empresa...` });

        await Promise.all([
            fetchAndSetData('chart_of_accounts', setChartOfAccounts, companyId),
            fetchAndSetData('subjects', setSubjects, companyId),
            fetchAndSetData('cost_centers', setCostCenters, companyId),
            fetchAndSetData('items', setItems, companyId),
            fetchAndSetData('employees', setEmployees, companyId),
            fetchAndSetData('monthly_parameters', setMonthlyParameters, companyId),
            fetchAndSetData('vouchers', setVouchers, companyId),
            fetchAndSetData('invoices', setInvoices, companyId),
            fetchAndSetData('fee_invoices', setFeeInvoices, companyId),
            fetchAndSetData('warehouse_movements', setWarehouseMovements, companyId),
            fetchAndSetData('payslips', setPayslips, companyId),
            fetchAndSetData('account_groups', setAccountGroups, companyId),
            fetchAndSetData('family_allowance_brackets', setFamilyAllowanceBrackets, companyId),
            fetchAndSetData('income_tax_brackets', setIncomeTaxBrackets, companyId),
            fetchAndSetData('period_statuses', setPeriodStatuses, companyId),
        ]);

        addNotification({ type: 'success', message: 'Datos sincronizados correctamente.' });
    };
    
    useEffect(() => {
        const checkSession = async () => {
            setIsLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: userProfile, error } = await supabase.from('users').select('*').eq('id', session.user.id).single();
                if (error) {
                    handleApiError(error, "al cargar el perfil de usuario");
                } else if (userProfile) {
                    setCurrentUser(userProfile);
                    await fetchAndSetData('companies', setCompanies);
                    await fetchAndSetData('institutions', setInstitutions);

                    if (userProfile.role === 'System Administrator') {
                        await fetchAndSetData('users', setUsers);
                    }
                    
                    const storedCompanyId = localStorage.getItem('activeCompanyId');
                    const companyId = storedCompanyId ? parseInt(storedCompanyId, 10) : null;
                    if(companyId) {
                        setActiveCompanyIdState(companyId);
                        await fetchDataForCompany(companyId);
                    }
                }
            }
            setIsLoading(false);
        };
        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                // This is handled by the logout function now
            }
        });

        return () => authListener.subscription.unsubscribe();
    }, []);

    const login = async (email: string, pass: string): Promise<User> => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        if (!data.user) throw new Error("Authentication failed: User not found.");

        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();
            
        if (profileError) {
            await supabase.auth.signOut(); // Log out if profile is inaccessible
            throw profileError;
        }

        setCurrentUser(userProfile);
        
        // Fetch global and user-specific data
        await fetchAndSetData('institutions', setInstitutions);
        
        if (userProfile.role === 'System Administrator') {
            await fetchAndSetData('users', setUsers);
            await fetchAndSetData('companies', setCompanies);
        } else {
             const { data: userCompanies, error: companyError } = await supabase
                .from('companies')
                .select('*')
                .eq('owner_id', userProfile.id);
            if(companyError) throw companyError;
            setCompanies(userCompanies || []);
        }

        const storedCompanyId = localStorage.getItem('activeCompanyId');
        if (storedCompanyId) {
            const companyId = parseInt(storedCompanyId, 10);
            setActiveCompanyIdState(companyId);
            await fetchDataForCompany(companyId);
        }
        
        return userProfile;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setCompanies([]);
        setChartOfAccounts([]);
        setSubjects([]);
        setCostCenters([]);
        setItems([]);
        setEmployees([]);
        // Institutions are global, no need to clear if you want to keep them for the login screen
        // setInstitutions([]); 
        setMonthlyParameters([]);
        setVouchers([]);
        setInvoices([]);
        setFeeInvoices([]);
        setWarehouseMovements([]);
        setPayslips([]);
        setUsers([]);
        setAccountGroups([]);
        setFamilyAllowanceBrackets([]);
        setIncomeTaxBrackets([]);
        setPeriodStatuses([]);
        setActiveCompanyIdState(null);
        localStorage.clear();
        addNotification({ type: 'info', message: 'Sesión cerrada.' });
    };

    const setActiveCompanyId = (id: number | null) => {
        setActiveCompanyIdState(id);
        if (id) {
            localStorage.setItem('activeCompanyId', String(id));
            fetchDataForCompany(id);
        } else {
            localStorage.removeItem('activeCompanyId');
        }
    };

    const setActivePeriod = (period: string) => {
        setActivePeriodState(period);
        localStorage.setItem('activePeriod', period);
    };

    const sendPasswordResetEmail = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/update-password' });
        if (error) throw error;
    };

    // --- CRUD Operations ---
    
    // VOUCHER
    const addVoucher = async (voucherData: VoucherData) => {
        if (!activeCompanyId) throw new Error("No active company selected");

        const { entries, ...voucherInfo } = voucherData;
        
        const { data: newVoucher, error: voucherError } = await supabase
            .from('vouchers')
            .insert({ ...voucherInfo, company_id: activeCompanyId })
            .select()
            .single();

        if (voucherError) throw voucherError;

        const entriesWithVoucherId = entries.map(e => ({ ...e, voucher_id: newVoucher.id, company_id: activeCompanyId }));
        const { error: entriesError } = await supabase.from('voucher_entries').insert(entriesWithVoucherId);

        if (entriesError) {
            // Rollback voucher creation
            await supabase.from('vouchers').delete().eq('id', newVoucher.id);
            throw entriesError;
        }
        await refreshVouchers();
    };
    
    const updateVoucher = async (voucher: Voucher) => {
        // Implementation for update if needed
    };

    const deleteVoucher = async (voucherId: number) => {
        // Supabase schema should have ON DELETE CASCADE for voucher_entries
        const { error } = await supabase.from('vouchers').delete().eq('id', voucherId);
        if (error) throw error;
        await refreshVouchers();
    };

    // COMPANY
    const addCompany = async (company: CompanyData) => {
        if (!currentUser) throw new Error('Usuario no autenticado');
        const newCompany = { ...company, rut: unformatRut(company.rut), owner_id: currentUser.id };
        const { error } = await supabase.from('companies').insert(newCompany)
        if (error) throw error;
        await fetchAndSetData('companies', setCompanies);
    };
    
    const updateCompany = async (id: number, updates: Partial<Company>) => {
        if (updates.rut) updates.rut = unformatRut(updates.rut);
        const { error } = await supabase.from('companies').update(updates).eq('id', id);
        if (error) throw error;
        await fetchAndSetData('companies', setCompanies);
    };

    const deleteCompany = async (id: number | string) => {
        const { error } = await supabase.from('companies').delete().eq('id', id);
        if (error) throw error;
        await fetchAndSetData('companies', setCompanies);
    };
    
    // SUBJECT
    const addSubject = async (subject:any) => {
        if (!activeCompanyId) throw new Error('No hay una empresa activa');
        const newSubject = { ...subject, rut: unformatRut(subject.rut), company_id: activeCompanyId };
        const { error } = await supabase.from('subjects').insert(newSubject);
        if (error) throw error;
        await fetchAndSetData('subjects', setSubjects, activeCompanyId);
    };
    
    const updateSubject = async (subject:any) => {
        const subjectToUpdate = { ...subject, rut: unformatRut(subject.rut) };
        const { error } = await supabase.from('subjects').update(subjectToUpdate).eq('id', subject.id);
        if (error) throw error;
        await fetchAndSetData('subjects', setSubjects, activeCompanyId);
    };
    
    const deleteSubject = async (id:any) => {
        const { error } = await supabase.from('subjects').delete().eq('id', id);
        if (error) throw error;
        await fetchAndSetData('subjects', setSubjects, activeCompanyId);
    };

    // USER
    const addUser = async (userData:any, password:any, setLoadingMessage:any) => {
        setLoadingMessage("Invocando función...");
        const { data, error } = await supabase.functions.invoke('create-user', { body: { userData, password } });
        if (error || data.error) throw new Error(error?.message || data.error);
        setLoadingMessage("Actualizando tabla local...");
        await fetchAndSetData('users', setUsers);
        return data.user;
    };
    const updateUser = async (user:any) => {
        const { error } = await supabase.functions.invoke('update-user', { body: { userId: user.id, updates: user } });
        if (error) throw error;
        await fetchAndSetData('users', setUsers);
    };
    const deleteUser = async (userId:any) => {
        const { error } = await supabase.functions.invoke('delete-user', { body: { userId } });
        if (error) throw error;
        await fetchAndSetData('users', setUsers);
    };

    // --- Monthly Closing Logic ---
    const closePeriod = async (period: string) => {
        if (!activeCompany || !activeCompany.accumulated_result_account_id) {
            throw new Error("La cuenta de resultado acumulado no está configurada para la empresa activa.");
        }
        
        // 1. Get all result accounts
        const resultAccountGroups = accountGroups.filter(g => g.transitionalType === 'result').map(g => g.name);
        const resultAccounts = chartOfAccounts.filter(acc => resultAccountGroups.includes(acc.type));
        
        // 2. Calculate balances for each result account for the period
        const periodVouchers = vouchers.filter(v => v.date.startsWith(period));
        const balances = new Map<number, { debit: number, credit: number }>();

        for (const v of periodVouchers) {
            const { data: entries, error } = await supabase.from('voucher_entries').select('*').eq('voucher_id', v.id);
            if(error) throw error;

            if (entries) { // FIX: Check if entries exist
                for (const entry of entries) {
                    if (resultAccounts.some(ra => ra.id === entry.accountId)) {
                        const balance = balances.get(entry.accountId) || { debit: 0, credit: 0 };
                        balance.debit += entry.debit;
                        balance.credit += entry.credit;
                        balances.set(entry.accountId, balance);
                    }
                }
            }
        }
        
        // 3. Create closing entries
        const closingEntries: Omit<VoucherEntry, 'id' | 'voucher_id'>[] = [];
        let totalProfit = 0;

        for (const [accountId, balance] of balances.entries()) {
            const netBalance = balance.credit - balance.debit;
            if (netBalance > 0) { // Credit balance (Income) -> Debit to close
                closingEntries.push({ accountId, debit: netBalance, credit: 0 });
            } else if (netBalance < 0) { // Debit balance (Expense) -> Credit to close
                closingEntries.push({ accountId, debit: 0, credit: -netBalance });
            }
            totalProfit += netBalance;
        }

        if (closingEntries.length === 0) {
            addNotification({ type: 'info', message: 'No hay movimientos en cuentas de resultado para cerrar.' });
            return;
        }

        // 4. Add the final entry for accumulated result
        if (totalProfit > 0) { // Profit -> Credit to accumulated result
            closingEntries.push({ accountId: activeCompany.accumulated_result_account_id, debit: 0, credit: totalProfit });
        } else { // Loss -> Debit to accumulated result
            closingEntries.push({ accountId: activeCompany.accumulated_result_account_id, debit: -totalProfit, credit: 0 });
        }

        // 5. Create the closing voucher
        const closingVoucher: VoucherData = {
            type: 'Traspaso',
            date: new Date(parseInt(period.substring(0,4)), parseInt(period.substring(5,7)), 0).toISOString().split('T')[0], // Last day of month
            description: `Cierre del período ${period}`,
            entries: closingEntries,
        };
        await addVoucher(closingVoucher);

        // 6. Update period status
        const { error: statusError } = await supabase.from('period_statuses').upsert({
            company_id: activeCompanyId,
            period,
            status: 'Cerrado',
            closed_at: new Date().toISOString(),
            closed_by_id: currentUser?.id,
        }, { onConflict: 'company_id, period' });

        if (statusError) throw statusError;
        await refreshPeriodStatuses();
        
        addNotification({ type: 'success', message: `Período ${period} cerrado exitosamente.` });
    };

    const reopenPeriod = async (period: string) => {
        if(!activeCompanyId) throw new Error("No hay empresa activa");

        // 1. Find and delete the closing voucher
        const closingVoucherDescription = `Cierre del período ${period}`;
        const { data: closingVouchers, error: findError } = await supabase
            .from('vouchers')
            .select('id')
            .eq('company_id', activeCompanyId)
            .eq('description', closingVoucherDescription);
        
        if (findError) throw findError;

        if (closingVouchers && closingVouchers.length > 0) {
            for(const v of closingVouchers) {
                await deleteVoucher(v.id);
            }
        } else {
             addNotification({ type: 'error', message: `No se encontró el comprobante de cierre para el período ${period}.` });
        }

        // 2. Update period status
        const { error: statusError } = await supabase.from('period_statuses').upsert({
            company_id: activeCompanyId,
            period,
            status: 'Abierto',
        }, { onConflict: 'company_id, period' });
        
        if (statusError) throw statusError;
        await refreshPeriodStatuses();

        addNotification({ type: 'success', message: `Período ${period} reabierto exitosamente.` });
    };
    
    return (
        <SessionContext.Provider value={{
            currentUser, companies, chartOfAccounts, subjects, costCenters, items, employees,
            institutions, monthlyParameters, vouchers, invoices, feeInvoices, warehouseMovements,
            payslips, users, accountGroups, familyAllowanceBrackets, incomeTaxBrackets, activeCompany,
            activeCompanyId, activePeriod, periods, isLoading, notifications, login, logout, addNotification,
            setActiveCompanyId, setActivePeriod, sendPasswordResetEmail, fetchDataForCompany,
            addUser, updateUser, deleteUser, handleApiError, addCompany, updateCompany, deleteCompany,
            addVoucher, updateVoucher, deleteVoucher, addSubject, updateSubject, deleteSubject,
            closePeriod, reopenPeriod, periodStatuses
        }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (context === undefined) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};
