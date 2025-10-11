
import React, { ErrorInfo, ReactNode, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useLocation } from 'react-router-dom';
import { SessionProvider, useSession } from './context/SessionContext';
import { Sidebar } from './components/Navigation';
import { navStructure } from './navigation';
import { adminNavStructure } from './navigation.admin';
import type { NavStructure } from './types';
import { SearchModal } from './components/SearchModal';

// Views...
import LoginView from './views/LoginView';
import UpdatePasswordView from './views/UpdatePasswordView';
import DashboardView from './views/DashboardView';
import CompaniesView from './views/CompaniesView';
import { CompanySettingsView } from './views/Configuration/CompanySettingsView';
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
import AccountGroupsView from './views/maestros/AccountGroupsView';
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
import AdminUsersView from './views/AdminUsersView';

class ErrorBoundary extends React.Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <h1>Algo salió mal. Recarga la página.</h1>;
    }
    return this.props.children;
  }
}

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
    const { session, logout, switchCompany } = useSession();

    if (!session?.user) return null;

    const { user, company, periods, activePeriod, setActivePeriod } = session;
    const companies = user.companies || [];

    useEffect(() => {
        if (companies.length === 1 && !company) {
            switchCompany(companies[0].id);
        }
    }, [companies, company, switchCompany]);

    const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const companyId = parseInt(e.target.value, 10);
        if (companyId) {
            switchCompany(companyId);
        }
    };

    return (
        <header className="app-header">
            <div className="header-selectors">
                {companies.length > 0 && (
                    <div className="selector-wrapper">
                        <span className="material-symbols-outlined">business</span>
                        <select value={company?.id || ''} onChange={handleCompanyChange} className="selector">
                            <option value="">Seleccione una empresa...</option>
                            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                )}
                {company && periods && periods.length > 0 && (
                     <div className="selector-wrapper">
                        <span className="material-symbols-outlined">calendar_month</span>
                        <select value={activePeriod} onChange={(e) => setActivePeriod(e.target.value)} className="selector">
                            {periods.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                    </div>
                )}
                 {user.role?.includes('Admin') && <span style={{marginLeft: '16px', fontWeight: 500, color: 'var(--text-light-color)'}}>Modo Administrador</span>}
            </div>
            <div className="user-profile">
                 <button className="btn-icon" title="Buscar" onClick={onSearchClick} style={{marginRight: '8px'}}>
                    <span className="material-symbols-outlined">search</span>
                </button>
                <span>{user?.email}</span>
                <button className="btn-icon" title="Cerrar Sesión" onClick={logout}>
                    <span className="material-symbols-outlined">logout</span>
                </button>
            </div>
        </header>
    );
};

const getPathBreadcrumb = (pathname: string, navData: NavStructure): string => { return ''; };

const AppLayout = () => {
    const { session } = useSession();
    const location = useLocation();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    
    if (!session) return <Navigate to="/login" />;

    const isSystemAdmin = session.user.role?.includes('Admin');
    const currentNavStructure = isSystemAdmin ? adminNavStructure : navStructure;

    const breadcrumb = getPathBreadcrumb(location.pathname, currentNavStructure) || (isSystemAdmin ? 'Admin Dashboard' : 'Dashboard');
    const title = breadcrumb.split(' > ').pop();

    return (
        <div className="app-container">
            <Sidebar navStructure={currentNavStructure} />
            <div className="main-content-flow">
                <Header onSearchClick={() => setIsSearchOpen(true)} />
                <main className="main-content">
                    <div className="page-header"><h2>{title}</h2><p className="breadcrumb">{breadcrumb}</p></div>
                    <Outlet />
                </main>
            </div>
            <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        </div>
    );
};


const AuthWrapper = () => {
    const { session, loading } = useSession();

    if (loading) {
        return (
            <div className="loading-container">
                <span className="material-symbols-outlined">calculate</span>
                <h3>Cargando Contador Experto...</h3>
            </div>
        );
    }
    
    return (
        <Routes>
            <Route path="/login" element={!session ? <LoginView /> : <Navigate to="/" />} />
            <Route path="/update-password" element={<UpdatePasswordView />} />
            <Route path="/" element={session ? <AppLayout /> : <Navigate to="/login" />}>
                 <Route index element={<Navigate to={session?.user?.role?.includes('Admin') ? '/admin/users' : '/dashboard'} replace />} />
                <Route path="dashboard" element={<DashboardView />} />
                
                <Route path="contabilidad/movimientos/comprobantes" element={<VouchersView />} />
                <Route path="contabilidad/movimientos/compras" element={<InvoicesView type="Compra" />} />
                <Route path="contabilidad/movimientos/ventas" element={<InvoicesView type="Venta" />} />
                <Route path="contabilidad/maestros/plan-de-cuentas" element={<ChartOfAccountsView />} />
                <Route path="remuneraciones/movimientos/ficha-de-personal" element={<EmployeesView />} />
                <Route path="remuneraciones/movimientos/liquidaciones" element={<PayslipsView />} />
                <Route path="configuracion/general/parametros-mensuales" element={<MonthlyParametersView />} />
                
                <Route path="admin/users" element={<AdminUsersView />} />
                
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
        </Routes>
    );
};

const App = () => (
    <BrowserRouter>
        <ErrorBoundary>
            <SessionProvider>
                <NotificationContainer />
                <AuthWrapper />
            </SessionProvider>
        </ErrorBoundary>
    </BrowserRouter>
);

export default App;
