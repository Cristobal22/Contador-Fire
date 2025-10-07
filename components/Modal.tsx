import React from 'react';
import { createPortal } from 'react-dom';

type ModalProps = {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'md' | 'lg';
    className?: string;
};

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md', className = '' }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-content ${size === 'lg' ? 'modal-lg' : ''} ${className}`} onClick={e => e.stopPropagation()}>
                <div className="modal-header"><h3>{title}</h3><button className="btn-icon" onClick={onClose}><span className="material-symbols-outlined" style={{ margin: 0 }}>close</span></button></div>
                {children}
            </div>
        </div>,
        document.body
    );
};