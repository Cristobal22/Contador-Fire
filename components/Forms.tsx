
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from '../context/SessionContext';
import { formatRut } from '../utils/format';
import { voucherTypes, feeInvoiceTaxRetentionRates } from '../data/accounting';
import type { VoucherData, VoucherEntry, InvoiceData, FeeInvoiceData, Voucher, Subject, ChartOfAccount, InvoiceLineData, TaxType } from '../types';

// --- Reusable Generic Components (already defined) ---
const SaveButton: React.FC<{ isLoading?: boolean; text?: string; disabled?: boolean; }> = ({ isLoading, text = "Guardar", disabled = false }) => (/* ... */);
const SearchableDropdown: React.FC<{ /* ... */ }> = ({ items, value, onChange, placeholder, displayKey }) => (/* ... */);

// --- VOUCHER FORM (already defined) ---
export const VoucherForm: React.FC<{ /* ... */ }> = ({ onSave, onCancel, isLoading, initialData }) => (/* ... */);

// --- INVOICE FORM (already defined) ---
export const InvoiceForm: React.FC<{ /* ... */ }> = ({ onSave, type, onCancel, isLoading }) => (/* ... */);


// --- FEE INVOICE FORM (Newly Rebuilt) ---
export const FeeInvoiceForm: React.FC<{ 
    onSave: (feeInvoice: FeeInvoiceData) => void; 
    onCancel: () => void;
    isLoading?: boolean;
}> = ({ onSave, onCancel, isLoading }) => {
    const { subjects, monthlyParameters } = useSession();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [subjectId, setSubjectId] = useState<number | '' >('');
    const [grossAmount, setGrossAmount] = useState(0);
    const [manualRetention, setManualRetention] = useState<number | null>(null);

    const RETENTION_RATE = useMemo(() => {
        const currentYear = new Date(date).getFullYear();
        const rate = feeInvoiceTaxRetentionRates.find(r => r.year === currentYear);
        return rate ? rate.rate : (feeInvoiceTaxRetentionRates[feeInvoiceTaxRetentionRates.length - 1].rate);
    }, [date]);

    const taxRetention = useMemo(() => {
        if (manualRetention !== null) return manualRetention;
        return Math.round(grossAmount * RETENTION_RATE);
    }, [grossAmount, RETENTION_RATE, manualRetention]);

    const netAmount = useMemo(() => grossAmount - taxRetention, [grossAmount, taxRetention]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!subjectId || !invoiceNumber || grossAmount <= 0) {
            alert("Por favor, complete todos los campos requeridos.");
            return;
        }
        onSave({ date, invoiceNumber, subjectId, grossAmount, taxRetention, netAmount });
    };
    
    const relevantSubjects = useMemo(() => subjects.filter(s => s.type === 'Proveedor'), [subjects]);

    return (
        <form onSubmit={handleSubmit}>
            <div className="modal-body">
                {/* Header */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="form-group"><label>Fecha</label><input type="date" value={date} onChange={e => setDate(e.target.value)} required /></div>
                    <div className="form-group"><label>N° Boleta</label><input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} required /></div>
                    <div className="form-group"><label>Proveedor</label><SearchableDropdown items={relevantSubjects} value={subjectId} onChange={setSubjectId} displayKey="name" placeholder="Buscar Proveedor..." /></div>
                    <div className="form-group"><label>Monto Bruto (Total)</label><input type="number" value={grossAmount} onChange={e => setGrossAmount(Number(e.target.value))} required min="1" /></div>
                </div>

                {/* Totals */}
                <div style={{width: '300px', marginLeft: 'auto', marginTop: '1.5rem'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}><p>Monto Bruto:</p><strong>{grossAmount.toLocaleString('es-CL')}</strong></div>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <p>Retención ({(RETENTION_RATE * 100).toFixed(2)}%):</p>
                        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                            <strong>{taxRetention.toLocaleString('es-CL')}</strong>
                             <button type="button" className="btn-icon-small" title="Ajustar Retención Manualmente" onClick={() => {
                                const newRetention = prompt("Ingrese el nuevo monto de retención:", taxRetention.toString());
                                if (newRetention !== null && !isNaN(parseInt(newRetention))) {
                                    setManualRetention(parseInt(newRetention));
                                }
                            }}>
                                <span className="material-symbols-outlined">edit</span>
                            </button>
                        </div>
                    </div>
                    <hr style={{margin: '8px 0'}}/>
                    <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem'}}><p>Monto Líquido:</p><strong>{netAmount.toLocaleString('es-CL')}</strong></div>
                </div>
            </div>

            {/* Footer */}
            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onCancel}>Cancelar</button><SaveButton isLoading={isLoading} disabled={!subjectId || !invoiceNumber || grossAmount <= 0} /></div>
        </form>
    );
};


// --- GENERIC FORM (remains unchanged) ---
export const GenericForm: React.FC<{ onSave: (data: any) => void; } & FormProps> = ({ onSave, onCancel, isLoading, fields, initialData }) => {
    // ... existing code ...
};
