
import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { SimpleReportView } from '../components/Views';
import Modal from '../components/Modal';
import type { Payslip, Employee } from '../types';
import { generatePayslipForEmployee } from '../utils/payrollEngine';

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
    const {
        addNotification,
        handleApiError,
        employees,
        institutions,
        payslips,
        monthlyParameters,
        addPayslip,
        deletePayslip,
        updatePayslip,
        activePeriod,
        setActivePeriod
    } = useSession();
    
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPayslip, setEditingPayslip] = useState<Payslip | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handlePeriodChange = (year: number, month: number) => {
        const newPeriod = `${year}-${String(month).padStart(2, '0')}`;
        setActivePeriod(newPeriod);
    };

    const handleGeneratePayslips = async () => {
        setIsLoading(true);
        addNotification({ type: 'info', message: 'Iniciando generación de liquidaciones...' });

        const employeesWithPayslip = new Set(payslips.filter(p => p.period === activePeriod).map(p => p.employeeId));
        const employeesToProcess = employees.filter(e => !employeesWithPayslip.has(e.id));

        if (employeesToProcess.length === 0) {
            addNotification({ type: 'warning', message: 'No hay empleados para procesar o ya tienen una liquidación para este período.' });
            setIsLoading(false);
            return;
        }

        let successCount = 0;
        for (const employee of employeesToProcess) {
            try {
                const result = generatePayslipForEmployee(employee, institutions, activePeriod, monthlyParameters);
                await addPayslip(result.payslipData);
                successCount++;
            } catch (error: any) {
                handleApiError(error, `al generar liquidación para ${employee.name}`);
            }
        }

        addNotification({ type: 'success', message: `Proceso completado: ${successCount} liquidaciones generadas.` });
        setIsLoading(false);
    };

    const handleEdit = (payslip: Payslip) => {
        setEditingPayslip(payslip);
        setIsEditModalOpen(true);
    };
    
    const handleSave = async (updatedPayslip: any) => {
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
    const filteredPayslips = payslips.filter(p => p.period === activePeriod);

    return (
        <SimpleReportView title="Gestión de Liquidaciones de Sueldo">
             {/* ... UI elements like period selector and generate button ... */}
            <table>
                <thead>
                    <tr>
                        <th>Empleado</th>
                        <th>Alcance Líquido</th>
                        <th>Total Descuentos</th>
                        <th>Sueldo Líquido</th>
                        <th>Acciones</th>
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
                                    <button className="btn-icon" onClick={() => handleEdit(p)}>edit</button>
                                    <button className="btn-icon danger" onClick={() => handleDeleteConfirm(p.id)}>delete</button>
                                </td>
                            </tr>
                        );
                    }) : (
                        <tr><td colSpan={5}>No hay liquidaciones para el período seleccionado.</td></tr>
                    )}
                </tbody>
            </table>

            {editingPayslip && (
                <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Detalles Liquidación`}>
                    <PayslipEditForm payslip={editingPayslip} onSave={handleSave} onCancel={() => setIsEditModalOpen(false)} isLoading={isLoading} />
                </Modal>
            )}
        </SimpleReportView>
    );
};

export default PayslipsView;
