import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { Modal } from '../components/Modal';
import { FeeInvoiceForm } from '../components/Forms';
import type { FeeInvoiceData } from '../types';

const FeeInvoicesView: React.FC = () => {
    const { feeInvoices, addFeeInvoice, subjects, addNotification, handleApiError } = useSession();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSave = async (feeInvoiceData: FeeInvoiceData) => {
        setIsLoading(true);
        try {
            await addFeeInvoice(feeInvoiceData);
            addNotification({ type: 'success', message: 'Boleta de honorarios y comprobante contable generados con éxito.'});
            setIsModalOpen(false);
        } catch (error: any) {
            handleApiError(error, 'al agregar boleta de honorarios');
        } finally {
            setIsLoading(false);
        }
    };
    
    const getSubjectName = (id: number) => subjects.find(s => s.id === id)?.name || 'N/A';
    
    const formatCurrency = (value: number) => `$${value.toLocaleString('es-CL')}`;

    return (
        <div>
            <div style={{ marginBottom: '16px' }}>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <span className="material-symbols-outlined">add</span>Agregar Boleta de Honorarios
                </button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>N° Boleta</th>
                        <th>Proveedor</th>
                        <th>Monto Bruto</th>
                        <th>Retención</th>
                        <th>Monto Líquido</th>
                    </tr>
                </thead>
                <tbody>
                    {feeInvoices.length > 0 ? feeInvoices.map(i => (
                        <tr key={i.id}>
                            <td>{i.date}</td>
                            <td>{i.invoiceNumber}</td>
                            <td>{getSubjectName(i.subjectId)}</td>
                            <td>{formatCurrency(i.grossAmount)}</td>
                            <td>{formatCurrency(i.taxRetention)}</td>
                            <td>{formatCurrency(i.netAmount)}</td>
                        </tr>
                    )) : <tr><td colSpan={6}>No hay registros.</td></tr>}
                </tbody>
            </table>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agregar Nueva Boleta de Honorarios">
                <FeeInvoiceForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} isLoading={isLoading} />
            </Modal>
        </div>
    );
};

export default FeeInvoicesView;