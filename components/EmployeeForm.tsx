
import React, { useState, useEffect } from 'react';
import type { Employee, EmployeeData, Institution, CostCenter } from '../types';
import { formatRut, parseRut } from '../utils/format';
import { regions } from '../data/geography';
import { workdayTypes, paymentTypes, taxTypes, apvPaymentMethods, workerTypes } from '../data/payroll';
import { terminationCauses, banks, compensationFunds } from '../data/payrollOptions'; // Import new data

type EmployeeFormProps = {
    onSave: (employee: EmployeeData) => void;
    onCancel: () => void;
    initialData?: Employee | null;
    isLoading?: boolean;
    institutions: Institution[];
    costCenters: CostCenter[];
};

const FormSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true);
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

export const EmployeeForm: React.FC<EmployeeFormProps> = ({ onSave, onCancel, initialData, isLoading, institutions, costCenters }) => {
    
    const getInitialFormData = (data: Employee | null | undefined): EmployeeData => {
        const defaults: EmployeeData = {
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
            bank_name_other: '', // Field for other bank
            termination_cause_code: '',
        };
        if (!data) return defaults;
        
        return {
            ...defaults,
            ...data,
            rut: data.rut ? formatRut(data.rut) : '',
        };
    };
    
    const [formData, setFormData] = useState<EmployeeData>(getInitialFormData(initialData));
    const [personalCommuneOptions, setPersonalCommuneOptions] = useState<string[]>([]);
    const [contractCommuneOptions, setContractCommuneOptions] = useState<string[]>([]);

    useEffect(() => {
        setFormData(getInitialFormData(initialData));
    }, [initialData]);

    useEffect(() => {
        if (formData.region) {
            const selectedRegion = regions.find(r => r.name === formData.region);
            setPersonalCommuneOptions(selectedRegion ? selectedRegion.communes : []);
        } else {
            setPersonalCommuneOptions([]);
        }
    }, [formData.region]);
    
    useEffect(() => {
        if (formData.contract_region) {
            const selectedRegion = regions.find(r => r.name === formData.contract_region);
            setContractCommuneOptions(selectedRegion ? selectedRegion.communes : []);
        } else {
            setContractCommuneOptions([]);
        }
    }, [formData.contract_region]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        let processedValue: any = value;

        if (type === 'checkbox') {
            processedValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            processedValue = value === '' ? null : parseFloat(value);
        } else if (name === 'rut') {
            processedValue = formatRut(value);
        } else if (value === 'true' || value === 'false') {
            processedValue = value === 'true';
        }
        
        setFormData(prev => {
            const newFormData = { ...prev, [name]: processedValue };
            if (name === 'region') newFormData.commune = '';
            if (name === 'contract_region') newFormData.contract_commune = '';
            if (name === 'bank_code' && value !== 'OTRO') newFormData.bank_name_other = ''; // Clear other field
            return newFormData;
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const [rut, dv] = parseRut(formData.rut);
        onSave({ ...formData, rut });
    };

    const afpOptions = institutions.filter(i => i.type === 'AFP').map(i => ({ value: i.id, label: i.name }));
    const healthOptions = institutions.filter(i => i.type === 'Isapre' || i.type === 'Fonasa').map(i => ({ value: i.id, label: i.name }));
    const costCenterOptions = costCenters.map(c => ({ value: c.code, label: `${c.code} - ${c.name}` }));

    return (
        <form onSubmit={handleSubmit} className="employee-form">
            <div className="modal-body">
                <FormSection title="Datos Personales">
                    <div className="grid-col-3">
                        {/* Unchanged fields here */}
                        <div className="form-group"><label>Rut</label><input name="rut" value={formData.rut} onChange={handleChange} /></div>
                        <div className="form-group"><label>Centro de Costo</label><select name="cost_center_code" value={formData.cost_center_code || ''} onChange={handleChange}><option value="">Seleccione...</option>{costCenterOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                        <div className="form-group"><label>Nombre</label><input name="name" value={formData.name} onChange={handleChange} /></div>
                        <div className="form-group"><label>Apellido Paterno</label><input name="paternal_lastname" value={formData.paternal_lastname || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Apellido Materno</label><input name="maternal_lastname" value={formData.maternal_lastname || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Dirección</label><input name="address" value={formData.address || ''} onChange={handleChange} /></div>
                        <div className="form-group">
                            <label>Región</label>
                            <select name="region" value={formData.region || ''} onChange={handleChange}>
                                <option value="">Seleccione una región</option>
                                {regions.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Comuna</label>
                            <select name="commune" value={formData.commune || ''} onChange={handleChange} disabled={!formData.region}>
                                <option value="">Seleccione una comuna</option>
                                {personalCommuneOptions.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label>Teléfono</label><input name="phone" value={formData.phone || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Fecha de Nacimiento</label><input type="date" name="birth_date" value={formData.birth_date || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Nacionalidad</label><select name="nationality" value={formData.nationality || 'Chileno'} onChange={handleChange}><option>Chileno</option><option>Extranjero</option></select></div>
                        <div className="form-group"><label>Sexo</label><select name="gender" value={formData.gender || 'Masculino'} onChange={handleChange}><option>Masculino</option><option>Femenino</option></select></div>
                        <div className="form-group"><label>Email Trabajador</label><input type="email" name="email" value={formData.email || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Celular</label><input name="mobile_phone" value={formData.mobile_phone || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Cargo</label><input name="position" value={formData.position || ''} onChange={handleChange} /></div>
                    </div>
                </FormSection>
                
                <FormSection title="Previsión">
                    <div className="grid-col-3">
                        {/* Other fields */}
                        <div className="form-group"><label>Isapre</label><select name="healthId" value={formData.healthId} onChange={handleChange}>{healthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                        <div className="form-group"><label>AFP</label><select name="afpId" value={formData.afpId} onChange={handleChange}>{afpOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                        <div className="form-group">
                            <label>Caja de Compensación</label>
                            <select name="compensation_fund_id" value={formData.compensation_fund_id || ''} onChange={handleChange}>
                                <option value="">Seleccione...</option>
                                {compensationFunds.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                            </select>
                        </div>
                        {/* ... other fields from this section */}
                    </div>
                </FormSection>

                <FormSection title="Contrato">
                     <div className="grid-col-3">
                        <div className="form-group"><label>Fecha Contrato (dd/mm/aaaa)</label><input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} /></div>
                        <div className="form-group"><label>Fecha Término Contrato</label><input type="date" name="contract_end_date" value={formData.contract_end_date || ''} onChange={handleChange} /></div>
                        <div className="form-group">
                            <label>Cláusula de Término</label>
                            <select name="termination_cause_code" value={formData.termination_cause_code || ''} onChange={handleChange}>
                                <option value="">Seleccione una causal</option>
                                {terminationCauses.map(group => (
                                    <optgroup key={group.category} label={group.category}>
                                        <option value={group.code}>{group.name}</option>
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                        {/* Other fields */}
                     </div>
                </FormSection>

                <FormSection title="Otros">
                    <div className="grid-col-3">
                       {/* Other fields */}
                        <div className="form-group">
                            <label>Banco</label>
                            <select name="bank_code" value={formData.bank_code || ''} onChange={handleChange}>
                                <option value="">Seleccione un banco</option>
                                {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
                            </select>
                        </div>
                        {formData.bank_code === 'OTRO' && (
                            <div className="form-group">
                                <label>Especificar Otro Banco</label>
                                <input name="bank_name_other" value={formData.bank_name_other || ''} onChange={handleChange} />
                            </div>
                        )}
                        <div className="form-group"><label>Número de Cuenta</label><input name="bank_account_number" value={formData.bank_account_number || ''} onChange={handleChange} /></div>
                        {/* Other fields */}
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
