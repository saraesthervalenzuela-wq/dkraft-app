import { useState, useEffect, useRef } from 'react';
import { Icon, SearchBox, Modal, Button, Badge, TableSkeleton, CardSkeleton, IconButton } from '../../common';
import { materialsApi, suppliersApi, categoriesApi, unitsApi } from '../../../services/api';

// Polling interval for QB sync status (30 seconds)
const QB_SYNC_POLL_INTERVAL = 30000;

/**
 * Default data (used if Firebase/API is empty)
 * Field names match MySQL schema for consistency
 */
const defaultSuppliers = [
    { id: '1', name: 'Northern Woods' },
    { id: '2', name: 'Board Supplier Co' },
    { id: '3', name: 'Industrial Hardware' },
    { id: '4', name: 'Blum Mexico' },
    { id: '5', name: 'Industrial Adhesives' },
    { id: '6', name: 'Premium Paints' },
];

const defaultCategories = [
    { id: '1', name: 'Woods' },
    { id: '2', name: 'Hardware' },
    { id: '3', name: 'Adhesives' },
    { id: '4', name: 'Finishes' },
    { id: '5', name: 'Metals' },
    { id: '6', name: 'Plastics' },
];

const defaultUnits = [
    { id: '1', name: 'Sheet', abbreviation: 'sht' },
    { id: '2', name: 'Box', abbreviation: 'box' },
    { id: '3', name: 'Pair', abbreviation: 'pr' },
    { id: '4', name: 'Gallon', abbreviation: 'gal' },
    { id: '5', name: 'Liter', abbreviation: 'L' },
    { id: '6', name: 'Piece', abbreviation: 'pz' },
    { id: '7', name: 'Meter', abbreviation: 'm' },
    { id: '8', name: 'Kg', abbreviation: 'kg' },
];

const accountOptions = [
    { id: 'Materials for Production', name: 'Materials for Production' },
    { id: 'Supplies for Production', name: 'Supplies for Production' },
    { id: 'Manufacturing Services', name: 'Manufacturing Services' },
];

/**
 * Initial materials data matching MySQL schema
 * Fields: id, code_qb, name, description, categoryId, unitId, supplierId,
 *         price, minStock, status, qbListId, qbSyncStatus
 * Empty - materials will be loaded from API or added manually
 */
const initialMaterialsData = [];

/**
 * Empty material template matching MySQL schema
 */
const emptyMaterial = {
    code_qb: '',
    qbSyncStatus: 'pending',
    name: '',
    description: '',
    categoryId: '',
    unitId: '',
    supplierId: '',
    status: 'ACTIVE',
    stock: 0,
    minStock: 0,
    price: 0,
    account: ''
};

/**
 * Status options matching MySQL ENUM
 */
const statusOptions = [
    { value: 'ACTIVE', label: 'Active', color: 'green' },
    { value: 'LOW_STOCK', label: 'Low Stock', color: 'orange' },
    { value: 'INACTIVE', label: 'Inactive', color: 'gray' },
];

const MaterialsModule = () => {
    // Data state
    const [materials, setMaterials] = useState(initialMaterialsData);
    const [suppliers, setSuppliers] = useState(defaultSuppliers);
    const [categories, setCategories] = useState(defaultCategories);
    const [units, setUnits] = useState(defaultUnits);

    // UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [activeTab, setActiveTab] = useState('materials');
    const [viewMode, setViewMode] = useState('table');
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentMaterial, setCurrentMaterial] = useState(emptyMaterial);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState(null);

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
        const pendingMaterials = materials.filter(m => !m.qbListId && m.qbSyncStatus !== 'error');
        setPendingSyncCount(pendingMaterials.length);

        if (pendingMaterials.length > 0) {
            console.log(`[Materials] ${pendingMaterials.length} materials pending QB sync, starting polling...`);

            // Clear existing interval
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }

            // Start polling
            pollIntervalRef.current = setInterval(async () => {
                console.log('[Materials] Polling for QB sync updates...');
                try {
                    const updatedMaterials = await materialsApi.getAll();
                    if (updatedMaterials?.length > 0) {
                        const normalizedMaterials = updatedMaterials.map(normalizeMaterial);

                        // Check for newly synced materials
                        const newlySynced = normalizedMaterials.filter(updated => {
                            const original = materials.find(m => m.id === updated.id);
                            return original && !original.qbListId && updated.qbListId;
                        });

                        if (newlySynced.length > 0) {
                            console.log(`[Materials] ${newlySynced.length} materials synced with QB:`, newlySynced.map(m => m.name));
                        }

                        setMaterials(normalizedMaterials);

                        // Update pending count
                        const stillPending = normalizedMaterials.filter(m => !m.qbListId && m.qbSyncStatus !== 'error');
                        setPendingSyncCount(stillPending.length);

                        // Stop polling if no more pending
                        if (stillPending.length === 0) {
                            console.log('[Materials] All materials synced, stopping polling');
                            clearInterval(pollIntervalRef.current);
                            pollIntervalRef.current = null;
                        }
                    }
                } catch (error) {
                    console.error('[Materials] Polling error:', error);
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
    }, [materials.length]); // Re-run when materials count changes

    /**
     * Load materials and related data from API
     */
    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load all data in parallel
            const [materialsData, suppliersData, categoriesData, unitsData] = await Promise.all([
                materialsApi.getAll(),
                suppliersApi.getAll(),
                categoriesApi.getAll(),
                unitsApi.getAll(),
            ]);

            // Update state with fetched data or keep defaults
            if (materialsData?.length > 0) {
                // Normalize field names if coming from old structure
                const normalizedMaterials = materialsData.map(normalizeMaterial);
                setMaterials(normalizedMaterials);
            }
            if (suppliersData?.length > 0) setSuppliers(suppliersData);
            if (categoriesData?.length > 0) setCategories(categoriesData);
            if (unitsData?.length > 0) setUnits(unitsData);

        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Determine QB sync status based on qbListId presence
     * - If qbListId exists -> 'synced'
     * - If no qbListId and qbSyncStatus is 'error' -> 'error'
     * - Otherwise -> 'pending'
     */
    const getQBSyncStatusFromData = (material) => {
        if (material.qbListId) {
            return 'synced';
        }
        if (material.qbSyncStatus === 'error') {
            return 'error';
        }
        return 'pending';
    };

    /**
     * Normalize material data from different sources to match MySQL schema
     */
    const normalizeMaterial = (m) => {
        // Determine qbSyncStatus based on qbListId
        const qbSyncStatus = getQBSyncStatusFromData(m);

        // If data already has new field names, just update qbSyncStatus
        if (m.code_qb !== undefined) {
            return {
                ...m,
                qbSyncStatus
            };
        }

        // Convert from old Firebase structure to new MySQL structure
        return {
            id: m.id,
            code_qb: m.codeQB || m.code_qb || '',
            qbSyncStatus,
            name: m.material || m.name || '',
            description: m.description || '',
            categoryId: findCategoryId(m.category) || m.categoryId || '',
            unitId: findUnitId(m.unit) || m.unitId || '',
            supplierId: findSupplierId(m.supplier) || m.supplierId || '',
            status: normalizeStatus(m.status),
            stock: m.stockTotal || m.stock || 0,
            minStock: m.minStock || 0,
            price: m.unitPrice || m.price || 0,
            qbListId: m.qbListId || null,
        };
    };

    /**
     * Helper functions to find IDs from names (for backward compatibility)
     */
    const findCategoryId = (categoryName) => {
        if (!categoryName) return '';
        const cat = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
        return cat?.id || '';
    };

    const findSupplierId = (supplierName) => {
        if (!supplierName) return '';
        const sup = suppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
        return sup?.id || '';
    };

    const findUnitId = (unitName) => {
        if (!unitName) return '';
        const unit = units.find(u => u.name.toLowerCase() === unitName.toLowerCase());
        return unit?.id || '';
    };

    /**
     * Normalize status to MySQL ENUM format
     */
    const normalizeStatus = (status) => {
        if (!status) return 'ACTIVE';
        const statusUpper = status.toUpperCase().replace(' ', '_');
        if (['ACTIVE', 'LOW_STOCK', 'INACTIVE'].includes(statusUpper)) {
            return statusUpper;
        }
        // Map old status names
        if (status.toLowerCase() === 'low stock') return 'LOW_STOCK';
        return 'ACTIVE';
    };

    /**
     * Get display values for IDs
     */
    const getCategoryName = (categoryId) => {
        const cat = categories.find(c => c.id === categoryId);
        return cat?.name || '-';
    };

    const getSupplierName = (supplierId) => {
        const sup = suppliers.find(s => s.id === supplierId);
        return sup?.name || '-';
    };

    const getUnitName = (unitId) => {
        const unit = units.find(u => u.id === unitId);
        return unit?.name || '-';
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

    /**
     * Material status styling
     */
    const getStatusStyle = (status) => {
        const statusOpt = statusOptions.find(s => s.value === status);
        return statusOpt || { value: status, label: status, color: 'gray' };
    };

    // Filter materials
    const filteredMaterials = materials.filter(m =>
        m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryName(m.categoryId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getSupplierName(m.supplierId)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.code_qb?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort materials
    const sortedMaterials = [...filteredMaterials].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aVal, bVal;

        // Handle special cases for ID fields
        if (sortConfig.key === 'categoryId') {
            aVal = getCategoryName(a.categoryId).toLowerCase();
            bVal = getCategoryName(b.categoryId).toLowerCase();
        } else if (sortConfig.key === 'supplierId') {
            aVal = getSupplierName(a.supplierId).toLowerCase();
            bVal = getSupplierName(b.supplierId).toLowerCase();
        } else if (sortConfig.key === 'unitId') {
            aVal = getUnitName(a.unitId).toLowerCase();
            bVal = getUnitName(b.unitId).toLowerCase();
        } else {
            aVal = String(a[sortConfig.key] || '').toLowerCase();
            bVal = String(b[sortConfig.key] || '').toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Show all materials (no pagination)
    const displayMaterials = sortedMaterials;

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // const handleSelectAll = (e) => {
    //     if (e.target.checked) {
    //         setSelectedMaterials(displayMaterials.map(m => m.id));
    //     } else {
    //         setSelectedMaterials([]);
    //     }
    // };

    // const handleSelectMaterial = (id) => {
    //     setSelectedMaterials(prev =>
    //         prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    //     );
    // };

    // Modal handlers
    const handleAdd = () => {
        const newCode = `MAT-${String(materials.length + 1).padStart(3, '0')}`;
        setCurrentMaterial({ ...emptyMaterial, code_qb: newCode });
        setModalMode('add');
        setShowModal(true);
    };

    const handleEdit = (material) => {
        setCurrentMaterial({ ...material });
        setModalMode('edit');
        setShowModal(true);
    };

    const handleView = (material) => {
        setCurrentMaterial({ ...material });
        setModalMode('view');
        setShowModal(true);
    };

    const handleDelete = (material) => {
        setMaterialToDelete(material);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
      if (materialToDelete) {
        try {
          await materialsApi.delete(materialToDelete.id);
          setMaterials(prev => prev.filter(m => m.id !== materialToDelete.id));
        } catch (error) {
            console.error('Error deleting material:', error);
        }
      }
      setShowDeleteConfirm(false);
      setMaterialToDelete(null);
    };

    const handleSave = async () => {
      try {
        console.log('[Materials] Mode:', modalMode);
        console.log('[Materials] Data to save:', currentMaterial);

        // Auto-calculate status based on stock vs minStock
        let finalStatus = currentMaterial.status;
        if (currentMaterial.stock <= 0) {
            finalStatus = 'INACTIVE';
        } else if (currentMaterial.stock <= currentMaterial.minStock) {
            finalStatus = 'LOW_STOCK';
        }

        const materialToSave = {
            ...currentMaterial,
            status: finalStatus,
            qbSyncStatus: 'pending',
            skipQBSync: true  // Skip QuickBooks sync for now
        };

        // Remove id for new materials
        if (modalMode === 'add') {
            delete materialToSave.id;
        }

        console.log('[Materials] Final data:', materialToSave);

        if (modalMode === 'add') {
          console.log('[Materials] Calling materialsApi.create...');
          const newMaterial = await materialsApi.create(materialToSave);
          console.log('[Materials] API response:', newMaterial);
          setMaterials(prev => [...prev, { ...materialToSave, id: newMaterial?.id || newMaterial }]);
        } else if (modalMode === 'edit') {
          console.log('[Materials] Calling materialsApi.update...');
          await materialsApi.update(currentMaterial.id, materialToSave);
          setMaterials(prev => prev.map(m => m.id === currentMaterial.id ? materialToSave : m));
        }

        console.log('[Materials] Save successful!');
        setShowModal(false);
        setCurrentMaterial(emptyMaterial);
        // Reload data to get fresh data from server
        await loadData();
      } catch (error) {
        console.error('[Materials] Error saving material:', error);
        alert('Error saving material: ' + error.message);
      }
    };

    const handleInputChange = (field, value) => {
        setCurrentMaterial(prev => ({ ...prev, [field]: value }));
    };

    // Calculate stats
    const totalMaterials = materials.length;
    const totalStock = materials.reduce((sum, m) => sum + (m.stock || 0), 0);
    const lowStockCount = materials.filter(m => m.status === 'LOW_STOCK').length;
    const totalValue = materials.reduce((sum, m) => sum + ((m.stock || 0) * (m.price || 0)), 0);

    return (
        <div className="module-page materials-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">inventory_2</span>
                    </div>
                    <div className="header-text">
                        <h1>Materials</h1>
                        <p>Manage your inventory materials</p>
                    </div>
                </div>
                <div className="header-actions">
                    {pendingSyncCount > 0 && (
                        <div className="qb-sync-indicator pending" title={`${pendingSyncCount} materials pending QB sync`}>
                            <span className="material-symbols-rounded spinning">sync</span>
                            <span className="sync-count">{pendingSyncCount} pending</span>
                        </div>
                    )}
                    {/* <button className={`btn-sync ${isSyncing ? 'syncing' : ''}`} onClick={handleSync} disabled={isSyncing}>
                        <span className="material-symbols-rounded">sync</span>
                        {isSyncing ? 'Syncing...' : 'Sync with QB'}
                    </button> */}
                    <Button variant="orange" icon="add" onClick={handleAdd}>
                        Add material
                    </Button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="module-stats-row">
                <div className="module-stat-card">
                    <div className="stat-icon purple">
                        <Icon name="inventory_2" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{totalMaterials}</span>
                        <span className="stat-label">Total Materials</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon blue">
                        <Icon name="inventory" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{totalStock.toLocaleString()}</span>
                        <span className="stat-label">Total Stock</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon orange">
                        <Icon name="warning" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{lowStockCount}</span>
                        <span className="stat-label">Low Stock</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon green">
                        <Icon name="attach_money" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span className="stat-label">Total Value</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="materials-tabs-grid">
                {[
                    { key: 'materials', label: 'Materials', icon: 'inventory_2', desc: 'Inventory items', color: 'purple', stat: `${totalMaterials} Items` },
                    { key: 'requisitions', label: 'Requisitions', icon: 'request_quote', desc: 'Purchase requests', color: 'blue', stat: '0 Pending' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        className={`materials-tab-card ${activeTab === tab.key ? 'active' : ''} ${tab.color}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <div className="materials-tab-top">
                            <div className={`materials-tab-icon ${tab.color}`}>
                                <Icon name={tab.icon} />
                            </div>
                            <div className={`materials-tab-arrow ${tab.color}`}>
                                <Icon name="arrow_forward" />
                            </div>
                        </div>
                        <div className="materials-tab-content">
                            <span className="materials-tab-label">{tab.label}</span>
                            <span className="materials-tab-desc">{tab.desc}</span>
                        </div>
                        <div className="materials-tab-stat">{tab.stat}</div>
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="materials-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search materials..."
                    className="materials-search"
                />
                <div className="view-toggle">
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

            {isLoading ? (
                viewMode === 'grid' ? (
                    <CardSkeleton count={6} />
                ) : (
                    <TableSkeleton rows={8} columns={6} />
                )
            ) : viewMode === 'grid' ? (
                /* Cards View */
                <div className="materials-cards-grid">
                    {displayMaterials.map((material) => {
                        const qbStatus = getQBStatusIcon(material.qbSyncStatus);
                        const statusStyle = getStatusStyle(material.status);
                        return (
                            <div key={material.id} className="material-card">
                                <div className="material-card-header">
                                    <div className="material-card-icon">
                                        <Icon name="inventory_2" />
                                    </div>
                                    <div className="material-card-badges">
                                        <Badge
                                            variant={statusStyle.color === 'green' ? 'success' : statusStyle.color === 'orange' ? 'warning' : 'default'}
                                            size="sm"
                                            dot
                                        >
                                            {statusStyle.label}
                                        </Badge>
                                        <span className="qb-status-badge" style={{ color: qbStatus.color }} title={qbStatus.label}>
                                            <Icon name={qbStatus.icon} />
                                        </span>
                                    </div>
                                </div>
                                <div className="material-card-body">
                                    <h3 className="material-card-name">{material.name}</h3>
                                    <span className="material-card-code">{material.code_qb}</span>
                                    <div className="material-card-details">
                                        <div className="material-detail">
                                            <Icon name="category" />
                                            <span>{getCategoryName(material.categoryId)}</span>
                                        </div>
                                        <div className="material-detail">
                                            <Icon name="local_shipping" />
                                            <span>{getSupplierName(material.supplierId)}</span>
                                        </div>
                                        <div className="material-detail">
                                            <Icon name="straighten" />
                                            <span>{getUnitName(material.unitId)}</span>
                                        </div>
                                        <div className="material-detail">
                                            <Icon name="attach_money" />
                                            <span>${material.price?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="material-card-footer">
                                    <div className="material-stock">
                                        <span className="stock-label">Stock</span>
                                        <span className="stock-value">
                                            {material.stock} {getUnitName(material.unitId)}
                                            {material.stock <= material.minStock && material.stock > 0 && (
                                                <Icon name="warning" style={{ color: '#f59e0b', marginLeft: '4px', fontSize: '16px' }} />
                                            )}
                                        </span>
                                    </div>
                                    <div className="material-actions">
                                        <IconButton icon="visibility" onClick={() => handleView(material)} title="View" />
                                        <IconButton icon="edit" variant="primary" onClick={() => handleEdit(material)} title="Edit" />
                                        <IconButton icon="delete" variant="danger" onClick={() => handleDelete(material)} title="Delete" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {displayMaterials.length === 0 && (
                        <div className="materials-empty">
                            <Icon name="inventory_2" />
                            <p>No materials found</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Table View */
                <div className="materials-table-container">
                    <table className="materials-table-modern">
                        <thead>
                            <tr>
                                {/* <th className="col-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={displayMaterials.length > 0 && selectedMaterials.length === displayMaterials.length}
                                        onChange={handleSelectAll}
                                    />
                                </th> */}
                                <th className="col-code sortable" onClick={() => handleSort('code_qb')}>
                                    <div className="th-content">
                                        <Icon name="tag" />
                                        <span>Code QB</span>
                                        <Icon name={sortConfig.key === 'code_qb' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} className="sort-icon" />
                                    </div>
                                </th>
                                <th className="col-status-qb">
                                    <div className="th-content">
                                        <Icon name="sync_alt" />
                                        <span>QB</span>
                                    </div>
                                </th>
                                <th className="col-material sortable" onClick={() => handleSort('name')}>
                                    <div className="th-content">
                                        <Icon name="inventory_2" />
                                        <span>Material</span>
                                        <Icon name={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} className="sort-icon" />
                                    </div>
                                </th>
                                <th className="col-category sortable" onClick={() => handleSort('categoryId')}>
                                    <div className="th-content">
                                        <Icon name="category" />
                                        <span>Category</span>
                                        <Icon name={sortConfig.key === 'categoryId' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} className="sort-icon" />
                                    </div>
                                </th>
                                <th className="col-supplier sortable" onClick={() => handleSort('supplierId')}>
                                    <div className="th-content">
                                        <Icon name="local_shipping" />
                                        <span>Supplier</span>
                                        <Icon name={sortConfig.key === 'supplierId' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} className="sort-icon" />
                                    </div>
                                </th>
                                <th className="col-status sortable" onClick={() => handleSort('status')}>
                                    <div className="th-content">
                                        <Icon name="circle" />
                                        <span>Status</span>
                                        <Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} className="sort-icon" />
                                    </div>
                                </th>
                                <th className="col-stock sortable" onClick={() => handleSort('stock')}>
                                    <div className="th-content">
                                        <Icon name="inventory" />
                                        <span>Stock</span>
                                        <Icon name={sortConfig.key === 'stock' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} className="sort-icon" />
                                    </div>
                                </th>
                                <th className="col-price sortable" onClick={() => handleSort('price')}>
                                    <div className="th-content">
                                        <Icon name="attach_money" />
                                        <span>Price</span>
                                        <Icon name={sortConfig.key === 'price' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} className="sort-icon" />
                                    </div>
                                </th>
                                <th className="col-value">
                                    <div className="th-content">
                                        <Icon name="account_balance" />
                                        <span>Total Value</span>
                                    </div>
                                </th>
                                <th className="col-actions">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {displayMaterials.map((material) => {
                                const qbStatus = getQBStatusIcon(material.qbSyncStatus);
                                const statusStyle = getStatusStyle(material.status);
                                const isLowStock = material.stock <= material.minStock && material.stock > 0;
                                const totalValue = (material.stock || 0) * (material.price || 0);

                                return (
                                    <tr key={material.id} className={`table-row ${isLowStock ? 'low-stock-row' : ''}`}>
                                        {/* <td className="col-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={selectedMaterials.includes(material.id)}
                                                onChange={() => handleSelectMaterial(material.id)}
                                            />
                                        </td> */}
                                        <td className="col-code">
                                            <span className="code-badge">{material.code_qb}</span>
                                        </td>
                                        <td className="col-status-qb" title={qbStatus.label}>
                                            <Icon name={qbStatus.icon} style={{ color: qbStatus.color, fontSize: '20px' }} />
                                        </td>
                                        <td className="col-material">
                                            <div className="material-info">
                                                <span className="material-name">{material.name}</span>
                                                {material.description && (
                                                    <span className="material-desc">{material.description}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="col-category">
                                            <span className="category-tag">{getCategoryName(material.categoryId)}</span>
                                        </td>
                                        <td className="col-supplier">{getSupplierName(material.supplierId)}</td>
                                        <td className="col-status">
                                            <Badge
                                                variant={statusStyle.color === 'green' ? 'success' : statusStyle.color === 'orange' ? 'warning' : 'default'}
                                                size="sm"
                                                dot
                                            >
                                                {statusStyle.label}
                                            </Badge>
                                        </td>
                                        <td className="col-stock">
                                            <div className="stock-info">
                                                <span className="stock-value">{material.stock}</span>
                                                <span className="stock-unit">{getUnitName(material.unitId)}</span>
                                                {isLowStock && (
                                                    <Icon name="warning" className="stock-warning" />
                                                )}
                                            </div>
                                            <div className="stock-min">Min: {material.minStock}</div>
                                        </td>
                                        <td className="col-price">
                                            <div className="price-cell">
                                                ${material.price?.toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="col-value">
                                            <div className="value-cell">
                                                ${totalValue.toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="col-actions">
                                            <div className="action-buttons">
                                                {/* <button className="btn-icon-sm" onClick={() => handleView(material)} title="View">
                                                    <Icon name="visibility" />
                                                </button> */}
                                                <IconButton icon="edit" variant="primary" onClick={() => handleEdit(material)} title="Edit" />
                                                <IconButton icon="delete" variant="danger" onClick={() => handleDelete(material)} title="Delete" />
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {displayMaterials.length === 0 && (
                                <tr>
                                    <td colSpan="11" className="empty-state">
                                        <div className="empty-content">
                                            <Icon name="inventory_2" />
                                            <p>No materials found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Footer */}
            {sortedMaterials.length > 0 && (
                <div className="materials-footer">
                    <div className="materials-count">
                        Showing {sortedMaterials.length} {sortedMaterials.length === 1 ? 'material' : 'materials'}
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                title={modalMode === 'add' ? 'Add Material' : modalMode === 'edit' ? 'Edit Material' : 'Material Details'}
                onClose={() => setShowModal(false)}
                icon={modalMode === 'add' ? 'add_box' : modalMode === 'edit' ? 'edit' : 'visibility'}
            >
                <div className="material-form" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Code QB</label>
                            <input
                                type="text"
                                value={currentMaterial.code_qb}
                                onChange={(e) => handleInputChange('code_qb', e.target.value)}
                                placeholder="MAT-001"
                                disabled={modalMode === 'view'}
                            />
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={currentMaterial.status}
                                onChange={(e) => handleInputChange('status', e.target.value)}
                                disabled={modalMode === 'view'}
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Material Name *</label>
                        <input
                            type="text"
                            value={currentMaterial.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="Material name"
                            disabled={modalMode === 'view'}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={currentMaterial.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Material description..."
                            rows={2}
                            disabled={modalMode === 'view'}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Category *</label>
                            <select
                                value={currentMaterial.categoryId}
                                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                                disabled={modalMode === 'view'}
                                required
                            >
                                <option value="">Select category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Account *</label>
                            <select
                                value={currentMaterial.account}
                                onChange={(e) => handleInputChange('account', e.target.value)}
                                disabled={modalMode === 'view'}
                                required
                            >
                                <option value="">Select account</option>
                                {accountOptions.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Unit *</label>
                            <select
                                value={currentMaterial.unitId}
                                onChange={(e) => handleInputChange('unitId', e.target.value)}
                                disabled={modalMode === 'view'}
                                required
                            >
                                <option value="">Select unit</option>
                                {units.map(unit => (
                                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Supplier *</label>
                        <select
                            value={currentMaterial.supplierId}
                            onChange={(e) => handleInputChange('supplierId', e.target.value)}
                            disabled={modalMode === 'view'}
                            required
                        >
                            <option value="">Select supplier</option>
                            {suppliers.map(sup => (
                                <option key={sup.id} value={sup.id}>{sup.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Current Stock</label>
                            <input
                                type="number"
                                value={currentMaterial.stock}
                                onChange={(e) => handleInputChange('stock', Number(e.target.value))}
                                placeholder="0"
                                min="0"
                                disabled={modalMode === 'view'}
                            />
                        </div>
                        <div className="form-group">
                            <label>Minimum Stock</label>
                            <input
                                type="number"
                                value={currentMaterial.minStock}
                                onChange={(e) => handleInputChange('minStock', Number(e.target.value))}
                                placeholder="0"
                                min="0"
                                disabled={modalMode === 'view'}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Unit Price ($)</label>
                        <input
                            type="number"
                            value={currentMaterial.price}
                            onChange={(e) => handleInputChange('price', Number(e.target.value))}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            disabled={modalMode === 'view'}
                        />
                    </div>

                    {modalMode === 'view' && currentMaterial.qbSyncStatus && (
                        <div className="form-group">
                            <label>QuickBooks Status</label>
                            <div className="qb-status-display">
                                <Icon
                                    name={getQBStatusIcon(currentMaterial.qbSyncStatus).icon}
                                    style={{ color: getQBStatusIcon(currentMaterial.qbSyncStatus).color }}
                                />
                                <span>{getQBStatusIcon(currentMaterial.qbSyncStatus).label}</span>
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
                                icon={modalMode === 'add' ? 'add' : 'save'}
                                onClick={handleSave}
                                disabled={!currentMaterial.name || !currentMaterial.categoryId || !currentMaterial.unitId || !currentMaterial.supplierId}
                            >
                                {modalMode === 'add' ? 'Add Material' : 'Save Changes'}
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteConfirm}
                title="Delete Material"
                onClose={() => setShowDeleteConfirm(false)}
                icon="warning"
            >
                <div className="delete-confirm">
                    <Icon name="warning" className="warning-icon" />
                    <p>Are you sure you want to delete <strong>{materialToDelete?.name}</strong>?</p>
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

export default MaterialsModule;
