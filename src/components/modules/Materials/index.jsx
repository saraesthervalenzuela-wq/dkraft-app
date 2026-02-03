import { useState, useEffect } from 'react';
import { Icon, SearchBox, Modal, SkeletonStatsRow, Skeleton, Toast } from '../../common';
import { supabase } from '../../../lib/supabase';

// No local data - all data comes from Supabase

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
    account: '',  // QB Account (from QuickBooks connector)
    status: 'ACTIVE',
    stock: 0,
    minStock: 0,
    price: 0
};

/**
 * Status options matching MySQL ENUM
 */
const statusOptions = [
    { value: 'ACTIVE', label: 'Active', color: 'green' },
    { value: 'LOW_STOCK', label: 'Low Stock', color: 'orange' },
    { value: 'INACTIVE', label: 'Inactive', color: 'gray' },
];

/**
 * Materials Skeleton - Sexy loading state
 */
const MaterialsSkeleton = () => (
    <div className="module-page materials-module">
        <div className="page-header">
            <div className="header-content">
                <Skeleton width="48px" height="48px" radius="12px" />
                <div className="header-text">
                    <Skeleton width="140px" height="1.5rem" />
                    <Skeleton width="200px" height="0.875rem" />
                </div>
            </div>
            <div className="header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
                <Skeleton width="120px" height="40px" radius="8px" />
                <Skeleton width="150px" height="40px" radius="8px" />
            </div>
        </div>

        <SkeletonStatsRow count={4} />

        <div className="materials-toolbar">
            <Skeleton width="280px" height="44px" radius="8px" />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Skeleton width="100px" height="40px" radius="8px" />
                <Skeleton width="80px" height="40px" radius="8px" />
            </div>
        </div>

        <div className="skeleton-table skeleton-glow">
            <div className="skeleton-table-header">
                {[1, 2, 3, 4, 5, 6, 7].map(i => (
                    <Skeleton key={i} width="80%" height="0.75rem" />
                ))}
            </div>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="skeleton-table-row">
                    {[1, 2, 3, 4, 5, 6, 7].map(j => (
                        <Skeleton key={j} width={j === 1 ? '24px' : '70%'} height="1rem" />
                    ))}
                </div>
            ))}
        </div>
    </div>
);

const MaterialsModule = ({ setActiveNav }) => {
    // Data state
    const [materials, setMaterials] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [toast, setToast] = useState(null);

    // Warehouse stock state for current material
    const [warehouseStocks, setWarehouseStocks] = useState([]);

    // UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(8);
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' }); // Newest first
    const [activeTab, setActiveTab] = useState('materials');
    const [isSyncing, setIsSyncing] = useState(false);
    const [viewMode, setViewMode] = useState('table');
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentMaterial, setCurrentMaterial] = useState(emptyMaterial);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState(null);

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
        const pendingMaterials = materials.filter(m => !m.qbListId && m.qbSyncStatus !== 'error');
        setPendingSyncCount(pendingMaterials.length);
    }, [materials]);

    /**
     * Load materials and related data from Supabase
     */
    const loadData = async () => {
        setIsLoading(true);
        try {
            console.log('[Materials] Loading from Supabase...');

            // Load all data in parallel
            const [materialsRes, suppliersRes, categoriesRes, unitsRes, warehousesRes] = await Promise.all([
                supabase.from('materials').select('*').order('created_at', { ascending: false }),
                supabase.from('suppliers').select('*').order('name'),
                supabase.from('categories').select('*').order('name'),
                supabase.from('units').select('*').order('name'),
                supabase.from('warehouses').select('*').order('name'),
            ]);

            if (materialsRes.error) throw materialsRes.error;
            if (suppliersRes.error) throw suppliersRes.error;
            if (categoriesRes.error) throw categoriesRes.error;
            if (unitsRes.error) throw unitsRes.error;
            // Warehouses is optional - don't throw if it fails
            if (warehousesRes.error) {
                console.warn('[Materials] Could not load warehouses:', warehousesRes.error);
            }

            console.log('[Materials] Loaded:', materialsRes.data?.length, 'materials');
            console.log('[Materials] Loaded:', warehousesRes.data?.length, 'warehouses');
            console.log('[Materials] Raw materials data:', materialsRes.data);
            console.log('[Materials] Categories loaded:', categoriesRes.data);
            console.log('[Materials] Suppliers loaded:', suppliersRes.data);
            console.log('[Materials] Units loaded:', unitsRes.data);

            // IMPORTANT: Set related data FIRST so lookup functions work
            setSuppliers(suppliersRes.data || []);
            setCategories(categoriesRes.data || []);
            setUnits(unitsRes.data || []);
            setWarehouses(warehousesRes.data || []);

            // Then set materials
            if (materialsRes.data?.length > 0) {
                const normalizedMaterials = materialsRes.data.map(normalizeMaterial);
                console.log('[Materials] Normalized materials:', normalizedMaterials);
                setMaterials(normalizedMaterials);
            } else {
                setMaterials([]);
            }

        } catch (error) {
            console.error('[Materials] Error loading:', error);
            setMaterials([]);
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
     * Normalize material data from Supabase to frontend format
     */
    const normalizeMaterial = (m) => {
        // Determine qbSyncStatus based on qbListId
        const qbSyncStatus = getQBSyncStatusFromData(m);

        return {
            id: m.id,
            code_qb: m.sku || m.code || m.code_qb || '',
            qbSyncStatus,
            name: m.name || '',
            description: m.description || '',
            categoryId: m.category_id || m.categoryId || '',
            unitId: m.unit_id || m.unitId || '',
            supplierId: m.supplier_id || m.supplierId || '',
            account: m.qb_account || m.account || '',
            status: normalizeStatus(m.status),
            stock: m.stock || 0,
            minStock: m.min_stock || m.minStock || 0,
            price: m.unit_cost || m.price || 0,
            qbListId: m.qb_item_id || m.qbListId || null,
            created_at: m.created_at,
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
        if (!categoryId) return '-';
        const cat = categories.find(c => c.id === categoryId);
        if (!cat && categories.length > 0) {
            console.log('[Materials] Category not found for ID:', categoryId, 'Available categories:', categories.map(c => ({ id: c.id, name: c.name })));
        }
        return cat?.name || '-';
    };

    const getSupplierName = (supplierId) => {
        if (!supplierId) return '-';
        const sup = suppliers.find(s => s.id === supplierId);
        if (!sup && suppliers.length > 0) {
            console.log('[Materials] Supplier not found for ID:', supplierId, 'Available suppliers:', suppliers.map(s => ({ id: s.id, name: s.name })));
        }
        return sup?.name || '-';
    };

    const getUnitName = (unitId) => {
        if (!unitId) return '-';
        const unit = units.find(u => u.id === unitId);
        if (!unit && units.length > 0) {
            console.log('[Materials] Unit not found for ID:', unitId, 'Available units:', units.map(u => ({ id: u.id, name: u.name })));
        }
        return unit?.name || '-';
    };

    const getWarehouseName = (warehouseId) => {
        if (!warehouseId) return '-';
        const wh = warehouses.find(w => w.id === warehouseId);
        return wh?.name || '-';
    };

    /**
     * Load warehouse stocks for a material
     */
    const loadWarehouseStocks = async (materialId) => {
        try {
            const { data, error } = await supabase
                .from('material_stock')
                .select('*')
                .eq('material_id', materialId);

            if (error) {
                console.warn('[Materials] Could not load warehouse stocks:', error);
                return [];
            }
            return data || [];
        } catch (error) {
            console.warn('[Materials] Error loading warehouse stocks:', error);
            return [];
        }
    };

    /**
     * Save warehouse stocks for a material
     */
    const saveWarehouseStocks = async (materialId, stocks) => {
        try {
            // Delete existing stocks for this material
            await supabase
                .from('material_stock')
                .delete()
                .eq('material_id', materialId);

            // Insert new stocks (filter out empty ones)
            const validStocks = stocks.filter(s => s.warehouse_id && s.quantity > 0);
            if (validStocks.length > 0) {
                const stocksToInsert = validStocks.map(s => ({
                    material_id: materialId,
                    warehouse_id: s.warehouse_id,
                    quantity: parseFloat(s.quantity) || 0,
                    min_stock: parseFloat(s.min_stock) || 0,
                }));

                const { error } = await supabase
                    .from('material_stock')
                    .insert(stocksToInsert);

                if (error) {
                    console.warn('[Materials] Could not save warehouse stocks:', error);
                }
            }
        } catch (error) {
            console.warn('[Materials] Error saving warehouse stocks:', error);
        }
    };

    /**
     * Add a new warehouse stock entry
     */
    const handleAddWarehouseStock = () => {
        setWarehouseStocks(prev => [...prev, { warehouse_id: '', quantity: 0, min_stock: 0 }]);
    };

    /**
     * Remove a warehouse stock entry
     */
    const handleRemoveWarehouseStock = (index) => {
        setWarehouseStocks(prev => prev.filter((_, i) => i !== index));
    };

    /**
     * Update a warehouse stock entry
     */
    const handleWarehouseStockChange = (index, field, value) => {
        setWarehouseStocks(prev => prev.map((stock, i) =>
            i === index ? { ...stock, [field]: value } : stock
        ));
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

    // Sort materials - default newest first
    const sortedMaterials = [...filteredMaterials].sort((a, b) => {
        // Default: newest first by created_at
        if (!sortConfig.key) {
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

    // Pagination
    const totalPages = Math.ceil(sortedMaterials.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedMaterials = sortedMaterials.slice(startIndex, startIndex + rowsPerPage);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedMaterials(paginatedMaterials.map(m => m.id));
        } else {
            setSelectedMaterials([]);
        }
    };

    const handleSelectMaterial = (id) => {
        setSelectedMaterials(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    /**
     * Sync with QuickBooks (placeholder - QB sync not yet implemented)
     */
    const handleSync = async () => {
        setIsSyncing(true);
        try {
            // QB sync will be implemented when backend is ready
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
        const newCode = `MAT-${String(materials.length + 1).padStart(3, '0')}`;
        setCurrentMaterial({ ...emptyMaterial, code_qb: newCode });
        setWarehouseStocks([]);
        setModalMode('add');
        setShowModal(true);
    };

    const handleEdit = async (material) => {
        setCurrentMaterial({ ...material });
        setModalMode('edit');
        setShowModal(true);
        // Load existing warehouse stocks
        const stocks = await loadWarehouseStocks(material.id);
        setWarehouseStocks(stocks);
    };

    const handleView = async (material) => {
        setCurrentMaterial({ ...material });
        setModalMode('view');
        setShowModal(true);
        // Load existing warehouse stocks
        const stocks = await loadWarehouseStocks(material.id);
        setWarehouseStocks(stocks);
    };

    const handleDelete = (material) => {
        setMaterialToDelete(material);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (materialToDelete) {
            try {
                const { error } = await supabase
                    .from('materials')
                    .delete()
                    .eq('id', materialToDelete.id);

                if (error) throw error;

                setMaterials(prev => prev.filter(m => m.id !== materialToDelete.id));
            } catch (error) {
                console.error('[Materials] Error deleting:', error);
            }
        }
        setShowDeleteConfirm(false);
        setMaterialToDelete(null);
    };

    const handleSave = async () => {
        try {
            console.log('[Materials] Saving material to Supabase');
            console.log('[Materials] Mode:', modalMode);
            console.log('[Materials] Current material state:', currentMaterial);

            // Map camelCase to snake_case for Supabase
            // Based on schema: sku, name, description, category_id, unit_id, supplier_id, unit_cost, status
            // IMPORTANT: Convert empty strings to null for foreign key fields
            const materialToSave = {
                sku: currentMaterial.code_qb || null,
                name: currentMaterial.name || '',
                description: currentMaterial.description || '',
                category_id: currentMaterial.categoryId && currentMaterial.categoryId !== '' ? currentMaterial.categoryId : null,
                unit_id: currentMaterial.unitId && currentMaterial.unitId !== '' ? currentMaterial.unitId : null,
                supplier_id: currentMaterial.supplierId && currentMaterial.supplierId !== '' ? currentMaterial.supplierId : null,
                unit_cost: parseFloat(currentMaterial.price) || 0,
                status: (currentMaterial.status || 'ACTIVE').toLowerCase(),
            };

            // Only add qb_account if the column exists (needs to be added to schema)
            // ALTER TABLE materials ADD COLUMN IF NOT EXISTS qb_account VARCHAR(100);
            if (currentMaterial.account) {
                materialToSave.qb_account = currentMaterial.account;
            }

            console.log('[Materials] Data to save to Supabase:', materialToSave);
            console.log('[Materials] category_id being saved:', materialToSave.category_id);
            console.log('[Materials] unit_id being saved:', materialToSave.unit_id);
            console.log('[Materials] supplier_id being saved:', materialToSave.supplier_id);

            let savedMaterialId = currentMaterial.id;

            if (modalMode === 'add') {
                console.log('[Materials] Creating in Supabase...');
                const { data: newMaterial, error } = await supabase
                    .from('materials')
                    .insert(materialToSave)
                    .select()
                    .single();

                if (error) throw error;
                console.log('[Materials] Created successfully:', newMaterial);
                savedMaterialId = newMaterial.id;
            } else if (modalMode === 'edit') {
                console.log('[Materials] Updating in Supabase with ID:', currentMaterial.id);
                const { data: updatedMaterial, error } = await supabase
                    .from('materials')
                    .update({ ...materialToSave, updated_at: new Date().toISOString() })
                    .eq('id', currentMaterial.id)
                    .select()
                    .single();

                if (error) throw error;
                console.log('[Materials] Updated successfully:', updatedMaterial);
            }

            // Save warehouse stocks
            if (warehouseStocks.length > 0 && savedMaterialId) {
                console.log('[Materials] Saving warehouse stocks...');
                await saveWarehouseStocks(savedMaterialId, warehouseStocks);
            }

            console.log('[Materials] Save successful! Reloading data...');
            setToast({ message: modalMode === 'add' ? 'Material created successfully!' : 'Material updated successfully!', type: 'success' });
            setShowModal(false);
            setCurrentMaterial(emptyMaterial);
            setWarehouseStocks([]);

            // Reload all data from Supabase to ensure UI reflects saved data
            await loadData();
            console.log('[Materials] Data reloaded after save');
        } catch (error) {
            console.error('[Materials] Error saving material:', error);
            setToast({ message: 'Error: ' + error.message, type: 'error' });
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

    // Show skeleton while loading
    if (isLoading) {
        return <MaterialsSkeleton />;
    }

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
                    <button className={`btn-sync ${isSyncing ? 'syncing' : ''}`} onClick={handleSync} disabled={isSyncing}>
                        <span className="material-symbols-rounded">sync</span>
                        {isSyncing ? 'Syncing...' : 'Sync with QB'}
                    </button>
                    <button className="btn-primary-action" onClick={handleAdd}>
                        <span className="material-symbols-rounded">add</span>
                        Add material
                    </button>
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
                    { key: 'materials', label: 'Materials', icon: 'inventory_2', desc: 'Inventory items', color: 'purple', stat: `${totalMaterials} Items`, navTo: null },
                    { key: 'requisitions', label: 'Requisitions', icon: 'request_quote', desc: 'Purchase requests', color: 'blue', stat: '0 Pending', navTo: 'requisitions' }
                ].map(tab => (
                    <button
                        key={tab.key}
                        className={`materials-tab-card ${activeTab === tab.key ? 'active' : ''} ${tab.color}`}
                        onClick={() => tab.navTo && setActiveNav ? setActiveNav(tab.navTo) : setActiveTab(tab.key)}
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

            {viewMode === 'grid' ? (
                /* Cards View */
                <div className="materials-cards-grid">
                    {paginatedMaterials.map((material) => {
                        const qbStatus = getQBStatusIcon(material.qbSyncStatus);
                        const statusStyle = getStatusStyle(material.status);
                        return (
                            <div key={material.id} className="material-card">
                                <div className="material-card-header">
                                    <div className="material-card-icon">
                                        <Icon name="inventory_2" />
                                    </div>
                                    <div className="material-card-badges">
                                        <span className={`status-badge ${statusStyle.color}`}>
                                            <span className="status-dot"></span>
                                            {statusStyle.label}
                                        </span>
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
                                        <button className="btn-icon" onClick={() => handleView(material)} title="View">
                                            <Icon name="visibility" />
                                        </button>
                                        <button className="btn-icon" onClick={() => handleEdit(material)} title="Edit">
                                            <Icon name="edit" />
                                        </button>
                                        <button className="btn-icon danger" onClick={() => handleDelete(material)} title="Delete">
                                            <Icon name="delete" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {paginatedMaterials.length === 0 && (
                        <div className="materials-empty">
                            <Icon name="inventory_2" />
                            <p>No materials found</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Table View */
                <div className="materials-table">
                    <div className="materials-table-header">
                        <span className="col-checkbox">
                            <input
                                type="checkbox"
                                checked={paginatedMaterials.length > 0 && selectedMaterials.length === paginatedMaterials.length}
                                onChange={handleSelectAll}
                            />
                        </span>
                        <span className="col-code sortable" onClick={() => handleSort('code_qb')}>
                            Code QB
                            <Icon name={sortConfig.key === 'code_qb' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-status-qb">QB Status</span>
                        <span className="col-material sortable" onClick={() => handleSort('name')}>
                            Material
                            <Icon name={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-category sortable" onClick={() => handleSort('categoryId')}>
                            Category
                            <Icon name={sortConfig.key === 'categoryId' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-unit">Unit</span>
                        <span className="col-supplier sortable" onClick={() => handleSort('supplierId')}>
                            Supplier
                            <Icon name={sortConfig.key === 'supplierId' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-status sortable" onClick={() => handleSort('status')}>
                            Status
                            <Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-stock sortable" onClick={() => handleSort('stock')}>
                            Stock
                            <Icon name={sortConfig.key === 'stock' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-min-stock">Min</span>
                        <span className="col-price sortable" onClick={() => handleSort('price')}>
                            Price
                            <Icon name={sortConfig.key === 'price' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-actions">Actions</span>
                    </div>

                    {paginatedMaterials.map((material) => {
                        const qbStatus = getQBStatusIcon(material.qbSyncStatus);
                        const statusStyle = getStatusStyle(material.status);
                        const isLowStock = material.stock <= material.minStock && material.stock > 0;

                        return (
                            <div key={material.id} className="materials-table-row">
                                <span className="col-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedMaterials.includes(material.id)}
                                        onChange={() => handleSelectMaterial(material.id)}
                                    />
                                </span>
                                <span className="col-code">{material.code_qb}</span>
                                <span className="col-status-qb" title={qbStatus.label}>
                                    <Icon name={qbStatus.icon} style={{ color: qbStatus.color, fontSize: '20px' }} />
                                </span>
                                <span className="col-material">
                                    <div className="material-info">
                                        <span className="material-name">{material.name}</span>
                                        {material.description && (
                                            <span className="material-desc">{material.description}</span>
                                        )}
                                    </div>
                                </span>
                                <span className="col-category">{getCategoryName(material.categoryId)}</span>
                                <span className="col-unit">{getUnitName(material.unitId)}</span>
                                <span className="col-supplier">{getSupplierName(material.supplierId)}</span>
                                <span className={`col-status status-badge ${statusStyle.color}`}>
                                    <span className="status-dot"></span>
                                    {statusStyle.label}
                                </span>
                                <span className={`col-stock ${isLowStock ? 'low-stock' : ''}`}>
                                    {material.stock}
                                    {isLowStock && <Icon name="warning" style={{ color: '#f59e0b', marginLeft: '4px', fontSize: '14px' }} />}
                                </span>
                                <span className="col-min-stock">{material.minStock}</span>
                                <span className="col-price">${material.price?.toFixed(2)}</span>
                                <span className="col-actions">
                                    <button className="btn-icon" onClick={() => handleView(material)} title="View">
                                        <Icon name="visibility" />
                                    </button>
                                    <button className="btn-icon" onClick={() => handleEdit(material)} title="Edit">
                                        <Icon name="edit" />
                                    </button>
                                    <button className="btn-icon danger" onClick={() => handleDelete(material)} title="Delete">
                                        <Icon name="delete" />
                                    </button>
                                </span>
                            </div>
                        );
                    })}

                    {paginatedMaterials.length === 0 && (
                        <div className="materials-empty">
                            <Icon name="inventory_2" />
                            <p>No materials found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            <div className="materials-footer">
                <div className="materials-count">
                    Showing {sortedMaterials.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + rowsPerPage, sortedMaterials.length)} of {sortedMaterials.length} results
                </div>
                <div className="materials-pagination">
                    <div className="rows-per-page">
                        <span>Rows per page</span>
                        <select value={rowsPerPage} onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}>
                            <option value={5}>5</option>
                            <option value={8}>8</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                        </select>
                    </div>
                    <div className="page-info">
                        Page {currentPage} of {totalPages || 1}
                    </div>
                    <div className="page-controls">
                        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
                            <Icon name="first_page" />
                        </button>
                        <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                            <Icon name="chevron_left" />
                        </button>
                        <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>
                            <Icon name="chevron_right" />
                        </button>
                        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage >= totalPages}>
                            <Icon name="last_page" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                title={modalMode === 'add' ? 'New Material' : modalMode === 'edit' ? 'Edit Material' : 'Material Details'}
                onClose={() => setShowModal(false)}
                icon={modalMode === 'add' ? 'add_box' : modalMode === 'edit' ? 'edit' : 'visibility'}
                size="large"
                onSave={modalMode !== 'view' ? handleSave : undefined}
                saveText={modalMode === 'add' ? 'Add Material' : 'Save Changes'}
                saveDisabled={!currentMaterial.name}
                isViewMode={modalMode === 'view'}
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
                            <div className="status-toggle">
                                <button
                                    type="button"
                                    className={`status-toggle-btn status-active ${currentMaterial.status === 'ACTIVE' ? 'active' : ''}`}
                                    onClick={() => modalMode !== 'view' && handleInputChange('status', 'ACTIVE')}
                                    disabled={modalMode === 'view'}
                                >
                                    <span className="status-indicator"></span>
                                    <Icon name="check_circle" />
                                    Active
                                </button>
                                <button
                                    type="button"
                                    className={`status-toggle-btn status-inactive ${currentMaterial.status === 'INACTIVE' ? 'active' : ''}`}
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

                    <div className="form-group">
                        <label>Account</label>
                        <input
                            type="text"
                            value={currentMaterial.account}
                            onChange={(e) => handleInputChange('account', e.target.value)}
                            placeholder="Account"
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

                    {/* Warehouse Stock Section */}
                    {warehouses.length > 0 && (
                        <div className="form-section" style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <label style={{ margin: 0, fontWeight: 600 }}>
                                    <Icon name="warehouse" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                    Stock by Warehouse
                                </label>
                                {modalMode !== 'view' && (
                                    <button
                                        type="button"
                                        onClick={handleAddWarehouseStock}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            padding: '6px 12px',
                                            background: 'rgba(99, 102, 241, 0.2)',
                                            border: '1px solid rgba(99, 102, 241, 0.4)',
                                            borderRadius: '6px',
                                            color: '#a5b4fc',
                                            cursor: 'pointer',
                                            fontSize: '13px'
                                        }}
                                    >
                                        <Icon name="add" style={{ fontSize: '16px' }} />
                                        Add Warehouse
                                    </button>
                                )}
                            </div>

                            {warehouseStocks.length === 0 ? (
                                <div style={{
                                    padding: '20px',
                                    textAlign: 'center',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '8px',
                                    color: 'rgba(255,255,255,0.5)'
                                }}>
                                    <Icon name="inventory_2" style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }} />
                                    <p style={{ margin: 0 }}>No stock assigned to warehouses</p>
                                    {modalMode !== 'view' && (
                                        <p style={{ margin: '8px 0 0', fontSize: '12px' }}>Click "Add Warehouse" to assign stock</p>
                                    )}
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {warehouseStocks.map((stock, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 100px 100px auto',
                                                gap: '10px',
                                                alignItems: 'center',
                                                padding: '12px',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255,255,255,0.08)'
                                            }}
                                        >
                                            <select
                                                value={stock.warehouse_id}
                                                onChange={(e) => handleWarehouseStockChange(index, 'warehouse_id', e.target.value)}
                                                disabled={modalMode === 'view'}
                                                style={{ padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'inherit' }}
                                            >
                                                <option value="">Select warehouse</option>
                                                {warehouses.map(wh => (
                                                    <option key={wh.id} value={wh.id}>{wh.name}</option>
                                                ))}
                                            </select>
                                            <div>
                                                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>Quantity</label>
                                                <input
                                                    type="number"
                                                    value={stock.quantity}
                                                    onChange={(e) => handleWarehouseStockChange(index, 'quantity', Number(e.target.value))}
                                                    placeholder="0"
                                                    min="0"
                                                    disabled={modalMode === 'view'}
                                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'inherit' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '4px' }}>Minimum</label>
                                                <input
                                                    type="number"
                                                    value={stock.min_stock}
                                                    onChange={(e) => handleWarehouseStockChange(index, 'min_stock', Number(e.target.value))}
                                                    placeholder="0"
                                                    min="0"
                                                    disabled={modalMode === 'view'}
                                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'inherit' }}
                                                />
                                            </div>
                                            {modalMode !== 'view' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveWarehouseStock(index)}
                                                    style={{
                                                        padding: '8px',
                                                        background: 'rgba(239, 68, 68, 0.2)',
                                                        border: '1px solid rgba(239, 68, 68, 0.4)',
                                                        borderRadius: '6px',
                                                        color: '#fca5a5',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                    title="Remove"
                                                >
                                                    <Icon name="delete" style={{ fontSize: '18px' }} />
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {/* Total stock summary */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        padding: '12px',
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        borderRadius: '8px',
                                        marginTop: '8px'
                                    }}>
                                        <span style={{ fontWeight: 600 }}>
                                            <Icon name="inventory" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                                            Total Stock: {warehouseStocks.reduce((sum, s) => sum + (parseFloat(s.quantity) || 0), 0)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

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

                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteConfirm}
                title="Delete Material"
                onClose={() => setShowDeleteConfirm(false)}
                icon="warning"
                size="small"
                variant="danger"
                onSave={confirmDelete}
                saveText="Delete"
                confirmOnClose={false}
            >
                <div className="delete-confirm">
                    <p>Are you sure you want to delete <strong>{materialToDelete?.name}</strong>?</p>
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

export default MaterialsModule;
