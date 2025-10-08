import React, { useState, useMemo, ChangeEvent } from 'react';
import { useSession } from '../context/SessionContext';

const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '24px' },
    panel: { padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--border-color)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
    tableContainer: { maxHeight: '400px', overflowY: 'auto' },
    placeholderText: { textAlign: 'center', color: 'var(--text-light-color)', padding: '2rem' },
    fileInput: {
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        padding: '10px',
        fontSize: '14px',
        width: '100%'
    },
    summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
    summaryCard: { padding: '16px', backgroundColor: 'var(--sidebar-bg)', borderRadius: '4px' },
    summaryLabel: { fontSize: '12px', color: 'var(--text-light-color)', textTransform: 'uppercase' } as React.CSSProperties,
    summaryValue: { fontSize: '18px', fontWeight: 500, marginTop: '4px' },
    reconciledRow: { textDecoration: 'line-through', color: 'var(--text-light-color)' },
} as const;

type BankTx = { id: number; date: string; description: string; amount: number; };
type LedgerTx = { id: number; date: string; description: string; amount: number; };

const BankReconciliationView = () => {
    const { chartOfAccounts, vouchers, addNotification } = useSession();
    const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('');
    const [bankTxs, setBankTxs] = useState<BankTx[]>([]);
    const [ledgerTxs, setLedgerTxs] = useState<LedgerTx[]>([]);
    const [reconciledBankIds, setReconciledBankIds] = useState<Set<number>>(new Set());
    const [reconciledLedgerIds, setReconciledLedgerIds] = useState<Set<number>>(new Set());
    const [selectedBankIds, setSelectedBankIds] = useState<Set<number>>(new Set());
    const [selectedLedgerIds, setSelectedLedgerIds] = useState<Set<number>>(new Set());

    const bankAccounts = useMemo(() => (chartOfAccounts || []).filter(a => a.type === 'Activo' && a.name.toLowerCase().includes('banco')), [chartOfAccounts]);

    const handleAccountChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const accountId = Number(e.target.value);
        setSelectedAccountId(accountId);
        
        const movements = (vouchers || [])
            .flatMap(v => v.entries.map(entry => ({...entry, vDate: v.date, vDesc: v.description })))
            .filter(entry => entry.accountId === accountId)
            .map((entry, index) => ({
                id: entry.id,
                date: entry.vDate,
                description: entry.vDesc,
                amount: Number(entry.debit) - Number(entry.credit),
            }));
            
        setLedgerTxs(movements);
        setBankTxs([]);
        setReconciledBankIds(new Set());
        setReconciledLedgerIds(new Set());
        setSelectedBankIds(new Set());
        setSelectedLedgerIds(new Set());
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            try {
                const lines = text.split('\n').slice(1);
                const transactions: BankTx[] = lines.map((line, index) => {
                    const [date, description, amountStr] = line.split(',');
                    if (!date || !description || !amountStr) return null;
                    return { id: index, date, description, amount: parseFloat(amountStr) };
                }).filter((tx): tx is BankTx => tx !== null);
                setBankTxs(transactions);
                addNotification({ type: 'success', message: `Cartola cargada con ${transactions.length} movimientos.`})
            } catch (error) {
                 addNotification({ type: 'error', message: 'Error al procesar el archivo CSV.'})
            }
        };
        reader.readAsText(file);
    };

    const toggleSelection = (id: number, type: 'bank' | 'ledger') => {
        const [selectedIds, setSelectedIds] = type === 'bank' ? [selectedBankIds, setSelectedBankIds] : [selectedLedgerIds, setSelectedLedgerIds];
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const { totalSelectedBank, totalSelectedLedger, canReconcile } = useMemo(() => {
        const totalBank = Array.from(selectedBankIds).reduce((sum: number, id) => sum + (bankTxs.find(tx => tx.id === id)?.amount || 0), 0);
        const totalLedger = Array.from(selectedLedgerIds).reduce((sum: number, id) => sum + (ledgerTxs.find(tx => tx.id === id)?.amount || 0), 0);
        const can = totalBank !== 0 && totalLedger !== 0 && Math.abs(totalBank - totalLedger) < 0.01;
        return { totalSelectedBank: totalBank, totalSelectedLedger: totalLedger, canReconcile: can };
    }, [selectedBankIds, selectedLedgerIds, bankTxs, ledgerTxs]);
    
    const handleReconcile = () => {
        setReconciledBankIds(prev => new Set([...prev, ...selectedBankIds]));
        setReconciledLedgerIds(prev => new Set([...prev, ...selectedLedgerIds]));
        setSelectedBankIds(new Set());
        setSelectedLedgerIds(new Set());
        addNotification({ type: 'success', message: 'Movimientos conciliados.' });
    };
    
    const formatCurrency = (val: number) => val.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

    return (
        <div style={styles.container}>
            <div style={styles.panel}>
                <h3>Conciliación Bancaria</h3>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '24px' }}>
                     <div className="form-group" style={{ flex: 1 }}>
                        <label>Cuenta Bancaria</label>
                        <select className="form-control" value={selectedAccountId} onChange={handleAccountChange}>
                            <option value="" disabled>Seleccione...</option>
                            {bankAccounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label htmlFor="statement-file">Cartola Bancaria (CSV: fecha,desc,monto)</label>
                        <input type="file" id="statement-file" accept=".csv" style={styles.fileInput} onChange={handleFileChange} disabled={!selectedAccountId} />
                    </div>
                </div>
            </div>

            <div style={styles.grid}>
                <div style={styles.panel}>
                    <h4 style={{marginBottom: '16px'}}>Movimientos Banco</h4>
                    <div style={styles.tableContainer}>
                        <table>
                            <thead><tr><th></th><th>Fecha</th><th>Descripción</th><th style={{textAlign: 'right'}}>Monto</th></tr></thead>
                            <tbody>
                                {bankTxs.length > 0 ? bankTxs.filter(tx => !reconciledBankIds.has(tx.id)).map(tx => (
                                    <tr key={tx.id} style={selectedBankIds.has(tx.id) ? {backgroundColor: 'var(--hover-bg)'} : {}}>
                                        <td><input type="checkbox" checked={selectedBankIds.has(tx.id)} onChange={() => toggleSelection(tx.id, 'bank')} /></td>
                                        <td>{tx.date}</td><td>{tx.description}</td><td style={{textAlign: 'right'}}>{formatCurrency(tx.amount)}</td>
                                    </tr>
                                )) : <tr><td colSpan={4} style={styles.placeholderText}>Cargue una cartola para ver los movimientos.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div style={styles.panel}>
                     <h4 style={{marginBottom: '16px'}}>Movimientos Contabilidad</h4>
                     <div style={styles.tableContainer}>
                        <table>
                            <thead><tr><th></th><th>Fecha</th><th>Descripción</th><th style={{textAlign: 'right'}}>Monto</th></tr></thead>
                            <tbody>
                                {ledgerTxs.length > 0 ? ledgerTxs.filter(tx => !reconciledLedgerIds.has(tx.id)).map(tx => (
                                    <tr key={tx.id} style={selectedLedgerIds.has(tx.id) ? {backgroundColor: 'var(--hover-bg)'} : {}}>
                                        <td><input type="checkbox" checked={selectedLedgerIds.has(tx.id)} onChange={() => toggleSelection(tx.id, 'ledger')} /></td>
                                        <td>{tx.date}</td><td>{tx.description}</td><td style={{textAlign: 'right'}}>{formatCurrency(tx.amount)}</td>
                                    </tr>
                                )) : <tr><td colSpan={4} style={styles.placeholderText}>Seleccione una cuenta contable.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div style={styles.panel}>
                <div style={styles.header}>
                    <h4>Resumen Conciliación</h4>
                    <button className="btn btn-primary" disabled={!canReconcile} onClick={handleReconcile}>
                        <span className="material-symbols-outlined">task_alt</span>
                        Conciliar Seleccionados
                    </button>
                </div>
                 <div style={styles.summaryGrid}>
                    <div style={styles.summaryCard}>
                        <div style={styles.summaryLabel}>Total Seleccionado (Banco)</div>
                        <div style={styles.summaryValue}>{formatCurrency(totalSelectedBank)}</div>
                    </div>
                    <div style={styles.summaryCard}>
                        <div style={styles.summaryLabel}>Total Seleccionado (Contabilidad)</div>
                        <div style={styles.summaryValue}>{formatCurrency(totalSelectedLedger)}</div>
                    </div>
                    <div style={{...styles.summaryCard, borderLeftColor: canReconcile ? 'var(--success-color)' : 'var(--error-color)'}}>
                        <div style={styles.summaryLabel}>Diferencia</div>
                        <div style={styles.summaryValue}>{formatCurrency(totalSelectedBank - totalSelectedLedger)}</div>
                    </div>
                 </div>
            </div>
        </div>
    );
};

export default BankReconciliationView;