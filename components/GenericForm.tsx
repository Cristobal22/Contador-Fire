
import React, { useEffect } from 'react';
import { useForm } from '../hooks/useForm';

// Define el tipo para un campo individual del formulario
interface FormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date';
    options?: any[]; 
    displayKey?: string; // Para selects con objetos
    valueKey?: string; // Para selects con objetos
}

// Define las props del componente GenericForm
interface GenericFormProps {
    onSave: (data: any) => void;
    onCancel: () => void;
    isLoading?: boolean;
    fields: FormField[];
    initialData: any;
}

export const GenericForm: React.FC<GenericFormProps> = ({ onSave, onCancel, isLoading, fields, initialData }) => {
    const { register, handleSubmit, reset, watch, setValue } = useForm(initialData || {});

    // Resetea el formulario si el item a editar cambia
    useEffect(() => {
        reset(initialData || {});
    }, [initialData, reset]);

    const renderField = (field: FormField) => {
        const commonProps = {
            ...register(field.name),
            id: field.name,
            className: 'form-control', // Asume una clase bootstrap-like
        };

        switch (field.type) {
            case 'select':
                const options = field.options || [];
                const displayKey = field.displayKey || 'label';
                const valueKey = field.valueKey || 'value';

                return (
                    <select {...commonProps}>
                        {options.map((option, index) => {
                            const value = typeof option === 'object' ? option[valueKey] : option;
                            const label = typeof option === 'object' ? option[displayKey] : option;
                            return <option key={index} value={value}>{label}</option>;
                        })}
                    </select>
                );

            case 'number':
                return <input type="number" {...commonProps} />;
            
            case 'date':
                 return <input type="date" {...commonProps} />;

            case 'text':
            default:
                return <input type="text" {...commonProps} />;
        }
    };

    return (
        <form onSubmit={handleSubmit(onSave)}>
            <div className="modal-body">
                {fields.map(field => (
                    <div key={field.name} className="form-group" style={{ marginBottom: '1rem' }}>
                        <label htmlFor={field.name} style={{ display: 'block', marginBottom: '0.5rem' }}>{field.label}</label>
                        {renderField(field)}
                    </div>
                ))}
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                    {isLoading ? 'Guardando...' : 'Guardar'}
                </button>
            </div>
        </form>
    );
};
