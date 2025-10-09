import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { CrudView } from '../components/CrudView';
import type { ChartOfAccount } from '../types';
import Papa from 'papaparse'; // Library to parse CSV files
import Modal from '../components/Modal'; // Import the new Modal component

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        padding: '2rem',
    },
    topActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        marginBottom: '1rem', 
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
    },
    warningText: {
        color: '#f39c12', // A mild orange for warnings
        fontWeight: 'bold',
        display: 'block',
        marginTop: '8px',
    }
};

const CHART_OF_ACCOUNTS_TEMPLATE_HEADERS = ['code', 'name', 'type'];

const ChartOfAccountsView = () => {
    const session = useSession();
    const [file, setFile] = useState<File | null>(null);
    const [fileKey, setFileKey] = useState(Date.now()); // To reset file input
    const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility

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

    const handleLoadDefaultChartOfAccounts = () => {
        if (!window.confirm('¿Estás seguro de que quieres reemplazar tu plan de cuentas actual con el predeterminado? Se borrarán todas las cuentas existentes.')) {
            return;
        }

        fetch('/plan_de_cuentas_predeterminado.csv')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(csvText => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: async (results) => {
                        const accountsToImport = results.data as any[];

                        if (!accountsToImport.length) {
                            alert('El archivo de plan de cuentas predeterminado está vacío o no se pudo leer.');
                            return;
                        }

                        try {
                            // Delete all existing accounts for the current company
                            if (session.chartOfAccounts && session.chartOfAccounts.length > 0) {
                                for (const acc of session.chartOfAccounts) {
                                    await session.deleteChartOfAccount(acc.id);
                                }
                            }
                            
                            // Add new accounts
                            for (const acc of accountsToImport) {
                                if (acc.code && acc.name && acc.type) { // Basic validation
                                    const newAccount: Omit<ChartOfAccount, 'id' | 'company_id'> = {
                                        code: acc.code,
                                        name: acc.name,
                                        type: acc.type,
                                    };
                                    await session.addChartOfAccount(newAccount);
                                }
                            }
                            alert('¡Plan de cuentas predeterminado cargado con éxito!');
                            setIsModalOpen(false); // Close modal on success
                        } catch (error) {
                            console.error("Error al cargar el plan de cuentas predeterminado:", error);
                            alert('Hubo un error al cargar el plan de cuentas. Revise la consola para más detalles.');
                        }
                    },
                    error: (error: any) => {
                        alert('Ocurrió un error al procesar el archivo CSV predeterminado.');
                        console.error("CSV Parsing Error:", error);
                    }
                });
            })
            .catch(error => {
                alert('No se pudo encontrar o cargar el archivo del plan de cuentas predeterminado (plan_de_cuentas_predeterminado.csv).');
                console.error("Fetch error:", error);
            });
    };

    const handleImport = () => {
        if (!file) {
            alert('Por favor, seleccione un archivo primero.');
            return;
        }
        
        if (!window.confirm('¿Estás seguro de que quieres importar este archivo? Se reemplazarán todas las cuentas existentes.')) {
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
                     // Delete all existing accounts for the current company
                     if (session.chartOfAccounts && session.chartOfAccounts.length > 0) {
                        for (const acc of session.chartOfAccounts) {
                            await session.deleteChartOfAccount(acc.id);
                        }
                    }

                    // Add new accounts
                    for (const acc of accountsToImport) {
                        const newAccount: Omit<ChartOfAccount, 'id' | 'company_id'> = {
                            code: acc.code,
                            name: acc.name,
                            type: acc.type,
                        };
                        await session.addChartOfAccount(newAccount);
                    }
                    alert('¡Cuentas importadas con éxito!');
                    setIsModalOpen(false); // Close modal on success
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
            <div style={styles.topActions}>
                <button style={styles.button} onClick={() => setIsModalOpen(true)}>Modificar Plan de Cuentas</button>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Modificar Plan de Cuentas">
                <div style={styles.importPanel}>
                    <h3 style={styles.panelTitle}>Cargar Plan de Cuentas Predeterminado</h3>
                    <p>
                        Puedes cargar un plan de cuentas estándar basado en las mejores prácticas contables.
                    </p>
                    <small style={styles.warningText}>
                        Atención: Esta acción reemplazará todas las cuentas existentes en la empresa actual.
                    </small>
                    <br />
                    <button style={styles.button} onClick={handleLoadDefaultChartOfAccounts}>Cargar Plan Predeterminado</button>
                </div>

                <div style={styles.importPanel}>
                    <h3 style={styles.panelTitle}>Importar Plan de Cuentas Personalizado</h3>
                    <p>
                        O puedes cargar masivamente tu plan de cuentas usando un archivo CSV.
                        <span onClick={handleDownloadTemplate} style={styles.textLink}> Descargar plantilla</span>.
                    </p>
                    <div style={styles.formGroup}>
                        <label>Cargar archivo de plan de cuentas (.csv)</label>
                        <input type="file" key={fileKey} accept=".csv" style={styles.fileInput} onChange={handleFileChange} />
                        <small style={styles.smallText}>
                            Formato esperado: {CHART_OF_ACCOUNTS_TEMPLATE_HEADERS.join(', ')}
                        </small>
                        <small style={styles.warningText}>
                            Atención: Esta acción reemplazará todas las cuentas existentes en la empresa actual.
                        </small>
                    </div>
                    <button style={styles.button} onClick={handleImport} disabled={!file}>Importar Cuentas</button>
                </div>
            </Modal>

            <CrudView<ChartOfAccount>
                title="Cuenta"
                columns={[
                    { key: 'code', header: 'Código' },
                    { key: 'name', header: 'Nombre' },
                    { key: 'type', header: 'Tipo' }
                ]}
                data={session.chartOfAccounts || []}
                onSave={(acc) => session.addChartOfAccount(acc as Omit<ChartOfAccount, 'id' | 'company_id'>)}
                onUpdate={session.updateChartOfAccount}
                onDelete={session.deleteChartOfAccount}
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
