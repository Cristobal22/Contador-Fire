
import React, { useState, useEffect } from 'react';
import { useSession } from '../context/SessionContext';
import { useNavigate } from 'react-router-dom';

const styles = {
    container: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8f9fa',
    },
    panel: {
        width: '100%',
        maxWidth: '450px',
        padding: '3rem',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        textAlign: 'center',
    },
    title: {
        fontSize: '24px',
        fontWeight: 500,
        marginBottom: '1rem',
    },
    subtitle: {
        marginBottom: '2rem',
        color: 'var(--text-light-color)',
    },
    button: {
        width: '100%',
        padding: '12px',
    },
} as const;

const UpdatePasswordView = () => {
    const { session, updatePassword, addNotification } = useSession();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!session) {
            addNotification({
                type: 'error',
                message: 'Debe iniciar sesión para actualizar su contraseña.'
            });
            navigate('/login');
        }
    }, [session, navigate, addNotification]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            addNotification({ type: 'error', message: 'Las contraseñas no coinciden.' });
            return;
        }
        if (password.length < 6) {
            addNotification({ type: 'error', message: 'La contraseña debe tener al menos 6 caracteres.' });
            return;
        }

        setIsLoading(true);
        try {
            await updatePassword(password);
            addNotification({
                type: 'success',
                message: 'Contraseña actualizada correctamente. Por favor, inicie sesión.'
            });
            navigate('/login');
        } catch (error: any) {
            addNotification({
                type: 'error',
                message: error.message || 'Error al actualizar la contraseña.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.panel}>
                <div className="login-view-header-icon">
                    <span className="material-symbols-outlined" style={{fontSize: '3.5rem', color: 'var(--primary-color)', margin: 0}}>lock_reset</span>
                </div>
                <h1 style={styles.title}>Establecer Nueva Contraseña</h1>
                <p style={styles.subtitle}>Por favor, ingrese su nueva contraseña a continuación.</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label htmlFor="new-password">Nueva Contraseña</label>
                        <input
                            id="new-password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <div className="form-group" style={{ textAlign: 'left' }}>
                        <label htmlFor="confirm-password">Confirmar Contraseña</label>
                        <input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button type="submit" className={`btn btn-primary ${isLoading ? 'loading' : ''}`} style={styles.button} disabled={isLoading}>
                        {isLoading && <div className="spinner"></div>}
                        <span className="btn-text">Actualizar Contraseña</span>
                    </button>
                </form>
            </div>
        </div>
    );
};

export default UpdatePasswordView;
