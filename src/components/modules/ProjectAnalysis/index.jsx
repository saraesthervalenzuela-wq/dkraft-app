import { useState, useEffect } from 'react';
import { Icon, IndustrialIcon } from '../../common';

const ProjectAnalysis = ({ onNavigate }) => {
    const [cacheCleared, setCacheCleared] = useState(false);
    const [animatedStats, setAnimatedStats] = useState({ lines: 0, commits: 0, modules: 0, components: 0 });
    const [selectedModule, setSelectedModule] = useState(null);
    const [showModuleModal, setShowModuleModal] = useState(false);

    const projectStats = {
        lines: 28000,
        commits: 58,
        modules: 21,
        components: 95
    };

    // Animate stats on mount
    useEffect(() => {
        const duration = 1500;
        const steps = 60;
        const interval = duration / steps;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            const eased = 1 - Math.pow(1 - progress, 3);

            setAnimatedStats({
                lines: Math.round(projectStats.lines * eased),
                commits: Math.round(projectStats.commits * eased),
                modules: Math.round(projectStats.modules * eased),
                components: Math.round(projectStats.components * eased)
            });

            if (step >= steps) clearInterval(timer);
        }, interval);

        return () => clearInterval(timer);
    }, []);

    const handleClearCache = () => {
        localStorage.clear();
        sessionStorage.clear();
        setCacheCleared(true);
        setTimeout(() => setCacheCleared(false), 3000);
    };

    const techBadges = [
        { label: 'React 19', icon: 'code', color: '#61dafb' },
        { label: 'Vite Powered', icon: 'bolt', color: '#646cff' },
        { label: 'Chart.js', icon: 'bar_chart', color: '#ff6384' },
        { label: 'Dark/Light Mode', icon: 'dark_mode', color: '#8b5cf6' },
        { label: 'Real-time HMR', icon: 'sync', color: '#10b981' },
    ];

    const techStack = [
        { name: 'React', subtitle: 'UI Framework', icon: '⚛️', color: '#61dafb' },
        { name: 'Vite', subtitle: 'Build tool', icon: '⚡', color: '#646cff' },
        { name: 'Chart.js', subtitle: 'Data visualization', icon: '📊', color: '#ff6384' },
        { name: 'CSS3', subtitle: 'Custom styles', icon: '🎨', color: '#264de4' },
    ];

    const quickActions = [
        { name: 'System Check', subtitle: 'Verify app status', icon: 'check_circle', color: '#10b981' },
        { name: 'Clear Cache', subtitle: 'Reset local storage', icon: 'delete_sweep', color: '#f59e0b', action: handleClearCache },
        { name: 'Export Report', subtitle: 'Download stats', icon: 'download', color: '#3b82f6' },
        { name: 'View Logs', subtitle: 'Console output', icon: 'terminal', color: '#8b5cf6' },
    ];

    const codeBreakdown = [
        { name: 'JavaScript/JSX', lines: 12500, color: '#f7df1e', percent: 57 },
        { name: 'CSS', lines: 9700, color: '#264de4', percent: 44 },
        { name: 'Config', lines: 800, color: '#10b981', percent: 4 },
    ];

    const keyFeatures = [
        { name: 'Real-time Operations', desc: 'HMR-powered instant updates across all modules.', icon: 'bolt', color: '#f59e0b' },
        { name: 'Theme System', desc: 'Dark and light mode with CSS variables and persistence.', icon: 'palette', color: '#10b981' },
        { name: 'Responsive Design', desc: 'Fully responsive for desktop, tablet, and mobile.', icon: 'devices', color: '#ec4899' },
        { name: 'Modular Architecture', desc: 'Component-based structure for easy maintenance.', icon: 'widgets', color: '#8b5cf6' },
    ];

    const devMetrics = [
        { name: 'Total Lines of Code', value: '28,000+', icon: 'code', color: '#8b5cf6' },
        { name: 'Source Files', value: '95', icon: 'folder', color: '#f59e0b' },
        { name: 'Project Started', value: 'Dec 2025', icon: 'calendar_today', color: '#10b981' },
        { name: 'Active Modules', value: '21', icon: 'grid_view', color: '#3b82f6' },
    ];

    // Module registry with operational status and full descriptions
    const modules = [
        { name: 'Dashboard', desc: 'Overview & KPIs', fullDesc: 'Central hub showing real-time business metrics, KPI cards, recent activities, and quick navigation to all system modules.', icon: 'dashboard', industrialIcon: 'industry', version: 'v1.0', color: '#8b5cf6', status: 'operational', navKey: 'dashboard', components: 5, linesOfCode: 450, features: ['Real-time stats', 'KPI cards', 'Quick navigation', 'Activity feed'], lastUpdate: 'Jan 2026' },
        { name: 'Staff', desc: 'Employee management', fullDesc: 'Complete employee directory with role management, contact information, department assignments, and status tracking.', icon: 'badge', industrialIcon: 'id-card', version: 'v1.0', color: '#3b82f6', status: 'operational', navKey: 'staff', components: 4, linesOfCode: 620, features: ['Employee directory', 'Role management', 'Contact info', 'Status tracking'], lastUpdate: 'Jan 2026' },
        { name: 'Staff on Duty', desc: 'Active monitoring', fullDesc: 'Real-time monitoring of active staff members, check-in/out tracking, break management, and shift oversight.', icon: 'work_history', industrialIcon: 'working', version: 'v1.0', color: '#06b6d4', status: 'operational', navKey: 'staff-duty', components: 3, linesOfCode: 380, features: ['Real-time status', 'Check-in/out', 'Time tracking', 'Shift management'], lastUpdate: 'Jan 2026' },
        { name: 'Clients', desc: 'Customer database', fullDesc: 'Comprehensive customer relationship management with profiles, contact details, project history, and sync capabilities.', icon: 'group', version: 'v1.0', color: '#10b981', status: 'operational', navKey: 'clients', components: 4, linesOfCode: 580, features: ['Client profiles', 'Contact management', 'History tracking', 'Grid/Table views'], lastUpdate: 'Jan 2026' },
        { name: 'Top Clients', desc: 'Revenue ranking', fullDesc: 'Analytics dashboard showing top performing clients by revenue, with metrics and performance indicators.', icon: 'star', version: 'v1.0', color: '#f59e0b', status: 'operational', navKey: 'top-clients', components: 3, linesOfCode: 420, features: ['Revenue ranking', 'Client metrics', 'Performance tracking', 'Grid view'], lastUpdate: 'Jan 2026' },
        { name: 'Suppliers', desc: 'Vendor directory', fullDesc: 'Supplier management system for tracking vendors, contact information, payment terms, and material sourcing.', icon: 'local_shipping', industrialIcon: 'delivery', version: 'v1.0', color: '#ef4444', status: 'operational', navKey: 'suppliers', components: 4, linesOfCode: 540, features: ['Supplier management', 'Contact info', 'Material sourcing', 'Grid/Table views'], lastUpdate: 'Jan 2026' },
        { name: 'Materials', desc: 'Inventory control', fullDesc: 'Full inventory management with stock levels, minimum/maximum alerts, warehouse locations, and cost tracking.', icon: 'inventory_2', industrialIcon: 'rack', version: 'v1.0', color: '#8b5cf6', status: 'operational', navKey: 'materials', components: 5, linesOfCode: 680, features: ['Inventory tracking', 'Stock levels', 'Category filters', 'Grid view'], lastUpdate: 'Jan 2026' },
        { name: 'Products', desc: 'Product catalog', fullDesc: 'Product catalog management with pricing, categories, descriptions, and integration with BOM system.', icon: 'category', industrialIcon: 'packing-worker', version: 'v1.0', color: '#ec4899', status: 'operational', navKey: 'products', components: 4, linesOfCode: 520, features: ['Product catalog', 'Pricing', 'Categories', 'Search & filter'], lastUpdate: 'Jan 2026' },
        { name: 'Warehouses', desc: 'Storage locations', fullDesc: 'Warehouse and storage location management with inventory tracking and material distribution.', icon: 'warehouse', industrialIcon: 'warehouse-staff', version: 'v1.0', color: '#64748b', status: 'operational', navKey: 'warehouses', components: 4, linesOfCode: 480, features: ['Location management', 'Inventory tracking', 'Stock transfers', 'Grid view'], lastUpdate: 'Jan 2026' },
        { name: 'BOM', desc: 'Bill of Materials', fullDesc: 'Bill of Materials builder with component management, cost calculation, margin analysis, and suggested pricing.', icon: 'account_tree', industrialIcon: 'assembly-worker', version: 'v1.0', color: '#0891b2', status: 'operational', navKey: 'bom', components: 5, linesOfCode: 750, features: ['Product specs', 'Cost calculation', 'Component management', 'Margin analysis'], lastUpdate: 'Jan 2026' },
        { name: 'Projects', desc: 'Work orders', fullDesc: 'Project management system with client assignments, work orders, status tracking, and team coordination.', icon: 'assignment', industrialIcon: 'industrial-worker', version: 'v1.0', color: '#14b8a6', status: 'operational', navKey: 'projects', components: 5, linesOfCode: 720, features: ['Project management', 'Client assignment', 'Status tracking', 'Grid view'], lastUpdate: 'Jan 2026' },
        { name: 'Quotations', desc: 'Sales quotes', fullDesc: 'Quote generation system with item management, pricing calculation, client approval workflow, and export options.', icon: 'request_quote', version: 'v1.0', color: '#7c3aed', status: 'operational', navKey: 'quotations', components: 6, linesOfCode: 900, features: ['Quote generation', 'Client approval', 'Price calculation', 'PDF export'], lastUpdate: 'Jan 2026' },
        { name: 'Requisitions', desc: 'Sales orders', fullDesc: 'Order management with status workflows (Draft, Submitted, Approved, Rejected), item tracking, and notifications.', icon: 'shopping_cart', industrialIcon: 'forklift', version: 'v1.0', color: '#2563eb', status: 'operational', navKey: 'requisitions', components: 6, linesOfCode: 850, features: ['Order management', 'Status workflow', 'Item tracking', 'Grid/Table views'], lastUpdate: 'Jan 2026' },
        { name: 'Operations', desc: 'Production pipeline', fullDesc: 'Production tracking with multi-stage workflows, progress monitoring, material distribution, and team assignment.', icon: 'engineering', industrialIcon: 'operator', version: 'v1.0', color: '#f97316', status: 'operational', navKey: 'operations', components: 6, linesOfCode: 950, features: ['Work orders', 'Stage tracking', 'Progress monitoring', 'Grid view'], lastUpdate: 'Jan 2026' },
        { name: 'Reports', desc: 'Analytics & charts', fullDesc: 'Comprehensive analytics with time-based charts, performance metrics, and exportable reports.', icon: 'analytics', version: 'v1.0', color: '#6366f1', status: 'operational', navKey: 'reports', components: 8, linesOfCode: 1200, features: ['Time-based charts', 'Analytics dashboard', 'Export options', 'Multiple reports'], lastUpdate: 'Jan 2026' },
        { name: 'Quality', desc: 'QC inspections', fullDesc: 'Quality control inspection system with checklists, findings tracking, and inspection history management.', icon: 'verified', industrialIcon: 'qc-worker', version: 'v1.0', color: '#22c55e', status: 'operational', navKey: 'quality', components: 6, linesOfCode: 1100, features: ['Inspections', 'Checklists', 'Findings tracking', 'Edit functionality'], lastUpdate: 'Jan 2026' },
        { name: 'Performance', desc: 'Team metrics', fullDesc: 'Team performance analytics with individual metrics, goal tracking, and productivity indicators.', icon: 'trending_up', version: 'v1.0', color: '#a855f7', status: 'operational', navKey: 'performance', components: 4, linesOfCode: 480, features: ['Team metrics', 'Performance tracking', 'Goals monitoring', 'Analytics'], lastUpdate: 'Jan 2026' },
        { name: 'Project Analysis', desc: 'System statistics', fullDesc: 'System overview showing code statistics, module information, technology stack, and development metrics.', icon: 'science', industrialIcon: 'experiment', version: 'v1.0', color: '#0ea5e9', status: 'operational', navKey: 'project-analysis', components: 3, linesOfCode: 450, features: ['Code statistics', 'Module info', 'Tech stack', 'Quick actions'], lastUpdate: 'Jan 2026' },
        { name: 'Activity Log', desc: 'System history', fullDesc: 'Complete audit trail of all system actions with user tracking, timestamps, and filtering capabilities.', icon: 'history', version: 'v1.0', color: '#78716c', status: 'operational', navKey: 'activity-log', components: 3, linesOfCode: 350, features: ['Action tracking', 'User history', 'Timestamp logs', 'Filtering'], lastUpdate: 'Jan 2026' },
        { name: 'Categories', desc: 'Material categories', fullDesc: 'Category management for organizing materials and products with hierarchy support.', icon: 'folder', industrialIcon: 'toolbox', version: 'v1.0', color: '#d97706', status: 'operational', navKey: 'categories', components: 3, linesOfCode: 320, features: ['Category management', 'Hierarchy', 'Material grouping', 'CRUD operations'], lastUpdate: 'Jan 2026' },
        { name: 'Units', desc: 'Measurement units', fullDesc: 'Measurement unit management with abbreviations and conversion support for inventory tracking.', icon: 'straighten', industrialIcon: 'maintenance', version: 'v1.0', color: '#059669', status: 'operational', navKey: 'units', components: 3, linesOfCode: 280, features: ['Unit management', 'Abbreviations', 'Conversions', 'CRUD operations'], lastUpdate: 'Jan 2026' },
    ];

    const handleModuleClick = (module) => {
        // If onNavigate is provided, navigate to the module
        if (onNavigate && module.navKey) {
            onNavigate(module.navKey);
        } else {
            // Fallback to showing modal
            setSelectedModule(module);
            setShowModuleModal(true);
        }
    };

    const handleModuleInfo = (e, module) => {
        e.stopPropagation();
        setSelectedModule(module);
        setShowModuleModal(true);
    };

    const closeModuleModal = () => {
        setShowModuleModal(false);
        setSelectedModule(null);
    };

    return (
        <div className="module-page project-analysis-page">
            {/* Header */}
            <div className="pa-header">
                <div className="pa-header-icon">
                    <Icon name="code" />
                </div>
                <div className="pa-header-text">
                    <h1>Project Analytics</h1>
                    <p>D-KRAFT - Enterprise Management System Statistics</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="pa-stats-row">
                <div className="pa-stat-card purple">
                    <div className="pa-stat-value">{animatedStats.lines.toLocaleString()}</div>
                    <div className="pa-stat-label">Lines of Code</div>
                </div>
                <div className="pa-stat-card orange">
                    <div className="pa-stat-value">{animatedStats.commits}</div>
                    <div className="pa-stat-label">Git Commits</div>
                </div>
                <div className="pa-stat-card blue">
                    <div className="pa-stat-value">{animatedStats.modules}</div>
                    <div className="pa-stat-label">Modules</div>
                </div>
                <div className="pa-stat-card green">
                    <div className="pa-stat-value">{animatedStats.components}</div>
                    <div className="pa-stat-label">Components</div>
                </div>
            </div>

            {/* Tech Badges */}
            <div className="pa-badges-row">
                {techBadges.map((badge, i) => (
                    <div key={i} className="pa-badge">
                        <Icon name={badge.icon} style={{ color: badge.color }} />
                        <span>{badge.label}</span>
                    </div>
                ))}
            </div>

            {/* Development Info Card */}
            <div className="pa-card">
                <div className="pa-card-header">
                    <Icon name="terminal" />
                    <span>Development Configuration</span>
                    <div className="pa-status-badge">
                        <span className="status-dot green"></span>
                        CaliDevs.com Ready
                    </div>
                </div>
                <p className="pa-card-desc">
                    D-KRAFT was developed by <strong>CaliDevs.com</strong> using modern web technologies.
                    The system uses React 19 as the primary framework with Vite for ultra-fast development builds.
                </p>
                <div className="pa-provider-cards">
                    <div className="pa-provider-card active">
                        <div className="pa-provider-icon">🚀</div>
                        <div className="pa-provider-info">
                            <div className="pa-provider-name">
                                CaliDevs.com
                                <span className="pa-provider-badge primary">DEVELOPER</span>
                            </div>
                            <div className="pa-provider-sub">Full-stack web development & design</div>
                        </div>
                        <div className="pa-provider-status connected">
                            <span className="status-dot green"></span>
                            Active
                        </div>
                    </div>
                    <div className="pa-provider-card">
                        <div className="pa-provider-icon">⚛️</div>
                        <div className="pa-provider-info">
                            <div className="pa-provider-name">
                                React 19
                                <span className="pa-provider-badge">FRAMEWORK</span>
                            </div>
                            <div className="pa-provider-sub">Modern UI library with hooks</div>
                        </div>
                        <div className="pa-provider-status ready">
                            <span className="status-dot blue"></span>
                            Ready
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="pa-card">
                <div className="pa-card-header">
                    <Icon name="bolt" />
                    <span>Quick Actions</span>
                </div>
                <div className="pa-actions-grid">
                    {quickActions.map((action, i) => (
                        <div
                            key={i}
                            className={`pa-action-card ${cacheCleared && action.name === 'Clear Cache' ? 'success' : ''}`}
                            onClick={action.action}
                            style={{ cursor: action.action ? 'pointer' : 'default' }}
                        >
                            <div className="pa-action-icon" style={{ background: `${action.color}20`, color: action.color }}>
                                <Icon name={cacheCleared && action.name === 'Clear Cache' ? 'check' : action.icon} />
                            </div>
                            <div className="pa-action-info">
                                <div className="pa-action-name">{cacheCleared && action.name === 'Clear Cache' ? 'Cleared!' : action.name}</div>
                                <div className="pa-action-sub">{action.subtitle}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Code Breakdown & Tech Stack */}
            <div className="pa-two-col">
                <div className="pa-card">
                    <div className="pa-card-header">
                        <Icon name="pie_chart" />
                        <span>Code Breakdown</span>
                    </div>
                    <div className="pa-breakdown-list">
                        {codeBreakdown.map((item, i) => (
                            <div key={i} className="pa-breakdown-item">
                                <div className="pa-breakdown-label">
                                    <span>{item.name}</span>
                                    <span className="pa-breakdown-value">{item.lines.toLocaleString()} lines</span>
                                </div>
                                <div className="pa-breakdown-bar">
                                    <div
                                        className="pa-breakdown-fill"
                                        style={{ width: `${item.percent}%`, background: item.color }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pa-card">
                    <div className="pa-card-header">
                        <Icon name="layers" />
                        <span>Technology Stack</span>
                    </div>
                    <div className="pa-tech-grid">
                        {techStack.map((tech, i) => (
                            <div key={i} className="pa-tech-item">
                                <div className="pa-tech-emoji">{tech.icon}</div>
                                <div className="pa-tech-name">{tech.name}</div>
                                <div className="pa-tech-sub">{tech.subtitle}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Key Features */}
            <div className="pa-card">
                <div className="pa-card-header">
                    <Icon name="star" />
                    <span>Key Features</span>
                </div>
                <div className="pa-features-grid">
                    {keyFeatures.map((feature, i) => (
                        <div key={i} className="pa-feature-card" style={{ borderColor: `${feature.color}40` }}>
                            <div className="pa-feature-icon" style={{ background: `${feature.color}15`, color: feature.color }}>
                                <Icon name={feature.icon} />
                            </div>
                            <div className="pa-feature-name">{feature.name}</div>
                            <div className="pa-feature-desc">{feature.desc}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Development Metrics */}
            <div className="pa-card">
                <div className="pa-card-header">
                    <Icon name="insights" />
                    <span>Development Metrics</span>
                </div>
                <div className="pa-metrics-list">
                    {devMetrics.map((metric, i) => (
                        <div key={i} className="pa-metric-row">
                            <div className="pa-metric-icon" style={{ color: metric.color }}>
                                <Icon name={metric.icon} />
                            </div>
                            <span className="pa-metric-name">{metric.name}</span>
                            <span className="pa-metric-value" style={{ color: metric.color }}>{metric.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* System Modules */}
            <div className="pa-card">
                <div className="pa-card-header">
                    <Icon name="grid_view" />
                    <span>System Modules ({modules.length})</span>
                    <div className="pa-header-hint">
                        <Icon name="touch_app" />
                        Click to navigate, info icon for details
                    </div>
                </div>
                <div className="pa-modules-grid">
                    {modules.map((module, i) => (
                        <div
                            key={i}
                            className="pa-module-card clickable"
                            onClick={() => handleModuleClick(module)}
                            title={`Click to open ${module.name}`}
                        >
                            <div className="pa-module-icon" style={{ background: `${module.color}15`, color: module.color }}>
                                {module.industrialIcon ? (
                                    <IndustrialIcon name={module.industrialIcon} size={22} color="white" />
                                ) : (
                                    <Icon name={module.icon} />
                                )}
                            </div>
                            <div className="pa-module-info">
                                <div className="pa-module-name">{module.name}</div>
                                <div className="pa-module-desc">{module.desc}</div>
                            </div>
                            <div className="pa-module-meta">
                                <span className="pa-module-version">{module.version}</span>
                                <button
                                    className="pa-module-info-btn"
                                    onClick={(e) => handleModuleInfo(e, module)}
                                    title="View module details"
                                >
                                    <Icon name="info" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Module Detail Modal */}
            {showModuleModal && selectedModule && (
                <div className="modal-overlay" onClick={closeModuleModal}>
                    <div className="modal-content modal-pa-module" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon" style={{ background: `${selectedModule.color}20`, color: selectedModule.color }}>
                                {selectedModule.industrialIcon ? (
                                    <IndustrialIcon name={selectedModule.industrialIcon} size={26} color="white" />
                                ) : (
                                    <Icon name={selectedModule.icon} />
                                )}
                            </div>
                            <div className="modal-header-text">
                                <h3>{selectedModule.name}</h3>
                                <p>{selectedModule.desc}</p>
                            </div>
                            <button className="modal-close" onClick={closeModuleModal}>
                                <Icon name="close" />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="pa-modal-stats">
                                <div className="pa-modal-stat">
                                    <div className="pa-modal-stat-icon" style={{ color: selectedModule.color }}>
                                        <Icon name="widgets" />
                                    </div>
                                    <div className="pa-modal-stat-info">
                                        <span className="pa-modal-stat-value">{selectedModule.components}</span>
                                        <span className="pa-modal-stat-label">Components</span>
                                    </div>
                                </div>
                                <div className="pa-modal-stat">
                                    <div className="pa-modal-stat-icon" style={{ color: selectedModule.color }}>
                                        <Icon name="code" />
                                    </div>
                                    <div className="pa-modal-stat-info">
                                        <span className="pa-modal-stat-value">{selectedModule.linesOfCode.toLocaleString()}</span>
                                        <span className="pa-modal-stat-label">Lines of Code</span>
                                    </div>
                                </div>
                                <div className="pa-modal-stat">
                                    <div className="pa-modal-stat-icon" style={{ color: '#10b981' }}>
                                        <Icon name="check_circle" />
                                    </div>
                                    <div className="pa-modal-stat-info">
                                        <span className="pa-modal-stat-value">{selectedModule.status}</span>
                                        <span className="pa-modal-stat-label">Status</span>
                                    </div>
                                </div>
                                <div className="pa-modal-stat">
                                    <div className="pa-modal-stat-icon" style={{ color: '#8b5cf6' }}>
                                        <Icon name="new_releases" />
                                    </div>
                                    <div className="pa-modal-stat-info">
                                        <span className="pa-modal-stat-value">{selectedModule.version}</span>
                                        <span className="pa-modal-stat-label">Version</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pa-modal-section">
                                <h4>
                                    <Icon name="star" />
                                    Key Features
                                </h4>
                                <div className="pa-modal-features">
                                    {selectedModule.features.map((feature, i) => (
                                        <div key={i} className="pa-modal-feature">
                                            <Icon name="check" style={{ color: selectedModule.color }} />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pa-modal-section">
                                <h4>
                                    <Icon name="info" />
                                    Module Information
                                </h4>
                                <div className="pa-modal-info-grid">
                                    <div className="pa-modal-info-item">
                                        <span className="pa-modal-info-label">Created</span>
                                        <span className="pa-modal-info-value">December 2025</span>
                                    </div>
                                    <div className="pa-modal-info-item">
                                        <span className="pa-modal-info-label">Last Updated</span>
                                        <span className="pa-modal-info-value">December 2025</span>
                                    </div>
                                    <div className="pa-modal-info-item">
                                        <span className="pa-modal-info-label">Framework</span>
                                        <span className="pa-modal-info-value">React 19</span>
                                    </div>
                                    <div className="pa-modal-info-item">
                                        <span className="pa-modal-info-label">Developer</span>
                                        <span className="pa-modal-info-value">CaliDevs.com</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={closeModuleModal}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="pa-footer">
                <div className="pa-footer-logo">
                    <span>DC</span>
                </div>
                <div className="pa-footer-text">
                    <strong>D-KRAFT</strong> by CaliDevs.com
                </div>
                <div className="pa-footer-version">v1.0.0 • December 2025</div>
            </div>
        </div>
    );
};

export default ProjectAnalysis;
