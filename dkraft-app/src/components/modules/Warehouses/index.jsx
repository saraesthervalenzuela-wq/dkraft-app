/**
 * Warehouses Module
 * Matches backend API schema: id, name, location, description, createdAt
 */

import { useState, useEffect, useMemo } from 'react';
import {
    FaWarehouse,
    FaPlus,
    FaEdit,
    FaTrash,
    FaSearch,
    FaTh,
    FaList,
    FaSpinner,
    FaExclamationTriangle,
    FaMapMarkerAlt,
} from 'react-icons/fa';
import Card from '../../common/Card';
import Modal from '../../common/Modal';
import { useDataService } from '../../../hooks/useService';
import './styles.css';

/**
 * Initial warehouses data (fallback when API is disabled)
 */
const initialWarehousesData = [
    {
        id: 1,
        name: 'Main Warehouse',
        location: 'Industrial Park Tijuana',
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
        name: 'Overflow Warehouse',
        location: 'Otay Industrial Zone',
        description: 'Overflow storage facility',
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
    const [localWarehouses, setLocalWarehouses] = useState(initialWarehousesData);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentWarehouse, setCurrentWarehouse] = useState(emptyWarehouse);
    const [warehouseToDelete, setWarehouseToDelete] = useState(null);

    // Service
    const { data, loading, error, fetchAll, create, update, remove, isApiEnabled } = useDataService('warehouses');

    // Load data on mount
    useEffect(() => {
        if (isApiEnabled) {
            fetchAll().catch(console.error);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Use API data when available, otherwise use local state
    const warehouses = isApiEnabled && data?.length > 0 ? data : localWarehouses;

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
            const dataToSave = {
                name: currentWarehouse.name,
                location: currentWarehouse.location,
                description: currentWarehouse.description || '',
            };

            if (currentWarehouse.id) {
                if (isApiEnabled) {
                    await update(currentWarehouse.id, dataToSave);
                } else {
                    setLocalWarehouses(prev => prev.map(wh =>
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
                    setLocalWarehouses(prev => [...prev, newWarehouse]);
                }
            }

            handleCloseModal();
            if (isApiEnabled) {
                await fetchAll();
            }
        } catch (err) {
            console.error('Error saving warehouse:', err);
            alert('Error al guardar el almacén');
        }
    };

    const handleDelete = async () => {
        try {
            if (isApiEnabled) {
                await remove(warehouseToDelete.id);
                await fetchAll();
            } else {
                setLocalWarehouses(prev => prev.filter(wh => wh.id !== warehouseToDelete.id));
            }
            setIsDeleteModalOpen(false);
            setWarehouseToDelete(null);
        } catch (err) {
            console.error('Error deleting warehouse:', err);
            alert('Error al eliminar el almacén');
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

    // Render loading state
    if (loading && warehouses.length === 0) {
        return (
            <div className="module-container warehouses-module">
                <div className="loading-state">
                    <FaSpinner className="spinner" />
                    <p>Loading warehouses...</p>
                </div>
            </div>
        );
    }

    // Render error state
    if (error && warehouses.length === 0) {
        return (
            <div className="module-container warehouses-module">
                <div className="error-state">
                    <FaExclamationTriangle />
                    <p>Error loading warehouses: {error}</p>
                    <button onClick={() => fetchAll()}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="module-page warehouses-module">
            {/* Header - Same style as Staff */}
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">warehouse</span>
                    </div>
                    <div className="header-text">
                        <h1>Warehouses</h1>
                        <p>Manage storage locations and inventory zones</p>
                    </div>
                </div>
                <button className="btn-primary-action" onClick={() => handleOpenModal()}>
                    <span className="material-symbols-rounded">add</span>
                    Add Warehouse
                </button>
            </div>

            {/* Stats Cards */}
            <div className="staff-stats-grid">
                <div className="staff-stat-card">
                    <div className="staff-stat-icon blue">
                        <span className="material-symbols-rounded">warehouse</span>
                    </div>
                    <div className="staff-stat-info">
                        <div className="staff-stat-value">{warehouses.length}</div>
                        <div className="staff-stat-label">TOTAL WAREHOUSES</div>
                    </div>
                </div>
                <div className="staff-stat-card">
                    <div className="staff-stat-icon green">
                        <span className="material-symbols-rounded">inventory_2</span>
                    </div>
                    <div className="staff-stat-info">
                        <div className="staff-stat-value">{warehouses.filter(w => w.description).length}</div>
                        <div className="staff-stat-label">ACTIVE ZONES</div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="staff-toolbar">
                <div className="search-container">
                    <span className="material-symbols-rounded search-icon">search</span>
                    <input
                        type="text"
                        className="search-input"
                        placeholder="Search warehouses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="view-toggle-buttons">
                    <button
                        className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                        onClick={() => setViewMode('table')}
                        title="Table view"
                    >
                        <span className="material-symbols-rounded">view_list</span>
                    </button>
                    <button
                        className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid view"
                    >
                        <span className="material-symbols-rounded">grid_view</span>
                    </button>
                </div>
            </div>

            {/* Content - Grid View */}
            {viewMode === 'grid' ? (
                <div className="clients-cards-grid">
                    {filteredWarehouses.map((warehouse) => (
                        <div key={warehouse.id} className="client-card">
                            <div className="client-card-header">
                                <div className="client-avatar color-2">
                                    <span className="material-symbols-rounded">warehouse</span>
                                </div>
                                <div className="client-status">
                                    <span className="status-badge active">Active</span>
                                </div>
                            </div>
                            <div className="client-card-body">
                                <h3 className="client-name">{warehouse.name}</h3>
                                <span className="client-contact">Storage Zone</span>
                                <div className="client-details">
                                    <div className="detail-item">
                                        <span className="material-symbols-rounded">location_on</span>
                                        <span>{warehouse.location || 'No location'}</span>
                                    </div>
                                    {warehouse.description && (
                                        <div className="detail-item">
                                            <span className="material-symbols-rounded">description</span>
                                            <span>{warehouse.description}</span>
                                        </div>
                                    )}
                                    <div className="detail-item">
                                        <span className="material-symbols-rounded">calendar_today</span>
                                        <span>Created: {formatDate(warehouse.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="client-card-actions">
                                <button className="btn-action-view" onClick={() => handleOpenModal(warehouse)} title="View">
                                    <span className="material-symbols-rounded">visibility</span>
                                </button>
                                <button className="btn-action-edit" onClick={() => handleOpenModal(warehouse)} title="Edit">
                                    <span className="material-symbols-rounded">edit</span>
                                </button>
                                <button className="btn-action-delete" onClick={() => confirmDelete(warehouse)} title="Delete">
                                    <span className="material-symbols-rounded">delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredWarehouses.length === 0 && (
                        <div className="empty-state-card">
                            <span className="material-symbols-rounded">warehouse</span>
                            <p>No warehouses found</p>
                        </div>
                    )}
                </div>
            ) : (
                <Card className="data-table-card">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
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
                                    <td>{warehouse.id}</td>
                                    <td>
                                        <strong>{warehouse.name}</strong>
                                    </td>
                                    <td>
                                        <FaMapMarkerAlt className="cell-icon" />
                                        {warehouse.location || '-'}
                                    </td>
                                    <td className="description-cell">
                                        {warehouse.description || '-'}
                                    </td>
                                    <td>{formatDate(warehouse.createdAt)}</td>
                                    <td className="actions-cell">
                                        <button
                                            className="btn-icon edit"
                                            onClick={() => handleOpenModal(warehouse)}
                                            title="Editar"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            className="btn-icon delete"
                                            onClick={() => confirmDelete(warehouse)}
                                            title="Eliminar"
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredWarehouses.length === 0 && (
                        <div className="empty-state">
                            <FaWarehouse />
                            <p>No se encontraron almacenes</p>
                        </div>
                    )}
                </Card>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={currentWarehouse.id ? 'Edit Warehouse' : 'New Warehouse'}
                size="medium"
            >
                <div className="warehouse-form">
                    <div className="form-group">
                        <label>Name *</label>
                        <input
                            type="text"
                            name="name"
                            value={currentWarehouse.name}
                            onChange={handleInputChange}
                            placeholder="Warehouse name"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Location *</label>
                        <input
                            type="text"
                            name="location"
                            value={currentWarehouse.location}
                            onChange={handleInputChange}
                            placeholder="Address or location"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            name="description"
                            value={currentWarehouse.description}
                            onChange={handleInputChange}
                            placeholder="Warehouse description..."
                            rows="3"
                        />
                    </div>
                    <div className="form-actions">
                        <button className="btn-secondary" onClick={handleCloseModal}>
                            Cancel
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleSave}
                            disabled={!currentWarehouse.name || !currentWarehouse.location}
                        >
                            {currentWarehouse.id ? 'Update' : 'Create'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirm Deletion"
                size="small"
            >
                <div className="delete-confirmation">
                    <FaExclamationTriangle className="warning-icon" />
                    <p>
                        Are you sure you want to delete warehouse{' '}
                        <strong>{warehouseToDelete?.name}</strong>?
                    </p>
                    <p className="warning-text">This action cannot be undone.</p>
                    <div className="confirmation-actions">
                        <button
                            className="btn-secondary"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Cancel
                        </button>
                        <button className="btn-danger" onClick={handleDelete}>
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default WarehousesModule;
