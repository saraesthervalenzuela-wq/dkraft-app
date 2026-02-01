import { useState, useEffect, useRef, useCallback } from 'react';
import { Icon, SearchBox, Modal } from '../../common';
import { isApiEnabled, productsApi, categoriesApi } from '../../../services/api';

// Polling interval for QB sync status (30 seconds)
const QB_SYNC_POLL_INTERVAL = 30000;

// LocalStorage key for products
const STORAGE_KEY = 'dkraft_products';
const CATEGORIES_KEY = 'dkraft_product_categories';

/**
 * Default categories for products
 */
const defaultCategories = [
    { id: '1', name: 'Furniture' },
    { id: '2', name: 'Cabinets' },
    { id: '3', name: 'Doors' },
    { id: '4', name: 'Tables' },
    { id: '5', name: 'Storage' },
];

/**
 * Initial products data matching MySQL schema
 * Fields: id, name, description, categoryId, costPrice, price, status, qbListId, qbSyncStatus
 */
const initialProductsData = [
    {
        id: '1',
        qbSyncStatus: 'synced',
        qbListId: 'QB-PROD-001',
        qbEditSequence: '1234567890',
        name: 'Executive Desk',
        description: 'Wooden desk with walnut finish',
        categoryId: '1',
        status: 'ACTIVE',
        costPrice: 2500.00,
        price: 4500.00,
        account: '1',
        currency: '1',
        deleted: false
    },
    {
        id: '2',
        qbSyncStatus: 'synced',
        qbListId: 'QB-PROD-002',
        qbEditSequence: '1234567891',
        name: 'Modular Bookshelf',
        description: '5-tier bookshelf with doors',
        categoryId: '5',
        status: 'ACTIVE',
        costPrice: 1800.00,
        price: 3200.00,
        account: '1',
        currency: '1',
        deleted: false
    },
    {
        id: '3',
        qbSyncStatus: 'pending',
        qbListId: null,
        qbEditSequence: null,
        name: 'Coffee Table',
        description: 'Rectangular table with metal base',
        categoryId: '4',
        status: 'ACTIVE',
        costPrice: 950.00,
        price: 1750.00,
        account: '1',
        currency: '1',
        deleted: false
    },
    {
        id: '4',
        qbSyncStatus: 'error',
        qbListId: null,
        qbEditSequence: null,
        name: 'Built-in Closet',
        description: 'Closet with sliding doors',
        categoryId: '5',
        status: 'INACTIVE',
        costPrice: 8500.00,
        price: 15000.00,
        account: '1',
        currency: '1',
        deleted: false
    },
    {
        id: '5',
        qbSyncStatus: 'synced',
        qbListId: 'QB-PROD-005',
        qbEditSequence: '1234567894',
        name: 'Mobile Drawer Unit',
        description: '3-drawer unit with wheels',
        categoryId: '5',
        status: 'ACTIVE',
        costPrice: 650.00,
        price: 1200.00,
        account: '1',
        currency: '1',
        deleted: false
    },
];

/**
 * Empty product template matching MySQL schema
 */
const emptyProduct = {
    name: '',
    description: '',
    categoryId: '',
    status: 'ACTIVE',
    costPrice: 0,
    price: 0,
    qbSyncStatus: 'pending',
    qbListId: null,
    qbEditSequence: null,
    account: '',
    currency: '1',
    deleted: false
};

/**
 * Status options matching MySQL ENUM
 */
const statusOptions = [
    { value: 'ACTIVE', label: 'Active', color: 'green' },
    { value: 'INACTIVE', label: 'Inactive', color: 'gray' },
];

/**
 * Currency options
 */
const currencyOptions = [
    { id: '1', code: 'MXN', name: 'Mexican Peso' },
    { id: '2', code: 'USD', name: 'US Dollar' },
];

/**
 * Account options (for QuickBooks)
 */
const accountOptions = [
    { id: '1', name: 'Inventory Asset' },
    { id: '2', name: 'Cost of Goods Sold' },
    { id: '3', name: 'Supplies Expense' },
];

const ProductsModule = () => {
    // Data state
    const [products, setProducts] = useState(initialProductsData);
    const [categories, setCategories] = useState(defaultCategories);

    // UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(8);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [viewMode, setViewMode] = useState('table');
    const [isLoading, setIsLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [currentProduct, setCurrentProduct] = useState(emptyProduct);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);

    // QB Sync polling ref
    const pollIntervalRef = useRef(null);
    const [pendingSyncCount, setPendingSyncCount] = useState(0);

    // LocalStorage helpers
    const loadFromStorage = () => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    };

    const saveToStorage = (data) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('[Products] Error saving to localStorage:', error);
        }
    };

    const loadCategoriesFromStorage = () => {
        try {
            const saved = localStorage.getItem(CATEGORIES_KEY);
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    };

    const saveCategoriesToStorage = (data) => {
        try {
            localStorage.setItem(CATEGORIES_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('[Products] Error saving categories:', error);
        }
    };

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    /**
     * Check if any products have pending QB sync
     */
    const _hasPendingQBSync = useCallback((productsList) => {
        return productsList.some(p => !p.qbListId && p.qbSyncStatus !== 'error');
    }, []);

    /**
     * Start polling for QB sync status updates
     */
    useEffect(() => {
        const useApi = isApiEnabled();
        if (!useApi) return;

        // Check if we have pending syncs
        const pendingProducts = products.filter(p => !p.qbListId && p.qbSyncStatus !== 'error');
        setPendingSyncCount(pendingProducts.length);

        if (pendingProducts.length > 0) {
            console.log(`[Products] ${pendingProducts.length} products pending QB sync, starting polling...`);

            // Clear existing interval
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }

            // Start polling
            pollIntervalRef.current = setInterval(async () => {
                console.log('[Products] Polling for QB sync updates...');
                try {
                    const updatedProducts = await productsApi.getAll();
                    if (updatedProducts?.length > 0) {
                        const normalizedProducts = updatedProducts.map(normalizeProduct);

                        // Check for newly synced products
                        const newlySynced = normalizedProducts.filter(updated => {
                            const original = products.find(p => p.id === updated.id);
                            return original && !original.qbListId && updated.qbListId;
                        });

                        if (newlySynced.length > 0) {
                            console.log(`[Products] ${newlySynced.length} products synced with QB:`, newlySynced.map(p => p.name));
                        }

                        setProducts(normalizedProducts);
                        saveToStorage(normalizedProducts);

                        // Update pending count
                        const stillPending = normalizedProducts.filter(p => !p.qbListId && p.qbSyncStatus !== 'error');
                        setPendingSyncCount(stillPending.length);

                        // Stop polling if no more pending
                        if (stillPending.length === 0) {
                            console.log('[Products] All products synced, stopping polling');
                            clearInterval(pollIntervalRef.current);
                            pollIntervalRef.current = null;
                        }
                    }
                } catch (error) {
                    console.error('[Products] Polling error:', error);
                }
            }, QB_SYNC_POLL_INTERVAL);
        }

        // Cleanup on unmount
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [products.length]); // Re-run when products count changes

    /**
     * Load products and categories - tries API first, falls back to localStorage
     */
    const loadData = async () => {
        setIsLoading(true);
        try {
            let productsData = null;
            let categoriesData = null;

            // Try API first if enabled
            if (isApiEnabled()) {
                try {
                    [productsData, categoriesData] = await Promise.all([
                        productsApi.getAll(),
                        categoriesApi.getAll(),
                    ]);
                } catch (apiError) {
                    console.warn('[Products] API error, falling back to localStorage:', apiError.message);
                }
            }

            // Fall back to localStorage if API failed or not enabled
            if (!productsData) {
                productsData = loadFromStorage();
            }
            if (!categoriesData) {
                categoriesData = loadCategoriesFromStorage();
            }

            // Use data if found, otherwise use initial/default data
            if (productsData?.length > 0) {
                const normalizedProducts = productsData.map(normalizeProduct);
                setProducts(normalizedProducts);
                saveToStorage(normalizedProducts); // Keep localStorage in sync
            } else {
                // Use initial data for first time
                setProducts(initialProductsData);
                saveToStorage(initialProductsData);
            }

            if (categoriesData?.length > 0) {
                setCategories(categoriesData);
                saveCategoriesToStorage(categoriesData);
            } else {
                // Use default categories
                setCategories(defaultCategories);
                saveCategoriesToStorage(defaultCategories);
            }

        } catch (error) {
            console.error('[Products] Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Determine QB sync status based on qbListId presence
     */
    const getQBSyncStatusFromData = (product) => {
        if (product.qbListId) return 'synced';
        if (product.qbSyncStatus === 'error') return 'error';
        return 'pending';
    };

    /**
     * Normalize product data to match MySQL schema
     */
    const normalizeProduct = (p) => {
        // Determine qbSyncStatus based on qbListId
        const qbSyncStatus = getQBSyncStatusFromData(p);

        // Parse price and costPrice as numbers (backend sends as strings)
        const costPrice = parseFloat(p.costPrice) || 0;
        const price = parseFloat(p.price) || 0;

        // Handle currency - backend sends code like "USD", we need to find or display it
        const currencyValue = p.currency || p.currencyId || '1';

        return {
            id: p.id,
            name: p.name || '',
            description: p.description || '',
            categoryId: findCategoryId(p.category) || p.categoryId || '',
            status: normalizeStatus(p.status),
            costPrice: costPrice,
            price: price,
            qbSyncStatus: qbSyncStatus,
            qbListId: p.qbListId || null,
            qbEditSequence: p.qbEditSequence || null,
            account: p.account || p.accountId || findAccountId(p.account) || '',
            currency: currencyValue,
            deleted: p.deleted || false
        };
    };

    /**
     * Helper functions
     */
    const findCategoryId = (categoryName) => {
        if (!categoryName) return '';
        const cat = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
        return cat?.id || '';
    };

    const findAccountId = (accountName) => {
        if (!accountName) return '';
        const acc = accountOptions.find(a => a.name.toLowerCase() === accountName.toLowerCase());
        return acc?.id || '';
    };


    const normalizeStatus = (status) => {
        if (!status) return 'ACTIVE';
        return status.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
    };

    const getCategoryName = (categoryId) => {
        const cat = categories.find(c => c.id === categoryId);
        return cat?.name || '-';
    };

    const getAccountName = (accountId) => {
        const acc = accountOptions.find(a => a.id === accountId);
        return acc?.name || '-';
    };

    const getCurrencyCode = (currencyValue) => {
        // If it's already a currency code (like "USD"), return it
        if (typeof currencyValue === 'string' && currencyValue.length === 3) {
            const validCodes = currencyOptions.map(c => c.code);
            if (validCodes.includes(currencyValue)) {
                return currencyValue;
            }
        }
        // Otherwise look up by ID
        const curr = currencyOptions.find(c => c.id === currencyValue);
        return curr?.code || 'MXN';
    };

    const getQBStatusIcon = (status) => {
        switch (status) {
            case 'synced': return { icon: 'check_circle', color: '#10b981', label: 'Synced' };
            case 'pending': return { icon: 'schedule', color: '#f59e0b', label: 'Pending' };
            case 'error': return { icon: 'error', color: '#ef4444', label: 'Error' };
            default: return { icon: 'help', color: '#64748b', label: 'Unknown' };
        }
    };

    const getStatusStyle = (status) => {
        const statusOpt = statusOptions.find(s => s.value === status);
        return statusOpt || { value: status, label: status, color: 'gray' };
    };

    // Filter products
    const filteredProducts = products.filter(p =>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryName(p.categoryId)?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aVal, bVal;

        if (sortConfig.key === 'categoryId') {
            aVal = getCategoryName(a.categoryId).toLowerCase();
            bVal = getCategoryName(b.categoryId).toLowerCase();
        } else {
            aVal = String(a[sortConfig.key] || '').toLowerCase();
            bVal = String(b[sortConfig.key] || '').toLowerCase();
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    // Pagination
    const totalPages = Math.ceil(sortedProducts.length / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const paginatedProducts = sortedProducts.slice(startIndex, startIndex + rowsPerPage);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedProducts(paginatedProducts.map(p => p.id));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelectProduct = (id) => {
        setSelectedProducts(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    /**
     * Sync with QuickBooks
     */
    const handleSync = async () => {
        setIsSyncing(true);
        try {
            if (isApiEnabled()) {
                // await quickbooksApi.syncProducts();
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
            await loadData();
        } catch (error) {
            console.error('Error syncing with QB:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    // Modal handlers
    const handleAdd = () => {
        setCurrentProduct({ ...emptyProduct });
        setModalMode('add');
        setShowModal(true);
    };

    const handleEdit = (product) => {
        setCurrentProduct({ ...product });
        setModalMode('edit');
        setShowModal(true);
    };

    const handleView = (product) => {
        setCurrentProduct({ ...product });
        setModalMode('view');
        setShowModal(true);
    };

    const handleDelete = (product) => {
        setProductToDelete(product);
        setShowDeleteConfirm(true);
    };

    const handleDeleteSelected = () => {
        if (selectedProducts.length === 0) return;
        const updatedProducts = products.filter(p => !selectedProducts.includes(p.id));
        setProducts(updatedProducts);
        saveToStorage(updatedProducts);
        setSelectedProducts([]);
    };

    const confirmDelete = async () => {
        if (productToDelete) {
            try {
                // Try API first
                if (isApiEnabled()) {
                    try {
                        await productsApi.delete(productToDelete.id);
                    } catch (apiError) {
                        console.warn('[Products] API delete failed, using localStorage:', apiError.message);
                    }
                }
                // Update local state and storage
                const updatedProducts = products.filter(p => p.id !== productToDelete.id);
                setProducts(updatedProducts);
                saveToStorage(updatedProducts);
            } catch (error) {
                console.error('[Products] Error deleting:', error);
                alert('Error al eliminar el producto');
            }
        }
        setShowDeleteConfirm(false);
        setProductToDelete(null);
    };

    const handleSave = async () => {
        try {
            const productToSave = {
                ...currentProduct,
                qbSyncStatus: currentProduct.qbSyncStatus || 'pending',
                updatedAt: new Date().toISOString(),
            };

            let updatedProducts;

            if (modalMode === 'add') {
                // Generate local ID
                productToSave.id = `local-${Date.now()}`;
                productToSave.createdAt = new Date().toISOString();

                // Try API first
                if (isApiEnabled()) {
                    try {
                        const newProduct = await productsApi.create(productToSave);
                        productToSave.id = newProduct.id || productToSave.id;
                    } catch (apiError) {
                        console.warn('[Products] API create failed, saving locally:', apiError.message);
                    }
                }

                updatedProducts = [...products, productToSave];
            } else if (modalMode === 'edit') {
                // Try API first
                if (isApiEnabled()) {
                    try {
                        await productsApi.update(currentProduct.id, productToSave);
                    } catch (apiError) {
                        console.warn('[Products] API update failed, saving locally:', apiError.message);
                    }
                }

                updatedProducts = products.map(p =>
                    p.id === currentProduct.id ? { ...productToSave, id: currentProduct.id } : p
                );
            }

            // Update state and localStorage
            setProducts(updatedProducts);
            saveToStorage(updatedProducts);

            setShowModal(false);
            setCurrentProduct(emptyProduct);
        } catch (error) {
            console.error('[Products] Error saving:', error);
            alert('Error al guardar el producto');
        }
    };

    const handleInputChange = (field, value) => {
        setCurrentProduct(prev => ({ ...prev, [field]: value }));
    };

    // Calculate stats
    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === 'ACTIVE').length;
    const totalValue = products.reduce((sum, p) => sum + (p.price || 0), 0);
    const profitMargin = products.reduce((sum, p) => {
        if (p.costPrice > 0) {
            return sum + ((p.price - p.costPrice) / p.costPrice * 100);
        }
        return sum;
    }, 0) / (totalProducts || 1);

    return (
        <div className="module-page products-page">
            {/* Page Header */}
            <div className="page-header">
                <div className="header-content">
                    <div className="header-icon">
                        <span className="material-symbols-rounded">category</span>
                    </div>
                    <div className="header-text">
                        <h1>Products</h1>
                        <p>Manage your product catalog</p>
                    </div>
                </div>
                <div className="header-actions">
                    {pendingSyncCount > 0 && (
                        <div className="qb-sync-indicator pending" title={`${pendingSyncCount} products pending QB sync`}>
                            <span className="material-symbols-rounded spinning">sync</span>
                            <span className="sync-count">{pendingSyncCount} pending</span>
                        </div>
                    )}
                    <button className={`btn-sync ${isSyncing ? 'syncing' : ''}`} onClick={handleSync} disabled={isSyncing}>
                        <span className="material-symbols-rounded">sync</span>
                        {isSyncing ? 'Syncing...' : 'Sync with QB'}
                    </button>
                    <button className="btn-primary-action" onClick={handleAdd}>
                        <span className="material-symbols-rounded">add</span>
                        Add new product
                    </button>
                </div>
            </div>

            {/* Stats Row */}
            <div className="module-stats-row">
                <div className="module-stat-card">
                    <div className="stat-icon pink">
                        <Icon name="category" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{totalProducts}</span>
                        <span className="stat-label">Total Products</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon green">
                        <Icon name="check_circle" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{activeProducts}</span>
                        <span className="stat-label">Active</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon blue">
                        <Icon name="payments" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">${totalValue.toLocaleString()}</span>
                        <span className="stat-label">Total Value</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon orange">
                        <Icon name="trending_up" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{profitMargin.toFixed(1)}%</span>
                        <span className="stat-label">Avg. Margin</span>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="products-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search products..."
                    className="products-search"
                />
                <div className="toolbar-actions">
                    {selectedProducts.length > 0 && (
                        <button className="btn-delete-selected" onClick={handleDeleteSelected}>
                            <Icon name="delete" />
                            Delete ({selectedProducts.length})
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

            {isLoading ? (
                <div className="materials-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading products...</p>
                </div>
            ) : viewMode === 'grid' ? (
                /* Cards View */
                <div className="materials-cards-grid">
                    {paginatedProducts.map((product) => {
                        const qbStatus = getQBStatusIcon(product.qbSyncStatus);
                        const statusStyle = getStatusStyle(product.status);
                        const margin = product.costPrice > 0
                            ? ((product.price - product.costPrice) / product.costPrice * 100).toFixed(1)
                            : 0;

                        return (
                            <div key={product.id} className="material-card">
                                <div className="material-card-header">
                                    <div className="material-card-icon">
                                        <Icon name="category" />
                                    </div>
                                    <div className="material-card-badges">
                                        <span className={`status-badge ${statusStyle.color}`}>
                                            <span className="status-dot"></span>
                                            {statusStyle.label}
                                        </span>
                                        <span className="qb-status-badge" style={{ color: qbStatus.color }} title={qbStatus.label}>
                                            <Icon name={qbStatus.icon} />
                                        </span>
                                    </div>
                                </div>
                                <div className="material-card-body">
                                    <h3 className="material-card-name">{product.name}</h3>
                                    <span className="material-card-code">{getCategoryName(product.categoryId)}</span>
                                    <div className="material-card-details">
                                        <div className="material-detail">
                                            <Icon name="sell" />
                                            <span>Cost: ${product.costPrice?.toLocaleString()}</span>
                                        </div>
                                        <div className="material-detail">
                                            <Icon name="payments" />
                                            <span>Price: ${product.price?.toLocaleString()}</span>
                                        </div>
                                        <div className="material-detail">
                                            <Icon name="trending_up" />
                                            <span>Margin: {margin}%</span>
                                        </div>
                                        <div className="material-detail">
                                            <Icon name="currency_exchange" />
                                            <span>{getCurrencyCode(product.currency)}</span>
                                        </div>
                                    </div>
                                    {product.description && (
                                        <p className="product-description">{product.description}</p>
                                    )}
                                </div>
                                <div className="material-card-footer">
                                    <div className="material-stock">
                                        <span className="stock-label">Account</span>
                                        <span className="stock-value">{getAccountName(product.account)}</span>
                                    </div>
                                    <div className="material-actions">
                                        <button className="btn-icon" onClick={() => handleView(product)} title="View">
                                            <Icon name="visibility" />
                                        </button>
                                        <button className="btn-icon" onClick={() => handleEdit(product)} title="Edit">
                                            <Icon name="edit" />
                                        </button>
                                        <button className="btn-icon danger" onClick={() => handleDelete(product)} title="Delete">
                                            <Icon name="delete" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {paginatedProducts.length === 0 && (
                        <div className="materials-empty">
                            <Icon name="category" />
                            <p>No products found</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Table View */
                <div className="products-table-container">
                    <div className="products-table">
                        <div className="products-table-header">
                            <span className="col-checkbox">
                                <input
                                    type="checkbox"
                                    checked={paginatedProducts.length > 0 && selectedProducts.length === paginatedProducts.length}
                                    onChange={handleSelectAll}
                                />
                            </span>
                            <span className="col-status-qb">Status QB</span>
                            <span className="col-name sortable" onClick={() => handleSort('name')}>
                                Name
                                <Icon name={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-description">Description</span>
                            <span className="col-category sortable" onClick={() => handleSort('categoryId')}>
                                Category
                                <Icon name={sortConfig.key === 'categoryId' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-cost sortable" onClick={() => handleSort('costPrice')}>
                                Cost
                                <Icon name={sortConfig.key === 'costPrice' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-price sortable" onClick={() => handleSort('price')}>
                                Price
                                <Icon name={sortConfig.key === 'price' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-status sortable" onClick={() => handleSort('status')}>
                                Status
                                <Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} />
                            </span>
                            <span className="col-actions">Actions</span>
                        </div>

                        <div className="products-table-body">
                            {paginatedProducts.map((product) => {
                                const qbStatus = getQBStatusIcon(product.qbSyncStatus);
                                const statusStyle = getStatusStyle(product.status);

                                return (
                                    <div key={product.id} className="products-table-row">
                                        <span className="col-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.includes(product.id)}
                                                onChange={() => handleSelectProduct(product.id)}
                                            />
                                        </span>
                                        <span className="col-status-qb" title={qbStatus.label}>
                                            <Icon name={qbStatus.icon} style={{ color: qbStatus.color, fontSize: '20px' }} />
                                        </span>
                                        <span className="col-name">{product.name}</span>
                                        <span className="col-description">{product.description || '-'}</span>
                                        <span className="col-category">{getCategoryName(product.categoryId)}</span>
                                        <span className="col-cost">${product.costPrice?.toLocaleString() || '0'}</span>
                                        <span className="col-price">${product.price?.toLocaleString() || '0'}</span>
                                        <span className={`col-status status-badge ${statusStyle.color}`}>
                                            <span className="status-dot"></span>
                                            {statusStyle.label}
                                        </span>
                                        <span className="col-actions">
                                            <button className="btn-icon" onClick={() => handleView(product)} title="View">
                                                <Icon name="visibility" />
                                            </button>
                                            <button className="btn-icon" onClick={() => handleEdit(product)} title="Edit">
                                                <Icon name="edit" />
                                            </button>
                                            <button className="btn-icon danger" onClick={() => handleDelete(product)} title="Delete">
                                                <Icon name="delete" />
                                            </button>
                                        </span>
                                    </div>
                                );
                            })}

                            {paginatedProducts.length === 0 && (
                                <div className="products-empty">
                                    <Icon name="category" />
                                    <p>No products found</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination */}
            <div className="materials-footer">
                <div className="materials-count">
                    Showing {sortedProducts.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + rowsPerPage, sortedProducts.length)} of {sortedProducts.length} results
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
                title={modalMode === 'add' ? 'New Product' : modalMode === 'edit' ? 'Edit Product' : 'Product Details'}
                onClose={() => setShowModal(false)}
                icon={modalMode === 'add' ? 'add_box' : modalMode === 'edit' ? 'edit' : 'visibility'}
            >
                <div className="material-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label>Name *</label>
                            <input
                                type="text"
                                value={currentProduct.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Product name"
                                disabled={modalMode === 'view'}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Status</label>
                            <select
                                value={currentProduct.status}
                                onChange={(e) => handleInputChange('status', e.target.value)}
                                disabled={modalMode === 'view'}
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            value={currentProduct.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            placeholder="Product description..."
                            rows={3}
                            disabled={modalMode === 'view'}
                        />
                    </div>

                    <div className="form-group">
                        <label>Category *</label>
                        <select
                            value={currentProduct.categoryId}
                            onChange={(e) => handleInputChange('categoryId', e.target.value)}
                            disabled={modalMode === 'view'}
                            required
                        >
                            <option value="">Select category</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Cost Price</label>
                            <div className="price-input">
                                <span className="price-prefix">$</span>
                                <input
                                    type="number"
                                    value={currentProduct.costPrice}
                                    onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    disabled={modalMode === 'view'}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Sale Price *</label>
                            <div className="price-input">
                                <span className="price-prefix">$</span>
                                <input
                                    type="number"
                                    value={currentProduct.price}
                                    onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                                    placeholder="0.00"
                                    step="0.01"
                                    min="0"
                                    disabled={modalMode === 'view'}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Account</label>
                            <select
                                value={currentProduct.account}
                                onChange={(e) => handleInputChange('account', e.target.value)}
                                disabled={modalMode === 'view'}
                            >
                                <option value="">Select account</option>
                                {accountOptions.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Currency</label>
                            <select
                                value={currentProduct.currency}
                                onChange={(e) => handleInputChange('currency', e.target.value)}
                                disabled={modalMode === 'view'}
                            >
                                {currencyOptions.map(curr => (
                                    <option key={curr.id} value={curr.id}>{curr.code} - {curr.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {modalMode === 'view' && currentProduct.qbSyncStatus && (
                        <div className="form-group">
                            <label>QuickBooks Status</label>
                            <div className="qb-status-display">
                                <Icon
                                    name={getQBStatusIcon(currentProduct.qbSyncStatus).icon}
                                    style={{ color: getQBStatusIcon(currentProduct.qbSyncStatus).color }}
                                />
                                <span>{getQBStatusIcon(currentProduct.qbSyncStatus).label}</span>
                            </div>
                        </div>
                    )}

                    {modalMode !== 'view' && (
                        <div className="form-actions">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSave}
                                disabled={!currentProduct.name || !currentProduct.categoryId}
                            >
                                <Icon name="save" />
                                {modalMode === 'add' ? 'Create product' : 'Save changes'}
                            </button>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteConfirm}
                title="Delete Product"
                onClose={() => setShowDeleteConfirm(false)}
                icon="warning"
            >
                <div className="delete-confirm">
                    <Icon name="warning" className="warning-icon" />
                    <p>Are you sure you want to delete <strong>{productToDelete?.name}</strong>?</p>
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

export default ProductsModule;
