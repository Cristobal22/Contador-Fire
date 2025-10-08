import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useSession } from '../context/SessionContext';
import { SimpleReportView } from '../components/Views';
import { Modal } from '../components/Modal';
import { GenericForm } from '../components/Forms';
import { PayslipData, Payslip } from '../types';

const PayslipForm: React.FC<{ initialData: Payslip, onSave: (data: Payslip) => void, onCancel: () => void, isLoading: boolean }> = ({ initialData, onSave, onCancel, isLoading }) => {
    const { employees, institutions, monthlyParameters, incomeTaxBrackets, activePeriod } = useSession();
    const [formData, setFormData] = useState(initialData.breakdown || {});
    
    // Calculated Totals State
    const [totals, setTotals] = useState({
        taxable: 0, nonTaxable: 0, gross: 0,
        afp: 0, health: 0, unemployment: 0, incomeTax: 0,
        totalDeductions: 0, net: 0,
    });
    
    const employee = useMemo(() => employees.find(e => e.id === initialData.employeeId), [employees, initialData.employeeId]);
    
    const recalculateTotals = useCallback(() => {
        if (!employee) return;
        
        const afpData = institutions.find(i => i.id === employee.afpId);
        const topeImponible = monthlyParameters.find(p => p.period === activePeriod && p.name === 'Tope Imponible')?.value || 0;
        const utm = monthlyParameters.find(p => p.period === activePeriod && p.name === 'UTM')?.value || 0;
        if (!afpData || !topeImponible || !utm) return;

        const baseSalary = Number(formData.baseSalary) || 0;
        const gratification = Number(formData.gratification) || 0;
        
        const taxable = baseSalary + gratification;
        const nonTaxable = (Number(formData.mealAllowance) || 0) + (Number(formData.transportAllowance) || 0);
        const gross = taxable + nonTaxable;

        const imponibleBase = Math.min(taxable, topeImponible);
        
        const afpRate = 10 + (afpData.rate || 0);
        const afp = Math.round(imponibleBase * (afpRate / 100));
        const health = Math.round(imponibleBase * 0.07);
        const unemployment = Math.round(imponibleBase * 0.006);
        const previsionalDeductions = afp + health + unemployment;
        
        const incomeTaxBase = taxable - previsionalDeductions;
        let incomeTax = 0;
        if (incomeTaxBase > 0) {
            const taxBracketsForPeriod = incomeTaxBrackets.filter(b => b.period === activePeriod);
            const incomeTaxBaseInUTM = incomeTaxBase / utm;
            const bracket = taxBracketsForPeriod.find(b => incomeTaxBaseInUTM > b.fromUTM && (b.toUTM === null || incomeTaxBaseInUTM <= b.toUTM));
            if (bracket) {
                const taxInUTM = (incomeTaxBaseInUTM * bracket.factor) - bracket.rebateUTM;
                incomeTax = Math.round(Math.max(0, taxInUTM * utm));
            }
        }
        
        const advances = Number(formData.advances) || 0;
        const totalDeductions = previsionalDeductions + incomeTax + advances;
        const net = gross - totalDeductions;
        
        setTotals({ taxable, nonTaxable, gross, afp, health, unemployment, incomeTax, totalDeductions, net });

    }, [formData, employee, institutions, monthlyParameters, incomeTaxBrackets, activePeriod]);

    useEffect(() => {
        recalculateTotals();
    }, [recalculateTotals]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        const finalDeductions = [
            { name: `Cotización AFP ${institutions.find(i => i.id === employee?.afpId)?.name}`, amount: totals.afp },
            { name: 'Cotización Salud', amount: totals.health },
            { name: 'Seguro de Cesantía', amount: totals.unemployment },
        ];
        if (totals.incomeTax > 0) {
            finalDeductions.push({ name: 'Impuesto Único', amount: totals.incomeTax });
        }
        if (formData.advances > 0) {
            finalDeductions.push({ name: 'Anticipos', amount: Number(formData.advances) });
        }
        
        const updatedPayslip: Payslip = {
            ...initialData,
            grossPay: totals.gross,
            taxableIncome: totals.taxable,
            incomeTax: totals.incomeTax,
            deductions: finalDeductions,
            netPay: totals.net,
            breakdown: formData,
        };
        onSave(updatedPayslip);
    };

    const formatCurrency = (value: number) => value.toLocaleString('es-CL');
    
    return (
        <div className="modal-body">
            <div className="payslip-form-grid">
                <div className="payslip-col-main">
                    <div className="payslip-section">
                        <h4><span className="material-symbols-outlined" style={{color: 'var(--success-color)'}}>add_card</span>Haberes</h4>
                        <div className="payslip-input-grid">
                            <label>Días Trabajados</label>
                            <input type="number" name="daysWorked" value={formData.daysWorked || ''} onChange={handleInputChange} />
                             <label>Sueldo Base</label>
                            <input type="number" name="baseSalary" value={formData.baseSalary || ''} onChange={handleInputChange} />
                            <label>Gratificación</label>
                            <input type="number" name="gratification" value={formData.gratification || ''} onChange={handleInputChange} />
                        </div>
                        <div className="payslip-total-row"><span>Total Imponible</span><span>{formatCurrency(totals.taxable)}</span></div>
                        <div className="payslip-input-grid" style={{marginTop: '16px'}}>
                             <label>Colación</label>
                            <input type="number" name="mealAllowance" value={formData.mealAllowance || ''} onChange={handleInputChange} />
                             <label>Movilización</label>
                            <input type="number" name="transportAllowance" value={formData.transportAllowance || ''} onChange={handleInputChange} />
                        </div>
                         <div className="payslip-total-row"><span>Total No Imponible</span><span>{formatCurrency(totals.nonTaxable)}</span></div>
                         <div className="payslip-total-row" style={{backgroundColor: 'var(--hover-bg)'}}><span>Total Haberes</span><span>{formatCurrency(totals.gross)}</span></div>
                    </div>
                     <div className="payslip-section">
                        <h4><span className="material-symbols-outlined" style={{color: 'var(--error-color)'}}>do_not_disturb_on</span>Descuentos</h4>
                        <div className="payslip-input-grid">
                             <label>Cotización AFP</label>
                            <input type="number" value={totals.afp} readOnly />
                            <label>Cotización Salud (7%)</label>
                            <input type="number" value={totals.health} readOnly />
                            <label>Seguro Cesantía</label>
                            <input type="number" value={totals.unemployment} readOnly />
                        </div>
                        <div className="payslip-total-row"><span>Total Descuentos Previsionales</span><span>{formatCurrency(totals.afp + totals.health + totals.unemployment)}</span></div>

                        <div className="payslip-input-grid" style={{marginTop: '16px'}}>
                            <label>Impuesto Único</label>
                            <input type="number" value={totals.incomeTax} readOnly />
                        </div>

                         <div className="payslip-input-grid" style={{marginTop: '16px'}}>
                           <label>Anticipos</label>
                           <input type="number" name="advances" value={formData.advances || ''} onChange={handleInputChange} />
                        </div>
                        <div className="payslip-total-row" style={{backgroundColor: 'var(--hover-bg)'}}><span>Total Descuentos</span><span>{formatCurrency(totals.totalDeductions)}</span></div>
                    </div>
                </div>
                <div className="payslip-col-actions">
                    <div className="payslip-section">
                        <div className="payslip-final-total-section">
                            <span>Total Líquido</span>
                            <strong>{formatCurrency(totals.net)}</strong>
                        </div>
                    </div>
                </div>
            </div>
             <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
                <button type="button" className={`btn btn-primary ${isLoading ? 'loading' : ''}`} disabled={isLoading} onClick={handleSave}>
                    {isLoading && <div className="spinner"></div>}
                    <span className="btn-text">Guardar Cambios</span>
                </button>
            </div>
        </div>
    )
}


const PayslipsView = () => {
    const { addNotification, handleApiError, ...session } = useSession();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPayslip, setEditingPayslip] = useState<Payslip | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const employeesWithPayslip = useMemo(() => 
        new Set((session.payslips || []).filter(p => p.period === session.activePeriod).map(p => p.employeeId)),
        [session.payslips, session.activePeriod]
    );

    const availableEmployees = (session.employees || []).filter(e => !employeesWithPayslip.has(e.id));
    const employeeOptions = availableEmployees.map(e => ({ value: e.id, label: e.name }));

    const handleCreate = async (data: { employeeId: number }) => {
        setIsLoading(true);
        const payslipData: PayslipData = { period: session.activePeriod, employeeId: data.employeeId };
        try {
            await session.addPayslip(payslipData);
            addNotification({ type: 'success', message: 'Liquidación generada con éxito.' });
            setIsCreateModalOpen(false);
        } catch (error: any) {
            handleApiError(error, 'al generar liquidación');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (payslip: Payslip) => {
        setEditingPayslip(payslip);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Está seguro de que desea eliminar esta liquidación?')) {
            try {
                await session.deletePayslip(id);
                addNotification({ type: 'success', message: 'Liquidación eliminada.' });
            } catch (error: any) {
                handleApiError(error, 'al eliminar liquidación');
            }
        }
    };

    const handleSave = async (updatedPayslip: Payslip) => {
        setIsLoading(true);
        try {
            await session.updatePayslip(updatedPayslip);
            addNotification({ type: 'success', message: 'Liquidación actualizada con éxito.' });
            setIsEditModalOpen(false);
            setEditingPayslip(null);
        } catch (error: any) {
             handleApiError(error, 'al actualizar liquidación');
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <SimpleReportView title="Liquidaciones">
            <div style={{ marginBottom: '16px' }}>
                <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)} disabled={availableEmployees.length === 0}>
                    <span className="material-symbols-outlined">add</span>
                    {availableEmployees.length > 0 ? 'Generar Liquidación' : 'Todos los empleados liquidados'}
                </button>
            </div>
            <table>
                <thead>
                    <tr><th>Período</th><th>Empleado</th><th>Sueldo Bruto</th><th>Total Descuentos</th><th>Sueldo Líquido</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    {session.payslips.length > 0 ? session.payslips.map(p => {
                        const totalDeductions = p.deductions.reduce((sum: number, d) => sum + d.amount, 0);
                        return (
                            <tr key={p.id}>
                                <td>{p.period}</td>
                                <td>{session.employees.find(e => e.id === p.employeeId)?.name}</td>
                                <td>{p.grossPay}</td>
                                <td>{totalDeductions}</td>
                                <td>{p.netPay}</td>
                                <td>
                                    <button className="btn-icon" title="Editar" onClick={() => handleEdit(p)}><span className="material-symbols-outlined">edit</span></button>
                                    <button className="btn-icon" title="Eliminar" onClick={() => handleDelete(p.id)}><span className="material-symbols-outlined">delete</span></button>
                                </td>
                            </tr>
                        )
                    }) : <tr><td colSpan={6}>No hay registros.</td></tr>}
                </tbody>
            </table>
             <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Generar Nueva Liquidación">
                <GenericForm<{employeeId: number}>
                    onSave={handleCreate}
                    onCancel={() => setIsCreateModalOpen(false)}
                    initialData={{ employeeId: employeeOptions[0]?.value || 0 }}
                    fields={[ { name: 'employeeId', label: 'Empleado', type: 'select', options: employeeOptions }]}
                    isLoading={isLoading}
                />
            </Modal>
             {editingPayslip && (
                <Modal 
                    isOpen={isEditModalOpen} 
                    onClose={() => setIsEditModalOpen(false)} 
                    title={`Editar Liquidación - ${session.employees.find(e => e.id === editingPayslip.employeeId)?.name}`} 
                    size="lg" 
                    className="modal-payslip"
                >
                    <PayslipForm
                        initialData={editingPayslip}
                        onSave={handleSave}
                        onCancel={() => setIsEditModalOpen(false)}
                        isLoading={isLoading}
                    />
                </Modal>
            )}
        </SimpleReportView>
    );
};

export default PayslipsView;