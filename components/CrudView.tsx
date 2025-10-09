import React, { useState } from 'react';
import Modal from './Modal';
import { GenericForm } from './Forms';
import { useSession } from '../context/SessionContext';
import { validateRut } from '../utils/format';

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
    const [editingItem, setEditingItem] = useState<T | Omit<T, 'id'> | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleAddNew = () => {
        const initialData = formFields.reduce((acc, field) => {
            let defaultValue: any = ''; 
            if (field.type === 'number') {
                defaultValue = 0;
            } else if (field.type === 'date') {
                defaultValue = new Date().toISOString().split('T')[0];
            } else if (field.type === 'select' && field.options && field.options.length > 0) {
                const firstOption = field.options[0];
                if (typeof firstOption === 'object' && firstOption !== null && 'value' in firstOption) {
                    defaultValue = firstOption.value;
                } else {
                    defaultValue = firstOption;
                }
            }
            return { ...acc, [field.name]: defaultValue };
        }, {} as Omit<T, 'id'>);

        setEditingItem(initialData);
        setIsModalOpen(true);
    };

    const handleEdit = (item: T) => { setEditingItem(item); setIsModalOpen(true); };

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

    const handleSave = async (formData: T | Omit<T, 'id'>) => {
        setIsLoading(true);
        const isEditing = editingItem && 'id' in editingItem;
        
        if ('rut' in formData && typeof (formData as any).rut === 'string' && (formData as any).rut) {
            if (!validateRut((formData as any).rut)) {
                addNotification({ type: 'error', message: 'El RUT ingresado no es válido. Verifique el RUT y el dígito verificador.' });
                setIsLoading(false);
                return;
            }
        }

        try {
            if (isEditing) {
                await onUpdate(formData as T);
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
            <Modal isOpen={isModalOpen} onClose={handleCancel} title={(editingItem && 'id' in editingItem ? 'Editar' : 'Agregar') + ` ${title}`}>
                {editingItem && <GenericForm onSave={handleSave} onCancel={handleCancel} initialData={editingItem} fields={formFields} isLoading={isLoading} />}
            </Modal>
        </div>
    );
};