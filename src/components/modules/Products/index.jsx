import { useState, useEffect, useRef } from 'react';
import { Icon, SearchBox, Modal, Toast } from '../../common';
import { productsService } from '../../../lib/supabase';
import { supabase } from '../../../lib/supabase';
import { qbwcApi } from '../../../services/quickbooksConnector';
import { billingEntityOptions, shouldSyncToQB } from '../../../constants/billingEntities';

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
    currency: '1',
    deleted: false,
    billingEntity: ''
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

const ProductsModule = () => {
    // Data state - start empty, load from Supabase
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [units, setUnits] = useState([]);
    const [operations, setOperations] = useState([]); // Available operations from DB
    const [departments, setDepartments] = useState([]); // Departments for reference
    const [toast, setToast] = useState(null);

    // BOM state for current product
    const [bomComponents, setBomComponents] = useState([]);
    const [bomOperations, setBomOperations] = useState([]); // Operations for current product BOM
    const [currentBomId, setCurrentBomId] = useState(null);

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
    const [modalTab, setModalTab] = useState('info'); // 'info' or 'bom'
    const [billingEntityFilter, setBillingEntityFilter] = useState('ALL'); // ALL, DOVECREEK, INNOVATIVE

    // QB Sync polling ref
    const pollIntervalRef = useRef(null);
    const [pendingSyncCount, setPendingSyncCount] = useState(0);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const shouldSyncToQB = (billingEntity) => {
        // INNOVATIVE products are not synced to QB, DOVECREEK and DKRAFT are synced to QB
        if (!billingEntity) return true;
        return billingEntity === 'INNOVATIVE' ? false : true;
    };

    /**
     * Update pending QB sync count when products change
     */
    useEffect(() => {
        const pendingProducts = products.filter(p =>
            !p.qbListId &&
            p.qbSyncStatus !== 'error' &&
            shouldSyncToQB(p.billingEntity)
        );
        setPendingSyncCount(pendingProducts.length);

        // Cleanup polling on unmount
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [products.length]);

    /**
     * Load products, categories, materials and units from Supabase
     */
    const loadData = async () => {
        setIsLoading(true);
        console.log('[Products] Loading data from Supabase...');
        try {
            // Load all data in parallel
            // Note: Products use product_categories table (separate from material categories)
            const [categoriesRes, materialsRes, unitsRes, productsRes, operationsRes, departmentsRes] = await Promise.all([
                supabase.from('product_categories').select('*').order('name'),
                supabase.from('materials').select('*').order('name'),
                supabase.from('units').select('*').order('name'),
                supabase.from('products').select('*').order('created_at', { ascending: false }),
                supabase.from('operations').select('*, departments(name)').eq('status', 'ACTIVE').order('name'),
                supabase.from('departments').select('*').eq('status', 'ACTIVE').order('name')
            ]);

            console.log('[Products] Categories loaded:', categoriesRes.data?.length || 0);
            console.log('[Products] Materials loaded:', materialsRes.data?.length || 0);
            console.log('[Products] Units loaded:', unitsRes.data?.length || 0);
            console.log('[Products] Products loaded:', productsRes.data?.length || 0);
            console.log('[Products] Operations loaded:', operationsRes.data?.length || 0);
            console.log('[Products] Departments loaded:', departmentsRes.data?.length || 0);

            // Set categories
            if (categoriesRes.data?.length > 0) {
                setCategories(categoriesRes.data);
            }

            // Set materials for BOM selection
            if (materialsRes.data?.length > 0) {
                setMaterials(materialsRes.data);
            }

            // Set units
            if (unitsRes.data?.length > 0) {
                setUnits(unitsRes.data);
            }

            // Set operations for BOM selection
            if (operationsRes.data?.length > 0) {
                setOperations(operationsRes.data);
            }

            // Set departments
            if (departmentsRes.data?.length > 0) {
                setDepartments(departmentsRes.data);
            }

            // Set products
            if (productsRes.data?.length > 0) {
                const normalizedProducts = productsRes.data.map(normalizeProduct);
                setProducts(normalizedProducts);
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error('[Products] Error loading data from Supabase:', error);
            setToast({ message: 'Error loading products: ' + error.message, type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Normalize product data from Supabase (snake_case) to frontend (camelCase)
     */
    const normalizeProduct = (p) => {
        // Handle both snake_case (Supabase) and camelCase formats
        const qbListId = p.qb_list_id || p.qbListId || null;
        const entityValue = p.billing_entity || p.billingEntity || '';
        let qbSyncStatus;
        if (!shouldSyncToQB(entityValue)) {
            qbSyncStatus = 'local_only';
        } else if (qbListId) {
            qbSyncStatus = 'synced';
        } else {
            qbSyncStatus = p.qb_sync_status || p.qbSyncStatus || 'pending';
        }

        // Parse price and costPrice as numbers - handle both formats
        const costPrice = parseFloat(p.cost_price || p.costPrice) || 0;
        const price = parseFloat(p.base_price || p.price) || 0;

        // Handle currency
        const currencyValue = p.currency || p.currencyId || '1';

        // Handle category_id from Supabase
        const categoryId = p.category_id || p.categoryId || '';

        return {
            id: p.id,
            name: p.name || '',
            description: p.description || '',
            categoryId: categoryId,
            status: normalizeStatus(p.status),
            costPrice: costPrice,
            price: price,
            qbSyncStatus: qbSyncStatus,
            qbListId: qbListId,
            qbEditSequence: p.qb_edit_sequence || p.qbEditSequence || null,
            currency: currencyValue,
            deleted: p.deleted || false,
            createdAt: p.created_at || p.createdAt || null,
            billingEntity: p.billing_entity || p.billingEntity || ''
        };
    };

    /**
     * Helper functions
     */
    const normalizeStatus = (status) => {
        if (!status) return 'ACTIVE';
        return status.toUpperCase() === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
    };

    const getCategoryName = (categoryId) => {
        const cat = categories.find(c => c.id === categoryId);
        return cat?.name || '-';
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
            case 'synced': return { icon: 'check_circle', color: '#10b981', label: 'Synced with QB' };
            case 'pending': return { icon: 'schedule', color: '#f59e0b', label: 'Pending QB Sync' };
            case 'error': return { icon: 'error', color: '#ef4444', label: 'Sync Error' };
            case 'local_only': return { icon: 'cloud_off', color: '#64748b', label: 'Local Only' };
            default: return { icon: 'help', color: '#64748b', label: 'Unknown' };
        }
    };

    const getStatusStyle = (status) => {
        const statusOpt = statusOptions.find(s => s.value === status);
        return statusOpt || { value: status, label: status, color: 'gray' };
    };

    // Filter products by billing entity first
    const entityFilteredProducts = billingEntityFilter === 'ALL'
        ? products
        : products.filter(p => p.billingEntity === billingEntityFilter);

    // Then filter by search term
    const filteredProducts = entityFilteredProducts.filter(p =>
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
            // Get products that need to be synced (no qb_list_id)
            const pendingProducts = products.filter(p =>
                !p.qbListId &&
                p.status === 'active' &&
                shouldSyncToQB(p.billingEntity)
            );

            if (pendingProducts.length === 0) {
                setToast({ message: 'All products are already synced!', type: 'info' });
                await loadData();
                return;
            }

            let syncedCount = 0;
            let errorCount = 0;

            for (const product of pendingProducts) {
                try {
                    // Send to QBWC connector
                    const result = await qbwcApi.items.add({
                        name: product.name,
                        price: product.unitPrice || 0,
                        description: product.description || '',
                        accountFullName: 'SALES',
                        productId: product.id,
                    });

                    // If QB returns a listId, update the product in Supabase
                    if (result?.listId) {
                        await supabase
                            .from('products')
                            .update({
                                qb_list_id: result.listId,
                                qb_edit_sequence: result.editSequence || null,
                                sync_status: 'synced'
                            })
                            .eq('id', product.id);
                        syncedCount++;
                    }
                } catch (err) {
                    console.error(`[Products] Error syncing product ${product.name}:`, err);
                    await supabase
                        .from('products')
                        .update({ sync_status: 'error' })
                        .eq('id', product.id);
                    errorCount++;
                }
            }

            await loadData();

            if (syncedCount > 0) {
                setToast({ message: `${syncedCount} product(s) synced to QuickBooks!`, type: 'success' });
            }
            if (errorCount > 0) {
                setToast({ message: `${errorCount} product(s) failed to sync.`, type: 'error' });
            }
        } catch (error) {
            console.error('[Products] Error syncing with QB:', error);
            setToast({ message: 'Error connecting to QuickBooks: ' + error.message, type: 'error' });
        } finally {
            setIsSyncing(false);
        }
    };

    /**
     * Load BOM components for a product
     */
    const loadBomComponents = async (productId) => {
        try {
            console.log('[Products] Loading BOM for product:', productId);

            // First get the BOM for this product (without is_active filter for compatibility)
            const { data: bomData, error: bomError } = await supabase
                .from('bom')
                .select('*')
                .eq('product_id', productId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            console.log('[Products] BOM query result:', { bomData, bomError });

            if (bomError && bomError.code !== 'PGRST116') { // PGRST116 = no rows found
                console.warn('[Products] BOM lookup error:', bomError);
                return;
            }

            if (bomData) {
                setCurrentBomId(bomData.id);
                console.log('[Products] Found BOM:', bomData.id);

                // Get BOM components
                const { data: componentsData, error: componentsError } = await supabase
                    .from('bom_components')
                    .select('*')
                    .eq('bom_id', bomData.id)
                    .order('sort_order');

                console.log('[Products] Components query result:', { componentsData, componentsError });

                if (componentsError) {
                    console.error('[Products] Error loading BOM components:', componentsError);
                    return;
                }

                console.log('[Products] BOM components loaded:', componentsData?.length || 0);
                setBomComponents(componentsData || []);

                // Also load BOM operations
                const { data: operationsData, error: opsError } = await supabase
                    .from('bom_operations')
                    .select('*')
                    .eq('bom_id', bomData.id)
                    .order('sort_order');

                if (opsError) {
                    console.warn('[Products] Error loading BOM operations:', opsError);
                } else {
                    console.log('[Products] BOM operations loaded:', operationsData?.length || 0);
                    setBomOperations(operationsData || []);
                }
            } else {
                console.log('[Products] No BOM found for product');
                setCurrentBomId(null);
                setBomComponents([]);
                setBomOperations([]);
            }
        } catch (error) {
            console.error('[Products] Error loading BOM:', error);
        }
    };

    /**
     * Add a material to BOM
     */
    const handleAddMaterial = () => {
        setBomComponents(prev => [...prev, {
            id: `temp-${Date.now()}`,
            material_id: '',
            quantity: 1,
            unit_id: '',
            unit_cost: 0,
            total_cost: 0,
            waste_percentage: 0,
            is_optional: false,
            notes: '',
            sort_order: prev.length
        }]);
    };

    /**
     * Update a BOM component
     */
    const handleUpdateBomComponent = (index, field, value) => {
        setBomComponents(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };

            // If material changed, update unit_cost from material
            if (field === 'material_id' && value) {
                const material = materials.find(m => m.id === value);
                if (material) {
                    updated[index].unit_cost = parseFloat(material.unit_cost) || 0;
                    updated[index].unit_id = material.unit_id || '';
                }
            }

            // Recalculate total_cost
            if (field === 'quantity' || field === 'unit_cost' || field === 'material_id') {
                const qty = parseFloat(updated[index].quantity) || 0;
                const cost = parseFloat(updated[index].unit_cost) || 0;
                const waste = parseFloat(updated[index].waste_percentage) || 0;
                updated[index].total_cost = qty * cost * (1 + waste / 100);
            }

            return updated;
        });
    };

    /**
     * Remove a BOM component
     */
    const handleRemoveBomComponent = (index) => {
        setBomComponents(prev => prev.filter((_, i) => i !== index));
    };

    /**
     * Add an operation to BOM
     */
    const handleAddOperation = () => {
        setBomOperations(prev => [...prev, {
            id: `temp-${Date.now()}`,
            operation_id: '',
            time_minutes: 0,
            quantity: 1,
            labor_cost: 0,
            notes: '',
            sort_order: prev.length
        }]);
    };

    /**
     * Update a BOM operation
     */
    const handleUpdateBomOperation = (index, field, value) => {
        setBomOperations(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };

            // If operation changed, calculate labor_cost from operation's cost_per_hour
            if (field === 'operation_id' && value) {
                const operation = operations.find(o => o.id === value);
                if (operation) {
                    const timeMinutes = parseFloat(updated[index].time_minutes) || 0;
                    const costPerHour = parseFloat(operation.cost_per_hour) || 0;
                    updated[index].labor_cost = (timeMinutes / 60) * costPerHour * (updated[index].quantity || 1);
                }
            }

            // Recalculate labor_cost when time or quantity changes
            if (field === 'time_minutes' || field === 'quantity') {
                const operation = operations.find(o => o.id === updated[index].operation_id);
                if (operation) {
                    const timeMinutes = parseFloat(updated[index].time_minutes) || 0;
                    const costPerHour = parseFloat(operation.cost_per_hour) || 0;
                    const qty = parseFloat(updated[index].quantity) || 1;
                    updated[index].labor_cost = (timeMinutes / 60) * costPerHour * qty;
                }
            }

            return updated;
        });
    };

    /**
     * Remove a BOM operation
     */
    const handleRemoveBomOperation = (index) => {
        setBomOperations(prev => prev.filter((_, i) => i !== index));
    };

    /**
     * Get operation name by ID
     */
    const getOperationName = (operationId) => {
        const operation = operations.find(o => o.id === operationId);
        return operation?.name || '-';
    };

    /**
     * Get operation department by ID
     */
    const getOperationDepartment = (operationId) => {
        const operation = operations.find(o => o.id === operationId);
        return operation?.departments?.name || '-';
    };

    /**
     * Get operation cost per hour by ID
     */
    const getOperationCostPerHour = (operationId) => {
        const operation = operations.find(o => o.id === operationId);
        return parseFloat(operation?.cost_per_hour) || 0;
    };

    /**
     * Format minutes to hours and minutes
     */
    const formatTime = (minutes) => {
        if (!minutes) return '0 min';
        if (minutes < 60) return `${minutes} min`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    };

    /**
     * Get material name by ID
     */
    const getMaterialName = (materialId) => {
        const material = materials.find(m => m.id === materialId);
        return material?.name || '-';
    };

    /**
     * Get unit name by ID
     */
    const getUnitName = (unitId) => {
        const unit = units.find(u => u.id === unitId);
        return unit?.abbreviation || unit?.name || '-';
    };

    // Modal handlers
    const handleAdd = () => {
        setCurrentProduct({ ...emptyProduct });
        setBomComponents([]);
        setBomOperations([]);
        setCurrentBomId(null);
        setModalMode('add');
        setModalTab('info'); // Reset to info tab
        setShowModal(true);
    };

    const handleEdit = async (product) => {
        setCurrentProduct({ ...product });
        setBomComponents([]);
        setBomOperations([]);
        setCurrentBomId(null);
        setModalMode('edit');
        setModalTab('info'); // Reset to info tab
        setShowModal(true);
        // Load BOM after opening modal
        await loadBomComponents(product.id);
    };

    const handleView = async (product) => {
        setCurrentProduct({ ...product });
        setBomComponents([]);
        setBomOperations([]);
        setCurrentBomId(null);
        setModalMode('view');
        setModalTab('info'); // Reset to info tab
        setShowModal(true);
        // Load BOM after opening modal
        await loadBomComponents(product.id);
    };

    const handleDelete = (product) => {
        setProductToDelete(product);
        setShowDeleteConfirm(true);
    };

    const handleDeleteSelected = async () => {
        if (selectedProducts.length === 0) return;
        try {
            // Delete all selected products from Supabase
            for (const productId of selectedProducts) {
                // First, delete any associated BOM and its components
                const { data: bomData } = await supabase
                    .from('bom')
                    .select('id')
                    .eq('product_id', productId);

                if (bomData && bomData.length > 0) {
                    for (const bom of bomData) {
                        await supabase.from('bom_components').delete().eq('bom_id', bom.id);
                        await supabase.from('bom').delete().eq('id', bom.id);
                    }
                }

                await productsService.delete(productId);
            }
            console.log('[Products] Deleted from Supabase:', selectedProducts.length, 'products');

            // Update local state
            const updatedProducts = products.filter(p => !selectedProducts.includes(p.id));
            setProducts(updatedProducts);
            setSelectedProducts([]);
            setToast({ message: `${selectedProducts.length} products deleted successfully!`, type: 'success' });
        } catch (error) {
            console.error('[Products] Error deleting selected:', error);
            setToast({ message: 'Error deleting products: ' + error.message, type: 'error' });
        }
    };

    const confirmDelete = async () => {
        if (productToDelete) {
            try {
                // First, delete any associated BOM and its components
                const { data: bomData } = await supabase
                    .from('bom')
                    .select('id')
                    .eq('product_id', productToDelete.id);

                if (bomData && bomData.length > 0) {
                    for (const bom of bomData) {
                        // Delete BOM components first
                        await supabase.from('bom_components').delete().eq('bom_id', bom.id);
                        // Then delete the BOM
                        await supabase.from('bom').delete().eq('id', bom.id);
                    }
                    console.log('[Products] Deleted associated BOMs:', bomData.length);
                }

                // Now delete the product from Supabase
                await productsService.delete(productToDelete.id);
                console.log('[Products] Deleted from Supabase:', productToDelete.id);

                // Update local state
                const updatedProducts = products.filter(p => p.id !== productToDelete.id);
                setProducts(updatedProducts);
                setToast({ message: 'Product deleted successfully!', type: 'success' });
            } catch (error) {
                console.error('[Products] Error deleting:', error);
                setToast({ message: 'Error deleting product: ' + error.message, type: 'error' });
            }
        }
        setShowDeleteConfirm(false);
        setProductToDelete(null);
    };

    const handleSave = async () => {
        try {
            // Map to Supabase snake_case columns
            const productData = {
                name: currentProduct.name,
                description: currentProduct.description || '',
                category_id: currentProduct.categoryId || null,
                status: currentProduct.status || 'ACTIVE',
                cost_price: parseFloat(currentProduct.costPrice) || 0,
                base_price: parseFloat(currentProduct.price) || 0,
                billing_entity: currentProduct.billingEntity || null,
                sync_status: shouldSyncToQB(currentProduct.billingEntity) ? 'pending' : 'local_only',
            };

            let savedProduct;
            let updatedProducts;
            let productId;

            if (modalMode === 'add') {
                // Save to Supabase
                savedProduct = await productsService.create(productData);

                if (!savedProduct || !savedProduct.id) {
                    throw new Error('Failed to create product in database');
                }

                productId = savedProduct.id;

                // Normalize for local state
                const normalizedProduct = {
                    ...currentProduct,
                    id: savedProduct.id,
                    createdAt: savedProduct.created_at,
                };

                updatedProducts = [...products, normalizedProduct];
                console.log('[Products] Created in Supabase:', savedProduct.id);
            } else if (modalMode === 'edit') {
                // Update in Supabase
                savedProduct = await productsService.update(currentProduct.id, productData);

                if (!savedProduct) {
                    throw new Error('Failed to update product in database');
                }

                productId = currentProduct.id;

                updatedProducts = products.map(p =>
                    p.id === currentProduct.id ? { ...currentProduct, ...productData } : p
                );
                console.log('[Products] Updated in Supabase:', currentProduct.id);
            }

            // Capture current BOM state before saving
            const componentsToSave = [...bomComponents];
            const operationsToSave = [...bomOperations];
            const bomIdToUse = currentBomId;

            console.log('[Products] BOM save check - components:', componentsToSave.length, 'operations:', operationsToSave.length, 'productId:', productId, 'currentBomId:', bomIdToUse);

            // Save BOM if there are components or operations
            const validComponents = componentsToSave.filter(comp => comp.material_id);
            const validOperations = operationsToSave.filter(op => op.operation_id);

            if ((validComponents.length > 0 || validOperations.length > 0) && productId) {
                console.log('[Products] Saving BOM with', validComponents.length, 'components and', validOperations.length, 'operations');
                await saveBom(productId, componentsToSave, operationsToSave, bomIdToUse);
            } else if (componentsToSave.length === 0 && operationsToSave.length === 0 && bomIdToUse) {
                // If all components and operations were removed, delete the BOM
                console.log('[Products] Removing empty BOM:', bomIdToUse);
                await supabase.from('bom_components').delete().eq('bom_id', bomIdToUse);
                await supabase.from('bom_operations').delete().eq('bom_id', bomIdToUse);
                await supabase.from('bom').delete().eq('id', bomIdToUse);
            } else if (componentsToSave.length > 0 && validComponents.length === 0) {
                console.warn('[Products] BOM has components but none have materials selected');
            }

            // Update local state
            setProducts(updatedProducts);

            setToast({ message: modalMode === 'add' ? 'Product created successfully!' : 'Product updated successfully!', type: 'success' });
            setShowModal(false);
            setCurrentProduct(emptyProduct);
            setBomComponents([]);
            setBomOperations([]);
            setCurrentBomId(null);
        } catch (error) {
            console.error('[Products] Error saving:', error);
            setToast({ message: 'Error: ' + error.message, type: 'error' });
        }
    };

    /**
     * Save BOM, components, and operations
     * @param {string} productId - The product ID to save BOM for
     * @param {Array} components - The BOM components to save (passed to avoid state timing issues)
     * @param {Array} bomOps - The BOM operations to save (passed to avoid state timing issues)
     * @param {string|null} existingBomId - The existing BOM ID if updating (passed to avoid state timing issues)
     */
    const saveBom = async (productId, components = bomComponents, bomOps = bomOperations, existingBomId = currentBomId) => {
        try {
            console.log('[Products] Saving BOM for product:', productId, 'existingBomId:', existingBomId);

            // Filter valid components (those with material selected)
            const validComponents = components.filter(comp => comp.material_id);
            const validOperations = bomOps.filter(op => op.operation_id);

            if (validComponents.length === 0 && validOperations.length === 0) {
                console.log('[Products] No valid components or operations to save');
                return;
            }

            let bomId = existingBomId;

            if (!bomId) {
                // Create new BOM - using minimal required columns
                console.log('[Products] Creating new BOM for product:', productId);
                const bomInsertData = {
                    product_id: productId,
                    name: `BOM - ${currentProduct.name}`,
                };

                console.log('[Products] BOM insert data:', bomInsertData);

                const { data: newBom, error: bomError } = await supabase
                    .from('bom')
                    .insert(bomInsertData)
                    .select()
                    .single();

                console.log('[Products] BOM insert result:', { newBom, bomError });

                if (bomError) {
                    console.error('[Products] Error creating BOM:', bomError);
                    throw bomError;
                }

                if (!newBom || !newBom.id) {
                    throw new Error('Failed to create BOM - no data returned');
                }

                bomId = newBom.id;
                console.log('[Products] Created new BOM:', bomId);
            } else {
                // Update existing BOM - just update timestamp
                console.log('[Products] Updating existing BOM:', bomId);
                const { error: updateError } = await supabase
                    .from('bom')
                    .update({
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', bomId);

                if (updateError) {
                    console.warn('[Products] Error updating BOM timestamp (non-fatal):', updateError);
                    // Don't throw - the BOM still exists, just timestamp update failed
                }
                console.log('[Products] Updated BOM:', bomId);

                // Delete existing components to replace them
                const { error: deleteError } = await supabase
                    .from('bom_components')
                    .delete()
                    .eq('bom_id', bomId);

                if (deleteError) {
                    console.error('[Products] Error deleting old components:', deleteError);
                    throw deleteError;
                }
            }

            // Insert BOM components
            if (validComponents.length > 0) {
                const componentsToInsert = validComponents.map((comp, index) => ({
                    bom_id: bomId,
                    material_id: comp.material_id,
                    component_type: comp.component_type || 'material',
                    quantity: parseFloat(comp.quantity) || 0,
                    unit_id: comp.unit_id || null,
                    unit_cost: parseFloat(comp.unit_cost) || 0,
                    total_cost: parseFloat(comp.total_cost) || 0,
                    waste_percentage: parseFloat(comp.waste_percentage) || 0,
                    is_optional: comp.is_optional || false,
                    notes: comp.notes || '',
                    sort_order: index
                }));

                console.log('[Products] Inserting components:', componentsToInsert);

                const { data: insertedComponents, error: compError } = await supabase
                    .from('bom_components')
                    .insert(componentsToInsert)
                    .select();

                if (compError) {
                    console.error('[Products] Error inserting components:', compError);
                    throw compError;
                }

                console.log('[Products] Successfully saved', insertedComponents?.length || componentsToInsert.length, 'BOM components');
            }

            // Insert BOM operations
            if (validOperations.length > 0) {
                // First delete existing operations for this BOM
                await supabase.from('bom_operations').delete().eq('bom_id', bomId);

                const operationsToInsert = validOperations.map((op, index) => ({
                    bom_id: bomId,
                    operation_id: op.operation_id,
                    time_minutes: parseInt(op.time_minutes) || 0,
                    quantity: parseInt(op.quantity) || 1,
                    labor_cost: parseFloat(op.labor_cost) || 0,
                    notes: op.notes || '',
                    sort_order: index
                }));

                console.log('[Products] Inserting operations:', operationsToInsert);

                const { data: insertedOps, error: opsError } = await supabase
                    .from('bom_operations')
                    .insert(operationsToInsert)
                    .select();

                if (opsError) {
                    console.error('[Products] Error inserting operations:', opsError);
                    throw opsError;
                }

                console.log('[Products] Successfully saved', insertedOps?.length || operationsToInsert.length, 'BOM operations');
            }
        } catch (error) {
            console.error('[Products] Error saving BOM:', error);
            throw error;
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
    const dovecreekProducts = products.filter(p => p.billingEntity === 'DOVECREEK').length;
    const innovativeProducts = products.filter(p => p.billingEntity === 'INNOVATIVE').length;

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

            {/* Billing Entity Filter Tabs */}
            <div className="billing-entity-tabs">
                <button
                    className={`entity-tab ${billingEntityFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setBillingEntityFilter('ALL')}
                >
                    <Icon name="category" />
                    All Products
                    <span className="tab-count">{products.length}</span>
                </button>
                <button
                    className={`entity-tab dovecreek ${billingEntityFilter === 'DOVECREEK' ? 'active' : ''}`}
                    onClick={() => setBillingEntityFilter('DOVECREEK')}
                >
                    <Icon name="business" />
                    Dovecreek
                    <span className="tab-count">{dovecreekProducts}</span>
                </button>
                <button
                    className={`entity-tab innovative ${billingEntityFilter === 'INNOVATIVE' ? 'active' : ''}`}
                    onClick={() => setBillingEntityFilter('INNOVATIVE')}
                >
                    <Icon name="lightbulb" />
                    Innovative
                    <span className="tab-count">{innovativeProducts}</span>
                </button>
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
                            <span className="col-status-qb" title="QuickBooks Status">QB</span>
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
                            <span className="col-actions"></span>
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
                size="large"
                onSave={modalMode !== 'view' ? handleSave : undefined}
                saveText={modalMode === 'add' ? 'Create Product' : 'Save Changes'}
                saveDisabled={!currentProduct.name}
                isViewMode={modalMode === 'view'}
            >
                {/* Modal Tabs */}
                <div className="modal-tabs">
                    <button
                        type="button"
                        className={`modal-tab ${modalTab === 'info' ? 'active' : ''}`}
                        onClick={() => setModalTab('info')}
                    >
                        <Icon name="info" />
                        Product Info
                    </button>
                    <button
                        type="button"
                        className={`modal-tab ${modalTab === 'bom' ? 'active' : ''}`}
                        onClick={() => setModalTab('bom')}
                    >
                        <Icon name="inventory_2" />
                        Bill of Materials
                        {bomComponents.length > 0 && (
                            <span className="tab-badge">{bomComponents.length}</span>
                        )}
                    </button>
                    <button
                        type="button"
                        className={`modal-tab ${modalTab === 'operations' ? 'active' : ''}`}
                        onClick={() => setModalTab('operations')}
                    >
                        <Icon name="precision_manufacturing" />
                        Operations
                        {bomOperations.length > 0 && (
                            <span className="tab-badge">{bomOperations.length}</span>
                        )}
                    </button>
                </div>

                {/* Tab Content */}
                <div className="modal-tab-content">
                    {/* Product Info Tab */}
                    {modalTab === 'info' && (
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
                                    <div className="status-toggle">
                                        <button
                                            type="button"
                                            className={`status-toggle-btn status-active ${currentProduct.status === 'ACTIVE' ? 'active' : ''}`}
                                            onClick={() => modalMode !== 'view' && handleInputChange('status', 'ACTIVE')}
                                            disabled={modalMode === 'view'}
                                        >
                                            <span className="status-indicator"></span>
                                            <Icon name="check_circle" />
                                            Active
                                        </button>
                                        <button
                                            type="button"
                                            className={`status-toggle-btn status-inactive ${currentProduct.status === 'INACTIVE' ? 'active' : ''}`}
                                            onClick={() => modalMode !== 'view' && handleInputChange('status', 'INACTIVE')}
                                            disabled={modalMode === 'view'}
                                        >
                                            <span className="status-indicator"></span>
                                            <Icon name="cancel" />
                                            Inactive
                                        </button>
                                    </div>
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

                            {/* <div className="form-group">
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
                            </div> */}

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
                                <div className="form-group">
                                    <label>Billing Entity</label>
                                    <select
                                        value={currentProduct.billingEntity}
                                        onChange={(e) => handleInputChange('billingEntity', e.target.value)}
                                        disabled={modalMode === 'view'}
                                        className="form-select"
                                    >
                                        <option value="">-- Select Entity --</option>
                                        {billingEntityOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                        </div>
                    )}

                    {/* BOM Tab */}
                    {modalTab === 'bom' && (
                        <div className="bom-tab-content">
                            <div className="bom-tab-header">
                                <div className="bom-tab-title">
                                    <h4>Materials for: {currentProduct.name || 'New Product'}</h4>
                                    <p>Add the materials required to manufacture this product</p>
                                </div>
                                {modalMode !== 'view' && (
                                    <button
                                        type="button"
                                        className="btn-add-material"
                                        onClick={handleAddMaterial}
                                    >
                                        <Icon name="add" />
                                        Add Material
                                    </button>
                                )}
                            </div>

                            {bomComponents.length > 0 ? (
                                <div className="bom-table">
                                    <div className="bom-table-header">
                                        <span className="col-material">Material</span>
                                        <span className="col-qty">Quantity</span>
                                        <span className="col-unit">Unit</span>
                                        <span className="col-cost">Unit Cost</span>
                                        <span className="col-total">Total</span>
                                        {modalMode !== 'view' && <span className="col-actions">Actions</span>}
                                    </div>
                                    <div className="bom-table-body">
                                        {bomComponents.map((comp, index) => (
                                            <div key={comp.id || index} className="bom-table-row">
                                                <span className="col-material">
                                                    {modalMode === 'view' ? (
                                                        getMaterialName(comp.material_id)
                                                    ) : (
                                                        <select
                                                            value={comp.material_id}
                                                            onChange={(e) => handleUpdateBomComponent(index, 'material_id', e.target.value)}
                                                        >
                                                            <option value="">Select material</option>
                                                            {materials.map(mat => (
                                                                <option key={mat.id} value={mat.id}>
                                                                    {mat.name} {mat.sku ? `(${mat.sku})` : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </span>
                                                <span className="col-qty">
                                                    {modalMode === 'view' ? (
                                                        comp.quantity
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            value={comp.quantity}
                                                            onChange={(e) => handleUpdateBomComponent(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                            min="0"
                                                            step="0.01"
                                                        />
                                                    )}
                                                </span>
                                                <span className="col-unit">
                                                    {getUnitName(comp.unit_id)}
                                                </span>
                                                <span className="col-cost">
                                                    ${(parseFloat(comp.unit_cost) || 0).toFixed(2)}
                                                </span>
                                                <span className="col-total">
                                                    ${(parseFloat(comp.total_cost) || 0).toFixed(2)}
                                                </span>
                                                {modalMode !== 'view' && (
                                                    <span className="col-actions">
                                                        <button
                                                            type="button"
                                                            className="btn-icon danger"
                                                            onClick={() => handleRemoveBomComponent(index)}
                                                            title="Remove"
                                                        >
                                                            <Icon name="delete" />
                                                        </button>
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bom-table-footer">
                                        <span className="bom-total-label">Total Material Cost:</span>
                                        <span className="bom-total-value">
                                            ${bomComponents.reduce((sum, comp) => sum + (parseFloat(comp.total_cost) || 0), 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="bom-empty">
                                    <Icon name="inventory_2" />
                                    <p>No materials added yet</p>
                                    {modalMode !== 'view' && (
                                        <span className="hint">Click "Add Material" to build your BOM</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Operations Tab */}
                    {modalTab === 'operations' && (
                        <div className="bom-tab-content">
                            <div className="bom-tab-header">
                                <div className="bom-tab-title">
                                    <h4>Operations for: {currentProduct.name || 'New Product'}</h4>
                                    <p>Add the manufacturing operations required for this product</p>
                                </div>
                                {modalMode !== 'view' && (
                                    <button
                                        type="button"
                                        className="btn-add-material"
                                        onClick={handleAddOperation}
                                    >
                                        <Icon name="add" />
                                        Add Operation
                                    </button>
                                )}
                            </div>

                            {bomOperations.length > 0 ? (
                                <div className="bom-table">
                                    <div className="bom-table-header">
                                        <span className="col-material">Operation</span>
                                        <span className="col-unit">Department</span>
                                        <span className="col-cost">Cost/Hr</span>
                                        <span className="col-qty">Time (min)</span>
                                        <span className="col-qty">Qty</span>
                                        <span className="col-total">Labor Cost</span>
                                        {modalMode !== 'view' && <span className="col-actions">Actions</span>}
                                    </div>
                                    <div className="bom-table-body">
                                        {bomOperations.map((op, index) => (
                                            <div key={op.id || index} className="bom-table-row">
                                                <span className="col-material">
                                                    {modalMode === 'view' ? (
                                                        getOperationName(op.operation_id)
                                                    ) : (
                                                        <select
                                                            value={op.operation_id}
                                                            onChange={(e) => handleUpdateBomOperation(index, 'operation_id', e.target.value)}
                                                        >
                                                            <option value="">Select operation</option>
                                                            {operations.map(operation => (
                                                                <option key={operation.id} value={operation.id}>
                                                                    {operation.name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </span>
                                                <span className="col-unit">
                                                    {getOperationDepartment(op.operation_id)}
                                                </span>
                                                <span className="col-cost">
                                                    ${getOperationCostPerHour(op.operation_id).toFixed(2)}/hr
                                                </span>
                                                <span className="col-qty">
                                                    {modalMode === 'view' ? (
                                                        formatTime(op.time_minutes)
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            value={op.time_minutes}
                                                            onChange={(e) => handleUpdateBomOperation(index, 'time_minutes', parseInt(e.target.value) || 0)}
                                                            min="0"
                                                            placeholder="0"
                                                        />
                                                    )}
                                                </span>
                                                <span className="col-qty">
                                                    {modalMode === 'view' ? (
                                                        op.quantity || 1
                                                    ) : (
                                                        <input
                                                            type="number"
                                                            value={op.quantity || 1}
                                                            onChange={(e) => handleUpdateBomOperation(index, 'quantity', parseInt(e.target.value) || 1)}
                                                            min="1"
                                                        />
                                                    )}
                                                </span>
                                                <span className="col-total">
                                                    ${(parseFloat(op.labor_cost) || 0).toFixed(2)}
                                                </span>
                                                {modalMode !== 'view' && (
                                                    <span className="col-actions">
                                                        <button
                                                            type="button"
                                                            className="btn-icon danger"
                                                            onClick={() => handleRemoveBomOperation(index)}
                                                            title="Remove"
                                                        >
                                                            <Icon name="delete" />
                                                        </button>
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bom-table-footer">
                                        <div className="bom-footer-row">
                                            <span className="bom-total-label">Total Time:</span>
                                            <span className="bom-total-value">
                                                {formatTime(bomOperations.reduce((sum, op) => sum + (parseInt(op.time_minutes) || 0) * (parseInt(op.quantity) || 1), 0))}
                                            </span>
                                        </div>
                                        <div className="bom-footer-row">
                                            <span className="bom-total-label">Total Labor Cost:</span>
                                            <span className="bom-total-value">
                                                ${bomOperations.reduce((sum, op) => sum + (parseFloat(op.labor_cost) || 0), 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bom-empty">
                                    <Icon name="precision_manufacturing" />
                                    <p>No operations added yet</p>
                                    {modalMode !== 'view' && (
                                        <span className="hint">Click "Add Operation" to assign manufacturing steps</span>
                                    )}
                                </div>
                            )}
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
                size="small"
                variant="danger"
                onSave={confirmDelete}
                saveText="Delete"
                confirmOnClose={false}
            >
                <div className="delete-confirm">
                    <p>Are you sure you want to delete <strong>{productToDelete?.name}</strong>?</p>
                    <p className="text-muted">This action cannot be undone.</p>
                </div>
            </Modal>

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

export default ProductsModule;
