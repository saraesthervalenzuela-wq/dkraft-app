import { useState } from 'react';
import { Icon, SearchBox } from '../../common';
import { clientsData } from '../../../data/initialData';

const ClientsModule = () => {
    const [clients, setClients] = useState(clientsData);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClients, setSelectedClients] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [viewMode, setViewMode] = useState('grid');

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedClients = [...filteredClients].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = (a[sortConfig.key] || '').toString().toLowerCase();
        const bVal = (b[sortConfig.key] || '').toString().toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedClients(sortedClients.map(c => c.idClient));
        } else {
            setSelectedClients([]);
        }
    };

    const handleSelectClient = (id) => {
        setSelectedClients(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Calculate stats
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === 'Active').length;
    const pendingClients = clients.filter(c => c.status === 'Pending').length;
    const uniqueCompanies = [...new Set(clients.map(c => c.company))].length;

    return (
        <div className="module-page clients-module">
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">group</span>
                    </div>
                    <div className="header-text">
                        <h1>Clients</h1>
                        <p>Manage your client database</p>
                    </div>
                </div>
                <button className="btn-primary-action">
                    <span className="material-symbols-rounded">add</span>
                    Add new client
                </button>
            </div>

            {/* Numeralia Stats */}
            <div className="module-stats-row">
                <div className="module-stat-card">
                    <div className="stat-icon green">
                        <Icon name="group" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{totalClients}</span>
                        <span className="stat-label">Total Clients</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon blue">
                        <Icon name="check_circle" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{activeClients}</span>
                        <span className="stat-label">Active</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon orange">
                        <Icon name="pending" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{pendingClients}</span>
                        <span className="stat-label">Pending</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon purple">
                        <Icon name="business" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{uniqueCompanies}</span>
                        <span className="stat-label">Companies</span>
                    </div>
                </div>
            </div>

            <div className="clients-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search..."
                    className="clients-search"
                />
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

            {viewMode === 'grid' ? (
                <div className="clients-cards-grid">
                    {sortedClients.map((client) => (
                        <div key={client.idClient} className="client-card">
                            <div className="client-card-header">
                                <div className="client-avatar">
                                    {client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div className={`client-status-badge ${client.status.toLowerCase()}`}>
                                    {client.status}
                                </div>
                            </div>
                            <div className="client-card-body">
                                <h3 className="client-name">{client.name}</h3>
                                <p className="client-company">{client.company}</p>
                                <div className="client-details">
                                    <div className="client-detail">
                                        <Icon name="mail" />
                                        <span>{client.email}</span>
                                    </div>
                                    <div className="client-detail">
                                        <Icon name="badge" />
                                        <span>{client.idClient}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="client-card-footer">
                                <button className="btn-card-action">
                                    <Icon name="edit" />
                                    Edit
                                </button>
                                <button className="btn-card-action secondary">
                                    <Icon name="visibility" />
                                    View
                                </button>
                            </div>
                        </div>
                    ))}
                    {sortedClients.length === 0 && (
                        <div className="clients-empty-grid">
                            <Icon name="group" />
                            <p>No clients found</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="clients-table-container">
                    <div className="clients-table">
                        <div className="clients-table-header">
                            <span className="col-checkbox">
                                <input
                                    type="checkbox"
                                    checked={sortedClients.length > 0 && selectedClients.length === sortedClients.length}
                                    onChange={handleSelectAll}
                                />
                            </span>
                            <span className="col-id sortable" onClick={() => handleSort('idClient')}>
                                ID Client
                                <Icon name={sortConfig.key === 'idClient' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-name sortable" onClick={() => handleSort('name')}>
                                Name
                                <Icon name={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-email sortable" onClick={() => handleSort('email')}>
                                Email
                                <Icon name={sortConfig.key === 'email' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-company sortable" onClick={() => handleSort('company')}>
                                Company
                                <Icon name={sortConfig.key === 'company' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-status sortable" onClick={() => handleSort('status')}>
                                Status
                                <Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-actions">Actions</span>
                        </div>

                        <div className="clients-table-body">
                            {sortedClients.map((client) => (
                                <div key={client.idClient} className="clients-table-row">
                                    <span className="col-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedClients.includes(client.idClient)}
                                            onChange={() => handleSelectClient(client.idClient)}
                                        />
                                    </span>
                                    <span className="col-id">{client.idClient}</span>
                                    <span className="col-name">{client.name}</span>
                                    <span className="col-email">{client.email}</span>
                                    <span className="col-company">{client.company}</span>
                                    <span className={`col-status status-badge ${client.status.toLowerCase()}`}>
                                        {client.status}
                                    </span>
                                    <span className="col-actions">
                                        <button className="btn-action-edit">
                                            <Icon name="edit" />
                                        </button>
                                    </span>
                                </div>
                            ))}

                            {sortedClients.length === 0 && (
                                <div className="clients-empty">
                                    <Icon name="group" />
                                    <p>No clients found</p>
                                </div>
                            )}
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

export default ClientsModule;
