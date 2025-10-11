
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import type { Session, User, Company, Employee, Institution, MonthlyParameter, Payslip, Period, Notification } from '../types';

const SessionContext = createContext<Session | null>(null);

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
        addNotification({ type: 'error', message: `Error ${context}.` });
    }, [addNotification]);

    const loadAllData = useCallback(async (user: User) => {
        try {
            const { data: profile, error: profileError } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
            if (profileError || !profile?.company_id) throw new Error('Perfil de usuario o empresa no encontrado.');
            const companyId = profile.company_id;

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
            
            const createCrud = <T extends { id: number }>(table: string) => ({
                add: async (data: Omit<T, 'id' | 'company_id'>) => {
                    const { error } = await supabase.from(table).insert({ ...data, company_id: companyId });
                    if (error) handleApiError(error, `creando en ${table}`);
                },
                update: async (data: T) => {
                    const { error } = await supabase.from(table).update(data).eq('id', data.id);
                    if (error) handleApiError(error, `actualizando en ${table}`);
                },
                delete: async (id: number) => {
                    const { error } = await supabase.from(table).delete().eq('id', id);
                    if (error) handleApiError(error, `eliminando en ${table}`);
                },
            });

            const newSession: Partial<Session> = {
                user,
                company: companyRes.data as Company,
                periods: periodsRes.data as Period[] || [],
                employees: employeesRes.data as Employee[] || [],
                institutions: institutionsRes.data as Institution[] || [],
                monthlyParameters: monthlyParamsRes.data as MonthlyParameter[] || [],
                payslips: payslipsRes.data as Payslip[] || [],
                activePeriod: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
                addNotification,
                handleApiError,
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
                setActivePeriod: (period) => setSession(prev => prev ? { ...prev, activePeriod: period } : null),
                logout: async () => {
                    await supabase.auth.signOut();
                    setSession(null);
                },
            };

            setSession(newSession as Session);

        } catch (error) {
            handleApiError(error, "cargando los datos de la sesión");
            await supabase.auth.signOut();
            setSession(null);
        } finally {
            setLoading(false);
        }
    }, [handleApiError, addNotification]);

    useEffect(() => {
        setLoading(true);
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, supabaseSession) => {
            const user = supabaseSession?.user;
            if (user) {
                loadAllData(user as User);
            } else {
                setSession(null);
                setLoading(false);
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [loadAllData]);

    // Real-time subscriptions
    useEffect(() => {
        if (!session?.company?.id) return;
        const channel = supabase.channel('db-changes');
        const tables = ['employees', 'institutions', 'monthly_parameters', 'payslips', 'periods'];
        
        tables.forEach(table => {
            channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `company_id=eq.${session.company.id}` }, 
            () => loadAllData(session.user) // Recargar todo por simplicidad
            );
        });

        channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [session?.company?.id, session?.user, loadAllData]);

    const value = { ...session, loading, notifications, addNotification };

    return <SessionContext.Provider value={value as Session}>{children}</SessionContext.Provider>;
};

export const useSession = (): Session => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};
