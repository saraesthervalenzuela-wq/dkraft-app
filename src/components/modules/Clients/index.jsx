import { useState, useEffect, useRef } from 'react';
import { Icon, SearchBox, Modal, Button, Badge, TableSkeleton, CardSkeleton } from '../../common';
import { clientsApi } from '../../../services/api';

// Polling interval for QB sync status (30 seconds)
const QB_SYNC_POLL_INTERVAL = 30000;

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

/**
 * Initial clients data matching MySQL schema
 * Fields: id, name, email, phone, address, city, state, country, zipCode,
 *         rfc, companyName, contactName, website, status, qbListId, qbSyncStatus, notes
 */
const initialClientsData = [
    {
        id: '1',
        name: 'Acme Corporation',
        companyName: 'Acme Corporation',
        email: 'contact@acme.com',
        phone: '555-123-4567',
        address: '123 Main Street',
        city: 'San Diego',
        state: 'California',
        country: 'USA',
        zipCode: '92101',
        rfc: 'ACM123456ABC',
        contactName: 'Robert Johnson',
        website: 'https://acme.com',
        status: 'ACTIVE',
        qbSyncStatus: 'synced',
        notes: 'Key account - furniture projects'
    },
    {
        id: '2',
        name: 'TechStart Inc',
        companyName: 'TechStart Inc',
        email: 'office@techstart.com',
        phone: '555-234-5678',
        address: '456 Innovation Blvd',
        city: 'Los Angeles',
        state: 'California',
        country: 'USA',
        zipCode: '90001',
        rfc: 'TSI987654XYZ',
        contactName: 'Sarah Williams',
        website: 'https://techstart.com',
        status: 'ACTIVE',
        qbSyncStatus: 'synced',
        notes: ''
    },
    {
        id: '3',
        name: 'Global Designs',
        companyName: 'Global Designs LLC',
        email: 'info@globaldesigns.mx',
        phone: '664-555-3344',
        address: '789 Design Ave',
        city: 'Tijuana',
        state: 'Baja California',
        country: 'Mexico',
        zipCode: '22000',
        rfc: 'GDL456789DEF',
        contactName: 'Carlos Mendoza',
        website: 'https://globaldesigns.mx',
        status: 'ACTIVE',
        qbSyncStatus: 'pending',
        notes: 'Interior design firm'
    },
    {
        id: '4',
        name: 'HomeStyle Interiors',
        companyName: 'HomeStyle Interiors',
        email: 'sales@homestyle.com',
        phone: '555-345-6789',
        address: '321 Decor Lane',
        city: 'Phoenix',
        state: 'Arizona',
        country: 'USA',
        zipCode: '85001',
        rfc: 'HSI321654GHI',
        contactName: 'Emily Davis',
        website: 'https://homestyle.com',
        status: 'PENDING',
        qbSyncStatus: 'pending',
        notes: 'New client - awaiting first order'
    },
];

/**
 * Empty client template matching MySQL schema
 */
const emptyClient = {
    code: '',
    name: '',
    companyName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'USA',
    zipCode: '',
    rfc: '',
    contactName: '',
    website: '',
    status: 'ACTIVE',
    qbSyncStatus: 'pending',
    listId: null,
    notes: ''
};

/**
 * Status options matching MySQL ENUM
 */
const statusOptions = [
    { value: 'ACTIVE', label: 'Active', color: 'green' },
    { value: 'INACTIVE', label: 'Inactive', color: 'gray' },
    { value: 'PENDING', label: 'Pending', color: 'orange' },
];

const ClientsModule = () => {
    // Data state
    const [clients, setClients] = useState(initialClientsData);

    // UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClients, setSelectedClients] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [viewMode, setViewMode] = useState('grid');
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentClient, setCurrentClient] = useState(emptyClient);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);

    // QB Sync polling ref
    const pollIntervalRef = useRef(null);
    const [pendingSyncCount, setPendingSyncCount] = useState(0);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    /**
     * Start polling for QB sync status updates
     */
    useEffect(() => {
        // Check if we have pending syncs
        const pendingClients = clients.filter(c => !c.listId && c.qbSyncStatus !== 'error');
        setPendingSyncCount(pendingClients.length);

        if (pendingClients.length > 0) {
            console.log(`[Clients] ${pendingClients.length} clients pending QB sync, starting polling...`);

            // Clear existing interval
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }

            // Start polling
            pollIntervalRef.current = setInterval(async () => {
                console.log('[Clients] Polling for QB sync updates...');
                try {
                    const updatedClients = await clientsApi.getAll();
                    if (updatedClients?.length > 0) {
                        const normalizedClients = updatedClients.map(normalizeClient);

                        // Check for newly synced clients
                        const newlySynced = normalizedClients.filter(updated => {
                            const original = clients.find(c => c.id === updated.id);
                            return original && !original.listId && updated.listId;
                        });

                        if (newlySynced.length > 0) {
                            console.log(`[Clients] ${newlySynced.length} clients synced with QB:`, newlySynced.map(c => c.name));
                        }

                        setClients(normalizedClients);

                        // Update pending count
                        const stillPending = normalizedClients.filter(c => !c.listId && c.qbSyncStatus !== 'error');
                        setPendingSyncCount(stillPending.length);

                        // Stop polling if no more pending
                        if (stillPending.length === 0) {
                            console.log('[Clients] All clients synced, stopping polling');
                            clearInterval(pollIntervalRef.current);
                            pollIntervalRef.current = null;
                        }
                    }
                } catch (error) {
                    console.error('[Clients] Polling error:', error);
                }
            }, QB_SYNC_POLL_INTERVAL);
        }

        // Cleanup on unmount
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [clients.length]); // Re-run when clients count changes

    /**
     * Load clients from Firebase or API
     */
    const loadData = async () => {
        setIsLoading(true);
        try {
            const clientsData = await clientsApi.getAll();

            if (clientsData?.length > 0) {
                const normalizedClients = clientsData.map(normalizeClient);
                setClients(normalizedClients);
            }
        } catch (error) {
            console.error('Error loading clients:', error);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Determine QB sync status based on listId presence
     */
    const getQBSyncStatusFromData = (client) => {
        if (client.listId) {
            return 'synced';
        }
        if (client.qbSyncStatus === 'error') {
            return 'error';
        }
        return 'pending';
    };

    /**
     * Normalize client data to match MySQL schema
     */
    const normalizeClient = (c) => {
        // Determine qbSyncStatus based on listId
        const qbSyncStatus = getQBSyncStatusFromData(c);

        return {
            id: c.id || c.idClient,
            code: c.code || '',
            name: c.name || '',
            companyName: c.company || c.companyName || c.name || '',
            email: c.email || '',
            phone: c.phone || '',
            address: c.address || '',
            city: c.city || '',
            state: c.state || '',
            country: c.country || 'USA',
            zipCode: c.zip || c.zipCode || '',
            rfc: c.rfc || '',
            contactName: c.contact || c.contactName || '',
            website: c.website || '',
            status: normalizeStatus(c.status),
            qbSyncStatus,
            listId: c.listId || null,
            notes: c.notes || '',
        };
    };

    /**
     * Normalize status to MySQL ENUM format
     */
    const normalizeStatus = (status) => {
        if (!status) return 'ACTIVE';
        const statusUpper = status.toUpperCase();
        if (['ACTIVE', 'INACTIVE', 'PENDING'].includes(statusUpper)) {
            return statusUpper;
        }
        return 'ACTIVE';
    };

    /**
     * Get status style
     */
    const getStatusStyle = (status) => {
        const statusOpt = statusOptions.find(s => s.value === status);
        return statusOpt || { value: status, label: status, color: 'gray' };
    };

    /**
     * QuickBooks sync status icon
     */
    const getQBStatusIcon = (status) => {
        switch (status) {
            case 'synced': return { icon: 'check_circle', color: '#10b981', label: 'Synced' };
            case 'pending': return { icon: 'schedule', color: '#f59e0b', label: 'Pending' };
            case 'error': return { icon: 'error', color: '#ef4444', label: 'Error' };
            default: return { icon: 'help', color: '#64748b', label: 'Unknown' };
        }
    };

    // Filter clients
    const filteredClients = clients.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.rfc?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort clients
    const sortedClients = [...filteredClients].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = String(a[sortConfig.key] || '').toLowerCase();
        const bVal = String(b[sortConfig.key] || '').toLowerCase();
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
            setSelectedClients(sortedClients.map(c => c.id));
        } else {
            setSelectedClients([]);
        }
    };

    const handleSelectClient = (id) => {
        setSelectedClients(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    /**
     * Sync with QuickBooks
     */
    const handleSync = async () => {
        setIsSyncing(true);
        try {
            // await quickbooksApi.syncClients();
            await new Promise(resolve => setTimeout(resolve, 2000));
            await loadData();
        } catch (error) {
            console.error('Error syncing with QB:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    /**
     * Generate a unique client code
     */
    const generateClientCode = () => {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 5).toUpperCase();
        return `CLI-${timestamp}-${random}`;
    };

    // Modal handlers
    const handleAdd = () => {
        const newCode = generateClientCode();
        setCurrentClient({ ...emptyClient, code: newCode });
        setModalMode('add');
        setShowModal(true);
    };

    const handleEdit = (client) => {
        setCurrentClient({ ...client });
        setModalMode('edit');
        setShowModal(true);
    };

    const handleView = (client) => {
        setCurrentClient({ ...client });
        setModalMode('view');
        setShowModal(true);
    };

    const handleDelete = (client) => {
        setClientToDelete(client);
        setShowDeleteConfirm(true);
    };

    const handleDeleteSelected = async () => {
        if (selectedClients.length === 0) return;

        try {
            for (const id of selectedClients) {
                await clientsApi.delete(id);
            }
            setClients(prev => prev.filter(c => !selectedClients.includes(c.id)));
            setSelectedClients([]);
        } catch (error) {
            console.error('Error deleting clients:', error);
        }
    };

    const confirmDelete = async () => {
        if (clientToDelete) {
            try {
                await clientsApi.delete(clientToDelete.id);
                setClients(prev => prev.filter(c => c.id !== clientToDelete.id));
            } catch (error) {
                console.error('Error deleting client:', error);
            }
        }
        setShowDeleteConfirm(false);
        setClientToDelete(null);
    };

    const handleSave = async () => {
        try {
            console.log('[Clients] Mode:', modalMode);
            console.log('[Clients] Data to save:', currentClient);

            // Build client object - required fields: code, name, email
            const clientToSave = {
                code: currentClient.code || generateClientCode(),
                name: currentClient.name || '',
                email: currentClient.email || '',
                status: currentClient.status || 'ACTIVE',
            };

            // Add optional fields only if they have values (use backend field names)
            if (currentClient.phone?.trim()) clientToSave.phone = currentClient.phone;
            if (currentClient.companyName?.trim()) clientToSave.company = currentClient.companyName;
            if (currentClient.contactName?.trim()) clientToSave.contact = currentClient.contactName;
            if (currentClient.address?.trim()) clientToSave.address = currentClient.address;
            if (currentClient.city?.trim()) clientToSave.city = currentClient.city;
            if (currentClient.state?.trim()) clientToSave.state = currentClient.state;
            if (currentClient.country?.trim()) clientToSave.country = currentClient.country;
            if (currentClient.zipCode?.trim()) clientToSave.zip = currentClient.zipCode;
            if (currentClient.rfc?.trim()) clientToSave.rfc = currentClient.rfc;
            if (currentClient.notes?.trim()) clientToSave.notes = currentClient.notes;
            if (currentClient.website?.trim()) clientToSave.website = currentClient.website;

            console.log('[Clients] Final data:', clientToSave);

            if (modalMode === 'add') {
                console.log('[Clients] Calling clientsApi.create...');
                const newClient = await clientsApi.create(clientToSave);
                console.log('[Clients] API response:', newClient);
                setClients(prev => [...prev, normalizeClient({ ...clientToSave, id: newClient?.id || newClient })]);
            } else if (modalMode === 'edit') {
                console.log('[Clients] Calling clientsApi.update...');
                await clientsApi.update(currentClient.id, clientToSave);
                setClients(prev => prev.map(c => c.id === currentClient.id ? normalizeClient({ ...c, ...clientToSave }) : c));
            }

            console.log('[Clients] Save successful!');
            setShowModal(false);
            setCurrentClient(emptyClient);
            // Reload data to get fresh data from server
            await loadData();
        } catch (error) {
            console.error('[Clients] Error saving client:', error);
            alert('Error saving client: ' + error.message);
        }
    };

    const handleInputChange = (field, value) => {
        setCurrentClient(prev => ({ ...prev, [field]: value }));
    };

    // Calculate stats
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.status === 'ACTIVE').length;
    const pendingClients = clients.filter(c => c.status === 'PENDING').length;
    const uniqueCompanies = [...new Set(clients.map(c => c.companyName).filter(Boolean))].length;

    return (
        <div className="module-page clients-module">
            {/* Page Header */}
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
                <div className="header-actions">
                    {pendingSyncCount > 0 && (
                        <div className="qb-sync-indicator pending" title={`${pendingSyncCount} clients pending QB sync`}>
                            <span className="material-symbols-rounded spinning">sync</span>
                            <span className="sync-count">{pendingSyncCount} pending</span>
                        </div>
                    )}
                    {/* <button className={`btn-sync ${isSyncing ? 'syncing' : ''}`} onClick={handleSync} disabled={isSyncing}>
                        <span className="material-symbols-rounded">sync</span>
                        {isSyncing ? 'Syncing...' : 'Sync with QB'}
                    </button> */}
                    <Button variant="orange" icon="add" onClick={handleAdd}>
                        Add new client
                    </Button>
                </div>
            </div>

            {/* Stats Row */}
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

            {/* Toolbar */}
            <div className="clients-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search clients..."
                    className="clients-search"
                />
                <div className="toolbar-actions">
                    {selectedClients.length > 0 && (
                        <Button variant="danger" icon="delete" size="sm" onClick={handleDeleteSelected}>
                            Delete ({selectedClients.length})
                        </Button>
                    )}
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
            </div>

            {isLoading ? (
                viewMode === 'grid' ? <CardSkeleton count={6} /> : <TableSkeleton rows={6} columns={6} />
            ) : viewMode === 'grid' ? (
                /* Cards View */
                <div className="clients-cards-grid">
                    {sortedClients.map((client, index) => {
                        const statusStyle = getStatusStyle(client.status);
                        const qbStatus = getQBStatusIcon(client.qbSyncStatus);
                        const avatarColor = getAvatarColor(index);

                        return (
                            <div key={client.id} className="client-card">
                                <div className="client-card-header">
                                    <div className="client-avatar" style={{ background: avatarColor.bg, color: avatarColor.text }}>
                                        {client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="client-card-badges">
                                        <span className={`status-badge ${statusStyle.color}`}>
                                            <span className="status-dot"></span>
                                            {statusStyle.label}
                                        </span>
                                        <span className="qb-status-badge" style={{ color: qbStatus.color }} title={qbStatus.label}>
                                            <Icon name={qbStatus.icon} />
                                        </span>
                                    </div>
                                </div>
                                <div className="client-card-body">
                                    <h3 className="client-name">{client.name}</h3>
                                    <p className="client-company">{client.companyName || client.name}</p>
                                    <div className="client-details">
                                        <div className="client-detail">
                                            <Icon name="mail" />
                                            <span>{client.email || '-'}</span>
                                        </div>
                                        <div className="client-detail">
                                            <Icon name="phone" />
                                            <span>{client.phone || '-'}</span>
                                        </div>
                                        <div className="client-detail">
                                            <Icon name="location_on" />
                                            <span>{client.city ? `${client.city}, ${client.state}` : client.address || '-'}</span>
                                        </div>
                                        {client.contactName && (
                                            <div className="client-detail">
                                                <Icon name="person" />
                                                <span>{client.contactName}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="client-card-footer">
                                    <button className="btn-icon" onClick={() => handleView(client)} title="View">
                                        <Icon name="visibility" />
                                    </button>
                                    <button className="btn-icon" onClick={() => handleEdit(client)} title="Edit">
                                        <Icon name="edit" />
                                    </button>
                                    <button className="btn-icon danger" onClick={() => handleDelete(client)} title="Delete">
                                        <Icon name="delete" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {sortedClients.length === 0 && (
                        <div className="clients-empty-grid">
                            <Icon name="group" />
                            <p>No clients found</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Table View */
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
                            <span className="col-status-qb">QB</span>
                            <span className="col-name sortable" onClick={() => handleSort('name')}>
                                Name
                                <Icon name={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-company sortable" onClick={() => handleSort('companyName')}>
                                Company
                                <Icon name={sortConfig.key === 'companyName' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-email sortable" onClick={() => handleSort('email')}>
                                Email
                                <Icon name={sortConfig.key === 'email' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-phone">Phone</span>
                            <span className="col-city sortable" onClick={() => handleSort('city')}>
                                City
                                <Icon name={sortConfig.key === 'city' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-status sortable" onClick={() => handleSort('status')}>
                                Status
                                <Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-actions">Actions</span>
                        </div>

                        <div className="clients-table-body">
                            {sortedClients.map((client) => {
                                const statusStyle = getStatusStyle(client.status);
                                const qbStatus = getQBStatusIcon(client.qbSyncStatus);

                                return (
                                    <div key={client.id} className="clients-table-row">
                                        <span className="col-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={selectedClients.includes(client.id)}
                                                onChange={() => handleSelectClient(client.id)}
                                            />
                                        </span>
                                        <span className="col-status-qb" title={qbStatus.label}>
                                            <Icon name={qbStatus.icon} style={{ color: qbStatus.color, fontSize: '20px' }} />
                                        </span>
                                        <span className="col-name">
                                            <div className="client-info">
                                                <span className="client-name-text">{client.name}</span>
                                                {client.contactName && (
                                                    <span className="client-contact-text">{client.contactName}</span>
                                                )}
                                            </div>
                                        </span>
                                        <span className="col-company">{client.companyName || '-'}</span>
                                        <span className="col-email">{client.email}</span>
                                        <span className="col-phone">{client.phone || '-'}</span>
                                        <span className="col-city">{client.city || '-'}</span>
                                        <span className={`col-status status-badge ${statusStyle.color}`}>
                                            <span className="status-dot"></span>
                                            {statusStyle.label}
                                        </span>
                                        <span className="col-actions">
                                            <button className="btn-icon" onClick={() => handleView(client)} title="View">
                                                <Icon name="visibility" />
                                            </button>
                                            <button className="btn-icon" onClick={() => handleEdit(client)} title="Edit">
                                                <Icon name="edit" />
                                            </button>
                                            <button className="btn-icon danger" onClick={() => handleDelete(client)} title="Delete">
                                                <Icon name="delete" />
                                            </button>
                                        </span>
                                    </div>
                                );
                            })}

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

            {/* Footer */}
            <div className="table-footer-simple">
                <span>{sortedClients.length} client{sortedClients.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Add/Edit/View Modal */}
            <Modal
                isOpen={showModal}
                title={modalMode === 'add' ? 'New Client' : modalMode === 'edit' ? 'Edit Client' : 'Client Details'}
                onClose={() => setShowModal(false)}
                icon={modalMode === 'add' ? 'add_box' : modalMode === 'edit' ? 'edit' : 'visibility'}
            >
                <div className="client-form" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
                    {/* Basic Information */}
                    <div className="form-section">
                        <h4 className="form-section-title">Basic Information</h4>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Client Name *</label>
                                <input
                                    type="text"
                                    value={currentClient.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Client name"
                                    disabled={modalMode === 'view'}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={currentClient.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    disabled={modalMode === 'view'}
                                >
                                    {statusOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Company Name</label>
                                <input
                                    type="text"
                                    value={currentClient.companyName}
                                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                                    placeholder="Company name"
                                    disabled={modalMode === 'view'}
                                />
                            </div>
                            <div className="form-group">
                                <label>Contact Name</label>
                                <input
                                    type="text"
                                    value={currentClient.contactName}
                                    onChange={(e) => handleInputChange('contactName', e.target.value)}
                                    placeholder="Contact person"
                                    disabled={modalMode === 'view'}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={currentClient.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    placeholder="email@example.com"
                                    disabled={modalMode === 'view'}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone</label>
                                <input
                                    type="tel"
                                    value={currentClient.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    placeholder="(555) 555-5555"
                                    disabled={modalMode === 'view'}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Website</label>
                            <input
                                type="url"
                                value={currentClient.website}
                                onChange={(e) => handleInputChange('website', e.target.value)}
                                placeholder="https://..."
                                disabled={modalMode === 'view'}
                            />
                        </div>
                    </div>

                    {/* Address Information */}
                    <div className="form-section">
                        <h4 className="form-section-title">Address</h4>
                        <div className="form-group">
                            <label>Street Address</label>
                            <input
                                type="text"
                                value={currentClient.address}
                                onChange={(e) => handleInputChange('address', e.target.value)}
                                placeholder="Street address"
                                disabled={modalMode === 'view'}
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>City</label>
                                <input
                                    type="text"
                                    value={currentClient.city}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                    placeholder="City"
                                    disabled={modalMode === 'view'}
                                />
                            </div>
                            <div className="form-group">
                                <label>State</label>
                                <input
                                    type="text"
                                    value={currentClient.state}
                                    onChange={(e) => handleInputChange('state', e.target.value)}
                                    placeholder="State"
                                    disabled={modalMode === 'view'}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Country</label>
                                <input
                                    type="text"
                                    value={currentClient.country}
                                    onChange={(e) => handleInputChange('country', e.target.value)}
                                    placeholder="Country"
                                    disabled={modalMode === 'view'}
                                />
                            </div>
                            <div className="form-group">
                                <label>Zip Code</label>
                                <input
                                    type="text"
                                    value={currentClient.zipCode}
                                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                                    placeholder="00000"
                                    disabled={modalMode === 'view'}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tax Information */}
                    <div className="form-section">
                        <h4 className="form-section-title">Tax Information</h4>
                        <div className="form-group">
                            <label>RFC / Tax ID</label>
                            <input
                                type="text"
                                value={currentClient.rfc}
                                onChange={(e) => handleInputChange('rfc', e.target.value.toUpperCase())}
                                placeholder="RFC123456ABC"
                                disabled={modalMode === 'view'}
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="form-section">
                        <h4 className="form-section-title">Additional Information</h4>
                        <div className="form-group">
                            <label>Notes</label>
                            <textarea
                                value={currentClient.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                placeholder="Additional notes..."
                                rows={3}
                                disabled={modalMode === 'view'}
                            />
                        </div>
                    </div>

                    {modalMode === 'view' && currentClient.qbSyncStatus && (
                        <div className="form-section">
                            <h4 className="form-section-title">QuickBooks</h4>
                            <div className="form-group">
                                <label>Sync Status</label>
                                <div className="qb-status-display">
                                    <Icon
                                        name={getQBStatusIcon(currentClient.qbSyncStatus).icon}
                                        style={{ color: getQBStatusIcon(currentClient.qbSyncStatus).color }}
                                    />
                                    <span>{getQBStatusIcon(currentClient.qbSyncStatus).label}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {modalMode !== 'view' && (
                        <div className="form-actions">
                            <Button variant="secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="success"
                                icon="save"
                                onClick={handleSave}
                                disabled={!currentClient.name || !currentClient.email}
                            >
                                {modalMode === 'add' ? 'Create client' : 'Save changes'}
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteConfirm}
                title="Delete Client"
                onClose={() => setShowDeleteConfirm(false)}
                icon="warning"
            >
                <div className="delete-confirm">
                    <Icon name="warning" className="warning-icon" />
                    <p>Are you sure you want to delete <strong>{clientToDelete?.name}</strong>?</p>
                    <p className="text-muted">This action cannot be undone.</p>
                    <div className="form-actions">
                        <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
                            Cancel
                        </Button>
                        <Button variant="danger" icon="delete" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default ClientsModule;
