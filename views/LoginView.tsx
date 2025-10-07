import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import { Modal } from '../components/Modal';

const styles = {
    panel: {
        width: '100%',
        maxWidth: '400px',
        padding: '3rem',
        backgroundColor: '#fff',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    },
    title: {
        fontSize: '24px',
        fontWeight: 500,
        marginBottom: '0.5rem',
        textAlign: 'center',
    },
    subtitle: {
        marginBottom: '2rem',
        color: 'var(--text-light-color)',
        textAlign: 'center',
    },
    inputWrapper: {
        position: 'relative',
    },
    input: {
        width: '100%',
        padding: '12px 12px 12px 40px',
        border: '1px solid var(--border-color)',
        borderRadius: '4px',
        fontSize: '14px',
    },
    inputIcon: {
        position: 'absolute',
        left: '12px',
        top: '12px',
        color: 'var(--text-light-color)',
        margin: 0,
    },
    button: {
        width: '100%',
        padding: '12px',
    },
    forgotPasswordButton: {
        background: 'none',
        border: 'none',
        color: 'var(--primary-color)',
        cursor: 'pointer',
        display: 'block',
        fontSize: '12px',
        marginBottom: '20px',
        marginTop: '-12px',
        padding: 0,
        textAlign: 'right',
        textDecoration: 'none',
        width: '100%',
    },
} as const;


const PasswordResetModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { sendPasswordResetEmail, addNotification } = useSession();
    const [resetEmail, setResetEmail] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSendResetLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        try {
            await sendPasswordResetEmail(resetEmail);
            addNotification({
                type: 'success',
                message: 'Si existe una cuenta, se ha enviado un enlace para restablecer la contraseña.'
            });
            onClose();
        } catch (error: any) {
            addNotification({ type: 'error', message: error.message || 'Error al enviar el enlace.' });
        } finally {
            setIsSending(false);
            setResetEmail('');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Restablecer Contraseña">
            <form onSubmit={handleSendResetLink}>
                <div className="modal-body">
                    <p style={{ color: 'var(--text-light-color)', fontSize: '14px', marginBottom: '1rem' }}>
                        Ingrese su dirección de correo electrónico y le enviaremos un enlace para restablecer su contraseña.
                    </p>
                    <div className="form-group">
                        <label htmlFor="reset-email">Email</label>
                        <input
                            type="email"
                            id="reset-email"
                            value={resetEmail}
                            onChange={e => setResetEmail(e.target.value)}
                            placeholder="su-correo@ejemplo.com"
                            required
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSending}>
                        Cancelar
                    </button>
                    <button type="submit" className={`btn btn-primary ${isSending ? 'loading' : ''}`} disabled={isSending}>
                        {isSending && <div className="spinner"></div>}
                        <span className="btn-text">Enviar Enlace</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
};


const LoginView = () => {
    const { login, addNotification } = useSession();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const user = await login(email, password);
            addNotification({ type: 'success', message: `Bienvenido, ${user.name}!` });
        } catch (error: any) {
            let userFriendlyMessage = 'Ocurrió un error al intentar iniciar sesión.';
            if (error && error.message) {
                console.error('Login Error:', error.message);
                switch (error.message) {
                    case 'Invalid login credentials':
                        userFriendlyMessage = 'Credenciales inválidas. Por favor, verifique su correo y contraseña.';
                        break;
                    case 'Email not confirmed':
                        userFriendlyMessage = 'Debe confirmar su dirección de correo electrónico para poder ingresar.';
                        break;
                }
            }
            addNotification({ type: 'error', message: userFriendlyMessage });
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page-container">
            <PasswordResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} />
            <div className="login-branding-panel">
                <h1>
                    <span className="material-symbols-outlined">calculate</span>
                    Contador Experto
                </h1>
                <p>Su Aliado Estratégico en Gestión Contable y Financiera.</p>
            </div>
            <div className="login-form-panel">
                <div style={styles.panel}>
                     <div className="login-view-header-icon">
                        <span className="material-symbols-outlined" style={{fontSize: '3.5rem', color: 'var(--primary-color)', margin: 0}}>calculate</span>
                    </div>
                    <h1 style={styles.title}>Iniciar Sesión</h1>
                    <p style={styles.subtitle}>Bienvenido de nuevo</p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                             <label htmlFor="email">Email</label>
                            <div style={styles.inputWrapper}>
                                <span className="material-symbols-outlined" style={styles.inputIcon}>mail</span>
                                <input
                                    id="email"
                                    style={styles.input}
                                    type="email"
                                    placeholder="ej: admin@app.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                         <div className="form-group">
                             <label htmlFor="password">Contraseña</label>
                             <div style={styles.inputWrapper}>
                                <span className="material-symbols-outlined" style={styles.inputIcon}>lock</span>
                                <input
                                    id="password"
                                    style={styles.input}
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                         <button type="button" onClick={() => setIsResetModalOpen(true)} style={styles.forgotPasswordButton}>
                            ¿Olvidó su contraseña?
                        </button>
                        <button type="submit" className={`btn btn-primary ${isLoading ? 'loading' : ''}`} style={styles.button} disabled={isLoading}>
                            {isLoading && <div className="spinner"></div>}
                            <span className="btn-text">Ingresar</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginView;