import React, { useState, useMemo } from 'react';
import { useSession } from '../../context/SessionContext';

const styles = {
    // FIX: Cast style object to React.CSSProperties to ensure type compatibility for 'flexDirection'.
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    } as React.CSSProperties,
    filterBar: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
    },
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
    },
    summaryCard: {
        padding: '16px',
        backgroundColor: 'var(--sidebar-bg)',
        borderRadius: '4px',
        borderLeft: '4px solid var(--primary-color)',
    },
    summaryLabel: {
        fontSize: '12px',
        color: 'var(--text-light-color)',
        textTransform: 'uppercase' as React.CSSProperties['textTransform'],
    },
    summaryValue: {
        fontSize: '20px',
        fontWeight: 500,
    },
    tableContainer: {
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
    },
    placeholder: {
        padding: '2rem',
        textAlign: 'center' as const,
        color: 'var(--text-light-color)',
    }
};

const GeneralLedgerView = () => {
    const { vouchers, accounts } = useSession();
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

    const accountMovements = useMemo(() => {
        if (!selectedAccountId) return null;

        const allEntries = (vouchers || [])
            .flatMap(v => v.entries.map(e => ({ ...e, date: v.date, description: v.description, voucherId: v.id })))
            .filter(e => e.accountId === selectedAccountId)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        let runningBalance = 0;
        const movementsWithBalance = allEntries.map(entry => {
            runningBalance += entry.debit - entry.credit;
            return { ...entry, balance: runningBalance };
        });

        const totalDebit = allEntries.reduce((sum, e) => sum + e.debit, 0);
        const totalCredit = allEntries.reduce((sum, e) => sum + e.credit, 0);
        const finalBalance = totalDebit - totalCredit;

        return { movements: movementsWithBalance, totalDebit, totalCredit, finalBalance };
    }, [selectedAccountId, vouchers]);

    const formatCurrency = (value: number) => value.toLocaleString('es-CL');

    return (
        <div style={styles.container}>
            <div style={styles.filterBar}>
                <label htmlFor="account-select" style={{ fontWeight: 500 }}>Cuenta Contable:</label>
                <select 
                    id="account-select"
                    className="form-group select" 
                    value={selectedAccountId ?? ''}
                    onChange={e => setSelectedAccountId(Number(e.target.value) || null)}
                    style={{ width: '400px', padding: '8px' }}
                >
                    <option value="">-- Seleccione una cuenta --</option>
                    {(accounts || []).sort((a,b) => a.code.localeCompare(b.code)).map(acc => (
                        <option key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name}
                        </option>
                    ))}
                </select>
            </div>

            {selectedAccountId && accountMovements ? (
                <>
                    <div style={styles.summaryGrid}>
                        <div style={styles.summaryCard}>
                            <div style={styles.summaryLabel}>Total Debe</div>
                            <div style={styles.summaryValue}>{formatCurrency(accountMovements.totalDebit)}</div>
                        </div>
                         <div style={styles.summaryCard}>
                            <div style={styles.summaryLabel}>Total Haber</div>
                            <div style={styles.summaryValue}>{formatCurrency(accountMovements.totalCredit)}</div>
                        </div>
                         <div style={styles.summaryCard}>
                            <div style={styles.summaryLabel}>Saldo Final</div>
                            <div style={styles.summaryValue}>{formatCurrency(accountMovements.finalBalance)}</div>
                        </div>
                    </div>
                    <div style={styles.tableContainer}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Fecha</th>
                                    <th>Comprobante</th>
                                    <th>Glosa</th>
                                    <th style={{ textAlign: 'right' }}>Debe</th>
                                    <th style={{ textAlign: 'right' }}>Haber</th>
                                    <th style={{ textAlign: 'right' }}>Saldo</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accountMovements.movements.length > 0 ? accountMovements.movements.map((m, index) => (
                                    <tr key={`${m.voucherId}-${m.id}-${index}`}>
                                        <td>{m.date}</td>
                                        <td>#{m.voucherId}</td>
                                        <td>{m.description}</td>
                                        <td style={{ textAlign: 'right' }}>{m.debit > 0 ? formatCurrency(m.debit) : ''}</td>
                                        <td style={{ textAlign: 'right' }}>{m.credit > 0 ? formatCurrency(m.credit) : ''}</td>
                                        <td style={{ textAlign: 'right' }}>{formatCurrency(m.balance)}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={6}>No hay movimientos para esta cuenta.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                <div style={{ ...styles.tableContainer, ...styles.placeholder }}>
                    <p>Seleccione una cuenta para ver su libro mayor.</p>
                </div>
            )}
        </div>
    );
};

export default GeneralLedgerView;