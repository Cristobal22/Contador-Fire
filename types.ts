
// --- Core Data Structures ---

export type Company = {
    id: number;
    rut: string;
    name: string; 
    address?: string;
    owner_id: string;
    year?: number;
    // ... other company settings
};
export type CompanyData = Pick<Company, 'rut' | 'name' | 'address'>;

export type User = { 
    id: string; 
    name: string; 
    email?: string; 
    role: 'System Administrator' | 'Accountant'; 
    company_id?: number;
    company_limit: number;
    status: 'active' | 'inactive';
};
export type UserData = Omit<User, 'id'>;

export type Notification = {
    id: number;
    type: 'success' | 'error' | 'info';
    message: string;
};

export type Period = {
    id: number;
    company_id: number;
    year: number;
    month: number;
    status: 'open' | 'closed';
};

// --- Accounting ---

export type Account = { 
    id: number; 
    company_id: number;
    code: string; 
    name: string; 
    type: string; 
};
export type AccountData = Omit<Account, 'id' | 'company_id'>;

export type VoucherEntry = {
    id: number;
    accountId: number | '';
    debit: number;
    credit: number;
    description?: string;
};
export type VoucherEntryData = Omit<VoucherEntry, 'id'>;

export type Voucher = {
    id: number;
    company_id: number;
    date: string;
    type: string;
    description: string;
    entries: VoucherEntry[];
};
export type VoucherData = Omit<Voucher, 'id' | 'company_id'>;


// --- Invoicing ---

export type Subject = { 
    id: number; 
    rut: string; 
    name: string; 
    type: 'Cliente' | 'Proveedor'; 
};
export type SubjectData = Omit<Subject, 'id'>;

export type TaxType = 'afecto' | 'exento';

export type InvoiceLine = {
    id: number;
    description: string;
    quantity: number;
    price: number;
    accountId: number;
};
export type InvoiceLineData = Omit<InvoiceLine, 'id'>;

export type Invoice = {
    id: number;
    company_id: number;
    date: string;
    type: 'Compra' | 'Venta';
    invoiceNumber: string;
    subjectId: number;
    taxType: TaxType;
    lines: InvoiceLine[];
    subtotal: number;
    tax: number;
    total: number;
};
export type InvoiceData = Omit<Invoice, 'id' | 'company_id'>;


// --- Payroll (Remuneraciones) ---

export type CostCenter = { 
    id: number; 
    company_id: number;
    code: string; 
    name: string; 
};
export type CostCenterData = Omit<CostCenter, 'id' | 'company_id'>;

export type Institution = {
    id: number;
    name: string;
    type: 'AFP' | 'Salud' | 'APV';
};

export type Employee = {
    id: number;
    company_id: number;
    rut: string;
    name: string;
    paternal_lastname?: string;
    maternal_lastname?: string;
    address?: string;
    hireDate: string;
    baseSalary: number;
    healthId: number;
    afpId: number;
    // ... many other employee fields
};
export type EmployeeData = Omit<Employee, 'id' | 'company_id'>;

export type MonthlyParameter = {
    id: number;
    company_id: number;
    period: string; // "YYYY-MM"
    name: 'UF' | 'UTM' | 'IPC' | 'Tope Imponible';
    value: number;
};
export type MonthlyParameterData = Omit<MonthlyParameter, 'id' | 'company_id'>;

export type Payslip = {
    id: number;
    company_id: number;
    employee_id: number;
    period: string; // "YYYY-MM"
    // ... fields for earnings, deductions, and totals
};
export type PayslipData = Omit<Payslip, 'id' | 'company_id'>;


// --- Session Context ---

export type Session = {
    user: User;
    company: Company | null;
    periods: Period[];
    accounts: Account[];
    vouchers: Voucher[];
    employees: Employee[];
    institutions: Institution[];
    monthlyParameters: MonthlyParameter[];
    payslips: Payslip[];
    costCenters: CostCenter[];

    activePeriod: string;
    setActivePeriod: (period: string) => void;

    // CRUD Functions
    addAccount: (data: AccountData) => Promise<void>;
    updateAccount: (data: Account) => Promise<void>;
    deleteAccount: (id: number) => Promise<void>;

    addVoucher: (data: VoucherData) => Promise<void>;
    updateVoucher: (data: Voucher) => Promise<void>;
    deleteVoucher: (id: number) => Promise<void>;

    addEmployee: (data: EmployeeData) => Promise<void>;
    updateEmployee: (data: Employee) => Promise<void>;
    deleteEmployee: (id: number) => Promise<void>;

    addInstitution: (data: Omit<Institution, 'id'>) => Promise<void>;
    updateInstitution: (data: Institution) => Promise<void>;
    deleteInstitution: (id: number) => Promise<void>;

    addMonthlyParameter: (data: MonthlyParameterData) => Promise<void>;
    updateMonthlyParameter: (data: MonthlyParameter) => Promise<void>;
    deleteMonthlyParameter: (id: number) => Promise<void>;

    addPayslip: (data: PayslipData) => Promise<void>;
    updatePayslip: (data: Payslip) => Promise<void>;
    deletePayslip: (id: number) => Promise<void>;
    
    addCostCenter: (data: CostCenterData) => Promise<void>;
    updateCostCenter: (data: CostCenter) => Promise<void>;
    deleteCostCenter: (id: number) => Promise<void>;
};
