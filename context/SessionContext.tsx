
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { unformatRut } from '../utils/format';
// Import CompanyData and allow Partial for updates
import type { User, Company, CompanyData, ChartOfAccount, Subject, CostCenter, Item, Employee, Institution, MonthlyParameter, Voucher, Invoice, FeeInvoice, WarehouseMovement, Payslip, BankReconciliation, AccountGroup, FamilyAllowanceBracket, Notification, AnyTable, UserData, IncomeTaxBracket } from '../types';

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
    login: (email: string, pass: string) => Promise<User>;
    logout: () => void;
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    setActiveCompanyId: (id: number | null) => void;
    setActivePeriod: (period: string) => void;
    sendPasswordResetEmail: (email: string) => Promise<void>;
    fetchDataForCompany: (companyId: number) => Promise<void>;
    refreshTable: <T extends keyof AnyTable>(tableName: T) => Promise<void>;
    addUser: (userData: UserData, password: string, setLoadingMessage: (message: string) => void) => Promise<User>;
    updateUser: (user: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    handleApiError: (error: any, context: string) => void;
    // Updated signatures for company management
    addCompany: (company: CompanyData) => Promise<void>;
    updateCompany: (id: number, data: Partial<Company>) => Promise<void>;
    deleteCompany: (id: number | string) => Promise<void>;
    // Chart of Account Management
    addChartOfAccount: (account: Omit<ChartOfAccount, 'id' | 'company_id'>) => Promise<void>;
    updateChartOfAccount: (account: ChartOfAccount) => Promise<void>;
    deleteChartOfAccount: (id: number | string) => Promise<void>;
    // Other specific data actions
    addSubject: (subject: Omit<Subject, 'id' | 'company_id'>) => Promise<void>;
    updateSubject: (subject: Subject) => Promise<void>;
    deleteSubject: (id: number | string) => Promise<void>;
    addEmployee: (employee: Omit<Employee, 'id' | 'company_id'>) => Promise<void>;
    updateEmployee: (employee: Employee) => Promise<void>;
    deleteEmployee: (id: number | string) => Promise<void>;
    addInstitution: (institution: Omit<Institution, 'id'>) => Promise<void>;
    updateInstitution: (institution: Institution) => Promise<void>;
    deleteInstitution: (id: number | string) => Promise<void>;
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
    };

    const clearAllData = () => {
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
        setUsers([]);
        setAccountGroups([]);
        setFamilyAllowanceBrackets([]);
        setIncomeTaxBrackets([]);
        setActiveCompanyIdState(null);
        localStorage.removeItem('activeCompanyId');
        localStorage.removeItem('activePeriod');
    };

    const fetchDataForCompany = async (companyId: number) => {
        if (!companyId) return;
        addNotification({ type: 'success', message: `Sincronizando datos para la empresa...` });

        try {
            const companySpecificTables: (keyof AnyTable)[] = [
                'chart_of_accounts', 'subjects', 'cost_centers', 'items', 'employees',
                'monthly_parameters', 'vouchers', 'invoices',
                'fee_invoices', 'warehouse_movements', 'payslips',
                'account_groups', 'family_allowance_brackets', 'income_tax_brackets'
            ];

            const promises = companySpecificTables.map(tableName =>
                supabase.from(tableName).select('*').eq('company_id', companyId).then(({ data, error }) => {
                    if (error) throw new Error(`Error fetching ${tableName}: ${error.message}`);
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
            setMonthlyParameters(companyData.monthly_parameters || []);
            setVouchers(companyData.vouchers || []);
            setInvoices(companyData.invoices || []);
            setFeeInvoices(companyData.fee_invoices || []);
            setWarehouseMovements(companyData.warehouse_movements || []);
            setPayslips(companyData.payslips || []);
            setAccountGroups(companyData.account_groups || []);
            setFamilyAllowanceBrackets(companyData.family_allowance_brackets || []);
            setIncomeTaxBrackets(companyData.income_tax_brackets || []);

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

            const { data: institutionsData, error: institutionsError } = await supabase.from('institutions').select('*');
            if (institutionsError) throw institutionsError;
            setInstitutions(institutionsData || []);

            if (user.role === 'System Administrator') {
                const { data: usersData, error: usersError } = await supabase.from('users').select('*');
                if (usersError) throw usersError;
                setUsers(usersData || []);
            }

            const userHasCompanies = (companiesData || []).some(c => c.owner_id === user.id);
            let companyToLoad: number | null = null;

            if (userHasCompanies) {
                const storedCompanyId = localStorage.getItem('activeCompanyId');
                const storedCompanyIdNum = storedCompanyId ? parseInt(storedCompanyId, 10) : null;

                if (storedCompanyIdNum && (companiesData || []).some(c => c.id === storedCompanyIdNum)) {
                    companyToLoad = storedCompanyIdNum;
                } else {
                    companyToLoad = (companiesData || []).find(c => c.owner_id === user.id)!.id;
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
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: userProfile, error } = await supabase.from('users').select('*').eq('id', session.user.id).single();
                if (error) {
                    handleApiError(error, "al cargar el perfil de usuario");
                } else if (userProfile) {
                    setCurrentUser(userProfile);
                    await fetchInitialData(userProfile);
                }
            }
            setIsLoading(false);
        };
        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                // Potentially re-fetch or update user profile
            } else {
                clearAllData();
            }
        });

        return () => authListener.subscription.unsubscribe();
    }, []);

    const setActiveCompanyId = (id: number | null) => {
        if (id !== activeCompanyId) {
            localStorage.setItem('activeCompanyId', String(id));
            setActiveCompanyIdState(id);
            if (id) fetchDataForCompany(id);
        }
    };

    const setActivePeriod = (period: string) => {
        localStorage.setItem('activePeriod', period);
        setActivePeriodState(period);
    };

    const refreshTable = async <T extends keyof AnyTable>(tableName: T) => {
        if (!activeCompanyId && tableName !== 'companies' && tableName !== 'users' && tableName !== 'institutions') return;
        try {
            let query = supabase.from(tableName).select('*');
            const companySpecificTables: (keyof AnyTable)[] = [
                'chart_of_accounts', 'subjects', 'cost_centers', 'items', 'employees',
                'monthly_parameters', 'vouchers', 'invoices',
                'fee_invoices', 'warehouse_movements', 'payslips',
                'account_groups', 'family_allowance_brackets', 'income_tax_brackets'
            ];
            if (activeCompanyId && companySpecificTables.includes(tableName)) {
                query = query.eq('company_id', activeCompanyId);
            }
    
            const { data, error } = await query;
            if (error) throw error;

            const setters: { [K in keyof AnyTable]: React.Dispatch<React.SetStateAction<any>> } = {
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
                users: setUsers,
                account_groups: setAccountGroups,
                family_allowance_brackets: setFamilyAllowanceBrackets,
                income_tax_brackets: setIncomeTaxBrackets,
            };
    
            if (setters[tableName]) setters[tableName](data || []);

        } catch (error: any) {
            handleApiError(error, `al refrescar la tabla ${tableName}`);
        }
    };

    // Auth and User Management
    const login = async (email: string, pass: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error || !data.user) throw new Error(error?.message || "Login failed");
        const { data: userProfile, error: profileError } = await supabase.from('users').select('*').eq('id', data.user.id).single();
        if (profileError || !userProfile) throw new Error(profileError?.message || "Profile not found");
        setCurrentUser(userProfile);
        await fetchInitialData(userProfile);
        return userProfile;
    };
    
    const logout = async () => {
        await supabase.auth.signOut();
        clearAllData();
    };

    const sendPasswordResetEmail = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/update-password' });
        if (error) throw error;
    };
    const addUser = async (userData:any, password:any, setLoadingMessage:any) => {
        setLoadingMessage("Invocando función...");
        const { data, error } = await supabase.functions.invoke('create-user', { body: { userData, password } });
        if (error || data.error) throw new Error(error?.message || data.error);
        setLoadingMessage("Actualizando tabla local...");
        await refreshTable('users');
        return data.user;
    };
    const updateUser = async (user:any) => {
        const { error } = await supabase.functions.invoke('update-user', { body: { userId: user.id, updates: user } });
        if (error) throw error;
        await refreshTable('users');
    };
    const deleteUser = async (userId:any) => {
        const { error } = await supabase.functions.invoke('delete-user', { body: { userId } });
        if (error) throw error;
        await refreshTable('users');
    };

    // Company Management (Updated)
    const addCompany = async (company: CompanyData) => {
        if (!currentUser) throw new Error('Usuario no autenticado');
        const newCompany = { ...company, rut: unformatRut(company.rut), owner_id: currentUser.id };
        const { data, error } = await supabase.from('companies').insert(newCompany).select().single();
        if (error) throw error;
        if (data) setCompanies(prev => [...prev, data]);
    };
    
    const updateCompany = async (id: number, updates: Partial<Company>) => {
        if (updates.rut) updates.rut = unformatRut(updates.rut);
        const { data, error } = await supabase.from('companies').update(updates).eq('id', id).select().single();
        if (error) throw error;
        if (data) {
            setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
        }
    };
    
    const deleteCompany = async (id: number | string) => {
        const { error } = await supabase.from('companies').delete().eq('id', id);
        if (error) throw error;
        setCompanies(prev => prev.filter(c => c.id !== id));
    };

    // Chart of Account Management
    const addChartOfAccount = async (account:any) => {
        if (!activeCompany) throw new Error('No hay una empresa activa');
        const newAccount = { ...account, company_id: activeCompany.id };
        const { error } = await supabase.from('chart_of_accounts').insert(newAccount);
        if (error) throw error;
        await refreshTable('chart_of_accounts');
    };

    const updateChartOfAccount = async (account:any) => {
        const { error } = await supabase.from('chart_of_accounts').update(account).eq('id', account.id);
        if (error) throw error;
        await refreshTable('chart_of_accounts');
    };

    const deleteChartOfAccount = async (id:any) => {
        const { error } = await supabase.from('chart_of_accounts').delete().eq('id', id);
        if (error) throw error;
        await refreshTable('chart_of_accounts');
    };
    
    // Subject Management
    const addSubject = async (subject:any) => {
        if (!activeCompany) throw new Error('No hay una empresa activa');
        const newSubject = { ...subject, rut: unformatRut(subject.rut), company_id: activeCompany.id };
        const { error } = await supabase.from('subjects').insert(newSubject);
        if (error) throw error;
        await refreshTable('subjects');
    };
    
    const updateSubject = async (subject:any) => {
        const subjectToUpdate = { ...subject, rut: unformatRut(subject.rut) };
        const { error } = await supabase.from('subjects').update(subjectToUpdate).eq('id', subject.id);
        if (error) throw error;
        await refreshTable('subjects');
    };
    
    const deleteSubject = async (id:any) => {
        const { error } = await supabase.from('subjects').delete().eq('id', id);
        if (error) throw error;
        await refreshTable('subjects');
    };
    
    // Employee Management
    const addEmployee = async (employee:any) => {
        if (!activeCompany) throw new Error('No hay una empresa activa');
        const newEmployee = { ...employee, rut: unformatRut(employee.rut), company_id: activeCompany.id };
        if (newEmployee.afpld) {
            newEmployee.afpId = newEmployee.afpld;
            delete newEmployee.afpld;
        }
        const { error } = await supabase.from('employees').insert(newEmployee);
        if (error) throw error;
        await refreshTable('employees');
    };
    
    const updateEmployee = async (employee:any) => {
        const employeeToUpdate = { ...employee, rut: unformatRut(employee.rut) };
        if (employeeToUpdate.afpld) {
            employeeToUpdate.afpId = employeeToUpdate.afpld;
            delete employeeToUpdate.afpld;
        }
        const { error } = await supabase.from('employees').update(employeeToUpdate).eq('id', employee.id);
        if (error) throw error;
        await refreshTable('employees');
    };
    
    const deleteEmployee = async (id:any) => {
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (error) throw error;
        await refreshTable('employees');
    };

    // Institution Management
    const addInstitution = async (institution: Omit<Institution, 'id'>) => {
        const { error } = await supabase.from('institutions').insert(institution);
        if (error) throw error;
        await refreshTable('institutions');
    };

    const updateInstitution = async (institution: Institution) => {
        const { error } = await supabase.from('institutions').update(institution).eq('id', institution.id);
        if (error) throw error;
        await refreshTable('institutions');
    };

    const deleteInstitution = async (id: number | string) => {
        const { error } = await supabase.from('institutions').delete().eq('id', id);
        if (error) throw error;
        await refreshTable('institutions');
    };

    return (
        <SessionContext.Provider value={{
            currentUser, companies, chartOfAccounts, subjects, costCenters, items, employees,
            institutions, monthlyParameters, vouchers, invoices, feeInvoices, warehouseMovements,
            payslips, users, accountGroups, familyAllowanceBrackets, incomeTaxBrackets, activeCompany,
            activeCompanyId, activePeriod, periods, isLoading, notifications, login, logout, addNotification,
            setActiveCompanyId, setActivePeriod, sendPasswordResetEmail, fetchDataForCompany, refreshTable,
            addUser, updateUser, deleteUser, handleApiError, addCompany, updateCompany, deleteCompany,
            addChartOfAccount, updateChartOfAccount, deleteChartOfAccount,
            addSubject, updateSubject, deleteSubject, addEmployee, updateEmployee, deleteEmployee,
            addInstitution, updateInstitution, deleteInstitution
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
