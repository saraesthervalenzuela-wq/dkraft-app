import { useState, useEffect } from 'react';
import { Icon, SearchBox, Modal } from '../../common';
import { bomService, productsService, materialsService } from '../../../firebase';
import { bomData, bomStatusOptions, productsData, materialsData } from '../../../data/initialData';

const emptyBOM = {
    code: '',
    name: '',
    productId: null,
    productName: '',
    description: '',
    version: '1.0',
    status: 'Draft',
    components: [],
    totalMaterialCost: 0,
    laborCost: 0,
    overheadCost: 0,
    totalCost: 0,
    margin: 30,
    suggestedPrice: 0
};

const emptyComponent = {
    id: '',
    type: 'material',
    itemId: null,
    itemName: '',
    itemCode: '',
    quantity: 1,
    unit: '',
    unitCost: 0,
    totalCost: 0,
    stockAvailable: 0,
    stockStatus: 'sufficient',
    notes: '',
    subBomId: null
};

const BOMModule = () => {
    const [boms, setBoms] = useState(bomData);
    const [products, setProducts] = useState(productsData);
    const [materials, setMaterials] = useState(materialsData);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBOMs, setSelectedBOMs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(8);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [viewMode, setViewMode] = useState('table');
    const [isLoading, setIsLoading] = useState(true);
    const [expandedRows, setExpandedRows] = useState([]);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentBOM, setCurrentBOM] = useState(emptyBOM);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [bomToDelete, setBomToDelete] = useState(null);

    // Component modal states
    const [showComponentModal, setShowComponentModal] = useState(false);
    const [currentComponent, setCurrentComponent] = useState(emptyComponent);
    const [componentMode, setComponentMode] = useState('add');

    // Load data from Firebase
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [bomsData, productsData, materialsData] = await Promise.all([
                bomService.getAll(),
                productsService.getAll(),
                materialsService.getAll()
            ]);

            if (bomsData.length > 0) setBoms(bomsData);
            if (productsData.length > 0) setProducts(productsData);
            if (materialsData.length > 0) setMaterials(materialsData);
        } catch (error) {
            console.error('Error loading BOM data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Get stock status styling
    const getStockStatusStyle = (status) => {
        switch (status) {
            case 'sufficient': return { color: '#10b981', icon: 'check_circle', label: 'Sufficient' };
            case 'low': return { color: '#f59e0b', icon: 'warning', label: 'Low Stock' };
            case 'insufficient': return { color: '#ef4444', icon: 'error', label: 'Insufficient' };
            default: return { color: '#64748b', icon: 'help', label: 'N/A' };
        }
    };

    // Get status badge class
    const getStatusClass = (status) => {
        switch (status?.toLowerCase()) {
            case 'active': return 'active';
            case 'draft': return 'pending';
            case 'obsolete': return 'inactive';
            default: return '';
        }
    };

    // Filter and sort BOMs
    const filteredBOMs = boms.filter(bom =>
        bom.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bom.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bom.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bom.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedBOMs = [...filteredBOMs].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = String(a[sortConfig.key] || '').toLowerCase();
        const bVal = String(b[sortConfig.key] || '').toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const totalPages = Math.ceil(sortedBOMs.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedBOMs = sortedBOMs.slice(startIndex, startIndex + rowsPerPage);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedBOMs(paginatedBOMs.map(b => b.id));
        } else {
            setSelectedBOMs([]);
        }
    };

    const handleSelectBOM = (id) => {
        setSelectedBOMs(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleRowExpand = (id) => {
        setExpandedRows(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Calculate costs
    const calculateCosts = (components, laborCost = 0, margin = 30) => {
        const totalMaterialCost = components.reduce((sum, c) => sum + (c.totalCost || 0), 0);
        const overheadCost = totalMaterialCost * 0.1; // 10% overhead
        const totalCost = totalMaterialCost + laborCost + overheadCost;
        const suggestedPrice = totalCost * (1 + margin / 100);
        return { totalMaterialCost, overheadCost, totalCost, suggestedPrice };
    };

    // Update stock status for a component based on current materials
    const updateStockStatus = (component) => {
        if (component.type === 'subassembly') {
            return { ...component, stockStatus: 'n/a', stockAvailable: null };
        }
        const material = materials.find(m => m.id === component.itemId);
        if (!material) return component;

        const stockAvailable = material.stock || 0;
        let stockStatus = 'sufficient';
        if (stockAvailable < component.quantity) {
            stockStatus = 'insufficient';
        } else if (stockAvailable < component.quantity * 2) {
            stockStatus = 'low';
        }
        return { ...component, stockAvailable, stockStatus };
    };

    // Modal handlers
    const handleAdd = () => {
        const newCode = `BOM-${String(boms.length + 1).padStart(3, '0')}`;
        setCurrentBOM({ ...emptyBOM, code: newCode });
        setModalMode('add');
        setShowModal(true);
    };

    const handleEdit = (bom) => {
        setCurrentBOM({ ...bom });
        setModalMode('edit');
        setShowModal(true);
    };

    const handleView = (bom) => {
        setCurrentBOM({ ...bom });
        setModalMode('view');
        setShowModal(true);
    };

    const handleDelete = (bom) => {
        setBomToDelete(bom);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (bomToDelete) {
            try {
                await bomService.delete(bomToDelete.id);
                setBoms(prev => prev.filter(b => b.id !== bomToDelete.id));
            } catch (error) {
                console.error('Error deleting BOM:', error);
            }
        }
        setShowDeleteConfirm(false);
        setBomToDelete(null);
    };

    const handleSave = async () => {
        try {
            const costs = calculateCosts(currentBOM.components, currentBOM.laborCost, currentBOM.margin);
            const bomToSave = { ...currentBOM, ...costs };

            if (modalMode === 'add') {
                const newBOM = await bomService.create(bomToSave);
                setBoms(prev => [...prev, { ...bomToSave, id: newBOM.id }]);
            } else if (modalMode === 'edit') {
                await bomService.update(currentBOM.id, bomToSave);
                setBoms(prev => prev.map(b => b.id === currentBOM.id ? bomToSave : b));
            }
            setShowModal(false);
            setCurrentBOM(emptyBOM);
        } catch (error) {
            console.error('Error saving BOM:', error);
        }
    };

    const handleInputChange = (field, value) => {
        setCurrentBOM(prev => {
            const updated = { ...prev, [field]: value };
            // Recalculate costs when labor or margin changes
            if (field === 'laborCost' || field === 'margin') {
                const costs = calculateCosts(updated.components, updated.laborCost, updated.margin);
                return { ...updated, ...costs };
            }
            return updated;
        });
    };

    const handleProductChange = (productId) => {
        const product = products.find(p => p.id === parseInt(productId));
        setCurrentBOM(prev => ({
            ...prev,
            productId: productId ? parseInt(productId) : null,
            productName: product?.name || ''
        }));
    };

    // Component handlers
    const handleAddComponent = () => {
        setCurrentComponent({ ...emptyComponent, id: `comp-${Date.now()}` });
        setComponentMode('add');
        setShowComponentModal(true);
    };

    const handleEditComponent = (component, index) => {
        setCurrentComponent({ ...component, index });
        setComponentMode('edit');
        setShowComponentModal(true);
    };

    const handleRemoveComponent = (index) => {
        const updatedComponents = currentBOM.components.filter((_, i) => i !== index);
        const costs = calculateCosts(updatedComponents, currentBOM.laborCost, currentBOM.margin);
        setCurrentBOM(prev => ({ ...prev, components: updatedComponents, ...costs }));
    };

    const handleComponentChange = (field, value) => {
        setCurrentComponent(prev => {
            const updated = { ...prev, [field]: value };

            // Auto-fill details when material is selected
            if (field === 'itemId' && prev.type === 'material') {
                const material = materials.find(m => m.id === parseInt(value));
                if (material) {
                    updated.itemName = material.name;
                    updated.itemCode = material.code;
                    updated.unit = material.unit;
                    updated.unitCost = material.cost || 0;
                    updated.stockAvailable = material.stock || 0;
                    updated.totalCost = updated.unitCost * updated.quantity;

                    // Calculate stock status
                    if (updated.stockAvailable < updated.quantity) {
                        updated.stockStatus = 'insufficient';
                    } else if (updated.stockAvailable < updated.quantity * 2) {
                        updated.stockStatus = 'low';
                    } else {
                        updated.stockStatus = 'sufficient';
                    }
                }
            }

            // Auto-fill for subassembly
            if (field === 'subBomId' && prev.type === 'subassembly') {
                const subBom = boms.find(b => b.id === parseInt(value));
                if (subBom) {
                    updated.itemName = subBom.name;
                    updated.itemCode = subBom.code;
                    updated.unitCost = subBom.totalCost || 0;
                    updated.totalCost = updated.unitCost * updated.quantity;
                    updated.unit = 'Unit';
                    updated.stockStatus = 'n/a';
                }
            }

            // Recalculate total when quantity changes
            if (field === 'quantity') {
                updated.totalCost = updated.unitCost * parseInt(value) || 0;
            }

            return updated;
        });
    };

    const handleSaveComponent = () => {
        const updatedComponent = updateStockStatus(currentComponent);
        let updatedComponents;

        if (componentMode === 'add') {
            updatedComponents = [...currentBOM.components, updatedComponent];
        } else {
            updatedComponents = currentBOM.components.map((c, i) =>
                i === currentComponent.index ? updatedComponent : c
            );
        }

        const costs = calculateCosts(updatedComponents, currentBOM.laborCost, currentBOM.margin);
        setCurrentBOM(prev => ({ ...prev, components: updatedComponents, ...costs }));
        setShowComponentModal(false);
        setCurrentComponent(emptyComponent);
    };

    // Calculate stats
    const totalBOMs = boms.length;
    const activeBOMs = boms.filter(b => b.status === 'Active').length;
    const totalMaterialCost = boms.reduce((sum, b) => sum + (b.totalMaterialCost || 0), 0);
    const lowStockBOMs = boms.filter(b =>
        b.components?.some(c => c.stockStatus === 'low' || c.stockStatus === 'insufficient')
    ).length;

    return (
        <div className="module-page bom-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">receipt_long</span>
                    </div>
                    <div className="header-text">
                        <h1>Bill of Materials</h1>
                        <p>Manage product compositions and costs</p>
                    </div>
                </div>
                <div className="header-actions">
                    <button className="btn-primary-action" onClick={handleAdd}>
                        <span className="material-symbols-rounded">add</span>
                        New BOM
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="module-stats-row">
                <div className="module-stat-card">
                    <div className="stat-icon purple">
                        <Icon name="receipt_long" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{totalBOMs}</span>
                        <span className="stat-label">Total BOMs</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon green">
                        <Icon name="check_circle" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{activeBOMs}</span>
                        <span className="stat-label">Active BOMs</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon blue">
                        <Icon name="attach_money" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">${totalMaterialCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <span className="stat-label">Total Material Cost</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon orange">
                        <Icon name="warning" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{lowStockBOMs}</span>
                        <span className="stat-label">Low Stock Alerts</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="materials-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search BOMs..."
                    className="materials-search"
                />
                <div className="view-toggle">
                    <button
                        className={`view-toggle-btn ${viewMode === 'cards' ? 'active' : ''}`}
                        onClick={() => setViewMode('cards')}
                        title="Cards view"
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
                    <p>Loading BOMs...</p>
                </div>
            ) : viewMode === 'cards' ? (
                /* Cards View */
                <div className="materials-cards-grid">
                    {paginatedBOMs.map((bom) => {
                        const hasLowStock = bom.components?.some(c => c.stockStatus === 'low' || c.stockStatus === 'insufficient');
                        return (
                            <div key={bom.id} className="material-card">
                                <div className="material-card-header">
                                    <div className="material-card-icon">
                                        <Icon name="receipt_long" />
                                    </div>
                                    <div className="material-card-badges">
                                        <span className={`status-badge ${getStatusClass(bom.status)}`}>
                                            <span className="status-dot"></span>
                                            {bom.status}
                                        </span>
                                        {hasLowStock && (
                                            <span className="stock-alert-badge" title="Has low stock items">
                                                <Icon name="warning" style={{ color: '#f59e0b' }} />
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="material-card-body">
                                    <h3 className="material-card-name">{bom.name}</h3>
                                    <span className="material-card-code">{bom.code}</span>
                                    <div className="material-card-details">
                                        <div className="material-detail">
                                            <Icon name="category" />
                                            <span>{bom.productName || 'No product'}</span>
                                        </div>
                                        <div className="material-detail">
                                            <Icon name="layers" />
                                            <span>{bom.components?.length || 0} components</span>
                                        </div>
                                        <div className="material-detail">
                                            <Icon name="sell" />
                                            <span>v{bom.version}</span>
                                        </div>
                                        <div className="material-detail">
                                            <Icon name="attach_money" />
                                            <span>${bom.totalCost?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="material-card-footer">
                                    <div className="material-stock">
                                        <span className="stock-label">Suggested Price</span>
                                        <span className="stock-value">${bom.suggestedPrice?.toLocaleString()}</span>
                                    </div>
                                    <div className="material-actions">
                                        <button className="btn-icon" onClick={() => handleView(bom)} title="View">
                                            <Icon name="visibility" />
                                        </button>
                                        <button className="btn-icon" onClick={() => handleEdit(bom)} title="Edit">
                                            <Icon name="edit" />
                                        </button>
                                        <button className="btn-icon danger" onClick={() => handleDelete(bom)} title="Delete">
                                            <Icon name="delete" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {paginatedBOMs.length === 0 && (
                        <div className="materials-empty">
                            <Icon name="receipt_long" />
                            <p>No BOMs found</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Table View with Expandable Rows */
                <div className="materials-table bom-table">
                    <div className="materials-table-header">
                        <span className="col-checkbox">
                            <input
                                type="checkbox"
                                checked={paginatedBOMs.length > 0 && selectedBOMs.length === paginatedBOMs.length}
                                onChange={handleSelectAll}
                            />
                        </span>
                        <span className="col-expand"></span>
                        <span className="col-code sortable" onClick={() => handleSort('code')}>
                            Code
                            <Icon name={sortConfig.key === 'code' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-name sortable" onClick={() => handleSort('name')}>
                            BOM Name
                            <Icon name={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-product sortable" onClick={() => handleSort('productName')}>
                            Product
                            <Icon name={sortConfig.key === 'productName' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-components">Components</span>
                        <span className="col-cost sortable" onClick={() => handleSort('totalCost')}>
                            Total Cost
                            <Icon name={sortConfig.key === 'totalCost' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-status sortable" onClick={() => handleSort('status')}>
                            Status
                            <Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                        </span>
                        <span className="col-stock-status">Stock</span>
                        <span className="col-actions">Actions</span>
                    </div>

                    {paginatedBOMs.map((bom) => {
                        const isExpanded = expandedRows.includes(bom.id);
                        const hasLowStock = bom.components?.some(c => c.stockStatus === 'low' || c.stockStatus === 'insufficient');
                        const stockStatus = hasLowStock ? getStockStatusStyle('low') : getStockStatusStyle('sufficient');

                        return (
                            <div key={bom.id} className="bom-row-container">
                                <div className={`materials-table-row ${isExpanded ? 'expanded' : ''}`}>
                                    <span className="col-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedBOMs.includes(bom.id)}
                                            onChange={() => handleSelectBOM(bom.id)}
                                        />
                                    </span>
                                    <span className="col-expand">
                                        <button
                                            className="btn-expand"
                                            onClick={() => toggleRowExpand(bom.id)}
                                            title={isExpanded ? 'Collapse' : 'Expand'}
                                        >
                                            <Icon name={isExpanded ? 'expand_less' : 'expand_more'} />
                                        </button>
                                    </span>
                                    <span className="col-code">{bom.code}</span>
                                    <span className="col-name">{bom.name}</span>
                                    <span className="col-product">{bom.productName || '-'}</span>
                                    <span className="col-components">{bom.components?.length || 0} items</span>
                                    <span className="col-cost">${bom.totalCost?.toLocaleString()}</span>
                                    <span className={`col-status status-badge ${getStatusClass(bom.status)}`}>
                                        <span className="status-dot"></span>
                                        {bom.status}
                                    </span>
                                    <span className="col-stock-status" title={stockStatus.label}>
                                        <Icon name={stockStatus.icon} style={{ color: stockStatus.color, fontSize: '20px' }} />
                                    </span>
                                    <span className="col-actions">
                                        <button className="btn-icon" onClick={() => handleView(bom)} title="View">
                                            <Icon name="visibility" />
                                        </button>
                                        <button className="btn-icon" onClick={() => handleEdit(bom)} title="Edit">
                                            <Icon name="edit" />
                                        </button>
                                        <button className="btn-icon danger" onClick={() => handleDelete(bom)} title="Delete">
                                            <Icon name="delete" />
                                        </button>
                                    </span>
                                </div>

                                {/* Expanded Components */}
                                {isExpanded && bom.components && bom.components.length > 0 && (
                                    <div className="bom-components-expanded">
                                        <div className="components-header">
                                            <span className="comp-type">Type</span>
                                            <span className="comp-code">Code</span>
                                            <span className="comp-name">Component</span>
                                            <span className="comp-qty">Qty</span>
                                            <span className="comp-unit">Unit</span>
                                            <span className="comp-unit-cost">Unit Cost</span>
                                            <span className="comp-total">Total</span>
                                            <span className="comp-stock">Stock</span>
                                        </div>
                                        {bom.components.map((comp, idx) => {
                                            const compStockStatus = getStockStatusStyle(comp.stockStatus);
                                            return (
                                                <div key={comp.id || idx} className="component-row">
                                                    <span className="comp-type">
                                                        <Icon name={comp.type === 'material' ? 'inventory_2' : 'account_tree'} />
                                                    </span>
                                                    <span className="comp-code">{comp.itemCode}</span>
                                                    <span className="comp-name">{comp.itemName}</span>
                                                    <span className="comp-qty">{comp.quantity}</span>
                                                    <span className="comp-unit">{comp.unit}</span>
                                                    <span className="comp-unit-cost">${comp.unitCost?.toLocaleString()}</span>
                                                    <span className="comp-total">${comp.totalCost?.toLocaleString()}</span>
                                                    <span className="comp-stock" title={compStockStatus.label}>
                                                        <Icon name={compStockStatus.icon} style={{ color: compStockStatus.color }} />
                                                        {comp.stockStatus !== 'n/a' && <span>{comp.stockAvailable}</span>}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                        <div className="components-footer">
                                            <span className="footer-label">Material Cost:</span>
                                            <span className="footer-value">${bom.totalMaterialCost?.toLocaleString()}</span>
                                            <span className="footer-label">Labor:</span>
                                            <span className="footer-value">${bom.laborCost?.toLocaleString()}</span>
                                            <span className="footer-label">Overhead:</span>
                                            <span className="footer-value">${bom.overheadCost?.toLocaleString()}</span>
                                            <span className="footer-label total">Total:</span>
                                            <span className="footer-value total">${bom.totalCost?.toLocaleString()}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {paginatedBOMs.length === 0 && (
                        <div className="materials-empty">
                            <Icon name="receipt_long" />
                            <p>No BOMs found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Pagination */}
            <div className="materials-footer">
                <div className="materials-count">
                    Showing {sortedBOMs.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + rowsPerPage, sortedBOMs.length)} of {sortedBOMs.length} results
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

            {/* Add/Edit BOM Modal */}
            <Modal
                isOpen={showModal}
                title={modalMode === 'add' ? 'New BOM' : modalMode === 'edit' ? 'Edit BOM' : 'BOM Details'}
                onClose={() => setShowModal(false)}
                icon={modalMode === 'add' ? 'add_box' : modalMode === 'edit' ? 'edit' : 'visibility'}
            >
                <div className="bom-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>BOM Code</label>
                            <input
                                type="text"
                                value={currentBOM.code}
                                onChange={(e) => handleInputChange('code', e.target.value)}
                                placeholder="BOM-001"
                                disabled={modalMode === 'view'}
                            />
                        </div>
                        <div className="form-group">
                            <label>Version</label>
                            <input
                                type="text"
                                value={currentBOM.version}
                                onChange={(e) => handleInputChange('version', e.target.value)}
                                placeholder="1.0"
                                disabled={modalMode === 'view'}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>BOM Name</label>
                        <input
                            type="text"
                            value={currentBOM.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            placeholder="BOM name"
                            disabled={modalMode === 'view'}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Product (Optional)</label>
                            <select
                                value={currentBOM.productId || ''}
                                onChange={(e) => handleProductChange(e.target.value)}
                                disabled={modalMode === 'view'}
                            >
                                <option value="">Select product</option>
                                {products.map(product => (
                                    <option key={product.id} value={product.id}>
                                        {product.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={currentBOM.status}
                                onChange={(e) => handleInputChange('status', e.target.value)}
                                disabled={modalMode === 'view'}
                            >
                                {bomStatusOptions.map(status => (
                                    <option key={status} value={status}>{status}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={currentBOM.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="BOM description..."
                            rows={2}
                            disabled={modalMode === 'view'}
                        />
                    </div>

                    {/* Components Section */}
                    <div className="form-section">
                        <div className="section-header">
                            <h3>Components</h3>
                            {modalMode !== 'view' && (
                                <button className="btn-add-component" onClick={handleAddComponent}>
                                    <Icon name="add" /> Add Component
                                </button>
                            )}
                        </div>

                        {currentBOM.components && currentBOM.components.length > 0 ? (
                            <div className="components-list">
                                {currentBOM.components.map((comp, index) => {
                                    const compStockStatus = getStockStatusStyle(comp.stockStatus);
                                    return (
                                        <div key={comp.id || index} className="component-item">
                                            <div className="component-info">
                                                <Icon name={comp.type === 'material' ? 'inventory_2' : 'account_tree'} />
                                                <div className="component-details">
                                                    <span className="component-name">{comp.itemName}</span>
                                                    <span className="component-meta">
                                                        {comp.itemCode} | {comp.quantity} {comp.unit} @ ${comp.unitCost?.toLocaleString()} = ${comp.totalCost?.toLocaleString()}
                                                    </span>
                                                </div>
                                                <span className="component-stock" title={compStockStatus.label}>
                                                    <Icon name={compStockStatus.icon} style={{ color: compStockStatus.color }} />
                                                </span>
                                            </div>
                                            {modalMode !== 'view' && (
                                                <div className="component-actions">
                                                    <button className="btn-icon" onClick={() => handleEditComponent(comp, index)}>
                                                        <Icon name="edit" />
                                                    </button>
                                                    <button className="btn-icon danger" onClick={() => handleRemoveComponent(index)}>
                                                        <Icon name="delete" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="no-components">
                                <Icon name="layers" />
                                <p>No components added yet</p>
                            </div>
                        )}
                    </div>

                    {/* Costs Section */}
                    <div className="form-section costs-section">
                        <h3>Cost Summary</h3>
                        <div className="costs-grid">
                            <div className="cost-item">
                                <label>Material Cost</label>
                                <span className="cost-value">${currentBOM.totalMaterialCost?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="cost-item editable">
                                <label>Labor Cost</label>
                                <input
                                    type="number"
                                    value={currentBOM.laborCost || 0}
                                    onChange={(e) => handleInputChange('laborCost', parseFloat(e.target.value) || 0)}
                                    min="0"
                                    step="0.01"
                                    disabled={modalMode === 'view'}
                                />
                            </div>
                            <div className="cost-item">
                                <label>Overhead (10%)</label>
                                <span className="cost-value">${currentBOM.overheadCost?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="cost-item total">
                                <label>Total Cost</label>
                                <span className="cost-value">${currentBOM.totalCost?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="cost-item editable">
                                <label>Margin %</label>
                                <input
                                    type="number"
                                    value={currentBOM.margin || 30}
                                    onChange={(e) => handleInputChange('margin', parseFloat(e.target.value) || 0)}
                                    min="0"
                                    max="100"
                                    disabled={modalMode === 'view'}
                                />
                            </div>
                            <div className="cost-item suggested">
                                <label>Suggested Price</label>
                                <span className="cost-value">${currentBOM.suggestedPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>

                    {modalMode !== 'view' && (
                        <div className="form-actions">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleSave}>
                                {modalMode === 'add' ? 'Create BOM' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Add Component Modal */}
            <Modal
                isOpen={showComponentModal}
                title={componentMode === 'add' ? 'Add Component' : 'Edit Component'}
                onClose={() => setShowComponentModal(false)}
                icon="add_circle"
            >
                <div className="component-form">
                    <div className="form-group">
                        <label>Component Type</label>
                        <div className="component-type-toggle">
                            <button
                                className={`type-btn ${currentComponent.type === 'material' ? 'active' : ''}`}
                                onClick={() => handleComponentChange('type', 'material')}
                            >
                                <Icon name="inventory_2" /> Material
                            </button>
                            <button
                                className={`type-btn ${currentComponent.type === 'subassembly' ? 'active' : ''}`}
                                onClick={() => handleComponentChange('type', 'subassembly')}
                            >
                                <Icon name="account_tree" /> Sub-assembly
                            </button>
                        </div>
                    </div>

                    {currentComponent.type === 'material' ? (
                        <div className="form-group">
                            <label>Select Material</label>
                            <select
                                value={currentComponent.itemId || ''}
                                onChange={(e) => handleComponentChange('itemId', e.target.value)}
                            >
                                <option value="">Choose a material</option>
                                {materials.map(material => (
                                    <option key={material.id} value={material.id}>
                                        {material.code} - {material.name} (Stock: {material.stock || 0})
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="form-group">
                            <label>Select Sub-assembly (BOM)</label>
                            <select
                                value={currentComponent.subBomId || ''}
                                onChange={(e) => handleComponentChange('subBomId', e.target.value)}
                            >
                                <option value="">Choose a BOM</option>
                                {boms.filter(b => b.id !== currentBOM.id && b.status === 'Active').map(bom => (
                                    <option key={bom.id} value={bom.id}>
                                        {bom.code} - {bom.name} (${bom.totalCost?.toLocaleString()})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-row">
                        <div className="form-group">
                            <label>Quantity</label>
                            <input
                                type="number"
                                value={currentComponent.quantity}
                                onChange={(e) => handleComponentChange('quantity', parseInt(e.target.value) || 1)}
                                min="1"
                            />
                        </div>
                        <div className="form-group">
                            <label>Unit</label>
                            <input
                                type="text"
                                value={currentComponent.unit}
                                disabled
                                placeholder="Auto-filled"
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Unit Cost</label>
                            <input
                                type="text"
                                value={`$${currentComponent.unitCost?.toLocaleString() || 0}`}
                                disabled
                            />
                        </div>
                        <div className="form-group">
                            <label>Total Cost</label>
                            <input
                                type="text"
                                value={`$${currentComponent.totalCost?.toLocaleString() || 0}`}
                                disabled
                            />
                        </div>
                    </div>

                    {currentComponent.type === 'material' && (
                        <div className="stock-info">
                            <Icon name={getStockStatusStyle(currentComponent.stockStatus).icon}
                                style={{ color: getStockStatusStyle(currentComponent.stockStatus).color }} />
                            <span>Stock Available: {currentComponent.stockAvailable || 0}</span>
                            <span className={`stock-status ${currentComponent.stockStatus}`}>
                                {getStockStatusStyle(currentComponent.stockStatus).label}
                            </span>
                        </div>
                    )}

                    <div className="form-group">
                        <label>Notes</label>
                        <input
                            type="text"
                            value={currentComponent.notes}
                            onChange={(e) => handleComponentChange('notes', e.target.value)}
                            placeholder="Optional notes..."
                        />
                    </div>

                    <div className="form-actions">
                        <button className="btn-secondary" onClick={() => setShowComponentModal(false)}>
                            Cancel
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleSaveComponent}
                            disabled={!currentComponent.itemId && !currentComponent.subBomId}
                        >
                            {componentMode === 'add' ? 'Add Component' : 'Update Component'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteConfirm}
                title="Delete BOM"
                onClose={() => setShowDeleteConfirm(false)}
                icon="warning"
            >
                <div className="delete-confirm">
                    <Icon name="warning" className="warning-icon" />
                    <p>Are you sure you want to delete <strong>{bomToDelete?.name}</strong>?</p>
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

export default BOMModule;
