import { useState, useEffect, useRef } from 'react';
import { Icon, SearchBox, Modal } from '../../common';
import { productsApi, materialsApi, productMaterialsApi } from '../../../services/api';

// Polling interval for QB sync status (30 seconds)
const QB_SYNC_POLL_INTERVAL = 30000;

// LocalStorage key for products
const STORAGE_KEY = 'dkraft_products';


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
        status: 'ACTIVE',
        costPrice: 2500.00,
        price: 4500.00,
        account: '1',
        currency: 'USD',
        deleted: false
    },
    {
        id: '2',
        qbSyncStatus: 'synced',
        qbListId: 'QB-PROD-002',
        qbEditSequence: '1234567891',
        name: 'Modular Bookshelf',
        description: '5-tier bookshelf with doors',
        status: 'ACTIVE',
        costPrice: 1800.00,
        price: 3200.00,
        account: '1',
        currency: 'USD',
        deleted: false
    },
    {
        id: '3',
        qbSyncStatus: 'pending',
        qbListId: null,
        qbEditSequence: null,
        name: 'Coffee Table',
        description: 'Rectangular table with metal base',
        status: 'ACTIVE',
        costPrice: 950.00,
        price: 1750.00,
        account: '1',
        currency: 'USD',
        deleted: false
    },
    {
        id: '4',
        qbSyncStatus: 'error',
        qbListId: null,
        qbEditSequence: null,
        name: 'Built-in Closet',
        description: 'Closet with sliding doors',
        status: 'INACTIVE',
        costPrice: 8500.00,
        price: 15000.00,
        account: '1',
        currency: 'USD',
        deleted: false
    },
    {
        id: '5',
        qbSyncStatus: 'synced',
        qbListId: 'QB-PROD-005',
        qbEditSequence: '1234567894',
        name: 'Mobile Drawer Unit',
        description: '3-drawer unit with wheels',
        status: 'ACTIVE',
        costPrice: 650.00,
        price: 1200.00,
        account: '1',
        currency: 'USD',
        deleted: false
    },
];

/**
 * Empty product template matching MySQL schema
 */
const emptyProduct = {
    name: '',
    description: '',
    status: 'ACTIVE',
    costPrice: 0,
    price: 0,
    account: '',
    currency: 'USD',
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
    { id: 'MXN', code: 'MXN', name: 'Mexican Peso' },
    { id: 'USD', code: 'USD', name: 'US Dollar' },
];

const ProductsModule = () => {
    // Data state
    const [products, setProducts] = useState(initialProductsData);

    // UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(8);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [viewMode, setViewMode] = useState('table');
    const [isLoading, setIsLoading] = useState(true);

    // Product Materials state
    const [materialsList, setMaterialsList] = useState([]); // Keep to look up names if needed, or for initial cache
    const [productMaterials, setProductMaterials] = useState([]);
    const [newMaterial, setNewMaterial] = useState({ materialId: '', quantity: '1', unit: 'pcs', notes: '' });
    const [isLoadingMaterials, setIsLoadingMaterials] = useState(false);
    
    // Material Search State
    const [materialSearchTerm, setMaterialSearchTerm] = useState('');
    const [materialSearchResults, setMaterialSearchResults] = useState([]);
    const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
    const searchTimeoutRef = useRef(null);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
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



    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    /**
     * Check if any products have pending QB sync
     */
    // const hasPendingQBSync = useCallback((productsList) => {
    //     return productsList.some(p => !p.qbListId && p.qbSyncStatus !== 'error');
    // }, []);

    /**
     * Start polling for QB sync status updates
     */
    useEffect(() => {
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

            // Try API first
            try {
                productsData = await productsApi.getAll();
            } catch (apiError) {
                console.warn('[Products] API error, falling back to localStorage:', apiError.message);
            }

            // Fall back to localStorage if API failed
            if (!productsData) {
                productsData = loadFromStorage();
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
        // const qbSyncStatus = getQBSyncStatusFromData(p);

        // Parse price and costPrice as numbers (backend sends as strings)
        const costPrice = parseFloat(p.costPrice) || 0;
        const price = parseFloat(p.price) || 0;

        // Handle currency - backend sends code like "USD", we need to find or display it
        const currencyValue = p.currency || p.currencyId || '1';

        return {
            id: p.id,
            name: p.name || '',
            description: p.description || '',
            status: normalizeStatus(p.status),
            costPrice: costPrice,
            price: price,
            // qbSyncStatus: qbSyncStatus,
            // qbListId: p.qbListId || null,
            // qbEditSequence: p.qbEditSequence || null,
            account: 'SALES',
            currency: p.currency || 'USD',
            deleted: p.deleted || false
        };
    };

    /**
     * Helper functions
     */

    const normalizeStatus = (status) => {
        if (!status) return 'ACTIVE';
        return status.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
    };

    const getCurrencyCode = (currencyValue) => {
        const curr = currencyOptions.find(c => c.id === currencyValue) || currencyOptions.find(c => c.code === currencyValue);
        return curr?.code || 'USD';
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
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortConfig.key) {
            const aVal = String(a[sortConfig.key] || '').toLowerCase();
            const bVal = String(b[sortConfig.key] || '').toLowerCase();
            
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        }
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

    // const handleSelectAll = (e) => {
    //     if (e.target.checked) {
    //         setSelectedProducts(paginatedProducts.map(p => p.id));
    //     } else {
    //         setSelectedProducts([]);
    //     }
    // };

    // const handleSelectProduct = (id) => {
    //     setSelectedProducts(prev =>
    //         prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    //     );
    // };

    /**
     * Sync with QuickBooks
     */
    // const handleSync = async () => {
    //     setIsSyncing(true);
    //     try {
    //         // await quickbooksApi.syncProducts();
    //         await new Promise(resolve => setTimeout(resolve, 2000));
    //         await loadData();
    //     } catch (error) {
    //         console.error('Error syncing with QB:', error);
    //     } finally {
    //         setIsSyncing(false);
    //     }
    // };

    // Modal handlers
    const handleAdd = () => {
        setCurrentProduct({ ...emptyProduct });
        setModalMode('add');
        setActiveTab('general');
        setShowModal(true);
    };

    const handleEdit = async (product) => {
        setCurrentProduct({ ...product });
        setProductMaterials([]); // Clear previous
        setModalMode('edit');
        setActiveTab('general');
        setShowModal(true);
        // Load materials for this product
        if (product.id && !product.id.toString().startsWith('local-')) {
            loadProductMaterials(product.id);
        }
    };

    const handleView = async (product) => {
        setCurrentProduct({ ...product });
        setProductMaterials([]); // Clear previous
        setModalMode('view');
        setActiveTab('general');
        setShowModal(true);
        // Load materials for this product
        if (product.id && !product.id.toString().startsWith('local-')) {
            loadProductMaterials(product.id);
        }
    };
    
    
    // Load all available materials (for the dropdown)
    // useEffect(() => {
    //     if (showModal && (modalMode === 'edit' || modalMode === 'view')) {
    //         // loadMaterialsList(); 
    //     }
    // }, [showModal, modalMode]);

    // Material Search Handler
    const handleMaterialSearch = async (term) => {
        setMaterialSearchTerm(term);
        
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        if (!term || term.length < 2) {
            setMaterialSearchResults([]);
            setShowMaterialDropdown(false);
            return;
        }

        setShowMaterialDropdown(true);

        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const results = await materialsApi.search(term);
                // Ensure results is an array
                const resultsArray = Array.isArray(results) ? results : (results.data || []);
                setMaterialSearchResults(resultsArray);
            } catch (error) {
                console.error('[Products] Error searching materials:', error);
                setMaterialSearchResults([]);
            }
        }, 300);
    };

    const handleSelectMaterial = (material) => {
        setNewMaterial(prev => ({ 
            ...prev, 
            materialId: material.id,
            unit: material.unit || prev.unit // Auto-fill unit if available
        }));
        setMaterialSearchTerm(material.name);
        setShowMaterialDropdown(false);
    };

    const loadProductMaterials = async (productId) => {
        setIsLoadingMaterials(true);
        try {
            const data = await productMaterialsApi.getByProductId(productId);
            if (data) setProductMaterials(data);
        } catch (error) {
            console.error('[Products] Error loading product materials:', error);
        } finally {
            setIsLoadingMaterials(false);
        }
    };

    const handleAddMaterial = async () => {
        if (!newMaterial.materialId || !newMaterial.quantity) return;

        try {
            const payload = {
                productId: currentProduct.id,
                materialId: parseInt(newMaterial.materialId),
                quantity: parseFloat(newMaterial.quantity),
                unit: newMaterial.unit,
                notes: newMaterial.notes
            };

            await productMaterialsApi.create(payload);
            
            // Refresh list
            await loadProductMaterials(currentProduct.id);
            
            // Reset form
            setNewMaterial({ materialId: '', quantity: '1', unit: 'pcs', notes: '' });
            setMaterialSearchTerm('');
        } catch (error) {
            console.error('[Products] Error adding material:', error);
            alert('Error al agregar material');
        }
    };

    const handleRemoveMaterial = async (id) => {
        if (!confirm('Are you sure you want to remove this material?')) return;
        try {
            await productMaterialsApi.delete(id);
            // Refresh list
            await loadProductMaterials(currentProduct.id);
        } catch (error) {
            console.error('[Products] Error removing material:', error);
            alert('Error al eliminar material');
        }
    };

    const getMaterialName = (id) => {
        // Try finding in current search results or product materials list
        const m = materialSearchResults.find(mat => mat.id === id) || 
                  productMaterials.find(pm => pm.materialId === id)?.materials;
        return m ? m.name : 'Unknown Material';
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
                try {
                    await productsApi.delete(productToDelete.id);
                } catch (apiError) {
                    console.warn('[Products] API delete failed, using localStorage:', apiError.message);
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
                // qbSyncStatus: currentProduct.qbSyncStatus || 'pending',
                // updatedAt: new Date().toISOString(),
            };

            let updatedProducts;

            if (modalMode === 'add') {
                // Try API first
                try {
                    const newProduct = await productsApi.create(productToSave);
                    productToSave.id = newProduct.id || productToSave.id;
                } catch (apiError) {
                  console.warn('[Products] API create failed, saving locally:', apiError.message);
                }

                updatedProducts = [...products, productToSave];
            } else if (modalMode === 'edit') {
                // Try API first
                try {
                    await productsApi.update(currentProduct.id, productToSave);
                } catch (apiError) {
                    console.warn('[Products] API update failed, saving locally:', apiError.message);
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
                    {/* <button className={`btn-sync ${isSyncing ? 'syncing' : ''}`} onClick={handleSync} disabled={isSyncing}>
                        <span className="material-symbols-rounded">sync</span>
                        {isSyncing ? 'Syncing...' : 'Sync with QB'}
                    </button> */}
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
                    <table className="products-table-modern">
                        <thead>
                            <tr>
                                {/* <th className="col-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={paginatedProducts.length > 0 && selectedProducts.length === paginatedProducts.length}
                                        onChange={handleSelectAll}
                                    />
                                </th> */}
                                <th className="col-qb">
                                    <div className="th-content">
                                        <Icon name="cloud_sync" />
                                        <span>QB Sync</span>
                                    </div>
                                </th>
                                <th className="col-name sortable" onClick={() => handleSort('name')}>
                                    <div className="th-content">
                                        <Icon name="category" />
                                        <span>Product Name</span>
                                        <Icon name={sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} className="sort-icon" />
                                    </div>
                                </th>

                                <th className="col-cost sortable" onClick={() => handleSort('costPrice')}>
                                    <div className="th-content">
                                        <Icon name="sell" />
                                        <span>Cost Price</span>
                                        <Icon name={sortConfig.key === 'costPrice' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} className="sort-icon" />
                                    </div>
                                </th>
                                <th className="col-price sortable" onClick={() => handleSort('price')}>
                                    <div className="th-content">
                                        <Icon name="payments" />
                                        <span>Sale Price</span>
                                        <Icon name={sortConfig.key === 'price' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} className="sort-icon" />
                                    </div>
                                </th>
                                <th className="col-margin">
                                    <div className="th-content">
                                        <Icon name="trending_up" />
                                        <span>Profit Margin</span>
                                    </div>
                                </th>
                                <th className="col-status sortable" onClick={() => handleSort('status')}>
                                    <div className="th-content">
                                        <Icon name="toggle_on" />
                                        <span>Status</span>
                                        <Icon name={sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more'} className="sort-icon" />
                                    </div>
                                </th>
                                <th className="col-actions">
                                    <div className="th-content">
                                        <Icon name="settings" />
                                        <span>Actions</span>
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProducts.map((product) => {
                                const qbStatus = getQBStatusIcon(product.qbSyncStatus);
                                const statusStyle = getStatusStyle(product.status);
                                const profitMargin = product.costPrice > 0
                                    ? ((product.price - product.costPrice) / product.costPrice * 100)
                                    : 0;
                                const profitAmount = product.price - product.costPrice;

                                return (
                                    <tr key={product.id} className="table-row">
                                        {/* <td className="col-checkbox">
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.includes(product.id)}
                                                onChange={() => handleSelectProduct(product.id)}
                                            />
                                        </td> */}
                                        <td className="col-qb" title={qbStatus.label}>
                                            <Icon name={qbStatus.icon} style={{ color: qbStatus.color, fontSize: '20px' }} />
                                        </td>
                                        <td className="col-name">
                                            <div className="name-cell">
                                                <span className="name-text">{product.name}</span>
                                                {product.description && (
                                                    <span className="description-text">{product.description}</span>
                                                )}
                                            </div>
                                        </td>

                                        <td className="col-cost">
                                            <div className="price-cell">
                                                ${product.costPrice?.toLocaleString() || '0'}
                                            </div>
                                        </td>
                                        <td className="col-price">
                                            <div className="price-cell sale">
                                                ${product.price?.toLocaleString() || '0'}
                                            </div>
                                        </td>
                                        <td className="col-margin">
                                            <div className="margin-cell">
                                                <span className={`margin-percent ${profitMargin >= 30 ? 'high' : profitMargin >= 15 ? 'medium' : 'low'}`}>
                                                    {profitMargin.toFixed(1)}%
                                                </span>
                                                <span className="margin-amount">+${profitAmount.toFixed(2)}</span>
                                            </div>
                                        </td>
                                        <td className="col-status">
                                            <span className={`status-badge ${statusStyle.color}`}>
                                                <span className="status-dot"></span>
                                                {statusStyle.label}
                                            </span>
                                        </td>
                                        <td className="col-actions">
                                            <div className="action-buttons">
                                                <button className="btn-icon view" onClick={() => handleView(product)} title="View">
                                                    <Icon name="visibility" />
                                                </button>
                                                <button className="btn-icon edit" onClick={() => handleEdit(product)} title="Edit">
                                                    <Icon name="edit" />
                                                </button>
                                                <button className="btn-icon delete" onClick={() => handleDelete(product)} title="Delete">
                                                    <Icon name="delete" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}

                            {paginatedProducts.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="empty-state">
                                        <div className="products-empty">
                                            <Icon name="category" />
                                            <p>No products found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
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
                className="modal-large"
            >
                <div className="product-modal-content">
                    {/* Tab Navigation */}
                    {modalMode !== 'add' && (
                        <div className="modal-tabs">
                            <button 
                                className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
                                onClick={() => setActiveTab('general')}
                            >
                                General Info
                            </button>
                            <button 
                                className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
                                onClick={() => setActiveTab('materials')}
                            >
                                Composition (BOM)
                            </button>
                        </div>
                    )}

                    {/* General Info Tab */}
                    <div className={`tab-content ${activeTab === 'general' ? 'active' : 'hidden'}`}>
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

                    </div>

                    {/* Materials Tab */}
                    {modalMode !== 'add' && (
                        <div className={`tab-content ${activeTab === 'materials' ? 'active' : 'hidden'}`}>
                            {modalMode === 'edit' && (
                                <div className="add-material-section">
                                    <div className="material-search-row">
                                        <div className="search-input-group" style={{ position: 'relative', flex: 2 }}>
                                            <input
                                                type="text"
                                                value={materialSearchTerm}
                                                onChange={(e) => handleMaterialSearch(e.target.value)}
                                                className="modern-input"
                                                placeholder="Search material to add..."
                                                autoComplete="off"
                                                onFocus={() => {
                                                    if (materialSearchTerm.length >= 2) setShowMaterialDropdown(true);
                                                }}
                                                onBlur={() => setTimeout(() => setShowMaterialDropdown(false), 200)}
                                            />
                                            {showMaterialDropdown && materialSearchResults.length > 0 && (
                                                <ul className="material-search-results">
                                                    {materialSearchResults.map(m => (
                                                        <li 
                                                            key={m.id} 
                                                            onClick={() => handleSelectMaterial(m)}
                                                            className="search-result-item"
                                                        >
                                                            <div className="result-name">{m.name}</div>
                                                            <div className="result-code">{m.code || ''}</div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                        <div className="qty-input-group" style={{ flex: 1 }}>
                                            <input
                                                type="number"
                                                value={newMaterial.quantity}
                                                onChange={(e) => setNewMaterial({...newMaterial, quantity: e.target.value})}
                                                className="modern-input"
                                                placeholder="Qty"
                                            />
                                        </div>
                                        <div className="unit-input-group" style={{ flex: 1 }}>
                                            <input
                                                type="text"
                                                value={newMaterial.unit}
                                                onChange={(e) => setNewMaterial({...newMaterial, unit: e.target.value})}
                                                className="modern-input"
                                                placeholder="Unit"
                                            />
                                        </div>
                                        <button 
                                            className="btn-primary-small"
                                            onClick={handleAddMaterial}
                                            disabled={!newMaterial.materialId || !newMaterial.quantity}
                                        >
                                            <Icon name="add" /> Add
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="product-materials-list">
                                {isLoadingMaterials ? (
                                    <div className="loading-spinner-small">Loading materials...</div>
                                ) : productMaterials.length > 0 ? (
                                    <div className="materials-grid">
                                        {productMaterials.map(pm => (
                                            <div key={pm.id} className="material-list-item">
                                                <div className="item-icon">
                                                    <Icon name="inventory_2" />
                                                </div>
                                                <div className="item-info">
                                                    <span className="item-name">{pm.materials?.name || getMaterialName(pm.materialId)}</span>
                                                    <span className="item-qty">{parseFloat(pm.quantity)} {pm.unit}</span>
                                                    {pm.notes && <span className="item-notes">{pm.notes}</span>}
                                                </div>
                                                {modalMode === 'edit' && (
                                                    <button 
                                                        className="btn-icon danger"
                                                        onClick={() => handleRemoveMaterial(pm.id)}
                                                        title="Remove"
                                                    >
                                                        <Icon name="close" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-materials-state">
                                        <Icon name="straighten" />
                                        <p>No materials assigned.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

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

                    {modalMode !== 'view' && activeTab === 'general' && (
                      <div className="form-actions">
                          <button className="btn-secondary" onClick={() => setShowModal(false)}>
                              Cancel
                          </button>
                          <button
                              className="btn-primary"
                              onClick={handleSave}
                              disabled={!currentProduct.name}
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
