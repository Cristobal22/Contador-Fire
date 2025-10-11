
import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { SimpleReportView } from '../components/Views';
import Modal from '../components/Modal';
import type { Payslip, PayslipData, Employee } from '../types';
import { generatePayslipForEmployee } from '../utils/payrollEngine';

// Componente para el formulario de edición
const PayslipEditForm: React.FC<{ payslip: Payslip, onSave: (data: any) => void, onCancel: () => void, isLoading: boolean }> = ({ payslip, onSave, onCancel, isLoading }) => {
    const [advances, setAdvances] = useState(payslip.breakdown?.advances || 0);

    const handleSave = () => {
        onSave({ ...payslip, breakdown: { ...payslip.breakdown, advances } });
    };
    
    return (
        <div className="modal-body">
            <div className="form-group">
                <label>Anticipos</label>
                <input type="number" value={advances} onChange={(e) => setAdvances(Number(e.target.value))} />
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
                <button type="button" className={`btn btn-primary ${isLoading ? 'loading' : ''}`} onClick={handleSave} disabled={isLoading}>
                    {isLoading && <div className="spinner"></div>}
                    <span className="btn-text">Guardar Cambios</span>
                </button>
            </div>
        </div>
    );
};


const PayslipsView = () => {
    const { addNotification, handleApiError, ...session } = useSession();
    
    // SOLUCIÓN: Proveer arrays vacíos como valor por defecto para evitar el error 'filter of undefined'
    const {
        employees = [],
        institutions = [],
        payslips = [],
        monthlyParameters = [],
        addPayslip,
        deletePayslip,
        updatePayslip,
        activePeriod,
        setActivePeriod
    } = session;

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPayslip, setEditingPayslip] = useState<Payslip | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // El resto del componente puede fallar si activePeriod es null al inicio
    // Lo protegemos estableciendo un valor predeterminado si no existe.
    const safeActivePeriod = activePeriod || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    const currentYear = new Date(safeActivePeriod + '-02').getFullYear();
    const currentMonth = new Date(safeActivePeriod + '-02').getMonth() + 1;

    const handlePeriodChange = (year: number, month: number) => {
        const newPeriod = `${year}-${String(month).padStart(2, '0')}`;
        if (setActivePeriod) setActivePeriod(newPeriod);
    };

    const handleGeneratePayslips = async () => {
        if (!addPayslip || !setActivePeriod) return; // Guard against session functions not being ready

        setIsLoading(true);
        addNotification({ type: 'info', message: 'Iniciando generación de liquidaciones...' });

        const employeesWithPayslip = new Set(payslips.filter(p => p.period === safeActivePeriod).map(p => p.employeeId));
        const employeesToProcess = employees.filter(e => !employeesWithPayslip.has(e.id));

        if (employeesToProcess.length === 0) {
            addNotification({ type: 'warning', message: 'No hay empleados para procesar o ya tienen una liquidación para este período.' });
            setIsLoading(false);
            return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const employee of employeesToProcess) {
            try {
                const result = generatePayslipForEmployee(employee, institutions, safeActivePeriod, monthlyParameters);
                
                const payslipData: PayslipData = {
                    period: result.period,
                    employeeId: result.employeeId,
                    grossPay: result.haberes.totalHaberes,
                    netPay: result.sueldoLiquido,
                    taxableIncome: result.haberes.totalImponible,
                    incomeTax: result.descuentos.impuestoUnico,
                    deductions: [
                        { name: 'Cotización AFP', amount: result.descuentos.cotizacionAFP },
                        { name: 'Cotización Salud', amount: result.descuentos.cotizacionSalud },
                        { name: 'Seguro de Cesantía', amount: result.descuentos.seguroCesantia },
                    ],
                    breakdown: {
                        baseSalary: result.haberes.sueldoBase,
                        gratification: result.haberes.gratificacionLegal,
                        mealAllowance: result.haberes.colacion,
                        transportAllowance: result.haberes.movilizacion,
                    }
                };

                await addPayslip(payslipData);
                successCount++;
            } catch (error: any) {
                errorCount++;
                handleApiError(error, `al generar liquidación para ${employee.name}`);
            }
        }

        addNotification({ type: 'success', message: `Proceso completado: ${successCount} liquidaciones generadas, ${errorCount} errores.` });
        setIsLoading(false);
    };

    const handleEdit = (payslip: Payslip) => {
        setEditingPayslip(payslip);
        setIsEditModalOpen(true);
    };
    
    const handleSave = async (updatedPayslip: any) => {
        if (!updatePayslip) return;
        setIsLoading(true);
        try {
            await updatePayslip(updatedPayslip);
            addNotification({ type: 'success', message: 'Liquidación actualizada.' });
            setIsEditModalOpen(false);
        } catch(error) {
            handleApiError(error, 'al actualizar la liquidación');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteConfirm = async (id: number) => {
        if (!deletePayslip) return;
        if (window.confirm('¿Está seguro de que desea eliminar esta liquidación?')) {
            try {
                await deletePayslip(id);
                addNotification({ type: 'success', message: 'Liquidación eliminada.' });
            } catch (error: any) {
                handleApiError(error, 'al eliminar liquidación');
            }
        }
    };

    const formatCurrency = (value: number) => `$${Math.round(value).toLocaleString('es-CL')}`;
    const filteredPayslips = payslips.filter(p => p.period === safeActivePeriod);

    return (
        <SimpleReportView title="Gestión de Liquidaciones de Sueldo">
            <div className="card-cta">
                 <div className="period-selector">
                    <select value={currentMonth} onChange={(e) => handlePeriodChange(currentYear, Number(e.target.value))}>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(month => 
                            <option key={month} value={month}>{new Date(0, month-1).toLocaleString('es-ES', { month: 'long' })}</option>
                        )}
                    </select>
                    <select value={currentYear} onChange={(e) => handlePeriodChange(Number(e.target.value), currentMonth)}>
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => 
                            <option key={year} value={year}>{year}</option>
                        )}
                    </select>
                </div>
                <button className={`btn btn-primary ${isLoading ? 'loading' : ''}`} onClick={handleGeneratePayslips} disabled={isLoading || !employees.length}>
                     {isLoading && <div className="spinner"></div>}
                    <span className="material-symbols-outlined">play_arrow</span>
                    <span className="btn-text">Generar Liquidaciones para el Período</span>
                </button>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Empleado</th>
                        <th>Sueldo Bruto</th>
                        <th>Total Descuentos</th>
                        <th>Sueldo Líquido</th>
                        <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredPayslips.length > 0 ? filteredPayslips.map(p => {
                        const employee = employees.find(e => e.id === p.employeeId);
                        const totalDeductions = p.deductions.reduce((sum: number, d) => sum + d.amount, 0) + p.incomeTax;
                        return (
                            <tr key={p.id}>
                                <td>{employee?.name || 'Empleado no encontrado'}</td>
                                <td>{formatCurrency(p.grossPay)}</td>
                                <td>{formatCurrency(totalDeductions)}</td>
                                <td><strong>{formatCurrency(p.netPay)}</strong></td>
                                <td className="table-actions">
                                    <button className="btn-icon" title="Editar/Ver Detalles" onClick={() => handleEdit(p)}><span className="material-symbols-outlined">edit</span></button>
                                    <button className="btn-icon" title="Eliminar" onClick={() => handleDeleteConfirm(p.id)}><span className="material-symbols-outlined">delete</span></button>
                                </td>
                            </tr>
                        )
                    }) : (
                        <tr><td colSpan={5}>No hay liquidaciones para el período seleccionado. Use el botón de arriba para generarlas.</td></tr>
                    )}
                </tbody>
            </table>

            {editingPayslip && (
                <Modal 
                    isOpen={isEditModalOpen} 
                    onClose={() => setIsEditModalOpen(false)} 
                    title={`Detalles Liquidación - ${employees.find(e => e.id === editingPayslip.employeeId)?.name}`}
                >
                    <PayslipEditForm
                        payslip={editingPayslip}
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
