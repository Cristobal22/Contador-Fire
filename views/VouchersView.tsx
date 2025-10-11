
import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import Modal from '../components/Modal';
import { VoucherForm } from '../components/Forms';
import type { Voucher, VoucherData, Account } from '../types';
import { CrudView } from '../components/CrudView'; // Assuming a generic CrudView exists

const VouchersView: React.FC = () => {
    const { session, loading, addNotification, handleApiError } = useSession();
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

    const vouchers = session?.vouchers || [];
    const accounts = session?.accounts || [];

    const handleAddNew = () => {
        setSelectedVoucher(null);
        setIsFormModalOpen(true);
    };

    const handleEdit = (voucher: Voucher) => {
        setSelectedVoucher(voucher);
        setIsFormModalOpen(true);
    };

    const handleViewDetails = (voucher: Voucher) => {
        setSelectedVoucher(voucher);
        setIsDetailModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!session?.deleteVoucher) return;
        if (window.confirm('¿Está seguro de que desea eliminar este comprobante? Esta acción no se puede deshacer.')) {
            try {
                await session.deleteVoucher(id);
                addNotification({ type: 'success', message: 'Comprobante eliminado con éxito.' });
            } catch (error: any) {
                handleApiError(error, 'al eliminar el comprobante');
            }
        }
    };

    const handleSave = async (voucherData: VoucherData) => {
        if (!session?.addVoucher || !session?.updateVoucher) return;
        setIsSubmitting(true);
        try {
            if (selectedVoucher) {
                await session.updateVoucher({ ...voucherData, id: selectedVoucher.id });
                addNotification({ type: 'success', message: 'Comprobante actualizado con éxito.' });
            } else {
                await session.addVoucher(voucherData);
                addNotification({ type: 'success', message: 'Comprobante guardado con éxito.' });
            }
            setIsFormModalOpen(false);
            setSelectedVoucher(null);
        } catch (error: any) {
            handleApiError(error, 'al guardar el comprobante');
        } finally {
            setIsSubmitting(false);
        }
    };

    const columns = [
        { id: 'date', header: 'Fecha', accessor: (v: Voucher) => v.date },
        { id: 'description', header: 'Glosa', accessor: (v: Voucher) => v.description },
        { id: 'entries', header: 'N° Asientos', accessor: (v: Voucher) => (v.entries || []).length },
    ];

    return (
        <CrudView
            title="Comprobantes Contables"
            data={vouchers}
            columns={columns}
            onAddNew={handleAddNew}
            onEdit={handleEdit}
            onDelete={(v) => handleDelete(v.id)}
            onView={handleViewDetails} // Add a view action
            loading={loading}
            companyRequired
        >
            {isFormModalOpen && (
                <Modal 
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    title={selectedVoucher ? 'Editar Comprobante' : 'Agregar Nuevo Comprobante'}
                    size="lg"
                >
                    <VoucherForm 
                        onSave={handleSave} 
                        onCancel={() => setIsFormModalOpen(false)} 
                        isLoading={isSubmitting} 
                        initialData={selectedVoucher} 
                        accounts={accounts} 
                    />
                </Modal>
            )}

            {isDetailModalOpen && selectedVoucher && (
                <VoucherDetailModal 
                    voucher={selectedVoucher} 
                    onClose={() => setIsDetailModalOpen(false)} 
                    accounts={accounts} 
                />
            )}
        </CrudView>
    );
};

const VoucherDetailModal: React.FC<{ voucher: Voucher, onClose: () => void, accounts: Account[] }> = ({ voucher, onClose, accounts }) => {
    const getAccountName = (id: number | '') => (accounts || []).find(a => a.id === id)?.name || 'N/A';
    const totalDebit = (voucher.entries || []).reduce((sum, e) => sum + e.debit, 0);

    return (
        <Modal isOpen={true} onClose={onClose} title="Detalle Comprobante Contable" size="lg">
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
                        {(voucher.entries || []).map(entry => (
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
    );
};

export default VouchersView;
