import { useState, useEffect } from 'react';
import { Icon, SearchBox, Modal, Toast } from '../../common';
import { supabase } from '../../../lib/supabase';
import { qbwcApi } from '../../../services/quickbooksConnector';
import { billingEntityOptions, shouldSyncToQB } from '../../../constants/billingEntities';

// Avatar color palette - vibrant and varied
const AVATAR_COLORS = [
    'linear-gradient(135deg, #1a5276 0%, #2874a6 100%)',  // Navy
    'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',  // Green
    'linear-gradient(135deg, #8e44ad 0%, #9b59b6 100%)',  // Purple
    'linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)',  // Red
    'linear-gradient(135deg, #16a085 0%, #1abc9c 100%)',  // Teal
    'linear-gradient(135deg, #d35400 0%, #e67e22 100%)',  // Orange
    'linear-gradient(135deg, #2980b9 0%, #3498db 100%)',  // Blue
    'linear-gradient(135deg, #f39c12 0%, #f1c40f 100%)',  // Yellow
    'linear-gradient(135deg, #6c3483 0%, #8e44ad 100%)',  // Deep Purple
    'linear-gradient(135deg, #0e6655 0%, #148f77 100%)',  // Dark Teal
    'linear-gradient(135deg, #922b21 0%, #c0392b 100%)',  // Dark Red
    'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',  // Dark Blue
];

// Get avatar color by index
const getAvatarColor = (index) => AVATAR_COLORS[index % AVATAR_COLORS.length];

// Supplier categories
const SUPPLIER_CATEGORIES = [
    { id: 'wood', name: 'Wood & Lumber', icon: 'forest', color: '#8B4513' },
    { id: 'hardware', name: 'Hardware & Fasteners', icon: 'build', color: '#607D8B' },
    { id: 'metal', name: 'Metals & Steel', icon: 'iron', color: '#78909C' },
    { id: 'paint', name: 'Paints & Finishes', icon: 'format_paint', color: '#E91E63' },
    { id: 'glass', name: 'Glass & Crystals', icon: 'window', color: '#00BCD4' },
    { id: 'textile', name: 'Textiles & Fabrics', icon: 'checkroom', color: '#9C27B0' },
    { id: 'electronic', name: 'Electronics', icon: 'memory', color: '#4CAF50' },
    { id: 'machinery', name: 'Machinery & Tools', icon: 'precision_manufacturing', color: '#FF5722' },
    { id: 'packaging', name: 'Packaging', icon: 'inventory_2', color: '#795548' },
    { id: 'other', name: 'Other', icon: 'category', color: '#9E9E9E' },
];

// No local data - all data comes from Supabase

/**
 * Empty supplier template matching MySQL schema
 */
const emptySupplier = {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'Mexico',
    zipCode: '',
    rfc: '',
    contactName: '',
    website: '',
    status: 'ACTIVE',
    qbSyncStatus: 'pending',
    notes: '',
    billingEntity: ''
};

/**
 * Status options matching MySQL ENUM
 */
const statusOptions = [
    { value: 'ACTIVE', label: 'Active', color: 'green' },
    { value: 'INACTIVE', label: 'Inactive', color: 'gray' },
];

const SuppliersModule = () => {
    // Data state
    const [suppliers, setSuppliers] = useState([]);
    const [toast, setToast] = useState(null);

    // UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSuppliers, setSelectedSuppliers] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' }); // Newest first
    const [viewMode, setViewMode] = useState('grid');
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [billingEntityFilter, setBillingEntityFilter] = useState('ALL'); // ALL, DOVECREEK, INNOVATIVE
    const [pendingSyncCount, setPendingSyncCount] = useState(0);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentSupplier, setCurrentSupplier] = useState(emptySupplier);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [supplierToDelete, setSupplierToDelete] = useState(null);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    /**
     * Track pending QB sync count
     */
    useEffect(() => {
        const pendingSuppliers = suppliers.filter(s =>
            !s.qbListId &&
            s.qbSyncStatus !== 'error' &&
            shouldSyncToQB(s.billingEntity)
        );
        setPendingSyncCount(pendingSuppliers.length);
    }, [suppliers]);

    /**
     * Load suppliers from Supabase
     */
    const loadData = async () => {
        setIsLoading(true);
        try {
            console.log('[Suppliers] Loading from Supabase...');
            const { data: suppliersData, error } = await supabase
                .from('suppliers')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            console.log('[Suppliers] Loaded:', suppliersData?.length, 'suppliers');

            if (suppliersData?.length > 0) {
                const normalizedSuppliers = suppliersData.map(normalizeSupplier);
                setSuppliers(normalizedSuppliers);
            } else {
                setSuppliers([]);
            }
        } catch (error) {
            console.error('[Suppliers] Error loading:', error);
            setSuppliers([]);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Normalize supplier data from Supabase to frontend format
     */
    const normalizeSupplier = (s) => {
        const entityValue = s.billing_entity || s.billingEntity || '';
        const qbListId = s.list_id || s.qbListId || null;

        let qbSyncStatus;
        if (!shouldSyncToQB(entityValue)) {
            qbSyncStatus = 'local_only';
        } else if (qbListId) {
            qbSyncStatus = 'synced';
        } else if (s.sync_status === 'error' || s.qbSyncStatus === 'error') {
            qbSyncStatus = 'error';
        } else {
            qbSyncStatus = s.sync_status || s.qbSyncStatus || 'pending';
        }

        return {
            id: s.id,
            name: s.name || '',
            email: s.email || '',
            phone: s.phone || '',
            address: s.address || '',
            city: s.city || '',
            state: s.state || '',
            country: s.country || 'Mexico',
            zipCode: s.postal_code || s.zipCode || '',
            rfc: s.tax_id || s.rfc || '',
            contactName: s.contact_name || s.contact || s.contactName || '',
            website: s.website || '',
            status: normalizeStatus(s.status),
            qbSyncStatus,
            qbListId,
            notes: s.notes || '',
            billingEntity: entityValue,
            created_at: s.created_at,
        };
    };

    /**
     * Normalize status to MySQL ENUM format
     */
    const normalizeStatus = (status) => {
        if (!status) return 'ACTIVE';
        const statusUpper = status.toUpperCase();
        if (['ACTIVE', 'INACTIVE'].includes(statusUpper)) {
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
            case 'synced': return { icon: 'check_circle', color: '#10b981', label: 'Synced with QB' };
            case 'pending': return { icon: 'schedule', color: '#f59e0b', label: 'Pending QB Sync' };
            case 'error': return { icon: 'error', color: '#ef4444', label: 'Sync Error' };
            case 'local_only': return { icon: 'cloud_off', color: '#64748b', label: 'Local Only' };
            default: return { icon: 'help', color: '#64748b', label: 'Unknown' };
        }
    };

    // Filter suppliers by billing entity first
    const entityFilteredSuppliers = billingEntityFilter === 'ALL'
        ? suppliers
        : suppliers.filter(s => s.billingEntity === billingEntityFilter);

    // Then filter by search term
    const filteredSuppliers = entityFilteredSuppliers.filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rfc?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort suppliers - default newest first
    const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
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
            setSelectedSuppliers(sortedSuppliers.map(s => s.id));
        } else {
            setSelectedSuppliers([]);
        }
    };

    const handleSelectSupplier = (id) => {
        setSelectedSuppliers(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    /**
     * Sync pending suppliers with QuickBooks via QBWC connector
     */
    const handleSync = async () => {
        setIsSyncing(true);
        try {
            // Get suppliers that need to be synced (no listId, DOVECREEK only)
            const pendingSuppliers = suppliers.filter(s =>
                !s.qbListId &&
                s.qbSyncStatus !== 'error' &&
                shouldSyncToQB(s.billingEntity)
            );

            if (pendingSuppliers.length === 0) {
                setToast({ message: 'All suppliers are already synced!', type: 'info' });
                return;
            }

            let syncedCount = 0;
            let errorCount = 0;

            for (const supplier of pendingSuppliers) {
                try {
                    // Send to QBWC connector as vendor
                    const result = await qbwcApi.vendors.add({
                        name: supplier.name,
                        companyName: supplier.name,
                        firstName: supplier.contactName?.split(' ')[0] || '',
                        lastName: supplier.contactName?.split(' ').slice(1).join(' ') || '',
                        email: supplier.email,
                        phone: supplier.phone,
                        vendorAddress: {
                            addr1: supplier.address,
                            city: supplier.city,
                            state: supplier.state,
                            postalCode: supplier.zipCode,
                            country: supplier.country || 'México',
                        },
                        supplierId: supplier.id,
                    });

                    // If QB returns a listId, update the supplier in Supabase
                    if (result?.listId) {
                        await supabase
                            .from('suppliers')
                            .update({
                                list_id: result.listId,
                                edit_sequence: result.editSequence || null,
                                sync_status: 'synced',
                                last_synced_at: new Date().toISOString()
                            })
                            .eq('id', supplier.id);
                        syncedCount++;
                    }
                } catch (err) {
                    console.error(`[Suppliers] Error syncing supplier ${supplier.name}:`, err);
                    // Mark as error in Supabase
                    await supabase
                        .from('suppliers')
                        .update({ sync_status: 'error' })
                        .eq('id', supplier.id);
                    errorCount++;
                }
            }

            // Reload data to reflect changes
            await loadData();

            if (syncedCount > 0) {
                setToast({ message: `${syncedCount} supplier(s) synced to QuickBooks!`, type: 'success' });
            }
            if (errorCount > 0) {
                setToast({ message: `${errorCount} supplier(s) failed to sync. Check QBWC connection.`, type: 'error' });
            }
        } catch (error) {
            console.error('[Suppliers] Error syncing with QB:', error);
            setToast({ message: 'Error connecting to QuickBooks: ' + error.message, type: 'error' });
        } finally {
            setIsSyncing(false);
        }
    };

    // Modal handlers
    const handleAdd = () => {
        setCurrentSupplier({ ...emptySupplier });
        setModalMode('add');
        setShowModal(true);
    };

    const handleEdit = (supplier) => {
        setCurrentSupplier({ ...supplier });
        setModalMode('edit');
        setShowModal(true);
    };

    const handleView = (supplier) => {
        setCurrentSupplier({ ...supplier });
        setModalMode('view');
        setShowModal(true);
    };

    const handleDelete = (supplier) => {
        setSupplierToDelete(supplier);
        setShowDeleteConfirm(true);
    };

    const handleDeleteSelected = async () => {
        if (selectedSuppliers.length === 0) return;

        try {
            const { error } = await supabase
                .from('suppliers')
                .delete()
                .in('id', selectedSuppliers);

            if (error) throw error;

            setSuppliers(prev => prev.filter(s => !selectedSuppliers.includes(s.id)));
            setSelectedSuppliers([]);
        } catch (error) {
            console.error('[Suppliers] Error deleting:', error);
        }
    };

    const confirmDelete = async () => {
        if (supplierToDelete) {
            try {
                const { error } = await supabase
                    .from('suppliers')
                    .delete()
                    .eq('id', supplierToDelete.id);

                if (error) throw error;

                setSuppliers(prev => prev.filter(s => s.id !== supplierToDelete.id));
            } catch (error) {
                console.error('[Suppliers] Error deleting:', error);
            }
        }
        setShowDeleteConfirm(false);
        setSupplierToDelete(null);
    };

    const handleSave = async () => {
        try {
            console.log('[Suppliers] Saving supplier to Supabase');
            console.log('[Suppliers] Mode:', modalMode);
            console.log('[Suppliers] Data to save:', currentSupplier);

            // Build supplier object - required fields: name, phone, email, status
            const supplierToSave = {
                name: currentSupplier.name || '',
                email: currentSupplier.email || '',
                phone: currentSupplier.phone || '',
                status: currentSupplier.status || 'ACTIVE',
            };

            // Add optional fields only if they have values (map to Supabase column names)
            if (currentSupplier.address?.trim()) supplierToSave.address = currentSupplier.address;
            if (currentSupplier.city?.trim()) supplierToSave.city = currentSupplier.city;
            if (currentSupplier.state?.trim()) supplierToSave.state = currentSupplier.state;
            if (currentSupplier.country?.trim()) supplierToSave.country = currentSupplier.country;
            if (currentSupplier.zipCode?.trim()) supplierToSave.postal_code = currentSupplier.zipCode;
            if (currentSupplier.rfc?.trim()) supplierToSave.tax_id = currentSupplier.rfc;
            if (currentSupplier.contactName?.trim()) supplierToSave.contact_name = currentSupplier.contactName;
            if (currentSupplier.notes?.trim()) supplierToSave.notes = currentSupplier.notes;
            if (currentSupplier.website?.trim()) supplierToSave.website = currentSupplier.website;
            if (currentSupplier.billingEntity) {
                supplierToSave.billing_entity = currentSupplier.billingEntity;
                supplierToSave.sync_status = shouldSyncToQB(currentSupplier.billingEntity) ? 'pending' : 'local_only';
            }

            console.log('[Suppliers] Final data:', supplierToSave);

            if (modalMode === 'add') {
                console.log('[Suppliers] Creating in Supabase...');
                const { data: newSupplier, error } = await supabase
                    .from('suppliers')
                    .insert(supplierToSave)
                    .select()
                    .single();

                if (error) throw error;
                console.log('[Suppliers] Created:', newSupplier);
                setSuppliers(prev => [normalizeSupplier(newSupplier), ...prev]);
            } else if (modalMode === 'edit') {
                console.log('[Suppliers] Updating in Supabase...');
                const { error } = await supabase
                    .from('suppliers')
                    .update({ ...supplierToSave, updated_at: new Date().toISOString() })
                    .eq('id', currentSupplier.id);

                if (error) throw error;
                setSuppliers(prev => prev.map(s => s.id === currentSupplier.id ? normalizeSupplier({ ...s, ...supplierToSave }) : s));
            }

            console.log('[Suppliers] Save successful!');
            setToast({ message: modalMode === 'add' ? 'Supplier created successfully!' : 'Supplier updated successfully!', type: 'success' });
            setShowModal(false);
            setCurrentSupplier(emptySupplier);
            // Reload data to get fresh data from server
            await loadData();
        } catch (error) {
            console.error('[Suppliers] Error saving supplier:', error);
            setToast({ message: 'Error: ' + error.message, type: 'error' });
        }
    };

    const handleInputChange = (field, value) => {
        setCurrentSupplier(prev => ({ ...prev, [field]: value }));
    };

    // Calculate stats
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter(s => s.status === 'ACTIVE').length;
    const inactiveSuppliers = suppliers.filter(s => s.status === 'INACTIVE').length;
    const dovecreekSuppliers = suppliers.filter(s => s.billingEntity === 'DOVECREEK').length;
    const innovativeSuppliers = suppliers.filter(s => s.billingEntity === 'INNOVATIVE').length;

    return (
        <div className="module-page suppliers-module">
            {/* Page Header */}
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">local_shipping</span>
                    </div>
                    <div className="header-text">
                        <h1>Suppliers</h1>
                        <p>Manage your supplier database</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className={`btn-sync ${isSyncing ? 'syncing' : ''}`} onClick={handleSync} disabled={isSyncing}>
                        <span className="material-symbols-rounded">sync</span>
                        {isSyncing ? 'Syncing...' : 'Sync with QB'}
                        {pendingSyncCount > 0 && (
                            <span className="sync-badge">{pendingSyncCount}</span>
                        )}
                    </button>
                    <button className="btn-primary-action" onClick={handleAdd}>
                        <span className="material-symbols-rounded">add</span>
                        Add new supplier
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="module-stats-row">
                <div className="module-stat-card">
                    <div className="stat-icon purple">
                        <Icon name="local_shipping" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{totalSuppliers}</span>
                        <span className="stat-label">Total Suppliers</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon green">
                        <Icon name="check_circle" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{activeSuppliers}</span>
                        <span className="stat-label">Active</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon red">
                        <Icon name="cancel" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{inactiveSuppliers}</span>
                        <span className="stat-label">Inactive</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon teal">
                        <Icon name="apartment" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{dovecreekSuppliers}</span>
                        <span className="stat-label">Dovecreek</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon amber">
                        <Icon name="lightbulb" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{innovativeSuppliers}</span>
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
                    All Suppliers
                    <span className="tab-count">{suppliers.length}</span>
                </button>
                <button
                    className={`entity-tab dovecreek ${billingEntityFilter === 'DOVECREEK' ? 'active' : ''}`}
                    onClick={() => setBillingEntityFilter('DOVECREEK')}
                >
                    <Icon name="business" />
                    Dovecreek
                    <span className="tab-count">{dovecreekSuppliers}</span>
                </button>
                <button
                    className={`entity-tab innovative ${billingEntityFilter === 'INNOVATIVE' ? 'active' : ''}`}
                    onClick={() => setBillingEntityFilter('INNOVATIVE')}
                >
                    <Icon name="lightbulb" />
                    Innovative
                    <span className="tab-count">{innovativeSuppliers}</span>
                </button>
            </div>

            {/* Toolbar */}
            <div className="suppliers-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search suppliers..."
                    className="suppliers-search"
                />
                <div className="toolbar-actions">
                    {selectedSuppliers.length > 0 && (
                        <button className="btn-delete-selected" onClick={handleDeleteSelected}>
                            <Icon name="delete" />
                            Delete ({selectedSuppliers.length})
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

            {isLoading ? (
                <div className="materials-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading suppliers...</p>
                </div>
            ) : viewMode === 'grid' ? (
                /* Cards View */
                <div className="suppliers-cards-grid">
                    {sortedSuppliers.map((supplier) => {
                        const statusStyle = getStatusStyle(supplier.status);
                        const qbStatus = getQBStatusIcon(supplier.qbSyncStatus);

                        return (
                            <div key={supplier.id} className="supplier-card">
                                <div className="supplier-card-header">
                                    <div className="supplier-avatar">
                                        {supplier.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="supplier-card-badges">
                                        <span className={`status-badge ${statusStyle.color}`}>
                                            <span className="status-dot"></span>
                                            {statusStyle.label}
                                        </span>
                                        <span className="qb-status-badge" style={{ color: qbStatus.color }} title={qbStatus.label}>
                                            <Icon name={qbStatus.icon} />
                                        </span>
                                    </div>
                                </div>
                                <div className="supplier-card-body">
                                    <h3 className="supplier-name">{supplier.name}</h3>
                                    <p className="supplier-contact">{supplier.contactName || 'No contact'}</p>
                                    <div className="supplier-details">
                                        <div className="supplier-detail">
                                            <Icon name="mail" />
                                            <span>{supplier.email || '-'}</span>
                                        </div>
                                        <div className="supplier-detail">
                                            <Icon name="phone" />
                                            <span>{supplier.phone || '-'}</span>
                                        </div>
                                        <div className="supplier-detail">
                                            <Icon name="location_on" />
                                            <span>{supplier.city ? `${supplier.city}, ${supplier.state}` : supplier.address || '-'}</span>
                                        </div>
                                        {supplier.rfc && (
                                            <div className="supplier-detail">
                                                <Icon name="badge" />
                                                <span>{supplier.rfc}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="supplier-card-footer">
                                    <button className="btn-icon" onClick={() => handleView(supplier)} title="View">
                                        <Icon name="visibility" />
                                    </button>
                                    <button className="btn-icon" onClick={() => handleEdit(supplier)} title="Edit">
                                        <Icon name="edit" />
                                    </button>
                                    <button className="btn-icon danger" onClick={() => handleDelete(supplier)} title="Delete">
                                        <Icon name="delete" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {sortedSuppliers.length === 0 && (
                        <div className="suppliers-empty-grid">
                            <Icon name="local_shipping" />
                            <p>No suppliers found</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Table View */
                <div className="suppliers-table-container">
                    <div className="suppliers-table">
                        <div className="suppliers-table-header">
                            <span className="col-checkbox">
                                <input
                                    type="checkbox"
                                    checked={sortedSuppliers.length > 0 && selectedSuppliers.length === sortedSuppliers.length}
                                    onChange={handleSelectAll}
                                />
                            </span>
                            <span className="col-name sortable" onClick={() => handleSort('name')}>
                                Name
                                <Icon name={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-email sortable" onClick={() => handleSort('email')}>
                                Email
                                <Icon name={sortConfig.key === 'email' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-status sortable" onClick={() => handleSort('status')}>
                                Status
                                <Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-phone sortable" onClick={() => handleSort('phone')}>
                                Phone
                                <Icon name={sortConfig.key === 'phone' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-address sortable" onClick={() => handleSort('address')}>
                                Address
                                <Icon name={sortConfig.key === 'address' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                        </div>

                        <div className="suppliers-table-body">
                            {sortedSuppliers.map((supplier) => {
                                const statusStyle = getStatusStyle(supplier.status);
                                // Build full address string
                                const fullAddress = [
                                    supplier.address,
                                    supplier.city,
                                    supplier.zipCode,
                                    supplier.state
                                ].filter(Boolean).join(', ') || '-';

                                return (
                                    <div
                                        key={supplier.id}
                                        className="suppliers-table-row clickable"
                                        onClick={() => handleEdit(supplier)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <span className="col-checkbox" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={selectedSuppliers.includes(supplier.id)}
                                                onChange={() => handleSelectSupplier(supplier.id)}
                                            />
                                        </span>
                                        <span className="col-name">{supplier.name}</span>
                                        <span className="col-email">{supplier.email}</span>
                                        <span className={`col-status status-badge ${statusStyle.color}`}>
                                            <span className="status-dot"></span>
                                            {statusStyle.label}
                                        </span>
                                        <span className="col-phone">{supplier.phone}</span>
                                        <span className="col-address">{fullAddress}</span>
                                    </div>
                                );
                            })}

                            {sortedSuppliers.length === 0 && (
                                <div className="suppliers-empty">
                                    <Icon name="local_shipping" />
                                    <p>No suppliers found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="table-footer-simple">
                <span>{sortedSuppliers.length} supplier{sortedSuppliers.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Add/Edit/View Modal */}
            <Modal
                isOpen={showModal}
                title={modalMode === 'add' ? 'New Supplier' : modalMode === 'edit' ? 'Edit Supplier' : 'Supplier Details'}
                onClose={() => setShowModal(false)}
                icon={modalMode === 'add' ? 'add_box' : modalMode === 'edit' ? 'edit' : 'visibility'}
                className="modal-supplier"
                size="large"
                onSave={modalMode !== 'view' ? handleSave : undefined}
                saveText={modalMode === 'add' ? 'Create Supplier' : 'Save Changes'}
                saveDisabled={!currentSupplier.name || !currentSupplier.email || !currentSupplier.phone || !currentSupplier.status}
                isViewMode={modalMode === 'view'}
            >
                <div className="supplier-form" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
                    {/* Basic Information */}
                    <div className="form-section">
                        <h4 className="form-section-title">Basic Information</h4>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Company Name *</label>
                                <input
                                    type="text"
                                    value={currentSupplier.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    placeholder="Supplier name"
                                    disabled={modalMode === 'view'}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Status *</label>
                                <div className="status-toggle">
                                    <button
                                        type="button"
                                        className={`status-toggle-btn status-active ${currentSupplier.status === 'ACTIVE' ? 'active' : ''}`}
                                        onClick={() => modalMode !== 'view' && handleInputChange('status', 'ACTIVE')}
                                        disabled={modalMode === 'view'}
                                    >
                                        <span className="status-indicator"></span>
                                        <Icon name="check_circle" />
                                        Active
                                    </button>
                                    <button
                                        type="button"
                                        className={`status-toggle-btn status-inactive ${currentSupplier.status === 'INACTIVE' ? 'active' : ''}`}
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
                                <label>Email *</label>
                                <input
                                    type="email"
                                    value={currentSupplier.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    placeholder="email@example.com"
                                    disabled={modalMode === 'view'}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Phone *</label>
                                <input
                                    type="tel"
                                    value={currentSupplier.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    placeholder="(555) 555-5555"
                                    disabled={modalMode === 'view'}
                                    required
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Contact Name</label>
                                <input
                                    type="text"
                                    value={currentSupplier.contactName}
                                    onChange={(e) => handleInputChange('contactName', e.target.value)}
                                    placeholder="Contact person"
                                    disabled={modalMode === 'view'}
                                />
                            </div>
                            <div className="form-group">
                                <label>Website</label>
                                <input
                                    type="url"
                                    value={currentSupplier.website}
                                    onChange={(e) => handleInputChange('website', e.target.value)}
                                    placeholder="https://..."
                                    disabled={modalMode === 'view'}
                                />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Billing Entity</label>
                                <select
                                    value={currentSupplier.billingEntity}
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
                    </div>

                    {/* Address Information */}
                    <div className="form-section">
                        <h4 className="form-section-title">Address</h4>
                        <div className="form-group">
                            <label>Street Address</label>
                            <input
                                type="text"
                                value={currentSupplier.address}
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
                                    value={currentSupplier.city}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                    placeholder="City"
                                    disabled={modalMode === 'view'}
                                />
                            </div>
                            <div className="form-group">
                                <label>State</label>
                                <input
                                    type="text"
                                    value={currentSupplier.state}
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
                                    value={currentSupplier.country}
                                    onChange={(e) => handleInputChange('country', e.target.value)}
                                    placeholder="Country"
                                    disabled={modalMode === 'view'}
                                />
                            </div>
                            <div className="form-group">
                                <label>Zip Code</label>
                                <input
                                    type="text"
                                    value={currentSupplier.zipCode}
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
                            <label>RFC</label>
                            <input
                                type="text"
                                value={currentSupplier.rfc}
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
                                value={currentSupplier.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                placeholder="Additional notes..."
                                rows={3}
                                disabled={modalMode === 'view'}
                            />
                        </div>
                    </div>

                    {modalMode === 'view' && currentSupplier.qbSyncStatus && (
                        <div className="form-section">
                            <h4 className="form-section-title">QuickBooks</h4>
                            <div className="form-group">
                                <label>Sync Status</label>
                                <div className="qb-status-display">
                                    <Icon
                                        name={getQBStatusIcon(currentSupplier.qbSyncStatus).icon}
                                        style={{ color: getQBStatusIcon(currentSupplier.qbSyncStatus).color }}
                                    />
                                    <span>{getQBStatusIcon(currentSupplier.qbSyncStatus).label}</span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteConfirm}
                title="Delete Supplier"
                onClose={() => setShowDeleteConfirm(false)}
                icon="warning"
                size="small"
                variant="danger"
                onSave={confirmDelete}
                saveText="Delete"
                confirmOnClose={false}
            >
                <div className="delete-confirm">
                    <p>Are you sure you want to delete <strong>{supplierToDelete?.name}</strong>?</p>
                    <p className="text-muted">This action cannot be undone.</p>
                </div>
            </Modal>

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

export default SuppliersModule;
