import { useState, useEffect } from 'react';
import { Icon, SearchBox, Modal } from '../../common';
import { suppliersService } from '../../../firebase';
import { isApiEnabled, suppliersApi } from '../../../services/api';

/**
 * Initial suppliers data matching MySQL schema
 * Fields: id, name, email, phone, address, city, state, country, zipCode,
 *         rfc, contactName, website, status, qbListId, qbSyncStatus, notes
 */
const initialSuppliersData = [
    {
        id: '1',
        name: 'Northern Woods',
        email: 'sales@northernwoods.com',
        phone: '664 354 1662',
        address: '941 Francisco I. Madero Ave',
        city: 'Tijuana',
        state: 'Baja California',
        country: 'Mexico',
        zipCode: '22000',
        rfc: 'NWO123456ABC',
        contactName: 'John Smith',
        website: 'https://northernwoods.com',
        status: 'ACTIVE',
        qbSyncStatus: 'synced',
        notes: 'Primary wood supplier'
    },
    {
        id: '2',
        name: 'Board Supplier Co',
        email: 'contact@boardsupplier.com',
        phone: '664 555 2233',
        address: '123 Industrial Blvd',
        city: 'Tijuana',
        state: 'Baja California',
        country: 'Mexico',
        zipCode: '22100',
        rfc: 'BSC987654XYZ',
        contactName: 'Maria Garcia',
        website: 'https://boardsupplier.com',
        status: 'ACTIVE',
        qbSyncStatus: 'synced',
        notes: ''
    },
    {
        id: '3',
        name: 'Industrial Hardware',
        email: 'orders@indhardware.com',
        phone: '664 555 3344',
        address: '456 Manufacturing Dr',
        city: 'Tijuana',
        state: 'Baja California',
        country: 'Mexico',
        zipCode: '22200',
        rfc: 'IHW456789DEF',
        contactName: 'Carlos Rodriguez',
        website: 'https://indhardware.com',
        status: 'ACTIVE',
        qbSyncStatus: 'pending',
        notes: 'Hardware and fasteners'
    },
    {
        id: '4',
        name: 'Blum Mexico',
        email: 'ventas@blum.mx',
        phone: '664 555 4455',
        address: '789 Premium Ave',
        city: 'Mexicali',
        state: 'Baja California',
        country: 'Mexico',
        zipCode: '21000',
        rfc: 'BLM321654GHI',
        contactName: 'Ana Martinez',
        website: 'https://blum.com/mx',
        status: 'ACTIVE',
        qbSyncStatus: 'synced',
        notes: 'Premium hinges and slides'
    },
];

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
    notes: ''
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
    const [suppliers, setSuppliers] = useState(initialSuppliersData);

    // UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSuppliers, setSelectedSuppliers] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [viewMode, setViewMode] = useState('grid');
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

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
     * Load suppliers from Firebase or API
     */
    const loadData = async () => {
        setIsLoading(true);
        try {
            const useApi = isApiEnabled();
            const suppliersData = useApi
                ? await suppliersApi.getAll()
                : await suppliersService.getAll();

            if (suppliersData?.length > 0) {
                const normalizedSuppliers = suppliersData.map(normalizeSupplier);
                setSuppliers(normalizedSuppliers);
            }
        } catch (error) {
            console.error('Error loading suppliers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Normalize supplier data to match MySQL schema
     */
    const normalizeSupplier = (s) => {
        if (s.contactName !== undefined && s.qbSyncStatus !== undefined) return s;

        return {
            id: s.id,
            name: s.name || '',
            email: s.email || '',
            phone: s.phone || '',
            address: s.address || '',
            city: s.city || '',
            state: s.state || '',
            country: s.country || 'Mexico',
            zipCode: s.zipCode || '',
            rfc: s.rfc || '',
            contactName: s.contact || s.contactName || '',
            website: s.website || '',
            status: normalizeStatus(s.status),
            qbSyncStatus: s.qbSyncStatus || 'pending',
            qbListId: s.qbListId || null,
            notes: s.notes || '',
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
            case 'synced': return { icon: 'check_circle', color: '#10b981', label: 'Synced' };
            case 'pending': return { icon: 'schedule', color: '#f59e0b', label: 'Pending' };
            case 'error': return { icon: 'error', color: '#ef4444', label: 'Error' };
            default: return { icon: 'help', color: '#64748b', label: 'Unknown' };
        }
    };

    // Filter suppliers
    const filteredSuppliers = suppliers.filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contactName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rfc?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort suppliers
    const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
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
     * Sync with QuickBooks
     */
    const handleSync = async () => {
        setIsSyncing(true);
        try {
            if (isApiEnabled()) {
                // await quickbooksApi.syncSuppliers();
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
            await loadData();
        } catch (error) {
            console.error('Error syncing with QB:', error);
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
            const useApi = isApiEnabled();
            for (const id of selectedSuppliers) {
                if (useApi) {
                    await suppliersApi.delete(id);
                } else {
                    await suppliersService.delete(id);
                }
            }
            setSuppliers(prev => prev.filter(s => !selectedSuppliers.includes(s.id)));
            setSelectedSuppliers([]);
        } catch (error) {
            console.error('Error deleting suppliers:', error);
        }
    };

    const confirmDelete = async () => {
        if (supplierToDelete) {
            try {
                const useApi = isApiEnabled();
                if (useApi) {
                    await suppliersApi.delete(supplierToDelete.id);
                } else {
                    await suppliersService.delete(supplierToDelete.id);
                }
                setSuppliers(prev => prev.filter(s => s.id !== supplierToDelete.id));
            } catch (error) {
                console.error('Error deleting supplier:', error);
            }
        }
        setShowDeleteConfirm(false);
        setSupplierToDelete(null);
    };

    const handleSave = async () => {
        try {
            const useApi = isApiEnabled();
            console.log('[Suppliers] Saving supplier, useApi:', useApi);
            console.log('[Suppliers] Mode:', modalMode);
            console.log('[Suppliers] Data to save:', currentSupplier);

            // Build supplier object - required fields: name, phone, email, status
            const supplierToSave = {
                name: currentSupplier.name || '',
                email: currentSupplier.email || '',
                phone: currentSupplier.phone || '',
                status: currentSupplier.status || 'ACTIVE',
            };

            // Add optional fields only if they have values
            if (currentSupplier.address?.trim()) supplierToSave.address = currentSupplier.address;
            if (currentSupplier.city?.trim()) supplierToSave.city = currentSupplier.city;
            if (currentSupplier.state?.trim()) supplierToSave.state = currentSupplier.state;
            if (currentSupplier.country?.trim()) supplierToSave.country = currentSupplier.country;
            if (currentSupplier.zipCode?.trim()) supplierToSave.zipCode = currentSupplier.zipCode;
            if (currentSupplier.rfc?.trim()) supplierToSave.rfc = currentSupplier.rfc;
            if (currentSupplier.contactName?.trim()) supplierToSave.contactName = currentSupplier.contactName;
            if (currentSupplier.notes?.trim()) supplierToSave.notes = currentSupplier.notes;
            if (currentSupplier.website?.trim()) supplierToSave.website = currentSupplier.website;

            // Include id for edit mode
            if (modalMode === 'edit') {
                supplierToSave.id = currentSupplier.id;
            }

            console.log('[Suppliers] Final data:', supplierToSave);

            if (modalMode === 'add') {
                let newSupplier;
                if (useApi) {
                    console.log('[Suppliers] Calling suppliersApi.create...');
                    newSupplier = await suppliersApi.create(supplierToSave);
                    console.log('[Suppliers] API response:', newSupplier);
                } else {
                    newSupplier = await suppliersService.create(supplierToSave);
                }
                setSuppliers(prev => [...prev, { ...supplierToSave, id: newSupplier?.id || newSupplier }]);
            } else if (modalMode === 'edit') {
                if (useApi) {
                    console.log('[Suppliers] Calling suppliersApi.update...');
                    await suppliersApi.update(currentSupplier.id, supplierToSave);
                } else {
                    await suppliersService.update(currentSupplier.id, supplierToSave);
                }
                setSuppliers(prev => prev.map(s => s.id === currentSupplier.id ? supplierToSave : s));
            }

            console.log('[Suppliers] Save successful!');
            setShowModal(false);
            setCurrentSupplier(emptySupplier);
            // Reload data to get fresh data from server
            await loadData();
        } catch (error) {
            console.error('[Suppliers] Error saving supplier:', error);
            alert('Error saving supplier: ' + error.message);
        }
    };

    const handleInputChange = (field, value) => {
        setCurrentSupplier(prev => ({ ...prev, [field]: value }));
    };

    // Calculate stats
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter(s => s.status === 'ACTIVE').length;
    const inactiveSuppliers = suppliers.filter(s => s.status === 'INACTIVE').length;

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
                                <select
                                    value={currentSupplier.status}
                                    onChange={(e) => handleInputChange('status', e.target.value)}
                                    disabled={modalMode === 'view'}
                                    required
                                >
                                    {statusOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
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

                    {modalMode !== 'view' && (
                        <div className="form-actions">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSave}
                                disabled={!currentSupplier.name || !currentSupplier.email || !currentSupplier.phone || !currentSupplier.status}
                            >
                                <Icon name="save" />
                                {modalMode === 'add' ? 'Create supplier' : 'Save changes'}
                            </button>
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
            >
                <div className="delete-confirm">
                    <Icon name="warning" className="warning-icon" />
                    <p>Are you sure you want to delete <strong>{supplierToDelete?.name}</strong>?</p>
                    <p className="text-muted">This action cannot be undone.</p>
                    <div className="form-actions">
                        <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                            Cancel
                        </button>
                        <button className="btn-danger" onClick={confirmDelete}>
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default SuppliersModule;
