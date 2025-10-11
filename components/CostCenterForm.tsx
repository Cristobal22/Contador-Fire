
import React, { useEffect } from 'react';
import type { CostCenter, CostCenterData } from '../types';
import { useForm } from '../hooks/useForm';

const styles: { [key: string]: React.CSSProperties } = {
    formGroup: { marginBottom: '1rem' },
    label: { display: 'block', marginBottom: '0.5rem', fontWeight: 500 },
    input: { width: '100%' },
};

const getInitialData = (costCenter: CostCenter | null | undefined): CostCenterData => ({
    code: costCenter?.code || '',
    name: costCenter?.name || '',
});

export const CostCenterForm: React.FC<{
    costCenter?: CostCenter | null;
    onSave: (data: CostCenterData) => void;
    onCancel: () => void;
    isLoading: boolean;
}> = ({ costCenter, onSave, onCancel, isLoading }) => {

    const { register, handleSubmit, reset } = useForm<CostCenterData>(getInitialData(costCenter));

    useEffect(() => {
        reset(getInitialData(costCenter));
    }, [costCenter, reset]);

    const handleSave = (data: CostCenterData) => {
        if (!data.code || !data.name) return;
        onSave(data);
    };

    return (
        <form onSubmit={handleSubmit(handleSave)}>
            <div className="modal-body">
                <div style={styles.formGroup}>
                    <label style={styles.label}>Código</label>
                    <input style={styles.input} type="text" {...register('code')} required />
                </div>
                <div style={styles.formGroup}>
                    <label style={styles.label}>Nombre</label>
                    <input style={styles.input} type="text" {...register('name')} required />
                </div>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar'}</button>
            </div>
        </form>
    );
};
