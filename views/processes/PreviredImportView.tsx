import React, { useState, useMemo, ChangeEvent } from 'react';
import { useSession } from '../../context/SessionContext';
import { EmployeeData, ParsedPreviredRow } from '../../types';

const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '24px' },
    panel: { padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--border-color)' },
    fileInput: {
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        padding: '10px',
        fontSize: '14px',
        width: '100%',
        backgroundColor: '#fff'
    },
    tableContainer: { maxHeight: '400px', overflowY: 'auto', marginTop: '16px' },
    statusNew: { color: 'var(--success-color)' },
    statusExists: { color: 'var(--text-light-color)' },
    statusError: { color: 'var(--error-color)', fontWeight: 500 },
    summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
    summaryCard: { padding: '16px', backgroundColor: 'var(--sidebar-bg)', borderRadius: '4px' },
    summaryLabel: { fontSize: '12px', color: 'var(--text-light-color)', textTransform: 'uppercase' } as React.CSSProperties,
    summaryValue: { fontSize: '18px', fontWeight: 500, marginTop: '4px' },
} as const;

const PreviredImportView = () => {
    const { employees, activePeriod, importAndProcessPreviredData, addNotification, handleApiError } = useSession();
    const [parsedRows, setParsedRows] = useState<ParsedPreviredRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fileKey, setFileKey] = useState(Date.now()); // Used to reset the file input

    const parsePreviredCsv = (csvText: string): ParsedPreviredRow[] => {
        const lines = csvText.split('\n').slice(1); // Skip header

        return lines.map((line, index): ParsedPreviredRow | null => {
            if (!line.trim()) return null;

            const [rut, apPaterno, apMaterno, nombres, taxableIncomeStr, daysWorkedStr] = line.split(',').map(s => s.trim());
            const originalData = { rut, apPaterno, apMaterno, nombres, taxableIncomeStr, daysWorkedStr };
            
            if (!rut || !apPaterno || !nombres || !taxableIncomeStr) {
                return { originalData, rowIndex: index, status: 'error', error: 'Faltan columnas requeridas (RUT, Apellido, Nombre, Sueldo).' };
            }

            const taxableIncome = parseInt(taxableIncomeStr, 10);
            if (isNaN(taxableIncome)) {
                return { originalData, rowIndex: index, status: 'error', error: 'Sueldo Imponible inválido.' };
            }
            
            const fullName = `${nombres} ${apPaterno} ${apMaterno}`.trim();

            const employeeData: EmployeeData = {
                rut,
                name: fullName,
                position: 'No especificado',
                hireDate: `${activePeriod}-01`, // Default to first day of the period
                baseSalary: taxableIncome, // Use taxable income as base salary for calculation
                afpId: 21, // SIN AFP
                healthId: 22, // SIN ISAPRE
            };

            const existingEmployee = employees.find(e => e.rut === rut);
            
            return {
                originalData,
                employeeData,
                rowIndex: index,
                status: existingEmployee ? 'exists' : 'new'
            };

        }).filter((row): row is ParsedPreviredRow => row !== null);
    };


    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            setParsedRows([]);
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const text = event.target?.result as string;
                const parsed = parsePreviredCsv(text);
                setParsedRows(parsed);
                addNotification({ type: 'success', message: `Archivo procesado: ${parsed.length} registros encontrados.` });
            } catch (err) {
                 addNotification({ type: 'error', message: `Error al leer el archivo.` });
            }
        };
        reader.onerror = () => {
             addNotification({ type: 'error', message: `No se pudo leer el archivo.` });
        };
        reader.readAsText(file, 'ISO-8859-1'); // Common encoding for files from Chilean systems
    };
    
    const summary = useMemo(() => {
        const newEmployees = parsedRows.filter(r => r.status === 'new').length;
        const existingEmployees = parsedRows.filter(r => r.status === 'exists').length;
        const errorRows = parsedRows.filter(r => r.status === 'error').length;
        const validRows = newEmployees + existingEmployees;
        return { newEmployees, existingEmployees, errorRows, validRows };
    }, [parsedRows]);

    const handleImport = async () => {
        setIsLoading(true);
        try {
            const result = await importAndProcessPreviredData(parsedRows.filter(r => r.status !== 'error'));
            addNotification({ 
                type: 'success', 
                message: `Importación completa: ${result.employeesAdded} empleados nuevos y ${result.payslipsAdded} liquidaciones generadas.`
            });
            // Reset state after successful import
            setParsedRows([]);
            setFileKey(Date.now()); // This clears the file input
        } catch (error: any) {
            handleApiError(error, 'en la importación de Previred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.panel}>
                <h3 style={{ marginBottom: '1rem' }}>Importar Empleados y Remuneraciones desde Previred</h3>
                 <div className="form-group">
                    <label>Cargar archivo de nómina (.csv)</label>
                    <input type="file" key={fileKey} accept=".csv" style={styles.fileInput} onChange={handleFileChange} />
                    <small style={{ color: 'var(--text-light-color)', marginTop: '8px', display: 'block' }}>
                        Formato esperado: RUT,Apellido Paterno,Apellido Materno,Nombres,Sueldo Imponible,Dias Trabajados
                    </small>
                </div>
            </div>

            {parsedRows.length > 0 && (
                <div style={styles.panel}>
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '1.5rem'}}>
                        <div style={styles.summaryGrid}>
                             <div style={styles.summaryCard}>
                                <div style={styles.summaryLabel}>Nuevos Empleados</div>
                                <div style={{...styles.summaryValue, color: 'var(--success-color)'}}>{summary.newEmployees}</div>
                            </div>
                             <div style={styles.summaryCard}>
                                <div style={styles.summaryLabel}>Empleados Existentes</div>
                                <div style={{...styles.summaryValue, color: 'var(--text-light-color)'}}>{summary.existingEmployees}</div>
                            </div>
                             <div style={styles.summaryCard}>
                                <div style={styles.summaryLabel}>Registros con Errores</div>
                                <div style={{...styles.summaryValue, color: 'var(--error-color)'}}>{summary.errorRows}</div>
                            </div>
                        </div>
                         <button 
                            className={`btn btn-primary ${isLoading ? 'loading' : ''}`} 
                            onClick={handleImport}
                            disabled={isLoading || summary.validRows === 0}
                        >
                            {isLoading && <div className="spinner"></div>}
                            <span className="btn-text">Procesar {summary.validRows} Registros Válidos</span>
                        </button>
                    </div>

                    <div style={styles.tableContainer}>
                        <table>
                            <thead><tr><th>RUT</th><th>Nombre</th><th>Sueldo Imponible</th><th>Estado</th></tr></thead>
                            <tbody>
                                {parsedRows.map(row => (
                                    <tr key={row.rowIndex}>
                                        <td>{row.originalData.rut}</td>
                                        <td>{`${row.originalData.nombres} ${row.originalData.apPaterno}`}</td>
                                        <td style={{textAlign: 'right'}}>{parseInt(row.originalData.taxableIncomeStr || '0').toLocaleString('es-CL')}</td>
                                        <td>
                                            {row.status === 'new' && <span style={styles.statusNew}>Nuevo</span>}
                                            {row.status === 'exists' && <span style={styles.statusExists}>Existente</span>}
                                            {row.status === 'error' && <span style={styles.statusError} title={row.error}>{row.error}</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PreviredImportView;