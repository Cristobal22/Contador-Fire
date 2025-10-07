import React, { useState, useMemo, ChangeEvent } from 'react';
import { useSession } from '../../context/SessionContext';
import { InvoiceData } from '../../types';

const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '24px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
    panel: { padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid var(--border-color)' },
    fileInput: {
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        padding: '10px',
        fontSize: '14px',
        width: '100%',
        backgroundColor: '#fff'
    },
    tableContainer: { maxHeight: '300px', overflowY: 'auto', marginTop: '16px' },
    statusOk: { color: 'var(--success-color)' },
    statusError: { color: 'var(--error-color)', fontWeight: 500 },
    summaryCard: { padding: '16px', backgroundColor: 'var(--sidebar-bg)', borderRadius: '4px' },
    summaryLabel: { fontSize: '12px', color: 'var(--text-light-color)', textTransform: 'uppercase' } as React.CSSProperties,
    summaryValue: { fontSize: '18px', fontWeight: 500, marginTop: '4px' },
} as const;

type ParsedRow = {
    originalData: {
        docType?: string;
        rut?: string;
        name?: string;
        folio?: string;
        date?: string;
        netStr?: string;
        taxStr?: string;
        totalStr?: string;
    };
    invoiceData?: InvoiceData;
    status: 'ok' | 'error';
    error?: string;
    rowIndex: number;
};

const RcvPanel: React.FC<{
    title: string;
    type: 'Compra' | 'Venta';
    onFileParsed: (rows: ParsedRow[]) => void;
    parsedRows: ParsedRow[];
    fileKey: number;
}> = ({ title, type, onFileParsed, parsedRows, fileKey }) => {
    const { subjects } = useSession();

    const parseRcvCsv = (csvText: string): ParsedRow[] => {
        const lines = csvText.split('\n').slice(1); // Skip header
        const subjectType = type === 'Compra' ? 'Proveedor' : 'Cliente';

        return lines.map((line, index): ParsedRow | null => {
            if (!line.trim()) return null;

            const [docType, rut, name, folio, date, netStr, taxStr, totalStr] = line.split(',').map(s => s.trim());
            const originalData = { docType, rut, name, folio, date, netStr, taxStr, totalStr };
            
            if (!rut || !folio || !date || !netStr || !taxStr || !totalStr) {
                return { originalData, rowIndex: index, status: 'error', error: 'Faltan columnas.' };
            }

            const subject = subjects.find(s => s.rut === rut && s.type === subjectType);
            if (!subject) {
                return { originalData, rowIndex: index, status: 'error', error: `RUT de ${subjectType.toLowerCase()} no encontrado.` };
            }
            
            const net = parseInt(netStr, 10);
            const tax = parseInt(taxStr, 10);
            const total = parseInt(totalStr, 10);
            
            if (isNaN(net) || isNaN(tax) || isNaN(total)) {
                 return { originalData, rowIndex: index, status: 'error', error: 'Valores numéricos inválidos.' };
            }
            // Simple validation, total should be net + tax
            if (net + tax !== total) {
                return { originalData, rowIndex: index, status: 'error', error: 'Suma (neto + iva) no coincide con total.' };
            }

            const invoiceData: InvoiceData = { date, invoiceNumber: folio, subjectId: subject.id, net, tax, total, type };
            return { originalData, invoiceData, rowIndex: index, status: 'ok' };

        }).filter((row): row is ParsedRow => row !== null);
    };


    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) { onFileParsed([]); return; }

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const parsed = parseRcvCsv(text);
            onFileParsed(parsed);
        };
        reader.readAsText(file, 'ISO-8859-1'); // Common encoding for files from Chilean systems
    };
    
    const formatCurrency = (val: string) => parseInt(val, 10).toLocaleString('es-CL');

    return (
        <div style={styles.panel}>
            <h3 style={{ marginBottom: '1rem' }}>{title}</h3>
            <div className="form-group">
                <label>Cargar archivo RCV (.csv)</label>
                <input key={fileKey} type="file" accept=".csv" style={styles.fileInput} onChange={handleFileChange} />
                 <small style={{ color: 'var(--text-light-color)', marginTop: '8px', display: 'block' }}>Formato esperado: Tipo DTE, RUT, Razón Social, Folio, Fecha, Neto, IVA, Total</small>
            </div>
            {parsedRows.length > 0 && (
                <div style={styles.tableContainer}>
                    <table>
                        <thead>
                            <tr>
                                <th>Folio</th>
                                <th>RUT</th>
                                <th>Total</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {parsedRows.map(row => (
                                <tr key={`${type}-${row.rowIndex}`}>
                                    <td>{row.originalData.folio}</td>
                                    <td>{row.originalData.rut}</td>
                                    <td style={{ textAlign: 'right' }}>{row.originalData.totalStr ? formatCurrency(row.originalData.totalStr) : 'N/A'}</td>
                                    <td>
                                        {row.status === 'ok' ? 
                                            <span style={styles.statusOk}>OK</span> : 
                                            <span style={styles.statusError} title={row.error}>{row.error}</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const SiiCentralizationView = () => {
    const { addBatchInvoicesAndVouchers, addNotification, handleApiError } = useSession();
    const [compras, setCompras] = useState<ParsedRow[]>([]);
    const [ventas, setVentas] = useState<ParsedRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [comprasFileKey, setComprasFileKey] = useState(Date.now());
    const [ventasFileKey, setVentasFileKey] = useState(Date.now());

    const summary = useMemo(() => {
        const validCompras = compras.filter(c => c.status === 'ok').length;
        const errorCompras = compras.length - validCompras;
        const validVentas = ventas.filter(v => v.status === 'ok').length;
        const errorVentas = ventas.length - validVentas;

        return {
            totalDocs: compras.length + ventas.length,
            validDocs: validCompras + validVentas,
            errorDocs: errorCompras + errorVentas,
        };
    }, [compras, ventas]);

    const handleCentralize = async () => {
        setIsLoading(true);
        const validInvoices = [
            ...compras.filter(c => c.status === 'ok' && c.invoiceData).map(c => c.invoiceData!),
            ...ventas.filter(v => v.status === 'ok' && v.invoiceData).map(v => v.invoiceData!),
        ];

        if (validInvoices.length === 0) {
            addNotification({ type: 'error', message: 'No hay documentos válidos para centralizar.' });
            setIsLoading(false);
            return;
        }

        try {
            await addBatchInvoicesAndVouchers(validInvoices);
            addNotification({ type: 'success', message: `${validInvoices.length} documentos centralizados con éxito.` });
            setCompras([]);
            setVentas([]);
            setComprasFileKey(Date.now());
            setVentasFileKey(Date.now());
        } catch (error: any) {
            handleApiError(error, 'en la centralización de RCV');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.grid}>
                <RcvPanel title="Registro de Compras" type="Compra" onFileParsed={setCompras} parsedRows={compras} fileKey={comprasFileKey} />
                <RcvPanel title="Registro de Ventas" type="Venta" onFileParsed={setVentas} parsedRows={ventas} fileKey={ventasFileKey} />
            </div>

            {summary.totalDocs > 0 && (
                 <div style={{...styles.panel, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px'}}>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        <div style={styles.summaryCard}>
                            <div style={styles.summaryLabel}>Documentos Válidos</div>
                            <div style={{...styles.summaryValue, color: 'var(--success-color)'}}>{summary.validDocs}</div>
                        </div>
                         <div style={styles.summaryCard}>
                            <div style={styles.summaryLabel}>Documentos con Errores</div>
                            <div style={{...styles.summaryValue, color: 'var(--error-color)'}}>{summary.errorDocs}</div>
                        </div>
                    </div>
                    <button 
                        className={`btn btn-primary ${isLoading ? 'loading' : ''}`} 
                        onClick={handleCentralize}
                        disabled={isLoading || summary.validDocs === 0}
                    >
                        {isLoading && <div className="spinner"></div>}
                        <span className="btn-text">Centralizar {summary.validDocs} Documentos Válidos</span>
                    </button>
                 </div>
            )}
        </div>
    );
};

export default SiiCentralizationView;