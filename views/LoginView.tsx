
import React, { useState } from 'react';
import { useSession } from '../context/SessionContext';
import Modal from '../components/Modal';

const styles = {
    // ... (estilos existentes) 
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
            addNotification({ type: 'success', message: 'Si existe una cuenta, se ha enviado un enlace.' });
            onClose();
        } catch (error) {
            // El error ya es manejado y notificado por el context
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
                        Ingrese su dirección de correo electrónico y le enviaremos un enlace para restablecerla.
                    </p>
                    <div className="form-group">
                        <label htmlFor="reset-email">Email</label>
                        <input id="reset-email" type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} required />
                    </div>
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                    <button type="submit" className={`btn btn-primary ${isSending ? 'loading' : ''}`} disabled={isSending}>
                        {isSending && <div className="spinner"></div>}<span className="btn-text">Enviar Enlace</span>
                    </button>
                </div>
            </form>
        </Modal>
    );
};


const LoginView = () => {
    const { login } = useSession();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(email, password);
            // El éxito es manejado por el listener onAuthStateChange, no es necesario hacer nada aquí.
        } catch (error) {
            // El error ya es manejado y notificado por el SessionContext
            // El estado de carga se detiene para permitir un nuevo intento.
            setIsLoading(false);
        }
        // No se necesita setIsLoading(false) en caso de éxito, porque el componente se desmontará.
    };

    return (
        <div className="login-page-container">
            <PasswordResetModal isOpen={isResetModalOpen} onClose={() => setIsResetModalOpen(false)} />
            <div className="login-branding-panel">
                <h1><span className="material-symbols-outlined">calculate</span>Contador Experto</h1>
                <p>Su Aliado Estratégico en Gestión Contable y Financiera.</p>
            </div>
            <div className="login-form-panel">
                <div style={{ width: '100%', maxWidth: '400px' }}>
                     <div className="login-view-header-icon">
                        <span className="material-symbols-outlined" style={{fontSize: '3.5rem', color: 'var(--primary-color)'}}>calculate</span>
                    </div>
                    <h1>Iniciar Sesión</h1>
                    <p style={{marginBottom: '2rem', color: 'var(--text-light-color)'}}>Bienvenido de nuevo</p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                             <label htmlFor="email">Email</label>
                            <div style={{position: 'relative'}}>
                                <span className="material-symbols-outlined" style={{position: 'absolute', left: 12, top: 12, color: 'var(--text-light-color)'}}>mail</span>
                                <input id="email" type="email" placeholder="admin@app.com" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                        </div>
                         <div className="form-group">
                             <label htmlFor="password">Contraseña</label>
                             <div style={{position: 'relative'}}>
                                <span className="material-symbols-outlined" style={{position: 'absolute', left: 12, top: 12, color: 'var(--text-light-color)'}}>lock</span>
                                <input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                            </div>
                        </div>
                         <button type="button" onClick={() => setIsResetModalOpen(true)} style={{background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', display: 'block', width: '100%', textAlign: 'right', fontSize: 12, marginBottom: 20, marginTop: -12}}>
                            ¿Olvidó su contraseña?
                        </button>
                        <button type="submit" className={`btn btn-primary ${isLoading ? 'loading' : ''}`} style={{width: '100%'}} disabled={isLoading}>
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
