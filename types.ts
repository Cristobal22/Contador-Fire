
export type Company = {
    id: number;
    rut: string;
    business_name: string; 
    address?: string;
    owner_id: string;
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
    accumulated_result_account_id?: number;
};

export type CompanyData = Pick<Company, 'rut' | 'business_name' | 'address'>;

export type ChartOfAccount = { id: number; code: string; name: string; type: string; }
export type ChartOfAccountData = Omit<ChartOfAccount, 'id'>;

export type AccountGroup = { id: number; code: string; name: string; format: string; levels: number; transitionalType: 'balance' | 'result'; movementType: 'debtor' | 'creditor'; length: number; }
export type AccountGroupData = Omit<AccountGroup, 'id'>;

export type Subject = { id: number; rut: string; name: string; type: 'Cliente' | 'Proveedor'; has_solidarity_loan?: boolean; }
export type SubjectData = Omit<Subject, 'id'>;

export type Item = { id: number; sku: string; name: string; }
export type ItemData = Omit<Item, 'id'>;

export type CostCenter = { id: number; code: string; name: string; };
export type CostCenterData = Omit<CostCenter, 'id'>;

export type Employee = {
    id: number;
    rut: string;
    name: string;
    paternal_lastname?: string;
    maternal_lastname?: string;
    address?: string;
    commune?: string;
    phone?: string;
    birth_date?: string;
    nationality?: string;
    gender?: 'Masculino' | 'Femenino';
    email?: string;
    mobile_phone?: string;
    position?: string;
    cost_center_code?: string;
    baseSalary: number; 
    monthly_salary_uf?: number; 
    daily_salary?: number; 
    hourly_salary?: number; 
    business_salary?: number;
    healthId: number; 
    fun_isapre?: string;
    health_contribution_uf?: number;
    health_contribution_pesos?: number;
    collective_health_percentage?: number;
    afpId: number; 
    worker_type?: string;
    afp_account_2?: number;
    unemployment_insurance?: boolean;
    family_dependents?: number;
    apv_amount?: number;
    apv_amount_uf?: number;
    apv_provider_id?: number;
    apv_payment_method?: string;
    apv_regime_letter?: 'A' | 'B';
    tax_type?: string;
    is_agricultural_worker?: boolean;
    solidarity_loan?: number;
    apv2_amount_uf?: number;
    apv2_provider_id?: number;
    collective_apv_amount?: number;
    apv2_payment_method?: string;
    apvc_payment_method?: string;
    collective_apv_amount_uf?: number;
    apvc_worker_percentage?: number;
    caja_loan?: number;
    caja_loan_2?: number;
    second_caja?: string;
    has_accident_insurance?: boolean;
    has_unemployment_insurance?: boolean;
    first_pension_affiliation_date?: string;
    is_voluntary_affiliate?: boolean;
    hireDate: string; 
    contract_end_date?: string;
    termination_cause_code?: string; // Updated field
    monthly_meal_allowance?: number;
    daily_meal_allowance?: number;
    monthly_transport_allowance?: number;
    daily_transport_allowance?: number;
    workday_type?: string;
    region?: string;
    contract_commune?: string;
    weekly_hours?: number;
    part_time_days?: number;
    use_minimum_wage?: boolean;
    overtime_factor?: number;
    heavy_work_worker_percentage?: number;
    heavy_work_employer_percentage?: number;
    is_disabled?: boolean;
    progressive_vacation_days?: number;
    years_for_progressive_vacation?: number;
    is_foreign_tech_pension_exempt?: boolean;
    has_covid_record?: boolean;
    bank_code?: string; // New field for bank code
    bank_name_other?: string; // New field for other bank name
    bank_account_number?: string;
    is_extreme_zone?: boolean;
};

export type EmployeeData = Omit<Employee, 'id'>;

export type User = { 
    id: string; 
    name: string; 
    email?: string; 
    role: 'System Administrator' | 'Accountant'; 
    company_limit: number;
    status: 'active' | 'inactive';
};
export type UserData = Omit<User, 'id'>;

// --- Accounting specific types ---

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


// --- New, detailed Invoice structure ---

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

// This is the data that will be sent from the new form
export type InvoiceData = {
    date: string;
    type: 'Compra' | 'Venta';
    invoiceNumber: string;
    subjectId: number;
    taxType: TaxType;
    lines: InvoiceLineData[];
};


// --- Fee Invoice (Boleta de Honorarios) --- 

export type FeeInvoice = {
    id: number;
    date: string;
    invoiceNumber: string;
    subjectId: number;
    grossAmount: number;
    taxRetention: number;
    netAmount: number;
};

export type FeeInvoiceData = Omit<FeeInvoice, 'id'>;

