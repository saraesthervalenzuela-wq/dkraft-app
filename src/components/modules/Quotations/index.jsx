/**
 * Quotations Module (Cotizaciones / Estimates)
 * First step in MRP flow - Creates estimates that can become Sales Orders
 * Only Dovecreek projects sync to QuickBooks
 */

import { useState, useEffect } from 'react';
import { Icon, SearchBox, Modal, Toast } from '../../common';
import { supabase } from '../../../lib/supabase';
import { exportQuotationToPDF } from '../../../utils/pdfExport';
import './styles.css';

// Billing entities
const BILLING_ENTITIES = [
    { id: 'DOVECREEK', name: 'Dovecreek Maquila', syncsToQB: true },
    { id: 'INNOVATIVE', name: 'Innovative Mx', syncsToQB: false },
];

// Status configuration
const STATUS_CONFIG = {
    DRAFT: { label: 'Draft', color: '#6c757d', icon: 'edit' },
    SENT: { label: 'Sent', color: '#d35400', icon: 'send' },
    APPROVED: { label: 'Approved', color: '#28a745', icon: 'check_circle' },
    REJECTED: { label: 'Rejected', color: '#dc3545', icon: 'cancel' },
    CONVERTED: { label: 'Converted to SO', color: '#06b6d4', icon: 'swap_horiz' },
    CANCELLED: { label: 'Cancelled', color: '#6c757d', icon: 'block' },
};

// Deposit percentage options
const DEPOSIT_OPTIONS = [
    { value: 50, label: '50%' },
    { value: 40, label: '40%' },
    { value: 30, label: '30%' },
    { value: 20, label: '20%' },
    { value: 10, label: '10%' },
];

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
    depositRequired: 50,
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


const QuotationsModule = () => {
    // Data state
    const [quotations, setQuotations] = useState([]);
    const [clients, setClients] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [toast, setToast] = useState(null);

    // UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [billingEntityFilter, setBillingEntityFilter] = useState('ALL');
    const [viewMode, setViewMode] = useState('table');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // add, edit, view
    const [currentQuotation, setCurrentQuotation] = useState(emptyQuotation);
    const [currentItem, setCurrentItem] = useState(emptyItem);
    const [editingItemIndex, setEditingItemIndex] = useState(null);

    // Deposit confirmation modal state
    const [showDepositModal, setShowDepositModal] = useState(false);
    const [depositQuotation, setDepositQuotation] = useState(null);
    const [depositAmount, setDepositAmount] = useState(0);
    const [depositConfirmed, setDepositConfirmed] = useState(false);

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            console.log('[Quotations] Loading from Supabase...');

            // Load quotations with their items
            const { data: quotationsData, error: quotationsError } = await supabase
                .from('quotations')
                .select(`
                    *,
                    quotation_items (*)
                `)
                .order('created_at', { ascending: false });

            if (quotationsError) throw quotationsError;

            // Load products first (needed to get product names for items)
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('*')
                .order('name');

            if (productsError) throw productsError;

            // Normalize products
            const normalizedProducts = (productsData || []).map(p => ({
                id: p.id,
                name: p.name,
                description: p.description,
                price: parseFloat(p.price) || 0,
                category: p.category_id,
            }));

            console.log('[Quotations] Loaded:', normalizedProducts.length, 'products');

            // Normalize quotations data
            const normalizedQuotations = (quotationsData || []).map(q => ({
                id: q.id,
                folio: q.folio || '',
                clientId: q.client_id,
                billingEntity: q.billing_entity || 'DOVECREEK',
                status: q.status || 'DRAFT',
                createdAt: q.created_at,
                approvalDate: q.approval_date || '',
                eta: q.eta || '',
                depositRequired: q.deposit_required || 50,
                deposit: parseFloat(q.deposit) || 0,
                depositPaid: q.deposit_paid || false,
                subtotal: parseFloat(q.subtotal) || 0,
                tax: parseFloat(q.tax) || 0,
                total: parseFloat(q.total) || 0,
                notes: q.notes || '',
                items: (q.quotation_items || []).map(item => {
                    const product = normalizedProducts.find(p => p.id === item.product_id);
                    return {
                        id: item.id,
                        productId: item.product_id,
                        productName: product?.name || '',
                        description: item.description || '',
                        quantity: parseFloat(item.quantity) || 1,
                        unitPrice: parseFloat(item.unit_price) || 0,
                        discount: 0,
                        subtotal: parseFloat(item.total) || 0,
                    };
                }),
            }));

            console.log('[Quotations] Loaded:', normalizedQuotations.length, 'quotations');

            // Load clients
            const { data: clientsData, error: clientsError } = await supabase
                .from('clients')
                .select('*')
                .order('name');

            if (clientsError) throw clientsError;

            // Normalize clients
            const normalizedClients = (clientsData || []).map(c => ({
                id: c.id,
                name: c.name,
                companyName: c.company_name || c.company || c.name,
                email: c.email,
                phone: c.phone,
                address: c.address,
                city: c.city,
                state: c.state,
                status: c.status,
            }));

            console.log('[Quotations] Loaded:', normalizedClients.length, 'clients');

            // Update client names in quotations
            const quotationsWithClientNames = normalizedQuotations.map(q => {
                const client = normalizedClients.find(c => c.id === q.clientId);
                return {
                    ...q,
                    clientName: client?.companyName || client?.name || ''
                };
            });

            setQuotations(quotationsWithClientNames);
            setClients(normalizedClients);
            setProducts(normalizedProducts);
        } catch (error) {
            console.error('[Quotations] Error loading:', error);
            setToast({ message: 'Error loading data: ' + error.message, type: 'error' });
            setQuotations([]);
            setClients([]);
            setProducts([]);
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

    // Filter by billing entity first
    const entityFilteredQuotations = billingEntityFilter === 'ALL'
        ? quotations
        : quotations.filter(q => q.billingEntity === billingEntityFilter);

    // Then filter by search and status
    const filteredQuotations = entityFilteredQuotations.filter(q => {
        const matchesSearch =
            q.folio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            q.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Entity counts for tabs
    const dovecreekQuotations = quotations.filter(q => q.billingEntity === 'DOVECREEK').length;
    const innovativeQuotations = quotations.filter(q => q.billingEntity === 'INNOVATIVE').length;

    // Calculate item subtotal
    const calculateItemSubtotal = (item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        const discount = parseFloat(item.discount) || 0;
        return (qty * price) - discount;
    };

    // Calculate quotation totals
    // IVA only applies to Innovative, not Dovecreek
    const calculateTotals = (items, billingEntity = 'DOVECREEK') => {
        const subtotal = items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
        // Only apply 16% IVA for Innovative
        const tax = billingEntity === 'INNOVATIVE' ? subtotal * 0.16 : 0;
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
        } else if (field === 'depositRequired') {
            // Auto-calculate deposit when percentage changes
            const percentage = parseInt(value) || 50;
            setCurrentQuotation(prev => ({
                ...prev,
                depositRequired: percentage,
                deposit: prev.total * (percentage / 100)
            }));
        } else if (field === 'billingEntity') {
            // Recalculate totals when billing entity changes (IVA only for Innovative)
            setCurrentQuotation(prev => {
                const totals = calculateTotals(prev.items, value);
                const depositPercent = prev.depositRequired || 50;
                return {
                    ...prev,
                    billingEntity: value,
                    ...totals,
                    deposit: totals.total * (depositPercent / 100)
                };
            });
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

        const totals = calculateTotals(updatedItems, currentQuotation.billingEntity);
        const depositPercent = currentQuotation.depositRequired || 50;
        setCurrentQuotation(prev => ({
            ...prev,
            items: updatedItems,
            ...totals,
            deposit: totals.total * (depositPercent / 100),
        }));
        setCurrentItem(emptyItem);
    };

    const handleEditItem = (index) => {
        setCurrentItem(currentQuotation.items[index]);
        setEditingItemIndex(index);
    };

    const handleRemoveItem = (index) => {
        const updatedItems = currentQuotation.items.filter((_, i) => i !== index);
        const totals = calculateTotals(updatedItems, currentQuotation.billingEntity);
        const depositPercent = currentQuotation.depositRequired || 50;
        setCurrentQuotation(prev => ({
            ...prev,
            items: updatedItems,
            ...totals,
            deposit: totals.total * (depositPercent / 100),
        }));
    };

    // Save quotation to Supabase
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
                setToast({ message: 'You must add at least one item to the quotation', type: 'error' });
                return;
            }

            if (!currentQuotation.clientId) {
                setToast({ message: 'You must select a client', type: 'error' });
                return;
            }

            // Recalculate totals with all items (IVA only for Innovative)
            const totals = calculateTotals(itemsToSave, currentQuotation.billingEntity);

            const client = clients.find(c => c.id === currentQuotation.clientId);

            // Generate folio if new quotation
            const folio = currentQuotation.folio || generateFolio();

            // Prepare quotation data for Supabase (snake_case)
            const quotationData = {
                folio,
                client_id: currentQuotation.clientId,
                billing_entity: currentQuotation.billingEntity || 'DOVECREEK',
                status: currentQuotation.status || 'DRAFT',
                approval_date: currentQuotation.approvalDate || null,
                eta: currentQuotation.eta || null,
                deposit_required: currentQuotation.depositRequired || 50,
                deposit: parseFloat(currentQuotation.deposit) || 0,
                deposit_paid: currentQuotation.depositPaid || false,
                subtotal: totals.subtotal,
                tax: totals.tax,
                total: totals.total,
                notes: currentQuotation.notes || '',
                updated_at: new Date().toISOString(),
            };

            console.log('[Quotations] Saving to Supabase:', quotationData);

            let savedQuotationId;

            if (currentQuotation.id) {
                // Update existing quotation
                const { error: updateError } = await supabase
                    .from('quotations')
                    .update(quotationData)
                    .eq('id', currentQuotation.id);

                if (updateError) throw updateError;
                savedQuotationId = currentQuotation.id;

                // Delete existing items
                await supabase
                    .from('quotation_items')
                    .delete()
                    .eq('quotation_id', currentQuotation.id);

                console.log('[Quotations] Updated:', savedQuotationId);
            } else {
                // Create new quotation
                const { data: newQuotation, error: insertError } = await supabase
                    .from('quotations')
                    .insert(quotationData)
                    .select()
                    .single();

                if (insertError) throw insertError;
                savedQuotationId = newQuotation.id;
                console.log('[Quotations] Created:', savedQuotationId);
            }

            // Save items
            if (itemsToSave.length > 0) {
                const itemsData = itemsToSave.map(item => ({
                    quotation_id: savedQuotationId,
                    product_id: item.productId || null,
                    description: item.productName ? `${item.productName} - ${item.description || ''}`.trim() : (item.description || ''),
                    quantity: parseFloat(item.quantity) || 1,
                    unit_price: parseFloat(item.unitPrice) || 0,
                    total: calculateItemSubtotal(item),
                }));

                const { error: itemsError } = await supabase
                    .from('quotation_items')
                    .insert(itemsData);

                if (itemsError) throw itemsError;
                console.log('[Quotations] Saved', itemsData.length, 'items');
            }

            // Update local state
            const updatedQuotation = {
                id: savedQuotationId,
                folio,
                clientId: currentQuotation.clientId,
                clientName: client?.companyName || client?.name || '',
                billingEntity: quotationData.billing_entity,
                status: quotationData.status,
                createdAt: currentQuotation.createdAt || new Date().toISOString(),
                approvalDate: quotationData.approval_date,
                eta: quotationData.eta,
                depositRequired: quotationData.deposit_required,
                deposit: quotationData.deposit,
                depositPaid: quotationData.deposit_paid,
                subtotal: totals.subtotal,
                tax: totals.tax,
                total: totals.total,
                notes: quotationData.notes,
                items: itemsToSave,
            };

            if (currentQuotation.id) {
                setQuotations(quotations.map(q => q.id === currentQuotation.id ? updatedQuotation : q));
                setToast({ message: 'Quotation updated successfully!', type: 'success' });
            } else {
                setQuotations([updatedQuotation, ...quotations]);
                setToast({ message: 'Quotation created successfully!', type: 'success' });
            }

            handleCloseModal();
        } catch (error) {
            console.error('[Quotations] Error saving:', error);
            setToast({ message: 'Error saving quotation: ' + error.message, type: 'error' });
        }
    };

    // Update quotation status in Supabase
    const updateQuotationStatus = async (quotationId, updates) => {
        try {
            // Map camelCase to snake_case
            const supabaseUpdates = {
                updated_at: new Date().toISOString(),
            };
            if (updates.status) supabaseUpdates.status = updates.status;
            if (updates.approvalDate) supabaseUpdates.approval_date = updates.approvalDate;
            if (updates.depositPaid !== undefined) supabaseUpdates.deposit_paid = updates.depositPaid;

            const { error } = await supabase
                .from('quotations')
                .update(supabaseUpdates)
                .eq('id', quotationId);

            if (error) throw error;

            // Update local state
            setQuotations(quotations.map(q => q.id === quotationId ? { ...q, ...updates } : q));
            console.log('[Quotations] Status updated:', quotationId);
        } catch (error) {
            console.error('[Quotations] Error updating status:', error);
            setToast({ message: 'Error updating status: ' + error.message, type: 'error' });
        }
    };

    // Status actions
    const handleSendToClient = async (quotation) => {
        await updateQuotationStatus(quotation.id, { status: 'SENT' });
        setToast({ message: 'Quotation sent to client!', type: 'success' });
    };

    // Open deposit confirmation modal when approving
    const handleApprove = (quotation) => {
        setDepositQuotation(quotation);
        setDepositAmount(quotation.deposit || quotation.total * 0.5); // Default 50% deposit
        setDepositConfirmed(false);
        setShowDepositModal(true);
    };

    // Confirm deposit and approve quotation
    const handleConfirmDeposit = async () => {
        if (!depositQuotation) return;

        if (!depositConfirmed) {
            setToast({ message: 'Please confirm that the deposit has been received', type: 'error' });
            return;
        }

        if (depositAmount <= 0) {
            setToast({ message: 'Please enter a valid deposit amount', type: 'error' });
            return;
        }

        try {
            // Update quotation with deposit info and approval
            const { error } = await supabase
                .from('quotations')
                .update({
                    status: 'APPROVED',
                    approval_date: new Date().toISOString(),
                    deposit: depositAmount,
                    deposit_paid: true,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', depositQuotation.id);

            if (error) throw error;

            // Update local state
            setQuotations(quotations.map(q =>
                q.id === depositQuotation.id
                    ? {
                        ...q,
                        status: 'APPROVED',
                        approvalDate: new Date().toISOString(),
                        deposit: depositAmount,
                        depositPaid: true,
                    }
                    : q
            ));

            setToast({ message: 'Quotation approved with deposit confirmed!', type: 'success' });
            setShowDepositModal(false);
            setDepositQuotation(null);
        } catch (error) {
            console.error('[Quotations] Error approving:', error);
            setToast({ message: 'Error approving quotation: ' + error.message, type: 'error' });
        }
    };

    // Create Sales Order and Project from approved quotation
    const handleConvertToSalesOrder = async (quotation) => {
        try {
            // Verify quotation is approved and deposit is paid
            if (quotation.status !== 'APPROVED') {
                setToast({ message: 'Quotation must be approved first', type: 'error' });
                return;
            }
            if (!quotation.depositPaid) {
                setToast({ message: 'Deposit must be confirmed before creating Sales Order', type: 'error' });
                return;
            }

            // Generate Sales Order folio
            const soFolio = `SO-${quotation.folio.replace('COT-', '')}`;

            // Create Sales Order in Supabase
            const { data: salesOrder, error: soError } = await supabase
                .from('sales_orders')
                .insert({
                    folio: soFolio,
                    quotation_id: quotation.id,
                    client_id: quotation.clientId,
                    billing_entity: quotation.billingEntity,
                    status: 'PENDING',
                    order_date: new Date().toISOString(),
                    delivery_date: quotation.eta || null,
                    subtotal: quotation.subtotal,
                    tax: quotation.tax,
                    total: quotation.total,
                    deposit: quotation.deposit,
                    notes: quotation.notes || '',
                })
                .select()
                .single();

            if (soError) throw soError;

            console.log('[Quotations] Sales Order created:', salesOrder.id);

            // Copy quotation items to sales order items
            if (quotation.items && quotation.items.length > 0) {
                const soItems = quotation.items.map(item => ({
                    sales_order_id: salesOrder.id,
                    product_id: item.productId || null,
                    description: item.productName ? `${item.productName} - ${item.description || ''}`.trim() : (item.description || ''),
                    quantity: item.quantity,
                    unit_price: item.unitPrice,
                    total: item.subtotal,
                }));

                const { error: itemsError } = await supabase
                    .from('sales_order_items')
                    .insert(soItems);

                if (itemsError) throw itemsError;
                console.log('[Quotations] Copied', soItems.length, 'items to Sales Order');
            }

            // Calculate material requirements from BOMs
            const productIds = quotation.items
                ?.filter(item => item.productId)
                .map(item => item.productId) || [];

            console.log('[Quotations] Product IDs for material calculation:', productIds);

            if (productIds.length > 0) {
                // Get BOMs for the products (separate query to avoid JOIN issues)
                const { data: bomsData, error: bomError } = await supabase
                    .from('bom')
                    .select('id, product_id')
                    .in('product_id', productIds);

                console.log('[Quotations] BOMs found:', bomsData?.length, bomError);

                if (bomsData && bomsData.length > 0) {
                    // Get BOM components separately
                    const bomIds = bomsData.map(b => b.id);
                    const { data: componentsData, error: compError } = await supabase
                        .from('bom_components')
                        .select('id, bom_id, material_id, quantity')
                        .in('bom_id', bomIds);

                    console.log('[Quotations] Components found:', componentsData?.length, compError);

                    // Attach components to BOMs manually
                    const bomsWithComponents = bomsData.map(bom => ({
                        ...bom,
                        bom_components: (componentsData || []).filter(c => c.bom_id === bom.id)
                    }));

                    // Get all materials for stock info (use * to get all columns)
                    const { data: materialsData, error: materialsError } = await supabase
                        .from('materials')
                        .select('*');

                    if (materialsError) {
                        console.error('[Quotations] Error loading materials:', materialsError);
                    }

                    console.log('[Quotations] Materials loaded:', materialsData?.length);

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

                    for (const item of (quotation.items || [])) {
                        if (!item.productId) continue;

                        const bom = bomsWithComponents.find(b => b.product_id === item.productId);
                        if (!bom || !bom.bom_components || bom.bom_components.length === 0) continue;

                        for (const component of bom.bom_components) {
                            if (!component.material_id) continue;

                            const material = materialsMap.get(component.material_id);
                            if (!material) continue;

                            const requiredQty = (component.quantity || 0) * (item.quantity || 1);

                            if (materialRequirements.has(component.material_id)) {
                                const existing = materialRequirements.get(component.material_id);
                                existing.required_quantity += requiredQty;
                            } else {
                                materialRequirements.set(component.material_id, {
                                    material_id: component.material_id,
                                    material_name: material.name,
                                    material_code: material.code || '',
                                    unit: material.unit || 'pcs',
                                    required_quantity: requiredQty,
                                    stock_available: parseFloat(material.stock) || 0,
                                });
                            }
                        }
                    }

                    console.log('[Quotations] Material requirements calculated:', materialRequirements.size);

                    // Calculate shortage and save to database
                    if (materialRequirements.size > 0) {
                        const soMaterials = Array.from(materialRequirements.values()).map(m => ({
                            sales_order_id: salesOrder.id,
                            material_id: m.material_id,
                            material_name: m.material_name,
                            material_code: m.material_code,
                            unit: m.unit,
                            required_quantity: m.required_quantity,
                            stock_available: m.stock_available,
                            shortage: Math.max(0, m.required_quantity - m.stock_available),
                        }));

                        const { error: matError } = await supabase
                            .from('sales_order_materials')
                            .insert(soMaterials);

                        if (matError) {
                            console.warn('[Quotations] Error saving material requirements:', matError);
                        } else {
                            console.log('[Quotations] Saved', soMaterials.length, 'material requirements');
                        }
                    } else {
                        console.log('[Quotations] No material requirements to save');
                    }
                } else {
                    console.log('[Quotations] No BOMs found for products');
                }
            } else {
                console.log('[Quotations] No product IDs in quotation items');
            }

            // Create Project linked to the Sales Order
            const projectName = `${quotation.clientName || 'Client'} - ${soFolio}`;
            const itemsDescription = quotation.items?.map(item =>
                `• ${item.productName || item.description} (${item.quantity} pcs)`
            ).join('\n') || '';

            console.log('[Quotations] Creating project with data:', {
                name: projectName,
                po_number: soFolio,
            });

            const { data: project, error: projError } = await supabase
                .from('projects')
                .insert({
                    name: projectName,
                    description: `Client: ${quotation.clientName || 'N/A'}\nGenerated from quotation ${quotation.folio}\n\nItems:\n${itemsDescription}`,
                    status: 'Active',
                    po_number: soFolio,
                    work_order: `WO-${soFolio.replace('SO-', '')}`,
                    estimate_number: quotation.folio,
                    terms: 'Net 30',
                    subtotal: parseFloat(quotation.subtotal) || 0,
                    tax: parseFloat(quotation.tax) || 0,
                    total: parseFloat(quotation.total) || 0,
                })
                .select()
                .single();

            let projectCreated = false;
            let operationCreated = false;
            if (projError) {
                console.error('[Quotations] Error creating project:', projError);
                // Show error to user but don't fail the entire operation
                setToast({
                    message: `Sales Order ${soFolio} created, but project failed: ${projError.message}`,
                    type: 'warning'
                });
            } else {
                console.log('[Quotations] Project created:', project.id);
                projectCreated = true;

                // Create Operation automatically linked to the project
                const workOrderNumber = `OP-${soFolio.replace('SO-', '')}`;
                const defaultStages = {
                    roughMill: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 0, actualHours: 0, notes: '' },
                    cnc: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 0, actualHours: 0, notes: '' },
                    edgeBanding: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 0, actualHours: 0, notes: '' },
                    drilling: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 0, actualHours: 0, notes: '' },
                    sanding: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 0, actualHours: 0, notes: '' },
                    painting: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 0, actualHours: 0, notes: '' },
                    assembly: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 0, actualHours: 0, notes: '' },
                    quality: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 0, actualHours: 0, notes: '' },
                    packing: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 0, actualHours: 0, notes: '' },
                    shipping: { status: 'pending', assignedTo: [], startDate: '', endDate: '', estimatedHours: 0, actualHours: 0, notes: '' },
                };

                const { data: operation, error: opError } = await supabase
                    .from('operations')
                    .insert({
                        work_order_number: workOrderNumber,
                        project_id: project.id,
                        name: projectName,
                        status: 'Pending',
                        priority: 'Medium',
                        due_date: quotation.eta || null,
                        notes: `Auto-generated from ${quotation.folio}`,
                        progress: 0,
                        current_stage: 'roughMill',
                        assigned_divisions: [],
                        stages: defaultStages,
                    })
                    .select()
                    .single();

                if (opError) {
                    console.error('[Quotations] Error creating operation:', opError);
                } else {
                    console.log('[Quotations] Operation created:', operation.id);
                    operationCreated = true;
                }
            }

            // Update quotation status to CONVERTED
            await updateQuotationStatus(quotation.id, { status: 'CONVERTED' });

            if (projectCreated && operationCreated) {
                setToast({
                    message: `Sales Order ${soFolio}, Project and Operation created successfully!`,
                    type: 'success'
                });
            } else if (projectCreated) {
                setToast({
                    message: `Sales Order ${soFolio} and Project created (Operation failed)`,
                    type: 'warning'
                });
            }
        } catch (error) {
            console.error('[Quotations] Error converting:', error);
            setToast({ message: 'Error creating Sales Order: ' + error.message, type: 'error' });
        }
    };

    const handleDelete = async (quotation) => {
        if (!confirm(`Delete quotation ${quotation.folio}?`)) return;
        try {
            // Delete items first
            await supabase
                .from('quotation_items')
                .delete()
                .eq('quotation_id', quotation.id);

            // Delete quotation
            const { error } = await supabase
                .from('quotations')
                .delete()
                .eq('id', quotation.id);

            if (error) throw error;

            setQuotations(quotations.filter(q => q.id !== quotation.id));
            console.log('[Quotations] Deleted:', quotation.id);
            setToast({ message: 'Quotation deleted successfully!', type: 'success' });
        } catch (error) {
            console.error('[Quotations] Error deleting:', error);
            setToast({ message: 'Error deleting quotation: ' + error.message, type: 'error' });
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
                        <h1>Quotes</h1>
                        <p>Manage quotes and estimates for clients</p>
                    </div>
                </div>
                <button className="btn-primary-action" onClick={() => handleOpenModal('add')}>
                    <Icon name="add" />
                    New Quote
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
                    <div className="stat-icon cyan">
                        <Icon name="swap_horiz" />
                    </div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.converted}</span>
                        <span className="stat-label">Converted</span>
                    </div>
                </div>
            </div>

            {/* Billing Entity Filter Tabs */}
            <div className="billing-entity-tabs">
                <button
                    className={`entity-tab ${billingEntityFilter === 'ALL' ? 'active' : ''}`}
                    onClick={() => setBillingEntityFilter('ALL')}
                >
                    <Icon name="request_quote" />
                    All Quotes
                    <span className="tab-count">{quotations.length}</span>
                </button>
                <button
                    className={`entity-tab dovecreek ${billingEntityFilter === 'DOVECREEK' ? 'active' : ''}`}
                    onClick={() => setBillingEntityFilter('DOVECREEK')}
                >
                    <Icon name="business" />
                    Dovecreek
                    <span className="tab-count">{dovecreekQuotations}</span>
                </button>
                <button
                    className={`entity-tab innovative ${billingEntityFilter === 'INNOVATIVE' ? 'active' : ''}`}
                    onClick={() => setBillingEntityFilter('INNOVATIVE')}
                >
                    <Icon name="lightbulb" />
                    Innovative
                    <span className="tab-count">{innovativeQuotations}</span>
                </button>
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
                        <option value="ALL">All Statuses</option>
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
                                            <button
                                                className="btn-action pdf"
                                                onClick={() => {
                                                    const client = clients.find(c => c.id === quotation.clientId);
                                                    exportQuotationToPDF({
                                                        ...quotation,
                                                        clientName: client?.name || client?.companyName || 'Client',
                                                        clientEmail: client?.email || '',
                                                        clientPhone: client?.phone || '',
                                                        clientAddress: `${client?.address || ''} ${client?.city || ''} ${client?.state || ''}`.trim()
                                                    }, quotation.items || []);
                                                }}
                                                title="Export PDF"
                                            >
                                                <Icon name="picture_as_pdf" />
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
                                                    onClick={() => handleApprove(quotation)}
                                                    title="Record deposit"
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

            {/* Deposit Confirmation Modal */}
            {showDepositModal && depositQuotation && (
                <Modal
                    isOpen={showDepositModal}
                    onClose={() => {
                        setShowDepositModal(false);
                        setDepositQuotation(null);
                    }}
                    title="Confirm Deposit & Approve"
                    icon="payments"
                    size="small"
                >
                    <div className="deposit-confirmation-form">
                        <div className="deposit-info">
                            <p><strong>Quotation:</strong> {depositQuotation.folio}</p>
                            <p><strong>Client:</strong> {depositQuotation.clientName}</p>
                            <p><strong>Total:</strong> {formatCurrency(depositQuotation.total)}</p>
                        </div>

                        <div className="form-group">
                            <label>Deposit Amount *</label>
                            <input
                                type="number"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                placeholder="Enter deposit amount"
                            />
                            <span className="helper-text">
                                Suggested: {formatCurrency(depositQuotation.total * 0.5)} (50%)
                            </span>
                        </div>

                        <div className="form-group checkbox-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={depositConfirmed}
                                    onChange={(e) => setDepositConfirmed(e.target.checked)}
                                />
                                <span>I confirm that the deposit of {formatCurrency(depositAmount)} has been received</span>
                            </label>
                        </div>

                        <div className="modal-actions">
                            <button
                                className="btn-modal-cancel"
                                onClick={() => {
                                    setShowDepositModal(false);
                                    setDepositQuotation(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-modal-save"
                                onClick={handleConfirmDeposit}
                                disabled={!depositConfirmed || depositAmount <= 0}
                            >
                                <Icon name="check_circle" />
                                Approve Quotation
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
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
                    icon={modalMode === 'add' ? 'add_box' : modalMode === 'edit' ? 'edit' : 'visibility'}
                    size="large"
                    onSave={modalMode !== 'view' ? handleSave : undefined}
                    saveText={currentQuotation.id ? 'Update Quotation' : 'Create Quotation'}
                    saveDisabled={!currentQuotation.clientId || currentQuotation.items.length === 0}
                    isViewMode={modalMode === 'view'}
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
                                    <label>Deposit Required</label>
                                    <select
                                        value={currentQuotation.depositRequired || 50}
                                        onChange={(e) => handleInputChange('depositRequired', parseInt(e.target.value))}
                                        disabled={modalMode === 'view'}
                                    >
                                        {DEPOSIT_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Deposit Amount</label>
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
                                                value={currentItem.productId || ''}
                                                onChange={(e) => {
                                                    const productId = e.target.value;
                                                    const product = products.find(p => p.id === productId);
                                                    // Update all fields at once to avoid stale state issues
                                                    const updatedItem = {
                                                        ...currentItem,
                                                        productId: productId,
                                                        productName: product?.name || '',
                                                        unitPrice: product?.price || 0,
                                                    };
                                                    updatedItem.subtotal = calculateItemSubtotal(updatedItem);
                                                    setCurrentItem(updatedItem);
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
                                {/* IVA only applies to Innovative */}
                                {currentQuotation.billingEntity === 'INNOVATIVE' && (
                                    <div className="total-row">
                                        <span>IVA (16%):</span>
                                        <span>{formatCurrency(currentQuotation.tax)}</span>
                                    </div>
                                )}
                                <div className="total-row grand-total">
                                    <span>Total:</span>
                                    <span>{formatCurrency(currentQuotation.total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default QuotationsModule;
