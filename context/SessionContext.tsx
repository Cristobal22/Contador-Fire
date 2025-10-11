
import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { unformatRut } from '../utils/format';
import type { 
    User, Company, CompanyData, ChartOfAccount, ChartOfAccountData, Subject, SubjectData, 
    CostCenter, CostCenterData, Item, ItemData, Employee, Institution, MonthlyParameter, 
    Voucher, Invoice, FeeInvoice, WarehouseMovement, Payslip, AccountGroup, FamilyAllowanceBracket, 
    Notification, UserData, IncomeTaxBracket, PeriodStatus, VoucherData, VoucherEntry 
} from '../types';


// --- TYPE DEFINITION ---
interface SessionContextType {
    currentUser: User | null;
    companies: Company[];
    activeCompany: Company | null;
    activeCompanyId: number | null;
    // ... other properties
    isLoading: boolean;
    notifications: (Notification & { id: number })[];
    // --- Data Arrays ---
    chartOfAccounts: ChartOfAccount[];
    subjects: Subject[];
    costCenters: CostCenter[];
    items: Item[];
    // ... other data arrays

    // --- Functions ---
    login: (email: string, pass: string) => Promise<User>;
    logout: () => void;
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    handleApiError: (error: any, context: string) => void;
    // ... other functions
    
    // --- CRUD Functions ---
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

    addVoucher: (voucherData: VoucherData) => Promise<void>;
    // ... other specific functions
}

// --- CONTEXT CREATION ---
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// ... (generatePeriods function)

// --- PROVIDER COMPONENT ---
export const SessionProvider = ({ children }: { children: ReactNode }) => {
    // --- STATE MANAGEMENT ---
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    // ... other states
    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState<(Notification & { id: number })[]>([]);
    const [activeCompanyId, setActiveCompanyIdState] = useState<number | null>(null);

    // --- MEMOIZED VALUES ---
    const activeCompany = useMemo(() => companies.find(c => c.id === activeCompanyId) || null, [companies, activeCompanyId]);

    // --- NOTIFICATION & ERROR HANDLING ---
    const addNotification = (notification: Omit<Notification, 'id'>) => {
        const newId = Date.now();
        setNotifications(prev => [...prev, { ...notification, id: newId }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== newId)), 5000);
    };

    const handleApiError = (error: any, context: string) => {
        console.error(`Error context: ${context}`, error);
        let message = error.message || `Error desconocido ${context}`;
        if (typeof message === 'string' && message.includes('violates foreign key constraint')) {
            message = `Error: No se puede eliminar. El registro está siendo utilizado por otros elementos (ej. comprobantes).`;
        }
        addNotification({ type: 'error', message });
    };

    // --- DATA FETCHING ---
    const fetchDataForCompany = async (companyId: number) => {
        if (!companyId) return;
        addNotification({ type: 'info', message: `Sincronizando datos...` });

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
                // ... other data fetches
            ]);
            addNotification({ type: 'success', message: 'Datos sincronizados.' });
        } catch (error) {
            handleApiError(error, 'al sincronizar datos de la empresa');
        }
    };

    // ... (useEffect for session checking)

    // --- AUTHENTICATION ---
    // ... (login, logout, etc.)

    // --- GENERIC CRUD REUSABLE FUNCTION ---
    const crudOperation = async <T extends { rut?: string }>(tableName: string, operation: 'insert' | 'update' | 'delete', id?: number, data?: T) => {
        if (!activeCompanyId && !['companies', 'users', 'institutions'].includes(tableName)) throw new Error("No hay empresa activa");

        let finalData = data ? { ...data } : {};
        if (finalData.rut) finalData.rut = unformatRut(finalData.rut); 

        const table = supabase.from(tableName);
        let query;

        switch(operation) {
            case 'insert':
                query = table.insert({ ...finalData, company_id: activeCompanyId });
                break;
            case 'update':
                query = table.update(finalData).eq('id', id);
                break;
            case 'delete':
                query = table.delete().eq('id', id);
                break;
        }
        
        const { error } = await query;
        if (error) throw error;
        
        // Refresh data for the current company
        await fetchDataForCompany(activeCompanyId as number);
    };

    // --- CRUD FUNCTION IMPLEMENTATIONS ---
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

    // ... (Specific implementations for Voucher, Company, User etc. remain as they have more complex logic)
    const addVoucher = async (voucherData: VoucherData) => { /* ... complex logic ... */ };
    // ... etc

    return (
        <SessionContext.Provider value={{
            currentUser, companies, activeCompany, activeCompanyId, isLoading, notifications, 
            chartOfAccounts, subjects, costCenters, items, /*...other data*/
            login, logout, addNotification, handleApiError, fetchDataForCompany, /*...other functions*/
            addChartOfAccount, updateChartOfAccount, deleteChartOfAccount,
            addSubject, updateSubject, deleteSubject,
            addCostCenter, updateCostCenter, deleteCostCenter,
            addItem, updateItem, deleteItem,
            addVoucher, /*...other specific functions*/
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