import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { CrudView } from '../components/CrudView';
import type { ChartOfAccount } from '../types';
import Papa from 'papaparse'; // Library to parse CSV files

const styles = {
    container: {
        padding: '2rem',
    },
    importPanel: {
        backgroundColor: '#f9f9f9',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem',
    },
    panelTitle: {
        margin: '0 0 1rem 0',
        fontSize: '1.2rem',
        fontWeight: 500,
    },
    formGroup: {
        marginBottom: '1rem',
    },
    fileInput: {
        display: 'block',
        marginTop: '0.5rem',
    },
    button: {
        marginRight: '1rem',
        padding: '8px 16px',
        cursor: 'pointer',
    },
    textLink: {
        color: 'var(--primary-color)',
        textDecoration: 'underline',
        cursor: 'pointer',
    },
    smallText: {
        color: 'var(--text-light-color)',
        marginTop: '8px',
        display: 'block'
    }
};

const CHART_OF_ACCOUNTS_TEMPLATE_HEADERS = ['code', 'name', 'type'];

const ChartOfAccountsView = () => {
    const session = useSession();
    const [file, setFile] = useState<File | null>(null);
    const [fileKey, setFileKey] = useState(Date.now()); // To reset file input

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setFile(event.target.files[0]);
        }
    };

    const handleDownloadTemplate = () => {
        const csv = Papa.unparse([CHART_OF_ACCOUNTS_TEMPLATE_HEADERS]);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'plantilla_plan_de_cuentas.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImport = () => {
        if (!file) {
            alert('Por favor, seleccione un archivo primero.');
            return;
        }

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const accountsToImport = results.data as any[];

                if (!accountsToImport.length || !CHART_OF_ACCOUNTS_TEMPLATE_HEADERS.every(h => Object.keys(accountsToImport[0]).includes(h))) {
                    alert(`El archivo no tiene el formato esperado. Asegúrese de que las columnas sean: ${CHART_OF_ACCOUNTS_TEMPLATE_HEADERS.join(', ')}`);
                    return;
                }
                
                try {
                    // We can implement a bulk add in the future. For now, we add one by one.
                    for (const acc of accountsToImport) {
                        const newAccount: Omit<ChartOfAccount, 'id'> = {
                            code: acc.code,
                            name: acc.name,
                            type: acc.type,
                            companyId: session.company?.id || 0, 
                        };
                        await session.addAccount(newAccount);
                    }
                    alert('¡Cuentas importadas con éxito!');
                } catch (error) {
                    console.error("Error al importar cuentas:", error);
                    alert('Hubo un error al importar las cuentas. Revise la consola para más detalles.');
                } finally {
                    setFile(null);
                    setFileKey(Date.now()); // Reset file input
                }
            },
            error: (error: any) => {
                alert('Ocurrió un error al leer el archivo CSV.');
                console.error("CSV Parsing Error:", error);
            }
        });
    };

    return (
        <div style={styles.container}>
            <div style={styles.importPanel}>
                <h3 style={styles.panelTitle}>Importar Plan de Cuentas</h3>
                <p>
                    Puedes cargar masivamente tu plan de cuentas usando un archivo CSV.
                    <span onClick={handleDownloadTemplate} style={styles.textLink}> Descargar plantilla</span>.
                </p>
                <div style={styles.formGroup}>
                    <label>Cargar archivo de plan de cuentas (.csv)</label>
                    <input type="file" key={fileKey} accept=".csv" style={styles.fileInput} onChange={handleFileChange} />
                    <small style={styles.smallText}>
                        Formato esperado: {CHART_OF_ACCOUNTS_TEMPLATE_HEADERS.join(', ')}
                    </small>
                </div>
                <button style={styles.button} onClick={handleImport} disabled={!file}>Importar Cuentas</button>
            </div>

            <CrudView<ChartOfAccount>
                title="Cuenta"
                columns={[
                    { key: 'code', header: 'Código' },
                    { key: 'name', header: 'Nombre' },
                    { key: 'type', header: 'Tipo' }
                ]}
                data={session.accounts || []}
                onSave={session.addAccount}
                onUpdate={session.updateAccount}
                onDelete={session.deleteAccount}
                formFields={[
                    { name: 'code', label: 'Código', type: 'text' },
                    { name: 'name', label: 'Nombre', type: 'text' },
                    { name: 'type', label: 'Tipo', type: 'select', options: ['Activo', 'Pasivo', 'Patrimonio', 'Resultado'] }
                ]}
            />
        </div>
    );
};

export default ChartOfAccountsView;
