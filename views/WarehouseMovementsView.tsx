import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { SimpleReportView } from '../components/Views';
import { Modal } from '../components/Modal';
import { GenericForm } from '../components/Forms';

const WarehouseMovementsView: React.FC<{ type: 'Entrada' | 'Salida' }> = ({ type }) => {
    const { handleApiError, addNotification, ...session } = useSession();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const itemOptions = session.items.map(i => ({ value: i.id, label: i.name }));

    const handleSave = async (data: any) => {
        setIsLoading(true);
        const movementData = {
            date: data.date,
            type: type,
            itemId: Number(data.itemId),
            quantity: Number(data.quantity),
        };
        try {
            await session.addWarehouseMovement(movementData);
            addNotification({ type: 'success', message: `${type} registrada con éxito.`});
            setIsModalOpen(false);
        } catch (error: any) {
            handleApiError(error, `al registrar ${type.toLowerCase()}`);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredMovements = session.warehouseMovements.filter(m => m.type === type);

    return (
        <SimpleReportView title={`${type}s a Bodega`}>
            <div style={{ marginBottom: '16px' }}>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    <span className="material-symbols-outlined">add</span>Registrar {type}
                </button>
            </div>
            <table>
                <thead>
                    <tr><th>Fecha</th><th>Ítem</th><th>Cantidad</th></tr>
                </thead>
                <tbody>
                    {filteredMovements.length > 0 ? filteredMovements.map(m => (
                        <tr key={m.id}>
                            <td>{m.date}</td>
                            <td>{session.items.find(i => i.id === m.itemId)?.name}</td>
                            <td>{m.quantity}</td>
                        </tr>
                    )) : <tr><td colSpan={3}>No hay registros.</td></tr>}
                </tbody>
            </table>
             <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Registrar ${type}`}>
                <GenericForm 
                    onSave={handleSave}
                    onCancel={() => setIsModalOpen(false)}
                    initialData={{ date: new Date().toISOString().split('T')[0], itemId: itemOptions[0]?.value || '', quantity: 1 }}
                    fields={[
                        { name: 'date', label: 'Fecha', type: 'date' },
                        { name: 'itemId', label: 'Ítem', type: 'select', options: itemOptions },
                        { name: 'quantity', label: 'Cantidad', type: 'number' },
                    ]}
                    isLoading={isLoading}
                />
            </Modal>
        </SimpleReportView>
    );
};

export default WarehouseMovementsView;