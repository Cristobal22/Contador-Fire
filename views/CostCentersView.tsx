
import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import type { CostCenter, CostCenterData } from '../types';
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

// --- Cost Center Form Component ---
const CostCenterForm: React.FC<{
    costCenter?: CostCenter | null;
    onSave: (data: CostCenterData) => void;
    onCancel: () => void;
    isLoading: boolean;
}> = ({ costCenter, onSave, onCancel, isLoading }) => {
    const [code, setCode] = useState(costCenter?.code || '');
    const [name, setName] = useState(costCenter?.name || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || !name) return;
        onSave({ code, name });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="modal-body">
                <div style={styles.formGroup}>
                    <label style={styles.label}>Código</label>
                    <input style={styles.input} type="text" value={code} onChange={e => setCode(e.target.value)} required />
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

// --- Main Cost Centers View ---
const CostCentersView = () => {
    const { costCenters, addCostCenter, updateCostCenter, deleteCostCenter, handleApiError, addNotification } = useSession();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selected, setSelected] = useState<CostCenter | null>(null);

    const handleAddNew = () => {
        setSelected(null);
        setIsModalOpen(true);
    };

    const handleEdit = (costCenter: CostCenter) => {
        setSelected(costCenter);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este centro de costo?')) {
            try {
                await deleteCostCenter(id);
                addNotification({ type: 'success', message: 'Centro de costo eliminado.' });
            } catch (error) {
                handleApiError(error, 'al eliminar el centro de costo');
            }
        }
    };

    const handleSave = async (data: CostCenterData) => {
        setIsLoading(true);
        try {
            if (selected) {
                await updateCostCenter(selected.id, data);
                addNotification({ type: 'success', message: 'Centro de costo actualizado.' });
            } else {
                await addCostCenter(data);
                addNotification({ type: 'success', message: 'Centro de costo creado.' });
            }
            setIsModalOpen(false);
        } catch (error) {
            handleApiError(error, selected ? 'al actualizar el centro de costo' : 'al crear el centro de costo');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Centros de Costo</h1>
                <button className="btn btn-primary" onClick={handleAddNew}><span className="material-symbols-outlined">add</span>Crear Nuevo</button>
            </div>

            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Código</th>
                        <th style={styles.th}>Nombre</th>
                        <th style={styles.th}></th>
                    </tr>
                </thead>
                <tbody>
                    {costCenters.length > 0 ? costCenters.map(cc => (
                        <tr key={cc.id}>
                            <td style={styles.td}>{cc.code}</td>
                            <td style={styles.td}>{cc.name}</td>
                            <td style={{...styles.td, textAlign: 'right'}}>
                                <div style={styles.actions}>
                                    <button className="btn-icon" onClick={() => handleEdit(cc)} title="Editar"><span className="material-symbols-outlined">edit</span></button>
                                    <button className="btn-icon" onClick={() => handleDelete(cc.id)} title="Eliminar"><span className="material-symbols-outlined">delete</span></button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={3} style={{...styles.td, textAlign: 'center', padding: '2rem'}}>No hay centros de costo definidos.</td></tr>
                    )}
                </tbody>
            </table>

            {isModalOpen && (
                 <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selected ? 'Editar Centro de Costo' : 'Crear Centro de Costo'}>
                    <CostCenterForm 
                        costCenter={selected}
                        onSave={handleSave}
                        onCancel={() => setIsModalOpen(false)}
                        isLoading={isLoading}
                    />
                </Modal>
            )}
        </div>
    );
};

export default CostCentersView;
