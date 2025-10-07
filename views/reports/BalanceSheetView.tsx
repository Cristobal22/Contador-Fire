import React, { useMemo } from 'react';
import { useSession } from '../../context/SessionContext';

const styles = {
    container: {
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        padding: '2rem',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
    },
    section: {
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        borderBottom: '2px solid var(--primary-color)',
        paddingBottom: '8px',
        marginBottom: '16px',
        fontSize: '18px',
        fontWeight: 500,
    },
    row: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid #e0e0e0',
    },
    footerRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '12px 0',
        marginTop: '16px',
        fontWeight: 'bold',
        borderTop: '2px solid var(--text-color)',
    },
    totalEqualityCheck: {
        marginTop: '24px',
        padding: '16px',
        textAlign: 'center',
        fontWeight: 'bold',
        borderRadius: '4px',
    }
} as const;

const formatCurrency = (value: number) => {
    return value.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
};

const BalanceSheetView = () => {
    const { vouchers, accounts } = useSession();

    const reportData = useMemo(() => {
        const accountBalances = new Map<number, number>();

        vouchers.forEach(voucher => {
            voucher.entries.forEach(entry => {
                if (entry.accountId === '') return;
                const currentBalance = accountBalances.get(entry.accountId) || 0;
                accountBalances.set(entry.accountId, currentBalance + entry.debit - entry.credit);
            });
        });

        const assets = accounts
            .filter(a => a.type === 'Activo' && accountBalances.has(a.id))
            .map(a => ({ name: a.name, balance: accountBalances.get(a.id)! }))
            .filter(a => a.balance !== 0);
            
        const liabilities = accounts
            .filter(a => a.type === 'Pasivo' && accountBalances.has(a.id))
            .map(a => ({ name: a.name, balance: -accountBalances.get(a.id)! })) // Liabilities have credit balance (negative), shown as positive
            .filter(l => l.balance !== 0);

        const equity = accounts
            .filter(a => a.type === 'Patrimonio' && accountBalances.has(a.id))
            .map(a => ({ name: a.name, balance: -accountBalances.get(a.id)! }))
             .filter(e => e.balance !== 0);

        const netIncome = accounts
            .filter(a => a.type === 'Resultado' && accountBalances.has(a.id))
            .reduce((sum, a) => sum - accountBalances.get(a.id)!, 0); // Income (credit) is negative, expenses (debit) are positive. Invert sign for result.

        const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
        const totalLiabilities = liabilities.reduce((sum, l) => sum + l.balance, 0);
        const totalEquity = equity.reduce((sum, e) => sum + e.balance, 0) + netIncome;
        const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

        return {
            assets,
            liabilities,
            equity,
            netIncome,
            totalAssets,
            totalLiabilities,
            totalEquity,
            totalLiabilitiesAndEquity
        };
    }, [vouchers, accounts]);

    return (
        <div style={styles.container}>
            <div style={styles.grid}>
                {/* Assets Column */}
                <div style={styles.section}>
                    <h3 style={styles.header}>Activos</h3>
                    {reportData.assets.map(asset => (
                        <div style={styles.row} key={asset.name}>
                            <span>{asset.name}</span>
                            <span>{formatCurrency(asset.balance)}</span>
                        </div>
                    ))}
                    <div style={styles.footerRow}>
                        <span>Total Activos</span>
                        <span>{formatCurrency(reportData.totalAssets)}</span>
                    </div>
                </div>

                {/* Liabilities & Equity Column */}
                <div style={styles.section}>
                    <h3 style={styles.header}>Pasivos</h3>
                    {reportData.liabilities.map(liability => (
                        <div style={styles.row} key={liability.name}>
                            <span>{liability.name}</span>
                            <span>{formatCurrency(liability.balance)}</span>
                        </div>
                    ))}
                     <div style={{...styles.footerRow, borderTop: '1px solid var(--text-color)', marginTop: '8px', padding: '8px 0'}}>
                        <span>Total Pasivos</span>
                        <span>{formatCurrency(reportData.totalLiabilities)}</span>
                    </div>

                    <h3 style={{...styles.header, marginTop: '24px'}}>Patrimonio</h3>
                     {reportData.equity.map(eq => (
                        <div style={styles.row} key={eq.name}>
                            <span>{eq.name}</span>
                            <span>{formatCurrency(eq.balance)}</span>
                        </div>
                    ))}
                    <div style={styles.row}>
                        <span>Resultado del Ejercicio</span>
                        <span>{formatCurrency(reportData.netIncome)}</span>
                    </div>
                     <div style={{...styles.footerRow, borderTop: '1px solid var(--text-color)', marginTop: '8px', padding: '8px 0'}}>
                        <span>Total Patrimonio</span>
                        <span>{formatCurrency(reportData.totalEquity)}</span>
                    </div>

                    <div style={styles.footerRow}>
                        <span>Total Pasivo y Patrimonio</span>
                        <span>{formatCurrency(reportData.totalLiabilitiesAndEquity)}</span>
                    </div>
                </div>
            </div>
             <div style={{
                ...styles.totalEqualityCheck,
                backgroundColor: Math.abs(reportData.totalAssets - reportData.totalLiabilitiesAndEquity) < 0.01 ? 'var(--hover-bg)' : 'rgba(217, 48, 37, 0.1)',
                color: Math.abs(reportData.totalAssets - reportData.totalLiabilitiesAndEquity) < 0.01 ? 'var(--success-color)' : 'var(--error-color)',
             }}>
                {Math.abs(reportData.totalAssets - reportData.totalLiabilitiesAndEquity) < 0.01
                    ? 'BALANCE CUADRADO: Total Activos = Total Pasivo y Patrimonio'
                    : 'BALANCE DESCUADRADO'
                }
            </div>
        </div>
    );
};

export default BalanceSheetView;
