import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { User, Company, ChartOfAccount, Subject, CostCenter, Item, Employee, Institution, MonthlyParameter, Voucher, Invoice, FeeInvoice, WarehouseMovement, Payslip, BankReconciliation, AccountGroup, FamilyAllowance, Notification, AnyTable, UserData } from '../types';

// Definición de la interfaz para el contexto de sesión
interface Session {
    currentUser: User | null;
    companies: Company[];
    activeCompany: Company | null; // Objeto de la empresa activa
    activePeriod: string;
    periods: { value: string; label: string; }[];
    isLoading: boolean;
    notifications: (Notification & { id: number })[];
    // ... otros datos ...
    chartOfAccounts: ChartOfAccount[];
    subjects: Subject[];
    vouchers: Voucher[];
    // ... etc

    // Funciones
    login: (email: string, pass: string) => Promise<User>;
    logout: () => void;
    addNotification: (notification: Notification) => void;
    switchCompany: (id: number) => void; // Renombrada para mayor claridad
    setActivePeriod: (period: string) => void;
    refreshTable: <T extends keyof AnyTable>(tableName: T) => Promise<void>;
    handleApiError: (error: any, context: string) => void;
    sendPasswordResetEmail: (email: string) => Promise<void>;
    addUser: (userData: UserData, password: string, setLoadingMessage: (message: string) => void) => Promise<User>;
    updateUser: (user: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
}

const SessionContext = createContext<Session | undefined>(undefined);

// Función para generar los períodos (sin cambios)
const generatePeriods = () => {
    const periods = [];
    const startYear = new Date().getFullYear() - 2;
    for (let i = 0; i < 5; i++) {
        const year = startYear + i;
        for (let month = 1; month <= 12; month++) {
            periods.push({ value: `${year}-${month.toString().padStart(2, '0')}`, label: `${month.toString().padStart(2, '0')}/${year}` });
        }
    }
    return periods.reverse();
};

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [activeCompanyId, setActiveCompanyIdState] = useState<number | null>(null);
    const [activePeriod, setActivePeriodState] = useState<string>(() => `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`);
    const [periods] = useState(generatePeriods());
    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState<(Notification & { id: number })[]>([]);

    // Estados para los datos específicos de la empresa
    const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    // ... (otros estados de datos)
    const [vouchers, setVouchers] = useState<Voucher[]>([]);

    // Deriva el objeto de la empresa activa a partir del ID
    const activeCompany = useMemo(() => {
        return companies.find(c => c.id === activeCompanyId) || null;
    }, [companies, activeCompanyId]);

    // Notificaciones y manejo de errores (sin cambios)
    const addNotification = (notification: Notification) => {
        const newId = Date.now();
        setNotifications(prev => [...prev, { ...notification, id: newId }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== newId)), 5000);
    };
    const handleApiError = (error: any, context: string) => addNotification({ type: 'error', message: error.message || `Error desconocido ${context}` });

    // Función para obtener todos los datos de una empresa
    const fetchDataForCompany = async (companyId: number) => {
        if (!companyId) return;
        addNotification({ type: 'info', message: `Sincronizando datos...` });
        try {
            const tables: (keyof AnyTable)[] = ['chart_of_accounts', 'subjects', 'vouchers']; // Lista simplificada para el ejemplo
            const promises = tables.map(tableName =>
                supabase.from(tableName).select('*').eq('company_id', companyId).then(({ data, error }) => {
                    if (error) throw new Error(`Error en ${tableName}: ${error.message}`);
                    return { [tableName]: data || [] };
                })
            );
            const results = await Promise.all(promises);
            const companyData = results.reduce((acc, current) => ({ ...acc, ...current }), {});

            // Actualiza los estados
            setChartOfAccounts(companyData.chart_of_accounts || []);
            setSubjects(companyData.subjects || []);
            setVouchers(companyData.vouchers || []);
            
            addNotification({ type: 'success', message: 'Datos sincronizados.' });
        } catch (error: any) {
            handleApiError(error, 'al sincronizar datos');
        }
    };

    // Carga de datos inicial al autenticar al usuario
    const fetchInitialData = async (user: User) => {
        setIsLoading(true);
        try {
            const { data: companiesData, error: companiesError } = await supabase.from('companies').select('*');
            if (companiesError) throw companiesError;
            setCompanies(companiesData || []);

            const userCompanies = (companiesData || []).filter(c => c.owner_id === user.id);
            let companyToLoadId = activeCompanyId;

            if (user.role === 'Accountant' && userCompanies.length > 0) {
                if (!companyToLoadId || !userCompanies.some(c => c.id === companyToLoadId)) {
                    const storedId = localStorage.getItem('activeCompanyId');
                    companyToLoadId = storedId && userCompanies.some(c => c.id === Number(storedId)) ? Number(storedId) : userCompanies[0].id;
                }
                
                if (companyToLoadId) {
                    setActiveCompanyIdState(companyToLoadId);
                    localStorage.setItem('activeCompanyId', String(companyToLoadId));
                    await fetchDataForCompany(companyToLoadId);
                }
            }
        } catch (error: any) {
            handleApiError(error, "al cargar datos iniciales");
        } finally {
            setIsLoading(false);
        }
    };
    
    // Función para cambiar de empresa
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

    // ... (resto de funciones: refreshTable, login, logout, etc. sin cambios significativos en su lógica principal)
    const login = async (email: string, pass: string): Promise<User> => { /* ... */ return {} as User; };
    const logout = async () => { /* ... */ };
    const refreshTable = async <T extends keyof AnyTable>(tableName: T) => { /* ... */ };
    const sendPasswordResetEmail = async (email: string) => { /* ... */ };
    const addUser = async (userData: UserData, password: string, setLoadingMessage: (message: string) => void): Promise<User> => { /* ... */ return {} as User; };
    const updateUser = async (user: User) => { /* ... */ };
    const deleteUser = async (userId: string) => { /* ... */ };
    
    // Efecto para gestionar el estado de autenticación
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data: userProfile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
                if (userProfile) {
                    setCurrentUser(userProfile);
                    await fetchInitialData(userProfile);
                }
            } else {
                 setIsLoading(false);
            }
        };
        checkUser();
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                 const { data: userProfile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
                 if (userProfile) {
                    setCurrentUser(userProfile);
                    await fetchInitialData(userProfile);
                 }
            } else if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
                setCompanies([]);
                setActiveCompanyIdState(null);
                // ... (limpiar otros estados)
            }
        });
        return () => { authListener.subscription.unsubscribe(); };
    }, []);

    return (
        <SessionContext.Provider value={{
            currentUser, companies, activeCompany, activePeriod, periods, isLoading, notifications,
            chartOfAccounts, subjects, vouchers, /*... otros datos ...*/
            login, logout, addNotification, switchCompany, setActivePeriod, refreshTable, handleApiError,
            sendPasswordResetEmail, addUser, updateUser, deleteUser
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