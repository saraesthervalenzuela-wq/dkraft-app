/**
 * Sales Orders Module (Requisitions)
 * Manages sales orders in MRP flow - converted from approved quotations
 * Uses localStorage for offline functionality
 */

import { useState, useEffect } from 'react';
import {
    FaClipboardList,
    FaPlus,
    FaEdit,
    FaTrash,
    FaEye,
    FaCheck,
    FaTimes,
    FaSearch,
    FaFilter,
    FaTh,
    FaList,
    FaChevronDown,
    FaChevronRight,
    FaBoxOpen,
    FaUserCheck,
    FaWarehouse,
    FaCalendarAlt,
    FaSpinner,
    FaExclamationTriangle,
    FaCheckCircle,
    FaClock,
    FaShoppingCart,
    FaTruck,
} from 'react-icons/fa';
import Card from '../../common/Card';
import Modal from '../../common/Modal';
import { isApiEnabled, clientsApi, warehousesApi, projectsApi } from '../../../services/api';
import './styles.css';

// LocalStorage keys
const STORAGE_KEY = 'dkraft_sales_orders';
const QUOTATIONS_KEY = 'dkraft_quotations';

/**
 * Status configuration with colors and icons
 */
const STATUS_CONFIG = {
    DRAFT: { label: 'Draft', color: '#6c757d', icon: FaEdit },
    PENDING_APPROVAL: { label: 'Pending Approval', color: '#ffc107', icon: FaClock },
    APPROVED: { label: 'Approved', color: '#28a745', icon: FaCheckCircle },
    REJECTED: { label: 'Rejected', color: '#dc3545', icon: FaTimes },
    ORDERED: { label: 'Ordered', color: '#17a2b8', icon: FaShoppingCart },
    PARTIALLY_FULFILLED: { label: 'Partially Fulfilled', color: '#fd7e14', icon: FaTruck },
    FULFILLED: { label: 'Fulfilled', color: '#20c997', icon: FaCheck },
    CANCELLED: { label: 'Cancelled', color: '#6c757d', icon: FaTimes },
};

const ITEM_STATUS_CONFIG = {
    REQUESTED: { label: 'Requested', color: '#ffc107' },
    ORDERED: { label: 'Ordered', color: '#17a2b8' },
    PARTIALLY_RECEIVED: { label: 'Partially Received', color: '#fd7e14' },
    RECEIVED: { label: 'Received', color: '#28a745' },
    CANCELLED: { label: 'Cancelled', color: '#6c757d' },
};

/**
 * Normalize requisition data for backward compatibility
 */
const normalizeRequisition = (requisition) => {
    if (!requisition) return null;
    return {
        id: requisition.id,
        folio: requisition.folio || requisition.code || `REQ-${Date.now()}`,
        requesterId: requisition.requesterId || requisition.requester_id || requisition.userId,
        requesterName: requisition.requester?.name || requisition.requesterName || 'N/A',
        status: requisition.status || 'DRAFT',
        requestedAt: requisition.requestedAt || requisition.requested_at || requisition.createdAt,
        requiredAt: requisition.requiredAt || requisition.required_at || requisition.dueDate,
        comments: requisition.comments || requisition.notes || '',
        warehouseId: requisition.warehouseId || requisition.warehouse_id,
        warehouseName: requisition.warehouse?.name || requisition.warehouseName || 'N/A',
        customerId: requisition.customerId || requisition.customer_id || requisition.clientId,
        customerName: requisition.customer?.companyName || requisition.customerName || '',
        projectId: requisition.projectId || requisition.project_id,
        projectName: requisition.project?.name || requisition.projectName || '',
        items: (requisition.items || []).map(normalizeRequisitionItem),
        approvals: requisition.approvals || [],
        createdAt: requisition.createdAt || requisition.created_at,
        updatedAt: requisition.updatedAt || requisition.updated_at,
    };
};

const normalizeRequisitionItem = (item) => {
    if (!item) return null;
    return {
        id: item.id,
        requisitionId: item.requisitionId || item.requisition_id,
        materialId: item.materialId || item.material_id,
        materialName: item.material?.name || item.materialName || 'N/A',
        quantity: parseFloat(item.quantity) || 0,
        unit: item.unit || item.material?.unit || 'pz',
        neededBy: item.neededBy || item.needed_by,
        notes: item.notes || '',
        suggestedSupplierId: item.suggestedSupplierId || item.suggested_supplier_id,
        suggestedSupplierName: item.suggestedSupplier?.name || item.suggestedSupplierName || '',
        status: item.status || 'REQUESTED',
        orderedQty: parseFloat(item.orderedQty || item.ordered_qty) || 0,
        receivedQty: parseFloat(item.receivedQty || item.received_qty) || 0,
    };
};

// Billing entities - only DOVECREEK syncs to QuickBooks
const BILLING_ENTITIES = [
    { id: 'DOVECREEK', name: 'Dovecreek Maquila', syncsToQB: true },
    { id: 'INNOVATIVE', name: 'Innovative Mx', syncsToQB: false },
];

/**
 * Empty requisition template (Sales Order)
 */
const emptyRequisition = {
    id: null,
    folio: '',
    quotationId: '',         // Link to approved quotation
    quotationFolio: '',      // Quotation folio for display
    requesterId: '',
    status: 'DRAFT',
    billingEntity: 'DOVECREEK',  // Entidad de facturación
    requestedAt: new Date().toISOString(),
    requiredAt: '',
    approvalDate: '',        // Fecha de aprobación del estimate
    eta: '',                 // Fecha estimada de entrega
    deposit: 0,              // Monto del depósito
    depositPaid: false,      // Si el depósito fue pagado
    comments: '',
    warehouseId: '',
    customerId: '',
    projectId: '',
    items: [],
};

const emptyItem = {
    id: null,
    productId: '',
    productName: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    subtotal: 0,
};

const Requisitions = () => {
    // LocalStorage functions
    const loadFromStorage = () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    };

    const saveToStorage = (data) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('[SalesOrders] Error saving to localStorage:', error);
        }
    };

    const loadQuotationsFromStorage = () => {
        try {
            const saved = localStorage.getItem(QUOTATIONS_KEY);
            const all = saved ? JSON.parse(saved) : [];
            // Only return approved quotations with deposit paid that haven't been converted
            return all.filter(q => q.status === 'APPROVED' && q.depositPaid);
        } catch {
            return [];
        }
    };

    // State
    const [requisitions, setRequisitions] = useState([]);
    const [filteredRequisitions, setFilteredRequisitions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [viewMode, setViewMode] = useState('table');
    const [expandedRows, setExpandedRows] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [currentRequisition, setCurrentRequisition] = useState(emptyRequisition);
    const [requisitionToDelete, setRequisitionToDelete] = useState(null);

    // Item editing
    const [editingItemIndex, setEditingItemIndex] = useState(null);
    const [currentItem, setCurrentItem] = useState(emptyItem);

    // Related data
    const [warehouses, setWarehouses] = useState([]);
    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [quotations, setQuotations] = useState([]); // Approved quotations

    // Load initial data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Load sales orders from localStorage
            const localSalesOrders = loadFromStorage();
            const normalized = localSalesOrders.map(normalizeRequisition);
            setRequisitions(normalized);
            setFilteredRequisitions(normalized);

            // Load quotations from localStorage
            const localQuotations = loadQuotationsFromStorage();
            setQuotations(localQuotations);

            // Try to load related data from API if available
            if (isApiEnabled()) {
                const [clientsData, warehousesData, projectsData] = await Promise.all([
                    clientsApi.getAll().catch(() => []),
                    warehousesApi.getAll().catch(() => []),
                    projectsApi.getAll().catch(() => []),
                ]);
                setClients(clientsData || []);
                setWarehouses(warehousesData || []);
                setProjects(projectsData || []);
            }
        } catch (err) {
            console.error('[SalesOrders] Error loading data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Filter requisitions
    useEffect(() => {
        let filtered = [...requisitions];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(req =>
                req.folio?.toLowerCase().includes(term) ||
                req.requesterName?.toLowerCase().includes(term) ||
                req.warehouseName?.toLowerCase().includes(term) ||
                req.projectName?.toLowerCase().includes(term)
            );
        }

        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(req => req.status === statusFilter);
        }

        setFilteredRequisitions(filtered);
    }, [requisitions, searchTerm, statusFilter]);

    // Toggle row expansion
    const toggleRowExpansion = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // CRUD operations
    const handleOpenModal = (requisition = null) => {
        if (requisition) {
            setCurrentRequisition({ ...requisition });
        } else {
            setCurrentRequisition({ ...emptyRequisition, folio: generateFolio() });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentRequisition(emptyRequisition);
        setEditingItemIndex(null);
        setCurrentItem(emptyItem);
    };

    const handleViewRequisition = (requisition) => {
        setCurrentRequisition(requisition);
        setIsViewModalOpen(true);
    };

    const handleOpenApprovalModal = (requisition) => {
        setCurrentRequisition(requisition);
        setIsApprovalModalOpen(true);
    };

    const generateFolio = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `REQ-${year}${month}-${random}`;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentRequisition(prev => ({ ...prev, [name]: value }));
    };

    const handleItemInputChange = (e) => {
        const { name, value } = e.target;
        setCurrentItem(prev => ({ ...prev, [name]: value }));
    };

    const handleAddItem = () => {
        if (!currentItem.description || !currentItem.quantity) {
            alert('Por favor ingresa descripción y cantidad');
            return;
        }

        const newItem = {
            ...currentItem,
            id: `temp-${Date.now()}`,
        };

        if (editingItemIndex !== null) {
            const updatedItems = [...currentRequisition.items];
            updatedItems[editingItemIndex] = newItem;
            setCurrentRequisition(prev => ({ ...prev, items: updatedItems }));
            setEditingItemIndex(null);
        } else {
            setCurrentRequisition(prev => ({
                ...prev,
                items: [...prev.items, newItem]
            }));
        }

        setCurrentItem(emptyItem);
    };

    // Handle quotation selection - auto-populate fields from quotation
    const handleQuotationSelect = (quotationId) => {
        const quotation = quotations.find(q => q.id === quotationId);
        if (quotation) {
            setCurrentRequisition(prev => ({
                ...prev,
                quotationId: quotation.id,
                quotationFolio: quotation.folio,
                customerId: quotation.clientId,
                customerName: quotation.clientName,
                billingEntity: quotation.billingEntity,
                approvalDate: quotation.approvalDate,
                eta: quotation.eta,
                deposit: quotation.deposit,
                depositPaid: quotation.depositPaid,
                items: quotation.items || [],
                subtotal: quotation.subtotal,
                tax: quotation.tax,
                total: quotation.total,
                comments: quotation.notes || '',
            }));
        } else {
            // Clear quotation-related fields
            setCurrentRequisition(prev => ({
                ...prev,
                quotationId: '',
                quotationFolio: '',
            }));
        }
    };

    const handleEditItem = (index) => {
        setCurrentItem(currentRequisition.items[index]);
        setEditingItemIndex(index);
    };

    const handleRemoveItem = (index) => {
        setCurrentRequisition(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index)
        }));
    };

    // Helper to update a single requisition in state and storage
    const updateRequisitionInStorage = (requisitionId, updates) => {
        const updatedRequisitions = requisitions.map(r =>
            r.id === requisitionId ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
        );
        setRequisitions(updatedRequisitions);
        setFilteredRequisitions(updatedRequisitions);
        saveToStorage(updatedRequisitions);
        return updatedRequisitions;
    };

    const handleSave = async () => {
        try {
            if (currentRequisition.items.length === 0) {
                alert('Debe agregar al menos un item a la orden');
                return;
            }

            // Get client name
            const client = clients.find(c => c.id === currentRequisition.customerId);
            const warehouse = warehouses.find(w => w.id === currentRequisition.warehouseId);
            const project = projects.find(p => p.id === currentRequisition.projectId);

            const dataToSave = {
                ...currentRequisition,
                customerName: client?.companyName || client?.name || currentRequisition.customerName || '',
                warehouseName: warehouse?.name || currentRequisition.warehouseName || '',
                projectName: project?.name || currentRequisition.projectName || '',
                skipQBSync: currentRequisition.billingEntity !== 'DOVECREEK',
                updatedAt: new Date().toISOString(),
            };

            let updatedRequisitions;
            if (currentRequisition.id) {
                // Update existing
                updatedRequisitions = requisitions.map(r =>
                    r.id === currentRequisition.id ? dataToSave : r
                );
            } else {
                // Create new
                dataToSave.id = `local-${Date.now()}`;
                dataToSave.createdAt = new Date().toISOString();
                dataToSave.requestedAt = new Date().toISOString();
                updatedRequisitions = [...requisitions, dataToSave];
            }

            setRequisitions(updatedRequisitions);
            setFilteredRequisitions(updatedRequisitions);
            saveToStorage(updatedRequisitions);

            handleCloseModal();
        } catch (err) {
            console.error('[SalesOrders] Error saving:', err);
            alert('Error saving sales order');
        }
    };

    const handleDelete = async () => {
        try {
            const updatedRequisitions = requisitions.filter(r => r.id !== requisitionToDelete.id);
            setRequisitions(updatedRequisitions);
            setFilteredRequisitions(updatedRequisitions);
            saveToStorage(updatedRequisitions);
            setIsDeleteModalOpen(false);
            setRequisitionToDelete(null);
        } catch (err) {
            console.error('[SalesOrders] Error deleting:', err);
            alert('Error deleting order');
        }
    };

    const handleApprove = async (decision, comments = '') => {
        try {
            const newStatus = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
            updateRequisitionInStorage(currentRequisition.id, {
                status: newStatus,
                approvalComments: comments,
                approvalDate: decision === 'APPROVED' ? new Date().toISOString() : null,
            });
            setIsApprovalModalOpen(false);
        } catch (err) {
            console.error('[SalesOrders] Error updating status:', err);
            alert('Error processing approval');
        }
    };

    const handleSubmitForApproval = async (requisition) => {
        try {
            updateRequisitionInStorage(requisition.id, { status: 'PENDING_APPROVAL' });
        } catch (err) {
            console.error('[SalesOrders] Error submitting for approval:', err);
            alert('Error submitting for approval');
        }
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(amount || 0);
    };

    // Calculate totals
    const calculateItemsTotal = (items) => {
        return items?.length || 0;
    };

    const calculateFulfilledPercentage = (items) => {
        if (!items || items.length === 0) return 0;
        const received = items.filter(item => item.status === 'RECEIVED').length;
        return Math.round((received / items.length) * 100);
    };

    // Render status badge
    const renderStatusBadge = (status) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.DRAFT;
        const Icon = config.icon;
        return (
            <span
                className="status-badge"
                style={{ backgroundColor: config.color }}
            >
                <Icon size={12} />
                {config.label}
            </span>
        );
    };

    // Render item status badge
    const renderItemStatusBadge = (status) => {
        const config = ITEM_STATUS_CONFIG[status] || ITEM_STATUS_CONFIG.REQUESTED;
        return (
            <span
                className="item-status-badge"
                style={{ backgroundColor: config.color }}
            >
                {config.label}
            </span>
        );
    };

    // Render loading state
    if (loading && requisitions.length === 0) {
        return (
            <div className="module-container requisitions-module">
                <div className="loading-state">
                    <FaSpinner className="spinner" />
                    <p>Loading requisitions...</p>
                </div>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="module-container requisitions-module">
                <div className="error-state">
                    <FaExclamationTriangle />
                    <p>Error loading requisitions: {error}</p>
                    <button onClick={loadData}>Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="module-page requisitions-module">
            {/* Header - Consistent Style */}
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">shopping_cart</span>
                    </div>
                    <div className="header-text">
                        <h1>Sales Orders</h1>
                        <p>Manage purchase requisitions and sales orders</p>
                    </div>
                </div>
                <button className="btn-primary-action" onClick={() => handleOpenModal()}>
                    <span className="material-symbols-rounded">add</span>
                    New Order
                </button>
            </div>

            {/* Filters and Search */}
            <div className="module-filters">
                <div className="search-box">
                    <FaSearch />
                    <input
                        type="text"
                        placeholder="Search by folio, requester, warehouse..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <FaFilter />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All Statuses</option>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>
                </div>
                <div className="view-toggle">
                    <button
                        className={viewMode === 'table' ? 'active' : ''}
                        onClick={() => setViewMode('table')}
                    >
                        <FaList />
                    </button>
                    <button
                        className={viewMode === 'grid' ? 'active' : ''}
                        onClick={() => setViewMode('grid')}
                    >
                        <FaTh />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-row">
                <Card className="stat-card">
                    <div className="stat-content">
                        <FaClipboardList className="stat-icon" />
                        <div>
                            <span className="stat-value">{requisitions.length}</span>
                            <span className="stat-label">Total</span>
                        </div>
                    </div>
                </Card>
                <Card className="stat-card pending">
                    <div className="stat-content">
                        <FaClock className="stat-icon" />
                        <div>
                            <span className="stat-value">
                                {requisitions.filter(r => r.status === 'PENDING_APPROVAL').length}
                            </span>
                            <span className="stat-label">Pending</span>
                        </div>
                    </div>
                </Card>
                <Card className="stat-card approved">
                    <div className="stat-content">
                        <FaCheckCircle className="stat-icon" />
                        <div>
                            <span className="stat-value">
                                {requisitions.filter(r => r.status === 'APPROVED').length}
                            </span>
                            <span className="stat-label">Approved</span>
                        </div>
                    </div>
                </Card>
                <Card className="stat-card fulfilled">
                    <div className="stat-content">
                        <FaCheck className="stat-icon" />
                        <div>
                            <span className="stat-value">
                                {requisitions.filter(r => r.status === 'FULFILLED').length}
                            </span>
                            <span className="stat-label">Fulfilled</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Content */}
            {viewMode === 'table' ? (
                <Card className="data-table-card">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th></th>
                                <th>Folio</th>
                                <th>Requester</th>
                                <th>Warehouse</th>
                                <th>Project</th>
                                <th>Items</th>
                                <th>Required Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequisitions.map((requisition) => (
                                <>
                                    <tr key={requisition.id} className={expandedRows[requisition.id] ? 'expanded' : ''}>
                                        <td>
                                            <button
                                                className="expand-btn"
                                                onClick={() => toggleRowExpansion(requisition.id)}
                                            >
                                                {expandedRows[requisition.id] ? <FaChevronDown /> : <FaChevronRight />}
                                            </button>
                                        </td>
                                        <td className="folio-cell">
                                            <strong>{requisition.folio}</strong>
                                        </td>
                                        <td>{requisition.requesterName}</td>
                                        <td>
                                            <FaWarehouse className="cell-icon" />
                                            {requisition.warehouseName}
                                        </td>
                                        <td>{requisition.projectName || '-'}</td>
                                        <td>
                                            <span className="items-count">
                                                <FaBoxOpen />
                                                {calculateItemsTotal(requisition.items)}
                                            </span>
                                        </td>
                                        <td>
                                            <FaCalendarAlt className="cell-icon" />
                                            {formatDate(requisition.requiredAt)}
                                        </td>
                                        <td>{renderStatusBadge(requisition.status)}</td>
                                        <td className="actions-cell">
                                            <button
                                                className="btn-icon view"
                                                onClick={() => handleViewRequisition(requisition)}
                                                title="View details"
                                            >
                                                <FaEye />
                                            </button>
                                            {requisition.status === 'DRAFT' && (
                                                <>
                                                    <button
                                                        className="btn-icon edit"
                                                        onClick={() => handleOpenModal(requisition)}
                                                        title="Edit"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        className="btn-icon approve"
                                                        onClick={() => handleSubmitForApproval(requisition)}
                                                        title="Enviar a aprobación"
                                                    >
                                                        <FaUserCheck />
                                                    </button>
                                                </>
                                            )}
                                            {requisition.status === 'PENDING_APPROVAL' && (
                                                <button
                                                    className="btn-icon approve"
                                                    onClick={() => handleOpenApprovalModal(requisition)}
                                                    title="Approve/Reject"
                                                >
                                                    <FaUserCheck />
                                                </button>
                                            )}
                                            {['DRAFT', 'REJECTED'].includes(requisition.status) && (
                                                <button
                                                    className="btn-icon delete"
                                                    onClick={() => {
                                                        setRequisitionToDelete(requisition);
                                                        setIsDeleteModalOpen(true);
                                                    }}
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                    {expandedRows[requisition.id] && (
                                        <tr className="expanded-row">
                                            <td colSpan="9">
                                                <div className="expanded-content">
                                                    <h4>Requisition Items</h4>
                                                    <table className="items-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Material</th>
                                                                <th>Quantity</th>
                                                                <th>Unit</th>
                                                                <th>Suggested Supplier</th>
                                                                <th>Needed By</th>
                                                                <th>Status</th>
                                                                <th>Received</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {requisition.items.map((item, idx) => (
                                                                <tr key={item.id || idx}>
                                                                    <td>{item.materialName}</td>
                                                                    <td>{item.quantity}</td>
                                                                    <td>{item.unit}</td>
                                                                    <td>{item.suggestedSupplierName || '-'}</td>
                                                                    <td>{formatDate(item.neededBy)}</td>
                                                                    <td>{renderItemStatusBadge(item.status)}</td>
                                                                    <td>
                                                                        {item.receivedQty} / {item.quantity}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    {requisition.comments && (
                                                        <div className="requisition-comments">
                                                            <strong>Comments:</strong> {requisition.comments}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                    {filteredRequisitions.length === 0 && (
                        <div className="empty-state">
                            <FaClipboardList />
                            <p>No se encontraron requisiciones</p>
                        </div>
                    )}
                </Card>
            ) : (
                <div className="requisitions-grid">
                    {filteredRequisitions.map((requisition) => (
                        <Card key={requisition.id} className="requisition-card">
                            <div className="card-header">
                                <span className="folio">{requisition.folio}</span>
                                {renderStatusBadge(requisition.status)}
                            </div>
                            <div className="card-body">
                                <div className="info-row">
                                    <FaUserCheck className="info-icon" />
                                    <span>{requisition.requesterName}</span>
                                </div>
                                <div className="info-row">
                                    <FaWarehouse className="info-icon" />
                                    <span>{requisition.warehouseName}</span>
                                </div>
                                {requisition.projectName && (
                                    <div className="info-row">
                                        <FaClipboardList className="info-icon" />
                                        <span>{requisition.projectName}</span>
                                    </div>
                                )}
                                <div className="info-row">
                                    <FaCalendarAlt className="info-icon" />
                                    <span>Requerido: {formatDate(requisition.requiredAt)}</span>
                                </div>
                                <div className="items-summary">
                                    <FaBoxOpen />
                                    <span>{calculateItemsTotal(requisition.items)} items</span>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${calculateFulfilledPercentage(requisition.items)}%` }}
                                        />
                                    </div>
                                    <span>{calculateFulfilledPercentage(requisition.items)}%</span>
                                </div>
                            </div>
                            <div className="card-actions">
                                <button onClick={() => handleViewRequisition(requisition)}>
                                    <FaEye /> View
                                </button>
                                {requisition.status === 'DRAFT' && (
                                    <button onClick={() => handleOpenModal(requisition)}>
                                        <FaEdit /> Edit
                                    </button>
                                )}
                            </div>
                        </Card>
                    ))}
                    {filteredRequisitions.length === 0 && (
                        <div className="empty-state full-width">
                            <FaClipboardList />
                            <p>No se encontraron requisiciones</p>
                        </div>
                    )}
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={currentRequisition.id ? 'Edit Sales Order' : 'New Sales Order'}
                size="large"
            >
                <div className="requisition-form" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
                    <div className="form-section">
                        <h3>Información General</h3>
                        <div className="form-grid">
                            <div className="form-group">
                                <label>Folio</label>
                                <input
                                    type="text"
                                    name="folio"
                                    value={currentRequisition.folio}
                                    onChange={handleInputChange}
                                    readOnly
                                />
                            </div>
                            <div className="form-group">
                                <label>Estado</label>
                                <select
                                    name="status"
                                    value={currentRequisition.status}
                                    onChange={handleInputChange}
                                    disabled={currentRequisition.status !== 'DRAFT'}
                                >
                                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                        <option key={key} value={key}>{config.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Linked Quotation</label>
                                <select
                                    name="quotationId"
                                    value={currentRequisition.quotationId}
                                    onChange={(e) => handleQuotationSelect(e.target.value)}
                                >
                                    <option value="">No quotation (manual)</option>
                                    {quotations.map(q => (
                                        <option key={q.id} value={q.id}>
                                            {q.folio} - {q.clientName} - {formatCurrency(q.total)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Billing Entity *</label>
                                <select
                                    name="billingEntity"
                                    value={currentRequisition.billingEntity}
                                    onChange={handleInputChange}
                                >
                                    {BILLING_ENTITIES.map(entity => (
                                        <option key={entity.id} value={entity.id}>
                                            {entity.name} {entity.syncsToQB ? '(QB)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Cliente</label>
                                <select
                                    name="customerId"
                                    value={currentRequisition.customerId}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Sin cliente</option>
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.companyName || client.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Proyecto</label>
                                <select
                                    name="projectId"
                                    value={currentRequisition.projectId}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Sin proyecto</option>
                                    {projects.map(proj => (
                                        <option key={proj.id} value={proj.id}>{proj.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Destination Warehouse *</label>
                                <select
                                    name="warehouseId"
                                    value={currentRequisition.warehouseId}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Seleccionar almacén</option>
                                    {warehouses.map(wh => (
                                        <option key={wh.id} value={wh.id}>{wh.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Approval Date</label>
                                <input
                                    type="date"
                                    name="approvalDate"
                                    value={currentRequisition.approvalDate?.split('T')[0] || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Fecha Requerida</label>
                                <input
                                    type="date"
                                    name="requiredAt"
                                    value={currentRequisition.requiredAt?.split('T')[0] || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>ETA (Entrega Estimada)</label>
                                <input
                                    type="date"
                                    name="eta"
                                    value={currentRequisition.eta?.split('T')[0] || ''}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="form-group">
                                <label>Deposit ($)</label>
                                <input
                                    type="number"
                                    name="deposit"
                                    value={currentRequisition.deposit}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div className="form-group">
                                <label>Deposit Paid</label>
                                <select
                                    name="depositPaid"
                                    value={currentRequisition.depositPaid ? 'true' : 'false'}
                                    onChange={(e) => handleInputChange({ target: { name: 'depositPaid', value: e.target.value === 'true' } })}
                                >
                                    <option value="false">No</option>
                                    <option value="true">Sí</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group full-width">
                            <label>Comments</label>
                            <textarea
                                name="comments"
                                value={currentRequisition.comments}
                                onChange={handleInputChange}
                                rows="3"
                                placeholder="Notas adicionales sobre la requisición..."
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Items de la Orden</h3>

                        {currentRequisition.quotationId && (
                            <p className="info-text">
                                <FaCheckCircle style={{ color: '#28a745', marginRight: '8px' }} />
                                Items loaded from quotation {currentRequisition.quotationFolio}
                            </p>
                        )}

                        {!currentRequisition.quotationId && (
                            <div className="item-form">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Description *</label>
                                        <input
                                            type="text"
                                            name="description"
                                            value={currentItem.description}
                                            onChange={handleItemInputChange}
                                            placeholder="Descripción del producto..."
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Cantidad *</label>
                                        <input
                                            type="number"
                                            name="quantity"
                                            value={currentItem.quantity}
                                            onChange={handleItemInputChange}
                                            min="1"
                                            step="1"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Precio Unitario</label>
                                        <input
                                            type="number"
                                            name="unitPrice"
                                            value={currentItem.unitPrice}
                                            onChange={handleItemInputChange}
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={handleAddItem}
                                >
                                    {editingItemIndex !== null ? 'Update Item' : 'Add Item'}
                                </button>
                            </div>
                        )}

                        {currentRequisition.items.length > 0 && (
                            <table className="items-table">
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Description</th>
                                        <th>Quantity</th>
                                        <th>Unit Price</th>
                                        <th>Subtotal</th>
                                        {!currentRequisition.quotationId && <th>Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentRequisition.items.map((item, index) => (
                                        <tr key={item.id || index}>
                                            <td>{item.productName || '-'}</td>
                                            <td>{item.description || '-'}</td>
                                            <td>{item.quantity}</td>
                                            <td>{formatCurrency(item.unitPrice)}</td>
                                            <td>{formatCurrency(item.subtotal)}</td>
                                            {!currentRequisition.quotationId && (
                                                <td className="actions-cell">
                                                    <button
                                                        className="btn-icon edit"
                                                        onClick={() => handleEditItem(index)}
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        className="btn-icon delete"
                                                        onClick={() => handleRemoveItem(index)}
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Totals summary */}
                    {currentRequisition.total > 0 && (
                        <div className="order-totals">
                            <div className="total-row">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(currentRequisition.subtotal)}</span>
                            </div>
                            <div className="total-row">
                                <span>IVA (16%):</span>
                                <span>{formatCurrency(currentRequisition.tax)}</span>
                            </div>
                            <div className="total-row grand-total">
                                <span>Total:</span>
                                <span>{formatCurrency(currentRequisition.total)}</span>
                            </div>
                        </div>
                    )}

                    <div className="form-actions">
                        <button className="btn-secondary" onClick={handleCloseModal}>
                            Cancel
                        </button>
                        <button className="btn-primary" onClick={handleSave}>
                            {currentRequisition.id ? 'Update' : 'Create'} Sales Order
                        </button>
                    </div>
                </div>
            </Modal>

            {/* View Detail Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title={`Sales Order ${currentRequisition.folio}`}
                size="large"
            >
                <div className="requisition-detail">
                    <div className="detail-header">
                        {renderStatusBadge(currentRequisition.status)}
                        <span className="detail-date">
                            Solicitada: {formatDate(currentRequisition.requestedAt)}
                        </span>
                    </div>

                    <div className="detail-grid">
                        <div className="detail-item">
                            <label>Requester</label>
                            <span>{currentRequisition.requesterName}</span>
                        </div>
                        <div className="detail-item">
                            <label>Destination Warehouse</label>
                            <span>{currentRequisition.warehouseName}</span>
                        </div>
                        <div className="detail-item">
                            <label>Fecha Requerida</label>
                            <span>{formatDate(currentRequisition.requiredAt)}</span>
                        </div>
                        <div className="detail-item">
                            <label>Proyecto</label>
                            <span>{currentRequisition.projectName || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <label>Cliente</label>
                            <span>{currentRequisition.customerName || 'N/A'}</span>
                        </div>
                    </div>

                    {currentRequisition.comments && (
                        <div className="detail-comments">
                            <label>Comments</label>
                            <p>{currentRequisition.comments}</p>
                        </div>
                    )}

                    <div className="detail-items">
                        <h4>Items ({currentRequisition.items?.length || 0})</h4>
                        <table className="items-table">
                            <thead>
                                <tr>
                                    <th>Material</th>
                                    <th>Quantity</th>
                                    <th>Unit</th>
                                    <th>Suggested Supplier</th>
                                    <th>Status</th>
                                    <th>Ordered</th>
                                    <th>Received</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRequisition.items?.map((item, idx) => (
                                    <tr key={item.id || idx}>
                                        <td>{item.materialName}</td>
                                        <td>{item.quantity}</td>
                                        <td>{item.unit}</td>
                                        <td>{item.suggestedSupplierName || '-'}</td>
                                        <td>{renderItemStatusBadge(item.status)}</td>
                                        <td>{item.orderedQty}</td>
                                        <td>{item.receivedQty}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="detail-progress">
                        <label>Progreso de Cumplimiento</label>
                        <div className="progress-container">
                            <div className="progress-bar large">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${calculateFulfilledPercentage(currentRequisition.items)}%` }}
                                />
                            </div>
                            <span>{calculateFulfilledPercentage(currentRequisition.items)}% completado</span>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Approval Modal */}
            <Modal
                isOpen={isApprovalModalOpen}
                onClose={() => setIsApprovalModalOpen(false)}
                title="Approve Requisition"
                size="medium"
            >
                <div className="approval-form">
                    <p>
                        Do you want to approve or reject requisition <strong>{currentRequisition.folio}</strong>?
                    </p>
                    <div className="approval-summary">
                        <div>
                            <strong>Requester:</strong> {currentRequisition.requesterName}
                        </div>
                        <div>
                            <strong>Items:</strong> {currentRequisition.items?.length || 0}
                        </div>
                        <div>
                            <strong>Warehouse:</strong> {currentRequisition.warehouseName}
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Approval Comments</label>
                        <textarea
                            id="approvalComments"
                            rows="3"
                            placeholder="Add optional comments..."
                        />
                    </div>
                    <div className="approval-actions">
                        <button
                            className="btn-danger"
                            onClick={() => {
                                const comments = document.getElementById('approvalComments').value;
                                handleApprove('REJECTED', comments);
                            }}
                        >
                            <FaTimes /> Reject
                        </button>
                        <button
                            className="btn-success"
                            onClick={() => {
                                const comments = document.getElementById('approvalComments').value;
                                handleApprove('APPROVED', comments);
                            }}
                        >
                            <FaCheck /> Approve
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
                        Are you sure you want to delete requisition{' '}
                        <strong>{requisitionToDelete?.folio}</strong>?
                    </p>
                    <p className="warning-text">Esta acción no se puede deshacer.</p>
                    <div className="confirmation-actions">
                        <button
                            className="btn-secondary"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn-danger"
                            onClick={handleDelete}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Requisitions;
