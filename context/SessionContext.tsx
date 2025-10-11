
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { Session, User, Company, Employee, Institution, MonthlyParameter, Payslip, Period, Notification } from '../types';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// El valor del contexto puede ser nulo si no hay sesión, o un objeto de sesión.
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
        // No relanzar el error aquí para no interrumpir flujos que ya manejan errores.
    }, [addNotification]);

    const logout = useCallback(async () => {
        const { error } = await supabase.auth.signOut();
        setSession(null); // Limpia la sesión localmente sin importar el resultado de Supabase
        if (error) handleApiError(error, 'cerrar sesión');
    }, [handleApiError]);

    const loadAllData = useCallback(async (authUser: SupabaseUser) => {
        setLoading(true);
        try {
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*, company:companies(*)') // Carga el perfil y la empresa asociada
                .eq('id', authUser.id)
                .single();

            if (profileError) throw profileError;
            if (!profileData) throw new Error('Perfil de usuario no encontrado.');

            const user: User = { ...authUser, ...profileData };

            // Si no hay company_id o el rol es de administrador, es una sesión de Admin
            if (!user.company_id || user.role?.includes('Admin')) {
                setSession({
                    user,
                    company: null, periods: [], employees: [], institutions: [], monthlyParameters: [], payslips: [],
                    activePeriod: '', setActivePeriod: () => {},
                    addEmployee: async () => {}, updateEmployee: async () => {}, deleteEmployee: async () => {},
                    addInstitution: async () => {}, updateInstitution: async () => {}, deleteInstitution: async () => {},
                    addMonthlyParameter: async () => {}, updateMonthlyParameter: async () => {}, deleteMonthlyParameter: async () => {},
                    addPayslip: async () => {}, updatePayslip: async () => {}, deletePayslip: async () => {},
                });
            } else {
                // Es un usuario de empresa, cargar todos los datos de la empresa
                const companyId = user.company_id;
                const [periodsRes, employeesRes, institutionsRes, monthlyParamsRes, payslipsRes] = await Promise.all([
                    supabase.from('periods').select('*').eq('company_id', companyId),
                    supabase.from('employees').select('*').eq('company_id', companyId),
                    supabase.from('institutions').select('*').eq('company_id', companyId),
                    supabase.from('monthly_parameters').select('*').eq('company_id', companyId),
                    supabase.from('payslips').select('*').eq('company_id', companyId),
                ]);

                const dataResponses = { periodsRes, employeesRes, institutionsRes, monthlyParamsRes, payslipsRes };
                for (const [, res] of Object.entries(dataResponses)) {
                    if (res.error) throw res.error;
                }

                const createCrud = <T extends { id: any }>(table: string) => ({
                    add: async (data: Omit<T, 'id' | 'company_id'>) => { await supabase.from(table).insert({ ...data, company_id: companyId }); },
                    update: async (data: T) => { await supabase.from(table).update(data).eq('id', data.id); },
                    delete: async (id: any) => { await supabase.from(table).delete().eq('id', id); },
                });

                setSession({
                    user,
                    company: profileData.company as Company,
                    periods: periodsRes.data || [],
                    employees: employeesRes.data || [],
                    institutions: institutionsRes.data || [],
                    monthlyParameters: monthlyParamsRes.data || [],
                    payslips: payslipsRes.data || [],
                    activePeriod: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
                    setActivePeriod: (period) => setSession(prev => prev ? { ...prev, activePeriod: period } : null),
                    addEmployee: createCrud<Employee>('employees').add, updateEmployee: createCrud<Employee>('employees').update, deleteEmployee: createCrud<Employee>('employees').delete,
                    addInstitution: createCrud<Institution>('institutions').add, updateInstitution: createCrud<Institution>('institutions').update, deleteInstitution: createCrud<Institution>('institutions').delete,
                    addMonthlyParameter: createCrud<MonthlyParameter>('monthly_parameters').add, updateMonthlyParameter: createCrud<MonthlyParameter>('monthly_parameters').update, deleteMonthlyParameter: createCrud<MonthlyParameter>('monthly_parameters').delete,
                    addPayslip: createCrud<Payslip>('payslips').add, updatePayslip: createCrud<Payslip>('payslips').update, deletePayslip: createCrud<Payslip>('payslips').delete,
                });
            }
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
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, supabaseSession) => {
            if (event === 'SIGNED_IN' && supabaseSession?.user) {
                await loadAllData(supabaseSession.user);
                addNotification({ type: 'success', message: 'Sesión iniciada.' });
            } else if (event === 'SIGNED_OUT') {
                setSession(null);
                setLoading(false);
            } else if (event === 'INITIAL_SESSION') {
                if (supabaseSession?.user) {
                    await loadAllData(supabaseSession.user);
                } else {
                    setLoading(false);
                }
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
