import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../common';
import { statsData, chartData, quickActions, recentOrders, staffOnDuty, topClients, getStatusClass, getStatusLabel } from '../../../data/initialData';
import { clientsApi, suppliersApi, materialsApi, productsApi, isApiEnabled } from '../../../services/api';

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
const StaffOnDutyCard = () => (
    <div className="staff-duty-card animate-in delay-5">
        <div className="card-header">
            <div>
                <div className="card-title">Staff on Duty</div>
                <div className="card-subtitle">{staffOnDuty.filter(s => s.status === 'working').length} actively working</div>
            </div>
            <button className="btn-secondary">
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
const TopClientsCard = () => (
    <div className="top-clients-card animate-in delay-6">
        <div className="card-header">
            <div>
                <div className="card-title">Top Clients</div>
                <div className="card-subtitle">By total revenue</div>
            </div>
            <button className="btn-secondary">
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
        { key: 'clients', label: 'Clientes', icon: 'people', api: clientsApi },
        { key: 'suppliers', label: 'Proveedores', icon: 'local_shipping', api: suppliersApi },
        { key: 'materials', label: 'Materiales', icon: 'inventory_2', api: materialsApi },
        { key: 'products', label: 'Productos', icon: 'category', api: productsApi },
    ];

    const testModule = async (moduleKey, api) => {
        setLoading(prev => ({ ...prev, [moduleKey]: true }));
        setResults(prev => ({ ...prev, [moduleKey]: null }));

        try {
            console.log(`[Test] Probando ${moduleKey}...`);
            const data = await api.getAll();
            console.log(`[Test] ${moduleKey} obtenidos:`, data);

            setResults(prev => ({
                ...prev,
                [moduleKey]: {
                    success: true,
                    count: Array.isArray(data) ? data.length : 0,
                    data: data
                }
            }));
        } catch (error) {
            console.error(`[Test] Error en ${moduleKey}:`, error);
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
        padding: '10px 16px',
        backgroundColor: isLoading ? '#4b5563' : '#8b5cf6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        fontSize: '13px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        minWidth: '140px',
        justifyContent: 'center'
    });

    const getResultStyle = (result) => ({
        marginTop: '8px',
        padding: '10px 12px',
        borderRadius: '6px',
        backgroundColor: result?.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${result?.success ? '#10b981' : '#ef4444'}`,
        fontSize: '13px'
    });

    return (
        <div className="card animate-in delay-1" style={{ marginBottom: '20px' }}>
            <div className="card-header">
                <div>
                    <div className="card-title">
                        <Icon name="lan" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                        Prueba de Conexión API
                    </div>
                    <div className="card-subtitle">
                        API habilitada: {isApiEnabled() ? 'Sí' : 'No'} | Prueba cada módulo individualmente
                    </div>
                </div>
            </div>
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {modules.map(({ key, label, icon, api }) => (
                        <div key={key} style={{
                            padding: '16px',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <button
                                onClick={() => testModule(key, api)}
                                disabled={loading[key]}
                                style={buttonStyle(loading[key])}
                            >
                                <Icon name={loading[key] ? 'sync' : icon} style={{
                                    fontSize: '18px',
                                    animation: loading[key] ? 'spin 1s linear infinite' : 'none'
                                }} />
                                {loading[key] ? 'Probando...' : label}
                            </button>

                            {results[key] && (
                                <div style={getResultStyle(results[key])}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        color: results[key].success ? '#10b981' : '#ef4444',
                                        fontWeight: '600'
                                    }}>
                                        <Icon name={results[key].success ? 'check_circle' : 'error'} style={{ fontSize: '16px' }} />
                                        {results[key].success ? 'Éxito' : 'Error'}
                                    </div>
                                    {results[key].success ? (
                                        <p style={{ margin: '6px 0 0', color: '#94a3b8' }}>
                                            Registros: <strong style={{ color: '#f8fafc' }}>{results[key].count}</strong>
                                        </p>
                                    ) : (
                                        <p style={{ margin: '6px 0 0', color: '#f87171', fontSize: '12px' }}>
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
    return (
        <div className="dashboard-content">
            {/* API Connection Test */}
            <ConnectionTestCard />

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
                        <button className="btn-secondary">
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
                <StaffOnDutyCard />
                <TopClientsCard />
            </div>
        </div>
    );
};

export default Dashboard;
