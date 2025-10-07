import React, { useState } from 'react';
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
    warningIcon: {
        marginRight: '10px',
        verticalAlign: 'middle',
        color: '#f9ab00'
    }
};

const MonthlyClosingView = () => {
    const { activePeriod, addNotification } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    const handleClosePeriod = () => {
        if (window.confirm(`¿Está seguro de que desea ejecutar el cierre para el período ${activePeriod}? Esta acción es irreversible y bloqueará cualquier modificación futura en este período.`)) {
            setIsLoading(true);
            // In a real app, this would call a backend process.
            setTimeout(() => {
                setIsLoading(false);
                addNotification({ type: 'success', message: `Cierre del período ${activePeriod} ejecutado con éxito.` });
                // Here you might want to update the app state to reflect the closed period,
                // for example, by adding it to a list of closed periods and disabling UI elements.
                // For this simulation, we just show the success message.
            }, 2000);
        }
    };

    return (
        <div style={styles.panel}>
            <h3>Cierre Mensual</h3>
            <p>Este proceso cierra el período contable <strong>{activePeriod}</strong>, impidiendo modificaciones futuras en los registros de dicho período.</p>
            
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

export default MonthlyClosingView;
