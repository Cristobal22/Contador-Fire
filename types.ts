export type Company = {
    id: number;
    rut: string;
    business_name: string; // Renamed from name
    address?: string;
    owner_id: string;

    // Configuration settings - all optional
    is_distributor?: boolean;
    year?: number;
    initial_date?: string;
    final_date?: string;
    profit_account?: string;
    loss_account?: string;
    invoices_to_collect_account?: string;
    bills_to_collect_account?: string;
    vat_account?: string;
    other_taxes_account?: string;
    proportional_vat?: boolean;
    invoices_to_pay_account?: string;
    bills_to_pay_account?: string;
    vat_credit_account?: string;
    other_taxes_to_pay_account?: string;
    fees_to_pay_account?: string;
    second_category_retentions_account?: string;
    client_fees_account?: string;
    retentions_to_pay_account?: string;
    retentions_to_collect_account?: string;
    cash_equivalent_account?: string;
    partner_withdrawal_account?: string;
    made_by?: string;
    reviewed_by?: string;
    approved_by?: string;
};

// CompanyData for creation only needs essential fields
export type CompanyData = Pick<Company, 'rut' | 'business_name' | 'address'>;

export type ChartOfAccount = { id: number; code: string; name: string; type: string; }
export type ChartOfAccountData = Omit<ChartOfAccount, 'id'>;

export type AccountGroup = { id: number; code: string; name: string; format: string; levels: number; transitionalType: 'balance' | 'result'; movementType: 'debtor' | 'creditor'; length: number; }
export type AccountGroupData = Omit<AccountGroup, 'id'>;

export type Subject = { id: number; rut: string; name: string; type: 'Cliente' | 'Proveedor'; }
export type SubjectData = Omit<Subject, 'id'>;

export type Item = { id: number; sku: string; name: string; }
export type ItemData = Omit<Item, 'id'>;

export type CostCenter = { id: number; code: string; name: string; };
export type CostCenterData = Omit<CostCenter, 'id'>;

export type Employee = { id: number; rut: string; name: string; position: string; hireDate: string; baseSalary: number; afpId: number; healthId: number; };
export type EmployeeData = Omit<Employee, 'id'>;

export type User = { 
    id: string; // Now a UUID string from Supabase Auth
    name: string; 
    email?: string; 
    role: 'System Administrator' | 'Accountant'; 
    company_limit: number;
    status: 'active' | 'inactive';
};
export type UserData = Omit<User, 'id'>;

export type Institution = { id: number; name: string; type: 'AFP' | 'Isapre' | 'Fonasa' | 'Otro'; rate?: number; previred_code?: string; dt_code?: string;};
export type InstitutionData = Omit<Institution, 'id'>;

export type MonthlyParameter = { id: number; period: string; name: 'UF' | 'UTM' | 'IPC' | 'Tope Imponible'; value: number; };
export type MonthlyParameterData = Omit<MonthlyParameter, 'id'>;

export type FamilyAllowanceBracket = { 
    id: number; 
    year: number; 
    semester: number; 
    fromIncome: number; 
    toIncome: number; 
    tranche: string; 
    allowanceAmount: number; 
};
export type FamilyAllowanceBracketData = Omit<FamilyAllowanceBracket, 'id'>;

export type IncomeTaxBracket = {
    id: number;
    period: string;
    fromUTM: number;
    toUTM: number | null;
    factor: number;
    rebateUTM: number;
};

export type WarehouseMovement = { id: number; date: string; type: 'Entrada' | 'Salida'; itemId: number; quantity: number; };
export type WarehouseMovementData = Omit<WarehouseMovement, 'id'>;

export type PayslipDeduction = { name: string; amount: number; };
export type Payslip = { 
    id: number; 
    period: string; 
    employeeId: number; 
    grossPay: number; 
    taxableIncome: number;
    incomeTax: number;
    deductions: PayslipDeduction[]; 
    netPay: number; 
    breakdown?: any;
};
export type PayslipData = { period: string; employeeId: number; };

export type VoucherEntry = { id: number; accountId: number | ''; debit: number; credit: number; };
export type Voucher = { id: number; date: string; description: string; entries: VoucherEntry[]; };
export type VoucherData = Omit<Voucher, 'id'>;

export type Invoice = { id: number; date: string; invoiceNumber: string; subjectId: number; net: number; tax: number; total: number; type: 'Compra' | 'Venta' }
export type InvoiceData = Omit<Invoice, 'id'>;

export type FeeInvoice = { id: number; date: string; invoiceNumber: string; subjectId: number; grossAmount: number; taxRetention: number; netAmount: number; }
export type FeeInvoiceData = Omit<FeeInvoice, 'id'>;

export type Period = { value: string; label: string; }

export type NavItemDefinition = {
    icon: string;
    path?: string;
    children: NavStructure;
};
export type NavStructure = {
    [key: string]: NavItemDefinition | { path: string };
};

export type Notification = {
    id: number;
    message: string;
    type: 'success' | 'error';
};

export type ParsedPreviredRow = {
    originalData: Record<string, string>;
    employeeData?: EmployeeData;
    status: 'new' | 'exists' | 'error';
    error?: string;
    rowIndex: number;
};

export type SessionContextType = {
    // Auth
    currentUser: User | null;
    login: (email: string, password: string) => Promise<User>;
    logout: () => void;
    sendPasswordResetEmail: (email: string) => Promise<void>;
    isLoading: boolean;

    // State
    companies: Company[];
    accounts: ChartOfAccount[];
    accountGroups: AccountGroup[];
    subjects: Subject[];
    items: Item[];
    costCenters: CostCenter[];
    employees: Employee[];
    institutions: Institution[];
    users: User[];
    monthlyParameters: MonthlyParameter[];
    familyAllowanceBrackets: FamilyAllowanceBracket[];
    incomeTaxBrackets: IncomeTaxBracket[];
    warehouseMovements: WarehouseMovement[];
    payslips: Payslip[];
    vouchers: Voucher[];
    invoices: Invoice[];
    feeInvoices: FeeInvoice[];
    periods: Period[];
    activeCompanyId: number | null;
    activePeriod: string;
    notifications: Notification[];

    // Actions
    addCompany: (data: CompanyData) => Promise<void>;
    updateCompany: (id: number, data: Partial<Company>) => Promise<void>;
    deleteCompany: (id: number) => Promise<void>;
    addAccount: (data: ChartOfAccountData) => Promise<void>;
    updateAccount: (data: ChartOfAccount) => Promise<void>;
    deleteAccount: (id: number) => Promise<void>;
    addAccountGroup: (data: AccountGroupData) => Promise<void>;
    updateAccountGroup: (data: AccountGroup) => Promise<void>;
    deleteAccountGroup: (id: number) => Promise<void>;
    addSubject: (data: SubjectData) => Promise<void>;
    updateSubject: (data: Subject) => Promise<void>;
    deleteSubject: (id: number) => Promise<void>;
    addItem: (data: ItemData) => Promise<void>;
    updateItem: (data: Item) => Promise<void>;
    deleteItem: (id: number) => Promise<void>;
    addCostCenter: (data: CostCenterData) => Promise<void>;
    updateCostCenter: (data: CostCenter) => Promise<void>;
    deleteCostCenter: (id: number) => Promise<void>;
    addEmployee: (data: EmployeeData) => Promise<void>;
    updateEmployee: (data: Employee) => Promise<void>;
    deleteEmployee: (id: number) => Promise<void>;
    addUser: (data: UserData, password: string, onProgress: (message: string) => void) => Promise<void>;
    updateUser: (data: User) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;
    addInstitution: (data: InstitutionData) => Promise<void>;
    updateInstitution: (data: Institution) => Promise<void>;
    deleteInstitution: (id: number) => Promise<void>;
    addMonthlyParameter: (data: MonthlyParameterData) => Promise<void>;
    updateMonthlyParameter: (data: MonthlyParameter) => Promise<void>;
    deleteMonthlyParameter: (id: number) => Promise<void>;
    addFamilyAllowanceBracket: (data: FamilyAllowanceBracketData) => Promise<void>;
    updateFamilyAllowanceBracket: (data: FamilyAllowanceBracket) => Promise<void>;
    deleteFamilyAllowanceBracket: (id: number) => Promise<void>;
    addWarehouseMovement: (data: WarehouseMovementData) => Promise<void>;
    addPayslip: (data: PayslipData) => Promise<void>;
    updatePayslip: (data: Payslip) => Promise<void>;
    deletePayslip: (id: number) => Promise<void>;
    addVoucher: (data: VoucherData) => Promise<void>;
    updateVoucher: (data: Voucher) => Promise<void>;
    deleteVoucher: (id: number) => Promise<void>;
    addInvoice: (data: InvoiceData) => Promise<void>;
    addBatchInvoicesAndVouchers: (invoicesData: InvoiceData[]) => Promise<void>;
    addFeeInvoice: (data: FeeInvoiceData) => Promise<void>;
    centralizePayslips: (period: string) => Promise<void>;
    importAndProcessPreviredData: (rows: ParsedPreviredRow[]) => Promise<{ employeesAdded: number; payslipsAdded: number }>;
    setActiveCompanyId: (id: number | null) => void;
    setActivePeriod: (period: string) => void;
    addNotification: (notification: Omit<Notification, 'id'>) => void;
    handleApiError: (error: any, context: string) => void;
};
