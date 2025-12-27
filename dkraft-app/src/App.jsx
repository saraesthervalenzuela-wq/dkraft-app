import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthLayout } from './components/auth';
import { Sidebar } from './components/layout';
import {
    Dashboard,
    StaffModule,
    StaffDutyModule,
    ClientsModule,
    TopClientsModule,
    SuppliersModule,
    MaterialsModule,
    ProductsModule,
    BOMModule,
    ProjectsModule,
    OperationsModule,
    ReportsModule,
    QualityModule,
    PerformanceModule,
    ProjectAnalysis,
    ActivityLogModule,
    CategoriesModule,
    UnitsModule
} from './components/modules';
import FirebaseTest from './components/FirebaseTest';
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
    const [activeNav, setActiveNav] = useState('dashboard');
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('dkraft-theme');
        return savedTheme || 'dark';
    });

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
                return <MaterialsModule />;
            case 'products':
                return <ProductsModule />;
            case 'bom':
                return <BOMModule />;
            case 'projects':
                return <ProjectsModule />;
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
            case 'firebase-test':
                return <FirebaseTest />;
            case 'dashboard':
            default:
                return <Dashboard />;
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
        <AuthProvider>
            <AuthWrapper />
        </AuthProvider>
    );
}

export default App;
