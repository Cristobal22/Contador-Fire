
import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import type { CostCenter, CostCenterData } from '../types';
import Modal from '../components/Modal';
import { CostCenterForm } from '../components/CostCenterForm';

const styles: { [key: string]: React.CSSProperties } = {
    container: { padding: '2rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    title: { margin: 0, fontSize: '1.8rem' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { borderBottom: '2px solid var(--border-color)', padding: '12px', textAlign: 'left', color: 'var(--text-light-color)' },
    td: { borderBottom: '1px solid var(--border-color)', padding: '12px', verticalAlign: 'middle' },
    actions: { display: 'flex', gap: '10px' },
};

const CostCentersView = () => {
    const { session, handleApiError, addNotification } = useSession();
    const { costCenters, addCostCenter, updateCostCenter, deleteCostCenter } = session || {};
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
        if (window.confirm('¿Estás seguro de que quieres eliminar este centro de costo?') && deleteCostCenter) {
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
            if (selected && updateCostCenter) {
                await updateCostCenter({ ...data, id: selected.id });
                addNotification({ type: 'success', message: 'Centro de costo actualizado.' });
            } else if (addCostCenter) {
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

    if (!session) return <div>Cargando...</div>;

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
                    {(costCenters && costCenters.length > 0) ? costCenters.map(cc => (
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
