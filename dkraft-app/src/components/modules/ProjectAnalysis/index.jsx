import { useState, useEffect } from 'react';
import { Icon } from '../../common';

const ProjectAnalysis = () => {
    const [cacheCleared, setCacheCleared] = useState(false);
    const [animatedStats, setAnimatedStats] = useState({ lines: 0, commits: 0, modules: 0, components: 0 });
    const [selectedModule, setSelectedModule] = useState(null);
    const [showModuleModal, setShowModuleModal] = useState(false);

    const projectStats = {
        lines: 22000,
        commits: 48,
        modules: 14,
        components: 52
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
        { name: 'Total Lines of Code', value: '22,000+', icon: 'code', color: '#8b5cf6' },
        { name: 'Source Files', value: '52', icon: 'folder', color: '#f59e0b' },
        { name: 'Project Started', value: 'Dec 2025', icon: 'calendar_today', color: '#10b981' },
        { name: 'Active Modules', value: '14', icon: 'grid_view', color: '#3b82f6' },
    ];

    const modules = [
        { name: 'Dashboard', desc: 'Overview & KPIs', icon: 'dashboard', version: 'v1.0', color: '#8b5cf6', status: 'Active', components: 5, linesOfCode: 450, features: ['Real-time stats', 'KPI cards', 'Quick navigation', 'Activity feed'] },
        { name: 'Staff', desc: 'Employee management', icon: 'badge', version: 'v1.0', color: '#3b82f6', status: 'Active', components: 4, linesOfCode: 620, features: ['Employee directory', 'Role management', 'Contact info', 'Status tracking'] },
        { name: 'Staff on Duty', desc: 'Active monitoring', icon: 'work_history', version: 'v1.0', color: '#06b6d4', status: 'Active', components: 3, linesOfCode: 380, features: ['Real-time status', 'Check-in/out', 'Time tracking', 'Shift management'] },
        { name: 'Clients', desc: 'Customer database', icon: 'group', version: 'v1.0', color: '#10b981', status: 'Active', components: 4, linesOfCode: 580, features: ['Client profiles', 'Contact management', 'History tracking', 'Grid/Table views'] },
        { name: 'Top Clients', desc: 'Revenue ranking', icon: 'star', version: 'v1.0', color: '#f59e0b', status: 'Active', components: 3, linesOfCode: 420, features: ['Revenue ranking', 'Client metrics', 'Performance tracking', 'Grid view'] },
        { name: 'Suppliers', desc: 'Vendor directory', icon: 'local_shipping', version: 'v1.0', color: '#ef4444', status: 'Active', components: 4, linesOfCode: 540, features: ['Supplier management', 'Contact info', 'Material sourcing', 'Grid/Table views'] },
        { name: 'Materials', desc: 'Inventory control', icon: 'inventory_2', version: 'v1.0', color: '#8b5cf6', status: 'Active', components: 5, linesOfCode: 680, features: ['Inventory tracking', 'Stock levels', 'Category filters', 'Grid view'] },
        { name: 'Products', desc: 'Product catalog', icon: 'category', version: 'v1.0', color: '#ec4899', status: 'Active', components: 4, linesOfCode: 520, features: ['Product catalog', 'Pricing', 'Categories', 'Search & filter'] },
        { name: 'Projects', desc: 'Work orders', icon: 'assignment', version: 'v1.0', color: '#14b8a6', status: 'Active', components: 5, linesOfCode: 720, features: ['Project management', 'Client assignment', 'Status tracking', 'Grid view'] },
        { name: 'Operations', desc: 'Production pipeline', icon: 'engineering', version: 'v1.0', color: '#f97316', status: 'Active', components: 6, linesOfCode: 850, features: ['Work orders', 'Stage tracking', 'Progress monitoring', 'Grid view'] },
        { name: 'Reports', desc: 'Analytics & charts', icon: 'analytics', version: 'v1.0', color: '#6366f1', status: 'Active', components: 8, linesOfCode: 1200, features: ['Time-based charts', 'Analytics dashboard', 'Export options', 'Multiple reports'] },
        { name: 'Quality', desc: 'QC inspections', icon: 'verified', version: 'v1.0', color: '#22c55e', status: 'Active', components: 6, linesOfCode: 1100, features: ['Inspections', 'Checklists', 'Findings tracking', 'Edit functionality'] },
        { name: 'Performance', desc: 'Team metrics', icon: 'trending_up', version: 'v1.0', color: '#a855f7', status: 'Active', components: 4, linesOfCode: 480, features: ['Team metrics', 'Performance tracking', 'Goals monitoring', 'Analytics'] },
        { name: 'Project Analysis', desc: 'System statistics', icon: 'science', version: 'v1.0', color: '#0ea5e9', status: 'Active', components: 3, linesOfCode: 350, features: ['Code statistics', 'Module info', 'Tech stack', 'Quick actions'] },
    ];

    const handleModuleClick = (module) => {
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
                        Click any module for details
                    </div>
                </div>
                <div className="pa-modules-grid">
                    {modules.map((module, i) => (
                        <div
                            key={i}
                            className="pa-module-card clickable"
                            onClick={() => handleModuleClick(module)}
                        >
                            <div className="pa-module-icon" style={{ background: `${module.color}15`, color: module.color }}>
                                <Icon name={module.icon} />
                            </div>
                            <div className="pa-module-info">
                                <div className="pa-module-name">{module.name}</div>
                                <div className="pa-module-desc">{module.desc}</div>
                            </div>
                            <div className="pa-module-meta">
                                <span className="pa-module-version">{module.version}</span>
                                <span className="pa-module-dot" style={{ background: module.color }}></span>
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
                                <Icon name={selectedModule.icon} />
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
