/**
 * Warehouses Module
 * Matches backend API schema: id, name, location, description, createdAt
 */

import { useState, useEffect } from 'react';
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
        name: 'Almacén Principal',
        location: 'Parque Industrial Tijuana',
        description: 'Almacén principal de materias primas y productos terminados',
        createdAt: '2025-01-15T10:00:00Z'
    },
    {
        id: 2,
        name: 'Almacén Producción',
        location: 'Planta de Manufactura',
        description: 'Almacén adjunto a línea de producción',
        createdAt: '2025-01-15T10:00:00Z'
    },
    {
        id: 3,
        name: 'Almacén Temporal',
        location: 'Zona Industrial Otay',
        description: 'Almacenamiento de desbordamiento',
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
            alert('Error al guardar el almacén');
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
        return new Date(dateString).toLocaleDateString('es-MX', {
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
                    <p>Cargando almacenes...</p>
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
                    <p>Error al cargar almacenes: {error}</p>
                    <button onClick={() => fetchAll()}>Reintentar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="module-container warehouses-module">
            {/* Header */}
            <div className="module-header">
                <div className="header-title">
                    <FaWarehouse className="module-icon" />
                    <h1>Almacenes</h1>
                    {isApiEnabled && <span className="api-badge">API</span>}
                </div>
                <button className="btn-primary" onClick={() => handleOpenModal()}>
                    <FaPlus /> Nuevo Almacén
                </button>
            </div>

            {/* Filters */}
            <div className="module-filters">
                <div className="search-box">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, ubicación..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="view-toggle">
                    <button
                        className={viewMode === 'grid' ? 'active' : ''}
                        onClick={() => setViewMode('grid')}
                    >
                        <FaTh />
                    </button>
                    <button
                        className={viewMode === 'table' ? 'active' : ''}
                        onClick={() => setViewMode('table')}
                    >
                        <FaList />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-row">
                <Card className="stat-card">
                    <div className="stat-content">
                        <FaWarehouse className="stat-icon" />
                        <div>
                            <span className="stat-value">{warehouses.length}</span>
                            <span className="stat-label">Total Almacenes</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Content */}
            {viewMode === 'grid' ? (
                <div className="warehouses-grid">
                    {filteredWarehouses.map((warehouse) => (
                        <Card key={warehouse.id} className="warehouse-card">
                            <div className="card-header">
                                <FaWarehouse className="card-icon" />
                                <h3>{warehouse.name}</h3>
                            </div>
                            <div className="card-body">
                                <div className="info-row">
                                    <FaMapMarkerAlt className="info-icon" />
                                    <span>{warehouse.location || 'Sin ubicación'}</span>
                                </div>
                                {warehouse.description && (
                                    <p className="description">{warehouse.description}</p>
                                )}
                                <div className="meta-info">
                                    <span>Creado: {formatDate(warehouse.createdAt)}</span>
                                </div>
                            </div>
                            <div className="card-actions">
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
                            </div>
                        </Card>
                    ))}
                    {filteredWarehouses.length === 0 && (
                        <div className="empty-state full-width">
                            <FaWarehouse />
                            <p>No se encontraron almacenes</p>
                        </div>
                    )}
                </div>
            ) : (
                <Card className="data-table-card">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre</th>
                                <th>Ubicación</th>
                                <th>Descripción</th>
                                <th>Creado</th>
                                <th>Acciones</th>
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
                title={currentWarehouse.id ? 'Editar Almacén' : 'Nuevo Almacén'}
                size="medium"
            >
                <div className="warehouse-form">
                    <div className="form-group">
                        <label>Nombre *</label>
                        <input
                            type="text"
                            name="name"
                            value={currentWarehouse.name}
                            onChange={handleInputChange}
                            placeholder="Nombre del almacén"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Ubicación *</label>
                        <input
                            type="text"
                            name="location"
                            value={currentWarehouse.location}
                            onChange={handleInputChange}
                            placeholder="Dirección o ubicación"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea
                            name="description"
                            value={currentWarehouse.description}
                            onChange={handleInputChange}
                            placeholder="Descripción del almacén..."
                            rows="3"
                        />
                    </div>
                    <div className="form-actions">
                        <button className="btn-secondary" onClick={handleCloseModal}>
                            Cancelar
                        </button>
                        <button
                            className="btn-primary"
                            onClick={handleSave}
                            disabled={!currentWarehouse.name || !currentWarehouse.location}
                        >
                            {currentWarehouse.id ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Confirmar Eliminación"
                size="small"
            >
                <div className="delete-confirmation">
                    <FaExclamationTriangle className="warning-icon" />
                    <p>
                        ¿Está seguro que desea eliminar el almacén{' '}
                        <strong>{warehouseToDelete?.name}</strong>?
                    </p>
                    <p className="warning-text">Esta acción no se puede deshacer.</p>
                    <div className="confirmation-actions">
                        <button
                            className="btn-secondary"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button className="btn-danger" onClick={handleDelete}>
                            Eliminar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default WarehousesModule;
