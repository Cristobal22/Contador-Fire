import React, { useMemo } from 'react';
import { useSession } from '../../context/SessionContext';

const styles = {
    tableContainer: {
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
    },
    tableFooter: {
        fontWeight: 'bold',
        backgroundColor: 'var(--sidebar-bg)',
    }
};

const BalancesView = () => {
    const { vouchers, accounts } = useSession();

    const balanceData = useMemo(() => {
        const accountTotals = new Map<number, { debit: number; credit: number }>();

        (vouchers || []).forEach(voucher => {
            voucher.entries.forEach(entry => {
                const accountId = entry.accountId;
                if (accountId === '') return;

                const current = accountTotals.get(accountId) || { debit: 0, credit: 0 };
                current.debit += entry.debit;
                current.credit += entry.credit;
                accountTotals.set(accountId, current);
            });
        });

        const rows = (accounts || [])
            .map(account => {
                const totals = accountTotals.get(account.id);
                if (!totals || (totals.debit === 0 && totals.credit === 0)) {
                    return null;
                }

                const balance = totals.debit - totals.credit;
                return {
                    code: account.code,
                    name: account.name,
                    debit: totals.debit,
                    credit: totals.credit,
                    debtorBalance: balance > 0 ? balance : 0,
                    creditorBalance: balance < 0 ? -balance : 0,
                };
            })
            .filter((row): row is NonNullable<typeof row> => row !== null)
            .sort((a, b) => a.code.localeCompare(b.code));

        const grandTotals = rows.reduce((acc, row) => {
            acc.debit += row.debit;
            acc.credit += row.credit;
            acc.debtorBalance += row.debtorBalance;
            acc.creditorBalance += row.creditorBalance;
            return acc;
        }, { debit: 0, credit: 0, debtorBalance: 0, creditorBalance: 0 });

        return { rows, grandTotals };
    }, [vouchers, accounts]);

    const formatCurrency = (value: number) => value > 0 ? value.toLocaleString('es-CL') : '';

    return (
        <div style={styles.tableContainer}>
            <table>
                <thead>
                    <tr>
                        <th rowSpan={2} style={{ verticalAlign: 'bottom' }}>Código</th>
                        <th rowSpan={2} style={{ verticalAlign: 'bottom' }}>Cuenta</th>
                        <th colSpan={2} style={{ textAlign: 'center' }}>Sumas</th>
                        <th colSpan={2} style={{ textAlign: 'center' }}>Saldos</th>
                    </tr>
                    <tr>
                        <th style={{ textAlign: 'right' }}>Debe</th>
                        <th style={{ textAlign: 'right' }}>Haber</th>
                        <th style={{ textAlign: 'right' }}>Deudor</th>
                        <th style={{ textAlign: 'right' }}>Acreedor</th>
                    </tr>
                </thead>
                <tbody>
                    {balanceData.rows.length > 0 ? balanceData.rows.map(row => (
                        <tr key={row.code}>
                            <td>{row.code}</td>
                            <td>{row.name}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(row.debit)}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(row.credit)}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(row.debtorBalance)}</td>
                            <td style={{ textAlign: 'right' }}>{formatCurrency(row.creditorBalance)}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan={6}>No hay movimientos para generar el balance.</td></tr>
                    )}
                </tbody>
                <tfoot>
                    <tr style={styles.tableFooter}>
                        <td colSpan={2}>Totales</td>
                        <td style={{ textAlign: 'right' }}>{balanceData.grandTotals.debit.toLocaleString('es-CL')}</td>
                        <td style={{ textAlign: 'right' }}>{balanceData.grandTotals.credit.toLocaleString('es-CL')}</td>
                        <td style={{ textAlign: 'right' }}>{balanceData.grandTotals.debtorBalance.toLocaleString('es-CL')}</td>
                        <td style={{ textAlign: 'right' }}>{balanceData.grandTotals.creditorBalance.toLocaleString('es-CL')}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

export default BalancesView;
