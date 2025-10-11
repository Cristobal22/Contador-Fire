
import { useState, useCallback } from 'react';

export const useForm = <T extends Record<string, any>>(initialState: T) => {
    const [formData, setFormData] = useState<T>(initialState);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        let processedValue: any = value;

        if (type === 'checkbox') {
            processedValue = (e.target as HTMLInputElement).checked;
        } else if (type === 'number') {
            processedValue = value === '' ? null : parseFloat(value);
        } else if (value === 'true' || value === 'false') {
            processedValue = value === 'true';
        }

        setFormData(prev => ({ ...prev, [name]: processedValue }));
    }, []);

    const register = useCallback((name: keyof T) => ({
        name,
        value: formData[name] || '',
        onChange: handleChange,
    }), [formData, handleChange]);

    const reset = useCallback((data: T = initialState) => {
        setFormData(data);
    }, [initialState]);
    
    return {
        formData,
        setFormData, // Expose setFormData for more complex updates
        register,
        reset,
        getValues: () => formData,
    };
};
