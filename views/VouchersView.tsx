import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import Modal from '../components/Modal';
import { VoucherForm } from '../components/Forms';
import type { Voucher, VoucherData } from '../types';

const VoucherDetailModal: React.FC<{ voucher: Voucher | null, onClose: () => void, accounts: {id: number, name: string, code: string}[] }> = ({ voucher, onClose, accounts }) => {
    if (!voucher) return null;
    
    const getAccountName = (id: number | '') => (accounts || []).find(a => a.id === id)?.name || 'N/A';
    const totalDebit = voucher.entries.reduce((sum, e) => sum + e.debit, 0);

    return (
        <Modal isOpen={!!voucher} onClose={onClose} title="Detalle Comprobante Contable" size="lg">
            <div className="modal-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div><strong>Fecha:</strong> {voucher.date}</div>
                    <div><strong>ID Comprobante:</strong> #{voucher.id}</div>
                </div>
                <div style={{ marginBottom: '16px' }}><strong>Glosa:</strong> {voucher.description}</div>
                <table>
                    <thead>
                        <tr>
                            <th>Cuenta</th>
                            <th style={{ textAlign: 'right' }}>Debe</th>
                            <th style={{ textAlign: 'right' }}>Haber</th>
                        </tr>
                    </thead>
                    <tbody>
                        {voucher.entries.map(entry => (
                            <tr key={entry.id}>
                                <td>{getAccountName(entry.accountId)}</td>
                                <td style={{ textAlign: 'right' }}>{entry.debit > 0 ? entry.debit.toLocaleString('es-CL') : ''}</td>
                                <td style={{ textAlign: 'right' }}>{entry.credit > 0 ? entry.credit.toLocaleString('es-CL') : ''}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{fontWeight: 'bold'}}>
                            <td>Total</td>
                            <td style={{ textAlign: 'right' }}>{totalDebit.toLocaleString('es-CL')}</td>
                            <td style={{ textAlign: 'right' }}>{totalDebit.toLocaleString('es-CL')}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
            </div>
        </Modal>
    )
}


const VouchersView: React.FC = () => {
    const { vouchers, addVoucher, updateVoucher, deleteVoucher, addNotification, accounts, handleApiError } = useSession();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
    const [viewingVoucher, setViewingVoucher] = useState<Voucher | null>(null);

    const handleAddNew = () => {
        setEditingVoucher(null);
        setIsFormModalOpen(true);
    };
    
    const handleEdit = (voucher: Voucher) => {
        setEditingVoucher(voucher);
        setIsFormModalOpen(true);
    };
    
    const handleDelete = async (id: number) => {
        if (window.confirm('¿Está seguro de que desea eliminar este comprobante? Esta acción no se puede deshacer.')) {
            try {
                await deleteVoucher(id);
                addNotification({ type: 'success', message: 'Comprobante eliminado con éxito.' });
            } catch (error: any) {
                handleApiError(error, 'al eliminar el comprobante');
            }
        }
    };

    const handleSave = async (voucherData: VoucherData) => {
        setIsLoading(true);
        try {
            if (editingVoucher) {
                await updateVoucher({ ...voucherData, id: editingVoucher.id });
                addNotification({ type: 'success', message: 'Comprobante actualizado con éxito.' });
            } else {
                await addVoucher(voucherData);
                addNotification({ type: 'success', message: 'Comprobante guardado con éxito.' });
            }
            setIsFormModalOpen(false);
            setEditingVoucher(null);
        } catch (error: any) {
            handleApiError(error, 'al guardar el comprobante');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCloseForm = () => {
        setIsFormModalOpen(false);
        setEditingVoucher(null);
    }

    return (
        <div>
            <div style={{ marginBottom: '16px' }}>
                <button className="btn btn-primary" onClick={handleAddNew}>
                    <span className="material-symbols-outlined">add</span>Agregar Nuevo Comprobante
                </button>
            </div>
            <table>
                <thead>
                    <tr><th>Fecha</th><th>Glosa</th><th>N° Asientos</th><th>Acciones</th></tr>
                </thead>
                <tbody>
                    {(vouchers && vouchers.length > 0) ? vouchers.map(v => (
                        <tr key={v.id}>
                            <td>{v.date}</td>
                            <td>{v.description}</td>
                            <td>{v.entries.length}</td>
                            <td>
                                <button className="btn-icon" title="Ver Detalles" onClick={() => setViewingVoucher(v)}><span className="material-symbols-outlined">visibility</span></button>
                                <button className="btn-icon" title="Editar" onClick={() => handleEdit(v)}><span className="material-symbols-outlined">edit</span></button>
                                <button className="btn-icon" title="Eliminar" onClick={() => handleDelete(v.id)}><span className="material-symbols-outlined">delete</span></button>
                            </td>
                        </tr>
                    )) : <tr><td colSpan={4}>No hay registros.</td></tr>}
                </tbody>
            </table>
            
            <Modal isOpen={isFormModalOpen} onClose={handleCloseForm} title={editingVoucher ? 'Editar Comprobante' : 'Agregar Nuevo Comprobante'} size="lg">
                <VoucherForm onSave={handleSave} onCancel={handleCloseForm} isLoading={isLoading} initialData={editingVoucher} />
            </Modal>
            
            <VoucherDetailModal voucher={viewingVoucher} onClose={() => setViewingVoucher(null)} accounts={accounts} />
        </div>
    );
};

export default VouchersView;