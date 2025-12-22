import { useState } from 'react';
import { Icon, SearchBox } from '../../common';
import { topClients } from '../../../data/initialData';

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
                    <div className="header-icon">
                        <span className="material-symbols-rounded">star</span>
                    </div>
                    <div className="header-text">
                        <h1>Top Clients</h1>
                        <p>Best performing clients by revenue and orders</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="clients-stats-grid">
                <div className="clients-stat-card revenue">
                    <div className="clients-stat-icon">
                        <Icon name="payments" />
                    </div>
                    <div className="clients-stat-info">
                        <div className="clients-stat-value">${totalRevenue.toLocaleString()}</div>
                        <div className="clients-stat-label">Total Revenue</div>
                    </div>
                </div>
                <div className="clients-stat-card orders">
                    <div className="clients-stat-icon">
                        <Icon name="shopping_cart" />
                    </div>
                    <div className="clients-stat-info">
                        <div className="clients-stat-value">{totalOrders}</div>
                        <div className="clients-stat-label">Total Orders</div>
                    </div>
                </div>
                <div className="clients-stat-card avg">
                    <div className="clients-stat-icon">
                        <Icon name="calculate" />
                    </div>
                    <div className="clients-stat-info">
                        <div className="clients-stat-value">${Math.round(totalRevenue / totalOrders).toLocaleString()}</div>
                        <div className="clients-stat-label">Avg. Order Value</div>
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
                                <div className="top-client-avatar">
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
