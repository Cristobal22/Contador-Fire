
import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import Modal from '../components/Modal';
import { InvoiceForm } from '../components/Forms';
import type { InvoiceData } from '../types';

const InvoicesView: React.FC<{ type: 'Compra' | 'Venta' }> = ({ type }) => {
    const { session, addNotification, handleApiError } = useSession();
    const { invoices, subjects, addInvoice } = session || {};
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleSave = async (invoiceData: InvoiceData) => {
        setIsLoading(true);
        try {
            if (addInvoice) {
                await addInvoice(invoiceData);
                addNotification({ type: 'success', message: `${type} y comprobante contable generados con éxito.`});
                setIsModalOpen(false);
            }
        } catch (error: any) {
            handleApiError(error, `al agregar ${type.toLowerCase()}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const getSubjectName = (id: number) => (subjects || []).find(s => s.id === id)?.name || 'N/A';
    const filteredInvoices = (invoices || []).filter(i => i.type === type);
    
    if (!session) return <div>Cargando...</div>;

    return (
        <div>
            <div style={{ marginBottom: '16px' }}>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <span className="material-symbols-outlined">add</span>Agregar Nueva {type}
                </button>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>N° Factura</th>
                        <th>{type === 'Compra' ? 'Proveedor' : 'Cliente'}</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredInvoices.length > 0 ? filteredInvoices.map(i => (
                        <tr key={i.id}>
                            <td>{i.date}</td>
                            <td>{i.invoiceNumber}</td>
                            <td>{getSubjectName(i.subjectId)}</td>
                            <td>{i.total.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</td>
                        </tr>
                    )) : <tr><td colSpan={4}>No hay registros.</td></tr>}
                </tbody>
            </table>
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Agregar Nueva ${type}`}>
                <InvoiceForm onSave={handleSave} onCancel={() => setIsModalOpen(false)} type={type} isLoading={isLoading} subjects={subjects || []} />
            </Modal>
        </div>
    );
};

export default InvoicesView;
