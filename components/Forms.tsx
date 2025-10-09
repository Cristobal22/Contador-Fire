import React, { useState, useEffect } from 'react';
import { useSession } from '../context/SessionContext';
import { formatRut } from '../utils/format';
import type { VoucherData, VoucherEntry, InvoiceData, FeeInvoiceData, Voucher } from '../types';

type FormProps = {
    onCancel: () => void;
    isLoading?: boolean;
};

const SaveButton: React.FC<{ isLoading?: boolean; text?: string; disabled?: boolean; }> = ({ isLoading, text = "Guardar", disabled = false }) => (
    <button type="submit" className={`btn btn-primary ${isLoading ? 'loading' : ''}`} disabled={isLoading || disabled}>
        {isLoading && <div className="spinner"></div>}
        <span className="btn-text">{text}</span>
    </button>
);


export const GenericForm = <T extends object>({ onSave, onCancel, initialData, fields, isLoading, loadingMessage }: { onSave: (data: T) => void; initialData: T; fields: { name: string, label: string, type: string, options?: any[] }[]; loadingMessage?: string; } & FormProps) => {
    const [formData, setFormData] = useState(initialData);
    useEffect(() => { setFormData(initialData) }, [initialData]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        const field = fields.find(f => f.name === name);
        if (!field) return;

        let finalValue: any = value;

        if (name === 'rut') {
            finalValue = formatRut(value);
        } else if (field.type === 'number') {
            finalValue = value === '' ? null : parseFloat(value);
        } else if (field.type === 'select') {
            const firstOption = field.options?.[0];
            if (firstOption) {
                const optionValue = typeof firstOption === 'object' && 'value' in firstOption ? firstOption.value : firstOption;
                if (typeof optionValue === 'number') {
                    finalValue = Number(value);
                }
            }
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as T);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="modal-body">{fields.map(f => (<div className="form-group" key={f.name}><label htmlFor={f.name}>{f.label}</label>{f.type === 'select' ? (<select id={f.name} name={f.name} value={(formData as any)[f.name]} onChange={handleChange} required>{f.options?.map(o => <option key={typeof o === 'object' ? o.value : o} value={typeof o === 'object' ? o.value : o}>{typeof o === 'object' ? o.label : o}</option>)}</select>) : (<input type={f.type} id={f.name} name={f.name} value={(formData as any)[f.name] ?? ''} onChange={handleChange} required />)}</div>))}</div>
            <div className="modal-footer">
                {isLoading && loadingMessage && <span style={{marginRight: 'auto', color: 'var(--text-light-color)', fontSize: '12px'}}>{loadingMessage}</span>}
                <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
                <SaveButton isLoading={isLoading} />
            </div>
        </form>
    );
};

export const VoucherForm: React.FC<{ onSave: (voucher: VoucherData) => void; initialData?: Voucher | null; } & FormProps> = ({ onSave, onCancel, isLoading, initialData }) => {
    const { accounts } = useSession();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('');
    const [entries, setEntries] = useState<Omit<VoucherEntry, 'id'>[]>([{ accountId: '', debit: 0, credit: 0 }]);
    
    useEffect(() => {
        if (initialData) {
            setDate(initialData.date);
            setDescription(initialData.description);
            setEntries(initialData.entries);
        } else {
            setDate(new Date().toISOString().split('T')[0]);
            setDescription('');
            setEntries([{ accountId: '', debit: 0, credit: 0 }]);
        }
    }, [initialData]);

    const handleEntryChange = (index: number, field: 'debit' | 'credit', value: string) => {
        const numericValue = value === '' ? 0 : parseInt(value, 10);
        // Prevent entering negative numbers
        if (!isNaN(numericValue) && numericValue >= 0) {
            setEntries(prev => prev.map((e, i) => (i === index ? { ...e, [field]: numericValue } : e)));
        }
    };

    const handleAccountChange = (index: number, value: string | number) => {
         setEntries(prev => prev.map((e, i) => (i === index ? { ...e, accountId: Number(value) } : e)));
    };

    const addEntry = () => setEntries(prev => [...prev, { accountId: '', debit: 0, credit: 0 }]);
    const removeEntry = (index: number) => setEntries(prev => prev.filter((_, i) => i !== index));
    const totalDebit = entries.reduce((sum, e) => sum + Number(e.debit), 0);
    const totalCredit = entries.reduce((sum, e) => sum + Number(e.credit), 0);
    const isBalanced = totalDebit === totalCredit && totalDebit !== 0;
    
    const handleSubmit = (e: React.FormEvent) => { 
        e.preventDefault(); 
        if (!isBalanced) return; 
        onSave({ 
            date, 
            description, 
            entries: entries.filter(e => e.accountId).map(e => ({...e, id: Date.now() + Math.random()})) 
        }); 
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="modal-body">
                <div style={{display: 'flex', gap: '16px'}}>
                    <div className="form-group" style={{ flex: '0 0 180px' }}>
                        <label htmlFor="date">Fecha</label>
                        <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required />
                    </div>
                    <div className="form-group" style={{flexGrow: 1}}>
                        <label htmlFor="description">Glosa</label>
                        <input type="text" id="description" value={description} onChange={e => setDescription(e.target.value)} required />
                    </div>
                </div>
                <table className="form-table">
                    <thead>
                        <tr>
                            <th className="col-account">Cuenta</th>
                            <th className="col-amount" style={{textAlign: 'right'}}>Debe</th>
                            <th className="col-amount" style={{textAlign: 'right'}}>Haber</th>
                            <th className="col-action"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map((entry, index) => (
                            <tr key={index}>
                                <td className="col-account">
                                    <select value={entry.accountId} onChange={e => handleAccountChange(index, e.target.value)} required>
                                        <option value="" disabled>Seleccione...</option>
                                        {(accounts || []).sort((a,b) => a.code.localeCompare(b.code)).map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                                    </select>
                                </td>
                                <td className="col-amount">
                                    <input type="number" value={entry.debit || ''} onChange={e => handleEntryChange(index, 'debit', e.target.value)} min="0" />
                                </td>
                                <td className="col-amount">
                                    <input type="number" value={entry.credit || ''} onChange={e => handleEntryChange(index, 'credit', e.target.value)} min="0" />
                                </td>
                                <td className="col-action">
                                    <button type="button" className="btn-icon" onClick={() => removeEntry(index)}>
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button type="button" className="btn btn-secondary" onClick={addEntry} style={{ marginTop: '10px' }}><span className="material-symbols-outlined">add</span>Agregar Línea</button>
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '24px', fontWeight: 500 }}><div>Total Debe: <strong>{totalDebit.toLocaleString('es-CL')}</strong></div><div>Total Haber: <strong>{totalCredit.toLocaleString('es-CL')}</strong></div><div style={{ color: isBalanced ? 'var(--success-color)' : 'var(--error-color)' }}>{isBalanced ? 'Cuadrado' : 'Descuadrado'}</div></div>
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button><SaveButton isLoading={isLoading} disabled={!isBalanced} /></div>
        </form>
    );
};

export const InvoiceForm: React.FC<{ onSave: (invoice: InvoiceData) => void; type: 'Compra' | 'Venta' } & FormProps> = ({ onSave, onCancel, type, isLoading }) => {
    const { subjects } = useSession();
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], invoiceNumber: '', subjectId: 0, net: 0, });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: name === 'net' || name === 'subjectId' ? Number(value) : value })); };
    const tax = Math.round(formData.net * 0.19);
    const total = formData.net + tax;
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ ...formData, tax, total, type }); };
    const subjectType = type === 'Compra' ? 'Proveedor' : 'Cliente';

    return (
        <form onSubmit={handleSubmit}>
            <div className="modal-body">
                <div className="form-group"><label htmlFor="date">Fecha</label><input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required /></div>
                <div className="form-group"><label htmlFor="invoiceNumber">Número Factura</label><input type="text" id="invoiceNumber" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} required /></div>
                <div className="form-group"><label htmlFor="subjectId">{subjectType}</label><select id="subjectId" name="subjectId" value={formData.subjectId} onChange={handleChange} required><option value={0} disabled>Seleccione...</option>{(subjects || []).filter(s => s.type === subjectType).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div style={{display: 'flex', gap: '16px'}}><div className="form-group"><label htmlFor="net">Neto</label><input type="number" id="net" name="net" value={formData.net} onChange={handleChange} required /></div><div className="form-group"><label>IVA (19%)</label><input type="text" value={tax.toLocaleString('es-CL')} readOnly /></div><div className="form-group"><label>Total</label><input type="text" value={total.toLocaleString('es-CL')} readOnly /></div></div>
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button><SaveButton isLoading={isLoading} /></div>
        </form>
    );
};

export const FeeInvoiceForm: React.FC<{ onSave: (invoice: FeeInvoiceData) => void; } & FormProps> = ({ onSave, onCancel, isLoading }) => {
    const { subjects } = useSession();
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], invoiceNumber: '', subjectId: 0, grossAmount: 0, });
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: name === 'grossAmount' || name === 'subjectId' ? Number(value) : value })); };
    
    const TAX_RETENTION_RATE = 0.1375; // 13.75% for 2024
    const taxRetention = Math.round(formData.grossAmount * TAX_RETENTION_RATE);
    const netAmount = formData.grossAmount - taxRetention;

    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave({ ...formData, taxRetention, netAmount }); };
    
    return (
        <form onSubmit={handleSubmit}>
            <div className="modal-body">
                <div className="form-group"><label htmlFor="date">Fecha</label><input type="date" id="date" name="date" value={formData.date} onChange={handleChange} required /></div>
                <div className="form-group"><label htmlFor="invoiceNumber">Número Boleta</label><input type="text" id="invoiceNumber" name="invoiceNumber" value={formData.invoiceNumber} onChange={handleChange} required /></div>
                <div className="form-group"><label htmlFor="subjectId">Proveedor</label><select id="subjectId" name="subjectId" value={formData.subjectId} onChange={handleChange} required><option value={0} disabled>Seleccione...</option>{(subjects || []).filter(s => s.type === 'Proveedor').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div style={{display: 'flex', gap: '16px'}}>
                   <div className="form-group"><label htmlFor="grossAmount">Monto Bruto</label><input type="number" id="grossAmount" name="grossAmount" value={formData.grossAmount} onChange={handleChange} required /></div>
                   <div className="form-group"><label>Retención ({TAX_RETENTION_RATE * 100}%)</label><input type="text" value={taxRetention.toLocaleString('es-CL')} readOnly /></div>
                   <div className="form-group"><label>Monto Líquido</label><input type="text" value={netAmount.toLocaleString('es-CL')} readOnly /></div>
                </div>
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button><SaveButton isLoading={isLoading} /></div>
        </form>
    );
};