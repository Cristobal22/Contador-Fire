import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';

const styles = {
    panel: { padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--border-color)' },
    warning: {
        padding: '1rem',
        backgroundColor: '#feefc3',
        border: '1px solid #fce29b',
        borderRadius: '4px',
        marginBottom: '1.5rem',
        color: '#5c3c00'
    },
     error: {
        padding: '1rem',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '4px',
        marginBottom: '1.5rem',
        color: '#721c24'
    },
    warningIcon: {
        marginRight: '10px',
        verticalAlign: 'middle',
        color: '#f9ab00'
    },
    errorIcon: {
        marginRight: '10px',
        verticalAlign: 'middle',
        color: '#dc3545'
    }
};

const MonthlyClosingView = () => {
    const { activePeriod, activeCompany, periodStatuses, closePeriod, reopenPeriod, addNotification, handleApiError } = useSession();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);

    const periodStatus = useMemo(() => {
        const status = periodStatuses.find(p => p.period === activePeriod);
        return status ? status.status : 'Abierto';
    }, [periodStatuses, activePeriod]);

    const isPeriodClosed = periodStatus === 'Cerrado';

    const canClosePeriod = useMemo(() => {
        return !!activeCompany?.accumulated_result_account_id;
    }, [activeCompany]);

    const handleClosePeriod = async () => {
        if (!canClosePeriod) {
            addNotification({type: 'error', message: 'Por favor, configure la Cuenta de Resultado Acumulado en la configuración de la empresa antes de cerrar el período.'})
            return;
        }
        if (window.confirm(`¿Está seguro de que desea ejecutar el cierre para el período ${activePeriod}? Esta acción es irreversible y bloqueará cualquier modificación futura en este período.`)) {
            setIsLoading(true);
            try {
                await closePeriod(activePeriod);
                // Notification is handled inside closePeriod
            } catch (error) {
                handleApiError(error, 'al cerrar el período');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleReopenPeriod = async () => {
        if (window.confirm(`¿Está seguro de que desea REABRIR el período ${activePeriod}? Esta acción eliminará el comprobante de cierre y permitirá nuevas modificaciones.`)) {
            setIsLoading(true);
            try {
                await reopenPeriod(activePeriod);
                // Notification is handled inside reopenPeriod
            } catch (error) {
                handleApiError(error, 'al reabrir el período');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const renderActionContent = () => {
        if (isPeriodClosed) {
            return (
                <div style={{ marginTop: '20px' }}>
                    <p>El período <strong>{activePeriod}</strong> se encuentra <strong>CERRADO</strong>.</p>
                    <button 
                        className={`btn btn-warning ${isLoading ? 'loading' : ''}`} 
                        onClick={handleReopenPeriod}
                        disabled={isLoading}
                    >
                        {isLoading && <div className="spinner"></div>}
                        <span className="btn-text">Reabrir Período {activePeriod}</span>
                    </button>
                </div>
            );
        }

        if (!canClosePeriod) {
            return (
                 <div style={styles.error}>
                    <span className="material-symbols-outlined" style={styles.errorIcon}>error</span>
                    <strong>Acción Requerida:</strong> Para poder cerrar el período, primero debe configurar la 'Cuenta de Resultado Acumulado' en la configuración de la empresa.
                    <div className="mt-3">
                        <button className='btn btn-primary' onClick={() => navigate(`/configuracion/empresas/${activeCompany?.id}`)}>
                            Ir a Configuración
                        </button>
                    </div>
                </div>
            );
        }
        
        return (
            <div>
                <div style={styles.warning}>
                    <span className="material-symbols-outlined" style={styles.warningIcon}>warning</span>
                    <strong>Atención:</strong> Antes de ejecutar, asegúrese de que todos los movimientos (comprobantes, facturas, remuneraciones) del período han sido ingresados y validados correctamente.
                </div>
                <div style={{ marginTop: '20px' }}>
                    <button 
                        className={`btn btn-primary ${isLoading ? 'loading' : ''}`} 
                        onClick={handleClosePeriod}
                        disabled={isLoading}
                    >
                        {isLoading && <div className="spinner"></div>}
                        <span className="btn-text">Ejecutar Cierre Mensual para {activePeriod}</span>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div style={styles.panel}>
            <h3>Cierre Mensual</h3>
            <p>Este proceso cierra o reabre el período contable <strong>{activePeriod}</strong>.</p>
            {renderActionContent()}
        </div>
    );
};

export default MonthlyClosingView;
