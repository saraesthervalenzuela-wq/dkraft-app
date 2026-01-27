/**
 * Warehouses Module
 * Matches backend API schema: id, name, location, description, createdAt
 */

import { useState, useEffect } from 'react';
import { Icon, SearchBox, Modal } from '../../common';
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
                <button className="btn-primary-action" onClick={() => handleOpenModal('add')}>
                    <Icon name="add" />
                    New Warehouse
                </button>
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
                <div className="materials-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading warehouses...</p>
                </div>
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
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={handleCloseModal}>
                                Cancel
                            </button>
                            <button
                                className="btn-save"
                                onClick={handleSave}
                                disabled={!currentWarehouse.name || !currentWarehouse.location}
                            >
                                <Icon name="save" />
                                {currentWarehouse.id ? 'Update' : 'Create'} Warehouse
                            </button>
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
                        <div className="modal-actions">
                            <button
                                className="btn-cancel"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </button>
                            <button className="btn-delete" onClick={handleDelete}>
                                <Icon name="delete" />
                                Delete
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default WarehousesModule;
