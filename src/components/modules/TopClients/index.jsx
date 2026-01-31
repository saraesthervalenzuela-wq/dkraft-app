import { useState } from 'react';
import { Icon, SearchBox } from '../../common';
import { topClients } from '../../../data/initialData';

// Avatar colors for variety
const AVATAR_COLORS = [
    { bg: '#10b981', text: '#ffffff' }, // Green
    { bg: '#3b82f6', text: '#ffffff' }, // Blue
    { bg: '#8b5cf6', text: '#ffffff' }, // Purple
    { bg: '#f59e0b', text: '#ffffff' }, // Orange
    { bg: '#ec4899', text: '#ffffff' }, // Pink
    { bg: '#06b6d4', text: '#ffffff' }, // Cyan
    { bg: '#ef4444', text: '#ffffff' }, // Red
    { bg: '#6366f1', text: '#ffffff' }, // Indigo
];

const getAvatarColor = (index) => AVATAR_COLORS[index % AVATAR_COLORS.length];

const TopClientsModule = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('revenue');
    const [viewMode, setViewMode] = useState('grid');

    const filteredClients = topClients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedClients = [...filteredClients].sort((a, b) => {
        if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
        if (sortBy === 'orders') return b.totalOrders - a.totalOrders;
        return 0;
    });

    const totalRevenue = topClients.reduce((sum, c) => sum + c.totalRevenue, 0);
    const totalOrders = topClients.reduce((sum, c) => sum + c.totalOrders, 0);

    return (
        <div className="module-page top-clients-page">
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon orange">
                        <span className="material-symbols-rounded">workspace_premium</span>
                    </div>
                    <div className="header-text">
                        <h1>Top Clients</h1>
                        <p>Best performing clients by revenue and orders</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards - Same style as Staff */}
            <div className="module-stats-row">
                <div className="module-stat-card">
                    <div className="stat-icon green">
                        <Icon name="payments" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">${totalRevenue.toLocaleString()}</span>
                        <span className="stat-label">Total Revenue</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon orange">
                        <Icon name="local_mall" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{totalOrders}</span>
                        <span className="stat-label">Total Orders</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon blue">
                        <Icon name="insights" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">${Math.round(totalRevenue / totalOrders).toLocaleString()}</span>
                        <span className="stat-label">Avg. Order Value</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon purple">
                        <Icon name="workspace_premium" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{topClients.length}</span>
                        <span className="stat-label">Top Performers</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="top-clients-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search clients..."
                />
                <div className="sort-buttons">
                    <button
                        className={`sort-btn ${sortBy === 'revenue' ? 'active' : ''}`}
                        onClick={() => setSortBy('revenue')}
                    >
                        <Icon name="payments" />
                        By Revenue
                    </button>
                    <button
                        className={`sort-btn ${sortBy === 'orders' ? 'active' : ''}`}
                        onClick={() => setSortBy('orders')}
                    >
                        <Icon name="shopping_cart" />
                        By Orders
                    </button>
                </div>
                <div className="view-toggle-buttons">
                    <button
                        className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid view"
                    >
                        <Icon name="grid_view" />
                    </button>
                    <button
                        className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                        onClick={() => setViewMode('table')}
                        title="Table view"
                    >
                        <Icon name="view_list" />
                    </button>
                </div>
            </div>

            {/* Clients Content */}
            {viewMode === 'grid' ? (
                <div className="top-clients-cards-grid">
                    {sortedClients.map((client, index) => (
                        <div key={client.id} className={`top-client-card ${index < 3 ? 'top-rank' : ''}`}>
                            <div className="top-client-card-header">
                                <div className={`rank-badge ${index < 3 ? 'top-' + (index + 1) : ''}`}>
                                    #{index + 1}
                                </div>
                                <div className={`trend-badge ${client.trend}`}>
                                    <Icon name={client.trend === 'up' ? 'trending_up' : client.trend === 'down' ? 'trending_down' : 'trending_flat'} />
                                </div>
                            </div>
                            <div className="top-client-card-body">
                                <div className="top-client-avatar" style={{ background: getAvatarColor(index).bg, color: getAvatarColor(index).text }}>
                                    {client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <h3 className="top-client-name">{client.name}</h3>
                                <div className="top-client-stats">
                                    <div className="top-client-stat">
                                        <Icon name="payments" />
                                        <span className="stat-value">${client.totalRevenue.toLocaleString()}</span>
                                        <span className="stat-label">Revenue</span>
                                    </div>
                                    <div className="top-client-stat">
                                        <Icon name="shopping_cart" />
                                        <span className="stat-value">{client.totalOrders}</span>
                                        <span className="stat-label">Orders</span>
                                    </div>
                                </div>
                            </div>
                            <div className="top-client-card-footer">
                                <div className="last-order">
                                    <Icon name="calendar_today" />
                                    <span>Last: {client.lastOrder}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {sortedClients.length === 0 && (
                        <div className="top-clients-empty-grid">
                            <Icon name="star" />
                            <p>No top clients found</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="top-clients-table-container">
                    <div className="top-clients-table">
                        <div className="top-clients-table-header">
                            <span className="col-rank">Rank</span>
                            <span className="col-name">Client Name</span>
                            <span className="col-orders">Total Orders</span>
                            <span className="col-revenue">Total Revenue</span>
                            <span className="col-last">Last Order</span>
                            <span className="col-trend">Trend</span>
                        </div>
                        <div className="top-clients-table-body">
                            {sortedClients.map((client, index) => (
                                <div key={client.id} className="top-clients-table-row">
                                    <span className="col-rank">
                                        <div className={`rank-badge ${index < 3 ? 'top-' + (index + 1) : ''}`}>
                                            #{index + 1}
                                        </div>
                                    </span>
                                    <span className="col-name">
                                        <div className="client-avatar">
                                            {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                        <span>{client.name}</span>
                                    </span>
                                    <span className="col-orders">{client.totalOrders}</span>
                                    <span className="col-revenue">${client.totalRevenue.toLocaleString()}</span>
                                    <span className="col-last">{client.lastOrder}</span>
                                    <span className="col-trend">
                                        <div className={`trend-badge ${client.trend}`}>
                                            <Icon name={client.trend === 'up' ? 'trending_up' : client.trend === 'down' ? 'trending_down' : 'trending_flat'} />
                                            {client.trend === 'up' ? 'Growing' : client.trend === 'down' ? 'Declining' : 'Stable'}
                                        </div>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="table-footer-simple">
                <span>{sortedClients.length} client{sortedClients.length !== 1 ? 's' : ''}</span>
            </div>
        </div>
    );
};

export default TopClientsModule;
