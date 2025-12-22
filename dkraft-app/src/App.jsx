import { useState, useEffect } from 'react';
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
import './styles/main.css';

function App() {
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
            />
            <main className="main-content">
                {renderContent()}
            </main>
        </div>
    );
}

export default App;
