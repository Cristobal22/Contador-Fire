import React, { useState, useMemo } from 'react';
import { useSession } from '../../context/SessionContext';

const styles = {
    panel: { padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--border-color)' },
    summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px', marginBottom: '20px' },
    summaryCard: { padding: '16px', backgroundColor: 'var(--sidebar-bg)', borderRadius: '4px', borderLeft: '4px solid var(--primary-color)' },
    // FIX: Cast style object to React.CSSProperties to ensure type compatibility for 'textTransform'.
    summaryLabel: { fontSize: '12px', color: 'var(--text-light-color)', textTransform: 'uppercase' } as React.CSSProperties,
    summaryValue: { fontSize: '20px', fontWeight: 500 },
};

const PayrollCentralizationView = () => {
    const { activePeriod, payslips, centralizePayslips, addNotification, handleApiError } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    const payslipsForPeriod = useMemo(() => 
        payslips.filter(p => p.period === activePeriod),
        [payslips, activePeriod]
    );

    const summary = useMemo(() => {
        return payslipsForPeriod.reduce((acc, p) => {
            acc.grossPay += p.grossPay;
            acc.netPay += p.netPay;
            return acc;
        }, { grossPay: 0, netPay: 0 });
    }, [payslipsForPeriod]);

    const handleCentralize = async () => {
        setIsLoading(true);
        try {
            await centralizePayslips(activePeriod);
            addNotification({ type: 'success', message: `Centralización para ${activePeriod} ejecutada con éxito.` });
        } catch (error: any) {
            handleApiError(error, 'al centralizar remuneraciones');
        } finally {
            setIsLoading(false);
        }
    };

    const canCentralize = payslipsForPeriod.length > 0;

    return (
        <div style={styles.panel}>
            <h3>Centralización de Remuneraciones</h3>
            <p>Este proceso genera el comprobante contable resumen de las liquidaciones del período <strong>{activePeriod}</strong>.</p>
            
            {canCentralize ? (
                <>
                    <div style={styles.summaryGrid}>
                        <div style={styles.summaryCard}>
                            <div style={styles.summaryLabel}>Liquidaciones a Procesar</div>
                            <div style={styles.summaryValue}>{payslipsForPeriod.length}</div>
                        </div>
                        <div style={styles.summaryCard}>
                            <div style={styles.summaryLabel}>Total Haberes (Gasto)</div>
                            <div style={styles.summaryValue}>{summary.grossPay.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</div>
                        </div>
                        <div style={styles.summaryCard}>
                            <div style={styles.summaryLabel}>Total Líquido a Pagar</div>
                            <div style={styles.summaryValue}>{summary.netPay.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</div>
                        </div>
                    </div>
                    <div style={{ marginTop: '20px' }}>
                        <button className={`btn btn-primary ${isLoading ? 'loading' : ''}`} onClick={handleCentralize} disabled={isLoading}>
                             {isLoading && <div className="spinner"></div>}
                             <span className="btn-text">Ejecutar Centralización</span>
                        </button>
                    </div>
                </>
            ) : (
                <p style={{ marginTop: '20px', fontWeight: 500 }}>No hay liquidaciones generadas en el período {activePeriod} para centralizar.</p>
            )}
        </div>
    );
};

export default PayrollCentralizationView;