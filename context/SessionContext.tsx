
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
        throw error;
    }, [addNotification]);
    
    const logout = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        if (error) handleApiError(error, 'cerrar sesión');
        else setSession(null);
    }, [handleApiError]);

    const loadAllData = useCallback(async (authUser: SupabaseUser) => {
        setLoading(true);
        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (profileError || !profileData) {
                throw new Error('Perfil de usuario no encontrado.');
            }

            const user: User = { ...authUser, ...profileData };
            const companyId = user.company_id;

            // Si no hay company_id, es un admin o un usuario sin empresa asignada.
            if (!companyId) {
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

            // Si hay company_id, es un usuario de empresa. Cargar todos los datos.
            const [companyRes, periodsRes, employeesRes, institutionsRes, monthlyParamsRes, payslipsRes] = await Promise.all([
                supabase.from('companies').select('*').eq('id', companyId).single(),
                supabase.from('periods').select('*').eq('company_id', companyId),
                supabase.from('employees').select('*').eq('company_id', companyId),
                supabase.from('institutions').select('*').eq('company_id', companyId),
                supabase.from('monthly_parameters').select('*').eq('company_id', companyId),
                supabase.from('payslips').select('*').eq('company_id', companyId),
            ]);

            const responses = [companyRes, periodsRes, employeesRes, institutionsRes, monthlyParamsRes, payslipsRes];
            for (const res of responses) {
                if (res.error) throw res.error;
            }

            const createCrud = <T extends { id: any }>(table: string) => ({
                add: async (data: Omit<T, 'id' | 'company_id'>) => { await supabase.from(table).insert({ ...data, company_id: companyId }); },
                update: async (data: T) => { await supabase.from(table).update(data).eq('id', data.id); },
                delete: async (id: any) => { await supabase.from(table).delete().eq('id', id); },
            });

            setSession({
                user,
                company: companyRes.data as Company,
                periods: periodsRes.data as Period[] || [],
                employees: employeesRes.data as Employee[] || [],
                institutions: institutionsRes.data as Institution[] || [],
                monthlyParameters: monthlyParamsRes.data as MonthlyParameter[] || [],
                payslips: payslipsRes.data as Payslip[] || [],
                activePeriod: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
                setActivePeriod: (period) => setSession(prev => prev ? { ...prev, activePeriod: period } : null),
                addEmployee: createCrud<Employee>('employees').add,
                updateEmployee: createCrud<Employee>('employees').update,
                deleteEmployee: createCrud<Employee>('employees').delete,
                addInstitution: createCrud<Institution>('institutions').add,
                updateInstitution: createCrud<Institution>('institutions').update,
                deleteInstitution: createCrud<Institution>('institutions').delete,
                addMonthlyParameter: createCrud<MonthlyParameter>('monthly_parameters').add,
                updateMonthlyParameter: createCrud<MonthlyParameter>('monthly_parameters').update,
                deleteMonthlyParameter: createCrud<MonthlyParameter>('monthly_parameters').delete,
                addPayslip: createCrud<Payslip>('payslips').add,
                updatePayslip: createCrud<Payslip>('payslips').update,
                deletePayslip: createCrud<Payslip>('payslips').delete,
            });
        } catch (error) {
            handleApiError(error, "cargando los datos de la sesión");
            await logout(); // Forzamos el logout para evitar un estado inconsistente
        } finally {
            setLoading(false);
        }
    }, [handleApiError, logout]);
    
    const login = useCallback(async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) handleApiError(error, 'iniciar sesión');
    }, [handleApiError]);

    const sendPasswordResetEmail = useCallback(async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/update-password',
        });
        if (error) handleApiError(error, 'enviar correo de recuperación');
    }, [handleApiError]);

    useEffect(() => {
        const initialLoad = async () => {
            const { data: { session: supabaseSession } } = await supabase.auth.getSession();
            if (supabaseSession?.user) await loadAllData(supabaseSession.user);
            else setLoading(false);
        };
        initialLoad();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, supabaseSession) => {
            if (event === 'SIGNED_IN' && supabaseSession?.user) {
                await loadAllData(supabaseSession.user);
                addNotification({ type: 'success', message: 'Sesión iniciada.' });
            } else if (event === 'SIGNED_OUT') {
                setSession(null);
                setLoading(false);
            }
        });

        return () => { authListener.subscription.unsubscribe(); };
    }, [loadAllData, addNotification]);

    const value: SessionContextValue = { session, loading, notifications, addNotification, login, logout, sendPasswordResetEmail };

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = (): SessionContextValue => {
    const context = useContext(SessionContext);
    if (!context) throw new Error('useSession must be used within a SessionProvider');
    return context;
};
