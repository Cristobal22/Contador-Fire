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

const JournalLedgerView = () => {
    const { vouchers, accounts, activePeriod } = useSession();

    const getAccountDisplay = (id: number | '') => {
        if (id === '') return 'N/A';
        const account = (accounts || []).find(a => a.id === id);
        return account ? `${account.code} - ${account.name}` : 'Cuenta no encontrada';
    };

    const ledgerEntries = useMemo(() => {
        return (vouchers || [])
            .map(voucher => 
                voucher.entries.map(entry => ({
                    voucherId: voucher.id,
                    date: voucher.date,
                    description: voucher.description,
                    ...entry
                }))
            )
            .flat()
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [vouchers]);

    const totals = useMemo(() => {
        return ledgerEntries.reduce((acc, entry) => {
            acc.debit += entry.debit;
            acc.credit += entry.credit;
            return acc;
        }, { debit: 0, credit: 0 });
    }, [ledgerEntries]);

    return (
        <div style={styles.tableContainer}>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Comprobante</th>
                        <th>Cuenta Contable</th>
                        <th>Glosa</th>
                        <th style={{ textAlign: 'right' }}>Debe</th>
                        <th style={{ textAlign: 'right' }}>Haber</th>
                    </tr>
                </thead>
                <tbody>
                    {ledgerEntries.length > 0 ? ledgerEntries.map((entry, index) => (
                        <tr key={`${entry.voucherId}-${entry.id}-${index}`}>
                            <td>{entry.date}</td>
                            <td>{`#${entry.voucherId}`}</td>
                            <td>{getAccountDisplay(entry.accountId)}</td>
                            <td>{entry.description}</td>
                            <td style={{ textAlign: 'right' }}>{entry.debit > 0 ? entry.debit.toLocaleString('es-CL') : ''}</td>
                            <td style={{ textAlign: 'right' }}>{entry.credit > 0 ? entry.credit.toLocaleString('es-CL') : ''}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan={6}>No hay movimientos contables registrados.</td></tr>
                    )}
                </tbody>
                <tfoot>
                    <tr style={styles.tableFooter}>
                        <td colSpan={4}>Totales</td>
                        <td style={{ textAlign: 'right' }}>{totals.debit.toLocaleString('es-CL')}</td>
                        <td style={{ textAlign: 'right' }}>{totals.credit.toLocaleString('es-CL')}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

export default JournalLedgerView;
