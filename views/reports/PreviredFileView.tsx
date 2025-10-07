import React, { useState, useMemo } from 'react';
import { useSession } from '../../context/SessionContext';

const styles = {
    panel: { padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--border-color)' },
    summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px', marginBottom: '20px' },
    summaryCard: { padding: '16px', backgroundColor: 'var(--sidebar-bg)', borderRadius: '4px', borderLeft: '4px solid var(--primary-color)' },
    summaryLabel: { fontSize: '12px', color: 'var(--text-light-color)', textTransform: 'uppercase' } as React.CSSProperties,
    summaryValue: { fontSize: '20px', fontWeight: 500 },
};

// Helper functions for file generation
const pad = (str: string, length: number, char = ' ') => str.padEnd(length, char);
const padNum = (num: number, length: number) => Math.round(num).toString().padStart(length, '0');

const PreviredFileView = () => {
    const { activePeriod, payslips, employees, institutions, companies, activeCompanyId, addNotification } = useSession();
    const [isLoading, setIsLoading] = useState(false);

    const payslipsForPeriod = useMemo(() => 
        payslips.filter(p => p.period === activePeriod),
        [payslips, activePeriod]
    );
    
    const getDeduction = (deductions: any[], name: string) => {
        return deductions.find(d => d.name.toLowerCase().includes(name.toLowerCase()))?.amount || 0;
    };

    const summary = useMemo(() => {
        return payslipsForPeriod.reduce((acc, p) => {
            acc.afp += getDeduction(p.deductions, 'afp');
            acc.health += getDeduction(p.deductions, 'salud');
            acc.unemployment += getDeduction(p.deductions, 'cesantía');
            return acc;
        }, { afp: 0, health: 0, unemployment: 0 });
    }, [payslipsForPeriod]);
    
    const generatePreviredContent = (): string => {
        const company = companies.find(c => c.id === activeCompanyId);
        if (!company) return '';

        let content = '';

        payslipsForPeriod.forEach(p => {
            const employee = employees.find(e => e.id === p.employeeId);
            if (!employee) return;
            
            const rutFormatted = employee.rut.replace(/\./g, '').replace('-', '');
            
            const afpAmount = getDeduction(p.deductions, 'afp');
            const healthAmount = getDeduction(p.deductions, 'salud');

            // This is a simplified, fictional representation of the 183-char format
            let line = '';
            line += pad(rutFormatted, 11); // 1-11: RUT
            line += pad(employee.name.split(' ').slice(0, 2).join(' '), 30); // 12-41: Apellidos
            line += pad(employee.name.split(' ').slice(2).join(' '), 20); // 42-61: Nombres
            line += pad('M', 1); // 62: Sexo (simulated)
            line += pad('CHI', 3); // 63-65: Nacionalidad (simulated)
            line += padNum(p.taxableIncome, 9); // 66-74: Renta Imponible AFP
            line += padNum(afpAmount, 9); // 75-83: Cotización Obligatoria
            line += padNum(p.taxableIncome, 9); // 84-92: Renta Imponible Salud
            line += padNum(healthAmount, 9); // 93-101: Cotización Pactada
            line += pad('', 82); // Fill rest of 183 chars

            content += line.substring(0, 183) + '\n';
        });

        return content;
    };


    const handleGenerate = () => {
        setIsLoading(true);
        // Simulate a short delay for file generation
        setTimeout(() => {
            try {
                const fileContent = generatePreviredContent();
                if (!fileContent) {
                    addNotification({ type: 'error', message: 'No hay datos para generar el archivo.' });
                    setIsLoading(false);
                    return;
                }

                const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `previred_${activePeriod.replace('-', '')}.txt`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                addNotification({ type: 'success', message: 'Archivo Previred generado y descargado.' });
            } catch (error) {
                addNotification({ type: 'error', message: 'Ocurrió un error al generar el archivo.' });
            } finally {
                setIsLoading(false);
            }
        }, 1000);
    };

    const canGenerate = payslipsForPeriod.length > 0;

    return (
        <div style={styles.panel}>
            <h3>Generador de Archivo Previred</h3>
            <p>Este proceso genera el archivo de 183 caracteres para el pago de cotizaciones previsionales en Previred para el período <strong>{activePeriod}</strong>.</p>
            
            {canGenerate ? (
                <>
                    <div style={styles.summaryGrid}>
                        <div style={styles.summaryCard}>
                            <div style={styles.summaryLabel}>Total Cotización AFP</div>
                            <div style={styles.summaryValue}>{summary.afp.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</div>
                        </div>
                        <div style={styles.summaryCard}>
                            <div style={styles.summaryLabel}>Total Cotización Salud</div>
                            <div style={styles.summaryValue}>{summary.health.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</div>
                        </div>
                        <div style={styles.summaryCard}>
                            <div style={styles.summaryLabel}>Total Seguro Cesantía</div>
                            <div style={styles.summaryValue}>{summary.unemployment.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</div>
                        </div>
                    </div>
                    <div style={{ marginTop: '20px' }}>
                        <button className={`btn btn-primary ${isLoading ? 'loading' : ''}`} onClick={handleGenerate} disabled={isLoading}>
                             {isLoading && <div className="spinner"></div>}
                             <span className="btn-text">Generar Archivo</span>
                        </button>
                    </div>
                </>
            ) : (
                <p style={{ marginTop: '20px', fontWeight: 500 }}>No hay liquidaciones generadas en el período {activePeriod} para generar el archivo.</p>
            )}
        </div>
    );
};

export default PreviredFileView;