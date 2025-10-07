import React, { useState, useContext, createContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import type {
    Company, CompanyData, ChartOfAccount, ChartOfAccountData, Subject, SubjectData, Item, ItemData,
    CostCenter, CostCenterData, Employee, EmployeeData, Institution, InstitutionData, MonthlyParameter,
    MonthlyParameterData, WarehouseMovement, WarehouseMovementData, Payslip, PayslipData, Voucher,
    VoucherData, Invoice, InvoiceData, FeeInvoice, FeeInvoiceData, Period, SessionContextType, Notification, PayslipDeduction,
    FamilyAllowanceBracket, FamilyAllowanceBracketData, IncomeTaxBracket, User, UserData, AccountGroup, AccountGroupData,
    ParsedPreviredRow, VoucherEntry
} from '../types';
import { initialPeriods } from '../data'; // Periods are static for now

const SessionContext = createContext<SessionContextType | null>(null);

// This function is kept as it's pure business logic, independent of the backend.
const calculatePayslipDetails = (
    employee: Employee,
    period: string,
    institutions: Institution[],
    monthlyParameters: MonthlyParameter[],
    incomeTaxBrackets: IncomeTaxBracket[]
): Omit<Payslip, 'id' | 'employeeId' | 'period'> => {
    
    const afp = institutions.find(i => i.id === employee.afpId);
    if (!afp || afp.type !== 'AFP') throw new Error('AFP no válida.');

    const topeImponibleParam = monthlyParameters.find(p => p.period === period && p.name === 'Tope Imponible');
    if (!topeImponibleParam) throw new Error(`Parámetro 'Tope Imponible' no encontrado para el período ${period}.`);
    
    const utmParam = monthlyParameters.find(p => p.period === period && p.name === 'UTM');
    if (!utmParam) throw new Error(`Parámetro 'UTM' no encontrado para el período ${period}.`);

    const grossPay = employee.baseSalary;
    const imponible = Math.min(grossPay, topeImponibleParam.value);
    const deductions: PayslipDeduction[] = [];

    const afpRate = 10 + (afp.rate || 0);
    const afpAmount = Math.round(imponible * (afpRate / 100));
    deductions.push({ name: `Cotización AFP ${afp.name}`, amount: afpAmount });

    const healthAmount = Math.round(imponible * 0.07);
    deductions.push({ name: 'Cotización Salud', amount: healthAmount });

    const unemploymentAmount = Math.round(imponible * 0.006);
    deductions.push({ name: 'Seguro de Cesantía', amount: unemploymentAmount });

    const totalPrevisionalDeductions = afpAmount + healthAmount + unemploymentAmount;
    const taxableIncome = grossPay - totalPrevisionalDeductions;
    
    let incomeTax = 0;
    if (taxableIncome > 0) {
        const taxBracketsForPeriod = incomeTaxBrackets.filter(b => b.period === period);
        const taxableIncomeInUTM = taxableIncome / utmParam.value;

        const applicableBracket = taxBracketsForPeriod.find(b => 
            taxableIncomeInUTM > b.fromUTM && (b.toUTM === null || taxableIncomeInUTM <= b.toUTM)
        );

        if (applicableBracket) {
            const taxInUTM = (taxableIncomeInUTM * applicableBracket.factor) - applicableBracket.rebateUTM;
            incomeTax = Math.round(Math.max(0, taxInUTM * utmParam.value));
            if (incomeTax > 0) {
                deductions.push({ name: 'Impuesto Único', amount: incomeTax });
            }
        }
    }

    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const netPay = grossPay - totalDeductions;

    const breakdown = {
        baseSalary: employee.baseSalary,
        daysWorked: 30, // Default
        gratification: 0,
        otherTaxable: [],
        mealAllowance: 0,
        transportAllowance: 0,
        otherNonTaxable: [],
        advances: 0,
        otherDeductions: [],
    };
    
    return { grossPay, taxableIncome, incomeTax, deductions, netPay, breakdown };
};


export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Auth and loading State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Data State Hooks
    const [companies, setCompanies] = useState<Company[]>([]);
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [accountGroups, setAccountGroups] = useState<AccountGroup[]>([]);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [monthlyParameters, setMonthlyParameters] = useState<MonthlyParameter[]>([]);
    const [familyAllowanceBrackets, setFamilyAllowanceBrackets] = useState<FamilyAllowanceBracket[]>([]);
    const [incomeTaxBrackets, setIncomeTaxBrackets] = useState<IncomeTaxBracket[]>([]);
    const [warehouseMovements, setWarehouseMovements] = useState<WarehouseMovement[]>([]);
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [feeInvoices, setFeeInvoices] = useState<FeeInvoice[]>([]);
    
    const [activeCompanyId, setActiveCompanyId] = useState<number | null>(null);
    const [periods] = useState<Period[]>(initialPeriods);
    const [activePeriod, setActivePeriod] = useState<string>(periods[0]?.value || '');
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = (notification: Omit<Notification, 'id'>) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { ...notification, id }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
    };

    // --- Centralized API Error Handling ---
    const handleApiError = (error: any, context: string) => {
        console.error(`API error (${context}):`, error);
        let message = `Error ${context}.`;
        
        if (error && typeof error === 'object' && 'message' in error) {
            // Handle Supabase PostgrestError
            if ('code' in error && typeof error.code === 'string') {
                switch (error.code) {
                    case '23505': // unique_violation
                        message = `Error ${context}: el registro ya existe o un valor único está duplicado.`;
                        break;
                    case '23503': // foreign_key_violation
                        message = `Error ${context}: no se puede realizar la operación porque el registro está siendo utilizado por otros elementos.`;
                        break;
                    case '22P02': // invalid_text_representation
                         message = `Error ${context}: uno de los campos tiene un formato inválido.`;
                         break;
                    case 'PGRST116': // Not found
                         message = `Error ${context}: el registro solicitado no fue encontrado.`;
                         break;
                    default:
                         message = `Error ${context}: ${error.message}`;
                         break;
                }
            } else {
                 // Handle other Supabase errors (e.g., AuthError)
                 message = `Error ${context}: ${error.message}`;
            }
        } else if (error instanceof Error) {
            if (error.message.includes('Failed to fetch')) {
                message = `Error de red. Verifique su conexión a internet e intente de nuevo.`;
            } else {
                message = `Error inesperado ${context}. Por favor, intente de nuevo.`;
            }
        }

        addNotification({ type: 'error', message });
    };

    // --- Data Fetching ---
    const fetchData = async () => {
        const dataSources = [
            { name: 'companies', setter: setCompanies, label: 'Empresas' },
            { name: 'accounts', setter: setAccounts, label: 'Cuentas' },
            { name: 'account_groups', setter: setAccountGroups, label: 'Grupos de Cuentas' },
            { name: 'subjects', setter: setSubjects, label: 'Sujetos' },
            { name: 'items', setter: setItems, label: 'Ítems' },
            { name: 'cost_centers', setter: setCostCenters, label: 'Centros de Costo' },
            { name: 'employees', setter: setEmployees, label: 'Empleados' },
            { name: 'users', setter: setUsers, label: 'Usuarios' },
            { name: 'institutions', setter: setInstitutions, label: 'Instituciones' },
            { name: 'monthly_parameters', setter: setMonthlyParameters, label: 'Parámetros Mensuales' },
            { name: 'family_allowance_brackets', setter: setFamilyAllowanceBrackets, label: 'Tramos Asig. Familiar' },
            { name: 'income_tax_brackets', setter: setIncomeTaxBrackets, label: 'Tramos Impuesto Único' },
            { name: 'vouchers', setter: setVouchers, label: 'Comprobantes' },
            { name: 'invoices', setter: setInvoices, label: 'Facturas' },
            { name: 'fee_invoices', setter: setFeeInvoices, label: 'Boletas de Honorarios' },
            { name: 'warehouse_movements', setter: setWarehouseMovements, label: 'Movimientos de Bodega' },
            { name: 'payslips', setter: setPayslips, label: 'Liquidaciones' },
        ];

        const promises = dataSources.map(ds => supabase.from(ds.name).select('*'));

        const results = await Promise.allSettled(promises);
        
        let hasErrors = false;
        results.forEach((result, index) => {
            const source = dataSources[index];
            if (result.status === 'fulfilled') {
                const response = result.value;
                if (response.error) {
                    handleApiError(response.error, `al cargar ${source.label}`);
                    hasErrors = true;
                } else {
                    source.setter(response.data || []);
                }
            } else {
                handleApiError(result.reason, `de red al cargar ${source.label}`);
                hasErrors = true;
            }
        });

        if (hasErrors) {
             console.error("One or more data fetching operations failed.");
        }
    };

    // --- Auth Session Management ---
    useEffect(() => {
        const checkSession = async () => {
            setIsLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: userProfile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
                if (userProfile) {
                    setCurrentUser(userProfile);
                    await fetchData();
                }
            }
            setIsLoading(false);
        };
        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                const { data: userProfile } = await supabase.from('users').select('*').eq('id', session.user.id).single();
                setCurrentUser(userProfile || null);
                if (userProfile) await fetchData();
            } else {
                setCurrentUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // --- Auth Actions ---
    const login = async (email: string, password: string): Promise<User> => {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        if (!authData.user) throw new Error('Usuario no encontrado.');

        const { data: userProfileData, error: profileError } = await supabase.from('users').select('*').eq('id', authData.user.id).single();
        if (profileError) throw profileError;
        if (!userProfileData) throw new Error('Perfil de usuario no encontrado.');
        
        const loggedInUser: User = {
            id: userProfileData.id,
            name: userProfileData.name || userProfileData.email || 'Usuario sin nombre',
            email: userProfileData.email,
            role: userProfileData.role,
            company_limit: userProfileData.company_limit,
            status: userProfileData.status,
        };
        
        setCurrentUser(loggedInUser);
        
        if (loggedInUser.role === 'Accountant') {
            const { data: userCompanies } = await supabase.from('companies').select('id').eq('owner_id', loggedInUser.id);
            if (userCompanies && userCompanies.length > 0) {
                setActiveCompanyId(userCompanies[0].id);
            }
        }
        return loggedInUser;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setCurrentUser(null);
        setActiveCompanyId(null);
        setCompanies([]); setAccounts([]); setAccountGroups([]); setSubjects([]); setItems([]); setCostCenters([]);
        setEmployees([]); setUsers([]); setInstitutions([]); setMonthlyParameters([]); setFamilyAllowanceBrackets([]);
        setIncomeTaxBrackets([]); setWarehouseMovements([]); setPayslips([]); setVouchers([]); setInvoices([]); setFeeInvoices([]);
    };
    
    const sendPasswordResetEmail = async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) {
            console.error("Error sending password reset email:", error);
            throw new Error('Error al enviar el correo de restablecimiento.');
        }
    };

    // --- Helper Functions ---
    const findAccountIdByName = (name: string, allAccounts: ChartOfAccount[]): number => {
        const account = allAccounts.find(a => a.name.toUpperCase() === name.toUpperCase());
        if (!account) throw new Error(`La cuenta contable "${name}" no fue encontrada.`);
        return account.id;
    };

    const makeVoucherEntries = (entries: Omit<VoucherEntry, 'id'>[]): VoucherEntry[] => 
        entries.map((e, i) => ({ ...e, id: Date.now() + i + Math.random() }));

    // --- CRUD Actions ---
    const createCrud = <T extends { id: number }, D>(tableName: string, setter: React.Dispatch<React.SetStateAction<T[]>>) => {
        const fetchTable = async () => {
            const { data, error } = await supabase.from(tableName).select('*');
            if (error) throw error;
            setter(data as T[]);
        };
        return {
            add: async (itemData: D) => {
                const { error } = await supabase.from(tableName).insert([itemData]);
                if (error) throw error;
                await fetchTable();
            },
            update: async (updatedItem: T) => {
                const { error } = await supabase.from(tableName).update(updatedItem).eq('id', updatedItem.id);
                if (error) throw error;
                await fetchTable();
            },
            delete: async (id: number) => {
                const { error } = await supabase.from(tableName).delete().eq('id', id);
                if (error) throw error;
                await fetchTable();
            },
        };
    };

    const companyActions = {
        add: async (data: CompanyData) => {
            if (!currentUser) throw new Error("Usuario no autenticado.");
            const { error } = await supabase.from('companies').insert([{ ...data, owner_id: currentUser.id }]);
            if (error) throw error;
            const { data: companiesData, error: fetchError } = await supabase.from('companies').select('*');
            if (fetchError) throw fetchError;
            setCompanies(companiesData || []);
        },
        update: async (updated: Company) => {
            const { error } = await supabase.from('companies').update(updated).eq('id', updated.id);
            if (error) throw error;
             const { data: companiesData, error: fetchError } = await supabase.from('companies').select('*');
            if (fetchError) throw fetchError;
            setCompanies(companiesData || []);
        },
        delete: async (id: number) => {
            const { error } = await supabase.from('companies').delete().eq('id', id);
            if (error) throw error;
            const { data: companiesData, error: fetchError } = await supabase.from('companies').select('*');
            if (fetchError) throw fetchError;
            setCompanies(companiesData || []);
        },
    };

    const accountCrud = createCrud<ChartOfAccount, ChartOfAccountData>('accounts', setAccounts);
    const accountGroupCrud = createCrud<AccountGroup, AccountGroupData>('account_groups', setAccountGroups);
    const subjectCrud = createCrud<Subject, SubjectData>('subjects', setSubjects);
    const itemCrud = createCrud<Item, ItemData>('items', setItems);
    const costCenterCrud = createCrud<CostCenter, CostCenterData>('cost_centers', setCostCenters);
    const employeeCrud = createCrud<Employee, EmployeeData>('employees', setEmployees);
    const institutionCrud = createCrud<Institution, InstitutionData>('institutions', setInstitutions);
    const monthlyParameterCrud = createCrud<MonthlyParameter, MonthlyParameterData>('monthly_parameters', setMonthlyParameters);
    const familyAllowanceBracketCrud = createCrud<FamilyAllowanceBracket, FamilyAllowanceBracketData>('family_allowance_brackets', setFamilyAllowanceBrackets);
    
    // Complex Actions
    const addVoucher = async (voucherData: VoucherData) => {
        const { data, error } = await supabase.from('vouchers').insert([voucherData]).select();
        if (error) throw error;
        if (data) setVouchers(prev => [...prev, ...data]);
    };
    const updateVoucher = async (updatedVoucher: Voucher) => {
        const { data, error } = await supabase.from('vouchers').update(updatedVoucher).eq('id', updatedVoucher.id).select().single();
        if (error) throw error;
        if (data) setVouchers(prev => prev.map(v => v.id === data.id ? data : v));
    };
    const deleteVoucher = async (id: number) => {
        const { error } = await supabase.from('vouchers').delete().eq('id', id);
        if (error) throw error;
        setVouchers(prev => prev.filter(v => v.id !== id));
    };

    const addInvoice = async (invoiceData: InvoiceData) => {
        const { data: newInvoice, error: invoiceError } = await supabase.from('invoices').insert([invoiceData]).select().single();
        if (invoiceError) throw invoiceError;
        if (!newInvoice) throw new Error('Falló la creación de la factura.');
    
        const { type, net, tax, total } = invoiceData;
        let voucherData: VoucherData;
        try {
            if (type === 'Venta') {
                voucherData = {
                    date: invoiceData.date, description: `Venta Factura #${invoiceData.invoiceNumber}`,
                    entries: makeVoucherEntries([
                        { accountId: findAccountIdByName('CLIENTES', accounts), debit: total, credit: 0 },
                        { accountId: findAccountIdByName('VENTAS Y SERVICIOS AFECTOS', accounts), debit: 0, credit: net },
                        { accountId: findAccountIdByName('IVA DEBITO FISCAL', accounts), debit: 0, credit: tax },
                    ])
                };
            } else {
                voucherData = {
                    date: invoiceData.date, description: `Compra Factura #${invoiceData.invoiceNumber}`,
                    entries: makeVoucherEntries([
                        { accountId: findAccountIdByName('GASTOS GENERALES', accounts), debit: net, credit: 0 },
                        { accountId: findAccountIdByName('IVA CREDITO FISCAL', accounts), debit: tax, credit: 0 },
                        { accountId: findAccountIdByName('PROVEEDORES', accounts), debit: 0, credit: total },
                    ])
                };
            }
            await addVoucher(voucherData);
        } catch (error) {
            console.error("Error al crear comprobante para factura:", error);
            addNotification({type: 'error', message: `Factura creada, pero falló la generación del comprobante: ${(error as Error).message}`});
        }
        const { data: updatedInvoices } = await supabase.from('invoices').select('*');
        setInvoices(updatedInvoices || []);
    };
    
    const addBatchInvoicesAndVouchers = async (invoicesData: InvoiceData[]) => {
        if (invoicesData.length === 0) return;
        const findAccId = (name: string) => findAccountIdByName(name, accounts);
    
        const vouchersToInsert: VoucherData[] = invoicesData.map(invoice => {
            const { type, net, tax, total } = invoice;
            if (type === 'Venta') {
                return {
                    date: invoice.date, description: `Venta Factura #${invoice.invoiceNumber}`,
                    entries: makeVoucherEntries([
                        { accountId: findAccId('CLIENTES'), debit: total, credit: 0 },
                        { accountId: findAccId('VENTAS Y SERVICIOS AFECTOS'), debit: 0, credit: net },
                        { accountId: findAccId('IVA DEBITO FISCAL'), debit: 0, credit: tax },
                    ])
                };
            } else {
                 return {
                    date: invoice.date, description: `Compra Factura #${invoice.invoiceNumber}`,
                    entries: makeVoucherEntries([
                        { accountId: findAccId('GASTOS GENERALES'), debit: net, credit: 0 },
                        { accountId: findAccId('IVA CREDITO FISCAL'), debit: tax, credit: 0 },
                        { accountId: findAccId('PROVEEDORES'), debit: 0, credit: total },
                    ])
                };
            }
        });
    
        const { error: invoiceError } = await supabase.from('invoices').insert(invoicesData);
        if (invoiceError) throw invoiceError;
    
        const { error: voucherError } = await supabase.from('vouchers').insert(vouchersToInsert);
        if (voucherError) throw voucherError;
    
        const [{ data: newInvoices }, { data: newVouchers }] = await Promise.all([
            supabase.from('invoices').select('*'),
            supabase.from('vouchers').select('*')
        ]);
        setInvoices(newInvoices || []);
        setVouchers(newVouchers || []);
    };
    
    const addFeeInvoice = async (feeInvoiceData: FeeInvoiceData) => {
        const { data: newFeeInvoice, error: feeError } = await supabase.from('fee_invoices').insert([feeInvoiceData]).select().single();
        if (feeError) throw feeError;
        if (!newFeeInvoice) throw new Error('Falló la creación de la boleta de honorarios.');
    
        const { grossAmount, taxRetention, netAmount } = feeInvoiceData;
        try {
            const voucherData: VoucherData = {
                date: feeInvoiceData.date, description: `Honorarios Boleta #${feeInvoiceData.invoiceNumber}`,
                entries: makeVoucherEntries([
                    { accountId: findAccountIdByName('HONORARIOS', accounts), debit: grossAmount, credit: 0 },
                    { accountId: findAccountIdByName('RETENCION IMPUESTO HONORARIOS', accounts), debit: 0, credit: taxRetention },
                    { accountId: findAccountIdByName('HONORARIOS POR PAGAR', accounts), debit: 0, credit: netAmount },
                ])
            };
            await addVoucher(voucherData);
        } catch (error) {
            console.error("Error al crear comprobante para boleta:", error);
            addNotification({type: 'error', message: `Boleta creada, pero falló la generación del comprobante: ${(error as Error).message}`});
        }
        const { data: updatedFeeInvoices } = await supabase.from('fee_invoices').select('*');
        setFeeInvoices(updatedFeeInvoices || []);
    };

    const addPayslip = async (payslipData: PayslipData) => {
        const { employeeId, period } = payslipData;
        const employee = employees.find(e => e.id === employeeId);
        if (!employee) throw new Error('Empleado no encontrado.');

        const payslipDetails = calculatePayslipDetails(employee, period, institutions, monthlyParameters, incomeTaxBrackets);
        const newPayslip = { employeeId, period, ...payslipDetails };

        const { error } = await supabase.from('payslips').insert([newPayslip]);
        if (error) throw error;
        const { data } = await supabase.from('payslips').select('*');
        setPayslips(data || []);
    };

    const updatePayslip = async (updatedPayslip: Payslip) => {
        const { data, error } = await supabase.from('payslips').update(updatedPayslip).eq('id', updatedPayslip.id).select().single();
        if (error) throw error;
        if (data) setPayslips(prev => prev.map(p => p.id === data.id ? data : p));
    };

    const deletePayslip = async (id: number) => {
        const { error } = await supabase.from('payslips').delete().eq('id', id);
        if (error) throw error;
        setPayslips(prev => prev.filter(p => p.id !== id));
    };


    const centralizePayslips = async (period: string) => {
        const existing = vouchers.find(v => v.description === `Centralización Remuneraciones ${period}`);
        if (existing) throw new Error(`Ya existe una centralización para el período ${period} (Comprobante #${existing.id}).`);

        const payslipsForPeriod = payslips.filter(p => p.period === period);
        if (payslipsForPeriod.length === 0) throw new Error(`No hay liquidaciones para centralizar en el período ${period}.`);

        const getDeduction = (deductions: PayslipDeduction[], name: string) =>
            deductions.find(d => d.name.toLowerCase().includes(name.toLowerCase()))?.amount || 0;
            
        const totals = payslipsForPeriod.reduce((acc, p) => {
            acc.grossPay += p.grossPay;
            acc.netPay += p.netPay;
            acc.incomeTax += p.incomeTax;
            acc.afp += getDeduction(p.deductions, 'afp');
            acc.health += getDeduction(p.deductions, 'salud');
            acc.unemployment += getDeduction(p.deductions, 'cesantía');
            return acc;
        }, { grossPay: 0, netPay: 0, incomeTax: 0, afp: 0, health: 0, unemployment: 0 });

        const totalPrevisionalDeductions = totals.afp + totals.health + totals.unemployment;
        
        const voucherData: VoucherData = {
            date: `${period}-${new Date(parseInt(period.split('-')[0]), parseInt(period.split('-')[1]), 0).getDate()}`, // End of month
            description: `Centralización Remuneraciones ${period}`,
            entries: makeVoucherEntries([
                { accountId: findAccountIdByName('GASTOS DE SUELDOS Y SALARIOS', accounts), debit: totals.grossPay, credit: 0 },
                { accountId: findAccountIdByName('SUELDOS POR PAGAR', accounts), debit: 0, credit: totals.netPay },
                { accountId: findAccountIdByName('IMPOSIONES POR PAGAR', accounts), debit: 0, credit: totalPrevisionalDeductions },
                { accountId: findAccountIdByName('IMPUESTO UNICO TRABAJADORES', accounts), debit: 0, credit: totals.incomeTax },
            ].filter(e => e.debit > 0 || e.credit > 0))
        };
        
        const totalDebit = voucherData.entries.reduce((sum, e) => sum + e.debit, 0);
        const totalCredit = voucherData.entries.reduce((sum, e) => sum + e.credit, 0);

        if (Math.round(totalDebit) !== Math.round(totalCredit)) {
            console.error('El comprobante de centralización está descuadrado:', {totalDebit, totalCredit, voucherData});
            throw new Error(`Balance descuadrado por ${Math.abs(totalDebit - totalCredit)}. Revise los cálculos.`);
        }
        await addVoucher(voucherData);
    };

    const addWarehouseMovement = async (data: WarehouseMovementData) => {
        const { error } = await supabase.from('warehouse_movements').insert([data]);
        if (error) throw error;
        const { data: movements } = await supabase.from('warehouse_movements').select('*');
        setWarehouseMovements(movements || []);
    };
    
    const importAndProcessPreviredData = async (rows: ParsedPreviredRow[]): Promise<{ employeesAdded: number; payslipsAdded: number }> => {
        if (rows.length === 0) return { employeesAdded: 0, payslipsAdded: 0 };
        
        const newEmployeeData = rows.filter(r => r.status === 'new' && r.employeeData).map(r => r.employeeData!);
        let employeesAdded = 0;
        
        if (newEmployeeData.length > 0) {
            const { data: createdEmployees, error } = await supabase.from('employees').insert(newEmployeeData).select();
            if (error) throw error;
            employeesAdded = createdEmployees?.length || 0;
        }

        const { data: allEmployees, error: employeesError } = await supabase.from('employees').select('*');
        if (employeesError) throw employeesError;
        setEmployees(allEmployees || []);

        const payslipsToCreate: Omit<Payslip, 'id'>[] = [];
        const currentEmployees = allEmployees || [];

        for (const row of rows) {
            if (row.status === 'error' || !row.employeeData) continue;
            const employee = currentEmployees.find(e => e.rut === row.employeeData!.rut);
            if (!employee) {
                console.warn(`No se encontró empleado con RUT ${row.employeeData.rut}. Se omite liquidación.`);
                continue;
            }
            const employeeForCalc = { ...employee, baseSalary: row.employeeData.baseSalary };
            try {
                const payslipDetails = calculatePayslipDetails(employeeForCalc, activePeriod, institutions, monthlyParameters, incomeTaxBrackets);
                payslipsToCreate.push({ employeeId: employee.id, period: activePeriod, ...payslipDetails });
            } catch(e) {
                console.error(`Error al calcular liquidación para ${employee.name}:`, e);
            }
        }
        
        let payslipsAdded = 0;
        if (payslipsToCreate.length > 0) {
            const { data: createdPayslips, error } = await supabase.from('payslips').insert(payslipsToCreate).select();
            if (error) throw error;
            payslipsAdded = createdPayslips?.length || 0;
        }

        const { data: allPayslips } = await supabase.from('payslips').select('*');
        setPayslips(allPayslips || []);

        return { employeesAdded, payslipsAdded };
    };
    
    const addUser = async (userData: UserData, password: string, onProgress: (message: string) => void) => {
        if (!userData.email) throw new Error('El email es requerido para crear un usuario.');
        onProgress('Creando cuenta de autenticación...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email: userData.email, password: password });
        if (signUpError) throw signUpError;
        if (!signUpData.user) throw new Error('No se pudo crear el usuario en el sistema de autenticación.');

        onProgress('Guardando perfil de usuario...');
        const profileData = { 
            id: signUpData.user.id, name: userData.name, email: userData.email,
            company_limit: userData.company_limit, status: userData.status, role: 'Accountant'
        };
        
        const { error: profileError } = await supabase.from('users').insert([profileData]);
        if (profileError) {
            console.error("Orphaned auth user created:", signUpData.user.id);
            await supabase.auth.signOut();
            throw new Error(`Se creó la cuenta, pero falló la creación del perfil: ${profileError.message}. Contacte a soporte.`);
        }
        onProgress('Finalizando...');
        await supabase.auth.signOut();
        onProgress('');
    };
    
    const userCrud = {
      delete: async (id: string) => {
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) throw error;
        const { data } = await supabase.from('users').select('*');
        setUsers(data || []);
      },
      updateUser: async (updated: User) => {
         const { error } = await supabase.from('users').update(updated).eq('id', updated.id);
         if(error) throw error;
         const { data } = await supabase.from('users').select('*');
         setUsers(data || []);
      }
    };
    

    const value: SessionContextType = {
        currentUser, login, logout, sendPasswordResetEmail, isLoading,
        companies, addCompany: companyActions.add, updateCompany: companyActions.update, deleteCompany: companyActions.delete,
        accounts, addAccount: accountCrud.add, updateAccount: accountCrud.update, deleteAccount: accountCrud.delete,
        accountGroups, addAccountGroup: accountGroupCrud.add, updateAccountGroup: accountGroupCrud.update, deleteAccountGroup: accountGroupCrud.delete,
        subjects, addSubject: subjectCrud.add, updateSubject: subjectCrud.update, deleteSubject: subjectCrud.delete,
        items, addItem: itemCrud.add, updateItem: itemCrud.update, deleteItem: itemCrud.delete,
        costCenters, addCostCenter: costCenterCrud.add, updateCostCenter: costCenterCrud.update, deleteCostCenter: costCenterCrud.delete,
        employees, addEmployee: employeeCrud.add, updateEmployee: employeeCrud.update, deleteEmployee: employeeCrud.delete,
        users, addUser: addUser, updateUser: userCrud.updateUser, deleteUser: userCrud.delete,
        institutions, addInstitution: institutionCrud.add, updateInstitution: institutionCrud.update, deleteInstitution: institutionCrud.delete,
        monthlyParameters, addMonthlyParameter: monthlyParameterCrud.add, updateMonthlyParameter: monthlyParameterCrud.update, deleteMonthlyParameter: monthlyParameterCrud.delete,
        familyAllowanceBrackets, addFamilyAllowanceBracket: familyAllowanceBracketCrud.add, updateFamilyAllowanceBracket: familyAllowanceBracketCrud.update, deleteFamilyAllowanceBracket: familyAllowanceBracketCrud.delete,
        incomeTaxBrackets,
        warehouseMovements, addWarehouseMovement,
        payslips, addPayslip, updatePayslip, deletePayslip,
        vouchers, addVoucher,
        updateVoucher,
        deleteVoucher,
        invoices, addInvoice,
        addBatchInvoicesAndVouchers,
        feeInvoices, addFeeInvoice,
        centralizePayslips,
        importAndProcessPreviredData,
        activeCompanyId, setActiveCompanyId,
        periods, activePeriod, setActivePeriod,
        notifications, addNotification,
        handleApiError,
    };

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) throw new Error('useSession must be used within a SessionProvider');
    return context;
};