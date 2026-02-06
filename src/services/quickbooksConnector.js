/**
 * QuickBooks Web Connector (QBWC) API Service
 * Connects to the QBWC intermediary server for syncing with QuickBooks Desktop
 *
 * Base URL should be configured in .env as VITE_QBWC_URL
 * Example: VITE_QBWC_URL=http://localhost:3000/quickbooks
 */

const QBWC_BASE_URL = import.meta.env.VITE_QBWC_URL;

/**
 * Generic request handler for QBWC API
 */
const qbRequest = async (endpoint, options = {}) => {
    const url = `${QBWC_BASE_URL}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    console.log(`[QBWC] ${options.method || 'GET'} ${url}`);

    try {
        const response = await fetch(url, config);

        console.log('[QBWC] Response:', response);

        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return { success: true };
        }

        const result = await response.json();
        console.log('[QBWC] Response:', result);

        if (!response.ok) {
          throw new Error(result.error || result.message || `HTTP ${response.status}`);
        }

        return result;
    } catch (error) {
        console.error('[QBWC] Error:', error.message);
        throw error;
    }
};

// ============================================
// ITEMS (Products/Materials) API
// ============================================
export const qbItemsApi = {
    /**
     * Add a new item (Service Item / Non-Inventory Item) to QuickBooks
     * @param {Object} item - Item data
     * @param {string} item.name - Item name (required)
     * @param {number} item.price - Item price
     * @param {string} item.description - Item description
     * @param {string} item.accountFullName - Account name (Materials for Production, Supplies for Production, etc.)
     * @param {string} item.subItem - Parent item - nombre de la categoria sin el account name
     * @param {number} item.materialId - Internal material ID reference
     * @param {number} item.productId - Internal product ID reference
     */
    add: (item) => qbRequest('/add-item', {
        method: 'POST',
        body: JSON.stringify(item),
    }),

    /**
     * Modify an existing item in QuickBooks
     * @param {Object} item - Item data
     * @param {string} item.listId - QuickBooks ListID (required)
     * @param {string} item.editSequence - Edit sequence for concurrency control (required)
     * @param {string} item.name - New name
     * @param {boolean} item.isActive - Item status
     * @param {number} item.price - New price
     * @param {string} item.description - New description
     * @param {string} item.accountFullName - Account name
     * @param {string} item.subItem - Move to new parent
     */
    modify: (item) => qbRequest('/mod-item', {
        method: 'PUT',
        body: JSON.stringify(item),
    }),

    /**
     * Query all active items from QuickBooks
     * @returns {Promise<Array>} List of items
     */
    query: () => qbRequest('/query-items', {
        method: 'POST',
        body: JSON.stringify({}),
    }),
};

// ============================================
// CUSTOMERS (Clients) API
// ============================================
export const qbCustomersApi = {
    /**
     * Add a new customer to QuickBooks
     * @param {Object} customer - Customer data
     * @param {string} customer.name - Customer name (required, must be unique)
     * @param {string} customer.companyName - Company name
     * @param {string} customer.firstName - Contact first name
     * @param {string} customer.lastName - Contact last name
     * @param {string} customer.email - Email address
     * @param {string} customer.phone - Phone number
     * @param {Object} customer.billAddress - Billing address { addr1, city, state, postalCode, country }
     * @param {Object} customer.shipAddress - Shipping address { addr1, city, state, postalCode, country }
     * @param {string} customer.clientId - Internal client ID reference (optional)
     */
    add: (customer) => qbRequest('/add-customer', {
        method: 'POST',
        body: JSON.stringify(customer),
    }),

    /**
     * Query all active customers from QuickBooks
     * @returns {Promise<Array>} List of customers
     */
    query: () => qbRequest('/query-customers', {
        method: 'POST',
        body: JSON.stringify({}),
    }),
};

// ============================================
// ESTIMATES & SALES ORDERS (MRP) API
// ============================================
export const qbSalesApi = {
    /**
     * Create an Estimate (Quotation) in QuickBooks
     * @param {Object} estimate - Estimate data
     * @param {string} estimate.quotationId - Internal quotation ID (required)
     * @param {string} estimate.customerListId - QuickBooks customer ListID (required)
     * @param {string} estimate.txnDate - Transaction date YYYY-MM-DD (required)
     * @param {string} estimate.dueDate - Due date YYYY-MM-DD
     * @param {Array} estimate.items - Line items (required)
     * @param {string} estimate.items[].itemListId - QuickBooks item ListID
     * @param {number} estimate.items[].quantity - Quantity
     * @param {number} estimate.items[].rate - Unit price
     * @param {number} estimate.items[].amount - Total amount
     * @param {string} estimate.items[].description - Line description
     */
    createEstimate: (estimate) => qbRequest('/create-estimate', {
        method: 'POST',
        body: JSON.stringify(estimate),
    }),

    /**
     * Create a Sales Order in QuickBooks
     * Same as createEstimate but represents a confirmed order
     * @param {Object} salesOrder - Sales order data (same as estimate + shipDate)
     * @param {string} salesOrder.shipDate - Ship date YYYY-MM-DD
     */
    createSalesOrder: (salesOrder) => qbRequest('/create-sales-order', {
        method: 'POST',
        body: JSON.stringify(salesOrder),
    }),
};

// ============================================
// ACCOUNTS API
// ============================================
export const qbAccountsApi = {
    /**
     * Query all accounts from QuickBooks
     * @returns {Promise<Array>} List of accounts
     */
    query: () => qbRequest('/query-accounts', {
        method: 'POST',
        body: JSON.stringify({}),
    }),
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Check if QBWC connector is available
 * @returns {Promise<boolean>}
 */
export const checkQBWCConnection = async () => {
    try {
        // Try to query accounts as a health check
        await qbAccountsApi.query();
        return true;
    } catch {
        return false;
    }
};

/**
 * Get the configured QBWC URL
 * @returns {string}
 */
export const getQBWCUrl = () => QBWC_BASE_URL;

// ============================================
// SYNC HELPERS
// ============================================

/**
 * Sync a client to QuickBooks
 * @param {Object} client - Client data from Supabase
 * @returns {Promise<Object>} QB response with listId
 */
export const syncClientToQB = async (client) => {
    const qbCustomer = {
        name: client.company_name || client.name,
        companyName: client.company_name,
        firstName: client.name?.split(' ')[0] || '',
        lastName: client.name?.split(' ').slice(1).join(' ') || '',
        email: client.email,
        phone: client.phone,
        billAddress: {
            addr1: client.address,
            city: client.city,
            state: client.state,
            postalCode: client.postal_code,
            country: client.country || 'México',
        },
        clientId: client.id,
    };

    return qbCustomersApi.add(qbCustomer);
};

/**
 * Sync a material to QuickBooks as an inventory item
 * @param {Object} material - Material data from Supabase
 * @returns {Promise<Object>} QB response with listId
 */
export const syncMaterialToQB = async (material) => {
    const qbItem = {
        name: material.name,
        price: material.unit_cost || 0,
        description: material.description || '',
        accountFullName: 'Materials for Production',
        materialId: material.id,
    };

    return qbItemsApi.add(qbItem);
};

/**
 * Sync a product to QuickBooks
 * @param {Object} product - Product data from Supabase
 * @returns {Promise<Object>} QB response with listId
 */
export const syncProductToQB = async (product) => {
    const qbItem = {
        name: product.name,
        price: product.unit_price || 0,
        description: product.description || '',
        accountFullName: 'Finished Goods',
        productId: product.id,
    };

    return qbItemsApi.add(qbItem);
};

/**
 * Create a quotation in QuickBooks as an Estimate
 * @param {Object} quotation - Quotation data from Supabase
 * @param {string} customerListId - QB customer ListID
 * @param {Array} itemsWithListId - Items with QB ListIDs
 * @returns {Promise<Object>} QB response
 */
export const createQuotationInQB = async (quotation, customerListId, itemsWithListId) => {
    const qbEstimate = {
        quotationId: quotation.id || quotation.folio,
        customerListId,
        txnDate: quotation.date || new Date().toISOString().split('T')[0],
        dueDate: quotation.eta,
        items: itemsWithListId.map(item => ({
            itemListId: item.qb_list_id,
            quantity: item.quantity,
            rate: item.unit_price,
            amount: item.quantity * item.unit_price,
            description: item.description || item.name,
        })),
    };

    return qbSalesApi.createEstimate(qbEstimate);
};

// ============================================
// EXPORT ALL
// ============================================
export const qbwcApi = {
    items: qbItemsApi,
    customers: qbCustomersApi,
    sales: qbSalesApi,
    accounts: qbAccountsApi,

    // Utilities
    checkConnection: checkQBWCConnection,
    getUrl: getQBWCUrl,

    // Sync helpers
    syncClient: syncClientToQB,
    syncMaterial: syncMaterialToQB,
    syncProduct: syncProductToQB,
    createQuotation: createQuotationInQB,
};

export default qbwcApi;
