import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../common';
import { isApiEnabled, reportsApi, clientsApi } from '../../../services/api';
import { statsData as defaultStats, chartData as defaultChart, quickActions, recentOrders as defaultOrders, staffOnDuty as defaultStaff, topClients as defaultTopClients, getStatusClass, getStatusLabel } from '../../../data/initialData';

/**
 * StatCard Component
 */
const StatCard = ({ label, value, icon, delay }) => (
    <div className={`stat-card animate-in delay-${delay}`}>
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
const StaffOnDutyCard = ({ staff }) => (
    <div className="staff-duty-card animate-in delay-5">
        <div className="card-header">
            <div>
                <div className="card-title">Staff on Duty</div>
                <div className="card-subtitle">{staff.filter(s => s.status === 'working').length} actively working</div>
            </div>
            <button className="btn-view-all">
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
const TopClientsCard = ({ clients }) => (
    <div className="top-clients-card animate-in delay-6">
        <div className="card-header">
            <div>
                <div className="card-title">Top Clients</div>
                <div className="card-subtitle">By total revenue</div>
            </div>
            <button className="btn-view-all">
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
const Dashboard = () => {
    const [statsData, _setStatsData] = useState(defaultStats);
    const [topClients, setTopClients] = useState(defaultTopClients);
    const [recentOrders, _setRecentOrders] = useState(defaultOrders);
    const [staffOnDuty, _setStaffOnDuty] = useState(defaultStaff);
    const [chartData, _setChartData] = useState(defaultChart);
    const [_isLoading, setIsLoading] = useState(false);

    // Load data from API on mount
    useEffect(() => {
        const loadDashboardData = async () => {
            if (!isApiEnabled()) return;

            setIsLoading(true);
            try {
                // Try to load KPIs from reports API
                const kpis = await reportsApi.getDashboardKPIs().catch(() => null);
                if (kpis) {
                    console.log('[Dashboard] Loaded KPIs from API');
                    // Transform KPIs to statsData format if needed
                }

                // Load top clients
                const clients = await clientsApi.getAll().catch(() => []);
                if (clients?.length > 0) {
                    const topClientsData = clients.slice(0, 5).map((c, i) => ({
                        id: c.id,
                        name: c.name || c.companyName,
                        totalOrders: c.totalOrders || Math.floor(Math.random() * 50) + 10,
                        totalRevenue: c.totalRevenue || Math.floor(Math.random() * 100000) + 20000,
                        trend: ['up', 'down', 'stable'][i % 3]
                    }));
                    setTopClients(topClientsData);
                }
            } catch (error) {
                console.error('[Dashboard] Error loading data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, []);

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
                        <button className="btn-view-all">
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
                <StaffOnDutyCard staff={staffOnDuty} />
                <TopClientsCard clients={topClients} />
            </div>
        </div>
    );
};

export default Dashboard;
