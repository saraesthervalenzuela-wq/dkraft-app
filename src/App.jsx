import { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { NavigationGuardProvider, useNavigationGuard } from './context/NavigationGuardContext';
import { AuthLayout } from './components/auth';
import { Sidebar } from './components/layout';
import { KeyboardShortcuts, GlobalSearch, NavigationConfirmDialog } from './components/common';
import {
    Dashboard,
    StaffModule,
    StaffDutyModule,
    ClientsModule,
    TopClientsModule,
    SuppliersModule,
    MaterialsModule,
    ProductsModule,
    WarehousesModule,
    BOMModule,
    ProjectsModule,
    RequisitionsModule,
    QuotationsModule,
    OperationsModule,
    ReportsModule,
    QualityModule,
    PerformanceModule,
    ProjectAnalysis,
    ActivityLogModule,
    CategoriesModule,
    UnitsModule,
    WorkCentersModule
} from './components/modules';

import './styles/main.css';

// Loading spinner component
const LoadingScreen = () => (
    <div className="loading-screen">
        <div className="loading-content">
            <div className="loading-logo">
                <span className="logo-icon">D</span>
            </div>
            <div className="loading-spinner"></div>
            <p>Cargando...</p>
        </div>
    </div>
);

// Main app content (when authenticated)
const AppContent = () => {
    const { logout, user } = useAuth();
    const { tryNavigate } = useNavigationGuard();
    const [activeNav, setActiveNavInternal] = useState('dashboard');
    const [showGlobalSearch, setShowGlobalSearch] = useState(false);
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('dkraft-theme');
        return savedTheme || 'dark';
    });

    // Guarded navigation - checks for unsaved changes before navigating
    const setActiveNav = useCallback((nav) => {
        tryNavigate(() => setActiveNavInternal(nav));
    }, [tryNavigate]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const renderContent = () => {
        switch (activeNav) {
            case 'staff':
                return <StaffModule />;
            case 'staff-duty':
                return <StaffDutyModule />;
            case 'clients':
                return <ClientsModule />;
            case 'top-clients':
                return <TopClientsModule />;
            case 'suppliers':
                return <SuppliersModule />;
            case 'materials':
                return <MaterialsModule setActiveNav={setActiveNav} />;
            case 'products':
                return <ProductsModule />;
            case 'warehouses':
                return <WarehousesModule />;
            case 'bom':
                return <BOMModule />;
            case 'projects':
                return <ProjectsModule />;
            case 'requisitions':
                return <RequisitionsModule />;
            case 'quotations':
                return <QuotationsModule />;
            case 'operations':
                return <OperationsModule />;
            case 'reports':
                return <ReportsModule />;
            case 'quality':
                return <QualityModule />;
            case 'performance':
                return <PerformanceModule />;
            case 'project-analysis':
                return <ProjectAnalysis />;
            case 'activity-log':
                return <ActivityLogModule />;
            case 'categories':
                return <CategoriesModule />;
            case 'units':
                return <UnitsModule />;
            case 'workcenters':
                return <WorkCentersModule />;
            case 'dashboard':
            default:
                return <Dashboard setActiveNav={setActiveNav} />;
        }
    };

    return (
        <div className="app-container">
            <Sidebar
                activeNav={activeNav}
                setActiveNav={setActiveNav}
                theme={theme}
                setTheme={setTheme}
                user={user}
                onLogout={logout}
            />
            <main className="main-content">
                {renderContent()}
            </main>

            {/* Global keyboard shortcuts */}
            <KeyboardShortcuts
                setActiveNav={setActiveNav}
                onOpenSearch={() => setShowGlobalSearch(true)}
            />

            {/* Global search (Cmd+K) */}
            <GlobalSearch
                isOpen={showGlobalSearch}
                onClose={() => setShowGlobalSearch(false)}
                setActiveNav={setActiveNav}
            />

            {/* Navigation confirmation dialog */}
            <NavigationConfirmDialog />
        </div>
    );
};

// Auth wrapper component
const AuthWrapper = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        return <AuthLayout />;
    }

    return <AppContent />;
};

// Main App component
function App() {
    return (
        <ToastProvider position="top-right">
            <AuthProvider>
                <NavigationGuardProvider>
                    <AuthWrapper />
                </NavigationGuardProvider>
            </AuthProvider>
        </ToastProvider>
    );
}

export default App;
