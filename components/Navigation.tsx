
import React, { useState, useCallback, ChangeEvent } from 'react';
import { NavLink } from 'react-router-dom';
import type { NavStructure, NavItemDefinition } from '../types';
import { useSession } from '../context/SessionContext';

const styles = {
    sidebar: { width: 'var(--sidebar-width)', backgroundColor: 'var(--sidebar-bg)', borderRight: `1px solid var(--border-color)`, display: 'flex', flexDirection: 'column', transition: 'width 0.3s ease' } as React.CSSProperties,
    sidebarHeader: { display: 'flex', flexDirection: 'column', padding: '20px', borderBottom: `1px solid var(--border-color)` } as React.CSSProperties,
    sidebarTitleContainer: { display: 'flex', alignItems: 'center', width: '100%', marginBottom: '16px' },
    sidebarTitle: { fontSize: '18px', fontWeight: 500, marginLeft: '10px' } as React.CSSProperties,
    companySelector: {
        width: '100%',
        padding: '8px 12px',
        borderRadius: '4px',
        border: `1px solid var(--border-color)`,
        backgroundColor: '#fff',
        fontSize: '14px',
        cursor: 'pointer',
    },
    sidebarNavList: { listStyle: 'none', padding: '10px 0', margin: 0, overflowY: 'auto', flexGrow: 1 } as React.CSSProperties,
    sidebarNavItem: (level: number, isActive: boolean): React.CSSProperties => ({
        display: 'flex',
        alignItems: 'center',
        padding: `10px 20px 10px ${20 + level * 20}px`,
        textDecoration: 'none',
        color: isActive ? 'var(--primary-color)' : 'var(--text-color)',
        fontWeight: isActive ? 500 : 400,
        backgroundColor: isActive ? 'var(--hover-bg)' : 'transparent',
        borderRight: isActive ? `3px solid var(--primary-color)` : 'none',
        margin: isActive ? '0' : '0 3px',
        transition: 'all 0.2s ease',
        fontSize: '14px'
    }),
    navItemIcon: { marginRight: '10px', display: 'flex', alignItems: 'center' } as React.CSSProperties,
    navToggle: { marginLeft: 'auto' } as React.CSSProperties,
    navButton: { width: '100%', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', padding: 0 } as React.CSSProperties,
} as const;

const useMenuState = (navData: NavStructure) => {
    const getInitialState = useCallback(() => {
        const buildStateRecursively = (data: NavStructure, parentKey = ''): Record<string, boolean> => {
            return Object.entries(data).reduce((acc, [key, value]) => {
                const currentKey = parentKey ? `${parentKey}>${key}` : key;
                if ('children' in value && Object.keys(value.children).length > 0) {
                    acc[currentKey] = parentKey === ''; // Expandir solo el primer nivel por defecto
                    Object.assign(acc, buildStateRecursively(value.children, currentKey));
                }
                return acc;
            }, {} as Record<string, boolean>);
        };
        return buildStateRecursively(navData);
    }, [navData]);

    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(getInitialState());

    useEffect(() => {
        setOpenMenus(getInitialState());
    }, [navData, getInitialState]);

    const toggleMenu = useCallback((key: string) => setOpenMenus(prev => ({ ...prev, [key]: !prev[key] })), []);
    return { openMenus, toggleMenu };
};

const NavMenu: React.FC<any> = ({ data, openMenus, toggleMenu, level = 0, urlParentPath = '', menuKeyParentPath = '' }) => {
    return (
        <ul style={styles.sidebarNavList}>{
            Object.entries(data).map(([key, value]) => {
                const navItem = value as NavItemDefinition;
                const currentUrlPath = navItem.path || `${urlParentPath}/${key.toLowerCase().replace(/\s+/g, '-')}`;
                const currentMenuKey = menuKeyParentPath ? `${menuKeyParentPath}>${key}` : key;
                const hasChildren = 'children' in navItem && !!navItem.children && Object.keys(navItem.children).length > 0;

                if (!hasChildren) {
                    return (
                        <li key={currentUrlPath}>
                            <NavLink to={currentUrlPath} style={({ isActive }) => styles.sidebarNavItem(level, isActive)}>
                                {navItem.icon && <span className="material-symbols-outlined" style={styles.navItemIcon}>{navItem.icon}</span>}
                                {key}
                            </NavLink>
                        </li>
                    );
                }

                const isOpen = openMenus[currentMenuKey] ?? false;
                return (
                    <li key={currentMenuKey}>
                        <button style={styles.navButton} onClick={() => toggleMenu(currentMenuKey)}>
                            <span style={{...styles.sidebarNavItem(level, false), display: 'flex', width: '100%'}}>
                                {navItem.icon && <span className="material-symbols-outlined" style={styles.navItemIcon}>{navItem.icon}</span>}
                                {key}
                                <span style={styles.navToggle}><span className="material-symbols-outlined">{isOpen ? 'expand_less' : 'expand_more'}</span></span>
                            </span>
                        </button>
                        {isOpen && <NavMenu data={navItem.children} level={level + 1} urlParentPath={currentUrlPath} menuKeyParentPath={currentMenuKey} openMenus={openMenus} toggleMenu={toggleMenu} />}
                    </li>
                );
            })}
        </ul>
    );
};

export const Sidebar = ({ navStructure }: { navStructure: NavStructure }) => {
    const { session, addNotification } = useSession();
    const { openMenus, toggleMenu } = useMenuState(navStructure);

    if (!session?.user) return null;

    // NOTA: La lógica de multi-empresa no está completamente implementada en el contexto.
    // El siguiente código asume que el cambio de empresa se manejará en el futuro.
    const activeCompany = session.company;
    const companies = session.company ? [session.company] : []; // Placeholder

    const handleCompanyChange = (event: ChangeEvent<HTMLSelectElement>) => {
        if (addNotification) {
            addNotification({ type: 'error', message: 'El cambio de empresa aún no está implementado.' });
        }
    };

    return (
        <nav style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
                <div style={styles.sidebarTitleContainer}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary-color)', fontSize: '28px' }}>calculate</span>
                    <h1 style={styles.sidebarTitle}>Contador Experto</h1>
                </div>
                {companies && companies.length > 1 && activeCompany && (
                    <select 
                        style={styles.companySelector} 
                        value={activeCompany.id}
                        onChange={handleCompanyChange}
                    >
                        {companies.map(company => (
                            <option key={company.id} value={company.id}>
                                {company.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>
            <NavMenu 
                data={navStructure} 
                openMenus={openMenus} 
                toggleMenu={toggleMenu} 
            />
        </nav>
    );
};
