/**
 * Quotations Module (Cotizaciones / Estimates)
 * First step in MRP flow - Creates estimates that can become Sales Orders
 * Only Dovecreek projects sync to QuickBooks
 */

import { useState, useEffect } from 'react';
import { Icon, SearchBox, Modal } from '../../common';
import { isApiEnabled, clientsApi, productsApi } from '../../../services/api';
import { clientsData as initialClientsData, productsData as initialProductsData } from '../../../data/initialData';
import './styles.css';

// Billing entities
const BILLING_ENTITIES = [
    { id: 'DOVECREEK', name: 'Dovecreek Maquila', syncsToQB: true },
    { id: 'INNOVATIVE', name: 'Innovative Mx', syncsToQB: false },
];

// Status configuration
const STATUS_CONFIG = {
    DRAFT: { label: 'Draft', color: '#6c757d', icon: 'edit' },
    SENT: { label: 'Sent', color: '#17a2b8', icon: 'send' },
    APPROVED: { label: 'Approved', color: '#28a745', icon: 'check_circle' },
    REJECTED: { label: 'Rejected', color: '#dc3545', icon: 'cancel' },
    CONVERTED: { label: 'Converted to SO', color: '#6f42c1', icon: 'swap_horiz' },
    CANCELLED: { label: 'Cancelled', color: '#6c757d', icon: 'block' },
};

// Empty quotation template
const emptyQuotation = {
    id: null,
    folio: '',
    clientId: '',
    billingEntity: 'DOVECREEK',
    status: 'DRAFT',
    createdAt: new Date().toISOString(),
    approvalDate: '',
    eta: '',
    deposit: 0,
    depositPaid: false,
    subtotal: 0,
    tax: 0,
    total: 0,
    notes: '',
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

// Normalize client data to have consistent id and name fields
const normalizeClient = (client) => ({
    id: client.id || client.idClient || client._id || String(Math.random()),
    name: client.name,
    companyName: client.companyName || client.company,
    email: client.email,
    phone: client.phone,
    status: client.status,
});

// Normalize product data
const normalizeProduct = (product) => ({
    id: product.id || product.idProduct || product._id || String(Math.random()),
    name: product.name,
    description: product.description,
    price: product.price || product.unitPrice || 0,
    category: product.category || product.categoryName,
});

const QuotationsModule = () => {
    // LocalStorage key for quotations
    const STORAGE_KEY = 'dkraft_quotations';

    // Load quotations from localStorage
    const loadFromStorage = () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    };

    // Save quotations to localStorage
    const saveToStorage = (data) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('[Quotations] Error saving to localStorage:', error);
        }
    };

    // Data state
    const [quotations, setQuotations] = useState([]);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [viewMode, setViewMode] = useState('table');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // add, edit, view
    const [currentQuotation, setCurrentQuotation] = useState(emptyQuotation);
    const [currentItem, setCurrentItem] = useState(emptyItem);
    const [editingItemIndex, setEditingItemIndex] = useState(null);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load quotations from localStorage first
            const localQuotations = loadFromStorage();
            setQuotations(localQuotations);

            let clientsData = [];
            let productsData = [];

            // Try to load clients and products from API
            if (isApiEnabled()) {
                try {
                    [clientsData, productsData] = await Promise.all([
                        clientsApi.getAll(),
                        productsApi.getAll(),
                    ]);
                    console.log('[Quotations] Loaded clients from API:', clientsData?.length || 0);
                    console.log('[Quotations] Loaded products from API:', productsData?.length || 0);

                    // Save to localStorage for offline use
                    if (clientsData?.length > 0) {
                        localStorage.setItem('dkraft_clients_cache', JSON.stringify(clientsData));
                    }
                    if (productsData?.length > 0) {
                        localStorage.setItem('dkraft_products', JSON.stringify(productsData));
                    }
                } catch (apiError) {
                    console.warn('[Quotations] API error, trying localStorage cache:', apiError.message);
                }
            }

            // Fallback to localStorage cache if API didn't return data
            if (!clientsData || clientsData.length === 0) {
                const cachedClients = localStorage.getItem('dkraft_clients_cache');
                if (cachedClients) {
                    clientsData = JSON.parse(cachedClients);
                    console.log('[Quotations] Loaded clients from cache:', clientsData.length);
                }
            }

            if (!productsData || productsData.length === 0) {
                const cachedProducts = localStorage.getItem('dkraft_products');
                if (cachedProducts) {
                    productsData = JSON.parse(cachedProducts);
                    console.log('[Quotations] Loaded products from cache:', productsData.length);
                }
            }

            // Final fallback to initial data if nothing else is available
            if (!clientsData || clientsData.length === 0) {
                console.log('[Quotations] Using initial clients data as fallback');
                clientsData = initialClientsData;
            }

            if (!productsData || productsData.length === 0) {
                console.log('[Quotations] Using initial products data as fallback');
                productsData = initialProductsData;
            }

            // Normalize data to ensure consistent field names
            const normalizedClients = (clientsData || []).map(normalizeClient);
            const normalizedProducts = (productsData || []).map(normalizeProduct);

            setClients(normalizedClients);
            setProducts(normalizedProducts);
        } catch (error) {
            console.error('[Quotations] Error loading data:', error);
            // Even on error, use initial data
            setClients(initialClientsData.map(normalizeClient));
            setProducts(initialProductsData.map(normalizeProduct));
        } finally {
            setIsLoading(false);
        }
    };

    // Generate folio
    const generateFolio = () => {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `COT-${year}${month}-${random}`;
    };

    // Filter quotations
    const filteredQuotations = quotations.filter(q => {
        const matchesSearch =
            q.folio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Calculate item subtotal
    const calculateItemSubtotal = (item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        const discount = parseFloat(item.discount) || 0;
        return (qty * price) - discount;
    };

    // Calculate quotation totals
    const calculateTotals = (items) => {
        const subtotal = items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
        const tax = subtotal * 0.16; // 16% IVA
        const total = subtotal + tax;
        return { subtotal, tax, total };
    };

    // Modal handlers
    const handleOpenModal = (mode, quotation = null) => {
        setModalMode(mode);
        if (quotation) {
            setCurrentQuotation({ ...quotation });
        } else {
            setCurrentQuotation({ ...emptyQuotation, folio: generateFolio() });
        }
        setCurrentItem(emptyItem);
        setEditingItemIndex(null);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setCurrentQuotation(emptyQuotation);
        setCurrentItem(emptyItem);
        setEditingItemIndex(null);
    };

    // Input handlers
    const handleInputChange = (field, value) => {
        if (field === 'clientId') {
            // When client changes, also update clientName
            const client = clients.find(c => c.id === value);
            setCurrentQuotation(prev => ({
                ...prev,
                clientId: value,
                clientName: client ? (client.companyName || client.name) : ''
            }));
        } else {
            setCurrentQuotation(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleItemInputChange = (field, value) => {
        const updatedItem = { ...currentItem, [field]: value };
        // Auto-calculate subtotal
        updatedItem.subtotal = calculateItemSubtotal(updatedItem);
        setCurrentItem(updatedItem);
    };

    // Item handlers
    const handleAddItem = () => {
        if (!currentItem.productId && !currentItem.description) {
            alert('Select a product or add a description');
            return;
        }

        const product = products.find(p => p.id === currentItem.productId);
        const newItem = {
            ...currentItem,
            id: `temp-${Date.now()}`,
            productName: product?.name || currentItem.description || 'Custom item',
            subtotal: calculateItemSubtotal(currentItem),
        };

        let updatedItems;
        if (editingItemIndex !== null) {
            updatedItems = [...currentQuotation.items];
            updatedItems[editingItemIndex] = newItem;
            setEditingItemIndex(null);
        } else {
            updatedItems = [...currentQuotation.items, newItem];
        }

        const totals = calculateTotals(updatedItems);
        setCurrentQuotation(prev => ({
            ...prev,
            items: updatedItems,
            ...totals,
        }));
        setCurrentItem(emptyItem);
    };

    const handleEditItem = (index) => {
        setCurrentItem(currentQuotation.items[index]);
        setEditingItemIndex(index);
    };

    const handleRemoveItem = (index) => {
        const updatedItems = currentQuotation.items.filter((_, i) => i !== index);
        const totals = calculateTotals(updatedItems);
        setCurrentQuotation(prev => ({
            ...prev,
            items: updatedItems,
            ...totals,
        }));
    };

    // Save quotation (uses localStorage)
    const handleSave = async () => {
        try {
            // Auto-add current item if there's pending data
            let itemsToSave = [...currentQuotation.items];
            if (currentItem.productId || currentItem.description || currentItem.quantity > 1 || currentItem.unitPrice > 0) {
                const product = products.find(p => p.id === currentItem.productId);
                const pendingItem = {
                    ...currentItem,
                    id: `temp-${Date.now()}`,
                    productName: product?.name || currentItem.description || 'Custom item',
                    subtotal: calculateItemSubtotal(currentItem),
                };
                itemsToSave = [...itemsToSave, pendingItem];
            }

            if (itemsToSave.length === 0) {
                alert('You must add at least one item to the quotation');
                return;
            }

            if (!currentQuotation.clientId && !currentQuotation.clientName) {
                alert('You must select a client');
                return;
            }

            // Recalculate totals with all items
            const totals = calculateTotals(itemsToSave);

            const client = clients.find(c => c.id === currentQuotation.clientId);
            const dataToSave = {
                ...currentQuotation,
                items: itemsToSave,
                ...totals,
                clientName: client?.companyName || client?.name || currentQuotation.clientName || 'Manual Client',
                skipQBSync: currentQuotation.billingEntity !== 'DOVECREEK',
                updatedAt: new Date().toISOString(),
            };

            // Generate folio if new quotation
            if (!dataToSave.folio) {
                dataToSave.folio = generateFolio();
            }

            console.log('[Quotations] Saving to localStorage:', dataToSave);

            let updatedQuotations;
            if (currentQuotation.id) {
                // Update existing
                updatedQuotations = quotations.map(q =>
                    q.id === currentQuotation.id ? dataToSave : q
                );
            } else {
                // Create new
                dataToSave.id = `local-${Date.now()}`;
                dataToSave.createdAt = new Date().toISOString();
                updatedQuotations = [...quotations, dataToSave];
            }

            setQuotations(updatedQuotations);
            saveToStorage(updatedQuotations);

            handleCloseModal();
        } catch (error) {
            console.error('[Quotations] Error saving:', error);
            alert('Error saving quotation: ' + error.message);
        }
    };

    // Update quotation status locally
    const updateQuotationStatus = (quotationId, updates) => {
        const updatedQuotations = quotations.map(q =>
            q.id === quotationId ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q
        );
        setQuotations(updatedQuotations);
        saveToStorage(updatedQuotations);
    };

    // Status actions
    const handleSendToClient = async (quotation) => {
        try {
            updateQuotationStatus(quotation.id, { status: 'SENT' });
        } catch (error) {
            console.error('[Quotations] Error sending:', error);
            alert('Error sending quotation');
        }
    };

    const handleApprove = async (quotation) => {
        try {
            updateQuotationStatus(quotation.id, {
                status: 'APPROVED',
                approvalDate: new Date().toISOString(),
            });
        } catch (error) {
            console.error('[Quotations] Error approving:', error);
            alert('Error approving quotation');
        }
    };

    const handleConvertToSalesOrder = async (quotation) => {
        try {
            // Update quotation status to CONVERTED
            updateQuotationStatus(quotation.id, { status: 'CONVERTED' });

            // Create a Sales Order in localStorage
            const SALES_ORDERS_KEY = 'dkraft_sales_orders';
            const existingSalesOrders = JSON.parse(localStorage.getItem(SALES_ORDERS_KEY) || '[]');

            const newSalesOrder = {
                id: `local-${Date.now()}`,
                folio: `SO-${quotation.folio.replace('COT-', '')}`,
                quotationId: quotation.id,
                quotationFolio: quotation.folio,
                clientId: quotation.clientId,
                clientName: quotation.clientName,
                billingEntity: quotation.billingEntity,
                status: 'PENDING',
                approvalDate: quotation.approvalDate,
                eta: quotation.eta,
                deposit: quotation.deposit,
                depositPaid: quotation.depositPaid,
                items: quotation.items,
                subtotal: quotation.subtotal,
                tax: quotation.tax,
                total: quotation.total,
                notes: quotation.notes,
                createdAt: new Date().toISOString(),
                skipQBSync: quotation.billingEntity !== 'DOVECREEK',
            };

            localStorage.setItem(SALES_ORDERS_KEY, JSON.stringify([...existingSalesOrders, newSalesOrder]));

            alert(`Quotation converted to Sales Order: ${newSalesOrder.folio}`);
        } catch (error) {
            console.error('[Quotations] Error converting:', error);
            alert('Error converting quotation');
        }
    };

    const handleDelete = async (quotation) => {
        if (!confirm(`Delete quotation ${quotation.folio}?`)) return;
        try {
            const updatedQuotations = quotations.filter(q => q.id !== quotation.id);
            setQuotations(updatedQuotations);
            saveToStorage(updatedQuotations);
        } catch (error) {
            console.error('[Quotations] Error deleting:', error);
            alert('Error deleting quotation');
        }
    };

    // Format helpers
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(amount || 0);
    };

    // Stats
    const stats = {
        total: quotations.length,
        draft: quotations.filter(q => q.status === 'DRAFT').length,
        sent: quotations.filter(q => q.status === 'SENT').length,
        approved: quotations.filter(q => q.status === 'APPROVED').length,
        converted: quotations.filter(q => q.status === 'CONVERTED').length,
    };

    return (
        <div className="module-page quotations-module">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <Icon name="request_quote" />
                    </div>
                    <div className="header-text">
                        <h1>Quotations</h1>
                        <p>Manage quotations and estimates for clients</p>
                    </div>
                </div>
                <button className="btn-primary-action" onClick={() => handleOpenModal('add')}>
                    <Icon name="add" />
                    New Quotation
                </button>
            </div>

            {/* Stats */}
            <div className="module-stats-row">
                <div className="module-stat-card">
                    <div className="stat-icon blue">
                        <Icon name="description" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon gray">
                        <Icon name="edit_note" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.draft}</span>
                        <span className="stat-label">Draft</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon orange">
                        <Icon name="send" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.sent}</span>
                        <span className="stat-label">Sent</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon green">
                        <Icon name="check_circle" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.approved}</span>
                        <span className="stat-label">Approved</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon purple">
                        <Icon name="swap_horiz" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.converted}</span>
                        <span className="stat-label">Converted</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="module-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by folio or client..."
                />
                <div className="toolbar-right">
                    <select
                        className="status-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">All statuses</option>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>
                    <div className="view-toggle">
                        <button
                            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                            onClick={() => setViewMode('table')}
                        >
                            <Icon name="table_rows" />
                        </button>
                        <button
                            className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                            onClick={() => setViewMode('cards')}
                        >
                            <Icon name="grid_view" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="materials-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading quotations...</p>
                </div>
            ) : viewMode === 'table' ? (
                <div className="quotations-table-container">
                    <table className="quotations-table">
                        <thead>
                            <tr>
                                <th>Folio</th>
                                <th>Client</th>
                                <th>Entity</th>
                                <th>Date</th>
                                <th>ETA</th>
                                <th>Items</th>
                                <th>Total</th>
                                <th>Deposit</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredQuotations.map((quotation) => {
                                const entity = BILLING_ENTITIES.find(e => e.id === quotation.billingEntity);
                                const statusConfig = STATUS_CONFIG[quotation.status] || STATUS_CONFIG.DRAFT;
                                return (
                                    <tr key={quotation.id}>
                                        <td className="folio-cell">
                                            <strong>{quotation.folio}</strong>
                                            {entity?.syncsToQB && (
                                                <span className="qb-badge" title="Sincroniza con QuickBooks">QB</span>
                                            )}
                                        </td>
                                        <td>{quotation.clientName || '-'}</td>
                                        <td>
                                            <span className={`entity-badge ${quotation.billingEntity?.toLowerCase()}`}>
                                                {entity?.name || quotation.billingEntity}
                                            </span>
                                        </td>
                                        <td>{formatDate(quotation.createdAt)}</td>
                                        <td>{formatDate(quotation.eta)}</td>
                                        <td>{quotation.items?.length || 0}</td>
                                        <td className="amount-cell">{formatCurrency(quotation.total)}</td>
                                        <td>
                                            <span className={`deposit-badge ${quotation.depositPaid ? 'paid' : 'pending'}`}>
                                                {formatCurrency(quotation.deposit)}
                                                {quotation.depositPaid && <Icon name="check" />}
                                            </span>
                                        </td>
                                        <td>
                                            <span
                                                className="status-badge"
                                                style={{ backgroundColor: statusConfig.color }}
                                            >
                                                <Icon name={statusConfig.icon} />
                                                {statusConfig.label}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <button
                                                className="btn-action"
                                                onClick={() => handleOpenModal('view', quotation)}
                                                title="View"
                                            >
                                                <Icon name="visibility" />
                                            </button>
                                            {quotation.status === 'DRAFT' && (
                                                <>
                                                    <button
                                                        className="btn-action"
                                                        onClick={() => handleOpenModal('edit', quotation)}
                                                        title="Edit"
                                                    >
                                                        <Icon name="edit" />
                                                    </button>
                                                    <button
                                                        className="btn-action send"
                                                        onClick={() => handleSendToClient(quotation)}
                                                        title="Send to client"
                                                    >
                                                        <Icon name="send" />
                                                    </button>
                                                </>
                                            )}
                                            {quotation.status === 'SENT' && (
                                                <button
                                                    className="btn-action approve"
                                                    onClick={() => handleApprove(quotation)}
                                                    title="Approve"
                                                >
                                                    <Icon name="check_circle" />
                                                </button>
                                            )}
                                            {quotation.status === 'APPROVED' && !quotation.depositPaid && (
                                                <button
                                                    className="btn-action"
                                                    onClick={() => handleOpenModal('edit', quotation)}
                                                    title="Register deposit"
                                                >
                                                    <Icon name="payments" />
                                                </button>
                                            )}
                                            {quotation.status === 'APPROVED' && quotation.depositPaid && (
                                                <button
                                                    className="btn-action convert"
                                                    onClick={() => handleConvertToSalesOrder(quotation)}
                                                    title="Convert to Sales Order"
                                                >
                                                    <Icon name="swap_horiz" />
                                                </button>
                                            )}
                                            {['DRAFT', 'REJECTED'].includes(quotation.status) && (
                                                <button
                                                    className="btn-action delete"
                                                    onClick={() => handleDelete(quotation)}
                                                    title="Delete"
                                                >
                                                    <Icon name="delete" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredQuotations.length === 0 && (
                        <div className="empty-state">
                            <Icon name="request_quote" />
                            <p>No quotations found</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="quotations-cards-grid">
                    {filteredQuotations.map((quotation) => {
                        const entity = BILLING_ENTITIES.find(e => e.id === quotation.billingEntity);
                        const statusConfig = STATUS_CONFIG[quotation.status] || STATUS_CONFIG.DRAFT;
                        return (
                            <div key={quotation.id} className="quotation-card">
                                <div className="card-header">
                                    <span className="folio">{quotation.folio}</span>
                                    <span
                                        className="status-badge"
                                        style={{ backgroundColor: statusConfig.color }}
                                    >
                                        <Icon name={statusConfig.icon} />
                                        {statusConfig.label}
                                    </span>
                                </div>
                                <div className="card-body">
                                    <div className="card-row">
                                        <Icon name="business" />
                                        <span>{quotation.clientName || 'No client'}</span>
                                    </div>
                                    <div className="card-row">
                                        <Icon name="domain" />
                                        <span className={`entity-badge ${quotation.billingEntity?.toLowerCase()}`}>
                                            {entity?.name || quotation.billingEntity}
                                        </span>
                                    </div>
                                    <div className="card-row">
                                        <Icon name="calendar_today" />
                                        <span>{formatDate(quotation.createdAt)}</span>
                                    </div>
                                    <div className="card-row">
                                        <Icon name="inventory_2" />
                                        <span>{quotation.items?.length || 0} items</span>
                                    </div>
                                    <div className="card-total">
                                        <span className="label">Total:</span>
                                        <span className="amount">{formatCurrency(quotation.total)}</span>
                                    </div>
                                </div>
                                <div className="card-actions">
                                    <button onClick={() => handleOpenModal('view', quotation)}>
                                        <Icon name="visibility" /> View
                                    </button>
                                    {quotation.status === 'DRAFT' && (
                                        <button onClick={() => handleOpenModal('edit', quotation)}>
                                            <Icon name="edit" /> Edit
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {filteredQuotations.length === 0 && (
                        <div className="empty-state full-width">
                            <Icon name="request_quote" />
                            <p>No quotations found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <Modal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    title={
                        modalMode === 'add' ? 'New Quotation' :
                        modalMode === 'edit' ? 'Edit Quotation' :
                        `Quotation ${currentQuotation.folio}`
                    }
                    icon={modalMode === 'view' ? 'visibility' : 'request_quote'}
                    size="large"
                >
                    <div className="quotation-form" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: '8px' }}>
                        {/* General Info Section */}
                        <div className="form-section">
                            <h3><Icon name="info" /> General Information</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Folio</label>
                                    <input
                                        type="text"
                                        value={currentQuotation.folio}
                                        readOnly
                                        disabled
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        value={currentQuotation.status}
                                        onChange={(e) => handleInputChange('status', e.target.value)}
                                        disabled={modalMode === 'view'}
                                    >
                                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                            <option key={key} value={key}>{config.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Client *</label>
                                    <select
                                        value={currentQuotation.clientId}
                                        onChange={(e) => handleInputChange('clientId', e.target.value)}
                                        disabled={modalMode === 'view'}
                                        required
                                    >
                                        <option value="">Select client</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>
                                                {client.companyName || client.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Billing Entity *</label>
                                    <select
                                        value={currentQuotation.billingEntity}
                                        onChange={(e) => handleInputChange('billingEntity', e.target.value)}
                                        disabled={modalMode === 'view'}
                                    >
                                        {BILLING_ENTITIES.map(entity => (
                                            <option key={entity.id} value={entity.id}>
                                                {entity.name} {entity.syncsToQB ? '(QB)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Approval Date</label>
                                    <input
                                        type="date"
                                        value={currentQuotation.approvalDate?.split('T')[0] || ''}
                                        onChange={(e) => handleInputChange('approvalDate', e.target.value)}
                                        disabled={modalMode === 'view'}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>ETA (Estimated Delivery Date)</label>
                                    <input
                                        type="date"
                                        value={currentQuotation.eta?.split('T')[0] || ''}
                                        onChange={(e) => handleInputChange('eta', e.target.value)}
                                        disabled={modalMode === 'view'}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Deposit</label>
                                    <input
                                        type="number"
                                        value={currentQuotation.deposit}
                                        onChange={(e) => handleInputChange('deposit', parseFloat(e.target.value) || 0)}
                                        disabled={modalMode === 'view'}
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Deposit Paid</label>
                                    <select
                                        value={currentQuotation.depositPaid ? 'true' : 'false'}
                                        onChange={(e) => handleInputChange('depositPaid', e.target.value === 'true')}
                                        disabled={modalMode === 'view'}
                                    >
                                        <option value="false">No</option>
                                        <option value="true">Yes</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label>Notes</label>
                                <textarea
                                    value={currentQuotation.notes}
                                    onChange={(e) => handleInputChange('notes', e.target.value)}
                                    disabled={modalMode === 'view'}
                                    rows={3}
                                    placeholder="Additional notes..."
                                />
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="form-section">
                            <h3><Icon name="list" /> Quotation Items</h3>

                            {modalMode !== 'view' && (
                                <div className="item-form">
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Product</label>
                                            <select
                                                value={currentItem.productId}
                                                onChange={(e) => {
                                                    const product = products.find(p => p.id === e.target.value);
                                                    handleItemInputChange('productId', e.target.value);
                                                    if (product) {
                                                        handleItemInputChange('productName', product.name);
                                                        handleItemInputChange('unitPrice', product.price || 0);
                                                    }
                                                }}
                                            >
                                                <option value="">Select product</option>
                                                {products.map(product => (
                                                    <option key={product.id} value={product.id}>
                                                        {product.name} - {formatCurrency(product.price)}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Description</label>
                                            <input
                                                type="text"
                                                value={currentItem.description}
                                                onChange={(e) => handleItemInputChange('description', e.target.value)}
                                                placeholder="Item description..."
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Quantity</label>
                                            <input
                                                type="number"
                                                value={currentItem.quantity}
                                                onChange={(e) => handleItemInputChange('quantity', parseFloat(e.target.value) || 1)}
                                                min="1"
                                                step="1"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Unit Price</label>
                                            <input
                                                type="number"
                                                value={currentItem.unitPrice}
                                                onChange={(e) => handleItemInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Discount</label>
                                            <input
                                                type="number"
                                                value={currentItem.discount}
                                                onChange={(e) => handleItemInputChange('discount', parseFloat(e.target.value) || 0)}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Subtotal</label>
                                            <input
                                                type="text"
                                                value={formatCurrency(currentItem.subtotal)}
                                                readOnly
                                                disabled
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn-add-item"
                                        onClick={handleAddItem}
                                    >
                                        <Icon name={editingItemIndex !== null ? 'check' : 'add'} />
                                        {editingItemIndex !== null ? 'Update Item' : 'Add Item'}
                                    </button>
                                </div>
                            )}

                            {/* Items table */}
                            {currentQuotation.items.length > 0 && (
                                <table className="items-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Description</th>
                                            <th>Quantity</th>
                                            <th>Unit Price</th>
                                            <th>Discount</th>
                                            <th>Subtotal</th>
                                            {modalMode !== 'view' && <th>Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentQuotation.items.map((item, index) => (
                                            <tr key={item.id || index}>
                                                <td>{item.productName || '-'}</td>
                                                <td>{item.description || '-'}</td>
                                                <td>{item.quantity}</td>
                                                <td>{formatCurrency(item.unitPrice)}</td>
                                                <td>{formatCurrency(item.discount)}</td>
                                                <td>{formatCurrency(item.subtotal)}</td>
                                                {modalMode !== 'view' && (
                                                    <td className="actions-cell">
                                                        <button
                                                            className="btn-action"
                                                            onClick={() => handleEditItem(index)}
                                                        >
                                                            <Icon name="edit" />
                                                        </button>
                                                        <button
                                                            className="btn-action delete"
                                                            onClick={() => handleRemoveItem(index)}
                                                        >
                                                            <Icon name="delete" />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {/* Totals */}
                            <div className="quotation-totals">
                                <div className="total-row">
                                    <span>Subtotal:</span>
                                    <span>{formatCurrency(currentQuotation.subtotal)}</span>
                                </div>
                                <div className="total-row">
                                    <span>IVA (16%):</span>
                                    <span>{formatCurrency(currentQuotation.tax)}</span>
                                </div>
                                <div className="total-row grand-total">
                                    <span>Total:</span>
                                    <span>{formatCurrency(currentQuotation.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        {modalMode !== 'view' && (
                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={handleCloseModal}>
                                    Cancel
                                </button>
                                <button className="btn-save" onClick={handleSave}>
                                    <Icon name="save" />
                                    {currentQuotation.id ? 'Update' : 'Create'} Quotation
                                </button>
                            </div>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default QuotationsModule;
