
import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { formatRut } from '../utils/format';
import type { Subject, SubjectData } from '../types';
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
    checkboxGroup: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '1rem' },
};

// --- Subject Form Component ---
const SubjectForm: React.FC<{
    subject?: Subject | null;
    onSave: (data: SubjectData) => void;
    onCancel: () => void;
    isLoading: boolean;
}> = ({ subject, onSave, onCancel, isLoading }) => {
    const [rut, setRut] = useState(subject?.rut || '');
    const [name, setName] = useState(subject?.name || '');
    const [type, setType] = useState(subject?.type || 'Proveedor');
    const [hasSolidarityLoan, setHasSolidarityLoan] = useState(subject?.has_solidarity_loan || false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rut || !name) return;
        onSave({ rut, name, type, has_solidarity_loan: hasSolidarityLoan });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="modal-body">
                <div style={styles.formGroup}>
                    <label style={styles.label}>RUT</label>
                    <input style={styles.input} type="text" value={rut} onChange={e => setRut(e.target.value)} required />
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Nombre</label>
                    <input style={styles.input} type="text" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Tipo</label>
                    <select style={styles.input} value={type} onChange={e => setType(e.target.value)} required>
                        <option value="Cliente">Cliente</option>
                        <option value="Proveedor">Proveedor</option>
                    </select>
                </div>
                <div style={styles.checkboxGroup}>
                     <input id="solidarity-loan-check" type="checkbox" checked={hasSolidarityLoan} onChange={e => setHasSolidarityLoan(e.target.checked)} />
                     <label htmlFor="solidarity-loan-check" style={{ fontWeight: 400, margin: 0 }}>Aplica Retención Préstamo Solidario (3%)</label>
                </div>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar'}</button>
            </div>
        </form>
    );
};

// --- Main Subjects View ---
const SubjectsView = () => {
    const { subjects, addSubject, updateSubject, deleteSubject, handleApiError, addNotification } = useSession();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selected, setSelected] = useState<Subject | null>(null);

    const handleAddNew = () => {
        setSelected(null);
        setIsModalOpen(true);
    };

    const handleEdit = (subject: Subject) => {
        setSelected(subject);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar este sujeto?')) {
            try {
                await deleteSubject(id);
                addNotification({ type: 'success', message: 'Sujeto eliminado.' });
            } catch (error) {
                handleApiError(error, 'al eliminar el sujeto');
            }
        }
    };

    const handleSave = async (data: SubjectData) => {
        setIsLoading(true);
        try {
            if (selected) {
                await updateSubject(selected.id, data);
                addNotification({ type: 'success', message: 'Sujeto actualizado.' });
            } else {
                await addSubject(data);
                addNotification({ type: 'success', message: 'Sujeto creado.' });
            }
            setIsModalOpen(false);
        } catch (error) {
            handleApiError(error, selected ? 'al actualizar el sujeto' : 'al crear el sujeto');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Sujetos (Clientes y Proveedores)</h1>
                <button className="btn btn-primary" onClick={handleAddNew}><span className="material-symbols-outlined">add</span>Crear Nuevo</button>
            </div>

            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>RUT</th>
                        <th style={styles.th}>Nombre</th>
                        <th style={styles.th}>Tipo</th>
                        <th style={styles.th}>Préstamo Solidario</th>
                        <th style={styles.th}></th>
                    </tr>
                </thead>
                <tbody>
                    {subjects.length > 0 ? subjects.map(s => (
                        <tr key={s.id}>
                            <td style={styles.td}>{formatRut(s.rut)}</td>
                            <td style={styles.td}>{s.name}</td>
                            <td style={styles.td}>{s.type}</td>
                            <td style={styles.td}>{s.has_solidarity_loan ? 'Sí' : 'No'}</td>
                            <td style={{...styles.td, textAlign: 'right'}}>
                                <div style={styles.actions}>
                                    <button className="btn-icon" onClick={() => handleEdit(s)} title="Editar"><span className="material-symbols-outlined">edit</span></button>
                                    <button className="btn-icon" onClick={() => handleDelete(s.id)} title="Eliminar"><span className="material-symbols-outlined">delete</span></button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={5} style={{...styles.td, textAlign: 'center', padding: '2rem'}}>No hay sujetos definidos.</td></tr>
                    )}
                </tbody>
            </table>

            {isModalOpen && (
                 <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selected ? 'Editar Sujeto' : 'Crear Sujeto'}>
                    <SubjectForm 
                        subject={selected}
                        onSave={handleSave}
                        onCancel={() => setIsModalOpen(false)}
                        isLoading={isLoading}
                    />
                </Modal>
            )}
        </div>
    );
};

export default SubjectsView;
