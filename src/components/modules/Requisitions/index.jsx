/**
 * Sales Orders Module (Requisitions)
 * Manages sales orders in MRP flow - converted from approved quotations
 * Connected to requisitionsApi for backend persistence
 */

import { useState, useEffect } from 'react';
import { Icon, SearchBox, Modal, Toast } from '../../common';
import { supabase } from '../../../lib/supabase';
import './styles.css';

/**
 * Status configuration with colors and icons
 */
const STATUS_CONFIG = {
    DRAFT: { label: 'Draft', color: '#6c757d', icon: 'edit' },
    PENDING_APPROVAL: { label: 'Pending Approval', color: '#ffc107', icon: 'schedule' },
    APPROVED: { label: 'Approved', color: '#28a745', icon: 'check_circle' },
    REJECTED: { label: 'Rejected', color: '#dc3545', icon: 'cancel' },
    ORDERED: { label: 'Ordered', color: '#17a2b8', icon: 'shopping_cart' },
    PARTIALLY_FULFILLED: { label: 'Partially Fulfilled', color: '#fd7e14', icon: 'local_shipping' },
    FULFILLED: { label: 'Fulfilled', color: '#20c997', icon: 'task_alt' },
    CANCELLED: { label: 'Cancelled', color: '#6c757d', icon: 'cancel' },
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
    const [loadingMaterials, setLoadingMaterials] = useState(false);

    // Item editing
    const [editingItemIndex, setEditingItemIndex] = useState(null);
    const [currentItem, setCurrentItem] = useState(emptyItem);

    // Related data
    const [warehouses, setWarehouses] = useState([]);
    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [quotations, setQuotations] = useState([]); // Approved quotations
    const [toast, setToast] = useState(null);

    // Load initial data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('[SalesOrders] Loading from Supabase...');

            // Load sales orders with their items and materials from Supabase
            const { data: salesOrdersData, error: soError } = await supabase
                .from('sales_orders')
                .select(`
                    *,
                    sales_order_items (*),
                    sales_order_materials (*)
                `)
                .order('created_at', { ascending: false });

            if (soError) throw soError;

            // Load clients
            const { data: clientsData, error: clientsError } = await supabase
                .from('clients')
                .select('*')
                .order('name');

            if (clientsError) throw clientsError;

            // Load warehouses
            const { data: warehousesData, error: whError } = await supabase
                .from('warehouses')
                .select('*')
                .order('name');

            if (whError) console.warn('[SalesOrders] Warehouses error:', whError);

            // Load projects
            const { data: projectsData, error: projError } = await supabase
                .from('projects')
                .select('*')
                .order('name');

            if (projError) console.warn('[SalesOrders] Projects error:', projError);

            // Normalize clients for lookup
            const normalizedClients = (clientsData || []).map(c => ({
                id: c.id,
                name: c.name,
                companyName: c.company_name || c.company || c.name,
            }));

            // Create a map of projects by po_number (which matches SO folio)
            const projectsByPoNumber = new Map();
            (projectsData || []).forEach(p => {
                if (p.po_number) {
                    projectsByPoNumber.set(p.po_number, p);
                }
            });

            // Normalize sales orders
            const normalizedOrders = (salesOrdersData || []).map(so => {
                const client = normalizedClients.find(c => c.id === so.client_id);
                // Find linked project by matching po_number with SO folio
                const linkedProject = projectsByPoNumber.get(so.folio);
                return {
                    id: so.id,
                    folio: so.folio,
                    quotationId: so.quotation_id,
                    customerId: so.client_id,
                    customerName: client?.companyName || client?.name || '',
                    billingEntity: so.billing_entity || 'DOVECREEK',
                    status: so.status || 'PENDING',
                    requestedAt: so.order_date || so.created_at,
                    requiredAt: so.delivery_date,
                    eta: so.delivery_date,
                    deposit: parseFloat(so.deposit) || 0,
                    depositPaid: true, // Always true since it comes from approved quotation
                    subtotal: parseFloat(so.subtotal) || 0,
                    tax: parseFloat(so.tax) || 0,
                    total: parseFloat(so.total) || 0,
                    comments: so.notes || '',
                    warehouseId: '',
                    warehouseName: '',
                    projectId: linkedProject?.id || '',
                    projectName: linkedProject?.name || '',
                    requesterName: client?.companyName || client?.name || 'System',
                    items: (so.sales_order_items || []).map(item => ({
                        id: item.id,
                        productId: item.product_id,
                        productName: item.description?.split(' - ')[0] || '',
                        description: item.description || '',
                        quantity: parseFloat(item.quantity) || 1,
                        unitPrice: parseFloat(item.unit_price) || 0,
                        subtotal: parseFloat(item.total) || 0,
                        status: 'REQUESTED',
                    })),
                    // Material requirements from BOMs
                    materials: (so.sales_order_materials || []).map(mat => ({
                        id: mat.id,
                        materialId: mat.material_id,
                        materialName: mat.material_name,
                        materialCode: mat.material_code,
                        unit: mat.unit,
                        requiredQuantity: parseFloat(mat.required_quantity) || 0,
                        stockAvailable: parseFloat(mat.stock_available) || 0,
                        shortage: parseFloat(mat.shortage) || 0,
                    })),
                    createdAt: so.created_at,
                    updatedAt: so.updated_at,
                };
            });

            setRequisitions(normalizedOrders);
            setFilteredRequisitions(normalizedOrders);
            setClients(normalizedClients);
            setWarehouses(warehousesData || []);
            setProjects(projectsData || []);

            // Load approved quotations with deposit paid (for creating new orders)
            const { data: quotationsData } = await supabase
                .from('quotations')
                .select('*')
                .eq('status', 'APPROVED')
                .eq('deposit_paid', true);

            setQuotations((quotationsData || []).map(q => ({
                id: q.id,
                folio: q.folio,
                clientId: q.client_id,
                clientName: '',
                billingEntity: q.billing_entity,
                approvalDate: q.approval_date,
                eta: q.eta,
                deposit: q.deposit,
                depositPaid: q.deposit_paid,
                subtotal: q.subtotal,
                tax: q.tax,
                total: q.total,
                notes: q.notes,
            })));

            console.log('[SalesOrders] Loaded:', normalizedOrders.length, 'orders from Supabase');
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

    const handleViewRequisition = async (requisition) => {
        // If materials already exist, show them directly
        if (requisition.materials && requisition.materials.length > 0) {
            setCurrentRequisition(requisition);
            setIsViewModalOpen(true);
            return;
        }

        // Show modal immediately with loading state
        setCurrentRequisition(requisition);
        setIsViewModalOpen(true);
        setLoadingMaterials(true);

        // Calculate materials from BOMs in real-time
        try {
            console.log('[SalesOrders] Items for material calculation:', requisition.items);

            const productIds = requisition.items
                ?.filter(item => item.productId)
                .map(item => item.productId) || [];

            console.log('[SalesOrders] Product IDs found:', productIds);

            if (productIds.length === 0) {
                console.log('[SalesOrders] No product IDs in items, cannot calculate materials');
                setLoadingMaterials(false);
                return;
            }

            // Get BOMs for the products
            const { data: bomsData, error: bomError } = await supabase
                .from('bom')
                .select('id, product_id')
                .in('product_id', productIds);

            console.log('[SalesOrders] BOMs query result:', { bomsData, bomError });

            if (bomError) {
                console.error('[SalesOrders] Error fetching BOMs:', bomError);
                setLoadingMaterials(false);
                return;
            }

            if (!bomsData || bomsData.length === 0) {
                console.log('[SalesOrders] No BOMs found for products');
                setLoadingMaterials(false);
                return;
            }

            // Get BOM components separately
            const bomIds = bomsData.map(b => b.id);
            const { data: componentsData, error: compError } = await supabase
                .from('bom_components')
                .select('id, bom_id, material_id, quantity')
                .in('bom_id', bomIds);

            console.log('[SalesOrders] Components query result:', { componentsData, compError });

            if (compError) {
                console.error('[SalesOrders] Error fetching components:', compError);
                setLoadingMaterials(false);
                return;
            }

            // Attach components to BOMs
            const bomsWithComponents = bomsData.map(bom => ({
                ...bom,
                bom_components: (componentsData || []).filter(c => c.bom_id === bom.id)
            }));

            console.log('[SalesOrders] BOMs with components:', bomsWithComponents);

            // Get all materials for stock info (use * to get all columns)
            const { data: materialsData, error: materialsError } = await supabase
                .from('materials')
                .select('*');

            if (materialsError) {
                console.error('[SalesOrders] Error loading materials:', materialsError);
            }

            console.log('[SalesOrders] Materials loaded:', materialsData?.length);

            // Normalize material data - the table uses sku/code_qb for code, and unit_id references units table
            const materialsMap = new Map((materialsData || []).map(m => [m.id, {
                id: m.id,
                name: m.name,
                code: m.sku || m.code_qb || '',
                unit: m.unit_id || 'pcs',
                stock: m.stock || 0,
            }]));

            // Calculate required materials
            const materialRequirements = new Map();

            for (const item of (requisition.items || [])) {
                if (!item.productId) continue;

                const bom = bomsWithComponents.find(b => b.product_id === item.productId);
                if (!bom || !bom.bom_components) continue;

                for (const component of bom.bom_components) {
                    if (!component.material_id) continue;

                    const material = materialsMap.get(component.material_id);
                    if (!material) continue;

                    const requiredQty = (component.quantity || 0) * (item.quantity || 1);

                    if (materialRequirements.has(component.material_id)) {
                        const existing = materialRequirements.get(component.material_id);
                        existing.requiredQuantity += requiredQty;
                        existing.shortage = Math.max(0, existing.requiredQuantity - existing.stockAvailable);
                    } else {
                        const stockAvailable = parseFloat(material.stock) || 0;
                        materialRequirements.set(component.material_id, {
                            id: `calc-${component.material_id}`,
                            materialId: component.material_id,
                            materialName: material.name,
                            materialCode: material.code || '',
                            unit: material.unit || 'pcs',
                            requiredQuantity: requiredQty,
                            stockAvailable: stockAvailable,
                            shortage: Math.max(0, requiredQty - stockAvailable),
                        });
                    }
                }
            }

            const calculatedMaterials = Array.from(materialRequirements.values());
            console.log('[SalesOrders] Calculated materials:', calculatedMaterials.length);

            setCurrentRequisition(prev => ({
                ...prev,
                materials: calculatedMaterials
            }));
        } catch (error) {
            console.error('[SalesOrders] Error calculating materials:', error);
        } finally {
            setLoadingMaterials(false);
        }
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

    // Helper to update a single sales order in Supabase
    const updateRequisitionInState = async (orderId, updates) => {
        try {
            // Map camelCase to snake_case for Supabase
            const supabaseUpdates = {
                updated_at: new Date().toISOString(),
            };
            if (updates.status) supabaseUpdates.status = updates.status;
            if (updates.notes !== undefined) supabaseUpdates.notes = updates.notes;
            if (updates.delivery_date) supabaseUpdates.delivery_date = updates.delivery_date;

            const { error } = await supabase
                .from('sales_orders')
                .update(supabaseUpdates)
                .eq('id', orderId);

            if (error) throw error;

            // Update local state
            const updatedData = { ...updates, updatedAt: new Date().toISOString() };
            setRequisitions(prev => prev.map(r => r.id === orderId ? { ...r, ...updatedData } : r));
            setFilteredRequisitions(prev => prev.map(r => r.id === orderId ? { ...r, ...updatedData } : r));

            return requisitions.find(r => r.id === orderId);
        } catch (error) {
            console.error('[SalesOrders] Error updating:', error);
            setToast({ message: 'Error updating order: ' + error.message, type: 'error' });
            throw error;
        }
    };

    const handleSave = async () => {
        try {
            if (currentRequisition.items.length === 0) {
                setToast({ message: 'Debe agregar al menos un item a la orden', type: 'error' });
                return;
            }

            // Get client name
            const client = clients.find(c => c.id === currentRequisition.customerId);

            console.log('[SalesOrders] Saving to Supabase...');

            if (currentRequisition.id) {
                // Update existing order
                const { error } = await supabase
                    .from('sales_orders')
                    .update({
                        client_id: currentRequisition.customerId,
                        billing_entity: currentRequisition.billingEntity,
                        status: currentRequisition.status,
                        delivery_date: currentRequisition.eta || null,
                        notes: currentRequisition.comments || '',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', currentRequisition.id);

                if (error) throw error;

                // Update local state
                const updatedOrder = {
                    ...currentRequisition,
                    customerName: client?.companyName || client?.name || '',
                    updatedAt: new Date().toISOString(),
                };
                setRequisitions(prev => prev.map(r => r.id === currentRequisition.id ? updatedOrder : r));
                setFilteredRequisitions(prev => prev.map(r => r.id === currentRequisition.id ? updatedOrder : r));
                setToast({ message: 'Sales Order updated!', type: 'success' });
            } else {
                // Create new order
                const soFolio = `SO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

                const { data: newOrder, error } = await supabase
                    .from('sales_orders')
                    .insert({
                        folio: soFolio,
                        quotation_id: currentRequisition.quotationId || null,
                        client_id: currentRequisition.customerId,
                        billing_entity: currentRequisition.billingEntity,
                        status: 'PENDING',
                        order_date: new Date().toISOString(),
                        delivery_date: currentRequisition.eta || null,
                        subtotal: currentRequisition.subtotal || 0,
                        tax: currentRequisition.tax || 0,
                        total: currentRequisition.total || 0,
                        deposit: currentRequisition.deposit || 0,
                        notes: currentRequisition.comments || '',
                    })
                    .select()
                    .single();

                if (error) throw error;

                // Save items
                if (currentRequisition.items.length > 0) {
                    const itemsData = currentRequisition.items.map(item => ({
                        sales_order_id: newOrder.id,
                        product_id: item.productId || null,
                        description: item.description || item.productName || '',
                        quantity: item.quantity,
                        unit_price: item.unitPrice,
                        total: item.subtotal,
                    }));

                    await supabase.from('sales_order_items').insert(itemsData);
                }

                // Add to local state
                const normalizedOrder = {
                    id: newOrder.id,
                    folio: newOrder.folio,
                    quotationId: newOrder.quotation_id,
                    customerId: newOrder.client_id,
                    customerName: client?.companyName || client?.name || '',
                    billingEntity: newOrder.billing_entity,
                    status: newOrder.status,
                    requestedAt: newOrder.order_date,
                    requiredAt: newOrder.delivery_date,
                    eta: newOrder.delivery_date,
                    deposit: newOrder.deposit,
                    depositPaid: true,
                    subtotal: newOrder.subtotal,
                    tax: newOrder.tax,
                    total: newOrder.total,
                    comments: newOrder.notes,
                    items: currentRequisition.items,
                    requesterName: client?.companyName || client?.name || 'System',
                    createdAt: newOrder.created_at,
                };

                setRequisitions(prev => [normalizedOrder, ...prev]);
                setFilteredRequisitions(prev => [normalizedOrder, ...prev]);
                setToast({ message: 'Sales Order created!', type: 'success' });
            }

            handleCloseModal();
        } catch (err) {
            console.error('[SalesOrders] Error saving:', err);
            setToast({ message: 'Error saving sales order: ' + err.message, type: 'error' });
        }
    };

    const handleDelete = async () => {
        try {
            // Delete items first
            await supabase
                .from('sales_order_items')
                .delete()
                .eq('sales_order_id', requisitionToDelete.id);

            // Delete order
            const { error } = await supabase
                .from('sales_orders')
                .delete()
                .eq('id', requisitionToDelete.id);

            if (error) throw error;

            setRequisitions(prev => prev.filter(r => r.id !== requisitionToDelete.id));
            setFilteredRequisitions(prev => prev.filter(r => r.id !== requisitionToDelete.id));
            setIsDeleteModalOpen(false);
            setRequisitionToDelete(null);
            setToast({ message: 'Sales Order deleted!', type: 'success' });
        } catch (err) {
            console.error('[SalesOrders] Error deleting:', err);
            setToast({ message: 'Error deleting order: ' + err.message, type: 'error' });
        }
    };

    const handleApprove = async (decision, comments = '') => {
        try {
            const newStatus = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
            await updateRequisitionInState(currentRequisition.id, {
                status: newStatus,
                approvalComments: comments,
                approvalDate: decision === 'APPROVED' ? new Date().toISOString() : null,
            });
            setIsApprovalModalOpen(false);
        } catch (err) {
            console.error('[SalesOrders] Error updating status:', err);
            alert('Error processing approval: ' + err.message);
        }
    };

    const handleSubmitForApproval = async (requisition) => {
        try {
            await updateRequisitionInState(requisition.id, { status: 'PENDING_APPROVAL' });
        } catch (err) {
            console.error('[SalesOrders] Error submitting for approval:', err);
            alert('Error submitting for approval: ' + err.message);
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
        const iconName = {
            'DRAFT': 'edit',
            'PENDING_APPROVAL': 'schedule',
            'APPROVED': 'check_circle',
            'REJECTED': 'cancel',
            'ORDERED': 'shopping_cart',
            'PARTIALLY_FULFILLED': 'local_shipping',
            'FULFILLED': 'task_alt',
            'CANCELLED': 'cancel'
        }[status] || 'info';
        return (
            <span className={`status-badge status-${status.toLowerCase().replace('_', '-')}`}>
                <Icon name={iconName} />
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
            <div className="module-page requisitions-page">
                <div className="loading-state">
                    <Icon name="progress_activity" />
                    <p>Loading sales orders...</p>
                </div>
            </div>
        );
    }

    // Render error state
    if (error) {
        return (
            <div className="module-page requisitions-page">
                <div className="error-state">
                    <Icon name="error" />
                    <p>Error loading sales orders: {error}</p>
                    <button className="btn-primary-action" onClick={loadData}>Retry</button>
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
            <div className="catalog-toolbar">
                <SearchBox
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by folio, requester, warehouse..."
                    className="catalog-search"
                />
                <div className="toolbar-filters">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="ALL">All Statuses</option>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>
                </div>
                <div className="view-toggle">
                    <button
                        className={`view-toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
                        onClick={() => setViewMode('table')}
                        title="Table view"
                    >
                        <Icon name="view_list" />
                    </button>
                    <button
                        className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => setViewMode('grid')}
                        title="Grid view"
                    >
                        <Icon name="grid_view" />
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="module-stats-row">
                <div className="module-stat-card">
                    <div className="stat-icon purple">
                        <Icon name="shopping_cart" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{requisitions.length}</span>
                        <span className="stat-label">Total Orders</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon orange">
                        <Icon name="schedule" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">
                            {requisitions.filter(r => r.status === 'PENDING_APPROVAL').length}
                        </span>
                        <span className="stat-label">Pending</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon green">
                        <Icon name="check_circle" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">
                            {requisitions.filter(r => r.status === 'APPROVED').length}
                        </span>
                        <span className="stat-label">Approved</span>
                    </div>
                </div>
                <div className="module-stat-card">
                    <div className="stat-icon blue">
                        <Icon name="task_alt" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">
                            {requisitions.filter(r => r.status === 'FULFILLED').length}
                        </span>
                        <span className="stat-label">Fulfilled</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            {viewMode === 'table' ? (
                <div className="catalog-table">
                    <div className="catalog-table-header">
                        <span className="col-expand"></span>
                        <span className="col-folio">Folio</span>
                        <span className="col-requester">Requester</span>
                        <span className="col-warehouse">Warehouse</span>
                        <span className="col-project">Project</span>
                        <span className="col-items">Items</span>
                        <span className="col-date">Required Date</span>
                        <span className="col-status">Status</span>
                        <span className="col-actions">Actions</span>
                    </div>
                    {filteredRequisitions.map((requisition) => (
                        <div key={requisition.id}>
                            <div className={`catalog-table-row ${expandedRows[requisition.id] ? 'expanded' : ''}`}>
                                <span className="col-expand">
                                    <button className="btn-expand" onClick={() => toggleRowExpansion(requisition.id)}>
                                        <Icon name={expandedRows[requisition.id] ? 'expand_more' : 'chevron_right'} />
                                    </button>
                                </span>
                                <span className="col-folio"><strong>{requisition.folio}</strong></span>
                                <span className="col-requester">{requisition.requesterName}</span>
                                <span className="col-warehouse">
                                    <Icon name="warehouse" />
                                    {requisition.warehouseName}
                                </span>
                                <span className="col-project">{requisition.projectName || '-'}</span>
                                <span className="col-items">
                                    <Icon name="inventory_2" />
                                    {calculateItemsTotal(requisition.items)}
                                </span>
                                <span className="col-date">
                                    <Icon name="event" />
                                    {formatDate(requisition.requiredAt)}
                                </span>
                                <span className="col-status">{renderStatusBadge(requisition.status)}</span>
                                <span className="col-actions">
                                    <button className="btn-action-view" onClick={() => handleViewRequisition(requisition)} title="View">
                                        <Icon name="visibility" />
                                    </button>
                                    {requisition.status === 'DRAFT' && (
                                        <>
                                            <button className="btn-action-edit" onClick={() => handleOpenModal(requisition)} title="Edit">
                                                <Icon name="edit" />
                                            </button>
                                            <button className="btn-action-approve" onClick={() => handleSubmitForApproval(requisition)} title="Submit">
                                                <Icon name="send" />
                                            </button>
                                        </>
                                    )}
                                    {requisition.status === 'PENDING_APPROVAL' && (
                                        <button className="btn-action-approve" onClick={() => handleOpenApprovalModal(requisition)} title="Review">
                                            <Icon name="how_to_reg" />
                                        </button>
                                    )}
                                    {['DRAFT', 'REJECTED'].includes(requisition.status) && (
                                        <button className="btn-action-delete" onClick={() => {
                                            setRequisitionToDelete(requisition);
                                            setIsDeleteModalOpen(true);
                                        }} title="Delete">
                                            <Icon name="delete" />
                                        </button>
                                    )}
                                </span>
                            </div>
                            {expandedRows[requisition.id] && (
                                <div className="catalog-expanded-row">
                                    <h4>Order Items</h4>
                                    <div className="expanded-items-table">
                                        <div className="expanded-items-header">
                                            <span>Material</span>
                                            <span>Qty</span>
                                            <span>Unit</span>
                                            <span>Supplier</span>
                                            <span>Needed By</span>
                                            <span>Status</span>
                                            <span>Received</span>
                                        </div>
                                        {requisition.items.map((item, idx) => (
                                            <div key={item.id || idx} className="expanded-items-row">
                                                <span>{item.productName || item.description}</span>
                                                <span>{item.quantity}</span>
                                                <span>pcs</span>
                                                <span>{item.suggestedSupplierName || '-'}</span>
                                                <span>{formatDate(item.neededBy)}</span>
                                                <span>{renderItemStatusBadge(item.status)}</span>
                                                <span>{item.receivedQty || 0} / {item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Materials Requirements Section */}
                                    {requisition.materials && requisition.materials.length > 0 && (
                                        <>
                                            <h4 style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <Icon name="inventory" /> Material Requirements
                                            </h4>
                                            <div className="expanded-items-table materials-table">
                                                <div className="expanded-items-header">
                                                    <span>Material</span>
                                                    <span>Code</span>
                                                    <span>Required</span>
                                                    <span>In Stock</span>
                                                    <span>Shortage</span>
                                                    <span>Unit</span>
                                                    <span>Status</span>
                                                </div>
                                                {requisition.materials.map((mat, idx) => (
                                                    <div key={mat.id || idx} className={`expanded-items-row ${mat.shortage > 0 ? 'shortage-row' : 'sufficient-row'}`}>
                                                        <span>{mat.materialName}</span>
                                                        <span>{mat.materialCode || '-'}</span>
                                                        <span className="qty-required">{mat.requiredQuantity}</span>
                                                        <span className="qty-stock">{mat.stockAvailable}</span>
                                                        <span className={`qty-shortage ${mat.shortage > 0 ? 'has-shortage' : ''}`}>
                                                            {mat.shortage > 0 ? mat.shortage : '-'}
                                                        </span>
                                                        <span>{mat.unit}</span>
                                                        <span>
                                                            {mat.shortage > 0 ? (
                                                                <span className="material-status shortage">
                                                                    <Icon name="warning" /> Faltante
                                                                </span>
                                                            ) : (
                                                                <span className="material-status sufficient">
                                                                    <Icon name="check_circle" /> OK
                                                                </span>
                                                            )}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="materials-summary">
                                                <span className="summary-item">
                                                    <strong>Total Materials:</strong> {requisition.materials.length}
                                                </span>
                                                <span className="summary-item sufficient">
                                                    <Icon name="check_circle" /> In Stock: {requisition.materials.filter(m => m.shortage <= 0).length}
                                                </span>
                                                <span className="summary-item shortage">
                                                    <Icon name="warning" /> With Shortage: {requisition.materials.filter(m => m.shortage > 0).length}
                                                </span>
                                            </div>
                                        </>
                                    )}

                                    {requisition.comments && (
                                        <p className="expanded-comments"><strong>Comments:</strong> {requisition.comments}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    {filteredRequisitions.length === 0 && (
                        <div className="catalog-empty">
                            <Icon name="shopping_cart" />
                            <p>No sales orders found</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="sales-orders-grid">
                    {filteredRequisitions.map((requisition) => (
                        <div key={requisition.id} className="order-card">
                            <div className="order-card-header">
                                <span className="order-folio">{requisition.folio}</span>
                                {renderStatusBadge(requisition.status)}
                            </div>
                            <div className="order-card-body">
                                <div className="order-info-row">
                                    <Icon name="person" />
                                    <span>{requisition.requesterName}</span>
                                </div>
                                <div className="order-info-row">
                                    <Icon name="warehouse" />
                                    <span>{requisition.warehouseName}</span>
                                </div>
                                {requisition.projectName && (
                                    <div className="order-info-row">
                                        <Icon name="assignment" />
                                        <span>{requisition.projectName}</span>
                                    </div>
                                )}
                                <div className="order-info-row">
                                    <Icon name="event" />
                                    <span>Required: {formatDate(requisition.requiredAt)}</span>
                                </div>
                                <div className="order-items-summary">
                                    <Icon name="inventory_2" />
                                    <span>{calculateItemsTotal(requisition.items)} items</span>
                                    <div className="progress-bar">
                                        <div className="progress-bar-fill" style={{ width: `${calculateFulfilledPercentage(requisition.items)}%` }} />
                                    </div>
                                    <span>{calculateFulfilledPercentage(requisition.items)}%</span>
                                </div>
                            </div>
                            <div className="order-card-footer">
                                <button className="btn-action-view" onClick={() => handleViewRequisition(requisition)}>
                                    <Icon name="visibility" /> View
                                </button>
                                {requisition.status === 'DRAFT' && (
                                    <button className="btn-action-edit" onClick={() => handleOpenModal(requisition)}>
                                        <Icon name="edit" /> Edit
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {filteredRequisitions.length === 0 && (
                        <div className="catalog-empty">
                            <Icon name="shopping_cart" />
                            <p>No sales orders found</p>
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
                                <Icon name="check_circle" style={{ color: '#28a745', marginRight: '8px' }} />
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
                                                    <button className="btn-action-edit" onClick={() => handleEditItem(index)}>
                                                        <Icon name="edit" />
                                                    </button>
                                                    <button className="btn-action-delete" onClick={() => handleRemoveItem(index)}>
                                                        <Icon name="delete" />
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
                        <h4><Icon name="shopping_cart" /> Order Items ({currentRequisition.items?.length || 0})</h4>
                        <table className="items-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Description</th>
                                    <th>Qty</th>
                                    <th>Unit Price</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRequisition.items?.map((item, idx) => (
                                    <tr key={item.id || idx}>
                                        <td>{item.productName || '-'}</td>
                                        <td>{item.description || '-'}</td>
                                        <td>{item.quantity}</td>
                                        <td>{formatCurrency(item.unitPrice)}</td>
                                        <td>{formatCurrency(item.subtotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Order Totals */}
                        <div className="order-totals">
                            <div className="total-row">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(currentRequisition.subtotal)}</span>
                            </div>
                            <div className="total-row">
                                <span>Tax (16%):</span>
                                <span>{formatCurrency(currentRequisition.tax)}</span>
                            </div>
                            <div className="total-row grand-total">
                                <span>Total:</span>
                                <span>{formatCurrency(currentRequisition.total)}</span>
                            </div>
                            {currentRequisition.deposit > 0 && (
                                <div className="total-row deposit">
                                    <span>Deposit Received:</span>
                                    <span className="deposit-amount">{formatCurrency(currentRequisition.deposit)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Material Requirements Section */}
                    <div className="detail-materials">
                        <h4><Icon name="inventory" /> Material Requirements {currentRequisition.materials?.length > 0 && `(${currentRequisition.materials.length})`}</h4>

                        {loadingMaterials ? (
                            <div className="materials-loading" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                                <Icon name="progress_activity" style={{ animation: 'spin 1s linear infinite', fontSize: '24px' }} />
                                <p style={{ marginTop: '8px' }}>Calculating materials from BOMs...</p>
                            </div>
                        ) : currentRequisition.materials && currentRequisition.materials.length > 0 ? (
                            <>
                                <table className="items-table materials-requirements-table">
                                    <thead>
                                        <tr>
                                            <th>Material</th>
                                            <th>Code</th>
                                            <th>Required</th>
                                            <th>In Stock</th>
                                            <th>Shortage</th>
                                            <th>Unit</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentRequisition.materials.map((mat, idx) => (
                                            <tr key={mat.id || idx} className={mat.shortage > 0 ? 'shortage-row' : 'sufficient-row'}>
                                                <td>{mat.materialName}</td>
                                                <td>{mat.materialCode || '-'}</td>
                                                <td className="qty-required">{mat.requiredQuantity}</td>
                                                <td className="qty-stock">{mat.stockAvailable}</td>
                                                <td className={`qty-shortage ${mat.shortage > 0 ? 'has-shortage' : ''}`}>
                                                    {mat.shortage > 0 ? mat.shortage : '-'}
                                                </td>
                                                <td>{mat.unit}</td>
                                                <td>
                                                    {mat.shortage > 0 ? (
                                                        <span className="material-status shortage">
                                                            <Icon name="warning" /> Faltante
                                                        </span>
                                                    ) : (
                                                        <span className="material-status sufficient">
                                                            <Icon name="check_circle" /> OK
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Materials Summary */}
                                <div className="materials-summary">
                                    <span className="summary-item">
                                        <strong>Total Materials:</strong> {currentRequisition.materials.length}
                                    </span>
                                    <span className="summary-item sufficient">
                                        <Icon name="check_circle" /> In Stock: {currentRequisition.materials.filter(m => m.shortage <= 0).length}
                                    </span>
                                    <span className="summary-item shortage">
                                        <Icon name="warning" /> With Shortage: {currentRequisition.materials.filter(m => m.shortage > 0).length}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="no-materials-message" style={{ padding: '20px', textAlign: 'center', color: '#888', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                <Icon name="info" style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }} />
                                <p style={{ margin: 0 }}>No se encontraron BOMs para los productos de esta orden.</p>
                                <p style={{ margin: '4px 0 0', fontSize: '12px' }}>Crea un BOM para cada producto para ver los materiales requeridos.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Approval Modal */}
            {isApprovalModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content modal-approval" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon">
                                <Icon name="how_to_reg" />
                            </div>
                            <div className="modal-header-text">
                                <h3>Review Order</h3>
                                <p>Approve or reject {currentRequisition.folio}</p>
                            </div>
                            <button className="modal-close" onClick={() => setIsApprovalModalOpen(false)}>
                                <Icon name="close" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="approval-summary">
                                <div className="summary-item">
                                    <Icon name="person" />
                                    <span><strong>Requester:</strong> {currentRequisition.requesterName}</span>
                                </div>
                                <div className="summary-item">
                                    <Icon name="inventory_2" />
                                    <span><strong>Items:</strong> {currentRequisition.items?.length || 0}</span>
                                </div>
                                <div className="summary-item">
                                    <Icon name="warehouse" />
                                    <span><strong>Warehouse:</strong> {currentRequisition.warehouseName}</span>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Approval Comments</label>
                                <textarea id="approvalComments" rows="3" placeholder="Add optional comments..." />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-modal-reject" onClick={() => {
                                const comments = document.getElementById('approvalComments').value;
                                handleApprove('REJECTED', comments);
                            }}>
                                <Icon name="cancel" />
                                Reject
                            </button>
                            <button className="btn-modal-approve" onClick={() => {
                                const comments = document.getElementById('approvalComments').value;
                                handleApprove('APPROVED', comments);
                            }}>
                                <Icon name="check_circle" />
                                Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && requisitionToDelete && (
                <div className="modal-overlay">
                    <div className="modal-content modal-small" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-icon warning">
                                <Icon name="warning" />
                            </div>
                            <div className="modal-header-text">
                                <h3>Confirm Delete</h3>
                                <p>This action cannot be undone</p>
                            </div>
                            <button className="modal-close" onClick={() => setIsDeleteModalOpen(false)}>
                                <Icon name="close" />
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Are you sure you want to delete order <strong>{requisitionToDelete.folio}</strong>?</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-modal-cancel" onClick={() => setIsDeleteModalOpen(false)}>
                                Cancel
                            </button>
                            <button className="btn-modal-delete" onClick={handleDelete}>
                                <Icon name="delete" />
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

export default Requisitions;
