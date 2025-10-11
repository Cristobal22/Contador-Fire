
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { Session, User, Company, Account, Voucher, Employee, Institution, MonthlyParameter, Payslip, Period, Notification, CostCenter } from '../types';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const defaultSession: Partial<Session> = {
    company: null,
    periods: [],
    accounts: [],
    vouchers: [],
    employees: [],
    institutions: [],
    monthlyParameters: [],
    payslips: [],
    costCenters: [],
    activePeriod: '',
};

interface SessionContextValue {
    session: Session | null;
    loading: boolean;
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    sendPasswordResetEmail: (email: string) => Promise<void>;
    handleApiError: (error: any, context: string) => void;
    switchCompany: (companyId: number) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
        const newNotification = { ...notification, id: Date.now() };
        setNotifications(prev => [...prev, newNotification]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== newNotification.id)), 5000);
    }, []);

    const handleApiError = useCallback((error: any, context: string) => {
        console.error(`Error ${context}:`, error);
        const message = (error instanceof Error) ? error.message : `Error desconocido al ${context}.`;
        addNotification({ type: 'error', message });
    }, [addNotification]);

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setSession(null);
    }, []);

    const switchCompany = useCallback(async (companyId: number) => {
        if (!session?.user) return;
        setLoading(true);
        try {
            const { data: companyData, error: companyError } = await supabase.from('companies').select('*').eq('id', companyId).single();
            if (companyError) throw companyError;

            const dataSources = {
                periods: supabase.from('periods').select('*').eq('company_id', companyId),
                accounts: supabase.from('accounts').select('*').eq('company_id', companyId),
                vouchers: supabase.from('vouchers').select('*, entries:voucher_entries(*)').eq('company_id', companyId),
                employees: supabase.from('employees').select('*').eq('company_id', companyId),
                institutions: supabase.from('institutions').select('*').eq('company_id', companyId),
                monthlyParameters: supabase.from('monthly_parameters').select('*').eq('company_id', companyId),
                payslips: supabase.from('payslips').select('*').eq('company_id', companyId),
                costCenters: supabase.from('cost_centers').select('*').eq('company_id', companyId),
            };

            const results = await Promise.all(Object.entries(dataSources).map(async ([key, query]) => {
                const { data, error } = await query;
                if (error) handleApiError(error, `cargando ${key}`);
                return [key, data || []];
            }));
            
            const loadedData = Object.fromEntries(results);

            const createCrud = <T extends { id: any }>(table: string) => ({
                add: async (data: Omit<T, 'id'>) => { 
                    const { error } = await supabase.from(table).insert({ ...data, company_id: companyId });
                    if (error) handleApiError(error, `agregando a ${table}`); else await switchCompany(companyId);
                },
                update: async (data: T) => { 
                    const { error } = await supabase.from(table).update(data).eq('id', data.id);
                    if (error) handleApiError(error, `actualizando en ${table}`); else await switchCompany(companyId);
                },
                delete: async (id: any) => { 
                    const { error } = await supabase.from(table).delete().eq('id', id);
                    if (error) handleApiError(error, `eliminando de ${table}`); else await switchCompany(companyId);
                },
            });

            setSession(prev => ({
                ...prev,
                ...defaultSession,
                company: companyData as Company,
                ...loadedData,
                user: prev!.user,
                setActivePeriod: (period) => setSession(p => p ? { ...p, activePeriod: period } : null),
                addAccount: createCrud<Account>('accounts').add, updateAccount: createCrud<Account>('accounts').update, deleteAccount: createCrud<Account>('accounts').delete,
                addVoucher: createCrud<Voucher>('vouchers').add, updateVoucher: createCrud<Voucher>('vouchers').update, deleteVoucher: createCrud<Voucher>('vouchers').delete,
                addEmployee: createCrud<Employee>('employees').add, updateEmployee: createCrud<Employee>('employees').update, deleteEmployee: createCrud<Employee>('employees').delete,
                addInstitution: createCrud<Institution>('institutions').add, updateInstitution: createCrud<Institution>('institutions').update, deleteInstitution: createCrud<Institution>('institutions').delete,
                addMonthlyParameter: createCrud<MonthlyParameter>('monthly_parameters').add, updateMonthlyParameter: createCrud<MonthlyParameter>('monthly_parameters').update, deleteMonthlyParameter: createCrud<MonthlyParameter>('monthly_parameters').delete,
                addPayslip: createCrud<Payslip>('payslips').add, updatePayslip: createCrud<Payslip>('payslips').update, deletePayslip: createCrud<Payslip>('payslips').delete,
                addCostCenter: createCrud<CostCenter>('cost_centers').add, updateCostCenter: createCrud<CostCenter>('cost_centers').update, deleteCostCenter: createCrud<CostCenter>('cost_centers').delete,
            } as Session));

        } catch (error) {
            handleApiError(error, "cambiando de empresa");
        } finally {
            setLoading(false);
        }
    }, [session?.user, handleApiError]);

    const loadUser = useCallback(async (authUser: SupabaseUser) => {
        setLoading(true);
        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select(`
                    *, 
                    companies:user_companies!inner(company:companies!inner(*))
                `)
                .eq('id', authUser.id)
                .single();

            if (profileError) throw profileError;
            
            const user: User = { 
                ...authUser, 
                ...profileData, 
                companies: profileData.companies.map((c: any) => c.company) 
            };
            setSession({ ...defaultSession, user } as Session);

        } catch (error) {
            handleApiError(error, "cargando datos de usuario");
            await logout();
        } finally {
            setLoading(false);
        }
    }, [handleApiError, logout]);
    
    const login = useCallback(async (email: string, password: string) => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            handleApiError(error, 'iniciar sesión');
            setLoading(false);
        }
    }, [handleApiError]);

    const sendPasswordResetEmail = useCallback(async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/update-password` });
        if (error) handleApiError(error, 'enviar correo de recuperación');
        else addNotification({ type: 'success', message: 'Correo de recuperación enviado.' });
    }, [handleApiError, addNotification]);

    useEffect(() => {
        const bootstrapSession = async () => {
            setLoading(true);
            const { data: { session: supabaseSession } } = await supabase.auth.getSession();
            if (supabaseSession?.user) {
                await loadUser(supabaseSession.user);
            } else {
                setSession(null);
            }
            setLoading(false);
        };
        bootstrapSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, supabaseSession) => {
            if (event === 'SIGNED_IN' && supabaseSession?.user) {
                addNotification({ type: 'success', message: 'Sesión iniciada.' });
                await loadUser(supabaseSession.user);
            } else if (event === 'SIGNED_OUT') {
                setSession(null);
            }
        });

        return () => { subscription?.unsubscribe(); };
    }, [loadUser, addNotification]);

    const value: SessionContextValue = { session, loading, notifications, addNotification, login, logout, sendPasswordResetEmail, handleApiError, switchCompany };

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = (): SessionContextValue => {
    const context = useContext(SessionContext);
    if (!context) throw new Error('useSession must be used within a SessionProvider');
    return context;
};
