import { useState, useEffect } from 'react';
import { Icon, SearchBox, Modal, SkeletonStatsRow, SkeletonCard, Skeleton, EmptyState, Toast } from '../../common';
import { supabase } from '../../../lib/supabase';
import { qbwcApi } from '../../../services/quickbooksConnector';
import { billingEntityOptions, shouldSyncToQB } from '../../../constants/billingEntities';

// No local data - all data comes from Supabase

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
    notes: '',
    billingEntity: ''
};

/**
 * Status options matching MySQL ENUM
 */
const statusOptions = [
    { value: 'ACTIVE', label: 'Active', color: 'green' },
    { value: 'INACTIVE', label: 'Inactive', color: 'gray' },
    { value: 'PENDING', label: 'Pending', color: 'orange' },
];

/**
 * Clients Skeleton - Sexy loading state
 */
const ClientsSkeleton = ({ viewMode = 'grid' }) => (
    <div className="module-page clients-module">
        {/* Header skeleton */}
        <div className="page-header">
            <div className="header-content">
                <Skeleton width="48px" height="48px" radius="12px" />
                <div className="header-text">
                    <Skeleton width="120px" height="1.5rem" />
                    <Skeleton width="180px" height="0.875rem" />
                </div>
            </div>
            <div className="header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                <Skeleton width="120px" height="40px" radius="8px" />
                <Skeleton width="140px" height="40px" radius="8px" />
            </div>
        </div>

        {/* Stats skeleton */}
        <SkeletonStatsRow count={4} />

        {/* Toolbar skeleton */}
        <div className="clients-toolbar">
            <Skeleton width="300px" height="44px" radius="8px" />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Skeleton width="80px" height="40px" radius="8px" />
            </div>
        </div>

        {/* Content skeleton */}
        {viewMode === 'grid' ? (
            <div className="clients-cards-grid">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <SkeletonCard key={i} />
                ))}
            </div>
        ) : (
            <div className="skeleton-table skeleton-glow">
                <div className="skeleton-table-header">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Skeleton key={i} width="80%" height="0.75rem" />
                    ))}
                </div>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                    <div key={i} className="skeleton-table-row">
                        {[1, 2, 3, 4, 5, 6].map(j => (
                            <Skeleton key={j} width={j === 1 ? '40px' : '80%'} height="1rem" />
                        ))}
                    </div>
                ))}
            </div>
        )}
    </div>
);

const ClientsModule = () => {
    // Data state
    const [clients, setClients] = useState([]);

    // UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClients, setSelectedClients] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' }); // Newest first
    const [viewMode, setViewMode] = useState('grid');
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [billingEntityFilter, setBillingEntityFilter] = useState('ALL'); // ALL, DOVECREEK, INNOVATIVE

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentClient, setCurrentClient] = useState(emptyClient);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);
    const [toast, setToast] = useState(null);

    // QB Sync status
    const [pendingSyncCount, setPendingSyncCount] = useState(0);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    /**
     * Track pending QB sync count
     */
    useEffect(() => {
        const pendingClients = clients.filter(c =>
            !c.listId &&
            c.qbSyncStatus !== 'error' &&
            shouldSyncToQB(c.billingEntity)
        );
        setPendingSyncCount(pendingClients.length);
    }, [clients]);

    /**
     * Load clients from Supabase
     */
    const loadData = async () => {
        setIsLoading(true);
        try {
            console.log('[Clients] Loading from Supabase...');
            const { data: clientsData, error } = await supabase
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            console.log('[Clients] Loaded:', clientsData?.length, 'clients');

            if (clientsData?.length > 0) {
                const normalizedClients = clientsData.map(normalizeClient);
                setClients(normalizedClients);
            } else {
                setClients([]);
            }
        } catch (error) {
            console.error('[Clients] Error loading:', error);
            setClients([]);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Determine QB sync status based on listId presence
     */
    const getQBSyncStatusFromData = (client) => {
        if (!shouldSyncToQB(client.billing_entity || client.billingEntity)) {
            return 'local_only';
        }
        if (client.listId || client.list_id || client.qb_customer_id) {
            return 'synced';
        }
        if (client.qbSyncStatus === 'error' || client.sync_status === 'error') {
            return 'error';
        }
        return 'pending';
    };

    /**
     * Normalize client data from Supabase to frontend format
     */
    const normalizeClient = (c) => {
        // Determine qbSyncStatus based on listId
        const qbSyncStatus = getQBSyncStatusFromData(c);

        return {
            id: c.id || c.idClient,
            code: c.code || '',
            name: c.name || '',
            companyName: c.company_name || c.company || c.companyName || c.name || '',
            email: c.email || '',
            phone: c.phone || '',
            address: c.address || '',
            city: c.city || '',
            state: c.state || '',
            country: c.country || 'México',
            zipCode: c.postal_code || c.zip || c.zipCode || '',
            rfc: c.tax_id || c.rfc || '',
            contactName: c.contact_name || c.contact || c.contactName || '',
            website: c.website || '',
            status: normalizeStatus(c.status),
            qbSyncStatus,
            listId: c.listId || c.qb_customer_id || null,
            notes: c.notes || '',
            billingEntity: c.billing_entity || '',
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
     * Get avatar color class based on name
     */
    const getAvatarColorClass = (name) => {
        if (!name) return 'color-7';
        // Create a simple hash from the name to get consistent colors
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const colorNum = (hash % 8) + 1;
        return `color-${colorNum}`;
    };

    /**
     * QuickBooks sync status icon
     */
    const getQBStatusIcon = (status) => {
        switch (status) {
            case 'synced': return { icon: 'check_circle', color: '#10b981', label: 'Synced with QB' };
            case 'pending': return { icon: 'schedule', color: '#f59e0b', label: 'Pending QB Sync' };
            case 'error': return { icon: 'error', color: '#ef4444', label: 'Sync Error' };
            case 'local_only': return { icon: 'cloud_off', color: '#64748b', label: 'Local Only' };
            default: return { icon: 'help', color: '#64748b', label: 'Unknown' };
        }
    };

    // Filter clients by billing entity first
    const entityFilteredClients = billingEntityFilter === 'ALL'
        ? clients
        : clients.filter(c => c.billingEntity === billingEntityFilter);

    // Then filter by search term
    const filteredClients = entityFilteredClients.filter(c =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.rfc?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort clients - default newest first
    const sortedClients = [...filteredClients].sort((a, b) => {
        if (!sortConfig.key) {
            // Default: newest first by created_at
            const aDate = new Date(a.created_at || 0);
            const bDate = new Date(b.created_at || 0);
            return bDate - aDate;
        }
        // Handle date fields
        if (sortConfig.key === 'created_at' || sortConfig.key === 'updated_at') {
            const aDate = new Date(a[sortConfig.key] || 0);
            const bDate = new Date(b[sortConfig.key] || 0);
            return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
        }
        // Handle string fields
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
     * Sync pending clients with QuickBooks via QBWC connector
     */
    const handleSync = async () => {
        setIsSyncing(true);
        try {
            // Get clients that need to be synced (no listId)
            const pendingClients = clients.filter(c =>
                !c.listId &&
                c.qbSyncStatus !== 'error' &&
                shouldSyncToQB(c.billingEntity)
            );

            if (pendingClients.length === 0) {
                setToast({ message: 'All clients are already synced!', type: 'info' });
                return;
            }

            let syncedCount = 0;
            let errorCount = 0;

            for (const client of pendingClients) {
                try {
                    // Send to QBWC connector
                    const result = await qbwcApi.customers.add({
                        name: client.companyName || client.name,
                        companyName: client.companyName,
                        firstName: client.contactName?.split(' ')[0] || client.name?.split(' ')[0] || '',
                        lastName: client.contactName?.split(' ').slice(1).join(' ') || client.name?.split(' ').slice(1).join(' ') || '',
                        email: client.email,
                        phone: client.phone,
                        billAddress: {
                            addr1: client.address,
                            city: client.city,
                            state: client.state,
                            postalCode: client.zipCode,
                            country: client.country || 'México',
                        },
                        clientId: client.id,
                    });

                    // If QB returns a listId, update the client in Supabase
                    if (result?.listId) {
                        await supabase
                            .from('clients')
                            .update({
                                list_id: result.listId,
                                edit_sequence: result.editSequence || null,
                                sync_status: 'synced',
                                last_synced_at: new Date().toISOString()
                            })
                            .eq('id', client.id);
                        syncedCount++;
                    }
                } catch (err) {
                    console.error(`[Clients] Error syncing client ${client.name}:`, err);
                    // Mark as error in Supabase
                    await supabase
                        .from('clients')
                        .update({ sync_status: 'error' })
                        .eq('id', client.id);
                    errorCount++;
                }
            }

            // Reload data to reflect changes
            await loadData();

            if (syncedCount > 0) {
                setToast({ message: `${syncedCount} client(s) synced to QuickBooks!`, type: 'success' });
            }
            if (errorCount > 0) {
                setToast({ message: `${errorCount} client(s) failed to sync. Check QBWC connection.`, type: 'error' });
            }
        } catch (error) {
            console.error('[Clients] Error syncing with QB:', error);
            setToast({ message: 'Error connecting to QuickBooks: ' + error.message, type: 'error' });
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
            const { error } = await supabase
                .from('clients')
                .delete()
                .in('id', selectedClients);

            if (error) throw error;

            setClients(prev => prev.filter(c => !selectedClients.includes(c.id)));
            setSelectedClients([]);
        } catch (error) {
            console.error('[Clients] Error deleting:', error);
        }
    };

    const confirmDelete = async () => {
        if (clientToDelete) {
            try {
                const { error } = await supabase
                    .from('clients')
                    .delete()
                    .eq('id', clientToDelete.id);

                if (error) throw error;

                setClients(prev => prev.filter(c => c.id !== clientToDelete.id));
            } catch (error) {
                console.error('[Clients] Error deleting:', error);
            }
        }
        setShowDeleteConfirm(false);
        setClientToDelete(null);
    };

    const handleSave = async () => {
        try {
            console.log('[Clients] Saving client to Supabase');
            console.log('[Clients] Mode:', modalMode);
            console.log('[Clients] Data to save:', currentClient);

            // Build client object - required fields: code, name, email
            const clientToSave = {
                code: currentClient.code || generateClientCode(),
                name: currentClient.name || '',
                email: currentClient.email || '',
                status: currentClient.status || 'ACTIVE',
            };

            // Add optional fields only if they have values (map to Supabase column names)
            if (currentClient.phone?.trim()) clientToSave.phone = currentClient.phone;
            if (currentClient.companyName?.trim()) clientToSave.company_name = currentClient.companyName;
            if (currentClient.contactName?.trim()) clientToSave.contact_name = currentClient.contactName;
            if (currentClient.address?.trim()) clientToSave.address = currentClient.address;
            if (currentClient.city?.trim()) clientToSave.city = currentClient.city;
            if (currentClient.state?.trim()) clientToSave.state = currentClient.state;
            if (currentClient.country?.trim()) clientToSave.country = currentClient.country;
            if (currentClient.zipCode?.trim()) clientToSave.postal_code = currentClient.zipCode;
            if (currentClient.rfc?.trim()) clientToSave.tax_id = currentClient.rfc;
            if (currentClient.notes?.trim()) clientToSave.notes = currentClient.notes;
            if (currentClient.website?.trim()) clientToSave.website = currentClient.website;
            if (currentClient.billingEntity) {
                clientToSave.billing_entity = currentClient.billingEntity;
                clientToSave.sync_status = shouldSyncToQB(currentClient.billingEntity) ? 'pending' : 'local_only';
            }

            console.log('[Clients] Final data:', clientToSave);

            if (modalMode === 'add') {
                console.log('[Clients] Creating in Supabase...');
                const { data: newClient, error } = await supabase
                    .from('clients')
                    .insert(clientToSave)
                    .select()
                    .single();

                if (error) throw error;
                console.log('[Clients] Created:', newClient);
                setClients(prev => [...prev, normalizeClient(newClient)]);
            } else if (modalMode === 'edit') {
                console.log('[Clients] Updating in Supabase...');
                const { error } = await supabase
                    .from('clients')
                    .update({ ...clientToSave, updated_at: new Date().toISOString() })
                    .eq('id', currentClient.id);

                if (error) throw error;
                setClients(prev => prev.map(c => c.id === currentClient.id ? normalizeClient({ ...c, ...clientToSave }) : c));
            }

            console.log('[Clients] Save successful!');
            setShowModal(false);
            setCurrentClient(emptyClient);
            setToast({ message: modalMode === 'add' ? 'Client created successfully!' : 'Client updated successfully!', type: 'success' });
            // Reload data to get fresh data from server
            await loadData();
        } catch (error) {
            console.error('[Clients] Error saving client:', error);
            setToast({ message: 'Error saving client: ' + error.message, type: 'error' });
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
    const dovecreekClients = clients.filter(c => c.billingEntity === 'DOVECREEK').length;
    const innovativeClients = clients.filter(c => c.billingEntity === 'INNOVATIVE').length;

    // Show skeleton while loading
    if (isLoading) {
        return <ClientsSkeleton viewMode={viewMode} />;
    }

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
                    <button className={`btn-sync ${isSyncing ? 'syncing' : ''}`} onClick={handleSync} disabled={isSyncing}>
                        <span className="material-symbols-rounded">sync</span>
                        {isSyncing ? 'Syncing...' : 'Sync with QB'}
                    </button>
                    <button className="btn-primary-action" onClick={handleAdd}>
                        <span className="material-symbols-rounded">add</span>
                        Add new client
                    </button>
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
                <div className="module-stat-card">
                    <div className="stat-icon teal">
                        <Icon name="apartment" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{dovecreekClients}</span>
                        <span className="stat-label">Dovecreek</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon amber">
                        <Icon name="lightbulb" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{innovativeClients}</span>
                        <span className="stat-label">Innovative</span>
                    </div>
                </div>
            </div>

            {/* Billing Entity Filter Tabs */}
            <div className="billing-entity-tabs">
                <button
                    className={`entity-tab ${billingEntityFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setBillingEntityFilter('ALL')}
                >
                    <Icon name="groups" />
                    All Clients
                    <span className="tab-count">{clients.length}</span>
                </button>
                <button
                    className={`entity-tab dovecreek ${billingEntityFilter === 'DOVECREEK' ? 'active' : ''}`}
                    onClick={() => setBillingEntityFilter('DOVECREEK')}
                >
                    <Icon name="business" />
                    Dovecreek
                    <span className="tab-count">{clients.filter(c => c.billingEntity === 'DOVECREEK').length}</span>
                </button>
                <button
                    className={`entity-tab innovative ${billingEntityFilter === 'INNOVATIVE' ? 'active' : ''}`}
                    onClick={() => setBillingEntityFilter('INNOVATIVE')}
                >
                    <Icon name="lightbulb" />
                    Innovative
                    <span className="tab-count">{clients.filter(c => c.billingEntity === 'INNOVATIVE').length}</span>
                </button>
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
                        <button className="btn-delete-selected" onClick={handleDeleteSelected}>
                            <Icon name="delete" />
                            Delete ({selectedClients.length})
                        </button>
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

            {viewMode === 'grid' ? (
                /* Cards View */
                <div className="clients-cards-grid">
                    {sortedClients.map((client) => {
                        const statusStyle = getStatusStyle(client.status);
                        const qbStatus = getQBStatusIcon(client.qbSyncStatus);

                        return (
                            <div key={client.id} className="client-card">
                                <div className="client-card-header">
                                    <div className={`client-avatar ${getAvatarColorClass(client.name)}`}>
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
                        <EmptyState
                            type={searchTerm ? 'search' : 'clients'}
                            onAction={searchTerm ? () => setSearchTerm('') : handleAdd}
                            size="medium"
                        />
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
                                <EmptyState
                                    type={searchTerm ? 'search' : 'clients'}
                                    onAction={searchTerm ? () => setSearchTerm('') : handleAdd}
                                    size="small"
                                />
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
                size="large"
                onSave={modalMode !== 'view' ? handleSave : undefined}
                saveText={modalMode === 'add' ? 'Create Client' : 'Save Changes'}
                saveDisabled={!currentClient.name || !currentClient.email}
                isViewMode={modalMode === 'view'}
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
                                <div className="status-toggle">
                                    <button
                                        type="button"
                                        className={`status-toggle-btn status-active ${currentClient.status === 'ACTIVE' ? 'active' : ''}`}
                                        onClick={() => modalMode !== 'view' && handleInputChange('status', 'ACTIVE')}
                                        disabled={modalMode === 'view'}
                                    >
                                        <span className="status-indicator"></span>
                                        <Icon name="check_circle" />
                                        Active
                                    </button>
                                    <button
                                        type="button"
                                        className={`status-toggle-btn status-inactive ${currentClient.status === 'INACTIVE' ? 'active' : ''}`}
                                        onClick={() => modalMode !== 'view' && handleInputChange('status', 'INACTIVE')}
                                        disabled={modalMode === 'view'}
                                    >
                                        <span className="status-indicator"></span>
                                        <Icon name="cancel" />
                                        Inactive
                                    </button>
                                </div>
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
                                <label>Billing Entity</label>
                                <select
                                    value={currentClient.billingEntity}
                                    onChange={(e) => handleInputChange('billingEntity', e.target.value)}
                                    disabled={modalMode === 'view'}
                                    className="form-select"
                                >
                                    <option value="">-- Select Entity --</option>
                                    {billingEntityOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                {/* Empty for layout balance */}
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

                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteConfirm}
                title="Delete Client"
                onClose={() => setShowDeleteConfirm(false)}
                icon="warning"
                size="small"
                variant="danger"
                onSave={confirmDelete}
                saveText="Delete"
                confirmOnClose={false}
            >
                <div className="delete-confirm">
                    <p>Are you sure you want to delete <strong>{clientToDelete?.name}</strong>?</p>
                    <p className="text-muted">This action cannot be undone.</p>
                </div>
            </Modal>

            {/* Toast Notification */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
};

export default ClientsModule;
