
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { Session, User, Company, Employee, Institution, MonthlyParameter, Payslip, Period, Notification } from '../types';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface SessionContextValue {
    session: Session | null;
    loading: boolean;
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    sendPasswordResetEmail: (email: string) => Promise<void>;
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
        const { error } = await supabase.auth.signOut();
        setSession(null);
        if (error) handleApiError(error, 'cerrar sesión');
    }, [handleApiError]);

    const loadAllData = useCallback(async (authUser: SupabaseUser) => {
        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (profileError) throw profileError;
            if (!profileData) throw new Error('Perfil de usuario no encontrado.');

            const user: User = { ...authUser, ...profileData };
            const companyId = user.company_id;

            if (!companyId || user.role?.includes('Admin')) {
                setSession({
                    user,
                    company: null, periods: [], employees: [], institutions: [], monthlyParameters: [], payslips: [],
                    activePeriod: '', setActivePeriod: () => {},
                    addEmployee: async () => {}, updateEmployee: async () => {}, deleteEmployee: async () => {},
                    addInstitution: async () => {}, updateInstitution: async () => {}, deleteInstitution: async () => {},
                    addMonthlyParameter: async () => {}, updateMonthlyParameter: async () => {}, deleteMonthlyParameter: async () => {},
                    addPayslip: async () => {}, updatePayslip: async () => {}, deletePayslip: async () => {},
                });
                return;
            }

            const { data: companyData, error: companyError } = await supabase
                .from('companies')
                .select('*')
                .eq('id', companyId)
                .single();

            if (companyError) throw companyError;
            if (!companyData) throw new Error(`Empresa con ID ${companyId} no encontrada.`);
            
            const dataSources = {
                periods: supabase.from('periods').select('*').eq('company_id', companyId),
                employees: supabase.from('employees').select('*').eq('company_id', companyId),
                institutions: supabase.from('institutions').select('*').eq('company_id', companyId),
                monthlyParameters: supabase.from('monthly_parameters').select('*').eq('company_id', companyId),
                payslips: supabase.from('payslips').select('*').eq('company_id', companyId),
            };

            const results = await Promise.all(Object.entries(dataSources).map(async ([key, query]) => {
                const { data, error } = await query;
                if (error) {
                    handleApiError(error, `cargando ${key}`);
                    return [key, []];
                }
                return [key, data];
            }));
            
            const loadedData = Object.fromEntries(results);

            const createCrud = <T extends { id: any }>(table: string) => ({
                add: async (data: Omit<T, 'id' | 'company_id'>) => { await supabase.from(table).insert({ ...data, company_id: companyId }); },
                update: async (data: T) => { await supabase.from(table).update(data).eq('id', data.id); },
                delete: async (id: any) => { await supabase.from(table).delete().eq('id', id); },
            });

            setSession({
                user,
                company: companyData as Company,
                periods: loadedData.periods || [],
                employees: loadedData.employees || [],
                institutions: loadedData.institutions || [],
                monthlyParameters: loadedData.monthlyParameters || [],
                payslips: loadedData.payslips || [],
                activePeriod: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
                setActivePeriod: (period) => setSession(prev => prev ? { ...prev, activePeriod: period } : null),
                addEmployee: createCrud<Employee>('employees').add, updateEmployee: createCrud<Employee>('employees').update, deleteEmployee: createCrud<Employee>('employees').delete,
                addInstitution: createCrud<Institution>('institutions').add, updateInstitution: createCrud<Institution>('institutions').update, deleteInstitution: createCrud<Institution>('institutions').delete,
                addMonthlyParameter: createCrud<MonthlyParameter>('monthly_parameters').add, updateMonthlyParameter: createCrud<MonthlyParameter>('monthly_parameters').update, deleteMonthlyParameter: createCrud<MonthlyParameter>('monthly_parameters').delete,
                addPayslip: createCrud<Payslip>('payslips').add, updatePayslip: createCrud<Payslip>('payslips').update, deletePayslip: createCrud<Payslip>('payslips').delete,
            });

        } catch (error) {
            handleApiError(error, "cargando los datos de la sesión");
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
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/update-password',
        });
        if (error) handleApiError(error, 'enviar correo de recuperación');
        else addNotification({ type: 'success', message: 'Correo de recuperación enviado.' });
    }, [handleApiError, addNotification]);

    useEffect(() => {
        setLoading(true);

        supabase.auth.getSession().then(({ data: { session: supabaseSession } }) => {
            if (supabaseSession?.user) {
                loadAllData(supabaseSession.user);
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, supabaseSession) => {
            if (event === 'SIGNED_IN' && supabaseSession?.user) {
                addNotification({ type: 'success', message: 'Sesión iniciada.' });
                await loadAllData(supabaseSession.user);
            } else if (event === 'SIGNED_OUT') {
                setSession(null);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, [loadAllData, addNotification]);

    const value: SessionContextValue = { session, loading, notifications, addNotification, login, logout, sendPasswordResetEmail };

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = (): SessionContextValue => {
    const context = useContext(SessionContext);
    if (!context) throw new Error('useSession must be used within a SessionProvider');
    return context;
};
