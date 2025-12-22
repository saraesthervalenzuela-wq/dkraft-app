import { useState } from 'react';
import { Icon, SearchBox } from '../../common';

const initialActivityData = [
    { id: 1, action: 'create', module: 'Product', entityId: 'PRD-001', entityName: 'Oak Cabinet Door', user: 'Carlos Admin', userId: 'admin_user', timestamp: '2025-12-22T17:05:00', changes: { name: 'Oak Cabinet Door', price: 1500 } },
    { id: 2, action: 'create', module: 'Project', entityId: 'PRJ-001', entityName: 'Kitchen Remodel', user: 'Carlos Admin', userId: 'admin_user', timestamp: '2025-12-22T17:05:00', changes: { name: 'Kitchen Remodel', status: 'Active' } },
    { id: 3, action: 'update', module: 'Material', entityId: 'MAT-003', entityName: 'Pine Plywood 18mm', user: 'Ana Garcia', userId: 'agarcia', timestamp: '2025-12-22T16:30:00', changes: { stockTotal: { from: 100, to: 150 } } },
    { id: 4, action: 'create', module: 'Operation', entityId: 'WO-004', entityName: 'Cabinet Assembly', user: 'Miguel Torres', userId: 'mtorres', timestamp: '2025-12-22T15:45:00', changes: { projectName: 'ABC Corporate', status: 'Pending' } },
    { id: 5, action: 'update', module: 'Supplier', entityId: 'SUP-002', entityName: 'Northern Woods', user: 'Carlos Admin', userId: 'admin_user', timestamp: '2025-12-22T14:20:00', changes: { status: { from: 'Pending', to: 'Active' } } },
    { id: 6, action: 'delete', module: 'Product', entityId: 'PRD-015', entityName: 'Discontinued Handle', user: 'Alba Valadez', userId: 'avaladez', timestamp: '2025-12-22T13:00:00', changes: {} },
    { id: 7, action: 'create', module: 'Staff', entityId: 'STF-009', entityName: 'Pedro Sanchez', user: 'Carlos Admin', userId: 'admin_user', timestamp: '2025-12-21T11:30:00', changes: { role: 'REQUISITOR', email: 'psanchez@dovecreek.com' } },
    { id: 8, action: 'update', module: 'Operation', entityId: 'WO-002', entityName: 'Edge Banding', user: 'Laura Ruiz', userId: 'lruiz', timestamp: '2025-12-21T10:15:00', changes: { progress: { from: 50, to: 75 }, status: { from: 'In Progress', to: 'In Progress' } } },
];

const ActivityLogModule = () => {
    const [activities] = useState(initialActivityData);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('all');
    const [filterModule, setFilterModule] = useState('all');
    const [expandedItems, setExpandedItems] = useState({});

    const getActionIcon = (action) => {
        switch (action) {
            case 'create': return { icon: 'add_circle', color: '#10b981' };
            case 'update': return { icon: 'edit', color: '#3b82f6' };
            case 'delete': return { icon: 'delete', color: '#ef4444' };
            default: return { icon: 'info', color: '#64748b' };
        }
    };

    const getModuleIcon = (module) => {
        const icons = {
            'Product': 'category',
            'Project': 'assignment',
            'Material': 'inventory_2',
            'Operation': 'engineering',
            'Supplier': 'local_shipping',
            'Staff': 'badge',
            'Client': 'group'
        };
        return icons[module] || 'description';
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('es-MX', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatRelativeTime = (timestamp) => {
        const now = new Date();
        const date = new Date(timestamp);
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    const toggleExpand = (id) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const renderChanges = (changes, action) => {
        if (!changes || Object.keys(changes).length === 0) {
            return <span className="no-changes">No details available</span>;
        }

        return (
            <div className="changes-list">
                {Object.entries(changes).map(([key, value]) => (
                    <div key={key} className="change-item">
                        <span className="change-key">{key}:</span>
                        {typeof value === 'object' && value.from !== undefined ? (
                            <span className="change-value">
                                <span className="old-value">{value.from}</span>
                                <Icon name="arrow_forward" />
                                <span className="new-value">{value.to}</span>
                            </span>
                        ) : (
                            <span className="change-value new-value">{String(value)}</span>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const filteredActivities = activities.filter(activity => {
        const matchesSearch =
            activity.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            activity.module.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAction = filterAction === 'all' || activity.action === filterAction;
        const matchesModule = filterModule === 'all' || activity.module === filterModule;
        return matchesSearch && matchesAction && matchesModule;
    });

    const modules = [...new Set(activities.map(a => a.module))];

    // Stats
    const totalActivities = activities.length;
    const todayActivities = activities.filter(a => {
        const today = new Date().toDateString();
        return new Date(a.timestamp).toDateString() === today;
    }).length;
    const createCount = activities.filter(a => a.action === 'create').length;
    const updateCount = activities.filter(a => a.action === 'update').length;

    return (
        <div className="module-page activity-log-page">
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">history</span>
                    </div>
                    <div className="header-text">
                        <h1>Activity Log</h1>
                        <p>Track all system changes and user actions</p>
                    </div>
                </div>
                <button className="btn-secondary">
                    <span className="material-symbols-rounded">download</span>
                    Export Log
                </button>
            </div>

            <div className="module-stats-row">
                <div className="module-stat-card">
                    <div className="stat-icon purple">
                        <Icon name="history" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{totalActivities}</span>
                        <span className="stat-label">Total Activities</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon blue">
                        <Icon name="today" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{todayActivities}</span>
                        <span className="stat-label">Today</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon green">
                        <Icon name="add_circle" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{createCount}</span>
                        <span className="stat-label">Created</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon orange">
                        <Icon name="edit" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{updateCount}</span>
                        <span className="stat-label">Updated</span>
                    </div>
                </div>
            </div>

            <div className="activity-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search activities..."
                    className="activity-search"
                />
                <div className="activity-filters">
                    <div className="filter-group">
                        <label>Action</label>
                        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
                            <option value="all">All</option>
                            <option value="create">Create</option>
                            <option value="update">Update</option>
                            <option value="delete">Delete</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Module</label>
                        <select value={filterModule} onChange={(e) => setFilterModule(e.target.value)}>
                            <option value="all">All</option>
                            {modules.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="activity-list">
                {filteredActivities.map((activity) => {
                    const actionStyle = getActionIcon(activity.action);
                    const isExpanded = expandedItems[activity.id];

                    return (
                        <div key={activity.id} className={`activity-item ${isExpanded ? 'expanded' : ''}`}>
                            <div className="activity-main" onClick={() => toggleExpand(activity.id)}>
                                <div className="activity-action-badge" style={{ backgroundColor: `${actionStyle.color}20`, color: actionStyle.color }}>
                                    <Icon name={actionStyle.icon} />
                                    <span>{activity.action}</span>
                                </div>
                                <div className="activity-module-badge">
                                    <Icon name={getModuleIcon(activity.module)} />
                                    <span>{activity.module}</span>
                                </div>
                                <div className="activity-entity">
                                    <span className="entity-name">{activity.entityName}</span>
                                    <span className="entity-id">{activity.entityId}</span>
                                </div>
                                <div className="activity-user">
                                    <Icon name="person" />
                                    <span>{activity.user}</span>
                                </div>
                                <div className="activity-time">
                                    <span className="time-relative">{formatRelativeTime(activity.timestamp)}</span>
                                    <span className="time-full">{formatTimestamp(activity.timestamp)}</span>
                                </div>
                                <div className="activity-expand">
                                    <Icon name={isExpanded ? 'expand_less' : 'expand_more'} />
                                </div>
                            </div>
                            {isExpanded && (
                                <div className="activity-details">
                                    <h4>Changes</h4>
                                    {renderChanges(activity.changes, activity.action)}
                                </div>
                            )}
                        </div>
                    );
                })}

                {filteredActivities.length === 0 && (
                    <div className="activity-empty">
                        <Icon name="history" />
                        <p>No activities found</p>
                    </div>
                )}
            </div>

            <div className="table-footer-simple">
                <span>{filteredActivities.length} activit{filteredActivities.length !== 1 ? 'ies' : 'y'}</span>
            </div>
        </div>
    );
};

export default ActivityLogModule;
