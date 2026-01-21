import { useState, useMemo } from 'react';
import { Icon } from '../../common';
import {
    operationsData,
    projectsData,
    materialsData,
    staffData,
    productsData,
    clientsData,
    suppliersData,
    operationStages
} from '../../../data/initialData';

/**
 * Reports Module
 * Interconnected analytics dashboard showing data relationships across all modules
 */
// Generate time series data for charts
const generateTimeSeriesData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();

    // Simulated time series data
    const operationsOverTime = months.slice(0, currentMonth + 1).map((month, i) => ({
        month,
        completed: Math.floor(Math.random() * 8) + 2,
        inProgress: Math.floor(Math.random() * 5) + 1,
        pending: Math.floor(Math.random() * 4) + 1
    }));

    const revenueOverTime = months.slice(0, currentMonth + 1).map((month, i) => ({
        month,
        revenue: Math.floor(Math.random() * 150000) + 50000,
        projected: Math.floor(Math.random() * 180000) + 60000
    }));

    const materialsOverTime = months.slice(0, currentMonth + 1).map((month, i) => ({
        month,
        used: Math.floor(Math.random() * 200) + 50,
        purchased: Math.floor(Math.random() * 250) + 80
    }));

    return { operationsOverTime, revenueOverTime, materialsOverTime };
};

const ReportsModule = () => {
    const [activeReport, setActiveReport] = useState('overview');
    const [dateRange, setDateRange] = useState('year');
    const [timeSeriesData] = useState(generateTimeSeriesData);

    // Calculate comprehensive analytics from all data sources
    const analytics = useMemo(() => {
        // Operations Analytics
        const totalOperations = operationsData.length;
        const completedOperations = operationsData.filter(op => op.status === 'Completed').length;
        const inProgressOperations = operationsData.filter(op => op.status === 'In Progress').length;
        const pendingOperations = operationsData.filter(op => op.status === 'Pending').length;
        const avgProgress = Math.round(operationsData.reduce((sum, op) => sum + op.progress, 0) / totalOperations);

        // Hours Analytics
        let totalEstimatedHours = 0;
        let totalActualHours = 0;
        operationsData.forEach(op => {
            Object.values(op.stages).forEach(stage => {
                totalEstimatedHours += stage.estimatedHours || 0;
                totalActualHours += stage.actualHours || 0;
            });
        });
        const hoursEfficiency = totalEstimatedHours > 0
            ? Math.round((totalEstimatedHours / Math.max(totalActualHours, 1)) * 100)
            : 100;

        // Stage Analytics - which stages take longest
        const stageHours = {};
        operationStages.forEach(stage => {
            stageHours[stage.key] = { estimated: 0, actual: 0, count: 0 };
        });
        operationsData.forEach(op => {
            Object.entries(op.stages).forEach(([key, stage]) => {
                if (stage.status !== 'skipped') {
                    stageHours[key].estimated += stage.estimatedHours || 0;
                    stageHours[key].actual += stage.actualHours || 0;
                    if (stage.actualHours > 0) stageHours[key].count++;
                }
            });
        });

        // Project Analytics
        const totalProjects = projectsData.length;
        const activeProjects = projectsData.filter(p => p.status === 'Active').length;
        const totalProjectValue = projectsData.reduce((sum, p) => sum + p.total, 0);
        const avgProjectValue = Math.round(totalProjectValue / totalProjects);

        // Material Analytics
        const totalMaterials = materialsData.length;
        const lowStockMaterials = materialsData.filter(m => m.status === 'Low Stock').length;
        const outOfStockMaterials = materialsData.filter(m => m.status === 'Out of Stock').length;
        const totalMaterialValue = materialsData.reduce((sum, m) => sum + (m.cost * m.stock), 0);

        // Material usage from operations
        const materialUsage = {};
        operationsData.forEach(op => {
            op.materials.forEach(mat => {
                if (!materialUsage[mat.materialId]) {
                    materialUsage[mat.materialId] = {
                        name: mat.materialName,
                        estimated: 0,
                        distributed: 0,
                        unit: mat.unit
                    };
                }
                materialUsage[mat.materialId].estimated += mat.estimated;
                materialUsage[mat.materialId].distributed += mat.distributed;
            });
        });

        // Staff Analytics
        const totalStaff = staffData.length;
        const activeStaff = staffData.filter(s => s.status === 'Active').length;

        // Staff workload from operations
        const staffWorkload = {};
        staffData.forEach(staff => {
            staffWorkload[staff.id] = { name: staff.name, assignedStages: 0, totalHours: 0 };
        });
        operationsData.forEach(op => {
            Object.values(op.stages).forEach(stage => {
                stage.assignedTo.forEach(staffId => {
                    if (staffWorkload[staffId]) {
                        staffWorkload[staffId].assignedStages++;
                        staffWorkload[staffId].totalHours += stage.actualHours || stage.estimatedHours || 0;
                    }
                });
            });
        });

        // Products Analytics
        const totalProducts = productsData.length;
        const activeProducts = productsData.filter(p => p.status === 'Active').length;
        const totalProductValue = productsData.reduce((sum, p) => sum + p.price, 0);
        const avgMargin = Math.round(
            productsData.reduce((sum, p) => sum + ((p.price - p.costPrice) / p.price * 100), 0) / totalProducts
        );

        // Client Analytics
        const totalClients = clientsData.length;
        const activeClients = clientsData.filter(c => c.status === 'Active').length;

        // Supplier Analytics
        const totalSuppliers = suppliersData.length;
        const activeSuppliers = suppliersData.filter(s => s.status === 'Active').length;

        return {
            operations: { total: totalOperations, completed: completedOperations, inProgress: inProgressOperations, pending: pendingOperations, avgProgress },
            hours: { estimated: totalEstimatedHours, actual: totalActualHours, efficiency: hoursEfficiency },
            stageHours,
            projects: { total: totalProjects, active: activeProjects, totalValue: totalProjectValue, avgValue: avgProjectValue },
            materials: { total: totalMaterials, lowStock: lowStockMaterials, outOfStock: outOfStockMaterials, totalValue: totalMaterialValue, usage: materialUsage },
            staff: { total: totalStaff, active: activeStaff, workload: staffWorkload },
            products: { total: totalProducts, active: activeProducts, totalValue: totalProductValue, avgMargin },
            clients: { total: totalClients, active: activeClients },
            suppliers: { total: totalSuppliers, active: activeSuppliers }
        };
    }, []);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(value);
    };

    const reportTabs = [
        { id: 'overview', label: 'Overview', icon: 'dashboard', desc: 'General insights & KPIs', color: 'purple', stat: `${analytics.operations.avgProgress}% Avg Progress` },
        { id: 'operations', label: 'Operations', icon: 'engineering', desc: 'Production tracking', color: 'cyan', stat: `${analytics.operations.inProgress} Active` },
        { id: 'projects', label: 'Projects', icon: 'assignment', desc: 'Revenue & status', color: 'green', stat: formatCurrency(analytics.projects.totalValue) },
        { id: 'materials', label: 'Materials', icon: 'inventory_2', desc: 'Stock & inventory', color: 'orange', stat: `${analytics.materials.lowStock} Low Stock` },
        { id: 'staff', label: 'Staff', icon: 'badge', desc: 'Workload & assignments', color: 'blue', stat: `${analytics.staff.active} Active` },
        { id: 'financial', label: 'Financial', icon: 'payments', desc: 'Revenue & margins', color: 'pink', stat: `${analytics.products.avgMargin}% Margin` }
    ];

    // Overview Report
    const renderOverview = () => (
        <div className="report-section">
            <div className="report-grid-4">
                <div className="report-card primary">
                    <div className="report-card-icon">
                        <Icon name="engineering" />
                    </div>
                    <div className="report-card-content">
                        <div className="report-card-value">{analytics.operations.total}</div>
                        <div className="report-card-label">Total Operations</div>
                        <div className="report-card-meta">
                            <span className="text-success">{analytics.operations.completed} completed</span>
                            <span className="text-warning">{analytics.operations.inProgress} in progress</span>
                        </div>
                    </div>
                </div>

                <div className="report-card success">
                    <div className="report-card-icon">
                        <Icon name="assignment" />
                    </div>
                    <div className="report-card-content">
                        <div className="report-card-value">{analytics.projects.active}</div>
                        <div className="report-card-label">Active Projects</div>
                        <div className="report-card-meta">
                            {formatCurrency(analytics.projects.totalValue)} total value
                        </div>
                    </div>
                </div>

                <div className="report-card warning">
                    <div className="report-card-icon">
                        <Icon name="inventory_2" />
                    </div>
                    <div className="report-card-content">
                        <div className="report-card-value">{analytics.materials.total}</div>
                        <div className="report-card-label">Materials</div>
                        <div className="report-card-meta">
                            <span className="text-danger">{analytics.materials.lowStock + analytics.materials.outOfStock} need attention</span>
                        </div>
                    </div>
                </div>

                <div className="report-card info">
                    <div className="report-card-icon">
                        <Icon name="badge" />
                    </div>
                    <div className="report-card-content">
                        <div className="report-card-value">{analytics.staff.active}</div>
                        <div className="report-card-label">Active Staff</div>
                        <div className="report-card-meta">
                            of {analytics.staff.total} total
                        </div>
                    </div>
                </div>
            </div>

            <div className="report-grid-2">
                <div className="report-panel">
                    <h3 className="report-panel-title">
                        <Icon name="speed" />
                        Operations Progress
                    </h3>
                    <div className="progress-overview">
                        <div className="progress-item">
                            <div className="progress-label">Average Progress</div>
                            <div className="progress-bar-container">
                                <div className="progress-bar-fill" style={{ width: `${analytics.operations.avgProgress}%` }}></div>
                            </div>
                            <div className="progress-value">{analytics.operations.avgProgress}%</div>
                        </div>
                        <div className="progress-item">
                            <div className="progress-label">Hours Efficiency</div>
                            <div className="progress-bar-container">
                                <div className={`progress-bar-fill ${analytics.hours.efficiency >= 100 ? 'success' : 'warning'}`}
                                     style={{ width: `${Math.min(analytics.hours.efficiency, 100)}%` }}></div>
                            </div>
                            <div className="progress-value">{analytics.hours.efficiency}%</div>
                        </div>
                    </div>
                    <div className="stats-row">
                        <div className="stat-item">
                            <div className="stat-value">{analytics.hours.estimated}h</div>
                            <div className="stat-label">Estimated</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-value">{analytics.hours.actual}h</div>
                            <div className="stat-label">Actual</div>
                        </div>
                        <div className="stat-item">
                            <div className={`stat-value ${analytics.hours.actual <= analytics.hours.estimated ? 'text-success' : 'text-danger'}`}>
                                {analytics.hours.estimated - analytics.hours.actual}h
                            </div>
                            <div className="stat-label">Variance</div>
                        </div>
                    </div>
                </div>

                <div className="report-panel">
                    <h3 className="report-panel-title">
                        <Icon name="hub" />
                        Data Interconnections
                    </h3>
                    <div className="interconnect-grid">
                        <div className="interconnect-item">
                            <div className="interconnect-from">
                                <Icon name="assignment" />
                                <span>{analytics.projects.active} Projects</span>
                            </div>
                            <div className="interconnect-arrow">
                                <Icon name="arrow_forward" />
                            </div>
                            <div className="interconnect-to">
                                <Icon name="engineering" />
                                <span>{analytics.operations.inProgress} Operations</span>
                            </div>
                        </div>
                        <div className="interconnect-item">
                            <div className="interconnect-from">
                                <Icon name="engineering" />
                                <span>{analytics.operations.total} Operations</span>
                            </div>
                            <div className="interconnect-arrow">
                                <Icon name="arrow_forward" />
                            </div>
                            <div className="interconnect-to">
                                <Icon name="inventory_2" />
                                <span>{Object.keys(analytics.materials.usage).length} Materials Used</span>
                            </div>
                        </div>
                        <div className="interconnect-item">
                            <div className="interconnect-from">
                                <Icon name="badge" />
                                <span>{analytics.staff.active} Staff</span>
                            </div>
                            <div className="interconnect-arrow">
                                <Icon name="arrow_forward" />
                            </div>
                            <div className="interconnect-to">
                                <Icon name="construction" />
                                <span>{Object.values(analytics.staff.workload).filter(w => w.assignedStages > 0).length} Assigned</span>
                            </div>
                        </div>
                        <div className="interconnect-item">
                            <div className="interconnect-from">
                                <Icon name="group" />
                                <span>{analytics.clients.active} Clients</span>
                            </div>
                            <div className="interconnect-arrow">
                                <Icon name="arrow_forward" />
                            </div>
                            <div className="interconnect-to">
                                <Icon name="category" />
                                <span>{analytics.products.active} Products</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="report-panel full-width">
                <h3 className="report-panel-title">
                    <Icon name="warning" />
                    Attention Required
                </h3>
                <div className="alerts-grid">
                    {analytics.materials.lowStock > 0 && (
                        <div className="alert-item warning">
                            <Icon name="inventory_2" />
                            <div className="alert-content">
                                <div className="alert-title">{analytics.materials.lowStock} Materials Low Stock</div>
                                <div className="alert-desc">
                                    {materialsData.filter(m => m.status === 'Low Stock').map(m => m.name).join(', ')}
                                </div>
                            </div>
                        </div>
                    )}
                    {analytics.materials.outOfStock > 0 && (
                        <div className="alert-item danger">
                            <Icon name="error" />
                            <div className="alert-content">
                                <div className="alert-title">{analytics.materials.outOfStock} Materials Out of Stock</div>
                                <div className="alert-desc">
                                    {materialsData.filter(m => m.status === 'Out of Stock').map(m => m.name).join(', ')}
                                </div>
                            </div>
                        </div>
                    )}
                    {operationsData.filter(op => op.priority === 'Urgent' || op.priority === 'High').length > 0 && (
                        <div className="alert-item info">
                            <Icon name="priority_high" />
                            <div className="alert-content">
                                <div className="alert-title">
                                    {operationsData.filter(op => op.priority === 'Urgent' || op.priority === 'High').length} High Priority Operations
                                </div>
                                <div className="alert-desc">
                                    {operationsData.filter(op => op.priority === 'Urgent' || op.priority === 'High').map(op => op.workOrderNumber).join(', ')}
                                </div>
                            </div>
                        </div>
                    )}
                    {projectsData.filter(p => p.status === 'On Hold').length > 0 && (
                        <div className="alert-item warning">
                            <Icon name="pause_circle" />
                            <div className="alert-content">
                                <div className="alert-title">{projectsData.filter(p => p.status === 'On Hold').length} Projects On Hold</div>
                                <div className="alert-desc">
                                    {projectsData.filter(p => p.status === 'On Hold').map(p => p.name).join(', ')}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Time-Based Charts */}
            <div className="report-grid-2">
                <div className="report-panel">
                    <h3 className="report-panel-title">
                        <Icon name="show_chart" />
                        Operations Over Time
                    </h3>
                    <div className="time-chart">
                        <div className="chart-legend">
                            <span className="legend-item completed"><span className="legend-dot"></span> Completed</span>
                            <span className="legend-item in-progress"><span className="legend-dot"></span> In Progress</span>
                            <span className="legend-item pending"><span className="legend-dot"></span> Pending</span>
                        </div>
                        <div className="line-chart-container">
                            {timeSeriesData.operationsOverTime.map((data, i) => {
                                const maxOps = Math.max(...timeSeriesData.operationsOverTime.map(d => d.completed + d.inProgress + d.pending));
                                const totalHeight = ((data.completed + data.inProgress + data.pending) / maxOps) * 100;
                                return (
                                    <div key={i} className="chart-column">
                                        <div className="stacked-bar" style={{ height: `${totalHeight}%` }}>
                                            <div className="bar-segment completed" style={{ height: `${(data.completed / (data.completed + data.inProgress + data.pending)) * 100}%` }}></div>
                                            <div className="bar-segment in-progress" style={{ height: `${(data.inProgress / (data.completed + data.inProgress + data.pending)) * 100}%` }}></div>
                                            <div className="bar-segment pending" style={{ height: `${(data.pending / (data.completed + data.inProgress + data.pending)) * 100}%` }}></div>
                                        </div>
                                        <span className="chart-label">{data.month}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="report-panel">
                    <h3 className="report-panel-title">
                        <Icon name="trending_up" />
                        Revenue Trend
                    </h3>
                    <div className="time-chart">
                        <div className="chart-legend">
                            <span className="legend-item revenue"><span className="legend-dot"></span> Revenue</span>
                            <span className="legend-item projected"><span className="legend-dot"></span> Projected</span>
                        </div>
                        <div className="area-chart-container">
                            <svg viewBox="0 0 400 150" preserveAspectRatio="none">
                                {/* Projected area */}
                                <path
                                    d={`M 0 150 ${timeSeriesData.revenueOverTime.map((d, i) => {
                                        const x = (i / (timeSeriesData.revenueOverTime.length - 1)) * 400;
                                        const maxRev = Math.max(...timeSeriesData.revenueOverTime.map(r => Math.max(r.revenue, r.projected)));
                                        const y = 150 - (d.projected / maxRev) * 130;
                                        return `L ${x} ${y}`;
                                    }).join(' ')} L 400 150 Z`}
                                    fill="rgba(139, 92, 246, 0.1)"
                                />
                                {/* Revenue area */}
                                <path
                                    d={`M 0 150 ${timeSeriesData.revenueOverTime.map((d, i) => {
                                        const x = (i / (timeSeriesData.revenueOverTime.length - 1)) * 400;
                                        const maxRev = Math.max(...timeSeriesData.revenueOverTime.map(r => Math.max(r.revenue, r.projected)));
                                        const y = 150 - (d.revenue / maxRev) * 130;
                                        return `L ${x} ${y}`;
                                    }).join(' ')} L 400 150 Z`}
                                    fill="rgba(16, 185, 129, 0.2)"
                                />
                                {/* Projected line */}
                                <path
                                    d={`M ${timeSeriesData.revenueOverTime.map((d, i) => {
                                        const x = (i / (timeSeriesData.revenueOverTime.length - 1)) * 400;
                                        const maxRev = Math.max(...timeSeriesData.revenueOverTime.map(r => Math.max(r.revenue, r.projected)));
                                        const y = 150 - (d.projected / maxRev) * 130;
                                        return `${i === 0 ? '' : 'L'} ${x} ${y}`;
                                    }).join(' ')}`}
                                    fill="none"
                                    stroke="#8b5cf6"
                                    strokeWidth="2"
                                    strokeDasharray="5,5"
                                />
                                {/* Revenue line */}
                                <path
                                    d={`M ${timeSeriesData.revenueOverTime.map((d, i) => {
                                        const x = (i / (timeSeriesData.revenueOverTime.length - 1)) * 400;
                                        const maxRev = Math.max(...timeSeriesData.revenueOverTime.map(r => Math.max(r.revenue, r.projected)));
                                        const y = 150 - (d.revenue / maxRev) * 130;
                                        return `${i === 0 ? '' : 'L'} ${x} ${y}`;
                                    }).join(' ')}`}
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="2"
                                />
                                {/* Data points */}
                                {timeSeriesData.revenueOverTime.map((d, i) => {
                                    const x = (i / (timeSeriesData.revenueOverTime.length - 1)) * 400;
                                    const maxRev = Math.max(...timeSeriesData.revenueOverTime.map(r => Math.max(r.revenue, r.projected)));
                                    const y = 150 - (d.revenue / maxRev) * 130;
                                    return <circle key={i} cx={x} cy={y} r="4" fill="#10b981" />;
                                })}
                            </svg>
                            <div className="chart-x-labels">
                                {timeSeriesData.revenueOverTime.map((d, i) => (
                                    <span key={i}>{d.month}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="report-panel full-width">
                <h3 className="report-panel-title">
                    <Icon name="inventory_2" />
                    Materials Flow Over Time
                </h3>
                <div className="time-chart wide">
                    <div className="chart-legend">
                        <span className="legend-item used"><span className="legend-dot"></span> Materials Used</span>
                        <span className="legend-item purchased"><span className="legend-dot"></span> Materials Purchased</span>
                    </div>
                    <div className="grouped-bar-chart">
                        {timeSeriesData.materialsOverTime.map((data, i) => {
                            const maxVal = Math.max(...timeSeriesData.materialsOverTime.map(d => Math.max(d.used, d.purchased)));
                            return (
                                <div key={i} className="bar-group">
                                    <div className="bar-pair">
                                        <div className="bar used" style={{ height: `${(data.used / maxVal) * 100}%` }}>
                                            <span className="bar-tooltip">{data.used}</span>
                                        </div>
                                        <div className="bar purchased" style={{ height: `${(data.purchased / maxVal) * 100}%` }}>
                                            <span className="bar-tooltip">{data.purchased}</span>
                                        </div>
                                    </div>
                                    <span className="bar-label">{data.month}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );

    // Operations Report
    const renderOperationsReport = () => (
        <div className="report-section">
            <div className="report-grid-3">
                <div className="report-stat-card">
                    <div className="stat-icon pending"><Icon name="pending" /></div>
                    <div className="stat-details">
                        <div className="stat-number">{analytics.operations.pending}</div>
                        <div className="stat-text">Pending</div>
                    </div>
                </div>
                <div className="report-stat-card">
                    <div className="stat-icon in-progress"><Icon name="autorenew" /></div>
                    <div className="stat-details">
                        <div className="stat-number">{analytics.operations.inProgress}</div>
                        <div className="stat-text">In Progress</div>
                    </div>
                </div>
                <div className="report-stat-card">
                    <div className="stat-icon completed"><Icon name="check_circle" /></div>
                    <div className="stat-details">
                        <div className="stat-number">{analytics.operations.completed}</div>
                        <div className="stat-text">Completed</div>
                    </div>
                </div>
            </div>

            <div className="report-panel full-width">
                <h3 className="report-panel-title">
                    <Icon name="timeline" />
                    Stage Performance Analysis
                </h3>
                <div className="stage-performance-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Stage</th>
                                <th>Estimated Hours</th>
                                <th>Actual Hours</th>
                                <th>Variance</th>
                                <th>Efficiency</th>
                                <th>Operations</th>
                            </tr>
                        </thead>
                        <tbody>
                            {operationStages.map(stage => {
                                const data = analytics.stageHours[stage.key];
                                const variance = data.estimated - data.actual;
                                const efficiency = data.estimated > 0 ? Math.round((data.estimated / Math.max(data.actual, 1)) * 100) : 100;
                                return (
                                    <tr key={stage.key}>
                                        <td>
                                            <div className="stage-cell">
                                                <Icon name={stage.icon} />
                                                <span>{stage.label}</span>
                                            </div>
                                        </td>
                                        <td>{data.estimated}h</td>
                                        <td>{data.actual}h</td>
                                        <td className={variance >= 0 ? 'text-success' : 'text-danger'}>
                                            {variance >= 0 ? '+' : ''}{variance}h
                                        </td>
                                        <td>
                                            <div className="efficiency-bar">
                                                <div className={`efficiency-fill ${efficiency >= 100 ? 'good' : efficiency >= 80 ? 'ok' : 'bad'}`}
                                                     style={{ width: `${Math.min(efficiency, 100)}%` }}></div>
                                                <span>{efficiency}%</span>
                                            </div>
                                        </td>
                                        <td>{data.count}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="report-grid-2">
                <div className="report-panel">
                    <h3 className="report-panel-title">
                        <Icon name="list_alt" />
                        Active Operations
                    </h3>
                    <div className="operations-list">
                        {operationsData.filter(op => op.status === 'In Progress').map(op => (
                            <div key={op.id} className="operation-item">
                                <div className="operation-header">
                                    <span className="wo-number">{op.workOrderNumber}</span>
                                    <span className={`priority-badge ${op.priority.toLowerCase()}`}>{op.priority}</span>
                                </div>
                                <div className="operation-project">{op.projectName}</div>
                                <div className="operation-stage">
                                    Current: {operationStages.find(s => s.key === op.currentStage)?.label}
                                </div>
                                <div className="operation-progress">
                                    <div className="progress-bar-mini">
                                        <div className="progress-fill" style={{ width: `${op.progress}%` }}></div>
                                    </div>
                                    <span>{op.progress}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="report-panel">
                    <h3 className="report-panel-title">
                        <Icon name="schedule" />
                        Hours Distribution
                    </h3>
                    <div className="hours-distribution">
                        <div className="hours-chart">
                            {operationStages.slice(0, 6).map(stage => {
                                const data = analytics.stageHours[stage.key];
                                const maxHours = Math.max(...Object.values(analytics.stageHours).map(s => s.actual));
                                const height = maxHours > 0 ? (data.actual / maxHours) * 100 : 0;
                                return (
                                    <div key={stage.key} className="chart-bar-container">
                                        <div className="chart-bar" style={{ height: `${height}%` }}>
                                            <span className="bar-value">{data.actual}h</span>
                                        </div>
                                        <div className="bar-label">{stage.label.split(' ')[0]}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Projects Report
    const renderProjectsReport = () => (
        <div className="report-section">
            <div className="report-grid-4">
                <div className="report-stat-card">
                    <div className="stat-icon total"><Icon name="folder" /></div>
                    <div className="stat-details">
                        <div className="stat-number">{analytics.projects.total}</div>
                        <div className="stat-text">Total Projects</div>
                    </div>
                </div>
                <div className="report-stat-card">
                    <div className="stat-icon active"><Icon name="play_circle" /></div>
                    <div className="stat-details">
                        <div className="stat-number">{analytics.projects.active}</div>
                        <div className="stat-text">Active</div>
                    </div>
                </div>
                <div className="report-stat-card">
                    <div className="stat-icon value"><Icon name="payments" /></div>
                    <div className="stat-details">
                        <div className="stat-number">{formatCurrency(analytics.projects.totalValue)}</div>
                        <div className="stat-text">Total Value</div>
                    </div>
                </div>
                <div className="report-stat-card">
                    <div className="stat-icon avg"><Icon name="trending_up" /></div>
                    <div className="stat-details">
                        <div className="stat-number">{formatCurrency(analytics.projects.avgValue)}</div>
                        <div className="stat-text">Avg per Project</div>
                    </div>
                </div>
            </div>

            <div className="report-panel full-width">
                <h3 className="report-panel-title">
                    <Icon name="table_chart" />
                    Projects with Operations
                </h3>
                <div className="projects-operations-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Project</th>
                                <th>Status</th>
                                <th>Value</th>
                                <th>Operations</th>
                                <th>Progress</th>
                                <th>Materials Used</th>
                            </tr>
                        </thead>
                        <tbody>
                            {projectsData.map(project => {
                                const projectOps = operationsData.filter(op => op.projectId === project.id);
                                const avgProgress = projectOps.length > 0
                                    ? Math.round(projectOps.reduce((sum, op) => sum + op.progress, 0) / projectOps.length)
                                    : 0;
                                const materialsCount = projectOps.reduce((sum, op) => sum + op.materials.length, 0);
                                return (
                                    <tr key={project.id}>
                                        <td>
                                            <div className="project-cell">
                                                <strong>{project.name}</strong>
                                                <span className="project-po">{project.poNumber}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`status-pill ${project.status.toLowerCase().replace(' ', '-')}`}>
                                                {project.status}
                                            </span>
                                        </td>
                                        <td>{formatCurrency(project.total)}</td>
                                        <td>{projectOps.length}</td>
                                        <td>
                                            {projectOps.length > 0 ? (
                                                <div className="progress-cell">
                                                    <div className="progress-bar-mini">
                                                        <div className="progress-fill" style={{ width: `${avgProgress}%` }}></div>
                                                    </div>
                                                    <span>{avgProgress}%</span>
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td>{materialsCount > 0 ? materialsCount : '-'}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    // Materials Report
    const renderMaterialsReport = () => (
        <div className="report-section">
            <div className="report-grid-4">
                <div className="report-stat-card">
                    <div className="stat-icon total"><Icon name="inventory_2" /></div>
                    <div className="stat-details">
                        <div className="stat-number">{analytics.materials.total}</div>
                        <div className="stat-text">Total Materials</div>
                    </div>
                </div>
                <div className="report-stat-card">
                    <div className="stat-icon warning"><Icon name="warning" /></div>
                    <div className="stat-details">
                        <div className="stat-number">{analytics.materials.lowStock}</div>
                        <div className="stat-text">Low Stock</div>
                    </div>
                </div>
                <div className="report-stat-card">
                    <div className="stat-icon danger"><Icon name="error" /></div>
                    <div className="stat-details">
                        <div className="stat-number">{analytics.materials.outOfStock}</div>
                        <div className="stat-text">Out of Stock</div>
                    </div>
                </div>
                <div className="report-stat-card">
                    <div className="stat-icon value"><Icon name="attach_money" /></div>
                    <div className="stat-details">
                        <div className="stat-number">{formatCurrency(analytics.materials.totalValue)}</div>
                        <div className="stat-text">Inventory Value</div>
                    </div>
                </div>
            </div>

            <div className="report-grid-2">
                <div className="report-panel">
                    <h3 className="report-panel-title">
                        <Icon name="local_shipping" />
                        Material Usage in Operations
                    </h3>
                    <div className="material-usage-list">
                        {Object.entries(analytics.materials.usage).map(([id, data]) => {
                            const distributionPercent = data.estimated > 0 ? Math.round((data.distributed / data.estimated) * 100) : 0;
                            return (
                                <div key={id} className="material-usage-item">
                                    <div className="material-info">
                                        <span className="material-name">{data.name}</span>
                                        <span className="material-qty">{data.distributed} / {data.estimated} {data.unit}</span>
                                    </div>
                                    <div className="distribution-bar">
                                        <div className="distribution-fill" style={{ width: `${distributionPercent}%` }}></div>
                                    </div>
                                    <span className={`distribution-percent ${distributionPercent === 100 ? 'complete' : ''}`}>
                                        {distributionPercent}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="report-panel">
                    <h3 className="report-panel-title">
                        <Icon name="storefront" />
                        By Supplier
                    </h3>
                    <div className="supplier-materials-list">
                        {suppliersData.filter(s => s.status === 'Active').map(supplier => {
                            const supplierMaterials = materialsData.filter(m => m.supplier === supplier.name);
                            const totalValue = supplierMaterials.reduce((sum, m) => sum + (m.cost * m.stock), 0);
                            return (
                                <div key={supplier.id} className="supplier-materials-item">
                                    <div className="supplier-info">
                                        <span className="supplier-name">{supplier.name}</span>
                                        <span className="supplier-category">{supplier.category}</span>
                                    </div>
                                    <div className="supplier-stats">
                                        <span>{supplierMaterials.length} materials</span>
                                        <span className="supplier-value">{formatCurrency(totalValue)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="report-panel full-width">
                <h3 className="report-panel-title">
                    <Icon name="inventory" />
                    Stock Status Overview
                </h3>
                <div className="stock-overview-grid">
                    {materialsData.map(material => {
                        const stockPercent = material.maxStock > 0 ? Math.round((material.stock / material.maxStock) * 100) : 0;
                        const isLow = material.stock <= material.minStock;
                        const isOut = material.stock === 0;
                        return (
                            <div key={material.id} className={`stock-item ${isOut ? 'out' : isLow ? 'low' : 'ok'}`}>
                                <div className="stock-name">{material.name}</div>
                                <div className="stock-bar">
                                    <div className="stock-fill" style={{ width: `${stockPercent}%` }}></div>
                                    <div className="stock-min-line" style={{ left: `${(material.minStock / material.maxStock) * 100}%` }}></div>
                                </div>
                                <div className="stock-numbers">
                                    <span>{material.stock} / {material.maxStock}</span>
                                    <span className="stock-unit">{material.unit}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    // Staff Report
    const renderStaffReport = () => (
        <div className="report-section">
            <div className="report-grid-3">
                <div className="report-stat-card">
                    <div className="stat-icon total"><Icon name="groups" /></div>
                    <div className="stat-details">
                        <div className="stat-number">{analytics.staff.total}</div>
                        <div className="stat-text">Total Staff</div>
                    </div>
                </div>
                <div className="report-stat-card">
                    <div className="stat-icon active"><Icon name="person" /></div>
                    <div className="stat-details">
                        <div className="stat-number">{analytics.staff.active}</div>
                        <div className="stat-text">Active</div>
                    </div>
                </div>
                <div className="report-stat-card">
                    <div className="stat-icon assigned"><Icon name="engineering" /></div>
                    <div className="stat-details">
                        <div className="stat-number">
                            {Object.values(analytics.staff.workload).filter(w => w.assignedStages > 0).length}
                        </div>
                        <div className="stat-text">Assigned to Operations</div>
                    </div>
                </div>
            </div>

            <div className="report-panel full-width">
                <h3 className="report-panel-title">
                    <Icon name="work" />
                    Staff Workload
                </h3>
                <div className="staff-workload-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Staff Member</th>
                                <th>Department</th>
                                <th>Position</th>
                                <th>Assigned Stages</th>
                                <th>Total Hours</th>
                                <th>Workload</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staffData.filter(s => s.status === 'Active').map(staff => {
                                const workload = analytics.staff.workload[staff.id];
                                const maxWorkload = Math.max(...Object.values(analytics.staff.workload).map(w => w.totalHours));
                                const workloadPercent = maxWorkload > 0 ? Math.round((workload.totalHours / maxWorkload) * 100) : 0;
                                return (
                                    <tr key={staff.id}>
                                        <td>
                                            <div className="staff-cell">
                                                <div className="staff-avatar">{staff.name.split(' ').map(n => n[0]).join('')}</div>
                                                <span>{staff.name}</span>
                                            </div>
                                        </td>
                                        <td>{staff.department}</td>
                                        <td>{staff.position}</td>
                                        <td>{workload.assignedStages}</td>
                                        <td>{workload.totalHours}h</td>
                                        <td>
                                            <div className="workload-bar">
                                                <div className={`workload-fill ${workloadPercent > 80 ? 'high' : workloadPercent > 50 ? 'medium' : 'low'}`}
                                                     style={{ width: `${workloadPercent}%` }}></div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="report-grid-2">
                <div className="report-panel">
                    <h3 className="report-panel-title">
                        <Icon name="domain" />
                        By Department
                    </h3>
                    <div className="department-breakdown">
                        {['Production', 'Design', 'Quality', 'Warehouse', 'Sales', 'Administration', 'Accounting'].map(dept => {
                            const deptStaff = staffData.filter(s => s.department === dept);
                            const activeCount = deptStaff.filter(s => s.status === 'Active').length;
                            return deptStaff.length > 0 ? (
                                <div key={dept} className="department-item">
                                    <div className="dept-name">{dept}</div>
                                    <div className="dept-count">
                                        <span className="active">{activeCount}</span>
                                        <span className="separator">/</span>
                                        <span className="total">{deptStaff.length}</span>
                                    </div>
                                </div>
                            ) : null;
                        })}
                    </div>
                </div>

                <div className="report-panel">
                    <h3 className="report-panel-title">
                        <Icon name="leaderboard" />
                        Top Contributors
                    </h3>
                    <div className="top-contributors">
                        {Object.entries(analytics.staff.workload)
                            .filter(([_, data]) => data.totalHours > 0)
                            .sort((a, b) => b[1].totalHours - a[1].totalHours)
                            .slice(0, 5)
                            .map(([id, data], index) => (
                                <div key={id} className="contributor-item">
                                    <div className="contributor-rank">{index + 1}</div>
                                    <div className="contributor-info">
                                        <span className="contributor-name">{data.name}</span>
                                        <span className="contributor-stages">{data.assignedStages} stages</span>
                                    </div>
                                    <div className="contributor-hours">{data.totalHours}h</div>
                                </div>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    );

    // Financial Report
    const renderFinancialReport = () => {
        const totalRevenue = projectsData.reduce((sum, p) => sum + p.total, 0);
        const totalCost = productsData.reduce((sum, p) => sum + p.costPrice, 0);
        const inventoryValue = materialsData.reduce((sum, m) => sum + (m.cost * m.stock), 0);

        return (
            <div className="report-section">
                <div className="report-grid-4">
                    <div className="report-stat-card">
                        <div className="stat-icon revenue"><Icon name="trending_up" /></div>
                        <div className="stat-details">
                            <div className="stat-number">{formatCurrency(totalRevenue)}</div>
                            <div className="stat-text">Total Revenue</div>
                        </div>
                    </div>
                    <div className="report-stat-card">
                        <div className="stat-icon inventory"><Icon name="inventory_2" /></div>
                        <div className="stat-details">
                            <div className="stat-number">{formatCurrency(inventoryValue)}</div>
                            <div className="stat-text">Inventory Value</div>
                        </div>
                    </div>
                    <div className="report-stat-card">
                        <div className="stat-icon products"><Icon name="category" /></div>
                        <div className="stat-details">
                            <div className="stat-number">{formatCurrency(analytics.products.totalValue)}</div>
                            <div className="stat-text">Products Value</div>
                        </div>
                    </div>
                    <div className="report-stat-card">
                        <div className="stat-icon margin"><Icon name="percent" /></div>
                        <div className="stat-details">
                            <div className="stat-number">{analytics.products.avgMargin}%</div>
                            <div className="stat-text">Avg Margin</div>
                        </div>
                    </div>
                </div>

                <div className="report-grid-2">
                    <div className="report-panel">
                        <h3 className="report-panel-title">
                            <Icon name="receipt_long" />
                            Project Revenue
                        </h3>
                        <div className="revenue-list">
                            {projectsData.map(project => (
                                <div key={project.id} className="revenue-item">
                                    <div className="revenue-project">
                                        <span className="project-name">{project.name}</span>
                                        <span className={`project-status ${project.status.toLowerCase().replace(' ', '-')}`}>
                                            {project.status}
                                        </span>
                                    </div>
                                    <div className="revenue-breakdown">
                                        <div className="revenue-row">
                                            <span>Subtotal</span>
                                            <span>{formatCurrency(project.subtotal)}</span>
                                        </div>
                                        <div className="revenue-row">
                                            <span>Tax</span>
                                            <span>{formatCurrency(project.tax)}</span>
                                        </div>
                                        <div className="revenue-row total">
                                            <span>Total</span>
                                            <span>{formatCurrency(project.total)}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="report-panel">
                        <h3 className="report-panel-title">
                            <Icon name="category" />
                            Product Margins
                        </h3>
                        <div className="product-margins-list">
                            {productsData.filter(p => p.status === 'Active').map(product => {
                                const margin = Math.round(((product.price - product.costPrice) / product.price) * 100);
                                return (
                                    <div key={product.id} className="margin-item">
                                        <div className="product-info">
                                            <span className="product-name">{product.name}</span>
                                            <div className="product-prices">
                                                <span className="cost">Cost: {formatCurrency(product.costPrice)}</span>
                                                <span className="price">Price: {formatCurrency(product.price)}</span>
                                            </div>
                                        </div>
                                        <div className={`margin-badge ${margin >= 40 ? 'high' : margin >= 25 ? 'medium' : 'low'}`}>
                                            {margin}%
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="report-panel full-width">
                    <h3 className="report-panel-title">
                        <Icon name="summarize" />
                        Financial Summary
                    </h3>
                    <div className="financial-summary">
                        <div className="summary-section">
                            <h4>Revenue Sources</h4>
                            <div className="summary-items">
                                <div className="summary-item">
                                    <span>Active Projects ({projectsData.filter(p => p.status === 'Active').length})</span>
                                    <span>{formatCurrency(projectsData.filter(p => p.status === 'Active').reduce((s, p) => s + p.total, 0))}</span>
                                </div>
                                <div className="summary-item">
                                    <span>Completed Projects ({projectsData.filter(p => p.status === 'Completed').length})</span>
                                    <span>{formatCurrency(projectsData.filter(p => p.status === 'Completed').reduce((s, p) => s + p.total, 0))}</span>
                                </div>
                                <div className="summary-item">
                                    <span>On Hold ({projectsData.filter(p => p.status === 'On Hold').length})</span>
                                    <span>{formatCurrency(projectsData.filter(p => p.status === 'On Hold').reduce((s, p) => s + p.total, 0))}</span>
                                </div>
                            </div>
                        </div>
                        <div className="summary-section">
                            <h4>Assets</h4>
                            <div className="summary-items">
                                <div className="summary-item">
                                    <span>Material Inventory ({analytics.materials.total} items)</span>
                                    <span>{formatCurrency(inventoryValue)}</span>
                                </div>
                                <div className="summary-item">
                                    <span>Active Clients</span>
                                    <span>{analytics.clients.active}</span>
                                </div>
                                <div className="summary-item">
                                    <span>Active Suppliers</span>
                                    <span>{analytics.suppliers.active}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderActiveReport = () => {
        switch (activeReport) {
            case 'overview':
                return renderOverview();
            case 'operations':
                return renderOperationsReport();
            case 'projects':
                return renderProjectsReport();
            case 'materials':
                return renderMaterialsReport();
            case 'staff':
                return renderStaffReport();
            case 'financial':
                return renderFinancialReport();
            default:
                return renderOverview();
        }
    };

    return (
        <div className="module-page reports-page">
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">analytics</span>
                    </div>
                    <div className="header-text">
                        <h1>Reports</h1>
                        <p>Interconnected analytics and insights across all modules</p>
                    </div>
                </div>
                <div className="header-actions">
                    <div className="date-range-selector">
                        <Icon name="calendar_month" />
                        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
                            <option value="week">Last 7 Days</option>
                            <option value="month">This Month</option>
                            <option value="quarter">This Quarter</option>
                            <option value="year">This Year</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                    <button className="btn-secondary">
                        <span className="material-symbols-rounded">print</span>
                        Print
                    </button>
                    <button className="btn-secondary">
                        <span className="material-symbols-rounded">download</span>
                        Export
                    </button>
                </div>
            </div>

            <div className="report-tabs-grid">
                {reportTabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`report-tab-card ${activeReport === tab.id ? 'active' : ''} ${tab.color}`}
                        onClick={() => setActiveReport(tab.id)}
                    >
                        <div className="report-tab-top">
                            <div className={`report-tab-icon ${tab.color}`}>
                                <Icon name={tab.icon} />
                            </div>
                            <div className={`report-tab-arrow ${tab.color}`}>
                                <Icon name="arrow_forward" />
                            </div>
                        </div>
                        <div className="report-tab-content">
                            <span className="report-tab-label">{tab.label}</span>
                            <span className="report-tab-desc">{tab.desc}</span>
                        </div>
                        <div className="report-tab-stat">{tab.stat}</div>
                    </button>
                ))}
            </div>

            <div className="report-content">
                {renderActiveReport()}
            </div>
        </div>
    );
};

export default ReportsModule;
