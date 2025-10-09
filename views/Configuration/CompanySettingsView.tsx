
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import { Company } from '../../types';

// A default empty state for the form, matching the Company type fields
const initialFormData = {
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

export const CompanySettingsView: React.FC = () => {
    const { companyId } = useParams<{ companyId: string }>();
    const navigate = useNavigate();
    const { companies, activeCompany, updateCompany, addNotification, handleApiError } = useSession();
    
    const [company, setCompany] = useState<Company | null>(null);
    const [formData, setFormData] = useState<Partial<Company>>(initialFormData);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const companyToLoad = companies.find(c => c.id === Number(companyId)) || activeCompany;
        if (companyToLoad) {
            setCompany(companyToLoad);
            // Populate form with existing data, using defaults for any missing fields
            const existingData = { ...initialFormData, ...companyToLoad };
            setFormData(existingData);
        } else {
             navigate('/empresas');
        }
    }, [companyId, companies, activeCompany, navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    
    const handleSave = async () => {
        if (!company) return;
        setIsSaving(true);
        try {
            // We only pass the formData which is a Partial<Company>
            await updateCompany(company.id, formData);
            addNotification({ type: 'success', message: 'Configuración guardada correctamente.' });
        } catch (error: any) {
            handleApiError(error, 'al guardar la configuración');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        // Reset form to the company's current state
        if (company) {
            const existingData = { ...initialFormData, ...company };
            setFormData(existingData);
            addNotification({ type: 'success', message: 'Cambios cancelados.' });
        }
    };

    const handleExit = () => {
        navigate('/empresas');
    };
    
    const renderAccountInput = (label: string, name: keyof Company, accountName: string) => (
        <div className="row mb-2 align-items-center">
            <label className="col-sm-2 col-form-label text-end">{label}:</label>
            <div className="col-sm-2">
                <input type="text" className="form-control" name={name} value={formData[name] || ''} onChange={handleInputChange} />
            </div>
            <div className="col-sm-1">
                <button className="btn btn-outline-secondary" type="button">Buscar</button>
            </div>
            <div className="col-sm-7">
                <input type="text" className="form-control bg-light" readOnly value={accountName} />
            </div>
        </div>
    );

    if (!company) {
        return <div className="container mt-4"><h2>Cargando configuración...</h2></div>;
    }

    return (
        <div className="container mt-4">
            <h3>Configuración</h3>
            <p className="text-muted">Modificación de datos</p>
            
            <div className="card p-4">
                <div className="row mb-3">
                    <div className="col-md-8">
                        <div className="form-check form-switch mb-2">
                            <input className="form-check-input" type="checkbox" role="switch" id="is_distributor" name="is_distributor" checked={formData.is_distributor || false} onChange={handleInputChange}/>
                            <label className="form-check-label" htmlFor="is_distributor">Es Distribuidora (recupera imp. Art. 42)</label>
                        </div>
                        <div className="row align-items-center">
                           <label htmlFor="business_name" className="col-sm-2 col-form-label">Empresa:</label>
                            <div className="col-sm-10">
                                <input type="text" id="business_name" className="form-control bg-light" value={company.business_name} readOnly />
                            </div>
                        </div>
                    </div>
                    <div className="col-md-4">
                        <label htmlFor="year" className="form-label">Año de Inicio:</label>
                        <input type="number" id="year" name="year" className="form-control" value={formData.year || ''} onChange={handleInputChange} />
                    </div>
                </div>

                <h5 className="mt-3 mb-3">Periodo de Digitación</h5>
                <div className="row mb-4">
                    <div className="col-md-6">
                        <label htmlFor="initial_date" className="form-label">Fecha inicial</label>
                        <input type="text" id="initial_date" name="initial_date" className="form-control" value={formData.initial_date || ''} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-6">
                        <label htmlFor="final_date" className="form-label">Fecha final</label>
                        <input type="text" id="final_date" name="final_date" className="form-control" value={formData.final_date || ''} onChange={handleInputChange} />
                    </div>
                </div>

                <hr/>
                
                <h5 className="mt-3">Cuentas</h5>
                {renderAccountInput('Cuenta de Ganancia', 'profit_account', 'PERDIDAS Y GANANCIAS EJERCICIO')}
                {renderAccountInput('Cuenta de Pérdida', 'loss_account', 'PERDIDAS Y GANANCIAS EJERCICIO')}
                
                <h5 className="mt-4">Ventas</h5>
                {renderAccountInput('Facturas por Cobrar', 'invoices_to_collect_account', 'CLIENTES')}
                {renderAccountInput('Boletas por Cobrar', 'bills_to_collect_account', 'CLIENTES')}
                {renderAccountInput('Cuenta de IVA', 'vat_account', 'IVA DEBITO FISCAL')}
                {renderAccountInput('Otros Impuestos', 'other_taxes_account', 'OTROS IMPUESTOS')}

                <h5 className="mt-4">Compras</h5>
                 <div className="form-check mb-3 ms-2">
                    <input className="form-check-input" type="checkbox" id="proportional_vat" name="proportional_vat" checked={formData.proportional_vat || false} onChange={handleInputChange} />
                    <label className="form-check-label" htmlFor="proportional_vat">IVA Proporcional</label>
                </div>
                {renderAccountInput('Facturas por Pagar', 'invoices_to_pay_account', 'PROVEEDORES')}
                {renderAccountInput('Boletas por Pagar', 'bills_to_pay_account', 'PROVEEDORES')}
                {renderAccountInput('Cuenta de IVA', 'vat_credit_account', 'IVA CREDITO FISCAL')}
                {renderAccountInput('Otros Impuestos', 'other_taxes_to_pay_account', 'OTROS IMPUESTOS')}

                <h5 className="mt-4">Honorarios</h5>
                {renderAccountInput('Honorarios por Pagar', 'fees_to_pay_account', 'HONORARIOS POR PAGAR')}
                {renderAccountInput('Retenciones 2da Categoría', 'second_category_retentions_account', 'RETENCION IMPUESTO HONORARIOS')}
                
                <h5 className="mt-4">Ingresos Honorarios</h5>
                {renderAccountInput('Clientes Honorarios', 'client_fees_account', 'HONORARIOS POR COBRAR')}
                {renderAccountInput('Retenciones por Pagar', 'retentions_to_pay_account', 'RETENCION INGRESO HONORARIO')}
                {renderAccountInput('Retenciones por Cobrar', 'retentions_to_collect_account', 'RETENCION HONORARIO POR COBRAR')}

                <h5 className="mt-4">Flujo Efectivo</h5>
                {renderAccountInput('Equivalente Efectivos', 'cash_equivalent_account', 'EFECTIVO Y EQUIVALENTE')}
                {renderAccountInput('Cuenta Retiro Socio', 'partner_withdrawal_account', 'CUENTAS CORRIENTES DE SOCIOS')}

                <h5 className="mt-4">Firma Comprobante Contable</h5>
                <div className="row mb-4">
                    <div className="col-md-4">
                        <label className="form-label">Elaborado:</label>
                        <input type="text" className="form-control" name="made_by" value={formData.made_by || ''} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Revisado:</label>
                        <input type="text" className="form-control" name="reviewed_by" value={formData.reviewed_by || ''} onChange={handleInputChange} />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label">Aprobado:</label>
                        <input type="text" className="form-control" name="approved_by" value={formData.approved_by || ''} onChange={handleInputChange} />
                    </div>
                </div>

                <div className="d-flex justify-content-end mt-4">
                    <button className="btn btn-primary me-2" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Grabando...' : 'Grabar'}
                    </button>
                    <button className="btn btn-secondary me-2" onClick={handleCancel}>Cancelar</button>
                    <button className="btn btn-danger" onClick={handleExit}>Salir</button>
                </div>
            </div>
        </div>
    );
};
