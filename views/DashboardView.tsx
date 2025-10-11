
import React, { useMemo } from 'react';
import { useSession } from '../context/SessionContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const styles = {
    dashboardContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
    } as React.CSSProperties,
    welcomePanel: {
        padding: '2rem',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
    },
    chartPanel: {
        padding: '2rem',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
    },
    noDataPlaceholder: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: 'var(--text-light-color)',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px',
    },
    chartTitle: {
        marginBottom: '24px',
        fontSize: '18px',
        fontWeight: 500
    }
};

const COLORS = ['#1a73e8', '#1e8e3e', '#d93025', '#f9ab00', '#8f00ff', '#ff6d00'];

const DashboardView = () => {
    const { session } = useSession();
    const { vouchers, accounts, activePeriod, periods } = session || {};

    const activePeriodLabel = useMemo(() => {
        if (!periods || periods.length === 0) return activePeriod;
        return periods.find(p => p.value === activePeriod)?.label || activePeriod;
    }, [periods, activePeriod]);

    const expenseData = useMemo(() => {
        if (!vouchers || !accounts || !activePeriod) return [];

        const expenseAccounts = accounts.filter(a => a.type === 'Resultado');
        const expenseAccountIds = new Set(expenseAccounts.map(a => a.id));
        const periodVouchers = vouchers.filter(v => v.date.startsWith(activePeriod));

        const totals = new Map<string, number>();
        for (const voucher of periodVouchers) {
            for (const entry of voucher.entries) {
                if (entry.accountId && expenseAccountIds.has(entry.accountId)) {
                    const account = accounts.find(a => a.id === entry.accountId);
                    if (account) {
                        const currentTotal = totals.get(account.name) || 0;
                        const netAmount = entry.debit - entry.credit;
                        totals.set(account.name, currentTotal + netAmount);
                    }
                }
            }
        }

        return Array.from(totals.entries())
            .filter(([, total]) => total > 0)
            .map(([name, Gasto]) => ({ name, Gasto }))
            .sort((a, b) => b.Gasto - a.Gasto);

    }, [vouchers, accounts, activePeriod]);

    const formatCurrency = (value: number) => `$${new Intl.NumberFormat('es-CL').format(value)}`;
    const formatLabel = (value: string) => value.length > 20 ? `${value.substring(0, 20)}...` : value;

    if (!session) {
        return (
            <div style={styles.noDataPlaceholder}>
                <p>Cargando datos del dashboard...</p>
            </div>
        );
    }

    return (
        <div style={styles.dashboardContainer}>
            <div style={styles.welcomePanel}>
                <h3>Bienvenido al Sistema de Gestión Integrada</h3>
                <p>Aquí puede visualizar un resumen de los gastos del período seleccionado.</p>
            </div>
            <div style={styles.chartPanel}>
                <h3 style={styles.chartTitle}>Gastos por Categoría - {activePeriodLabel}</h3>
                {expenseData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={expenseData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 80 }}
                            layout="vertical"
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tickFormatter={value => new Intl.NumberFormat('es-CL', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
                            <YAxis dataKey="name" type="category" tickFormatter={formatLabel} width={150} />
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: '20px' }}/>
                            <Bar dataKey="Gasto" name="Total Gastado">
                                {expenseData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div style={styles.noDataPlaceholder}>
                        <p>No hay datos de gastos para mostrar en el período seleccionado.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardView;
