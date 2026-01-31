/**
 * Warehouses Module
 * Matches backend API schema: id, name, location, description, createdAt
 */

import { useState, useEffect } from 'react';
import { Icon, SearchBox, Modal, Button, TableSkeleton, CardSkeleton } from '../../common';
import { useDataService } from '../../../hooks/useService';
import './styles.css';

/**
 * Initial warehouses data (fallback when API is disabled)
 */
const initialWarehousesData = [
    {
        id: 1,
        name: 'Main Warehouse',
        location: 'Tijuana Industrial Park',
        description: 'Main warehouse for raw materials and finished products',
        createdAt: '2025-01-15T10:00:00Z'
    },
    {
        id: 2,
        name: 'Production Warehouse',
        location: 'Manufacturing Plant',
        description: 'Warehouse adjacent to production line',
        createdAt: '2025-01-15T10:00:00Z'
    },
    {
        id: 3,
        name: 'Temporary Warehouse',
        location: 'Otay Industrial Zone',
        description: 'Overflow storage',
        createdAt: '2025-01-20T10:00:00Z'
    },
];

/**
 * Demo inventory data per warehouse
 */
const demoInventory = {
    1: [ // Main Warehouse
        { id: 1, name: 'MDF 18mm Natural', category: 'Wood', qty: 150, unit: 'sheets', minStock: 50 },
        { id: 2, name: 'Plywood 3/4"', category: 'Wood', qty: 85, unit: 'sheets', minStock: 30 },
        { id: 3, name: 'Edge Banding White', category: 'Finishing', qty: 500, unit: 'meters', minStock: 100 },
        { id: 4, name: 'Hardware Kit A', category: 'Hardware', qty: 45, unit: 'kits', minStock: 20 },
        { id: 5, name: 'Lacquer White', category: 'Finishing', qty: 25, unit: 'gallons', minStock: 10 },
        { id: 6, name: 'Hinges Soft-Close', category: 'Hardware', qty: 200, unit: 'pcs', minStock: 50 },
    ],
    2: [ // Production Warehouse
        { id: 7, name: 'Solid Oak Boards', category: 'Wood', qty: 40, unit: 'boards', minStock: 15 },
        { id: 8, name: 'Drawer Slides 18"', category: 'Hardware', qty: 80, unit: 'pairs', minStock: 30 },
        { id: 9, name: 'Screws #8 x 1.5"', category: 'Hardware', qty: 2000, unit: 'pcs', minStock: 500 },
        { id: 10, name: 'Wood Glue', category: 'Finishing', qty: 15, unit: 'gallons', minStock: 5 },
    ],
    3: [ // Temporary Warehouse
        { id: 11, name: 'Melamine White', category: 'Wood', qty: 60, unit: 'sheets', minStock: 20 },
        { id: 12, name: 'Veneer Walnut', category: 'Wood', qty: 30, unit: 'sheets', minStock: 10 },
    ],
};

/**
 * Empty warehouse template matching API schema
 */
const emptyWarehouse = {
    name: '',
    location: '',
    description: '',
};

const WarehousesModule = () => {
    // State
    const [warehouses, setWarehouses] = useState(initialWarehousesData);
    const [filteredWarehouses, setFilteredWarehouses] = useState(initialWarehousesData);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [isLoading, setIsLoading] = useState(false);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentWarehouse, setCurrentWarehouse] = useState(emptyWarehouse);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [warehouseToDelete, setWarehouseToDelete] = useState(null);
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [selectedWarehouseInventory, setSelectedWarehouseInventory] = useState(null);

    // Service
    const { data, loading, error, fetchAll, create, update, remove, isApiEnabled } = useDataService('warehouses');

    // Load data on mount
    useEffect(() => {
        if (isApiEnabled) {
            setIsLoading(true);
            fetchAll().finally(() => setIsLoading(false));
        }
    }, []);

    // Update warehouses when data changes
    useEffect(() => {
        if (data && data.length > 0) {
            setWarehouses(data);
            setFilteredWarehouses(data);
        }
    }, [data]);

    // Filter warehouses
    useEffect(() => {
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const filtered = warehouses.filter(wh =>
                wh.name?.toLowerCase().includes(term) ||
                wh.location?.toLowerCase().includes(term) ||
                wh.description?.toLowerCase().includes(term)
            );
            setFilteredWarehouses(filtered);
        } else {
            setFilteredWarehouses(warehouses);
        }
    }, [warehouses, searchTerm]);

    // Modal handlers
    const handleOpenModal = (mode, warehouse = null) => {
        setModalMode(mode);
        if (warehouse) {
            setCurrentWarehouse({ ...warehouse });
        } else {
            setCurrentWarehouse({ ...emptyWarehouse });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentWarehouse(emptyWarehouse);
    };

    const handleInputChange = (field, value) => {
        setCurrentWarehouse(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        try {
            const dataToSave = {
                name: currentWarehouse.name,
                location: currentWarehouse.location,
                description: currentWarehouse.description || '',
            };

            if (currentWarehouse.id) {
                if (isApiEnabled) {
                    await update(currentWarehouse.id, dataToSave);
                } else {
                    setWarehouses(prev => prev.map(wh =>
                        wh.id === currentWarehouse.id ? { ...wh, ...dataToSave } : wh
                    ));
                }
            } else {
                if (isApiEnabled) {
                    await create(dataToSave);
                } else {
                    const newWarehouse = {
                        ...dataToSave,
                        id: Date.now(),
                        createdAt: new Date().toISOString()
                    };
                    setWarehouses(prev => [...prev, newWarehouse]);
                }
            }

            handleCloseModal();
            if (isApiEnabled) {
                await fetchAll();
            }
        } catch (err) {
            console.error('Error saving warehouse:', err);
            alert('Error saving warehouse');
        }
    };

    const handleDelete = async () => {
        try {
            if (isApiEnabled) {
                await remove(warehouseToDelete.id);
                await fetchAll();
            } else {
                setWarehouses(prev => prev.filter(wh => wh.id !== warehouseToDelete.id));
            }
            setShowDeleteModal(false);
            setWarehouseToDelete(null);
        } catch (err) {
            console.error('Error deleting warehouse:', err);
            alert('Error deleting warehouse');
        }
    };

    const confirmDelete = (warehouse) => {
        setWarehouseToDelete(warehouse);
        setShowDeleteModal(true);
    };

    // Inventory modal handler
    const handleViewInventory = (warehouse) => {
        setSelectedWarehouseInventory({
            ...warehouse,
            inventory: demoInventory[warehouse.id] || []
        });
        setShowInventoryModal(true);
    };

    // Get stock status
    const getStockStatus = (item) => {
        const ratio = item.qty / item.minStock;
        if (ratio <= 0.5) return { status: 'critical', label: 'Critical', color: 'red' };
        if (ratio <= 1) return { status: 'low', label: 'Low Stock', color: 'orange' };
        return { status: 'ok', label: 'In Stock', color: 'green' };
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="module-page warehouses-module">
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
                <Button variant="orange" icon="add" onClick={() => handleOpenModal('add')}>
                    New Warehouse
                </Button>
            </div>

            {/* Stats */}
            <div className="module-stats-row">
                <div className="module-stat-card">
                    <div className="stat-icon blue">
                        <Icon name="warehouse" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{warehouses.length}</span>
                        <span className="stat-label">Total Warehouses</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="module-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by name, location..."
                />
                <div className="toolbar-right">
                    <div className="view-toggle">
                        <button
                            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <Icon name="grid_view" />
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                            onClick={() => setViewMode('table')}
                        >
                            <Icon name="table_rows" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {isLoading || loading ? (
                viewMode === 'grid' ? (
                    <CardSkeleton count={4} />
                ) : (
                    <TableSkeleton rows={5} columns={4} />
                )
            ) : error ? (
                <div className="materials-error">
                    <Icon name="error" />
                    <p>Error loading warehouses: {error}</p>
                    <button onClick={() => fetchAll()}>Retry</button>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="warehouses-grid">
                    {filteredWarehouses.map((warehouse) => (
                        <div key={warehouse.id} className="warehouse-card">
                            <div className="card-header">
                                <Icon name="warehouse" />
                                <h3>{warehouse.name}</h3>
                            </div>
                            <div className="card-body">
                                <div className="card-row">
                                    <Icon name="location_on" />
                                    <span>{warehouse.location || 'No location'}</span>
                                </div>
                                {warehouse.description && (
                                    <p className="card-description">{warehouse.description}</p>
                                )}
                                <div className="card-row meta">
                                    <Icon name="calendar_today" />
                                    <span>Created: {formatDate(warehouse.createdAt)}</span>
                                </div>
                            </div>
                            <div className="card-actions">
                                <button
                                    className="btn-action inventory"
                                    onClick={() => handleViewInventory(warehouse)}
                                    title="View Inventory"
                                >
                                    <Icon name="inventory_2" />
                                </button>
                                <button
                                    className="btn-action"
                                    onClick={() => handleOpenModal('edit', warehouse)}
                                    title="Edit"
                                >
                                    <Icon name="edit" />
                                </button>
                                <button
                                    className="btn-action delete"
                                    onClick={() => confirmDelete(warehouse)}
                                    title="Delete"
                                >
                                    <Icon name="delete" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredWarehouses.length === 0 && (
                        <div className="empty-state full-width">
                            <Icon name="warehouse" />
                            <p>No warehouses found</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="warehouses-table-container">
                    <table className="warehouses-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Location</th>
                                <th>Description</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredWarehouses.map((warehouse) => (
                                <tr key={warehouse.id}>
                                    <td>
                                        <div className="cell-with-icon">
                                            <Icon name="warehouse" />
                                            <strong>{warehouse.name}</strong>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="cell-with-icon">
                                            <Icon name="location_on" />
                                            {warehouse.location || '-'}
                                        </div>
                                    </td>
                                    <td className="description-cell">
                                        {warehouse.description || '-'}
                                    </td>
                                    <td>{formatDate(warehouse.createdAt)}</td>
                                    <td className="actions-cell">
                                        <button
                                            className="btn-action inventory"
                                            onClick={() => handleViewInventory(warehouse)}
                                            title="View Inventory"
                                        >
                                            <Icon name="inventory_2" />
                                        </button>
                                        <button
                                            className="btn-action"
                                            onClick={() => handleOpenModal('edit', warehouse)}
                                            title="Edit"
                                        >
                                            <Icon name="edit" />
                                        </button>
                                        <button
                                            className="btn-action delete"
                                            onClick={() => confirmDelete(warehouse)}
                                            title="Delete"
                                        >
                                            <Icon name="delete" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredWarehouses.length === 0 && (
                        <div className="empty-state">
                            <Icon name="warehouse" />
                            <p>No warehouses found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <Modal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    title={modalMode === 'add' ? 'New Warehouse' : 'Edit Warehouse'}
                    icon="warehouse"
                    size="medium"
                >
                    <div className="warehouse-form">
                        <div className="form-group">
                            <label>Name *</label>
                            <input
                                type="text"
                                value={currentWarehouse.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Warehouse name"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Location *</label>
                            <input
                                type="text"
                                value={currentWarehouse.location}
                                onChange={(e) => handleInputChange('location', e.target.value)}
                                placeholder="Address or location"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                value={currentWarehouse.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                placeholder="Warehouse description..."
                                rows="3"
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="secondary" onClick={handleCloseModal}>
                                Cancel
                            </Button>
                            <Button
                                variant="success"
                                icon="save"
                                onClick={handleSave}
                                disabled={!currentWarehouse.name || !currentWarehouse.location}
                            >
                                {currentWarehouse.id ? 'Update' : 'Create'} Warehouse
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <Modal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    title="Confirm Deletion"
                    icon="warning"
                    size="small"
                >
                    <div className="delete-confirmation">
                        <div className="warning-icon">
                            <Icon name="warning" />
                        </div>
                        <p>
                            Are you sure you want to delete the warehouse{' '}
                            <strong>{warehouseToDelete?.name}</strong>?
                        </p>
                        <p className="warning-text">This action cannot be undone.</p>
                        <div className="flex justify-end gap-3 mt-4">
                            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                                Cancel
                            </Button>
                            <Button variant="danger" icon="delete" onClick={handleDelete}>
                                Delete
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Inventory Modal */}
            {showInventoryModal && selectedWarehouseInventory && (
                <Modal
                    isOpen={showInventoryModal}
                    onClose={() => setShowInventoryModal(false)}
                    title={`Inventory - ${selectedWarehouseInventory.name}`}
                    subtitle={selectedWarehouseInventory.location}
                    icon="inventory_2"
                    size="lg"
                >
                    <div className="space-y-4">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                        <Icon name="category" className="text-white text-lg" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white">
                                            {selectedWarehouseInventory.inventory.length}
                                        </div>
                                        <div className="text-xs text-slate-400">Total Items</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                                        <Icon name="check_circle" className="text-white text-lg" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white">
                                            {selectedWarehouseInventory.inventory.filter(i => getStockStatus(i).status === 'ok').length}
                                        </div>
                                        <div className="text-xs text-slate-400">In Stock</div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                                        <Icon name="warning" className="text-white text-lg" />
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-white">
                                            {selectedWarehouseInventory.inventory.filter(i => getStockStatus(i).status !== 'ok').length}
                                        </div>
                                        <div className="text-xs text-slate-400">Low Stock</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Inventory Table */}
                        {selectedWarehouseInventory.inventory.length > 0 ? (
                            <div className="bg-slate-800/30 rounded-xl border border-white/10 overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10">
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-blue-400 uppercase tracking-wider">Material</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-blue-400 uppercase tracking-wider">Category</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-blue-400 uppercase tracking-wider">Quantity</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-blue-400 uppercase tracking-wider">Min Stock</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-blue-400 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {selectedWarehouseInventory.inventory.map((item) => {
                                            const stockStatus = getStockStatus(item);
                                            return (
                                                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
                                                                <Icon name="package_2" className="text-slate-300 text-sm" />
                                                            </div>
                                                            <span className="font-medium text-white">{item.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300">
                                                            {item.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="font-bold text-white">{item.qty}</span>
                                                        <span className="text-slate-400 ml-1 text-sm">{item.unit}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right text-slate-400">
                                                        {item.minStock} {item.unit}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`
                                                            inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold
                                                            ${stockStatus.color === 'green' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : ''}
                                                            ${stockStatus.color === 'orange' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : ''}
                                                            ${stockStatus.color === 'red' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : ''}
                                                        `}>
                                                            <span className={`w-1.5 h-1.5 rounded-full
                                                                ${stockStatus.color === 'green' ? 'bg-green-400' : ''}
                                                                ${stockStatus.color === 'orange' ? 'bg-orange-400' : ''}
                                                                ${stockStatus.color === 'red' ? 'bg-red-400' : ''}
                                                            `}></span>
                                                            {stockStatus.label}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <Icon name="inventory_2" className="text-5xl mb-3 opacity-50" />
                                <p className="text-lg font-medium">No inventory items</p>
                                <p className="text-sm">This warehouse is empty</p>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default WarehousesModule;
