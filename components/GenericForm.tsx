
import React, { useEffect } from 'react';
import { useForm } from '../hooks/useForm';

interface FormField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date';
    options?: any[]; 
    displayKey?: string;
    valueKey?: string;
}

interface GenericFormProps {
    onSave: (data: any) => void;
    onCancel: () => void;
    isLoading?: boolean;
    fields: FormField[];
    initialData: any;
}

export const GenericForm: React.FC<GenericFormProps> = ({ onSave, onCancel, isLoading, fields, initialData }) => {
    const { register, handleSubmit, reset } = useForm(initialData || {});

    useEffect(() => {
        reset(initialData || {});
    }, [initialData, reset]);

    const handleFormSubmit = (data: any) => {
        if (onSave) {
            onSave(data);
        }
    };

    const renderField = (field: FormField) => {
        // La corrección clave está aquí. Si el campo es numérico, lo registramos para que devuelva un número.
        const registrationProps = field.type === 'number' 
            ? register(field.name, { valueAsNumber: true }) 
            : register(field.name);

        const commonProps = {
            ...registrationProps,
            id: field.name,
            className: 'form-control',
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
                return <input type="number" {...commonProps} step="any" />;
            
            case 'date':
                 return <input type="date" {...commonProps} />;

            case 'text':
            default:
                return <input type="text" {...commonProps} />;
        }
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)}>
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
