import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthLayout } from './components/auth';
import { Sidebar } from './components/layout';
import './styles/tailwind.css';

// Lazy load all modules for code splitting
const Dashboard = lazy(() => import('./components/modules/Dashboard'));
const StaffModule = lazy(() => import('./components/modules/Staff'));
const StaffDutyModule = lazy(() => import('./components/modules/StaffDuty'));
const ClientsModule = lazy(() => import('./components/modules/Clients'));
const TopClientsModule = lazy(() => import('./components/modules/TopClients'));
const SuppliersModule = lazy(() => import('./components/modules/Suppliers'));
const MaterialsModule = lazy(() => import('./components/modules/Materials'));
const ProductsModule = lazy(() => import('./components/modules/Products'));
const WarehousesModule = lazy(() => import('./components/modules/Warehouses'));
const BOMModule = lazy(() => import('./components/modules/BOM'));
const ProjectsModule = lazy(() => import('./components/modules/Projects'));
const RequisitionsModule = lazy(() => import('./components/modules/Requisitions'));
const QuotationsModule = lazy(() => import('./components/modules/Quotations'));
const OperationsModule = lazy(() => import('./components/modules/Operations'));
const ReportsModule = lazy(() => import('./components/modules/Reports'));
const QualityModule = lazy(() => import('./components/modules/Quality'));
const PerformanceModule = lazy(() => import('./components/modules/Performance'));
const ProjectAnalysis = lazy(() => import('./components/modules/ProjectAnalysis'));
const ActivityLogModule = lazy(() => import('./components/modules/ActivityLog'));
const CategoriesModule = lazy(() => import('./components/modules/Categories'));
const UnitsModule = lazy(() => import('./components/modules/Units'));
const SupabaseTest = lazy(() => import('./components/SupabaseTest'));

// Module loading spinner - lightweight
const ModuleLoader = () => (
    <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-orange-500/20 border-t-orange-500 animate-spin" />
                <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-b-blue-500/50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
            <span className="text-sm text-slate-400 font-medium">Loading module...</span>
        </div>
    </div>
);

// Loading spinner component - Industrial Theme (for initial app load)
const LoadingScreen = () => (
    <div className="loading-screen">
        <div className="loading-grid"></div>
        <div className="loading-content">
            <div className="industrial-loader">
                <div className="gear gear-large">
                    <div className="gear-inner"></div>
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="gear-tooth" style={{ transform: `rotate(${i * 45}deg)` }}></div>
                    ))}
                </div>
                <div className="gear gear-medium">
                    <div className="gear-inner"></div>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="gear-tooth" style={{ transform: `rotate(${i * 60}deg)` }}></div>
                    ))}
                </div>
                <div className="saw-blade">
                    <div className="saw-center"></div>
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="saw-tooth" style={{ transform: `rotate(${i * 30}deg)` }}></div>
                    ))}
                </div>
                <div className="sparks">
                    <div className="spark spark-1"></div>
                    <div className="spark spark-2"></div>
                    <div className="spark spark-3"></div>
                    <div className="spark spark-4"></div>
                </div>
                <div className="cutting-line">
                    <div className="cutting-progress"></div>
                </div>
            </div>
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
            case 'supabase-test':
                return <SupabaseTest />;
            case 'dashboard':
            default:
                return <Dashboard onNavigate={setActiveNav} />;
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
                    <Suspense fallback={<ModuleLoader />}>
                        {renderContent()}
                    </Suspense>
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
