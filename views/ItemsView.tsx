
import React, { useState, useMemo } from 'react';
import { useSession } from '../context/SessionContext';
import type { Item, ItemData } from '../types';
import Modal from '../components/Modal';

// --- Reusable Styles ---
const styles: { [key: string]: React.CSSProperties } = {
    container: { padding: '2rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    title: { margin: 0, fontSize: '1.8rem' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { borderBottom: '2px solid var(--border-color)', padding: '12px', textAlign: 'left', color: 'var(--text-light-color)' },
    td: { borderBottom: '1px solid var(--border-color)', padding: '12px', verticalAlign: 'middle' },
    actions: { display: 'flex', gap: '10px' },
    formGroup: { marginBottom: '1rem' },
    label: { display: 'block', marginBottom: '0.5rem', fontWeight: 500 },
    input: { width: '100%' },
};

// --- Item Form Component ---
const ItemForm: React.FC<{
    item?: Item | null;
    onSave: (data: ItemData) => void;
    onCancel: () => void;
    isLoading: boolean;
}> = ({ item, onSave, onCancel, isLoading }) => {
    const [sku, setSku] = useState(item?.sku || '');
    const [name, setName] = useState(item?.name || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sku || !name) return;
        onSave({ sku, name });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="modal-body">
                <div style={styles.formGroup}>
                    <label style={styles.label}>SKU (Código)</label>
                    <input style={styles.input} type="text" value={sku} onChange={e => setSku(e.target.value)} required />
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Nombre</label>
                    <input style={styles.input} type="text" value={name} onChange={e => setName(e.target.value)} required />
                </div>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar'}</button>
            </div>
        </form>
    );
};

// --- Main Items View ---
const ItemsView = () => {
    const { items, warehouseMovements, addItem, updateItem, deleteItem, handleApiError, addNotification } = useSession();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selected, setSelected] = useState<Item | null>(null);

    // Calculate current stock for each item
    const itemStock = useMemo(() => {
        const stockMap = new Map<number, number>();
        warehouseMovements.forEach(movement => {
            const currentStock = stockMap.get(movement.itemId) || 0;
            stockMap.set(movement.itemId, currentStock + (movement.type === 'Entrada' ? movement.quantity : -movement.quantity));
        });
        return stockMap;
    }, [warehouseMovements]);

    const handleAddNew = () => {
        setSelected(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: Item) => {
        setSelected(item);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este ítem?')) {
            try {
                await deleteItem(id);
                addNotification({ type: 'success', message: 'Ítem eliminado.' });
            } catch (error) {
                handleApiError(error, 'al eliminar el ítem');
            }
        }
    };

    const handleSave = async (data: ItemData) => {
        setIsLoading(true);
        try {
            if (selected) {
                await updateItem(selected.id, data);
                addNotification({ type: 'success', message: 'Ítem actualizado.' });
            } else {
                await addItem(data);
                addNotification({ type: 'success', message: 'Ítem creado.' });
            }
            setIsModalOpen(false);
        } catch (error) {
            handleApiError(error, selected ? 'al actualizar el ítem' : 'al crear el ítem');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Ítems (Productos y Servicios)</h1>
                <button className="btn btn-primary" onClick={handleAddNew}><span className="material-symbols-outlined">add</span>Crear Nuevo</button>
            </div>

            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>SKU</th>
                        <th style={styles.th}>Nombre</th>
                        <th style={{...styles.th, textAlign: 'right'}}>Stock Actual</th>
                        <th style={styles.th}></th>
                    </tr>
                </thead>
                <tbody>
                    {items.length > 0 ? items.map(item => (
                        <tr key={item.id}>
                            <td style={styles.td}>{item.sku}</td>
                            <td style={styles.td}>{item.name}</td>
                            <td style={{...styles.td, textAlign: 'right', fontWeight: 'bold'}}>{itemStock.get(item.id) || 0}</td>
                            <td style={{...styles.td, textAlign: 'right'}}>
                                <div style={styles.actions}>
                                    <button className="btn-icon" onClick={() => handleEdit(item)} title="Editar"><span className="material-symbols-outlined">edit</span></button>
                                    <button className="btn-icon" onClick={() => handleDelete(item.id)} title="Eliminar"><span className="material-symbols-outlined">delete</span></button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={4} style={{...styles.td, textAlign: 'center', padding: '2rem'}}>No hay ítems definidos.</td></tr>
                    )}
                </tbody>
            </table>

            {isModalOpen && (
                 <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selected ? 'Editar Ítem' : 'Crear Ítem'}>
                    <ItemForm 
                        item={selected}
                        onSave={handleSave}
                        onCancel={() => setIsModalOpen(false)}
                        isLoading={isLoading}
                    />
                </Modal>
            )}
        </div>
    );
};

export default ItemsView;
