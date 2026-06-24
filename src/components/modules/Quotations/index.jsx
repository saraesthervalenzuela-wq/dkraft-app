/**
 * Quotations Module (Cotizaciones / Estimates)
 * First step in MRP flow - Creates estimates that can become Sales Orders
 * Only Dovecreek projects sync to QuickBooks
 */

import { useState, useEffect, useMemo } from "react";
import { Icon, SearchBox, Modal, Toast } from "../../common";
import {
  isApiEnabled,
  clientsApi,
  productsApi,
  quotationsApi,
} from "../../../services/api";
import {
  supabase,
  clientsService,
  productsService,
} from "../../../lib/supabase";
import {
  clientsData as initialClientsData,
  productsData as initialProductsData,
} from "../../../data/initialData";
import {
  BILLING_ENTITIES,
  DEFAULT_BILLING_ENTITY,
  normalizeBillingEntity,
  getDefaultTaxRate,
} from "../../../data/billingEntities";
import { exportQuotationToPDF } from "../../../utils/pdfExport";
import "./styles.css";

// Status configuration
const STATUS_CONFIG = {
  DRAFT: { label: "Draft", color: "#6c757d", icon: "edit" },
  SENT: { label: "Sent", color: "#d35400", icon: "send" },
  APPROVED: { label: "Approved", color: "#28a745", icon: "check_circle" },
  REJECTED: { label: "Rejected", color: "#dc3545", icon: "cancel" },
  CONVERTED: { label: "Converted to SO", color: "#06b6d4", icon: "swap_horiz" },
  CANCELLED: { label: "Cancelled", color: "#6c757d", icon: "block" },
};

// Empty quotation template
const emptyQuotation = {
  id: null,
  folio: "",
  clientId: "",
  billingEntity: DEFAULT_BILLING_ENTITY,
  // Tax rate as a fraction (0.16 = 16%). Defaults to the billing entity's rate
  // (16% for Mexican entities, 0% for Dovecreek USA — editable per quote).
  taxRate: getDefaultTaxRate(DEFAULT_BILLING_ENTITY),
  status: "DRAFT",
  createdAt: new Date().toISOString(),
  approvalDate: "",
  eta: "",
  deposit: 0,
  depositPaid: false,
  subtotal: 0,
  tax: 0,
  total: 0,
  notes: "",
  items: [],
};

const emptyItem = {
  id: null,
  productId: "",
  productName: "",
  description: "",
  quantity: 1,
  unitPrice: 0,
  discount: 0,
  subtotal: 0,
};

// Dummy data for demonstration
const dummyQuotations = [
  {
    id: "demo-1",
    folio: "QUO-202601-001",
    clientId: "1",
    clientName: "Monterrey Industrial Group",
    billingEntity: "DOVECREEK",
    status: "APPROVED",
    createdAt: "2026-01-15T10:30:00",
    approvalDate: "2026-01-20T14:00:00",
    eta: "2026-02-15",
    deposit: 25000,
    depositPaid: true,
    subtotal: 85000,
    tax: 13600,
    total: 98600,
    notes: "Priority client - urgent delivery",
    items: [
      {
        id: "item-1",
        productId: "p1",
        productName: "Metal Structure Type A",
        description: "Structure fabrication",
        quantity: 5,
        unitPrice: 12000,
        discount: 0,
        subtotal: 60000,
      },
      {
        id: "item-2",
        productId: "p2",
        productName: "Specialized Welding",
        description: "MIG welding service",
        quantity: 10,
        unitPrice: 2500,
        discount: 0,
        subtotal: 25000,
      },
    ],
  },
  {
    id: "demo-2",
    folio: "QUO-202601-002",
    clientId: "2",
    clientName: "Northern Construction SA",
    billingEntity: "DOVECREEK",
    status: "SENT",
    createdAt: "2026-01-18T09:15:00",
    approvalDate: "",
    eta: "2026-02-28",
    deposit: 15000,
    depositPaid: false,
    subtotal: 45000,
    tax: 7200,
    total: 52200,
    notes: "Pending client approval",
    items: [
      {
        id: "item-3",
        productId: "p3",
        productName: "Turned Parts",
        description: "CNC precision turning",
        quantity: 100,
        unitPrice: 450,
        discount: 0,
        subtotal: 45000,
      },
    ],
  },
  {
    id: "demo-3",
    folio: "QUO-202601-003",
    clientId: "3",
    clientName: "Steel & Metals MX",
    billingEntity: "INNOVATIVE",
    status: "DRAFT",
    createdAt: "2026-01-25T16:45:00",
    approvalDate: "",
    eta: "2026-03-10",
    deposit: 8000,
    depositPaid: false,
    subtotal: 32000,
    tax: 5120,
    total: 37120,
    notes: "Draft - pending price review",
    items: [
      {
        id: "item-4",
        productId: "p4",
        productName: "Laser Cutting",
        description: "Sheet metal cutting gauge 14",
        quantity: 50,
        unitPrice: 400,
        discount: 0,
        subtotal: 20000,
      },
      {
        id: "item-5",
        productId: "p5",
        productName: "Industrial Bending",
        description: "CNC bending",
        quantity: 40,
        unitPrice: 300,
        discount: 0,
        subtotal: 12000,
      },
    ],
  },
  {
    id: "demo-4",
    folio: "QUO-202601-004",
    clientId: "4",
    clientName: "Advanced Manufacturing",
    billingEntity: "DOVECREEK",
    status: "CONVERTED",
    createdAt: "2026-01-10T11:20:00",
    approvalDate: "2026-01-12T09:00:00",
    eta: "2026-01-30",
    deposit: 50000,
    depositPaid: true,
    subtotal: 150000,
    tax: 24000,
    total: 174000,
    notes: "Converted to sales order SO-202601-004",
    items: [
      {
        id: "item-6",
        productId: "p6",
        productName: "Complete CNC Machining",
        description: "Component manufacturing",
        quantity: 25,
        unitPrice: 6000,
        discount: 0,
        subtotal: 150000,
      },
    ],
  },
  {
    id: "demo-5",
    folio: "QUO-202601-005",
    clientId: "5",
    clientName: "Sanchez Industries",
    billingEntity: "INNOVATIVE",
    status: "SENT",
    createdAt: "2026-01-22T14:30:00",
    approvalDate: "",
    eta: "2026-02-20",
    deposit: 12000,
    depositPaid: false,
    subtotal: 68000,
    tax: 10880,
    total: 78880,
    notes: "Awaiting purchasing department confirmation",
    items: [
      {
        id: "item-7",
        productId: "p7",
        productName: "Electromechanical Assembly",
        description: "System assembly",
        quantity: 8,
        unitPrice: 5500,
        discount: 0,
        subtotal: 44000,
      },
      {
        id: "item-8",
        productId: "p8",
        productName: "Industrial Wiring",
        description: "Electrical installation",
        quantity: 12,
        unitPrice: 2000,
        discount: 0,
        subtotal: 24000,
      },
    ],
  },
  {
    id: "demo-6",
    folio: "QUO-202601-006",
    clientId: "6",
    clientName: "Azteca Corporation",
    billingEntity: "DOVECREEK",
    status: "APPROVED",
    createdAt: "2026-01-28T08:00:00",
    approvalDate: "2026-01-30T16:00:00",
    eta: "2026-02-25",
    deposit: 18000,
    depositPaid: false,
    subtotal: 72000,
    tax: 11520,
    total: 83520,
    notes: "Approved - pending deposit payment",
    items: [
      {
        id: "item-9",
        productId: "p9",
        productName: "Storage Tank",
        description: "Stainless steel tank 500L",
        quantity: 3,
        unitPrice: 18000,
        discount: 0,
        subtotal: 54000,
      },
      {
        id: "item-10",
        productId: "p10",
        productName: "Industrial Valves",
        description: "Control valves",
        quantity: 6,
        unitPrice: 3000,
        discount: 0,
        subtotal: 18000,
      },
    ],
  },
  {
    id: "demo-7",
    folio: "QUO-202601-007",
    clientId: "7",
    clientName: "Precision Machining",
    billingEntity: "INNOVATIVE",
    status: "DRAFT",
    createdAt: "2026-01-30T13:15:00",
    approvalDate: "",
    eta: "2026-03-15",
    deposit: 5000,
    depositPaid: false,
    subtotal: 28500,
    tax: 4560,
    total: 33060,
    notes: "In quoting process",
    items: [
      {
        id: "item-11",
        productId: "p11",
        productName: "Machinery Spare Parts",
        description: "Replacement parts",
        quantity: 15,
        unitPrice: 1900,
        discount: 0,
        subtotal: 28500,
      },
    ],
  },
  {
    id: "demo-8",
    folio: "QUO-202601-008",
    clientId: "8",
    clientName: "Industrial Hardware Plus",
    billingEntity: "DOVECREEK",
    status: "CONVERTED",
    createdAt: "2026-01-05T10:00:00",
    approvalDate: "2026-01-08T11:30:00",
    eta: "2026-01-25",
    deposit: 35000,
    depositPaid: true,
    subtotal: 95000,
    tax: 15200,
    total: 110200,
    notes: "Delivered - order completed",
    items: [
      {
        id: "item-12",
        productId: "p12",
        productName: "Industrial Tooling",
        description: "Special tools kit",
        quantity: 20,
        unitPrice: 4750,
        discount: 0,
        subtotal: 95000,
      },
    ],
  },
];

// Normalize client data to have consistent id and name fields
const normalizeClient = (client) => ({
  id: client.id || client.idClient || client._id || String(Math.random()),
  name: client.name,
  companyName: client.companyName || client.company,
  email: client.email,
  phone: client.phone,
  status: client.status,
  // Billing entity: read snake_case (Supabase) or camelCase (cache) and
  // normalize. Unknown/null collapses to DEFAULT_BILLING_ENTITY so the
  // filter in the modal never blanks out a client.
  billingEntity: normalizeBillingEntity(
    client.billing_entity || client.billingEntity,
  ),
});

// Normalize product data
const normalizeProduct = (product) => ({
  id: product.id || product.idProduct || product._id || String(Math.random()),
  name: product.name,
  description: product.description,
  price: product.price || product.base_price || product.unitPrice || 0,
  category: product.category || product.categoryName,
});

// Normalize a Supabase quotation row (with joined clients + quotation_items)
// to the camelCase shape the UI expects.
const normalizeQuotationRow = (q) => ({
  id: q.id,
  folio: q.folio || q.number || "",
  clientId: q.client_id || "",
  clientName: q.clients?.name || q.clients?.company_name || "",
  billingEntity: normalizeBillingEntity(q.billing_entity),
  status: q.status || "DRAFT",
  createdAt: q.created_at,
  approvalDate: q.approval_date || "",
  eta: q.eta || "",
  deposit: Number(q.deposit) || 0,
  depositPaid: !!q.deposit_paid,
  subtotal: Number(q.subtotal) || 0,
  tax: Number(q.tax) || 0,
  total: Number(q.total) || 0,
  // Reconstruct the tax rate from the stored amounts (no dedicated column);
  // fall back to the entity default when there's no subtotal to divide by.
  taxRate:
    Number(q.subtotal) > 0
      ? Number(q.tax) / Number(q.subtotal)
      : getDefaultTaxRate(q.billing_entity),
  notes: q.notes || "",
  items: (q.quotation_items || []).map((it) => ({
    id: it.id,
    productId: it.product_id || "",
    // No product_name column — derive from the joined products row.
    productName: it.products?.name || it.product_name || "",
    description: it.description || "",
    quantity: Number(it.quantity) || 0,
    unitPrice: Number(it.unit_price) || 0,
    discount: 0,
    subtotal: Number(it.total) || 0,
  })),
});

const QuotationsModule = () => {
  // Data state
  const [quotations, setQuotations] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("table");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // add, edit, view
  const [currentQuotation, setCurrentQuotation] = useState(emptyQuotation);
  const [currentItem, setCurrentItem] = useState(emptyItem);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  // Inline edit of the tax rate right on the totals "Tax (x%)" line.
  const [editingTax, setEditingTax] = useState(false);
  // Pretty notifications (Toast) + delete confirmation, replacing the native
  // browser alert()/confirm() dialogs.
  const [toast, setToast] = useState(null);
  const [quotationToDelete, setQuotationToDelete] = useState(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load quotations from API
      let quotationsData = [];
      if (isApiEnabled()) {
        try {
          quotationsData = await quotationsApi.getAll();
          console.log(
            "[Quotations] Loaded from API:",
            quotationsData?.length || 0,
          );
        } catch (err) {
          console.warn("[Quotations] API error:", err.message);
          // Fallback to demo data if API fails
          quotationsData = dummyQuotations;
        }
      } else {
        // Load real quotations from Supabase (with client + items joined)
        try {
          const { data: qData, error: qErr } = await supabase
            .from("quotations")
            .select(
              "*, clients(name, company_name), quotation_items(*, products(name))",
            )
            .order("created_at", { ascending: false });
          if (qErr) throw qErr;
          quotationsData = (qData || []).map(normalizeQuotationRow);
          console.log(
            "[Quotations] Loaded from Supabase:",
            quotationsData.length,
          );
        } catch (err) {
          console.warn("[Quotations] Supabase error:", err.message);
          quotationsData = dummyQuotations;
        }
      }
      setQuotations(quotationsData);

      let clientsData = [];
      let productsData = [];

      // Try to load clients and products from API
      if (isApiEnabled()) {
        try {
          [clientsData, productsData] = await Promise.all([
            clientsApi.getAll(),
            productsApi.getAll(),
          ]);
          console.log(
            "[Quotations] Loaded clients from API:",
            clientsData?.length || 0,
          );
          console.log(
            "[Quotations] Loaded products from API:",
            productsData?.length || 0,
          );

          // Save to localStorage for offline use
          if (clientsData?.length > 0) {
            localStorage.setItem(
              "dkraft_clients_cache",
              JSON.stringify(clientsData),
            );
          }
          if (productsData?.length > 0) {
            localStorage.setItem(
              "dkraft_products",
              JSON.stringify(productsData),
            );
          }
        } catch (apiError) {
          console.warn(
            "[Quotations] API error, trying localStorage cache:",
            apiError.message,
          );
        }
      } else {
        // Load clients and products from Supabase
        try {
          [clientsData, productsData] = await Promise.all([
            clientsService.getAll(),
            productsService.getAll(),
          ]);
        } catch (sbError) {
          console.warn(
            "[Quotations] Supabase clients/products error:",
            sbError.message,
          );
        }
      }

      // Fallback to localStorage cache if API didn't return data
      if (!clientsData || clientsData.length === 0) {
        const cachedClients = localStorage.getItem("dkraft_clients_cache");
        if (cachedClients) {
          clientsData = JSON.parse(cachedClients);
          console.log(
            "[Quotations] Loaded clients from cache:",
            clientsData.length,
          );
        }
      }

      if (!productsData || productsData.length === 0) {
        const cachedProducts = localStorage.getItem("dkraft_products");
        if (cachedProducts) {
          productsData = JSON.parse(cachedProducts);
          console.log(
            "[Quotations] Loaded products from cache:",
            productsData.length,
          );
        }
      }

      // Final fallback to initial data if nothing else is available
      if (!clientsData || clientsData.length === 0) {
        console.log("[Quotations] Using initial clients data as fallback");
        clientsData = initialClientsData;
      }

      if (!productsData || productsData.length === 0) {
        console.log("[Quotations] Using initial products data as fallback");
        productsData = initialProductsData;
      }

      // Normalize data to ensure consistent field names
      const normalizedClients = (clientsData || []).map(normalizeClient);
      const normalizedProducts = (productsData || []).map(normalizeProduct);

      setClients(normalizedClients);
      setProducts(normalizedProducts);
    } catch (error) {
      console.error("[Quotations] Error loading data:", error);
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
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `COT-${year}${month}-${random}`;
  };

  // Filter quotations
  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch =
      q.folio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filter clients shown in the modal by the currently selected billing
  // entity so a Dovecreek quotation can only pick Dovecreek clients, etc.
  const filteredClients = useMemo(() => {
    const entity = normalizeBillingEntity(currentQuotation.billingEntity);
    return clients.filter((c) => c.billingEntity === entity);
  }, [clients, currentQuotation.billingEntity]);

  // Calculate item subtotal
  const calculateItemSubtotal = (item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const discount = parseFloat(item.discount) || 0;
    return qty * price - discount;
  };

  // Calculate quotation totals. taxRate defaults to the quote's current rate so
  // existing callers keep working; pass an explicit rate when it's changing.
  const calculateTotals = (
    items,
    taxRate = currentQuotation.taxRate ?? 0.16,
  ) => {
    const subtotal = items.reduce(
      (sum, item) => sum + calculateItemSubtotal(item),
      0,
    );
    const rate = Number(taxRate) || 0;
    const tax = subtotal * rate;
    const total = subtotal + tax;
    return { subtotal, tax, total };
  };

  // Modal handlers
  const handleOpenModal = (mode, quotation = null) => {
    setModalMode(mode);
    if (quotation) {
      // Honor the persisted billing entity (DB column can be snake_case)
      // and normalize so the dropdown always lands on a valid option.
      setCurrentQuotation({
        ...quotation,
        billingEntity: normalizeBillingEntity(
          quotation.billingEntity || quotation.billing_entity,
        ),
      });
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
    if (field === "clientId") {
      // When client changes, also update clientName
      const client = clients.find((c) => c.id === value);
      setCurrentQuotation((prev) => ({
        ...prev,
        clientId: value,
        clientName: client ? client.companyName || client.name : "",
      }));
    } else if (field === "billingEntity") {
      // When billing entity changes, if the currently selected client does
      // NOT belong to the new entity, clear client-derived fields so the
      // user is forced to pick a valid one from the filtered list. Also reset
      // the tax rate to the new entity's default (16% MX / 0% Dovecreek USA)
      // and recompute totals so the IVA line and total update immediately.
      const normalized = normalizeBillingEntity(value);
      const newRate = getDefaultTaxRate(normalized);
      setCurrentQuotation((prev) => {
        const selectedClient = clients.find((c) => c.id === prev.clientId);
        const stillValid =
          selectedClient && selectedClient.billingEntity === normalized;
        const totals = calculateTotals(prev.items, newRate);
        return {
          ...prev,
          billingEntity: normalized,
          taxRate: newRate,
          ...totals,
          clientId: stillValid ? prev.clientId : "",
          clientName: stillValid ? prev.clientName : "",
        };
      });
    } else {
      setCurrentQuotation((prev) => ({ ...prev, [field]: value }));
    }
  };

  // Tax rate input is shown as a percentage (e.g. 16) but stored as a fraction
  // (0.16). Recompute totals whenever the rate changes.
  const handleTaxRateChange = (percentValue) => {
    const newRate = (parseFloat(percentValue) || 0) / 100;
    setCurrentQuotation((prev) => {
      const totals = calculateTotals(prev.items, newRate);
      return { ...prev, taxRate: newRate, ...totals };
    });
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
      setToast({
        message: "Selecciona un producto o escribe una descripción",
        type: "error",
      });
      return;
    }

    const product = products.find((p) => p.id === currentItem.productId);
    const newItem = {
      ...currentItem,
      id: `temp-${Date.now()}`,
      productName: product?.name || currentItem.description || "Custom item",
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
    setCurrentQuotation((prev) => ({
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
    setCurrentQuotation((prev) => ({
      ...prev,
      items: updatedItems,
      ...totals,
    }));
  };

  // A quotation id is a real Supabase row only when it isn't one of the
  // in-memory placeholders (demo seed data or optimistic local ids).
  const isPersistedId = (id) =>
    id && !String(id).startsWith("demo-") && !String(id).startsWith("local-");

  // Map the camelCase quotation to the snake_case columns of the `quotations`
  // table (mirrors normalizeQuotationRow, which does the reverse on read).
  const toQuotationRow = (q) => ({
    folio: q.folio,
    client_id: q.clientId || null,
    billing_entity: q.billingEntity,
    status: q.status,
    approval_date: q.approvalDate || null,
    eta: q.eta || null,
    deposit: Number(q.deposit) || 0,
    deposit_paid: !!q.depositPaid,
    subtotal: Number(q.subtotal) || 0,
    tax: Number(q.tax) || 0,
    total: Number(q.total) || 0,
    notes: q.notes || "",
  });

  // Map a camelCase item to the snake_case `quotation_items` columns. Note the
  // table has NO product_name column — the product name is derived from
  // product_id (joined to products) on read, so we only persist the id here.
  const toItemRow = (quotationId, it) => ({
    quotation_id: quotationId,
    product_id: it.productId || null,
    description: it.description || "",
    quantity: Number(it.quantity) || 0,
    unit_price: Number(it.unitPrice) || 0,
    total: Number(it.subtotal) || 0,
  });

  // Persist a quotation (header + items) to Supabase. Inserts a new row or
  // updates the existing one, then replaces its quotation_items. This is the
  // path that was missing — saves used to only touch local state when the
  // phantom API was disabled, so nothing reached the database.
  const persistQuotationToSupabase = async (data) => {
    const isNew = !isPersistedId(data.id);
    let quotationId = isNew ? null : data.id;

    if (isNew) {
      const { data: inserted, error } = await supabase
        .from("quotations")
        .insert(toQuotationRow(data))
        .select()
        .single();
      if (error) throw error;
      quotationId = inserted.id;
    } else {
      const { error } = await supabase
        .from("quotations")
        .update({
          ...toQuotationRow(data),
          updated_at: new Date().toISOString(),
        })
        .eq("id", quotationId);
      if (error) throw error;
    }

    try {
      // Replace the line items (delete + insert) so edits stay in sync.
      const { error: delErr } = await supabase
        .from("quotation_items")
        .delete()
        .eq("quotation_id", quotationId);
      if (delErr) throw delErr;

      if (data.items?.length) {
        const rows = data.items.map((it) => toItemRow(quotationId, it));
        const { error: insErr } = await supabase
          .from("quotation_items")
          .insert(rows);
        if (insErr) throw insErr;
      }
    } catch (itemErr) {
      // Don't leave a brand-new header orphaned (header with zero items) when
      // its items fail to save — roll it back before surfacing the error.
      if (isNew) {
        await supabase.from("quotations").delete().eq("id", quotationId);
      }
      throw itemErr;
    }

    return { ...data, id: quotationId };
  };

  // Save quotation via API (or Supabase when the API is disabled)
  const handleSave = async () => {
    try {
      // Auto-add current item if there's pending data
      let itemsToSave = [...currentQuotation.items];
      if (
        currentItem.productId ||
        currentItem.description ||
        currentItem.quantity > 1 ||
        currentItem.unitPrice > 0
      ) {
        const product = products.find((p) => p.id === currentItem.productId);
        const pendingItem = {
          ...currentItem,
          id: `temp-${Date.now()}`,
          productName:
            product?.name || currentItem.description || "Custom item",
          subtotal: calculateItemSubtotal(currentItem),
        };
        itemsToSave = [...itemsToSave, pendingItem];
      }

      if (itemsToSave.length === 0) {
        setToast({
          message: "Agrega al menos un producto a la cotización",
          type: "error",
        });
        return;
      }

      if (!currentQuotation.clientId && !currentQuotation.clientName) {
        setToast({ message: "Selecciona un cliente", type: "error" });
        return;
      }

      // Recalculate totals with all items
      const totals = calculateTotals(itemsToSave);

      const client = clients.find((c) => c.id === currentQuotation.clientId);
      const dataToSave = {
        ...currentQuotation,
        items: itemsToSave,
        ...totals,
        clientName:
          client?.companyName ||
          client?.name ||
          currentQuotation.clientName ||
          "Manual Client",
        skipQBSync: currentQuotation.billingEntity !== "DOVECREEK",
        updatedAt: new Date().toISOString(),
      };

      // Generate folio if new quotation
      if (!dataToSave.folio) {
        dataToSave.folio = generateFolio();
      }

      console.log("[Quotations] Saving via API:", dataToSave);

      if (isApiEnabled()) {
        if (currentQuotation.id && !currentQuotation.id.startsWith("demo-")) {
          // Update existing via API
          const updated = await quotationsApi.update(
            currentQuotation.id,
            dataToSave,
          );
          setQuotations(
            quotations.map((q) => (q.id === currentQuotation.id ? updated : q)),
          );
        } else {
          // Create new via API
          const created = await quotationsApi.create(dataToSave);
          setQuotations([...quotations, created]);
        }
      } else {
        // API disabled → persist directly to Supabase (header + items).
        const saved = await persistQuotationToSupabase(dataToSave);
        const existsInList = quotations.some(
          (q) => q.id === currentQuotation.id,
        );
        if (isPersistedId(currentQuotation.id) && existsInList) {
          setQuotations(
            quotations.map((q) => (q.id === currentQuotation.id ? saved : q)),
          );
        } else {
          setQuotations([...quotations, saved]);
        }
      }

      handleCloseModal();
      setToast({
        message: currentQuotation.id
          ? "Cotización actualizada"
          : "Cotización creada",
        type: "success",
      });
    } catch (error) {
      console.error("[Quotations] Error saving:", error);
      setToast({
        message: "Error al guardar la cotización: " + error.message,
        type: "error",
      });
    }
  };

  // Update quotation status via API
  const updateQuotationStatus = async (quotationId, updates) => {
    const updatedData = { ...updates, updatedAt: new Date().toISOString() };

    if (isApiEnabled() && !quotationId.startsWith("demo-")) {
      try {
        const quotation = quotations.find((q) => q.id === quotationId);
        const updated = await quotationsApi.update(quotationId, {
          ...quotation,
          ...updatedData,
        });
        setQuotations(
          quotations.map((q) => (q.id === quotationId ? updated : q)),
        );
      } catch (error) {
        console.error("[Quotations] API update failed:", error);
        // Fallback to local update
        setQuotations(
          quotations.map((q) =>
            q.id === quotationId ? { ...q, ...updatedData } : q,
          ),
        );
      }
    } else if (isPersistedId(quotationId)) {
      // API disabled but a real row → persist the status change to Supabase.
      try {
        const row = {};
        if (updates.status !== undefined) row.status = updates.status;
        if (updates.approvalDate !== undefined)
          row.approval_date = updates.approvalDate || null;
        if (updates.depositPaid !== undefined)
          row.deposit_paid = !!updates.depositPaid;
        const { error } = await supabase
          .from("quotations")
          .update({ ...row, updated_at: new Date().toISOString() })
          .eq("id", quotationId);
        if (error) throw error;
        setQuotations(
          quotations.map((q) =>
            q.id === quotationId ? { ...q, ...updatedData } : q,
          ),
        );
      } catch (error) {
        console.error("[Quotations] Supabase status update failed:", error);
        setToast({
          message: "Error al actualizar la cotización: " + error.message,
          type: "error",
        });
      }
    } else {
      // In-memory demo/local row — update locally only.
      setQuotations(
        quotations.map((q) =>
          q.id === quotationId ? { ...q, ...updatedData } : q,
        ),
      );
    }
  };

  // Status actions
  const handleSendToClient = async (quotation) => {
    try {
      updateQuotationStatus(quotation.id, { status: "SENT" });
    } catch (error) {
      console.error("[Quotations] Error sending:", error);
      setToast({ message: "Error al enviar la cotización", type: "error" });
    }
  };

  const handleApprove = async (quotation) => {
    try {
      updateQuotationStatus(quotation.id, {
        status: "APPROVED",
        approvalDate: new Date().toISOString(),
      });
    } catch (error) {
      console.error("[Quotations] Error approving:", error);
      setToast({ message: "Error al aprobar la cotización", type: "error" });
    }
  };

  const handleConvertToSalesOrder = async (quotation) => {
    try {
      if (isApiEnabled() && !quotation.id.startsWith("demo-")) {
        // Use API to create sales order
        const salesOrder = await quotationsApi.createSalesOrder(quotation.id);
        // Update local state
        await updateQuotationStatus(quotation.id, { status: "CONVERTED" });
        setToast({
          message: `Convertida a Sales Order: ${salesOrder.folio}`,
          type: "success",
        });
      } else {
        // Demo mode - just update status locally
        await updateQuotationStatus(quotation.id, { status: "CONVERTED" });
        const demoFolio = `SO-${quotation.folio.replace("COT-", "")}`;
        setToast({
          message: `Convertida a Sales Order: ${demoFolio}`,
          type: "success",
        });
      }
    } catch (error) {
      console.error("[Quotations] Error converting:", error);
      setToast({
        message: "Error al convertir la cotización: " + error.message,
        type: "error",
      });
    }
  };

  // Open the pretty confirmation modal instead of the native confirm().
  const handleDelete = (quotation) => {
    setQuotationToDelete(quotation);
  };

  const confirmDeleteQuotation = async () => {
    const quotation = quotationToDelete;
    if (!quotation) return;
    try {
      if (isApiEnabled() && !quotation.id.startsWith("demo-")) {
        await quotationsApi.delete(quotation.id);
      } else if (isPersistedId(quotation.id)) {
        // API disabled → delete from Supabase. Remove the line items first in
        // case there's no ON DELETE CASCADE on the FK.
        await supabase
          .from("quotation_items")
          .delete()
          .eq("quotation_id", quotation.id);
        const { error } = await supabase
          .from("quotations")
          .delete()
          .eq("id", quotation.id);
        if (error) throw error;
      }
      setQuotations(quotations.filter((q) => q.id !== quotation.id));
      setToast({ message: "Cotización eliminada", type: "success" });
    } catch (error) {
      console.error("[Quotations] Error deleting:", error);
      setToast({
        message: "Error al eliminar la cotización: " + error.message,
        type: "error",
      });
    } finally {
      setQuotationToDelete(null);
    }
  };

  // Format helpers
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount || 0);
  };

  // Stats
  const stats = {
    total: quotations.length,
    draft: quotations.filter((q) => q.status === "DRAFT").length,
    sent: quotations.filter((q) => q.status === "SENT").length,
    approved: quotations.filter((q) => q.status === "APPROVED").length,
    converted: quotations.filter((q) => q.status === "CONVERTED").length,
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
        <button
          className="btn-primary-action"
          onClick={() => handleOpenModal("add")}
        >
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
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === "table" ? "active" : ""}`}
              onClick={() => setViewMode("table")}
            >
              <Icon name="table_rows" />
            </button>
            <button
              className={`view-btn ${viewMode === "cards" ? "active" : ""}`}
              onClick={() => setViewMode("cards")}
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
      ) : viewMode === "table" ? (
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
                const entity = BILLING_ENTITIES.find(
                  (e) => e.id === quotation.billingEntity,
                );
                const statusConfig =
                  STATUS_CONFIG[quotation.status] || STATUS_CONFIG.DRAFT;
                return (
                  <tr key={quotation.id}>
                    <td className="folio-cell">
                      <strong>{quotation.folio}</strong>
                      {entity?.syncsToQB && (
                        <span
                          className="qb-badge"
                          title="Sincroniza con QuickBooks"
                        >
                          QB
                        </span>
                      )}
                    </td>
                    <td>{quotation.clientName || "-"}</td>
                    <td>
                      <span
                        className={`entity-badge ${quotation.billingEntity?.toLowerCase()}`}
                      >
                        {entity?.name || quotation.billingEntity}
                      </span>
                    </td>
                    <td>{formatDate(quotation.createdAt)}</td>
                    <td>{formatDate(quotation.eta)}</td>
                    <td>{quotation.items?.length || 0}</td>
                    <td className="amount-cell">
                      {formatCurrency(quotation.total)}
                    </td>
                    <td>
                      <span
                        className={`deposit-badge ${quotation.depositPaid ? "paid" : "pending"}`}
                      >
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
                        onClick={() => handleOpenModal("view", quotation)}
                        title="View"
                      >
                        <Icon name="visibility" />
                      </button>
                      <button
                        className="btn-action pdf"
                        onClick={() => {
                          const client = clients.find(
                            (c) => c.id === quotation.clientId,
                          );
                          exportQuotationToPDF(
                            {
                              ...quotation,
                              clientName:
                                client?.name || client?.companyName || "Client",
                              clientEmail: client?.email || "",
                              clientPhone: client?.phone || "",
                              clientAddress:
                                `${client?.address || ""} ${client?.city || ""} ${client?.state || ""}`.trim(),
                            },
                            quotation.items || [],
                          );
                        }}
                        title="Export PDF"
                      >
                        <Icon name="picture_as_pdf" />
                      </button>
                      {quotation.status === "DRAFT" && (
                        <>
                          <button
                            className="btn-action"
                            onClick={() => handleOpenModal("edit", quotation)}
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
                      {quotation.status === "SENT" && (
                        <button
                          className="btn-action approve"
                          onClick={() => handleApprove(quotation)}
                          title="Approve"
                        >
                          <Icon name="check_circle" />
                        </button>
                      )}
                      {quotation.status === "APPROVED" &&
                        !quotation.depositPaid && (
                          <button
                            className="btn-action"
                            onClick={() => handleOpenModal("edit", quotation)}
                            title="Record deposit"
                          >
                            <Icon name="payments" />
                          </button>
                        )}
                      {quotation.status === "APPROVED" &&
                        quotation.depositPaid && (
                          <button
                            className="btn-action convert"
                            onClick={() => handleConvertToSalesOrder(quotation)}
                            title="Convert to Sales Order"
                          >
                            <Icon name="swap_horiz" />
                          </button>
                        )}
                      {["DRAFT", "REJECTED"].includes(quotation.status) && (
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
            const entity = BILLING_ENTITIES.find(
              (e) => e.id === quotation.billingEntity,
            );
            const statusConfig =
              STATUS_CONFIG[quotation.status] || STATUS_CONFIG.DRAFT;
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
                    <span>{quotation.clientName || "No client"}</span>
                  </div>
                  <div className="card-row">
                    <Icon name="domain" />
                    <span
                      className={`entity-badge ${quotation.billingEntity?.toLowerCase()}`}
                    >
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
                    <span className="amount">
                      {formatCurrency(quotation.total)}
                    </span>
                  </div>
                </div>
                <div className="card-actions">
                  <button onClick={() => handleOpenModal("view", quotation)}>
                    <Icon name="visibility" /> View
                  </button>
                  {quotation.status === "DRAFT" && (
                    <button onClick={() => handleOpenModal("edit", quotation)}>
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
            modalMode === "add"
              ? "New Quotation"
              : modalMode === "edit"
                ? "Edit Quotation"
                : `Quotation ${currentQuotation.folio}`
          }
          icon={
            modalMode === "add"
              ? "add_box"
              : modalMode === "edit"
                ? "edit"
                : "visibility"
          }
          size="large"
          onSave={modalMode !== "view" ? handleSave : undefined}
          saveText={
            currentQuotation.id ? "Update Quotation" : "Create Quotation"
          }
          saveDisabled={
            !currentQuotation.clientId || currentQuotation.items.length === 0
          }
          isViewMode={modalMode === "view"}
        >
          <div
            className="quotation-form"
            style={{
              maxHeight: "70vh",
              overflowY: "auto",
              paddingRight: "8px",
            }}
          >
            {/* General Info Section */}
            <div className="form-section">
              <h3>
                <Icon name="info" /> General Information
              </h3>
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
                    onChange={(e) =>
                      handleInputChange("status", e.target.value)
                    }
                    disabled={modalMode === "view"}
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Client *</label>
                  <select
                    value={currentQuotation.clientId}
                    onChange={(e) =>
                      handleInputChange("clientId", e.target.value)
                    }
                    disabled={modalMode === "view"}
                    required
                  >
                    <option value="">
                      {filteredClients.length === 0
                        ? "No clients for this billing entity"
                        : "Select client"}
                    </option>
                    {filteredClients.map((client) => (
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
                    onChange={(e) =>
                      handleInputChange("billingEntity", e.target.value)
                    }
                    disabled={modalMode === "view"}
                  >
                    {BILLING_ENTITIES.map((entity) => (
                      <option key={entity.id} value={entity.id}>
                        {entity.name} {entity.syncsToQB ? "(QB)" : ""}
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
                    value={currentQuotation.approvalDate?.split("T")[0] || ""}
                    onChange={(e) =>
                      handleInputChange("approvalDate", e.target.value)
                    }
                    disabled={modalMode === "view"}
                  />
                </div>
                <div className="form-group">
                  <label>ETA (Estimated Delivery Date)</label>
                  <input
                    type="date"
                    value={currentQuotation.eta?.split("T")[0] || ""}
                    onChange={(e) => handleInputChange("eta", e.target.value)}
                    disabled={modalMode === "view"}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Deposit</label>
                  <input
                    type="number"
                    value={currentQuotation.deposit}
                    onChange={(e) =>
                      handleInputChange(
                        "deposit",
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    disabled={modalMode === "view"}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label>Deposit Paid</label>
                  <select
                    value={currentQuotation.depositPaid ? "true" : "false"}
                    onChange={(e) =>
                      handleInputChange(
                        "depositPaid",
                        e.target.value === "true",
                      )
                    }
                    disabled={modalMode === "view"}
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
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  disabled={modalMode === "view"}
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="form-section">
              <h3>
                <Icon name="list" /> Quotation Items
              </h3>

              {modalMode !== "view" && (
                <div className="item-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Product</label>
                      <select
                        value={currentItem.productId}
                        onChange={(e) => {
                          // Single state update: setting productId + productName +
                          // unitPrice in three separate calls all read the same
                          // stale `currentItem`, so the later calls clobbered
                          // productId and the chosen product never stuck (and the
                          // PDF then fell back to the typed Description). Batch it.
                          const productId = e.target.value;
                          const product = products.find(
                            (p) => p.id === productId,
                          );
                          setCurrentItem((prev) => {
                            const next = {
                              ...prev,
                              productId,
                              ...(product
                                ? {
                                    productName: product.name,
                                    unitPrice: product.price || 0,
                                  }
                                : {}),
                            };
                            next.subtotal = calculateItemSubtotal(next);
                            return next;
                          });
                        }}
                      >
                        <option value="">Select product</option>
                        {products.map((product) => (
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
                        onChange={(e) =>
                          handleItemInputChange("description", e.target.value)
                        }
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
                        onChange={(e) =>
                          handleItemInputChange(
                            "quantity",
                            parseFloat(e.target.value) || 1,
                          )
                        }
                        min="1"
                        step="1"
                      />
                    </div>
                    <div className="form-group">
                      <label>Unit Price</label>
                      <input
                        type="number"
                        value={currentItem.unitPrice}
                        onChange={(e) =>
                          handleItemInputChange(
                            "unitPrice",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="form-group">
                      <label>Discount</label>
                      <input
                        type="number"
                        value={currentItem.discount}
                        onChange={(e) =>
                          handleItemInputChange(
                            "discount",
                            parseFloat(e.target.value) || 0,
                          )
                        }
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
                    disabled={
                      !currentItem.productId && !currentItem.description
                    }
                    title={
                      !currentItem.productId && !currentItem.description
                        ? "Selecciona un producto o escribe una descripción"
                        : undefined
                    }
                  >
                    <Icon name={editingItemIndex !== null ? "check" : "add"} />
                    {editingItemIndex !== null ? "Update Item" : "Add Item"}
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
                      {modalMode !== "view" && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {currentQuotation.items.map((item, index) => (
                      <tr key={item.id || index}>
                        <td>{item.productName || "-"}</td>
                        <td>{item.description || "-"}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.unitPrice)}</td>
                        <td>{formatCurrency(item.discount)}</td>
                        <td>{formatCurrency(item.subtotal)}</td>
                        {modalMode !== "view" && (
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
                  <span className="tax-line">
                    Tax (
                    {editingTax && modalMode !== "view" ? (
                      <input
                        type="number"
                        className="tax-inline-input"
                        value={
                          Math.round((currentQuotation.taxRate ?? 0) * 10000) /
                          100
                        }
                        onChange={(e) => handleTaxRateChange(e.target.value)}
                        onBlur={() => setEditingTax(false)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && setEditingTax(false)
                        }
                        autoFocus
                        min="0"
                        step="0.01"
                      />
                    ) : (
                      Math.round((currentQuotation.taxRate ?? 0) * 10000) / 100
                    )}
                    %)
                    {modalMode !== "view" && !editingTax && (
                      <button
                        type="button"
                        className="tax-edit-btn"
                        onClick={() => setEditingTax(true)}
                        title="Editar impuesto"
                      >
                        <Icon name="edit" />
                      </button>
                    )}
                    :
                  </span>
                  <span>{formatCurrency(currentQuotation.tax)}</span>
                </div>
                <div className="total-row grand-total">
                  <span>Total:</span>
                  <span>{formatCurrency(currentQuotation.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirmation — replaces the native confirm() */}
      <Modal
        isOpen={!!quotationToDelete}
        title="Eliminar cotización"
        onClose={() => setQuotationToDelete(null)}
        icon="warning"
        size="small"
        variant="danger"
        onSave={confirmDeleteQuotation}
        saveText="Eliminar"
        confirmOnClose={false}
      >
        <div className="delete-confirm">
          <p>
            ¿Seguro que quieres eliminar la cotización{" "}
            <strong>{quotationToDelete?.folio}</strong>?
          </p>
          <p className="text-muted">Esta acción no se puede deshacer.</p>
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

export default QuotationsModule;
