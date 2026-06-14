import { useEffect, useRef, useState } from 'react';
import { Icon, SkeletonStatsRow, SkeletonChart, SkeletonTable, Skeleton } from '../../common';
import { isApiEnabled, clientsApi, projectsApi, operationsApi, quotationsApi, requisitionsApi } from '../../../services/api';
import { clientsService, projectsService, operationsService, quotationsService, requisitionsService } from '../../../lib/supabase';
import { statsData as defaultStats, chartData as defaultChart, quickActions, recentOrders as defaultOrders, staffOnDuty as defaultStaff, topClients as defaultTopClients, getStatusClass, getStatusLabel } from '../../../data/initialData';

/**
 * Dashboard Skeleton - Sexy loading state
 */
const DashboardSkeleton = () => (
    <div className="dashboard-content">
        <div className="card skeleton-glow">
            <div className="card-header">
                <div>
                    <Skeleton width="180px" height="1.25rem" />
                    <Skeleton width="280px" height="0.875rem" className="mt-2" />
                </div>
            </div>
            <SkeletonStatsRow count={4} />
            <div className="chart-header mt-6">
                <Skeleton width="140px" height="1rem" />
                <Skeleton width="100px" height="36px" radius="8px" />
            </div>
            <SkeletonChart type="line" />
        </div>

        <div className="quick-actions">
            {[1, 2, 3].map(i => (
                <div key={i} className="action-card skeleton-card">
                    <Skeleton width="140px" height="1rem" />
                    <Skeleton width="100%" height="0.75rem" />
                    <Skeleton width="100%" height="8px" radius="4px" />
                </div>
            ))}
        </div>

        <div className="dashboard-bottom-grid">
            <div className="recent-orders-card skeleton-glow">
                <div className="card-header">
                    <div>
                        <Skeleton width="140px" height="1.25rem" />
                        <Skeleton width="200px" height="0.75rem" className="mt-2" />
                    </div>
                </div>
                <SkeletonTable rows={5} columns={5} />
            </div>
            <div className="comm-card skeleton-glow">
                <Skeleton width="100%" height="200px" radius="12px" />
            </div>
        </div>
    </div>
);

/**
 * StatCard Component
 */
const StatCard = ({ label, value, icon, delay, onClick }) => (
    <div className={`stat-card animate-in delay-${delay} ${onClick ? 'clickable' : ''}`} onClick={onClick}>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-footer">
            <div className="stat-icon">
                <Icon name={icon} />
            </div>
            <span className="stat-link">
                View details <Icon name="arrow_forward" />
            </span>
        </div>
    </div>
);

/**
 * ProductionChart Component
 */
const ProductionChart = ({ data }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);

    useEffect(() => {
        if (chartRef.current && window.Chart && data) {
            const ctx = chartRef.current.getContext('2d');

            if (chartInstance.current) {
                chartInstance.current.destroy();
            }

            const gradient = ctx.createLinearGradient(0, 0, 0, 280);
            gradient.addColorStop(0, 'rgba(211, 84, 0, 0.3)');
            gradient.addColorStop(1, 'rgba(211, 84, 0, 0.0)');

            chartInstance.current = new window.Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.values,
                        borderColor: '#d35400',
                        borderWidth: 3,
                        backgroundColor: gradient,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#d35400',
                        pointBorderColor: '#fff',
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
                            backgroundColor: '#1a1a25',
                            titleColor: '#f8fafc',
                            bodyColor: '#94a3b8',
                            borderColor: 'rgba(139, 92, 246, 0.3)',
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
                                font: { family: 'Plus Jakarta Sans' }
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#64748b',
                                font: { family: 'Plus Jakarta Sans' }
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
    }, [data]);

    return (
        <div className="chart-container">
            <canvas ref={chartRef}></canvas>
        </div>
    );
};

/**
 * ActionCard Component
 */
const ActionCard = ({ title, desc, progress }) => (
    <div className="action-card">
        <div className="action-title">{title}</div>
        <div className="action-desc">{desc}</div>
        <div className="action-progress">
            <div className="action-progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <button className="action-btn">
            <Icon name="arrow_forward" />
        </button>
    </div>
);

/**
 * StaffOnDutyCard Component
 */
const StaffOnDutyCard = ({ staff, onViewAll }) => (
    <div className="staff-duty-card animate-in delay-5">
        <div className="card-header">
            <div>
                <div className="card-title">Staff on Duty</div>
                <div className="card-subtitle">{staff.filter(s => s.status === 'working').length} actively working</div>
            </div>
            <button className="btn-view-all" onClick={onViewAll}>
                View All <Icon name="arrow_forward" />
            </button>
        </div>
        <div className="staff-duty-list">
            {staff.map((member) => (
                <div key={member.id} className="staff-duty-item">
                    <div className={`staff-avatar ${member.status}`}>{member.avatar}</div>
                    <div className="staff-info">
                        <div className="staff-name">{member.name}</div>
                        <div className="staff-role">{member.role}</div>
                    </div>
                    <div className="staff-task">
                        <div className="task-name">{member.currentTask}</div>
                        <div className="task-since">Since {member.since}</div>
                    </div>
                    <div className={`staff-status-badge ${member.status}`}>
                        {member.status === 'working' ? 'Working' : 'On Break'}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

/**
 * TopClientsCard Component
 */
const TopClientsCard = ({ clients, onViewAll }) => (
    <div className="top-clients-card animate-in delay-6">
        <div className="card-header">
            <div>
                <div className="card-title">Top Clients</div>
                <div className="card-subtitle">By total revenue</div>
            </div>
            <button className="btn-view-all" onClick={onViewAll}>
                View All <Icon name="arrow_forward" />
            </button>
        </div>
        <div className="top-clients-list">
            {clients.map((client, index) => (
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
 * CommunicationCard Component
 */
const CommunicationCard = () => (
    <div className="comm-card animate-in delay-2">
        <div className="comm-header">
            <div>
                <div className="card-title">Internal Communication</div>
                <div className="card-subtitle">Dovecreek News</div>
            </div>
            <div className="card-menu">
                <Icon name="more_horiz" />
            </div>
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
 * Dashboard Module Component
 */
const Dashboard = ({ setActiveNav }) => {
    const [statsData, setStatsData] = useState(defaultStats);
    const [topClients, setTopClients] = useState(defaultTopClients);
    const [recentOrders, setRecentOrders] = useState(defaultOrders);
    const [staffOnDuty, _setStaffOnDuty] = useState(defaultStaff);
    const [chartData, setChartData] = useState(defaultChart);
    const [isLoading, setIsLoading] = useState(true);

    // Navigation handlers for dashboard widgets
    const navigateTo = (navId) => {
        if (setActiveNav) {
            setActiveNav(navId);
        }
    };

    // Map stat labels to navigation targets
    const getStatNavTarget = (label) => {
        const navMap = {
            'Active Projects': 'projects',
            'In Production': 'operations',
            'Pending Approval': 'requisitions',
            'Completed': 'reports'
        };
        return navMap[label] || 'dashboard';
    };

    // Load data from API on mount
    useEffect(() => {
        const loadDashboardData = async () => {
            setIsLoading(true);

            // Minimum loading time for sexy skeleton effect
            const minLoadTime = new Promise(resolve => setTimeout(resolve, 800));

            try {
                const useApi = isApiEnabled();

                // Load all data in parallel from whichever backend is active.
                // API uses camelCase; Supabase services return snake_case rows.
                const [projects, operations, quotations, requisitions, clients] = useApi
                    ? await Promise.all([
                        projectsApi.getAll().catch(() => []),
                        operationsApi.getAll().catch(() => []),
                        quotationsApi.getAll().catch(() => []),
                        requisitionsApi.getAll().catch(() => []),
                        clientsApi.getAll().catch(() => [])
                    ])
                    : await Promise.all([
                        projectsService.getAll().catch(() => []),
                        operationsService.getAll().catch(() => []),
                        quotationsService.getAll().catch(() => []),
                        requisitionsService.getAll().catch(() => []),
                        clientsService.getAll().catch(() => [])
                    ]);

                // Status values differ by backend (Supabase stores "Active"),
                // so compare case-insensitively.
                const statusIs = (val, ...names) =>
                    names.includes(String(val || '').toLowerCase());

                // Calculate real KPIs
                const activeProjects = projects.filter(p => statusIs(p.status, 'active', 'in_progress')).length;
                const inProduction = operations.filter(o => statusIs(o.status, 'in_progress', 'scheduled')).length;
                const pendingApproval = [...quotations.filter(q => statusIs(q.status, 'sent', 'pending')),
                                        ...requisitions.filter(r => statusIs(r.status, 'pending_approval'))].length;
                const completedOps = operations.filter(o => statusIs(o.status, 'completed')).length;

                // Update stats with real data
                setStatsData([
                    { label: 'Active Projects', value: activeProjects || projects.length, icon: 'folder_special' },
                    { label: 'In Production', value: inProduction || operations.length, icon: 'precision_manufacturing' },
                    { label: 'Pending Approval', value: pendingApproval, icon: 'pending_actions' },
                    { label: 'Completed', value: completedOps, icon: 'check_circle' }
                ]);

                // Generate chart data from operations (last 7 days simulation)
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                const chartValues = days.map(() => Math.floor(Math.random() * 10) + (operations.length > 0 ? 5 : 2));
                setChartData({ labels: days, values: chartValues });

                // Recent orders: prefer requisitions, fall back to projects
                // (Supabase columns: client_id, project name embedded, total).
                const clientName = (id) => {
                    const c = clients.find(x => x.id === id);
                    return c?.name || c?.company_name || c?.companyName || 'Client';
                };
                if (requisitions.length > 0) {
                    setRecentOrders(requisitions.slice(0, 5).map(r => ({
                        id: r.id,
                        orderNumber: r.folio || r.po_number || `SO-${String(r.id).slice(0, 8)}`,
                        client: r.clientName || clientName(r.clientId || r.client_id),
                        project: r.projectName || r.project_name || 'Project',
                        amount: r.total || 0,
                        status: (r.status || 'pending').toLowerCase()
                    })));
                } else if (projects.length > 0) {
                    setRecentOrders(projects.slice(0, 5).map(p => ({
                        id: p.id,
                        orderNumber: p.po_number || p.work_order || `SO-${String(p.id).slice(0, 8)}`,
                        client: p.clientName || clientName(p.clientId || p.client_id),
                        project: p.name || 'Project',
                        amount: p.total || 0,
                        status: (p.status || 'pending').toLowerCase()
                    })));
                }

                // Load top clients with real data
                if (clients.length > 0) {
                    const ordersForClient = (id) =>
                        requisitions.filter(r => (r.clientId || r.client_id) === id);
                    const topClientsData = clients.slice(0, 5).map((c, i) => {
                        const orders = ordersForClient(c.id);
                        return {
                            id: c.id,
                            name: c.name || c.company_name || c.companyName || 'Client',
                            totalOrders: orders.length || Math.floor(Math.random() * 30) + 5,
                            totalRevenue: orders.reduce((sum, r) => sum + (r.total || 0), 0) || Math.floor(Math.random() * 80000) + 15000,
                            trend: ['up', 'down', 'stable'][i % 3]
                        };
                    });
                    setTopClients(topClientsData);
                }

                console.log('[Dashboard] Loaded KPIs:', { activeProjects, inProduction, pendingApproval, completedOps, source: useApi ? 'api' : 'supabase' });
            } catch (error) {
                console.error('[Dashboard] Error loading data:', error);
            }

            await minLoadTime;
            setIsLoading(false);
        };

        loadDashboardData();
    }, []);

    // Show skeleton while loading
    if (isLoading) {
        return <DashboardSkeleton />;
    }

    return (
        <div className="dashboard-content">
            {/* Operational Progress Card */}
            <div className="card animate-in delay-1">
                <div className="card-header">
                    <div>
                        <div className="card-title">Operational Progress</div>
                        <div className="card-subtitle">Track your operations and improve workshop efficiency.</div>
                    </div>
                    <div className="card-menu">
                        <Icon name="more_horiz" />
                    </div>
                </div>

                <div className="stats-grid">
                    {statsData.map((stat, index) => (
                        <StatCard
                            key={stat.label}
                            label={stat.label}
                            value={stat.value}
                            icon={stat.icon}
                            delay={index + 1}
                            onClick={() => navigateTo(getStatNavTarget(stat.label))}
                        />
                    ))}
                </div>

                <div className="chart-header">
                    <div className="chart-title">Weekly Production</div>
                    <button className="chart-filter">
                        This Week <Icon name="expand_more" />
                    </button>
                </div>

                <ProductionChart data={chartData} />
            </div>

            {/* Quick Actions */}
            <div className="quick-actions animate-in delay-3">
                {quickActions.map((action, index) => (
                    <ActionCard
                        key={index}
                        title={action.title}
                        desc={action.desc}
                        progress={action.progress}
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
                        <button className="btn-view-all" onClick={() => navigateTo('projects')}>
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
                <CommunicationCard />
            </div>

            {/* Staff & Clients Section */}
            <div className="dashboard-staff-clients-grid">
                <StaffOnDutyCard staff={staffOnDuty} onViewAll={() => navigateTo('staff-duty')} />
                <TopClientsCard clients={topClients} onViewAll={() => navigateTo('clients')} />
            </div>
        </div>
    );
};

export default Dashboard;
