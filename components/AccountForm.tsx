
import React, { useEffect } from 'react';
import type { ChartOfAccount, ChartOfAccountData } from '../types';
import { useForm } from '../hooks/useForm';

const styles: { [key: string]: React.CSSProperties } = {
    formGroup: { marginBottom: '1rem' },
    label: { display: 'block', marginBottom: '0.5rem', fontWeight: 500 },
    input: { width: '100%' },
};

const getInitialData = (account: ChartOfAccount | null | undefined): ChartOfAccountData => ({
    code: account?.code || '',
    name: account?.name || '',
    type: account?.type || 'Activo',
});

export const AccountForm: React.FC<{
    account?: ChartOfAccount | null;
    onSave: (data: ChartOfAccountData) => void;
    onCancel: () => void;
    isLoading: boolean;
}> = ({ account, onSave, onCancel, isLoading }) => {
    
    const { register, handleSubmit, reset, getValues } = useForm<ChartOfAccountData>(getInitialData(account));

    useEffect(() => {
        reset(getInitialData(account));
    }, [account, reset]);

    const handleSave = (data: ChartOfAccountData) => {
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
                <div style={styles.formGroup}>
                    <label style={styles.label}>Tipo</label>
                    <select style={styles.input} {...register('type')} required>
                        <option value="Activo">Activo</option>
                        <option value="Pasivo">Pasivo</option>
                        <option value="Patrimonio">Patrimonio</option>
                        <option value="Ingreso">Ingreso</option>
                        <option value="Gasto">Gasto</option>
                        <option value="Costo">Costo</option>
                    </select>
                </div>
            </div>
            <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar'}</button>
            </div>
        </form>
    );
};
