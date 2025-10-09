
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import type { Company } from '../../types';

const initialFormData: Partial<Company> = {
    is_distributor: false,
    year: new Date().getFullYear(),
    initial_date: '01/01/2024',
    final_date: '31/12/2024',
    profit_account: '',
    loss_account: '',
    invoices_to_collect_account: '',
    bills_to_collect_account: '',
    vat_account: '',
    other_taxes_account: '',
    proportional_vat: false,
    invoices_to_pay_account: '',
    bills_to_pay_account: '',
    vat_credit_account: '',
    other_taxes_to_pay_account: '',
    fees_to_pay_account: '',
    second_category_retentions_account: '',
    client_fees_account: '',
    retentions_to_pay_account: '',
    retentions_to_collect_account: '',
    cash_equivalent_account: '',
    partner_withdrawal_account: '',
    made_by: '',
    reviewed_by: '',
    approved_by: '',
};

interface AccountGroupProps {
    title: string;
    children: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}

const AccountGroup: React.FC<AccountGroupProps> = ({ title, children, isOpen, onToggle }) => (
    <div className="mb-3">
        <h5 
            onClick={onToggle} 
            style={{ cursor: 'pointer', marginBottom: '1rem', userSelect: 'none' }}
            className="d-flex justify-content-between align-items-center"
            aria-expanded={isOpen}
        >
            {title}
            <span className="material-symbols-outlined">
                {isOpen ? 'expand_less' : 'expand_more'}
            </span>
        </h5>
        {isOpen && (
            <div className="card card-body">
                {children}
            </div>
        )}
    </div>
);

export const CompanySettingsView: React.FC = () => {
    const { companyId } = useParams<{ companyId: string }>();
    const navigate = useNavigate();
    const { companies, accounts, updateCompany, addNotification, handleApiError } = useSession();
    
    const [company, setCompany] = useState<Company | null>(null);
    const [formData, setFormData] = useState<Partial<Company>>(initialFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [openAccordion, setOpenAccordion] = useState<string | null>('Resultados');

    useEffect(() => {
        const companyToLoad = companies.find(c => c.id === Number(companyId));
        if (companyToLoad) {
            setCompany(companyToLoad);
            const existingData = { ...initialFormData, ...companyToLoad };
            setFormData(existingData);
        } else {
            addNotification({ type: 'error', message: 'Empresa no encontrada.' });
            navigate('/configuracion/general/empresas');
        }
    }, [companyId, companies, navigate, addNotification]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleAccordionToggle = (title: string) => {
        setOpenAccordion(openAccordion === title ? null : title);
    };
    
    const handleSave = async () => {
        if (!company) return;
        setIsSaving(true);
        try {
            await updateCompany(company.id, formData);
            addNotification({ type: 'success', message: 'Configuración guardada correctamente.' });
        } catch (error: any) {
            handleApiError(error, 'al guardar la configuración');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (company) {
            setFormData({ ...initialFormData, ...company });
            addNotification({ type: 'info', message: 'Cambios cancelados.' });
        }
    };
    
    const renderAccountInput = (label: string, name: keyof Company) => {
        const accountCode = formData[name] as string || '';
        const account = accounts ? accounts.find(acc => acc.code === accountCode) : null;
        const accountName = account ? account.name : '';

        return (
            <div className="row mb-3 align-items-center">
                <label className="col-lg-3 col-form-label">{label}:</label>
                <div className="col-lg-9">
                    <div className="input-group">
                        <input 
                            type="text" 
                            className="form-control" 
                            name={name} 
                            value={accountCode} 
                            onChange={handleInputChange}
                            style={{ flex: '0 0 120px' }}
                        />
                        <button className="btn btn-outline-secondary d-flex align-items-center" type="button">
                            <span className="material-symbols-outlined" style={{ fontSize: '1.2rem' }}>search</span>
                        </button>
                        <input type="text" className="form-control bg-light" readOnly value={accountName} />
                    </div>
                </div>
            </div>
        );
    };

    if (!company) {
        return <div className="container mt-4"><h2>Cargando configuración...</h2></div>;
    }

    return (
        <div className="container-fluid mt-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h3>Configuración de la Empresa</h3>
                    <p className="text-muted mb-0">Modificación de datos para: <strong>{company.business_name}</strong></p>
                </div>
                <div className="d-flex">
                    <button className="btn btn-primary me-2" onClick={handleSave} disabled={isSaving}>
                        <span className="material-symbols-outlined me-2">save</span>
                        {isSaving ? 'Grabando...' : 'Grabar'}
                    </button>
                    <button className="btn btn-secondary me-2" onClick={handleCancel}>
                        <span className="material-symbols-outlined me-2">cancel</span>
                        Cancelar
                    </button>
                    <button className="btn btn-danger" onClick={() => navigate('/configuracion/general/empresas')}>
                         <span className="material-symbols-outlined me-2">logout</span>
                        Salir
                    </button>
                </div>
            </div>
            
            <div className="card p-4">
                <div className="row">
                    <div className="col-lg-6">
                        <h5>Datos Generales</h5>
                        <hr className="mt-2 mb-3"/>
                        <div className="mb-3">
                            <label htmlFor="business_name" className="form-label">Razón Social:</label>
                            <input type="text" id="business_name" className="form-control bg-light" value={company.business_name} readOnly />
                        </div>

                        <div className="form-check form-switch mb-3">
                            <input className="form-check-input" type="checkbox" role="switch" id="is_distributor" name="is_distributor" checked={formData.is_distributor || false} onChange={handleInputChange}/>
                            <label className="form-check-label" htmlFor="is_distributor">Es Distribuidora (recupera imp. Art. 42)</label>
                        </div>
                        <div className="form-check form-switch mb-3">
                            <input className="form-check-input" type="checkbox" id="proportional_vat" name="proportional_vat" checked={formData.proportional_vat || false} onChange={handleInputChange} />
                            <label className="form-check-label" htmlFor="proportional_vat">Usa IVA Proporcional</label>
                        </div>
                    </div>
                    <div className="col-lg-6">
                        <h5>Periodos</h5>
                         <hr className="mt-2 mb-3"/>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label htmlFor="year" className="form-label">Año de Inicio:</label>
                                <input type="number" id="year" name="year" className="form-control" value={formData.year || ''} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label htmlFor="initial_date" className="form-label">Fecha Inicial Digitación:</label>
                                <input type="text" id="initial_date" name="initial_date" className="form-control" value={formData.initial_date || ''} onChange={handleInputChange} />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label htmlFor="final_date" className="form-label">Fecha Final Digitación:</label>
                                <input type="text" id="final_date" name="final_date" className="form-control" value={formData.final_date || ''} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="my-4" />

                <h5 className="mb-3">Cuentas Contables</h5>
                <div>
                    <AccountGroup title="Resultados" isOpen={openAccordion === 'Resultados'} onToggle={() => handleAccordionToggle('Resultados')}>
                        {renderAccountInput('Cuenta de Ganancia', 'profit_account')}
                        {renderAccountInput('Cuenta de Pérdida', 'loss_account')}
                    </AccountGroup>

                    <AccountGroup title="Ventas" isOpen={openAccordion === 'Ventas'} onToggle={() => handleAccordionToggle('Ventas')}>
                        {renderAccountInput('Facturas por Cobrar', 'invoices_to_collect_account')}
                        {renderAccountInput('Boletas por Cobrar', 'bills_to_collect_account')}
                        {renderAccountInput('Cuenta de IVA Débito', 'vat_account')}
                        {renderAccountInput('Otros Impuestos', 'other_taxes_account')}
                    </AccountGroup>

                    <AccountGroup title="Compras" isOpen={openAccordion === 'Compras'} onToggle={() => handleAccordionToggle('Compras')}>
                        {renderAccountInput('Facturas por Pagar', 'invoices_to_pay_account')}
                        {renderAccountInput('Boletas por Pagar', 'bills_to_pay_account')}
                        {renderAccountInput('Cuenta de IVA Crédito', 'vat_credit_account')}
                        {renderAccountInput('Otros Impuestos por Pagar', 'other_taxes_to_pay_account')}
                    </AccountGroup>

                    <AccountGroup title="Honorarios" isOpen={openAccordion === 'Honorarios'} onToggle={() => handleAccordionToggle('Honorarios')}>
                        {renderAccountInput('Honorarios por Pagar', 'fees_to_pay_account')}
                        {renderAccountInput('Retenciones 2da Categoría', 'second_category_retentions_account')}
                    </AccountGroup>
                    
                    <AccountGroup title="Ingresos Honorarios" isOpen={openAccordion === 'Ingresos Honorarios'} onToggle={() => handleAccordionToggle('Ingresos Honorarios')}>
                        {renderAccountInput('Clientes Honorarios', 'client_fees_account')}
                        {renderAccountInput('Retenciones por Pagar', 'retentions_to_pay_account')}
                        {renderAccountInput('Retenciones por Cobrar', 'retentions_to_collect_account')}
                    </AccountGroup>
                    <AccountGroup title="Flujo Efectivo" isOpen={openAccordion === 'Flujo Efectivo'} onToggle={() => handleAccordionToggle('Flujo Efectivo')}>
                        {renderAccountInput('Equivalente Efectivos', 'cash_equivalent_account')}
                        {renderAccountInput('Cuenta Retiro Socio', 'partner_withdrawal_account')}
                    </AccountGroup>
                </div>
                
                <hr className="my-4"/>

                <h5 className="mb-3">Firmas para Comprobantes Contables</h5>
                <div className="row">
                    <div className="col-md-4">
                        <label className="form-label">Elaborado por:</label>
                        <input type="text" className="form-control" name="made_by" value={formData.made_by || ''} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Revisado por:</label>
                        <input type="text" className="form-control" name="reviewed_by" value={formData.reviewed_by || ''} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Aprobado por:</label>
                        <input type="text" className="form-control" name="approved_by" value={formData.approved_by || ''} onChange={handleInputChange} />
                    </div>
                </div>

            </div>
        </div>
    );
};
