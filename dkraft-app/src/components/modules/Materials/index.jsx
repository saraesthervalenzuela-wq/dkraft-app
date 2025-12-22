import { useState } from 'react';
import { Icon, SearchBox } from '../../common';

const initialMaterialsData = [
    { id: 1, codeQB: 'MAT-001', statusQB: 'synced', material: 'Pine Plywood 18mm', category: 'Woods', unit: 'Sheet', supplier: 'Northern Woods', status: 'Active', stockTotal: 150 },
    { id: 2, codeQB: 'MAT-002', statusQB: 'pending', material: 'MDF 15mm', category: 'Woods', unit: 'Sheet', supplier: 'Board Supplier Co', status: 'Active', stockTotal: 80 },
    { id: 3, codeQB: 'MAT-003', statusQB: 'synced', material: 'Screw 2"', category: 'Hardware', unit: 'Box', supplier: 'Industrial Hardware', status: 'Active', stockTotal: 500 },
    { id: 4, codeQB: 'MAT-004', statusQB: 'error', material: 'Soft Close Hinge', category: 'Hardware', unit: 'Pair', supplier: 'Blum Mexico', status: 'Low Stock', stockTotal: 25 },
    { id: 5, codeQB: 'MAT-005', statusQB: 'synced', material: 'White PVA Glue', category: 'Adhesives', unit: 'Gallon', supplier: 'Industrial Adhesives', status: 'Active', stockTotal: 45 },
    { id: 6, codeQB: 'MAT-006', statusQB: 'synced', material: 'Glossy Lacquer', category: 'Finishes', unit: 'Liter', supplier: 'Premium Paints', status: 'Active', stockTotal: 60 },
    { id: 7, codeQB: 'MAT-007', statusQB: 'pending', material: 'Telescopic Slide 18"', category: 'Hardware', unit: 'Pair', supplier: 'Blum Mexico', status: 'Inactive', stockTotal: 0 },
];

const MaterialsModule = () => {
    const [materials, setMaterials] = useState(initialMaterialsData);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(8);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [activeTab, setActiveTab] = useState('materials');
    const [isSyncing, setIsSyncing] = useState(false);
    const [viewMode, setViewMode] = useState('grid');

    const getQBStatusIcon = (status) => {
        switch (status) {
            case 'synced': return { icon: 'check_circle', color: '#10b981' };
            case 'pending': return { icon: 'schedule', color: '#f59e0b' };
            case 'error': return { icon: 'error', color: '#ef4444' };
            default: return { icon: 'help', color: '#64748b' };
        }
    };

    const filteredMaterials = materials.filter(m =>
        m.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const sortedMaterials = [...filteredMaterials].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = String(a[sortConfig.key]).toLowerCase();
        const bVal = String(b[sortConfig.key]).toLowerCase();
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

    // Calculate stats
    const totalMaterials = materials.length;
    const totalStock = materials.reduce((sum, m) => sum + m.stockTotal, 0);
    const lowStockCount = materials.filter(m => m.status === 'Low Stock').length;
    const categories = [...new Set(materials.map(m => m.category))].length;

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
                    <button className="btn-primary-action">
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
                        <Icon name="category" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{categories}</span>
                        <span className="stat-label">Categories</span>
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

            {viewMode === 'grid' ? (
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
                                        <span className={`status-badge ${material.status.toLowerCase().replace(' ', '-')}`}>
                                            <span className="status-dot"></span>
                                            {material.status}
                                        </span>
                                        <span className="qb-status-badge" style={{ color: qbStatus.color }}>
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
                                            <Icon name="straighten" />
                                            <span>{material.unit}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="material-card-footer">
                                    <div className="material-stock">
                                        <span className="stock-label">Stock</span>
                                        <span className="stock-value">{material.stockTotal}</span>
                                    </div>
                                    <button className="btn-action-menu">
                                        <Icon name="more_horiz" />
                                    </button>
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
                                <span className="col-status-qb">
                                    <Icon name={qbStatus.icon} style={{ color: qbStatus.color, fontSize: '20px' }} />
                                </span>
                                <span className="col-material">{material.material}</span>
                                <span className="col-category">{material.category}</span>
                                <span className="col-unit">{material.unit}</span>
                                <span className="col-supplier">{material.supplier}</span>
                                <span className={`col-status status-badge ${material.status.toLowerCase().replace(' ', '-')}`}>
                                    <span className="status-dot"></span>
                                    {material.status}
                                </span>
                                <span className="col-stock">{material.stockTotal}</span>
                                <span className="col-actions">
                                    <button className="btn-action-menu">
                                        <Icon name="more_horiz" />
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
        </div>
    );
};

export default MaterialsModule;
