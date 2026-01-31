import { useEffect, useRef, useState } from 'react';
import { Icon, Button, Badge } from '../../common';
import { statsData, chartData, quickActions, recentOrders, staffOnDuty, topClients, getStatusClass, getStatusLabel } from '../../../data/initialData';
import { clientsApi, suppliersApi, materialsApi, productsApi, isApiEnabled } from '../../../services/api';

/**
 * CardMenu Component - Dropdown menu with Refresh and Export options
 */
const CardMenu = ({ onRefresh, onExport, title = 'Data' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleRefresh = () => {
        setIsOpen(false);
        if (onRefresh) onRefresh();
    };

    const handleExport = (format) => {
        setIsOpen(false);
        if (onExport) onExport(format);
    };

    return (
        <div className="card-menu-container" ref={menuRef}>
            <button className="card-menu-btn" onClick={() => setIsOpen(!isOpen)}>
                <Icon name="more_horiz" />
            </button>
            {isOpen && (
                <div className="card-menu-dropdown">
                    <div className="card-menu-header">{title}</div>
                    <button className="card-menu-item" onClick={handleRefresh}>
                        <Icon name="refresh" />
                        <span>Refresh Data</span>
                    </button>
                    <div className="card-menu-divider" />
                    <button className="card-menu-item" onClick={() => handleExport('csv')}>
                        <Icon name="download" />
                        <span>Export CSV</span>
                    </button>
                    <button className="card-menu-item" onClick={() => handleExport('json')}>
                        <Icon name="data_object" />
                        <span>Export JSON</span>
                    </button>
                    <button className="card-menu-item" onClick={() => handleExport('pdf')}>
                        <Icon name="picture_as_pdf" />
                        <span>Export PDF</span>
                    </button>
                </div>
            )}
        </div>
    );
};

/**
 * StatCard Component - Enhanced with Tailwind
 */
const StatCard = ({ label, value, icon, delay, onClick }) => (
    <div className={`stat-card group relative overflow-hidden rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl animate-in delay-${delay}`}>
        {/* Background glow on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 to-blue-500/0 group-hover:from-orange-500/10 group-hover:to-blue-500/5 transition-all duration-500" />

        <div className="relative z-10">
            <div className="stat-label text-sm font-semibold uppercase tracking-wider text-slate-300 mb-2">{label}</div>
            <div className="stat-value text-4xl font-bold text-orange-400 mb-6">{value}</div>
            <div className="stat-footer flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <div className="stat-icon w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Icon name={icon} />
                </div>
                <button
                    onClick={onClick}
                    className="stat-link flex items-center gap-2 text-sm font-medium text-white/70 hover:text-orange-400 transition-all duration-300 group-hover:translate-x-1"
                >
                    View details
                    <Icon name="arrow_forward" className="text-lg transition-transform duration-300 group-hover:translate-x-1" />
                </button>
            </div>
        </div>
    </div>
);

/**
 * ProductionChart Component
 */
const ProductionChart = () => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (chartRef.current && window.Chart) {
            const ctx = chartRef.current.getContext('2d');

            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const gradient = ctx.createLinearGradient(0, 0, 0, 280);
            gradient.addColorStop(0, 'rgba(0, 51, 179, 0.4)');
            gradient.addColorStop(1, 'rgba(0, 51, 179, 0.0)');

            chartInstance.current = new window.Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        data: chartData.values,
                        borderColor: '#ff6b35',
                        borderWidth: 3,
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#ff6b35',
                        pointBorderColor: '#0033b3',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            backgroundColor: '#020817',
                            titleColor: '#f8fafc',
                            bodyColor: '#94a3b8',
                            borderColor: 'rgba(255, 107, 53, 0.5)',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                                label: (context) => `Projects: ${context.raw}`
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#64748b',
                                font: { family: 'Red Hat Display' }
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#64748b',
                                font: { family: 'Red Hat Display' }
                            },
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };
    }, []);

    return (
        <div className="chart-container">
            <canvas ref={chartRef}></canvas>
        </div>
    );
};

/**
 * ActionCard Component
 */
const ActionCard = ({ title, desc, progress, onClick }) => (
    <div className="action-card group relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-orange-500/30">
        {/* Hover glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/0 to-orange-500/0 group-hover:from-orange-500/5 group-hover:via-transparent group-hover:to-blue-500/5 transition-all duration-500" />

        <div className="relative z-10">
            <div className="action-title text-lg font-bold text-white mb-2">{title}</div>
            <div className="action-desc text-sm text-slate-400 mb-4">{desc}</div>
            <div className="action-progress h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
                <div
                    className="action-progress-bar h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-700"
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
        <button
            onClick={onClick}
            className="action-btn absolute bottom-4 right-4 w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-lg group-hover:shadow-orange-500/30"
        >
            <Icon name="arrow_forward" />
        </button>
    </div>
);

/**
 * StaffOnDutyCard Component
 */
const StaffOnDutyCard = ({ onViewAll }) => (
    <div className="staff-duty-card animate-in delay-5">
        <div className="card-header">
            <div>
                <div className="card-title">Staff on Duty</div>
                <div className="card-subtitle">{staffOnDuty.filter(s => s.status === 'working').length} actively working</div>
            </div>
            <button className="btn-secondary" onClick={onViewAll}>
                View All <Icon name="arrow_forward" />
            </button>
        </div>
        <div className="staff-duty-list">
            {staffOnDuty.map((staff) => (
                <div key={staff.id} className="staff-duty-item">
                    <div className={`staff-avatar ${staff.status}`}>{staff.avatar}</div>
                    <div className="staff-info">
                        <div className="staff-name">{staff.name}</div>
                        <div className="staff-role">{staff.role}</div>
                    </div>
                    <div className="staff-task">
                        <div className="task-name">{staff.currentTask}</div>
                        <div className="task-since">Since {staff.since}</div>
                    </div>
                    <div className={`staff-status-badge ${staff.status}`}>
                        {staff.status === 'working' ? 'Working' : 'On Break'}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

/**
 * TopClientsCard Component
 */
const TopClientsCard = ({ onViewAll }) => (
    <div className="top-clients-card animate-in delay-6">
        <div className="card-header">
            <div>
                <div className="card-title">Top Clients</div>
                <div className="card-subtitle">By total revenue</div>
            </div>
            <button className="btn-secondary" onClick={onViewAll}>
                View All <Icon name="arrow_forward" />
            </button>
        </div>
        <div className="top-clients-list">
            {topClients.map((client, index) => (
                <div key={client.id} className="top-client-item">
                    <div className="client-rank">#{index + 1}</div>
                    <div className="client-info">
                        <div className="client-name">{client.name}</div>
                        <div className="client-orders">{client.totalOrders} orders</div>
                    </div>
                    <div className="client-revenue">
                        <div className="revenue-amount">${client.totalRevenue.toLocaleString()}</div>
                        <div className={`revenue-trend ${client.trend}`}>
                            <Icon name={client.trend === 'up' ? 'trending_up' : client.trend === 'down' ? 'trending_down' : 'trending_flat'} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

/**
 * API Connection Test Component
 */
const ConnectionTestCard = () => {
    const [results, setResults] = useState({});
    const [loading, setLoading] = useState({});

    const modules = [
        { key: 'clients', label: 'Clients', icon: 'groups', api: clientsApi },
        { key: 'suppliers', label: 'Suppliers', icon: 'local_shipping', api: suppliersApi },
        { key: 'materials', label: 'Materials', icon: 'inventory_2', api: materialsApi },
        { key: 'products', label: 'Products', icon: 'precision_manufacturing', api: productsApi },
    ];

    const testModule = async (moduleKey, api) => {
        setLoading(prev => ({ ...prev, [moduleKey]: true }));
        setResults(prev => ({ ...prev, [moduleKey]: null }));

        try {
            console.log(`[Test] Testing ${moduleKey}...`);
            const data = await api.getAll();
            console.log(`[Test] ${moduleKey} fetched:`, data);

            setResults(prev => ({
                ...prev,
                [moduleKey]: {
                    success: true,
                    count: Array.isArray(data) ? data.length : 0,
                    data: data
                }
            }));
        } catch (error) {
            console.error(`[Test] Error in ${moduleKey}:`, error);
            setResults(prev => ({
                ...prev,
                [moduleKey]: {
                    success: false,
                    error: error.message
                }
            }));
        } finally {
            setLoading(prev => ({ ...prev, [moduleKey]: false }));
        }
    };

    const buttonStyle = (isLoading) => ({
        padding: '14px 24px',
        background: isLoading ? 'rgba(100, 116, 139, 0.5)' : 'linear-gradient(135deg, #ff6b35 0%, #ff8c5a 100%)',
        color: '#ffffff',
        border: 'none',
        borderRadius: '10px',
        textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        fontSize: '15px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: '150px',
        justifyContent: 'center',
        boxShadow: isLoading ? 'none' : '0 4px 15px rgba(255, 107, 53, 0.3)',
        transition: 'all 0.3s ease'
    });

    const getResultStyle = (result) => ({
        marginTop: '12px',
        padding: '12px 14px',
        borderRadius: '8px',
        backgroundColor: result?.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
        border: `1px solid ${result?.success ? '#10b981' : '#ef4444'}`,
        fontSize: '13px'
    });

    return (
        <div className="card animate-in delay-1" style={{ marginBottom: '20px' }}>
            <div className="card-header">
                <div>
                    <div className="card-title">
                        <Icon name="hub" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        API Connection Test
                    </div>
                    <div className="card-subtitle">
                        API Enabled: {isApiEnabled() ? 'Yes' : 'No'} | Test each module individually
                    </div>
                </div>
            </div>
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {modules.map(({ key, label, icon, api }) => (
                        <div key={key} style={{
                            padding: '18px',
                            backgroundColor: 'rgba(15, 45, 100, 0.4)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            backdropFilter: 'blur(8px)'
                        }}>
                            <button
                                onClick={() => testModule(key, api)}
                                disabled={loading[key]}
                                style={buttonStyle(loading[key])}
                            >
                                <Icon name={loading[key] ? 'sync' : icon} style={{
                                    fontSize: '20px',
                                    animation: loading[key] ? 'spin 1s linear infinite' : 'none'
                                }} />
                                {loading[key] ? 'Testing...' : label}
                            </button>

                            {results[key] && (
                                <div style={getResultStyle(results[key])}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: results[key].success ? '#10b981' : '#ef4444',
                                        fontWeight: '600'
                                    }}>
                                        <Icon name={results[key].success ? 'check_circle' : 'error'} style={{ fontSize: '18px' }} />
                                        {results[key].success ? 'Success' : 'Error'}
                                    </div>
                                    {results[key].success ? (
                                        <p style={{ margin: '8px 0 0', color: '#c7d2fe' }}>
                                            Records: <strong style={{ color: '#ffffff' }}>{results[key].count}</strong>
                                        </p>
                                    ) : (
                                        <p style={{ margin: '8px 0 0', color: '#f87171', fontSize: '12px' }}>
                                            {results[key].error}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/**
 * CommunicationCard Component
 */
const CommunicationCard = ({ onRefresh, onExport }) => (
    <div className="comm-card animate-in delay-2">
        <div className="comm-header">
            <div>
                <div className="card-title">Internal Communication</div>
                <div className="card-subtitle">Dovecreek News</div>
            </div>
            <CardMenu
                title="News"
                onRefresh={onRefresh}
                onExport={onExport}
            />
        </div>
        <div className="comm-content">
            <div className="comm-item">
                <img
                    src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=200&h=200&fit=crop"
                    alt="Meeting"
                    className="comm-image"
                />
                <div className="comm-details">
                    <div className="comm-date">
                        <Icon name="schedule" style={{ fontSize: '14px' }} />
                        Mar 27, 2025
                    </div>
                    <div className="comm-title-text">New Corporate Account</div>
                    <div className="comm-text">
                        We are pleased to announce the opening of a new corporate account to facilitate the management of project purchases and payments...
                    </div>
                    <div className="comm-actions">
                        <button className="comm-btn primary">Comment</button>
                        <button className="comm-btn secondary">View More</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

/**
 * LiveActivityFeed Component - Real-time activity ticker
 */
const LiveActivityFeed = ({ onNavigate }) => {
    const [activities] = useState([
        { id: 1, type: 'order', icon: 'receipt_long', text: 'New order #OP-2025-042 created', time: '2 min ago', color: 'orange' },
        { id: 2, type: 'production', icon: 'precision_manufacturing', text: 'Assembly completed for Project ABC', time: '5 min ago', color: 'success' },
        { id: 3, type: 'material', icon: 'inventory_2', text: 'Plywood stock running low (15 units)', time: '12 min ago', color: 'warning' },
        { id: 4, type: 'staff', icon: 'person', text: 'Carlos M. started shift at CNC Station', time: '18 min ago', color: 'info' },
        { id: 5, type: 'quality', icon: 'verified', text: 'QA inspection passed for WO-2025-038', time: '25 min ago', color: 'success' },
    ]);

    return (
        <div className="bg-slate-800/40 rounded-2xl border border-white/10 p-5 animate-in delay-2">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                        <Icon name="bolt" className="text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">Live Activity</h3>
                        <p className="text-slate-400 text-xs">Real-time updates</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-slate-400">Live</span>
                </div>
            </div>

            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 scrollbar-thin">
                {activities.map((activity, index) => (
                    <div
                        key={activity.id}
                        className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800/50 transition-all cursor-pointer group"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className={`
                            w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                            ${activity.color === 'orange' ? 'bg-orange-500/20 text-orange-400' :
                              activity.color === 'success' ? 'bg-green-500/20 text-green-400' :
                              activity.color === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-blue-500/20 text-blue-400'}
                        `}>
                            <Icon name={activity.icon} size="sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-200 truncate group-hover:text-white transition-colors">
                                {activity.text}
                            </p>
                            <p className="text-xs text-slate-500">{activity.time}</p>
                        </div>
                        <Icon name="chevron_right" className="text-slate-600 group-hover:text-orange-400 transition-colors" size="sm" />
                    </div>
                ))}
            </div>

            <Button
                variant="ghost"
                size="sm"
                icon="history"
                className="w-full mt-4"
                onClick={() => onNavigate?.('activity-log')}
            >
                View All Activity
            </Button>
        </div>
    );
};

/**
 * InventoryAlertsWidget Component - Material stock alerts
 */
const InventoryAlertsWidget = ({ onNavigate }) => {
    const [alerts] = useState([
        { id: 1, material: 'Birch Plywood 3/4"', current: 12, min: 25, unit: 'sheets', severity: 'critical' },
        { id: 2, material: 'Soft Close Hinges', current: 45, min: 50, unit: 'pairs', severity: 'warning' },
        { id: 3, material: 'Edge Banding White', current: 180, min: 200, unit: 'ft', severity: 'warning' },
        { id: 4, material: 'Drawer Slides 18"', current: 8, min: 30, unit: 'pairs', severity: 'critical' },
    ]);

    const getSeverityColor = (severity) => {
        return severity === 'critical' ? 'danger' : 'warning';
    };

    const getPercentage = (current, min) => {
        return Math.min((current / min) * 100, 100);
    };

    return (
        <div className="bg-slate-800/40 rounded-2xl border border-white/10 p-5 animate-in delay-3">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                        <Icon name="warning" className="text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold">Inventory Alerts</h3>
                        <p className="text-slate-400 text-xs">{alerts.length} items need attention</p>
                    </div>
                </div>
                <Badge variant="danger" size="sm" dot pulse>
                    {alerts.filter(a => a.severity === 'critical').length} Critical
                </Badge>
            </div>

            <div className="space-y-3">
                {alerts.map((alert) => (
                    <div
                        key={alert.id}
                        className="p-3 rounded-xl bg-slate-900/50 hover:bg-slate-800/50 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-200 font-medium truncate flex-1">
                                {alert.material}
                            </span>
                            <Badge variant={getSeverityColor(alert.severity)} size="sm">
                                {alert.severity}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                        alert.severity === 'critical' ? 'bg-red-500' : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${getPercentage(alert.current, alert.min)}%` }}
                                />
                            </div>
                            <span className="text-xs text-slate-400 whitespace-nowrap">
                                {alert.current}/{alert.min} {alert.unit}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2 mt-4">
                <Button
                    variant="ghost"
                    size="sm"
                    icon="inventory_2"
                    className="flex-1"
                    onClick={() => onNavigate?.('materials')}
                >
                    View Inventory
                </Button>
                <Button
                    variant="orange"
                    size="sm"
                    icon="add_shopping_cart"
                    onClick={() => onNavigate?.('requisitions')}
                >
                    Reorder
                </Button>
            </div>
        </div>
    );
};

/**
 * QuickStatsWidget Component - Mini stats with sparklines
 */
const QuickStatsWidget = () => {
    const [stats] = useState([
        { label: 'Efficiency', value: '94%', trend: '+2.3%', icon: 'speed', color: 'green' },
        { label: 'On-Time', value: '87%', trend: '-1.2%', icon: 'schedule', color: 'amber' },
        { label: 'Quality', value: '99%', trend: '+0.5%', icon: 'verified', color: 'green' },
    ]);

    return (
        <div className="grid grid-cols-3 gap-4 animate-in delay-1">
            {stats.map((stat, index) => (
                <div
                    key={stat.label}
                    className="bg-slate-800/40 rounded-2xl border border-white/10 p-4 hover:bg-slate-800/60 transition-all group cursor-pointer"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <Icon name={stat.icon} className="text-slate-400 group-hover:text-orange-400 transition-colors" size="sm" />
                        <span className="text-xs text-slate-400 uppercase tracking-wider">{stat.label}</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="text-2xl font-bold text-white">{stat.value}</span>
                        <span className={`text-xs font-medium ${
                            stat.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'
                        }`}>
                            {stat.trend}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
};

/**
 * Dashboard Module Component
 */
const Dashboard = ({ onNavigate }) => {
    const [refreshKey, setRefreshKey] = useState(0);
    const [notification, setNotification] = useState(null);

    // Map stats to navigation keys (matches activeNav values)
    const statRoutes = {
        'Orders Produced': 'operations',
        'Products Delivered': 'products',
        'Materials Cadence': 'materials',
    };

    // Map quick actions to navigation keys
    const actionRoutes = {
        'Register Product': 'products',
        'New Order': 'quotations',
        'Assign Staff': 'staff-duty',
    };

    // Navigation handler
    const handleNavigate = (navKey) => {
        if (onNavigate) {
            onNavigate(navKey);
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const handleRefresh = (section) => {
        setRefreshKey(prev => prev + 1);
        showNotification(`${section} data refreshed successfully`);
    };

    const handleExport = (section, format) => {
        // Simulated export functionality
        const data = {
            stats: statsData,
            orders: recentOrders,
            staff: staffOnDuty,
            clients: topClients
        };

        const sectionData = data[section] || data.stats;

        if (format === 'json') {
            const blob = new Blob([JSON.stringify(sectionData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dkraft-${section}-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showNotification(`${section} exported as JSON`);
        } else if (format === 'csv') {
            const headers = Object.keys(sectionData[0] || {}).join(',');
            const rows = sectionData.map(item => Object.values(item).join(',')).join('\n');
            const csv = `${headers}\n${rows}`;
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `dkraft-${section}-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            showNotification(`${section} exported as CSV`);
        } else if (format === 'pdf') {
            showNotification('PDF export coming soon!', 'info');
        }
    };

    return (
        <div className="dashboard-content">
            {/* Notification Toast */}
            {notification && (
                <div className={`dashboard-toast ${notification.type}`}>
                    <Icon name={notification.type === 'success' ? 'check_circle' : 'info'} />
                    <span>{notification.message}</span>
                </div>
            )}

            {/* Quick Stats Row */}
            <QuickStatsWidget />

            {/* Live Activity & Inventory Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                <LiveActivityFeed onNavigate={handleNavigate} />
                <InventoryAlertsWidget onNavigate={handleNavigate} />
            </div>

            {/* API Connection Test */}
            <ConnectionTestCard />

            {/* Operational Progress Card */}
            <div className="card animate-in delay-1" key={refreshKey}>
                <div className="card-header">
                    <div>
                        <div className="card-title">Operational Progress</div>
                        <div className="card-subtitle">Track your operations and improve workshop efficiency.</div>
                    </div>
                    <CardMenu
                        title="Operations"
                        onRefresh={() => handleRefresh('stats')}
                        onExport={(format) => handleExport('stats', format)}
                    />
                </div>

                <div className="stats-grid">
                    {statsData.map((stat, index) => (
                        <StatCard
                            key={stat.label}
                            label={stat.label}
                            value={stat.value}
                            icon={stat.icon}
                            delay={index + 1}
                            onClick={() => handleNavigate(statRoutes[stat.label] || 'dashboard')}
                        />
                    ))}
                </div>

                <div className="chart-header">
                    <div className="chart-title">Weekly Production</div>
                    <button className="chart-filter">
                        This Week <Icon name="expand_more" />
                    </button>
                </div>

                <ProductionChart />
            </div>

            {/* Quick Actions */}
            <div className="quick-actions animate-in delay-3">
                {quickActions.map((action, index) => (
                    <ActionCard
                        key={index}
                        title={action.title}
                        desc={action.desc}
                        progress={action.progress}
                        onClick={() => handleNavigate(actionRoutes[action.title] || 'dashboard')}
                    />
                ))}
            </div>

            {/* Bottom Section - Recent Orders & Communication */}
            <div className="dashboard-bottom-grid">
                {/* Recent Orders */}
                <div className="recent-orders-card animate-in delay-4">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Recent Orders</div>
                            <div className="card-subtitle">Latest project orders and their status</div>
                        </div>
                        <button className="btn-secondary" onClick={() => handleNavigate('operations')}>
                            View All <Icon name="arrow_forward" />
                        </button>
                    </div>
                    <div className="orders-table">
                        <div className="orders-table-header">
                            <span>Order</span>
                            <span>Client</span>
                            <span>Project</span>
                            <span>Amount</span>
                            <span>Status</span>
                        </div>
                        {recentOrders.map((order) => (
                            <div key={order.id} className="orders-table-row">
                                <span className="order-id">{order.orderNumber}</span>
                                <span className="order-client">{order.client}</span>
                                <span className="order-project">{order.project}</span>
                                <span className="order-amount">${order.amount.toLocaleString()}</span>
                                <span className={`order-status ${getStatusClass(order.status)}`}>
                                    {getStatusLabel(order.status)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Communication Card */}
                <CommunicationCard
                    onRefresh={() => handleRefresh('news')}
                    onExport={(format) => handleExport('news', format)}
                />
            </div>

            {/* Staff & Clients Section */}
            <div className="dashboard-staff-clients-grid">
                <StaffOnDutyCard onViewAll={() => handleNavigate('staff-duty')} />
                <TopClientsCard onViewAll={() => handleNavigate('top-clients')} />
            </div>
        </div>
    );
};

export default Dashboard;
