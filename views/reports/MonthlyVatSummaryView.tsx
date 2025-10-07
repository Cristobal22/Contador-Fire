import React, { useMemo } from 'react';
import { useSession } from '../../context/SessionContext';
import { Invoice } from '../../types';

const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '24px' } as React.CSSProperties,
    panel: { padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--border-color)' },
    summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' },
    summaryCard: { padding: '16px', backgroundColor: 'var(--sidebar-bg)', borderRadius: '4px' },
    summaryLabel: { fontSize: '12px', color: 'var(--text-light-color)', textTransform: 'uppercase' } as React.CSSProperties,
    summaryValue: { fontSize: '20px', fontWeight: 500, marginTop: '4px' },
    detailGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
    tableContainer: { overflow: 'hidden' },
    balanceCard: {
        padding: '16px',
        borderRadius: '4px',
        color: '#fff',
    },
};

const VatDetailTable: React.FC<{ title: string; invoices: Invoice[]; }> = ({ title, invoices }) => {
    const { subjects } = useSession();
    const getSubjectName = (id: number) => subjects.find(s => s.id === id)?.name || 'N/A';
    const formatCurrency = (value: number) => value.toLocaleString('es-CL');
    return (
        <div>
            <h4 style={{ marginBottom: '16px' }}>{title}</h4>
            <div style={styles.tableContainer}>
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>N°</th>
                            <th>Sujeto</th>
                            <th style={{ textAlign: 'right' }}>Neto</th>
                            <th style={{ textAlign: 'right' }}>IVA</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.length > 0 ? invoices.map(i => (
                            <tr key={i.id}>
                                <td>{i.date}</td>
                                <td>{i.invoiceNumber}</td>
                                <td>{getSubjectName(i.subjectId)}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(i.net)}</td>
                                <td style={{ textAlign: 'right' }}>{formatCurrency(i.tax)}</td>
                            </tr>
                        )) : <tr><td colSpan={5}>No hay movimientos en el período.</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const MonthlyVatSummaryView = () => {
    const { invoices, activePeriod, periods } = useSession();
    const activePeriodLabel = periods.find(p => p.value === activePeriod)?.label || activePeriod;

    const vatData = useMemo(() => {
        const periodInvoices = invoices.filter(i => i.date.startsWith(activePeriod));
        const sales = periodInvoices.filter(i => i.type === 'Venta');
        const purchases = periodInvoices.filter(i => i.type === 'Compra');

        const totalVatDebit = sales.reduce((sum, i) => sum + i.tax, 0);
        const totalVatCredit = purchases.reduce((sum, i) => sum + i.tax, 0);
        const vatBalance = totalVatDebit - totalVatCredit;

        return { sales, purchases, totalVatDebit, totalVatCredit, vatBalance };
    }, [invoices, activePeriod]);
    
    const formatCurrency = (value: number) => `$${value.toLocaleString('es-CL')}`;

    return (
        <div style={styles.container}>
            <div style={styles.panel}>
                <p style={{ color: 'var(--text-light-color)', marginBottom: '24px' }}>
                    Resumen de Impuesto al Valor Agregado (IVA) para el período de <strong>{activePeriodLabel}</strong>.
                </p>
                <div style={styles.summaryGrid}>
                    <div style={styles.summaryCard}>
                        <div style={styles.summaryLabel}>IVA Débito Fiscal (Ventas)</div>
                        <div style={{ ...styles.summaryValue, color: '#c53929' }}>{formatCurrency(vatData.totalVatDebit)}</div>
                    </div>
                    <div style={styles.summaryCard}>
                        <div style={styles.summaryLabel}>IVA Crédito Fiscal (Compras)</div>
                        <div style={{ ...styles.summaryValue, color: '#1e8e3e' }}>{formatCurrency(vatData.totalVatCredit)}</div>
                    </div>
                    <div style={{
                        ...styles.balanceCard,
                        backgroundColor: vatData.vatBalance >= 0 ? 'var(--error-color)' : 'var(--success-color)'
                    }}>
                        <div style={styles.summaryLabel}>{vatData.vatBalance >= 0 ? 'IVA a Pagar' : 'Remanente Crédito Fiscal'}</div>
                        <div style={styles.summaryValue}>{formatCurrency(Math.abs(vatData.vatBalance))}</div>
                    </div>
                </div>
            </div>
             <div style={styles.panel}>
                <div style={styles.detailGrid}>
                    <VatDetailTable title="Detalle de Ventas (Débitos)" invoices={vatData.sales} />
                    <VatDetailTable title="Detalle de Compras (Créditos)" invoices={vatData.purchases} />
                </div>
            </div>
        </div>
    );
};

export default MonthlyVatSummaryView;