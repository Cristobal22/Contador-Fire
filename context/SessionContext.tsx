import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { User, Company, ChartOfAccount, Subject, CostCenter, Item, Employee, Institution, MonthlyParameter, Voucher, Invoice, FeeInvoice, WarehouseMovement, Payslip, BankReconciliation, AccountGroup, FamilyAllowance, Notification, AnyTable, UserData } from '../types';

interface Session {
    currentUser: User | null;
    companies: Company[];
    activeCompany: Company | null;
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
    bankReconciliations: BankReconciliation[];
    users: User[];
    accountGroups: AccountGroup[];
    familyAllowances: FamilyAllowance[];
    login: (email: string, pass: string) => Promise<User>;
    logout: () => void;
    addNotification: (notification: Notification) => void;
    switchCompany: (id: number) => void;
    setActivePeriod: (period: string) => void;
    sendPasswordResetEmail: (email: string) => Promise<void>;
    fetchDataForCompany: (companyId: number) => Promise<void>;
    refreshTable: <T extends keyof AnyTable>(tableName: T) => Promise<void>;
    addUser: (userData: UserData, password: string, setLoadingMessage: (message: string) => void) => Promise<User>;
    updateUser: (user: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    handleApiError: (error: any, context: string) => void;
    addCompany: (company: Omit<Company, 'id' | 'owner_id'>) => Promise<void>;
    updateCompany: (company: Company) => Promise<void>;
    deleteCompany: (id: number) => Promise<void>;
}

const SessionContext = createContext<Session | undefined>(undefined);

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
    const [bankReconciliations, setBankReconciliations] = useState<BankReconciliation[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([]);
    const [familyAllowances, setFamilyAllowances] = useState<FamilyAllowance[]>([]);
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

    const addNotification = (notification: Notification) => {
        const newId = Date.now();
        setNotifications(prev => [...prev, { ...notification, id: newId }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== newId));
        }, 5000);
    };

    const handleApiError = (error: any, context: string) => {
        const message = error.message || `Error desconocido ${context}`;
        addNotification({ type: 'error', message });
    };

    const fetchDataForCompany = async (companyId: number) => {
        if (!companyId) return;
        addNotification({ type: 'info', message: `Sincronizando datos para la empresa...` });

        try {
            const companySpecificTables: (keyof AnyTable)[] = [
                'chart_of_accounts', 'subjects', 'cost_centers', 'items', 'employees',
                'institutions', 'monthly_parameters', 'vouchers', 'invoices',
                'fee_invoices', 'warehouse_movements', 'payslips', 'bank_reconciliations',
                'account_groups', 'family_allowances'
            ];

            const promises = companySpecificTables.map(tableName =>
                supabase.from(tableName).select('*').eq('company_id', companyId).then(({ data, error }) => {
                    if (error) {
                        console.error(`Error fetching ${tableName} for company ${companyId}:`, error);
                        throw new Error(`Error fetching ${tableName}: ${error.message}`);
                    }
                    return { [tableName]: data || [] };
                })
            );

            const results = await Promise.all(promises);
            const companyData: { [key: string]: any[] } = results.reduce((acc, current) => ({ ...acc, ...current }), {});

            setChartOfAccounts(companyData.chart_of_accounts || []);
            setSubjects(companyData.subjects || []);
            setCostCenters(companyData.cost_centers || []);
            setItems(companyData.items || []);
            setEmployees(companyData.employees || []);
            setInstitutions(companyData.institutions || []);
            setMonthlyParameters(companyData.monthly_parameters || []);
            setVouchers(companyData.vouchers || []);
            setInvoices(companyData.invoices || []);
            setFeeInvoices(companyData.fee_invoices || []);
            setWarehouseMovements(companyData.warehouse_movements || []);
            setPayslips(companyData.payslips || []);
            setBankReconciliations(companyData.bank_reconciliations || []);
            setAccountGroups(companyData.account_groups || []);
            setFamilyAllowances(companyData.family_allowances || []);

            addNotification({ type: 'success', message: 'Datos sincronizados correctamente.' });
        } catch (error: any) {
            handleApiError(error, 'al sincronizar los datos de la empresa');
        }
    };
    
    const fetchInitialData = async (user: User) => {
        setIsLoading(true);
        try {
            const { data: companiesData, error: companiesError } = await supabase.from('companies').select('*');
            if (companiesError) throw companiesError;
            setCompanies(companiesData || []);

            if (user.role === 'System Administrator') {
                const { data: usersData, error: usersError } = await supabase.from('users').select('*');
                if (usersError) throw usersError;
                setUsers(usersData || []);
            }

            const userCompanies = (companiesData || []).filter(c => c.owner_id === user.id);
            let companyToLoad: number | null = null;

            if (user.role === 'Accountant' && userCompanies.length > 0) {
                const storedCompanyId = localStorage.getItem('activeCompanyId');
                const storedCompanyIdNum = storedCompanyId ? parseInt(storedCompanyId, 10) : null;

                if (storedCompanyIdNum && userCompanies.some(c => c.id === storedCompanyIdNum)) {
                    companyToLoad = storedCompanyIdNum;
                } else {
                    companyToLoad = userCompanies[0].id;
                }
                
                if (companyToLoad) {
                    setActiveCompanyIdState(companyToLoad);
                    localStorage.setItem('activeCompanyId', String(companyToLoad));
                    await fetchDataForCompany(companyToLoad);
                }
            }
        } catch (error: any) {
            handleApiError(error, "al cargar los datos iniciales");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setIsLoading(true); 
    
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
                if (session?.user) {
                    const { data: userProfile, error } = await supabase.from('users').select('*').eq('id', session.user.id).single();
                    if (error) {
                        handleApiError(error, "al cargar el perfil de usuario");
                        setIsLoading(false);
                        return;
                    }
                    if (userProfile) {
                        setCurrentUser(userProfile);
                        await fetchInitialData(userProfile);
                    } else {
                        handleApiError({ message: "No se encontró el perfil para el usuario." }, "en la carga inicial");
                        setIsLoading(false);
                    }
                } else {
                    setIsLoading(false);
                }
            } else if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
                setCompanies([]);
                setChartOfAccounts([]);
                setSubjects([]);
                setCostCenters([]);
                setItems([]);
                setEmployees([]);
                setInstitutions([]);
                setMonthlyParameters([]);
                setVouchers([]);
                setInvoices([]);
                setFeeInvoices([]);
                setWarehouseMovements([]);
                setPayslips([]);
                setBankReconciliations([]);
                setUsers([]);
                setAccountGroups([]);
                setFamilyAllowances([]);
                setActiveCompanyIdState(null);
                localStorage.removeItem('activeCompanyId');
                setIsLoading(false);
            }
        });
    
        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const switchCompany = (id: number) => {
        if (id === activeCompanyId) return;
        localStorage.setItem('activeCompanyId', id.toString());
        setActiveCompanyIdState(id);
        fetchDataForCompany(id);
    };

    const setActivePeriod = (period: string) => {
        localStorage.setItem('activePeriod', period);
        setActivePeriodState(period);
    };

    const refreshTable = async <T extends keyof AnyTable>(tableName: T) => {
        if (!activeCompanyId && tableName !== 'companies' && tableName !== 'users') {
            console.warn(`Cannot refresh ${tableName} without an active company.`);
            return;
        }
    
        console.log(`Refreshing table: ${tableName}`);
        try {
            let query = supabase.from(tableName).select('*');
    
            const companySpecificTables: (keyof AnyTable)[] = [
                'chart_of_accounts', 'subjects', 'cost_centers', 'items', 'employees',
                'institutions', 'monthly_parameters', 'vouchers', 'invoices',
                'fee_invoices', 'warehouse_movements', 'payslips', 'bank_reconciliations',
                'account_groups', 'family_allowances'
            ];
    
            if (activeCompanyId && companySpecificTables.includes(tableName)) {
                query = query.eq('company_id', activeCompanyId);
            }
    
            const { data, error } = await query;
            if (error) throw error;
    
            const setters: Record<keyof AnyTable, React.Dispatch<React.SetStateAction<any>>> = {
                companies: setCompanies,
                chart_of_accounts: setChartOfAccounts,
                subjects: setSubjects,
                cost_centers: setCostCenters,
                items: setItems,
                employees: setEmployees,
                institutions: setInstitutions,
                monthly_parameters: setMonthlyParameters,
                vouchers: setVouchers,
                invoices: setInvoices,
                fee_invoices: setFeeInvoices,
                warehouse_movements: setWarehouseMovements,
                payslips: setPayslips,
                bank_reconciliations: setBankReconciliations,
                users: setUsers,
                account_groups: setAccountGroups,
                family_allowances: setFamilyAllowances,
            };
    
            const setter = setters[tableName];
            if (setter) {
                setter(data || []);
                addNotification({ type: 'success', message: `Tabla '${tableName}' actualizada.` });
            } else {
                 console.warn(`No state setter found for table: ${tableName}`);
            }
        } catch (error: any) {
            handleApiError(error, `al refrescar la tabla ${tableName}`);
        }
    };

    const addUser = async (userData: UserData, password: string, setLoadingMessage: (message: string) => void): Promise<User> => {
        setLoadingMessage("Invocando función de creación de usuario...");
        const { data, error } = await supabase.functions.invoke('create-user', {
            body: { userData, password },
        });

        if (error) {
            throw new Error(`Error en la función: ${error.message}`);
        }

        if (data.error) {
            throw new Error(data.error);
        }
        
        setLoadingMessage("Usuario creado, actualizando la tabla local...");
        await refreshTable('users');
        return data.user;
    };

    const updateUser = async (user: User) => {
        const { error } = await supabase.functions.invoke('update-user', {
            body: { userId: user.id, updates: user },
        });
        if (error) throw error;
        await refreshTable('users');
    };

    const deleteUser = async (userId: string) => {
        const { error } = await supabase.functions.invoke('delete-user', {
            body: { userId },
        });
        if (error) throw error;
        await refreshTable('users');
    };

    const login = async (email: string, pass: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
            if (error.message.includes("Invalid login credentials")) {
                throw new Error("El correo o la contraseña no son correctos. Por favor, inténtelo de nuevo.");
            }
            throw error;
        }

        if (!data.user) throw new Error('Login failed: No user found.');
        
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) throw profileError;
        if (!userProfile) throw new Error('Login failed: No user profile found.');
        
        return userProfile;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
    };

    const sendPasswordResetEmail = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
             redirectTo: window.location.origin + '/update-password',
        });
        if (error) throw error;
    };

    const addCompany = async (company: Omit<Company, 'id' | 'owner_id'>) => {
        if (!currentUser) {
            handleApiError({ message: 'Usuario no autenticado' }, 'al agregar empresa');
            return;
        }
        try {
            const newCompany = { ...company, owner_id: currentUser.id };
            const { error } = await supabase.from('companies').insert(newCompany);
            if (error) throw error;
            addNotification({ type: 'success', message: 'Empresa agregada correctamente.' });
            await refreshTable('companies');
        } catch (error: any) {
            handleApiError(error, 'al agregar la empresa');
        }
    };

    const updateCompany = async (company: Company) => {
        try {
            const { error } = await supabase.from('companies').update(company).eq('id', company.id);
            if (error) throw error;
            addNotification({ type: 'success', message: 'Empresa actualizada correctamente.' });
            await refreshTable('companies');
        } catch (error: any) {
            handleApiError(error, 'al actualizar la empresa');
        }
    };

    const deleteCompany = async (id: number) => {
        try {
            const { error } = await supabase.from('companies').delete().eq('id', id);
            if (error) throw error;
            addNotification({ type: 'success', message: 'Empresa eliminada correctamente.' });
            await refreshTable('companies');
        } catch (error: any) {
            handleApiError(error, 'al eliminar la empresa');
        }
    };

    return (
        <SessionContext.Provider value={{
            currentUser, companies, chartOfAccounts, subjects, costCenters, items, employees,
            institutions, monthlyParameters, vouchers, invoices, feeInvoices, warehouseMovements,
            payslips, bankReconciliations, users, accountGroups, familyAllowances, activeCompany, activeCompanyId: activeCompany?.id || null,
            activePeriod, periods, isLoading, notifications, login, logout, addNotification,
            switchCompany, setActivePeriod, sendPasswordResetEmail, fetchDataForCompany, refreshTable,
            addUser, updateUser, deleteUser, handleApiError, addCompany, updateCompany, deleteCompany
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
