
import React, { useEffect, useMemo } from 'react';
import { useForm } from '../hooks/useForm';
import type { Employee, EmployeeData, Institution, CostCenter } from '../types';
import { formatRut, parseRut } from '../utils/format';
import { regions } from '../data/geography';
import { workdayTypes, paymentTypes, taxTypes, apvPaymentMethods, workerTypes } from '../data/payroll';
import { terminationCauses, banks, compensationFunds } from '../data/payrollOptions';

type EmployeeFormProps = {
    onSave: (employee: EmployeeData) => void;
    onCancel: () => void;
    initialData?: Employee | null;
    isLoading?: boolean;
    institutions: Institution[];
    costCenters: CostCenter[];
};

const FormSection: React.FC<{ title: string, children: React.ReactNode, isOpen?: boolean }> = ({ title, children, isOpen: defaultOpen = true }) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);
    return (
        <div className="form-section">
            <div className="form-section-header" onClick={() => setIsOpen(!isOpen)}>
                <span>{title}</span>
                <span className={`material-symbols-outlined transition-transform ${isOpen ? 'rotate-180' : ''}`}>expand_less</span>
            </div>
            {isOpen && <div className="form-section-content">{children}</div>}
        </div>
    );
};

const SaveButton: React.FC<{ isLoading?: boolean; text?: string; disabled?: boolean; }> = ({ isLoading, text = "Guardar", disabled = false }) => (
    <button type="submit" className={`btn btn-primary ${isLoading ? 'loading' : ''}`} disabled={isLoading || disabled}>
        {isLoading && <div className="spinner"></div>}
        <span className="btn-text">{text}</span>
    </button>
);

const getInitialFormData = (data: Employee | null | undefined): EmployeeData => {
    const defaults: Partial<EmployeeData> = {
        rut: '',
        name: '',
        paternal_lastname: '',
        maternal_lastname: '',
        birth_date: '',
        nationality: 'Chileno',
        gender: 'Masculino',
        address: '',
        region: '',
        commune: '',
        phone: '',
        email: '',
        mobile_phone: '',
        position: '',
        cost_center_code: '',
        baseSalary: 0,
        business_salary: 0,
        healthId: 0,
        afpId: 0,
        compensation_fund_id: 0,
        hireDate: new Date().toISOString().split('T')[0],
        weekly_hours: 44,
        has_unemployment_insurance: false,
        compensation_fund_branch: '',
        payment_type: 'DEPOSITO',
        fixed_term_period_from: '',
        fixed_term_period_to: '',
        worker_type: 'ACTIVO',
        apv_payment_method: 'PLANILLA',
        tax_type: 'AFECTO',
        contract_address: '',
        contract_region: '',
        contract_commune: '',
        bank_code: '',
        bank_name_other: '',
        termination_cause_code: '',
    };
    if (!data) return defaults as EmployeeData;
    return { ...defaults, ...data, rut: data.rut ? formatRut(data.rut) : '' } as EmployeeData;
};

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSave, onCancel, initialData, isLoading, institutions, costCenters }) => {
    
    const { formData, register, setFormData, getValues } = useForm<EmployeeData>(getInitialFormData(initialData));

    useEffect(() => {
        setFormData(getInitialFormData(initialData));
    }, [initialData, setFormData]);

    const personalCommuneOptions = useMemo(() => {
        if (!formData.region) return [];
        const selectedRegion = regions.find(r => r.name === formData.region);
        return selectedRegion ? selectedRegion.communes : [];
    }, [formData.region]);

    const contractCommuneOptions = useMemo(() => {
        if (!formData.contract_region) return [];
        const selectedRegion = regions.find(r => r.name === formData.contract_region);
        return selectedRegion ? selectedRegion.communes : [];
    }, [formData.contract_region]);

    const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: formatRut(value)}));
    };

    const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value, commune: ''}));
    }

    const handleContractRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value, contract_commune: ''}));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const currentValues = getValues();
        const [rut] = parseRut(currentValues.rut);
        onSave({ ...currentValues, rut });
    };

    const afpOptions = useMemo(() => institutions.filter(i => i.type === 'AFP').map(i => ({ value: i.id, label: i.name })), [institutions]);
    const healthOptions = useMemo(() => institutions.filter(i => i.type === 'Isapre' || i.type === 'Fonasa').map(i => ({ value: i.id, label: i.name })), [institutions]);
    const costCenterOptions = useMemo(() => costCenters.map(c => ({ value: c.code, label: `${c.code} - ${c.name}` })), [costCenters]);

    return (
        <form onSubmit={handleSubmit} className="employee-form">
            <div className="modal-body">
                <FormSection title="Datos Personales">
                    <div className="grid-col-3">
                        <div className="form-group"><label>Rut</label><input {...register('rut')} onChange={handleRutChange} /></div>
                        <div className="form-group"><label>Centro de Costo</label><select {...register('cost_center_code')}><option value="">Seleccione...</option>{costCenterOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                        <div className="form-group"><label>Nombre</label><input {...register('name')} /></div>
                        <div className="form-group"><label>Apellido Paterno</label><input {...register('paternal_lastname')} /></div>
                        <div className="form-group"><label>Apellido Materno</label><input {...register('maternal_lastname')} /></div>
                        <div className="form-group"><label>Dirección</label><input {...register('address')} /></div>
                        <div className="form-group"><label>Región</label><select {...register('region')} onChange={handleRegionChange}><option value="">Seleccione una región</option>{regions.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}</select></div>
                        <div className="form-group"><label>Comuna</label><select {...register('commune')} disabled={!formData.region}><option value="">Seleccione una comuna</option>{personalCommuneOptions.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                        <div className="form-group"><label>Teléfono</label><input {...register('phone')} /></div>
                        <div className="form-group"><label>Fecha de Nacimiento</label><input type="date" {...register('birth_date')} /></div>
                        <div className="form-group"><label>Nacionalidad</label><select {...register('nationality')}><option>Chileno</option><option>Extranjero</option></select></div>
                        <div className="form-group"><label>Sexo</label><select {...register('gender')}><option>Masculino</option><option>Femenino</option></select></div>
                        <div className="form-group"><label>Email Trabajador</label><input type="email" {...register('email')} /></div>
                        <div className="form-group"><label>Celular</label><input {...register('mobile_phone')} /></div>
                        <div className="form-group"><label>Cargo</label><input {...register('position')} /></div>
                    </div>
                </FormSection>

                <FormSection title="Previsión" isOpen={false}> 
                    <div className="grid-col-3">
                        <div className="form-group"><label>Isapre</label><select {...register('healthId')}>{healthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                        <div className="form-group"><label>AFP</label><select {...register('afpId')}>{afpOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                        <div className="form-group"><label>Caja de Compensación</label><select {...register('compensation_fund_id')}><option value="">Seleccione...</option>{compensationFunds.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}</select></div>
                    </div>
                </FormSection>

                <FormSection title="Contrato" isOpen={false}> 
                    <div className="grid-col-3">
                        <div className="form-group"><label>Fecha Contrato (dd/mm/aaaa)</label><input type="date" {...register('hireDate')} /></div>
                        <div className="form-group"><label>Fecha Término Contrato</label><input type="date" {...register('contract_end_date')} /></div>
                        <div className="form-group"><label>Cláusula de Término</label><select {...register('termination_cause_code')}><option value="">Seleccione una causal</option>{terminationCauses.map(group => <optgroup key={group.category} label={group.category}><option value={group.code}>{group.name}</option></optgroup>)}</select></div>
                    </div>
                </FormSection>

                <FormSection title="Otros" isOpen={false}> 
                     <div className="grid-col-3">
                        <div className="form-group"><label>Banco</label><select {...register('bank_code')}><option value="">Seleccione un banco</option>{banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}</select></div>
                        {formData.bank_code === 'OTRO' && <div className="form-group"><label>Especificar Otro Banco</label><input {...register('bank_name_other')} /></div>}
                        <div className="form-group"><label>Número de Cuenta</label><input {...register('bank_account_number')} /></div>
                    </div>
                </FormSection>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
                <SaveButton isLoading={isLoading} />
            </div>
        </form>
    );
};
