



import React, { ErrorInfo, ReactNode, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { SessionProvider, useSession } from './context/SessionContext';
import { Sidebar } from './components/Navigation';
import { navStructure } from './navigation';
import { adminNavStructure } from './navigation.admin';
import type { NavStructure, Notification } from './types';
import { SearchModal } from './components/SearchModal';

// Import all views
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import CompaniesView from './views/CompaniesView';
import ChartOfAccountsView from './views/ChartOfAccountsView';
import SubjectsView from './views/SubjectsView';
import CostCentersView from './views/CostCentersView';
import ItemsView from './views/ItemsView';
import EmployeesView from './views/EmployeesView';
import InstitutionsView from './views/InstitutionsView';
import MonthlyParametersView from './views/MonthlyParametersView';
import VouchersView from './views/VouchersView';
import InvoicesView from './views/InvoicesView';
import WarehouseMovementsView from './views/WarehouseMovementsView';
import PayslipsView from './views/PayslipsView';
import FeeInvoicesView from './views/FeeInvoicesView';
import BankReconciliationView from './views/BankReconciliationView';
import UsersView from './views/UsersView';
import AccountGroupsView from './views/maestros/AccountGroupsView';

// New specialized views
import JournalLedgerView from './views/reports/JournalLedgerView';
import PayrollLedgerView from './views/reports/PayrollLedgerView';
import PayrollCentralizationView from './views/processes/PayrollCentralizationView';
import MonthlyClosingView from './views/processes/MonthlyClosingView';
import GeneralLedgerView from './views/reports/GeneralLedgerView';
import BalancesView from './views/reports/BalancesView';
import BalanceSheetView from './views/reports/BalanceSheetView';
import MonthlyVatSummaryView from './views/reports/MonthlyVatSummaryView';
import InventoryReportView from './views/reports/InventoryReportView';
import RemunerationCertificateView from './views/reports/RemunerationCertificateView';
import PreviredFileView from './views/reports/PreviredFileView';
import IncomeTaxParametersView from './views/maestros/IncomeTaxParametersView';
import FamilyAllowanceView from './views/FamilyAllowanceView';
import SiiCentralizationView from './views/processes/SiiCentralizationView';
import PreviredImportView from './views/processes/PreviredImportView';


const styles = {
    appContainer: { display: 'flex', width: '100%', height: '100vh' } as React.CSSProperties,
    mainContentFlow: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } as React.CSSProperties,
    header: { height: 'var(--header-height)', backgroundColor: '#fff', borderBottom: `1px solid var(--border-color)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', flexShrink: 0 } as React.CSSProperties,
    headerSelectors: { display: 'flex', alignItems: 'center', gap: '24px' } as React.CSSProperties,
    selectorWrapper: { display: 'flex', alignItems: 'center' } as React.CSSProperties,
    selector: { border: 'none', background: 'transparent', fontSize: '14px', fontWeight: 500, marginLeft: '8px', cursor: 'pointer' } as React.CSSProperties,
    userProfile: { display: 'flex', alignItems: 'center', gap: '10px' } as React.CSSProperties,
    mainContent: { flex: 1, padding: '24px', overflowY: 'auto', backgroundColor: 'var(--sidebar-bg)' } as React.CSSProperties,
    pageHeader: { marginBottom: '24px' } as React.CSSProperties,
    breadcrumb: { color: 'var(--text-light-color)', fontSize: '12px', marginTop: '4px' } as React.CSSProperties,
    loadingContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', flexDirection: 'column', gap: '1rem', backgroundColor: 'var(--sidebar-bg)' } as React.CSSProperties,
};

const errorBoundaryStyles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        backgroundColor: '#f1f3f4',
        padding: '2rem',
        fontFamily: 'var(--font-family)',
        color: 'var(--text-color)',
    },
    icon: {
        fontSize: '48px',
        color: 'var(--error-color)',
        marginBottom: '1rem',
    },
    details: {
        marginTop: '2rem',
        textAlign: 'left',
        backgroundColor: '#fff',
        border: '1px solid var(--border-color)',
        padding: '1rem',
        borderRadius: '8px',
        maxWidth: '800px',
        width: '100%',
        overflow: 'auto',
        fontSize: '12px',
        color: 'var(--text-light-color)'
    },
    pre: { whiteSpace: 'pre-wrap', marginTop: '1rem', background: '#f8f9fa', padding: '10px', borderRadius: '4px' } as React.CSSProperties,
} as const;


// --- FatalErrorDisplay Component ---
const FatalErrorDisplay: React.FC<{ error: Error }> = ({ error }) => (
    <div style={errorBoundaryStyles.container}>
        <span className="material-symbols-outlined" style={errorBoundaryStyles.icon}>error</span>
        <h2>Algo salió mal.</h2>
        <p style={{ margin: '1rem 0' }}>La aplicación encontró un error inesperado y no puede continuar.</p>
        <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
                <span className="material-symbols-outlined">refresh</span>
                Recargar Página
            </button>
        </div>
        <details style={errorBoundaryStyles.details}>
            <summary style={{ cursor: 'pointer', fontWeight: 500 }}>Detalles del Error</summary>
            <pre style={errorBoundaryStyles.pre}>
                {error.stack || error.toString()}
            </pre>
        </details>
    </div>
);


// --- ErrorBoundary Component ---
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// FIX: Ensure ErrorBoundary extends React.Component to function as a class-based error boundary.
// This provides access to lifecycle methods like componentDidCatch and state management (this.setState),
// resolving errors related to missing 'setState' and 'props'.
class ErrorBoundary extends React.Component<{ children: ReactNode }, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(_: Error): { hasError: boolean } {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={errorBoundaryStyles.container}>
            <span className="material-symbols-outlined" style={errorBoundaryStyles.icon}>error</span>
            <h2>Algo salió mal.</h2>
            <p style={{ margin: '1rem 0' }}>La aplicación encontró un error inesperado y no puede continuar.</p>
            <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                <button className="btn btn-primary" onClick={() => window.location.reload()}>
                    <span className="material-symbols-outlined">refresh</span>
                    Recargar Página
                </button>
            </div>
            {this.state.error && (
                 <details style={errorBoundaryStyles.details}>
                    <summary style={{ cursor: 'pointer', fontWeight: 500 }}>Detalles del Error</summary>
                    <pre style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', background: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
                        {this.state.error.toString()}
                        <br />
                        {this.state.errorInfo?.componentStack}
                    </pre>
                </details>
            )}
        </div>
      );
    }
    return this.props.children;
  }
}

// --- Notification Component ---
const NotificationContainer = () => {
    const { notifications } = useSession();
    return (
        <div className="notification-container">
            {notifications.map(n => (
                <div key={n.id} className={`notification ${n.type}`}>
                    <span className="material-symbols-outlined">{n.type === 'success' ? 'check_circle' : 'error'}</span>
                    {n.message}
                </div>
            ))}
        </div>
    );
};


const Header = ({ onSearchClick }: { onSearchClick: () => void }) => {
    const session = useSession();
    const { currentUser, logout, companies, activeCompanyId, setActiveCompanyId, activePeriod, setActivePeriod, periods } = session;

    const isAccountant = currentUser?.role === 'Accountant';
    const userCompanies = isAccountant && currentUser ? companies.filter(c => c.owner_id === currentUser.id) : [];

    return (
        <header style={styles.header}>
            <div style={styles.headerSelectors}>
                {isAccountant && userCompanies.length > 0 && (
                    <>
                    <div style={styles.selectorWrapper}>
                        <span className="material-symbols-outlined">business</span>
                        <select value={activeCompanyId || ''} onChange={(e) => setActiveCompanyId(Number(e.target.value))} style={styles.selector}>
                            {userCompanies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div style={styles.selectorWrapper}>
                        <span className="material-symbols-outlined">calendar_month</span>
                        <select value={activePeriod} onChange={(e) => setActivePeriod(e.target.value)} style={styles.selector}>
                            {periods.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                    </div>
                    </>
                )}
            </div>
            <div style={styles.userProfile}>
                 <button className="btn-icon" title="Buscar" onClick={onSearchClick} style={{marginRight: '8px'}}>
                    <span className="material-symbols-outlined">search</span>
                </button>
                <span>{currentUser?.name} ({currentUser?.role})</span>
                <button className="btn-icon" title="Cerrar Sesión" onClick={logout}>
                    <span className="material-symbols-outlined">logout</span>
                </button>
            </div>
        </header>
    );
};

const getPathBreadcrumb = (pathname: string, navData: NavStructure, parentPath = '', parentLabel = ''): string => {
    for (const [key, value] of Object.entries(navData)) {
        const currentLabel = parentLabel ? `${parentLabel} > ${key}` : key;
        const currentPath = (value as any).path || (parentPath ? `${parentPath}/${key.toLowerCase().replace(/\s+/g, '-')}` : `/${key.toLowerCase().replace(/\s+/g, '-')}`);

        if (currentPath === pathname) {
            return currentLabel;
        }

        if ('children' in value && value.children && typeof value.children === 'object') {
            const childResult = getPathBreadcrumb(pathname, value.children, currentPath, currentLabel);
            if (childResult) return childResult;
        }
    }
    return '';
};


const AppLayout = () => {
    const { currentUser } = useSession();
    const location = useLocation();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    
    const isSystemAdmin = currentUser?.role === 'System Administrator';
    const currentNavStructure = isSystemAdmin ? adminNavStructure : navStructure;

    const breadcrumb = getPathBreadcrumb(location.pathname, currentNavStructure) || 'Dashboard';
    const title = breadcrumb.split(' > ').pop();

    return (
        <div style={styles.appContainer}>
            <Sidebar navStructure={currentNavStructure} />
            <div style={styles.mainContentFlow}>
                <Header onSearchClick={() => setIsSearchOpen(true)} />
                <main style={styles.mainContent}>
                    <div style={styles.pageHeader}><h2>{title}</h2><p style={styles.breadcrumb}>{breadcrumb}</p></div>
                    <Outlet />
                </main>
            </div>
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </div>
    );
};


const AuthWrapper = () => {
    const { currentUser, isLoading } = useSession();

    if (isLoading) {
        return (
            <div style={styles.loadingContainer}>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--primary-color)' }}>
                    calculate
                </span>
                <h3>Cargando Contador Experto...</h3>
            </div>
        );
    }
    
    if (!currentUser) {
        return <LoginView />;
    }
    
    const isSystemAdmin = currentUser.role === 'System Administrator';

    return (
        <Routes>
            <Route path="/" element={<AppLayout />}>
                {/* Common Routes */}
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardView />} />
                
                {/* Main application routes available to all logged-in users (Accountants and Admins) */}
                {!isSystemAdmin && (
                    <>
                        {/* Contabilidad */}
                        <Route path="contabilidad/movimientos/comprobantes" element={<VouchersView />} />
                        <Route path="contabilidad/movimientos/compras" element={<InvoicesView type="Compra" />} />
                        <Route path="contabilidad/movimientos/ventas" element={<InvoicesView type="Venta" />} />
                        <Route path="contabilidad/movimientos/honorarios" element={<FeeInvoicesView />} />
                        <Route path="contabilidad/movimientos/conciliacion-bancaria" element={<BankReconciliationView />} />
                        <Route path="contabilidad/maestros/plan-de-cuentas" element={<ChartOfAccountsView />} />
                        <Route path="contabilidad/maestros/grupos-de-cuentas" element={<AccountGroupsView />} />
                        <Route path="contabilidad/maestros/sujetos" element={<SubjectsView />} />
                        <Route path="contabilidad/maestros/centros-de-costos" element={<CostCentersView />} />
                        
                        {/* Inventario y Costos */}
                        <Route path="inventario-y-costos/gestion/items" element={<ItemsView />} />
                        <Route path="inventario-y-costos/gestion/entradas-a-bodega" element={<WarehouseMovementsView type="Entrada" />} />
                        <Route path="inventario-y-costos/gestion/salidas-de-bodega" element={<WarehouseMovementsView type="Salida" />} />

                        {/* Remuneraciones */}
                        <Route path="remuneraciones/movimientos/ficha-de-personal" element={<EmployeesView />} />
                        <Route path="remuneraciones/movimientos/liquidaciones" element={<PayslipsView />} />
                        <Route path="remuneraciones/procesos/importar-previred" element={<PreviredImportView />} />
                        <Route path="remuneraciones/maestros/instituciones" element={<InstitutionsView />} />
                        <Route path="remuneraciones/maestros/parametros-asig-familiar" element={<FamilyAllowanceView />} />
                        <Route path="remuneraciones/maestros/parametros-iut" element={<IncomeTaxParametersView />} />

                        {/* Reports and Processes */}
                        <Route path="contabilidad/informes/libro-diario" element={<JournalLedgerView />} />
                        <Route path="contabilidad/informes/libro-mayor" element={<GeneralLedgerView />} />
                        <Route path="contabilidad/informes/balances" element={<BalancesView />} />
                        <Route path="contabilidad/informes/balance-general" element={<BalanceSheetView />} />
                        <Route path="contabilidad/informes/resumen-mensual-iva" element={<MonthlyVatSummaryView />} />
                        <Route path="inventario-y-costos/informes/informe-items" element={<InventoryReportView />} />
                        <Route path="remuneraciones/informes/libro-remuneraciones" element={<PayrollLedgerView />} />
                        <Route path="remuneraciones/informes/archivo-previred" element={<PreviredFileView />} />
                        <Route path="remuneraciones/informes/certificado-remuneraciones" element={<RemunerationCertificateView />} />
                        
                        <Route path="procesos-criticos/centralizacion/centralizacion-remuneraciones" element={<PayrollCentralizationView />} />
                        <Route path="procesos-criticos/centralizacion/centralizacion-rcv-sii" element={<SiiCentralizationView />} />
                        <Route path="procesos-criticos/cierres/cierre-mensual" element={<MonthlyClosingView />} />
                    </>
                )}
                
                {/* Shared Routes */}
                <Route path="configuracion/general/empresas" element={<CompaniesView />} />
                <Route path="configuracion/general/parametros-mensuales" element={<MonthlyParametersView />} />

                {/* Admin-Only Routes */}
                {isSystemAdmin && (
                    <Route path="configuracion/general/usuarios" element={<UsersView />} />
                )}
                
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
        </Routes>
    );
};

const App = () => {
    const [fatalError, setFatalError] = useState<Error | null>(null);

    useEffect(() => {
        const handleGlobalErrors = (event: ErrorEvent | PromiseRejectionEvent) => {
            let error: Error;
            if ('reason' in event) { // PromiseRejectionEvent
                error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
                console.error('Unhandled Promise Rejection:', error);
            } else { // ErrorEvent for uncaught exceptions
                error = event.error instanceof Error ? event.error : new Error(event.message);
                console.error('Uncaught Exception:', error);
            }

            // Avoid setting fatal error for benign resize observer errors which are common in dev
            if (error.message && error.message.includes("ResizeObserver loop limit exceeded")) {
                console.warn("ResizeObserver loop limit exceeded, ignoring as non-fatal.");
                return;
            }
            
            setFatalError(error);
        };

        window.addEventListener('unhandledrejection', handleGlobalErrors);
        window.addEventListener('error', handleGlobalErrors);

        return () => {
            window.removeEventListener('unhandledrejection', handleGlobalErrors);
            window.removeEventListener('error', handleGlobalErrors);
        };
    }, []);
    
    if (fatalError) {
        return <FatalErrorDisplay error={fatalError} />;
    }

    return (
        <BrowserRouter>
            <ErrorBoundary>
                <SessionProvider>
                    <NotificationContainer />
                    <AuthWrapper />
                </SessionProvider>
            </ErrorBoundary>
        </BrowserRouter>
    );
};

export default App;