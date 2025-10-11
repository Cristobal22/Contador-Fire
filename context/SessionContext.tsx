
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { unformatRut } from '../utils/format';
import type { 
    User, Company, CompanyData, ChartOfAccount, ChartOfAccountData, Subject, SubjectData, 
    CostCenter, CostCenterData, Item, ItemData, Notification
} from '../types';


// --- TYPE DEFINITION ---
interface SessionContextType {
    currentUser: User | null;
    companies: Company[];
    activeCompany: Company | null;
    activeCompanyId: number | null;
    setActiveCompanyId: (id: number | null) => void;
    isLoading: boolean;
    notifications: (Notification & { id: number })[];
    chartOfAccounts: ChartOfAccount[];
    subjects: Subject[];
    costCenters: CostCenter[];
    items: Item[];
    login: (email: string, pass: string) => Promise<User>;
    logout: () => void;
    sendPasswordResetEmail: (email: string) => Promise<void>;
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    handleApiError: (error: any, context: string) => void;
    addCompany: (company: CompanyData) => Promise<void>;
    updateCompany: (id: number, data: Partial<Company>) => Promise<void>;
    deleteCompany: (id: number | string) => Promise<void>;
    addChartOfAccount: (data: ChartOfAccountData) => Promise<void>;
    updateChartOfAccount: (id: number, data: ChartOfAccountData) => Promise<void>;
    deleteChartOfAccount: (id: number) => Promise<void>;
    addSubject: (data: SubjectData) => Promise<void>;
    updateSubject: (id: number, data: SubjectData) => Promise<void>;
    deleteSubject: (id: number) => Promise<void>;
    addCostCenter: (data: CostCenterData) => Promise<void>;
    updateCostCenter: (id: number, data: CostCenterData) => Promise<void>;
    deleteCostCenter: (id: number) => Promise<void>;
    addItem: (data: ItemData) => Promise<void>;
    updateItem: (id: number, data: ItemData) => Promise<void>;
    deleteItem: (id: number) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider = ({ children }: { children: ReactNode }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState<(Notification & { id: number })[]>([]);
    const [activeCompanyId, setActiveCompanyIdState] = useState<number | null>(null);

    const activeCompany = useMemo(() => companies.find(c => c.id === activeCompanyId) || null, [companies, activeCompanyId]);

    const addNotification = (notification: Omit<Notification, 'id'>) => {
        const newId = Date.now();
        setNotifications(prev => [...prev, { ...notification, id: newId }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== newId)), 5000);
    };

    const handleApiError = (error: any, context: string) => {
        console.error(`Error context: ${context}`, error);
        addNotification({ type: 'error', message: error.message || `Error desconocido ${context}` });
    };
    
    const fetchDataForCompany = async (companyId: number) => {
        if (!companyId) return;
        const fetchAndSet = async (tableName: string, setter: Function) => {
            const { data, error } = await supabase.from(tableName).select('*').eq('company_id', companyId);
            if (error) throw error;
            setter(data || []);
        };
        try {
            await Promise.all([
                fetchAndSet('chart_of_accounts', setChartOfAccounts),
                fetchAndSet('subjects', setSubjects),
                fetchAndSet('cost_centers', setCostCenters),
                fetchAndSet('items', setItems),
            ]);
        } catch (error) {
            handleApiError(error, 'al sincronizar datos');
        }
    };

    const setActiveCompanyId = (id: number | null) => {
        setActiveCompanyIdState(id);
        localStorage.setItem('activeCompanyId', id ? id.toString() : '');
        if (id) {
            fetchDataForCompany(id);
        }
    };

    useEffect(() => {
        const checkSession = async () => {
            setIsLoading(true);
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                handleApiError(error, "al obtener la sesión");
                setIsLoading(false);
                return;
            }

            if (session?.user) {
                const { data: userProfile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*, company:companies(*)')
                    .eq('id', session.user.id)
                    .single();
                
                if (profileError) {
                     handleApiError(profileError, "al obtener el perfil de usuario");
                } else {
                    setCurrentUser(userProfile);
                    const ownedCompanies = await fetchCompanies(userProfile.id);
                     const storedCompanyId = localStorage.getItem('activeCompanyId');
                    if (storedCompanyId && ownedCompanies.some(c => c.id === Number(storedCompanyId))) {
                        setActiveCompanyId(Number(storedCompanyId));
                    } else if (ownedCompanies.length > 0) {
                        setActiveCompanyId(ownedCompanies[0].id);
                    }
                }
            } else {
                 setCurrentUser(null);
                 setCompanies([]);
                 setActiveCompanyId(null);
                 localStorage.removeItem('activeCompanyId');
            }
            setIsLoading(false);
        };

        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_OUT') {
                setCurrentUser(null);
                setCompanies([]);
                setActiveCompanyId(null);
                localStorage.removeItem('activeCompanyId');
            } else if (event === 'SIGNED_IN' && session?.user) {
                 const { data: userProfile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*, company:companies(*)')
                    .eq('id', session.user.id)
                    .single();
                if (userProfile) setCurrentUser(userProfile)
            }
        });

        return () => authListener?.subscription.unsubscribe();
    }, []);

    const fetchCompanies = async (userId: string) => {
        const { data, error } = await supabase.from('companies').select('*').eq('owner_id', userId);
        if (error) {
            handleApiError(error, 'al cargar empresas');
            return [];
        }
        setCompanies(data || []);
        return data || [];
    };

    const login = async (email: string, pass: string): Promise<User> => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) throw error;
        if (!data.user) throw new Error("Inicio de sesión fallido, no se encontró el usuario.");

        const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*, company:companies(*)')
            .eq('id', data.user.id)
            .single();

        if (profileError) throw profileError;
        if (!userProfile) throw new Error("No se encontró el perfil del usuario.");
        
        setCurrentUser(userProfile);
        const ownedCompanies = await fetchCompanies(userProfile.id);
        if (ownedCompanies.length > 0) {
            setActiveCompanyId(ownedCompanies[0].id);
        }
        return userProfile;
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) handleApiError(error, 'al cerrar sesión');
    };

    const sendPasswordResetEmail = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
    };

    const crudOperation = async <T extends { rut?: string }>(tableName: string, operation: 'insert' | 'update' | 'delete', id?: number | string, data?: Partial<T>) => {
        if (!activeCompanyId && !['companies', 'users', 'institutions'].includes(tableName)) {
            throw new Error("No hay empresa activa para realizar la operación.");
        }

        let finalData = data ? { ...data } : {};
        if (data && 'rut' in data && typeof data.rut === 'string') {
            finalData.rut = unformatRut(data.rut);
        }

        const table = supabase.from(tableName);
        let query;
        const isCompanyScoped = !['companies', 'users', 'institutions'].includes(tableName);

        switch(operation) {
            case 'insert':
                const insertData = isCompanyScoped ? { ...finalData, company_id: activeCompanyId } : finalData;
                query = table.insert(insertData);
                break;
            case 'update':
                query = table.update(finalData).eq('id', id as string);
                break;
            case 'delete':
                query = table.delete().eq('id', id as string);
                break;
            default: throw new Error('Operación CRUD no válida');
        }
        
        const { error } = await query;
        if (error) throw error;
        
        if (activeCompanyId) {
             await fetchDataForCompany(activeCompanyId);
        }
    };

    const addChartOfAccount = (data: ChartOfAccountData) => crudOperation('chart_of_accounts', 'insert', undefined, data);
    const updateChartOfAccount = (id: number, data: ChartOfAccountData) => crudOperation('chart_of_accounts', 'update', id, data);
    const deleteChartOfAccount = (id: number) => crudOperation('chart_of_accounts', 'delete', id);

    const addSubject = (data: SubjectData) => crudOperation('subjects', 'insert', undefined, data);
    const updateSubject = (id: number, data: SubjectData) => crudOperation('subjects', 'update', id, data);
    const deleteSubject = (id: number) => crudOperation('subjects', 'delete', id);

    const addCostCenter = (data: CostCenterData) => crudOperation('cost_centers', 'insert', undefined, data);
    const updateCostCenter = (id: number, data: CostCenterData) => crudOperation('cost_centers', 'update', id, data);
    const deleteCostCenter = (id: number) => crudOperation('cost_centers', 'delete', id);

    const addItem = (data: ItemData) => crudOperation('items', 'insert', undefined, data);
    const updateItem = (id: number, data: ItemData) => crudOperation('items', 'update', id, data);
    const deleteItem = (id: number) => crudOperation('items', 'delete', id);

    const addCompany = async (companyData: CompanyData) => {
        if (!currentUser) throw new Error("Usuario no autenticado.");
        const { data, error } = await supabase.from('companies').insert([{ ...companyData, owner_id: currentUser.id }]).select();
        if (error) throw error;
        if(data) {
            setCompanies(prev => [...prev, ...data]);
            if (!activeCompanyId) setActiveCompanyId(data[0].id);
        }
    };

    const updateCompany = async (id: number, companyData: Partial<Company>) => {
        await crudOperation('companies', 'update', id, companyData);
        setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...companyData } : c));
    };

    const deleteCompany = async (id: number | string) => {
        await crudOperation('companies', 'delete', id as number);
        setCompanies(prev => prev.filter(c => c.id !== id));
        if (activeCompanyId === id) setActiveCompanyId(companies[0]?.id || null);
    };

    const contextValue = {
        currentUser, companies, activeCompany, activeCompanyId, setActiveCompanyId, isLoading, notifications,
        chartOfAccounts, subjects, costCenters, items,
        login, logout, sendPasswordResetEmail, addNotification, handleApiError,
        addCompany, updateCompany, deleteCompany,
        addChartOfAccount, updateChartOfAccount, deleteChartOfAccount,
        addSubject, updateSubject, deleteSubject,
        addCostCenter, updateCostCenter, deleteCostCenter,
        addItem, updateItem, deleteItem,
    };

    return (
        <SessionContext.Provider value={contextValue}>
            {!isLoading && children}
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
