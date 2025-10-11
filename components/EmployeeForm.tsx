import React, { useState, useEffect } from 'react';
import type { Employee, EmployeeData, Institution, CostCenter } from '../types';
import { formatRut, parseRut } from '../utils/format';
import { regions } from '../data/geography';
import { contractTypes, workdayTypes, paymentTypes, taxTypes, apvPaymentMethods, workerTypes } from '../data/payroll';

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
            second_compensation_fund_id: 0,
            hireDate: new Date().toISOString().split('T')[0],
            weekly_hours: 44,
            has_unemployment_insurance: false,
            compensation_fund_branch: '',
            payment_type: 'DEPOSITO',
            fixed_term_period_from: '',
            fixed_term_period_to: '',
            worker_type: 'ACTIVO',
            apv_payment_method: 'PLANILLA',
            apv2_payment_method: 'PLANILLA',
            apvc_payment_method: 'PLANILLA',
            tax_type: 'AFECTO',
            contract_address: '',
            contract_region: '',
            contract_commune: '',
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
        } else if (e.target.nodeName === 'SELECT' && (e.target as HTMLSelectElement).multiple === false) {
             const numericValue = Number(value);
             if (!isNaN(numericValue) && value.trim() !== '') {
                processedValue = numericValue;
             }
        }
        
        setFormData(prev => {
            const newFormData = { ...prev, [name]: processedValue };
            // Reset commune when region changes
            if (name === 'region') {
                newFormData.commune = '';
            }
            if (name === 'contract_region') {
                newFormData.contract_commune = '';
            }
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
    const bankOptions = institutions.filter(i => i.type === 'Banco').map(i => ({ value: i.id, label: i.name }));
    const ccafOptions = institutions.filter(i => i.type === 'CCAF').map(i => ({ value: i.id, label: i.name }));
    const costCenterOptions = costCenters.map(c => ({ value: c.code, label: `${c.code} - ${c.name}` }));


    return (
        <form onSubmit={handleSubmit} className="employee-form">
            <div className="modal-body">
                <FormSection title="Datos Personales">
                    <div className="grid-col-3">
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

                <FormSection title="Sueldo">
                    <div className="grid-col-3">
                        <div className="form-group"><label>Sueldo Mensual</label><input type="number" name="baseSalary" value={formData.baseSalary || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>Sueldo Mensual en UF</label><input type="number" name="monthly_salary_uf" value={formData.monthly_salary_uf || 0} readOnly /></div>
                        <div className="form-group"><label>Sueldo Diario</label><input type="number" name="daily_salary" value={formData.daily_salary || 0} readOnly /></div>
                        <div className="form-group"><label>Sueldo X Hora</label><input type="number" name="hourly_salary" value={formData.hourly_salary || 0} readOnly /></div>
                        <div className="form-group"><label>Sueldo Empresarial</label><input type="number" name="business_salary" value={formData.business_salary || 0} onChange={handleChange} /></div>
                    </div>
                </FormSection>

                <FormSection title="Previsión">
                    <div className="grid-col-3">
                        <div className="form-group"><label>Isapre</label><select name="healthId" value={formData.healthId} onChange={handleChange}>{healthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                        <div className="form-group"><label>FUN Isapre</label><input name="fun_isapre" value={formData.fun_isapre || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Cotización Salud UF</label><input type="number" name="health_contribution_uf" value={formData.health_contribution_uf || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>Cotización Salud Pesos</label><input type="number" name="health_contribution_pesos" value={formData.health_contribution_pesos || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>% Salud Colectivo</label><input type="number" name="collective_health_percentage" value={formData.collective_health_percentage || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>AFP</label><select name="afpId" value={formData.afpId} onChange={handleChange}>{afpOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                        <div className="form-group">
                            <label>Tipo Trabajador</label>
                            <select name="worker_type" value={formData.worker_type || ''} onChange={handleChange}>
                                <option value="">Seleccione</option>
                                {workerTypes.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label>Cuenta 2 AFP</label><input type="number" name="afp_account_2" value={formData.afp_account_2 || 0} onChange={handleChange} /></div>
                        <div className="form-group">
                            <label>Seguro de Cesantía Trabajador</label>
                            <select name="has_unemployment_insurance" value={formData.has_unemployment_insurance ? 'true' : 'false'} onChange={handleChange}>
                                <option value="true">Sí</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Seguro de Cesantía Empleador</label><button type="button" className="btn">Seguro AFC</button></div>
                        <div className="form-group"><label>Número de Cargas</label><input type="number" name="family_dependents" value={formData.family_dependents || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>APV</label><input type="number" name="apv_amount" value={formData.apv_amount || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>APV UF</label><input type="number" name="apv_amount_uf" value={formData.apv_amount_uf || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>Empresa APV</label><select name="apv_provider_id" value={formData.apv_provider_id || ''} onChange={handleChange}><option value="">Seleccione...</option>{afpOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                        <div className="form-group">
                            <label>Forma de Pago APV</label>
                            <select name="apv_payment_method" value={formData.apv_payment_method || ''} onChange={handleChange}>
                                <option value="">Seleccione...</option>
                                {apvPaymentMethods.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label>Reg. Letra</label><select name="apv_regime_letter" value={formData.apv_regime_letter || 'B'} onChange={handleChange}><option value="A">A</option><option value="B">B</option></select></div>
                        <div className="form-group">
                            <label>Tipo de Impuesto</label>
                            <select name="tax_type" value={formData.tax_type || ''} onChange={handleChange}>
                                <option value="">Seleccione</option>
                                {taxTypes.map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Trabajador Agrícola</label>
                            <select name="is_agricultural_worker" value={formData.is_agricultural_worker ? 'true' : 'false'} onChange={handleChange}>
                                <option value="true">Sí</option>
                                <option value="false">No</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Préstamo Solidario</label><input type="number" name="solidarity_loan" value={formData.solidarity_loan || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>APV2</label><input type="number" name="apv2_amount_uf" value={formData.apv2_amount_uf || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>Empresa APV2</label><select name="apv2_provider_id" value={formData.apv2_provider_id || ''} onChange={handleChange}><option value="">Seleccione...</option>{afpOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                        <div className="form-group"><label>Empresa APV Colectivo</label><input type="number" name="collective_apv_amount" value={formData.collective_apv_amount || 0} onChange={handleChange} /></div>
                        <div className="form-group">
                            <label>Forma de Pago APV2</label>
                            <select name="apv2_payment_method" value={formData.apv2_payment_method || ''} onChange={handleChange}>
                                <option value="">Seleccione...</option>
                                {apvPaymentMethods.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label>Reg. Letra</label><input value="B" readOnly /></div>
                        <div className="form-group"><label>APV Colectivo</label><input type="number" name="collective_apv_amount" value={formData.collective_apv_amount || 0} onChange={handleChange} /></div>
                        <div className="form-group">
                            <label>Forma de Pago APVC</label>
                            <select name="apvc_payment_method" value={formData.apvc_payment_method || ''} onChange={handleChange}>
                                <option value="">Seleccione...</option>
                                {apvPaymentMethods.map(m => <option key={m.code} value={m.code}>{m.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label>Reg. Letra</label><input value="B" readOnly /></div>
                        <div className="form-group"><label>APV Colectivo UF</label><input type="number" name="collective_apv_amount_uf" value={formData.collective_apv_amount_uf || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>% Trabajador APVC</label><input type="number" name="apvc_worker_percentage" value={formData.apvc_worker_percentage || 0} onChange={handleChange} /></div>
                        <div className="form-group">
                            <label>Caja de Compensación</label>
                            <select name="compensation_fund_id" value={formData.compensation_fund_id || ''} onChange={handleChange}>
                                <option value="">Seleccione...</option>
                                {ccafOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label>Préstamo Caja</label><input type="number" name="caja_loan" value={formData.caja_loan || 0} onChange={handleChange} /></div>
                        <div className="form-group">
                            <label>2nda Caja de Compensación</label>
                            <select name="second_compensation_fund_id" value={formData.second_compensation_fund_id || ''} onChange={handleChange}>
                                <option value="">Seleccione...</option>
                                {ccafOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label>Préstamo 2da Caja</label><input type="number" name="caja_loan_2" value={formData.caja_loan_2 || 0} onChange={handleChange} /></div>
                        <div className="form-group">
                            <label>Seguro de Accidente</label>
                            <select name="has_accident_insurance" value={formData.has_accident_insurance ? 'true' : 'false'} onChange={handleChange}>
                                <option value="true">SI</option>
                                <option value="false">NO</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Fecha de Primera Afiliación a Entidad Previsional</label><input type="date" name="first_pension_affiliation_date" value={formData.first_pension_affiliation_date || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Afiliado Voluntario</label><input type="checkbox" name="is_voluntary_affiliate" checked={formData.is_voluntary_affiliate || false} onChange={handleChange} /></div>
                    </div>
                </FormSection>
                
                <FormSection title="Contrato">
                     <div className="grid-col-3">
                        <div className="form-group"><label>Fecha Contrato (dd/mm/aaaa)</label><input type="date" name="hireDate" value={formData.hireDate} onChange={handleChange} /></div>
                        <div className="form-group"><label>Fecha Término Contrato</label><input type="date" name="contract_end_date" value={formData.contract_end_date || ''} onChange={handleChange} /></div>
                        <div className="form-group">
                            <label>Cláusula de Término</label>
                            <select name="termination_clause" value={formData.termination_clause || ''} onChange={handleChange}>
                                <option value="">Seleccione</option>
                                {contractTypes.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label>Colación Mensual</label><input type="number" name="monthly_meal_allowance" value={formData.monthly_meal_allowance || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>Colación Diaria</label><input type="number" name="daily_meal_allowance" value={formData.daily_meal_allowance || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>Movilización Mensual</label><input type="number" name="monthly_transport_allowance" value={formData.monthly_transport_allowance || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>Movilización Diaria</label><input type="number" name="daily_transport_allowance" value={formData.daily_transport_allowance || 0} onChange={handleChange} /></div>
                        <div className="form-group">
                            <label>Tipo de Jornada</label>
                            <select name="workday_type" value={formData.workday_type || ''} onChange={handleChange}>
                                <option value="">Seleccione</option>
                                {workdayTypes.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label>Dirección del Contrato</label><input name="contract_address" value={formData.contract_address || ''} onChange={handleChange} /></div>
                        <div className="form-group">
                            <label>Región del Contrato</label>
                            <select name="contract_region" value={formData.contract_region || ''} onChange={handleChange}>
                                <option value="">Seleccione una región</option>
                                {regions.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Comuna del Contrato</label>
                            <select name="contract_commune" value={formData.contract_commune || ''} onChange={handleChange} disabled={!formData.contract_region}>
                                <option value="">Seleccione una comuna</option>
                                {contractCommuneOptions.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label>Sucursal (Caja)</label><input name="compensation_fund_branch" value={formData.compensation_fund_branch || ''} onChange={handleChange} /></div>
                        <div className="form-group">
                            <label>Tipo de Pago</label>
                            <select name="payment_type" value={formData.payment_type || ''} onChange={handleChange}>
                                <option value="">Seleccione</option>
                                {paymentTypes.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label>Período Desde</label><input type="date" name="fixed_term_period_from" value={formData.fixed_term_period_from || ''} onChange={handleChange} /></div>
                        <div className="form-group"><label>Período Hasta</label><input type="date" name="fixed_term_period_to" value={formData.fixed_term_period_to || ''} onChange={handleChange} /></div>
                    </div>
                </FormSection>

                <FormSection title="Horas Extras">
                    <div className="grid-col-3">
                        <div className="form-group"><label>Horas Trabajadas</label><input type="number" name="weekly_hours" value={formData.weekly_hours || 44} onChange={handleChange} /></div>
                        <div className="form-group"><label>Días de la semana Part Time</label><input type="number" name="part_time_days" value={formData.part_time_days || 0} onChange={handleChange} /></div>
                        <div className="form-group">
                            <label>Usar Sueldo Mínimo</label>
                            <select name="use_minimum_wage" value={formData.use_minimum_wage ? 'true' : 'false'} onChange={handleChange}>
                                <option value="true">SI</option>
                                <option value="false">NO</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Factor Especial Horas Extra Valor Normal</label><input name="overtime_factor" value={formData.overtime_factor || 0.00795454} readOnly /></div>
                        <div className="form-group"><button type="button" className="btn">Calcular Factor</button></div>
                    </div>
                </FormSection>

                <FormSection title="Otros">
                    <div className="grid-col-3">
                        <div className="form-group"><label>Porcentaje Trabajo Pesado Trabajador</label><input type="number" name="heavy_work_worker_percentage" value={formData.heavy_work_worker_percentage || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>Porcentaje Trabajo Pesado Empleador</label><input type="number" name="heavy_work_employer_percentage" value={formData.heavy_work_employer_percentage || 0} onChange={handleChange} /></div>
                        <div className="form-group">
                            <label>Persona con Discapacidad - Pensionado por Invalidez</label>
                            <select name="is_disabled" value={formData.is_disabled ? 'true' : 'false'} onChange={handleChange}>
                                <option value="true">SI</option>
                                <option value="false">NO</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Días Vacaciones Progresivas (Ej.0)</label><input type="number" name="progressive_vacation_days" value={formData.progressive_vacation_days || 0} onChange={handleChange} /></div>
                        <div className="form-group"><label>Años para iniciar Vacaciones Prog. (Ej.3)</label><input type="number" name="years_for_progressive_vacation" value={formData.years_for_progressive_vacation || 0} onChange={handleChange} /></div>
                        <div className="form-group">
                            <label>Tecnico Extranjero Exención Cot. Previsionales</label>
                            <select name="is_foreign_tech_pension_exempt" value={formData.is_foreign_tech_pension_exempt ? 'true' : 'false'} onChange={handleChange}>
                                <option value="true">SI</option>
                                <option value="false">NO</option>
                            </select>
                        </div>
                        <div className="form-group"><label>Tiene Ficha Covid</label><input name="has_covid_record" readOnly /></div>
                        <div className="form-group"><label>Banco</label><select name="bank_id" value={formData.bank_id || ''} onChange={handleChange}><option value="">Seleccione...</option>{bankOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
                        <div className="form-group"><label>Número de Cuenta</label><input name="bank_account_number" value={formData.bank_account_number || ''} onChange={handleChange} /></div>
                        <div className="form-group">
                            <label>Es Zona Extrema</label>
                            <select name="is_extreme_zone" value={formData.is_extreme_zone ? 'true' : 'false'} onChange={handleChange}>
                                <option value="true">SI</option>
                                <option value="false">NO</option>
                            </select>
                        </div>
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
