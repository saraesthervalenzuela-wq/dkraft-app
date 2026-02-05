import { useState, useEffect } from 'react';
import { Icon, SearchBox } from '../../common';
import { supabase } from '../../../lib/supabase';

// Avatar color palette - vibrant and varied
const AVATAR_COLORS = [
    'linear-gradient(135deg, #d35400 0%, #e67e22 100%)',  // Orange
    'linear-gradient(135deg, #2980b9 0%, #3498db 100%)',  // Blue
    'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',  // Green
    'linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)',  // Purple
    'linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)',  // Red
    'linear-gradient(135deg, #16a085 0%, #1abc9c 100%)',  // Teal
    'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',  // Dark Blue
    'linear-gradient(135deg, #f39c12 0%, #f1c40f 100%)',  // Yellow
    'linear-gradient(135deg, #1a5276 0%, #2874a6 100%)',  // Navy
    'linear-gradient(135deg, #922b21 0%, #c0392b 100%)',  // Dark Red
    'linear-gradient(135deg, #0e6655 0%, #148f77 100%)',  // Dark Teal
    'linear-gradient(135deg, #6c3483 0%, #8e44ad 100%)',  // Deep Purple
];

// Get avatar color by index
const getAvatarColor = (index) => AVATAR_COLORS[index % AVATAR_COLORS.length];

const TopClientsModule = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('revenue');
    const [viewMode, setViewMode] = useState('grid');
    const [clients, setClients] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load clients from Supabase on mount
    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        setIsLoading(true);
        try {
            console.log('[TopClients] Loading from Supabase...');

            // Load all clients
            const { data: clientsData, error: clientsError } = await supabase
                .from('clients')
                .select('id, name, company_name, billing_entity')
                .eq('status', 'ACTIVE');

            if (clientsError) throw clientsError;

            // Load all quotations with their totals
            const { data: quotationsData, error: quotationsError } = await supabase
                .from('quotations')
                .select('client_id, total, created_at, status')
                .in('status', ['DRAFT', 'SENT', 'APPROVED', 'CONVERTED']); // Only count valid quotations

            if (quotationsError) throw quotationsError;

            console.log('[TopClients] Loaded', clientsData?.length, 'clients and', quotationsData?.length, 'quotations');

            // Calculate revenue and orders per client
            const clientStats = {};

            (quotationsData || []).forEach(q => {
                if (!q.client_id) return;

                if (!clientStats[q.client_id]) {
                    clientStats[q.client_id] = {
                        totalRevenue: 0,
                        totalOrders: 0,
                        lastOrder: null,
                    };
                }

                clientStats[q.client_id].totalRevenue += parseFloat(q.total) || 0;
                clientStats[q.client_id].totalOrders += 1;

                const orderDate = new Date(q.created_at);
                if (!clientStats[q.client_id].lastOrder || orderDate > new Date(clientStats[q.client_id].lastOrder)) {
                    clientStats[q.client_id].lastOrder = q.created_at;
                }
            });

            // Combine client data with stats
            const topClientsData = (clientsData || [])
                .map(client => {
                    const stats = clientStats[client.id] || { totalRevenue: 0, totalOrders: 0, lastOrder: null };
                    return {
                        id: client.id,
                        name: client.company_name || client.name,
                        billingEntity: client.billing_entity,
                        totalRevenue: stats.totalRevenue,
                        totalOrders: stats.totalOrders,
                        lastOrder: stats.lastOrder ? stats.lastOrder.split('T')[0] : '-',
                        trend: stats.totalOrders > 5 ? 'up' : stats.totalOrders > 2 ? 'stable' : 'down',
                    };
                })
                .filter(c => c.totalOrders > 0) // Only show clients with orders
                .sort((a, b) => b.totalRevenue - a.totalRevenue);

            console.log('[TopClients] Processed', topClientsData.length, 'clients with orders');
            setClients(topClientsData);

        } catch (error) {
            console.error('[TopClients] Error loading:', error);
            setClients([]);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredClients = clients.filter(client =>
        client.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedClients = [...filteredClients].sort((a, b) => {
        if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
        if (sortBy === 'orders') return b.totalOrders - a.totalOrders;
        return 0;
    });

    const totalRevenue = clients.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);
    const totalOrders = clients.reduce((sum, c) => sum + (c.totalOrders || 0), 0);
    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    if (isLoading) {
        return (
            <div className="module-page top-clients-page">
                <div className="loading-state">
                    <Icon name="progress_activity" />
                    <p>Loading top clients...</p>
                </div>
            </div>
        );
    }

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
                        <div className="clients-stat-value">${avgOrderValue.toLocaleString()}</div>
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
                                <div className="top-client-avatar" style={{ background: getAvatarColor(index) }}>
                                    {client.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <h3 className="top-client-name">{client.name}</h3>
                                {client.billingEntity && (
                                    <span className={`entity-badge ${client.billingEntity.toLowerCase()}`}>
                                        {client.billingEntity}
                                    </span>
                                )}
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
                            <p>No clients with orders found</p>
                            <span className="empty-subtitle">Create quotations to see top clients here</span>
                        </div>
                    )}
                </div>
            ) : (
                <div className="top-clients-table-container">
                    <div className="top-clients-table">
                        <div className="top-clients-table-header">
                            <span className="col-rank">Rank</span>
                            <span className="col-name">Client Name</span>
                            <span className="col-entity">Entity</span>
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
                                        <div className="client-avatar" style={{ background: getAvatarColor(index) }}>
                                            {client.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </div>
                                        <span>{client.name}</span>
                                    </span>
                                    <span className="col-entity">
                                        {client.billingEntity && (
                                            <span className={`entity-badge small ${client.billingEntity.toLowerCase()}`}>
                                                {client.billingEntity}
                                            </span>
                                        )}
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
                    {sortedClients.length === 0 && (
                        <div className="top-clients-empty">
                            <Icon name="star" />
                            <p>No clients with orders found</p>
                            <span>Create quotations to see top clients here</span>
                        </div>
                    )}
                </div>
            )}

            <div className="table-footer-simple">
                <span>{sortedClients.length} client{sortedClients.length !== 1 ? 's' : ''} with orders</span>
            </div>
        </div>
    );
};

export default TopClientsModule;
