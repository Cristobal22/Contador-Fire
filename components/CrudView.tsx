
import React, { useState } from 'react';
import Modal from './Modal';
import { GenericForm } from './GenericForm'; // Updated import path
import { useSession } from '../context/SessionContext';
import { validateRut } from '../utils/format';

// Props definition remains the same

type CrudViewProps<T extends { id: number | string }> = {
    title: string;
    columns: {
        key: keyof T | (string & {});
        header: string;
        render?: (value: any, row: T) => React.ReactNode;
    }[];
    data: T[];
    onSave: (data: Omit<T, 'id'>) => Promise<void>;
    onUpdate: (data: T) => Promise<void>;
    onDelete: (id: number | string) => Promise<void>;
    formFields: { name: string, label: string, type: string, options?: any[] }[];
};

export const CrudView = <T extends { id: number | string }>({ title, columns, data, onSave, onUpdate, onDelete, formFields }: CrudViewProps<T>) => {
    const { addNotification, handleApiError } = useSession();
    const [isModalOpen, setIsModalOpen] = useState(false);
    // The type for editingItem is now simplified, as GenericForm handles the initial empty state
    const [editingItem, setEditingItem] = useState<T | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAddNew = () => {
        // The new GenericForm can handle a null initialData, simplifying this.
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: T) => { 
        setEditingItem(item); 
        setIsModalOpen(true); 
    };

    const handleDelete = async (id: number | string) => {
        if (window.confirm(`¿Está seguro de que desea eliminar este registro?`)) {
            try {
                await onDelete(id);
                addNotification({ type: 'success', message: 'Registro eliminado con éxito.' });
            } catch (error: any) {
                handleApiError(error, `al eliminar ${title.toLowerCase()}`);
            }
        }
    };

    // This function now receives the data directly from the new GenericForm's handleSubmit
    const handleSave = async (formData: T) => {
        setIsLoading(true);
        const isEditing = editingItem !== null;

        // RUT validation remains the same
        if ('rut' in formData && typeof (formData as any).rut === 'string' && (formData as any).rut) {
            if (!validateRut((formData as any).rut)) {
                addNotification({ type: 'error', message: 'El RUT ingresado no es válido. Verifique el RUT y el dígito verificador.' });
                setIsLoading(false);
                return;
            }
        }
        
        try {
            if (isEditing) {
                // The new form returns the full object, so we pass it directly
                await onUpdate({ ...editingItem, ...formData });
            } else {
                await onSave(formData as Omit<T, 'id'>);
            }
            addNotification({ type: 'success', message: `Registro ${isEditing ? 'actualizado' : 'guardado'} con éxito.` });
            setIsModalOpen(false);
            setEditingItem(null);
        } catch (error: any) {
            handleApiError(error, `al guardar ${title.toLowerCase()}`);
        } finally {
            setIsLoading(false);
        }
    };
    
     const handleCancel = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    // The initialData passed to GenericForm is now either the item to edit or null
    const initialDataForForm = editingItem ? editingItem : 
        formFields.reduce((acc, field) => ({ ...acc, [field.name]: '' }), {});

    return (
        <div>
            <div style={{ marginBottom: '16px' }}><button className="btn btn-primary" onClick={handleAddNew}><span className="material-symbols-outlined">add</span>Agregar {title}</button></div>
            <table><thead><tr>{columns.map(c => <th key={String(c.key)}>{c.header}</th>)}<th>Acciones</th></tr></thead>
                <tbody>
                    {data.length > 0 ? data.map(item => (<tr key={item.id}>
                        {columns.map(col => <td key={String(col.key)}>{col.render ? col.render(item[col.key as keyof T], item) : String(item[col.key as keyof T] ?? '')}</td>)}
                        <td>
                            <button className="btn-icon" title="Editar" onClick={() => handleEdit(item)}><span className="material-symbols-outlined">edit</span></button>
                            <button className="btn-icon" title="Eliminar" onClick={() => handleDelete(item.id)}><span className="material-symbols-outlined">delete</span></button>
                        </td>
                    </tr>)) : <tr><td colSpan={columns.length + 1}>No hay registros.</td></tr>}
                </tbody>
            </table>
            <Modal isOpen={isModalOpen} onClose={handleCancel} title={(editingItem ? 'Editar' : 'Agregar') + ` ${title}`}>
                {/* The key prop is added to ensure the form remounts and resets its state when the editing item changes */}
                <GenericForm 
                    key={editingItem ? editingItem.id : 'new'} 
                    onSave={handleSave} 
                    onCancel={handleCancel} 
                    initialData={initialDataForForm} 
                    fields={formFields} 
                    isLoading={isLoading} />
            </Modal>
        </div>
    );
};