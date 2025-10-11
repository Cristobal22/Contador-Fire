
import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import type { Account, AccountData } from '../types';
import Modal from '../components/Modal';
import Papa from 'papaparse';
import { AccountForm } from '../components/AccountForm';

const styles: { [key: string]: React.CSSProperties } = {
    container: { padding: '2rem' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
    title: { margin: 0, fontSize: '1.8rem' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { borderBottom: '2px solid var(--border-color)', padding: '12px', textAlign: 'left', color: 'var(--text-light-color)' },
    td: { borderBottom: '1px solid var(--border-color)', padding: '12px', verticalAlign: 'middle' },
    actions: { display: 'flex', gap: '10px' },
    emptyStateContainer: { textAlign: 'center', padding: '4rem 2rem', backgroundColor: '#f8f9fa', borderRadius: '8px' },
    emptyStateTitle: { fontSize: '1.5rem', marginBottom: '1rem' },
    emptyStateText: { color: 'var(--text-light-color)', marginBottom: '1.5rem', maxWidth: '500px', margin: '0 auto 1.5rem auto' },
};

const ChartOfAccountsView = () => {
    const { session, addNotification, handleApiError } = useSession();
    const { accounts, addAccount, updateAccount, deleteAccount } = session || {};
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

    const handleAddNew = () => {
        setSelectedAccount(null);
        setIsModalOpen(true);
    };

    const handleEdit = (account: Account) => {
        setSelectedAccount(account);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta cuenta?') && deleteAccount) {
            try {
                await deleteAccount(id);
                addNotification({ type: 'success', message: 'Cuenta eliminada.' });
            } catch (error) {
                handleApiError(error, 'al eliminar la cuenta');
            }
        }
    };

    const handleSave = async (data: AccountData) => {
        setIsLoading(true);
        try {
            if (selectedAccount && updateAccount) {
                await updateAccount({ ...data, id: selectedAccount.id });
                addNotification({ type: 'success', message: 'Cuenta actualizada.' });
            } else if (addAccount) {
                await addAccount(data);
                addNotification({ type: 'success', message: 'Cuenta creada.' });
            }
            setIsModalOpen(false);
        } catch (error) {
            handleApiError(error, selectedAccount ? 'al actualizar la cuenta' : 'al crear la cuenta');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadDefault = () => {
        if (!window.confirm('¿Cargar el plan de cuentas predeterminado? Esta acción no se puede deshacer.') || !addAccount) return;
        setIsLoading(true);
        fetch('/plan_de_cuentas_predeterminado.csv')
            .then(response => response.text())
            .then(csvText => {
                Papa.parse(csvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: async (results) => {
                        const accountsToImport = results.data as AccountData[];
                        try {
                            for (const acc of accountsToImport) {
                                if (acc.code && acc.name && acc.type) {
                                    await addAccount(acc);
                                }
                            }
                            addNotification({ type: 'success', message: 'Plan de cuentas predeterminado cargado.' });
                        } catch (error) {
                           handleApiError(error, 'cargando el plan de cuentas');
                        }
                    },
                });
            })
            .catch(err => handleApiError(err, 'cargando el archivo del plan de cuentas'))
            .finally(() => setIsLoading(false));
    };
    
    if (!session) return <div>Cargando...</div>

    if (!accounts || accounts.length === 0) {
        return (
            <div style={{...styles.container, ...styles.emptyStateContainer}}>
                <h2 style={styles.emptyStateTitle}>Tu Plan de Cuentas está vacío</h2>
                <p style={styles.emptyStateText}>Para empezar, puedes crear las cuentas una por una o cargar nuestro plan de cuentas predeterminado, basado en las mejores prácticas contables.</p>
                <button className="btn btn-primary" style={{marginRight: '1rem'}} onClick={handleAddNew}>Crear Primera Cuenta</button>
                <button className="btn btn-secondary" onClick={handleLoadDefault} disabled={isLoading}>{isLoading ? 'Cargando...': 'Cargar Plan Predeterminado'}</button>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h1 style={styles.title}>Plan de Cuentas</h1>
                <button className="btn btn-primary" onClick={handleAddNew}><span className="material-symbols-outlined">add</span>Crear Nueva Cuenta</button>
            </div>

            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.th}>Código</th>
                        <th style={styles.th}>Nombre</th>
                        <th style={styles.th}>Tipo</th>
                        <th style={styles.th}></th>
                    </tr>
                </thead>
                <tbody>
                    {accounts.map(account => (
                        <tr key={account.id}>
                            <td style={styles.td}>{account.code}</td>
                            <td style={styles.td}>{account.name}</td>
                            <td style={styles.td}>{account.type}</td>
                            <td style={{...styles.td, textAlign: 'right'}}>
                                <div style={styles.actions}>
                                    <button className="btn-icon" onClick={() => handleEdit(account)} title="Editar"><span className="material-symbols-outlined">edit</span></button>
                                    <button className="btn-icon" onClick={() => handleDelete(account.id)} title="Eliminar"><span className="material-symbols-outlined">delete</span></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isModalOpen && (
                 <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedAccount ? 'Editar Cuenta' : 'Crear Cuenta'}>
                    <AccountForm 
                        account={selectedAccount}
                        onSave={handleSave}
                        onCancel={() => setIsModalOpen(false)}
                        isLoading={isLoading}
                    />
                </Modal>
            )}
        </div>
    );
};

export default ChartOfAccountsView;
