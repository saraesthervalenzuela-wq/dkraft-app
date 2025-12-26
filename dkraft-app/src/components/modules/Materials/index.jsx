import { useState, useEffect } from 'react';
import { Icon, SearchBox, Modal } from '../../common';
import { materialsService, suppliersService } from '../../../firebase';

// Default suppliers (used if Firebase is empty)
const defaultSuppliers = [
    { id: '1', name: 'Northern Woods' },
    { id: '2', name: 'Board Supplier Co' },
    { id: '3', name: 'Industrial Hardware' },
    { id: '4', name: 'Blum Mexico' },
    { id: '5', name: 'Industrial Adhesives' },
    { id: '6', name: 'Premium Paints' },
];

const initialMaterialsData = [
    { id: '1', codeQB: 'MAT-001', statusQB: 'synced', material: 'Pine Plywood 18mm', category: 'Woods', unit: 'Sheet', supplier: 'Northern Woods', status: 'Active', stockTotal: 150, stockByWarehouse: 'Warehouse A', unitPrice: 45.99 },
    { id: '2', codeQB: 'MAT-002', statusQB: 'pending', material: 'MDF 15mm', category: 'Woods', unit: 'Sheet', supplier: 'Board Supplier Co', status: 'Active', stockTotal: 80, stockByWarehouse: 'Warehouse A', unitPrice: 32.50 },
    { id: '3', codeQB: 'MAT-003', statusQB: 'synced', material: 'Screw 2"', category: 'Hardware', unit: 'Box', supplier: 'Industrial Hardware', status: 'Active', stockTotal: 500, stockByWarehouse: 'Warehouse B', unitPrice: 12.99 },
    { id: '4', codeQB: 'MAT-004', statusQB: 'error', material: 'Soft Close Hinge', category: 'Hardware', unit: 'Pair', supplier: 'Blum Mexico', status: 'Low Stock', stockTotal: 25, stockByWarehouse: 'Warehouse A', unitPrice: 8.75 },
    { id: '5', codeQB: 'MAT-005', statusQB: 'synced', material: 'White PVA Glue', category: 'Adhesives', unit: 'Gallon', supplier: 'Industrial Adhesives', status: 'Active', stockTotal: 45, stockByWarehouse: 'Warehouse B', unitPrice: 24.00 },
    { id: '6', codeQB: 'MAT-006', statusQB: 'synced', material: 'Glossy Lacquer', category: 'Finishes', unit: 'Liter', supplier: 'Premium Paints', status: 'Active', stockTotal: 60, stockByWarehouse: 'Warehouse A', unitPrice: 18.50 },
    { id: '7', codeQB: 'MAT-007', statusQB: 'pending', material: 'Telescopic Slide 18"', category: 'Hardware', unit: 'Pair', supplier: 'Blum Mexico', status: 'Inactive', stockTotal: 0, stockByWarehouse: 'Warehouse B', unitPrice: 15.25 },
];

const emptyMaterial = {
    codeQB: '',
    statusQB: 'pending', // Always starts as pending
    material: '',
    category: '',
    unit: '',
    supplier: '',
    status: 'Active',
    stockTotal: 0,
    stockByWarehouse: '',
    unitPrice: 0
};

const MaterialsModule = () => {
    const [materials, setMaterials] = useState(initialMaterialsData);
    const [suppliers, setSuppliers] = useState(defaultSuppliers);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(8);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [activeTab, setActiveTab] = useState('materials');
    const [isSyncing, setIsSyncing] = useState(false);
    const [viewMode, setViewMode] = useState('table');
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit' | 'view'
    const [currentMaterial, setCurrentMaterial] = useState(emptyMaterial);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [materialToDelete, setMaterialToDelete] = useState(null);

    // Load materials and suppliers from Firebase
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load materials
            const materialsData = await materialsService.getAll();
            if (materialsData.length > 0) {
                setMaterials(materialsData);
            }

            // Load suppliers
            const suppliersData = await suppliersService.getAll();
            if (suppliersData.length > 0) {
                setSuppliers(suppliersData);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getQBStatusIcon = (status) => {
        switch (status) {
            case 'synced': return { icon: 'check_circle', color: '#10b981', label: 'Synced' };
            case 'pending': return { icon: 'schedule', color: '#f59e0b', label: 'Pending' };
            case 'error': return { icon: 'error', color: '#ef4444', label: 'Error' };
            default: return { icon: 'help', color: '#64748b', label: 'Unknown' };
        }
    };

    const filteredMaterials = materials.filter(m =>
        m.material?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.supplier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.codeQB?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedMaterials = [...filteredMaterials].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = String(a[sortConfig.key] || '').toLowerCase();
        const bVal = String(b[sortConfig.key] || '').toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

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

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 2000);
    };

    // Modal handlers
    const handleAdd = () => {
        setCurrentMaterial({ ...emptyMaterial, statusQB: 'pending' });
        setModalMode('add');
        setShowModal(true);
    };

    const handleEdit = (material) => {
        setCurrentMaterial(material);
        setModalMode('edit');
        setShowModal(true);
    };

    const handleView = (material) => {
        setCurrentMaterial(material);
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
                await materialsService.delete(materialToDelete.id);
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
            if (modalMode === 'add') {
                // New materials always start with statusQB: 'pending'
                const materialToSave = { ...currentMaterial, statusQB: 'pending' };
                const newMaterial = await materialsService.create(materialToSave);
                setMaterials(prev => [...prev, newMaterial]);
            } else if (modalMode === 'edit') {
                await materialsService.update(currentMaterial.id, currentMaterial);
                setMaterials(prev => prev.map(m => m.id === currentMaterial.id ? currentMaterial : m));
            }
            setShowModal(false);
            setCurrentMaterial(emptyMaterial);
        } catch (error) {
            console.error('Error saving material:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setCurrentMaterial(prev => ({ ...prev, [field]: value }));
    };

    // Calculate stats
    const totalMaterials = materials.length;
    const totalStock = materials.reduce((sum, m) => sum + (m.stockTotal || 0), 0);
    const lowStockCount = materials.filter(m => m.status === 'Low Stock').length;
    const totalValue = materials.reduce((sum, m) => sum + ((m.stockTotal || 0) * (m.unitPrice || 0)), 0);

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
                    <button className={`btn-sync ${isSyncing ? 'syncing' : ''}`} onClick={handleSync}>
                        <span className="material-symbols-rounded">sync</span>
                        {isSyncing ? 'Syncing...' : 'Sync with QB'}
                    </button>
                    <button className="btn-primary-action" onClick={handleAdd}>
                        <span className="material-symbols-rounded">add</span>
                        Add material
                    </button>
                </div>
            </div>

            {/* Numeralia Stats */}
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
                <div className="materials-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading materials...</p>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="materials-cards-grid">
                    {paginatedMaterials.map((material) => {
                        const qbStatus = getQBStatusIcon(material.statusQB);
                        return (
                            <div key={material.id} className="material-card">
                                <div className="material-card-header">
                                    <div className="material-card-icon">
                                        <Icon name="inventory_2" />
                                    </div>
                                    <div className="material-card-badges">
                                        <span className={`status-badge ${material.status?.toLowerCase().replace(' ', '-')}`}>
                                            <span className="status-dot"></span>
                                            {material.status}
                                        </span>
                                        <span className="qb-status-badge" style={{ color: qbStatus.color }} title={qbStatus.label}>
                                            <Icon name={qbStatus.icon} />
                                        </span>
                                    </div>
                                </div>
                                <div className="material-card-body">
                                    <h3 className="material-card-name">{material.material}</h3>
                                    <span className="material-card-code">{material.codeQB}</span>
                                    <div className="material-card-details">
                                        <div className="material-detail">
                                            <Icon name="category" />
                                            <span>{material.category}</span>
                                        </div>
                                        <div className="material-detail">
                                            <Icon name="local_shipping" />
                                            <span>{material.supplier}</span>
                                        </div>
                                        <div className="material-detail">
                                            <Icon name="warehouse" />
                                            <span>{material.stockByWarehouse}</span>
                                        </div>
                                        <div className="material-detail">
                                            <Icon name="attach_money" />
                                            <span>${material.unitPrice?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="material-card-footer">
                                    <div className="material-stock">
                                        <span className="stock-label">Stock</span>
                                        <span className="stock-value">{material.stockTotal} {material.unit}</span>
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
                <div className="materials-table">
                    <div className="materials-table-header">
                        <span className="col-checkbox">
                            <input
                                type="checkbox"
                                checked={paginatedMaterials.length > 0 && selectedMaterials.length === paginatedMaterials.length}
                                onChange={handleSelectAll}
                            />
                        </span>
                        <span className="col-code sortable" onClick={() => handleSort('codeQB')}>
                            Code QB
                            <Icon name={sortConfig.key === 'codeQB' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-status-qb">Status QB</span>
                        <span className="col-material sortable" onClick={() => handleSort('material')}>
                            Material
                            <Icon name={sortConfig.key === 'material' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-category sortable" onClick={() => handleSort('category')}>
                            Category
                            <Icon name={sortConfig.key === 'category' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-unit">Unit</span>
                        <span className="col-supplier sortable" onClick={() => handleSort('supplier')}>
                            Supplier
                            <Icon name={sortConfig.key === 'supplier' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-status sortable" onClick={() => handleSort('status')}>
                            Status
                            <Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-stock">Stock</span>
                        <span className="col-warehouse">Warehouse</span>
                        <span className="col-price sortable" onClick={() => handleSort('unitPrice')}>
                            Unit Price
                            <Icon name={sortConfig.key === 'unitPrice' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-actions">Actions</span>
                    </div>

                    {paginatedMaterials.map((material) => {
                        const qbStatus = getQBStatusIcon(material.statusQB);
                        return (
                            <div key={material.id} className="materials-table-row">
                                <span className="col-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={selectedMaterials.includes(material.id)}
                                        onChange={() => handleSelectMaterial(material.id)}
                                    />
                                </span>
                                <span className="col-code">{material.codeQB}</span>
                                <span className="col-status-qb" title={qbStatus.label}>
                                    <Icon name={qbStatus.icon} style={{ color: qbStatus.color, fontSize: '20px' }} />
                                </span>
                                <span className="col-material">{material.material}</span>
                                <span className="col-category">{material.category}</span>
                                <span className="col-unit">{material.unit}</span>
                                <span className="col-supplier">{material.supplier}</span>
                                <span className={`col-status status-badge ${material.status?.toLowerCase().replace(' ', '-')}`}>
                                    <span className="status-dot"></span>
                                    {material.status}
                                </span>
                                <span className="col-stock">{material.stockTotal}</span>
                                <span className="col-warehouse">{material.stockByWarehouse}</span>
                                <span className="col-price">${material.unitPrice?.toFixed(2)}</span>
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
                title={modalMode === 'add' ? 'Add Material' : modalMode === 'edit' ? 'Edit Material' : 'Material Details'}
                onClose={() => setShowModal(false)}
                icon={modalMode === 'add' ? 'add_box' : modalMode === 'edit' ? 'edit' : 'visibility'}
            >
                <div className="material-form">
                    <div className="form-group">
                        <label>Code QB</label>
                        <input
                            type="text"
                            value={currentMaterial.codeQB}
                            onChange={(e) => handleInputChange('codeQB', e.target.value)}
                            placeholder="MAT-001"
                            disabled={modalMode === 'view'}
                        />
                    </div>

                    <div className="form-group">
                        <label>Material Name</label>
                        <input
                            type="text"
                            value={currentMaterial.material}
                            onChange={(e) => handleInputChange('material', e.target.value)}
                            placeholder="Material name"
                            disabled={modalMode === 'view'}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Category</label>
                            <select
                                value={currentMaterial.category}
                                onChange={(e) => handleInputChange('category', e.target.value)}
                                disabled={modalMode === 'view'}
                            >
                                <option value="">Select category</option>
                                <option value="Woods">Woods</option>
                                <option value="Hardware">Hardware</option>
                                <option value="Adhesives">Adhesives</option>
                                <option value="Finishes">Finishes</option>
                                <option value="Metals">Metals</option>
                                <option value="Plastics">Plastics</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Unit</label>
                            <select
                                value={currentMaterial.unit}
                                onChange={(e) => handleInputChange('unit', e.target.value)}
                                disabled={modalMode === 'view'}
                            >
                                <option value="">Select unit</option>
                                <option value="Sheet">Sheet</option>
                                <option value="Box">Box</option>
                                <option value="Pair">Pair</option>
                                <option value="Gallon">Gallon</option>
                                <option value="Liter">Liter</option>
                                <option value="Piece">Piece</option>
                                <option value="Meter">Meter</option>
                                <option value="Kg">Kg</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Supplier</label>
                        <select
                            value={currentMaterial.supplier}
                            onChange={(e) => handleInputChange('supplier', e.target.value)}
                            disabled={modalMode === 'view'}
                        >
                            <option value="">Select supplier</option>
                            {suppliers.map(supplier => (
                                <option key={supplier.id} value={supplier.name}>
                                    {supplier.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={currentMaterial.status}
                                onChange={(e) => handleInputChange('status', e.target.value)}
                                disabled={modalMode === 'view'}
                            >
                                <option value="Active">Active</option>
                                <option value="Low Stock">Low Stock</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Stock Total</label>
                            <input
                                type="number"
                                value={currentMaterial.stockTotal}
                                onChange={(e) => handleInputChange('stockTotal', Number(e.target.value))}
                                placeholder="0"
                                min="0"
                                disabled={modalMode === 'view'}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Warehouse</label>
                            <select
                                value={currentMaterial.stockByWarehouse}
                                onChange={(e) => handleInputChange('stockByWarehouse', e.target.value)}
                                disabled={modalMode === 'view'}
                            >
                                <option value="">Select warehouse</option>
                                <option value="Warehouse A">Warehouse A</option>
                                <option value="Warehouse B">Warehouse B</option>
                                <option value="Warehouse C">Warehouse C</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Unit Price ($)</label>
                            <input
                                type="number"
                                value={currentMaterial.unitPrice}
                                onChange={(e) => handleInputChange('unitPrice', Number(e.target.value))}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                disabled={modalMode === 'view'}
                            />
                        </div>
                    </div>

                    {modalMode !== 'view' && (
                        <div className="form-actions">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleSave}>
                                {modalMode === 'add' ? 'Add Material' : 'Save Changes'}
                            </button>
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
                    <p>Are you sure you want to delete <strong>{materialToDelete?.material}</strong>?</p>
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

export default MaterialsModule;
