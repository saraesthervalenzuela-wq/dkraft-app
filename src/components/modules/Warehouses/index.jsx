/**
 * Warehouses Module
 * Uses Supabase directly for data storage
 * Styled to match Products module
 */

import { useState, useEffect, useMemo } from 'react';
import { Icon, SearchBox, Modal, Toast } from '../../common';
import { supabase } from '../../../lib/supabase';

/**
 * Empty warehouse template
 */
const emptyWarehouse = {
    name: '',
    location: '',
    description: '',
};

const WarehousesModule = () => {
    // State
    const [warehouses, setWarehouses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [toast, setToast] = useState(null);

    // Selection and sorting state
    const [selectedWarehouses, setSelectedWarehouses] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(8);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentWarehouse, setCurrentWarehouse] = useState(emptyWarehouse);
    const [warehouseToDelete, setWarehouseToDelete] = useState(null);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    /**
     * Load warehouses from Supabase
     */
    const loadData = async () => {
        setIsLoading(true);
        try {
            console.log('[Warehouses] Loading from Supabase...');
            const { data: warehousesData, error } = await supabase
                .from('warehouses')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            console.log('[Warehouses] Loaded:', warehousesData?.length, 'warehouses');

            setWarehouses(warehousesData || []);
        } catch (error) {
            console.error('[Warehouses] Error loading:', error);
            setToast({ message: 'Error loading warehouses: ' + error.message, type: 'error' });
            setWarehouses([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Derive filtered warehouses using useMemo
    const filteredWarehouses = useMemo(() => {
        if (!searchTerm) return warehouses;
        const term = searchTerm.toLowerCase();
        return warehouses.filter(wh =>
            wh.name?.toLowerCase().includes(term) ||
            wh.location?.toLowerCase().includes(term) ||
            wh.description?.toLowerCase().includes(term)
        );
    }, [warehouses, searchTerm]);

    // Sort warehouses
    const sortedWarehouses = useMemo(() => {
        if (!sortConfig.key) return filteredWarehouses;
        return [...filteredWarehouses].sort((a, b) => {
            const aVal = String(a[sortConfig.key] || '').toLowerCase();
            const bVal = String(b[sortConfig.key] || '').toLowerCase();
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filteredWarehouses, sortConfig]);

    // Pagination
    const totalPages = Math.ceil(sortedWarehouses.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedWarehouses = sortedWarehouses.slice(startIndex, startIndex + rowsPerPage);

    // Sorting handler
    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Selection handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedWarehouses(paginatedWarehouses.map(w => w.id));
        } else {
            setSelectedWarehouses([]);
        }
    };

    const handleSelectWarehouse = (id) => {
        setSelectedWarehouses(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Delete selected
    const handleDeleteSelected = async () => {
        if (selectedWarehouses.length === 0) return;
        try {
            for (const warehouseId of selectedWarehouses) {
                await supabase.from('warehouses').delete().eq('id', warehouseId);
            }
            setToast({ message: `${selectedWarehouses.length} warehouses deleted successfully!`, type: 'success' });
            setSelectedWarehouses([]);
            await loadData();
        } catch (error) {
            console.error('[Warehouses] Error deleting selected:', error);
            setToast({ message: 'Error deleting warehouses: ' + error.message, type: 'error' });
        }
    };

    // Stats
    const totalWarehouses = warehouses.length;
    const activeWarehouses = warehouses.filter(w => w.description).length;
    const uniqueLocations = [...new Set(warehouses.map(w => w.location).filter(Boolean))].length;

    // CRUD operations
    const handleOpenModal = (warehouse = null) => {
        if (warehouse) {
            setCurrentWarehouse({ ...warehouse });
        } else {
            setCurrentWarehouse({ ...emptyWarehouse });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentWarehouse(emptyWarehouse);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentWarehouse(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            console.log('[Warehouses] Saving to Supabase...');

            const dataToSave = {
                name: currentWarehouse.name,
                location: currentWarehouse.location,
                description: currentWarehouse.description || '',
            };

            if (currentWarehouse.id) {
                // Update existing warehouse
                console.log('[Warehouses] Updating:', currentWarehouse.id);
                const { error } = await supabase
                    .from('warehouses')
                    .update({ ...dataToSave, updated_at: new Date().toISOString() })
                    .eq('id', currentWarehouse.id);

                if (error) throw error;
                console.log('[Warehouses] Updated successfully');
                setToast({ message: 'Warehouse updated successfully!', type: 'success' });
            } else {
                // Create new warehouse
                console.log('[Warehouses] Creating new warehouse...');
                const { data: newWarehouse, error } = await supabase
                    .from('warehouses')
                    .insert(dataToSave)
                    .select()
                    .single();

                if (error) throw error;
                console.log('[Warehouses] Created:', newWarehouse);
                setToast({ message: 'Warehouse created successfully!', type: 'success' });
            }

            handleCloseModal();
            await loadData();
        } catch (err) {
            console.error('[Warehouses] Error saving:', err);
            setToast({ message: 'Error: ' + err.message, type: 'error' });
        }
    };

    const handleDelete = async () => {
        try {
            console.log('[Warehouses] Deleting:', warehouseToDelete.id);
            const { error } = await supabase
                .from('warehouses')
                .delete()
                .eq('id', warehouseToDelete.id);

            if (error) throw error;

            console.log('[Warehouses] Deleted successfully');
            setToast({ message: 'Warehouse deleted successfully!', type: 'success' });
            setIsDeleteModalOpen(false);
            setWarehouseToDelete(null);
            await loadData();
        } catch (err) {
            console.error('[Warehouses] Error deleting:', err);
            setToast({ message: 'Error: ' + err.message, type: 'error' });
        }
    };

    const confirmDelete = (warehouse) => {
        setWarehouseToDelete(warehouse);
        setIsDeleteModalOpen(true);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="module-page products-module">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <Icon name="warehouse" />
                    </div>
                    <div className="header-text">
                        <h1>Warehouses</h1>
                        <p>Manage storage locations and inventory zones</p>
                    </div>
                </div>
                <button className="btn-primary-action" onClick={() => handleOpenModal()}>
                    <Icon name="add" />
                    Add Warehouse
                </button>
            </div>

            {/* Stats Cards */}
            <div className="module-stats-row">
                <div className="module-stat-card">
                    <div className="stat-icon blue">
                        <Icon name="warehouse" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{totalWarehouses}</span>
                        <span className="stat-label">Total Warehouses</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon green">
                        <Icon name="check_circle" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{activeWarehouses}</span>
                        <span className="stat-label">With Description</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon orange">
                        <Icon name="location_on" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{uniqueLocations}</span>
                        <span className="stat-label">Unique Locations</span>
                    </div>
                </div>
            </div>

            {/* Toolbar - Same style as Products */}
            <div className="products-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search warehouses..."
                    className="products-search"
                />
                <div className="toolbar-actions">
                    {selectedWarehouses.length > 0 && (
                        <button className="btn-delete-selected" onClick={handleDeleteSelected}>
                            <Icon name="delete" />
                            Delete ({selectedWarehouses.length})
                        </button>
                    )}
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
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="materials-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading warehouses...</p>
                </div>
            ) : viewMode === 'grid' ? (
                /* Cards View - Same style as Products */
                <div className="materials-cards-grid">
                    {paginatedWarehouses.map((warehouse) => (
                        <div key={warehouse.id} className="material-card">
                            <div className="material-card-header">
                                <div className="material-card-icon">
                                    <Icon name="warehouse" />
                                </div>
                                <div className="material-card-badges">
                                    <span className="status-badge green">
                                        <span className="status-dot"></span>
                                        ACTIVE
                                    </span>
                                </div>
                            </div>
                            <div className="material-card-body">
                                <h3 className="material-card-name">{warehouse.name}</h3>
                                <span className="material-card-code">Storage Zone</span>
                                <div className="material-card-details">
                                    <div className="material-detail">
                                        <Icon name="location_on" />
                                        <span>{warehouse.location || 'No location'}</span>
                                    </div>
                                    <div className="material-detail">
                                        <Icon name="calendar_today" />
                                        <span>Created: {formatDate(warehouse.created_at)}</span>
                                    </div>
                                </div>
                                {warehouse.description && (
                                    <p className="product-description">{warehouse.description}</p>
                                )}
                            </div>
                            <div className="material-card-footer">
                                <div className="material-stock">
                                    <span className="stock-label">Type</span>
                                    <span className="stock-value">Warehouse</span>
                                </div>
                                <div className="material-actions">
                                    <button className="btn-icon" onClick={() => handleOpenModal(warehouse)} title="View">
                                        <Icon name="visibility" />
                                    </button>
                                    <button className="btn-icon" onClick={() => handleOpenModal(warehouse)} title="Edit">
                                        <Icon name="edit" />
                                    </button>
                                    <button className="btn-icon danger" onClick={() => confirmDelete(warehouse)} title="Delete">
                                        <Icon name="delete" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {paginatedWarehouses.length === 0 && (
                        <div className="materials-empty">
                            <Icon name="warehouse" />
                            <p>No warehouses found</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Table View - Same style as Products */
                <div className="products-table-container">
                    <div className="products-table">
                        <div className="products-table-header">
                            <span className="col-checkbox">
                                <input
                                    type="checkbox"
                                    checked={paginatedWarehouses.length > 0 && selectedWarehouses.length === paginatedWarehouses.length}
                                    onChange={handleSelectAll}
                                />
                            </span>
                            <span className="col-name sortable" onClick={() => handleSort('name')}>
                                Name
                                <Icon name={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-location sortable" onClick={() => handleSort('location')}>
                                Location
                                <Icon name={sortConfig.key === 'location' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-description">Description</span>
                            <span className="col-created sortable" onClick={() => handleSort('created_at')}>
                                Created
                                <Icon name={sortConfig.key === 'created_at' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-status">Status</span>
                            <span className="col-actions"></span>
                        </div>
                        <div className="products-table-body">
                            {paginatedWarehouses.map((warehouse) => (
                                <div key={warehouse.id} className="products-table-row">
                                    <span className="col-checkbox">
                                        <input
                                            type="checkbox"
                                            checked={selectedWarehouses.includes(warehouse.id)}
                                            onChange={() => handleSelectWarehouse(warehouse.id)}
                                        />
                                    </span>
                                    <span className="col-name">{warehouse.name}</span>
                                    <span className="col-location">
                                        <Icon name="location_on" />
                                        {warehouse.location || '-'}
                                    </span>
                                    <span className="col-description">{warehouse.description || '-'}</span>
                                    <span className="col-created">{formatDate(warehouse.created_at)}</span>
                                    <span className="col-status status-badge green">
                                        <span className="status-dot"></span>
                                        Active
                                    </span>
                                    <span className="col-actions">
                                        <button className="btn-icon" onClick={() => handleOpenModal(warehouse)} title="View">
                                            <Icon name="visibility" />
                                        </button>
                                        <button className="btn-icon" onClick={() => handleOpenModal(warehouse)} title="Edit">
                                            <Icon name="edit" />
                                        </button>
                                        <button className="btn-icon danger" onClick={() => confirmDelete(warehouse)} title="Delete">
                                            <Icon name="delete" />
                                        </button>
                                    </span>
                                </div>
                            ))}
                            {paginatedWarehouses.length === 0 && (
                                <div className="products-empty">
                                    <Icon name="warehouse" />
                                    <p>No warehouses found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination - Same style as Products */}
            <div className="materials-footer">
                <div className="materials-count">
                    Showing {sortedWarehouses.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + rowsPerPage, sortedWarehouses.length)} of {sortedWarehouses.length} results
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

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={currentWarehouse.id ? 'Edit Warehouse' : 'New Warehouse'}
                subtitle={currentWarehouse.id ? 'Update warehouse details' : 'Add a new storage location'}
                icon={currentWarehouse.id ? 'edit' : 'add_box'}
                size="medium"
                onSave={handleSave}
                saveText={currentWarehouse.id ? 'Update' : 'Create'}
                saveIcon={currentWarehouse.id ? 'save' : 'add'}
                saveDisabled={!currentWarehouse.name || !currentWarehouse.location}
            >
                <div className="modal-form">
                    {/* Section: Basic Info */}
                    <div className="form-section">
                        <div className="form-section-header">
                            <span className="material-symbols-rounded">info</span>
                            <h4>Basic Information</h4>
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>
                                    <span className="material-symbols-rounded">warehouse</span>
                                    Name *
                                </label>
                                <div className="input-with-icon">
                                    <span className="material-symbols-rounded input-icon">inventory_2</span>
                                    <input
                                        type="text"
                                        name="name"
                                        value={currentWarehouse.name}
                                        onChange={handleInputChange}
                                        placeholder="Enter warehouse name"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>
                                    <span className="material-symbols-rounded">location_on</span>
                                    Location *
                                </label>
                                <div className="input-with-icon">
                                    <span className="material-symbols-rounded input-icon">pin_drop</span>
                                    <input
                                        type="text"
                                        name="location"
                                        value={currentWarehouse.location}
                                        onChange={handleInputChange}
                                        placeholder="Address or zone"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section: Details */}
                    <div className="form-section">
                        <div className="form-section-header">
                            <span className="material-symbols-rounded">description</span>
                            <h4>Additional Details</h4>
                        </div>
                        <div className="form-group">
                            <label>
                                <span className="material-symbols-rounded">notes</span>
                                Description
                            </label>
                            <div className="input-with-icon textarea-wrapper">
                                <span className="material-symbols-rounded input-icon">edit_note</span>
                                <textarea
                                    name="description"
                                    value={currentWarehouse.description}
                                    onChange={handleInputChange}
                                    placeholder="Describe the warehouse purpose, capacity, special conditions..."
                                    rows="4"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Warehouse"
                subtitle="This action cannot be undone"
                icon="warning"
                size="small"
                variant="danger"
                onSave={handleDelete}
                saveText="Delete"
                confirmOnClose={false}
            >
                <div className="delete-confirmation">
                    <p>
                        Are you sure you want to delete warehouse{' '}
                        <strong>{warehouseToDelete?.name}</strong>?
                    </p>
                </div>
            </Modal>

            {/* Toast notifications */}
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

export default WarehousesModule;
