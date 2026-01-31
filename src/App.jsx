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
    UnitsModule
} from './components/modules';
import './styles/tailwind.css';

// Loading spinner component - Industrial Theme
const LoadingScreen = () => (
    <div className="loading-screen">
        {/* Animated Background Grid */}
        <div className="loading-grid"></div>

        <div className="loading-content">
            {/* Industrial Machine Animation */}
            <div className="industrial-loader">
                {/* Main Gear */}
                <div className="gear gear-large">
                    <div className="gear-inner"></div>
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="gear-tooth" style={{ transform: `rotate(${i * 45}deg)` }}></div>
                    ))}
                </div>

                {/* Secondary Gear */}
                <div className="gear gear-medium">
                    <div className="gear-inner"></div>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="gear-tooth" style={{ transform: `rotate(${i * 60}deg)` }}></div>
                    ))}
                </div>

                {/* Saw Blade */}
                <div className="saw-blade">
                    <div className="saw-center"></div>
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="saw-tooth" style={{ transform: `rotate(${i * 30}deg)` }}></div>
                    ))}
                </div>

                {/* Sparks */}
                <div className="sparks">
                    <div className="spark spark-1"></div>
                    <div className="spark spark-2"></div>
                    <div className="spark spark-3"></div>
                    <div className="spark spark-4"></div>
                </div>

                {/* Progress Bar (cutting line) */}
                <div className="cutting-line">
                    <div className="cutting-progress"></div>
                </div>
            </div>

            {/* Branding */}
            <div className="loading-brand">
                <h1 className="loading-title">D-KRAFT</h1>
                <p className="loading-subtitle">Manufacturing Excellence</p>
                <div className="loading-status">
                    <span className="status-dot"></span>
                    <span>Initializing system...</span>
                </div>
            </div>
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
                return <ProjectAnalysis onNavigate={setActiveNav} />;
            case 'activity-log':
                return <ActivityLogModule />;
            case 'categories':
                return <CategoriesModule />;
            case 'units':
                return <UnitsModule />;
            case 'dashboard':
            default:
                return <Dashboard />;
        }
    };

    return (
        <>
            {/* Animated Background Shapes */}
            <div className="floating-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
                <div className="shape shape-4"></div>
                <div className="shape shape-5"></div>
                <div className="shape shape-6"></div>
            </div>

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
        </>
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
