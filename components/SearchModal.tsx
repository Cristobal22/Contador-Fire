import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { navStructure } from '../navigation';
import type { NavStructure as NavStructureType, NavItemDefinition } from '../types';

type SearchableItem = {
    path: string;
    label: string;
    breadcrumb: string;
};

const flattenNavForSearch = (
    navData: NavStructureType,
    parentBreadcrumb: string = ''
): SearchableItem[] => {
    let items: SearchableItem[] = [];

    for (const [key, value] of Object.entries(navData)) {
        const navItem = value as NavItemDefinition | { path: string };
        
        const breadcrumb = parentBreadcrumb ? `${parentBreadcrumb} > ${key}` : key;
        
        if ('children' in navItem && Object.keys(navItem.children).length > 0) {
            // This is a category, recurse.
            items = items.concat(flattenNavForSearch(navItem.children, breadcrumb));
        } else if ('path' in navItem && navItem.path) {
            // This is a leaf node with a path.
            items.push({
                path: navItem.path,
                label: key,
                breadcrumb: parentBreadcrumb,
            });
        }
    }
    return items;
};

export const SearchModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    const flatNav = useMemo(() => flattenNavForSearch(navStructure), []);

    const results = useMemo(() => {
        if (!searchTerm.trim()) {
            return [];
        }
        const lowerCaseTerm = searchTerm.toLowerCase();
        return flatNav.filter(
            item =>
                item.label.toLowerCase().includes(lowerCaseTerm) ||
                item.breadcrumb.toLowerCase().includes(lowerCaseTerm)
        );
    }, [searchTerm, flatNav]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setSearchTerm('');
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    const handleResultClick = (path: string) => {
        navigate(path);
        onClose();
    };
    
    if (!isOpen) {
        return null;
    }

    return createPortal(
        <div className="search-modal-overlay" onClick={onClose}>
            <div className="search-modal-content" onClick={e => e.stopPropagation()}>
                <div className="search-modal-header">
                    <span className="material-symbols-outlined">search</span>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Buscar funciones..."
                        className="search-modal-input"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="search-results-container">
                    {results.length > 0 ? (
                        <div className="search-results-list">
                            {results.map(item => (
                                <a key={item.path} className="search-result-item" onClick={() => handleResultClick(item.path)}>
                                    <span className="search-result-title">{item.label}</span>
                                    <span className="search-result-breadcrumb">{item.breadcrumb}</span>
                                </a>
                            ))}
                        </div>
                    ) : (
                        searchTerm.trim() && <div className="search-no-results">No se encontraron resultados.</div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};