import React, { useState, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import type { NavStructure, NavItemDefinition } from '../types';
import { useSession } from '../context/SessionContext';

const styles = {
    sidebar: { width: 'var(--sidebar-width)', backgroundColor: 'var(--sidebar-bg)', borderRight: `1px solid var(--border-color)`, display: 'flex', flexDirection: 'column', transition: 'width 0.3s ease' } as React.CSSProperties,
    sidebarHeader: { display: 'flex', alignItems: 'center', padding: '0 20px', height: 'var(--header-height)', borderBottom: `1px solid var(--border-color)` } as React.CSSProperties,
    sidebarTitle: { fontSize: '18px', fontWeight: 500, marginLeft: '10px' } as React.CSSProperties,
    sidebarNavList: { listStyle: 'none', padding: '10px 0', overflowY: 'auto', flexGrow: 1 } as React.CSSProperties,
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
    sidebarNavItemContainer: (level: number) => ({
      padding: '0'
    }),
    navToggle: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        marginLeft: 'auto',
        padding: 0,
        display: 'inline-flex'
    } as React.CSSProperties,
    navButton: {
        width: '100%',
        border: 'none',
        background: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        fontFamily: 'inherit'
    } as React.CSSProperties,
};

const useMenuState = (navData: NavStructure) => {
    const getInitialState = () => {
        const buildStateRecursively = (data: NavStructure, parentKey = ''): Record<string, boolean> => {
            return Object.entries(data).reduce((acc, [key, value]) => {
                const currentKey = parentKey ? `${parentKey}>${key}` : key;
                if ('children' in value && Object.keys(value.children).length > 0) {
                    acc[currentKey] = parentKey === '';
                    Object.assign(acc, buildStateRecursively(value.children, currentKey));
                }
                return acc;
            }, {} as Record<string, boolean>);
        };
        return buildStateRecursively(navData);
    };

    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(getInitialState);

    const toggleMenu = useCallback((key: string) => {
        setOpenMenus(prev => ({ ...prev, [key]: !prev[key] }));
    }, []);

    return { openMenus, toggleMenu };
};

type NavMenuProps = {
    data: NavStructure | string[];
    openMenus: Record<string, boolean>;
    toggleMenu: (key: string) => void;
    level?: number;
    urlParentPath?: string;
    menuKeyParentPath?: string;
};

const NavMenu: React.FC<NavMenuProps> = ({ 
    data, 
    openMenus, 
    toggleMenu, 
    level = 0, 
    urlParentPath = '', 
    menuKeyParentPath = '' 
}) => {
    if (Array.isArray(data)) {
        return (
            <ul>
                {data.map(item => {
                    const itemPath = `${urlParentPath}/${item.toLowerCase().replace(/\s+/g, '-')}`;
                    return (
                        <li key={itemPath}>
                            <NavLink to={itemPath} className="sidebar-nav-item" style={({ isActive }) => styles.sidebarNavItem(level, isActive)}>
                                {item}
                            </NavLink>
                        </li>
                    );
                })}
            </ul>
        );
    }

    return (
        <ul style={styles.sidebarNavList}>
            {Object.entries(data).map(([key, value]) => {
                const navItem = value as NavItemDefinition | { path: string };
                const currentUrlPath = navItem.path || (urlParentPath ? `${urlParentPath}/${key.toLowerCase().replace(/\s+/g, '-')}` : `/${key.toLowerCase().replace(/\s+/g, '-')}`);
                const currentMenuKey = menuKeyParentPath ? `${menuKeyParentPath}>${key}` : key;
                const hasChildren = 'children' in navItem && !!navItem.children && typeof navItem.children === 'object' && Object.keys(navItem.children).length > 0;

                if (!hasChildren) {
                    return (
                         <li key={currentUrlPath}>
                             <NavLink to={currentUrlPath} className="sidebar-nav-item" style={({ isActive }) => styles.sidebarNavItem(level, isActive)}>
                                 {'icon' in navItem && navItem.icon && <span className="material-symbols-outlined">{navItem.icon}</span>}
                                 {key}
                             </NavLink>
                         </li>
                    );
                }
                
                const isOpen = openMenus[currentMenuKey] ?? false;

                return (
                    <li key={currentUrlPath}>
                        <button style={styles.navButton} onClick={() => toggleMenu(currentMenuKey)}>
                            <span className="sidebar-nav-item" style={styles.sidebarNavItem(level, false)}>
                                {'icon' in navItem && navItem.icon && <span className="material-symbols-outlined">{navItem.icon}</span>}
                                {key}
                                <span style={styles.navToggle}>
                                    <span className="material-symbols-outlined">
                                        {isOpen ? 'expand_less' : 'expand_more'}
                                    </span>
                                </span>
                            </span>
                        </button>
                        {isOpen && 'children' in navItem && (
                            <NavMenu 
                                data={navItem.children} 
                                level={level + 1} 
                                urlParentPath={currentUrlPath}
                                menuKeyParentPath={currentMenuKey}
                                openMenus={openMenus} 
                                toggleMenu={toggleMenu} 
                            />
                        )}
                    </li>
                );
            })}
        </ul>
    );
};

export const Sidebar = ({ navStructure }: { navStructure: NavStructure }) => {
    const { currentUser } = useSession();
    if (!currentUser) return null;

    const { openMenus, toggleMenu } = useMenuState(navStructure);

    return (
        <nav style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary-color)', fontSize: '28px' }}>calculate</span>
                <h1 style={styles.sidebarTitle}>Contador Experto</h1>
            </div>
            <NavMenu 
                data={navStructure} 
                openMenus={openMenus} 
                toggleMenu={toggleMenu} 
            />
        </nav>
    );
};
