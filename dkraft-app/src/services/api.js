/**
 * API Service for D-Kraft MRP/ERP
 * Connects to backend at https://dkraft.com.mx/api
 *
 * Response format: { success: boolean, data: any, message: string, error: string }
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://dkraft.com.mx/api';
const USE_API = import.meta.env.VITE_USE_API === 'true';

// Storage key for backend JWT token
const TOKEN_KEY = 'dkraft_api_token';

/**
 * Get stored backend JWT token
 */
const getStoredToken = () => {
    return localStorage.getItem(TOKEN_KEY);
};

/**
 * Store backend JWT token
 */
const storeToken = (token) => {
    localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Clear stored token
 */
const clearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
};

/**
 * Login to backend API
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{token: string, user: object}>}
 */
export const loginToBackend = async (email, password) => {
    console.log('[API] loginToBackend called with:', { email, password: password ? '***' : 'EMPTY' });
    console.log('[API] Email type:', typeof email, 'Password type:', typeof password);
    console.log('[API] Email length:', email?.length, 'Password length:', password?.length);

    const requestBody = { email, password };
    console.log('[API] Request body:', JSON.stringify(requestBody));

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
    });

    console.log('[API] Login response status:', response.status);
    const result = await response.json();
    console.log('[API] Login response body:', result);

    if (!response.ok || !result.success) {
        throw new Error(result.error || result.message || 'Login failed');
    }

    // Store the token
    if (result.data?.token) {
        storeToken(result.data.token);
        console.log('[API] Backend token stored successfully');
    }

    return result.data;
};

/**
 * Logout from backend API
 */
export const logoutFromBackend = () => {
    clearToken();
    console.log('[API] Backend token cleared');
};

/**
 * Generic API request handler
 * Extracts data from { success, data, message, error } response format
 */
const request = async (endpoint, options = {}) => {
    if (!USE_API) {
        throw new Error('API not enabled. Set VITE_USE_API=true in .env');
    }

    // Get stored backend token
    const token = getStoredToken();

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Add Authorization header if we have a token
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('[API] Using stored backend token');
    } else {
        console.log('[API] No backend token available');
    }

    const config = {
        ...options,
        headers,
    };

    console.log(`[API] ${options.method || 'GET'} ${API_BASE_URL}${endpoint}`);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    console.log(`[API] Response status: ${response.status}`);

    // Handle 204 No Content
    if (response.status === 204) {
        return null;
    }

    const result = await response.json().catch(() => ({
        success: false,
        error: 'Invalid JSON response'
    }));

    console.log('[API] Response:', result);

    // If unauthorized, clear token
    if (response.status === 401) {
        clearToken();
    }

    if (!response.ok || !result.success) {
        const errorMsg = result.error || result.message || `HTTP ${response.status}`;
        console.error('[API] Error:', errorMsg);
        throw new Error(errorMsg);
    }

    // Return the data property from the response
    return result.data;
};

/**
 * Check if API backend is available
 */
export const isApiEnabled = () => USE_API;

/**
 * Health check for API
 */
export const checkApiHealth = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return response.ok;
    } catch {
        return false;
    }
};

// ============================================
// MATERIALS API
// ============================================
export const materialsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/materials${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/materials/${id}`),
    create: (data) => request('/materials', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/materials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => request(`/materials/${id}`, { method: 'DELETE' }),
    getStock: (id) => request(`/materials/${id}/stock`),
    updateStock: (id, warehouseId, quantity) => request(`/materials/${id}/stock`, {
        method: 'POST',
        body: JSON.stringify({ warehouseId, quantity })
    }),
    getByCategory: (categoryId) => request(`/materials?categoryId=${categoryId}`),
    getBySupplier: (supplierId) => request(`/materials?supplierId=${supplierId}`),
    getLowStock: () => request('/materials/low-stock'),
};

// ============================================
// PRODUCTS API
// ============================================
export const productsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/products${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/products/${id}`),
    create: (data) => request('/products', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => request(`/products/${id}`, { method: 'DELETE' }),
    syncToQB: (id) => request(`/products/${id}/sync-qb`, { method: 'POST' }),
};

// ============================================
// SUPPLIERS API
// ============================================
export const suppliersApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/suppliers${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/suppliers/${id}`),
    create: (data) => request('/suppliers', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/suppliers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),
    getMaterials: (id) => request(`/suppliers/${id}/materials`),
};

// ============================================
// CLIENTS API
// ============================================
export const clientsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/clients${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/clients/${id}`),
    create: (data) => request('/clients', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/clients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => request(`/clients/${id}`, { method: 'DELETE' }),
    syncToQB: (id) => request(`/clients/${id}/sync-qb`, { method: 'POST' }),
    getQuotations: (id) => request(`/clients/${id}/quotations`),
    getRequisitions: (id) => request(`/clients/${id}/requisitions`),
};

// ============================================
// WAREHOUSES API
// ============================================
export const warehousesApi = {
    getAll: () => request('/warehouses'),
    getById: (id) => request(`/warehouses/${id}`),
    create: (data) => request('/warehouses', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/warehouses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => request(`/warehouses/${id}`, { method: 'DELETE' }),
    getSections: (id) => request(`/warehouses/${id}/sections`),
    createSection: (warehouseId, data) => request(`/warehouses/${warehouseId}/sections`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getStock: (id) => request(`/warehouses/${id}/stock`),
};

// ============================================
// CATEGORIES API
// ============================================
export const categoriesApi = {
    getAll: () => request('/categories'),
    getById: (id) => request(`/categories/${id}`),
    create: (data) => request('/categories', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
};

// ============================================
// UNITS API
// ============================================
export const unitsApi = {
    getAll: () => request('/units'),
    getById: (id) => request(`/units/${id}`),
    create: (data) => request('/units', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/units/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => request(`/units/${id}`, { method: 'DELETE' }),
};

// ============================================
// REQUISITIONS API
// ============================================
export const requisitionsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/requisitions${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/requisitions/${id}`),
    create: (data) => request('/requisitions', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/requisitions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => request(`/requisitions/${id}`, { method: 'DELETE' }),

    // Workflow actions
    submit: (id) => request(`/requisitions/${id}/submit`, { method: 'POST' }),
    approve: (id, notes) => request(`/requisitions/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ notes })
    }),
    reject: (id, reason) => request(`/requisitions/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
    }),
    cancel: (id) => request(`/requisitions/${id}/cancel`, { method: 'POST' }),

    // Items
    addItem: (id, item) => request(`/requisitions/${id}/items`, {
        method: 'POST',
        body: JSON.stringify(item)
    }),
    updateItem: (id, itemId, data) => request(`/requisitions/${id}/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    removeItem: (id, itemId) => request(`/requisitions/${id}/items/${itemId}`, {
        method: 'DELETE'
    }),

    // Reports
    getPending: () => request('/requisitions?status=PENDING_APPROVAL'),
    getByRequester: (userId) => request(`/requisitions?requesterId=${userId}`),
};

// ============================================
// QUOTATIONS API
// ============================================
export const quotationsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/quotations${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/quotations/${id}`),
    create: (data) => request('/quotations', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/quotations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => request(`/quotations/${id}`, { method: 'DELETE' }),

    // Workflow
    sendToClient: (id) => request(`/quotations/${id}/send`, { method: 'POST' }),
    approve: (id) => request(`/quotations/${id}/approve`, { method: 'POST' }),
    reject: (id, reason) => request(`/quotations/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
    }),

    // QuickBooks integration
    sendToQB: (id, type = 'ESTIMATE') => request(`/quotations/${id}/send-to-qb`, {
        method: 'POST',
        body: JSON.stringify({ type })
    }),
    createSalesOrder: (id) => request(`/quotations/${id}/create-sales-order`, {
        method: 'POST'
    }),

    // Items
    addItem: (id, item) => request(`/quotations/${id}/items`, {
        method: 'POST',
        body: JSON.stringify(item)
    }),
    updateItem: (id, itemId, data) => request(`/quotations/${id}/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    removeItem: (id, itemId) => request(`/quotations/${id}/items/${itemId}`, {
        method: 'DELETE'
    }),
};

// ============================================
// PROJECTS API
// ============================================
export const projectsApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/projects${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/projects/${id}`),
    create: (data) => request('/projects', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
    getRequisitions: (id) => request(`/projects/${id}/requisitions`),
    getQuotations: (id) => request(`/projects/${id}/quotations`),
};

// ============================================
// BOM (Bill of Materials) API
// ============================================
export const bomApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/bom${query ? `?${query}` : ''}`);
    },
    getById: (id) => request(`/bom/${id}`),
    create: (data) => request('/bom', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/bom/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => request(`/bom/${id}`, { method: 'DELETE' }),
    getByProduct: (productId) => request(`/bom?productId=${productId}`),

    // Components
    addComponent: (id, component) => request(`/bom/${id}/components`, {
        method: 'POST',
        body: JSON.stringify(component)
    }),
    updateComponent: (id, componentId, data) => request(`/bom/${id}/components/${componentId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    removeComponent: (id, componentId) => request(`/bom/${id}/components/${componentId}`, {
        method: 'DELETE'
    }),

    // Cost calculation
    calculateCosts: (id) => request(`/bom/${id}/calculate-costs`, { method: 'POST' }),
    checkStock: (id, quantity = 1) => request(`/bom/${id}/check-stock?quantity=${quantity}`),
};

// ============================================
// MRP (Material Requirements Planning) API
// ============================================
export const mrpApi = {
    // Calculate material requirements for a quotation/order
    calculateRequirements: (quotationId) => request(`/mrp/calculate/${quotationId}`),

    // Generate requisition from MRP calculation
    generateRequisition: (data) => request('/mrp/generate-requisition', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    // Check stock availability for production
    checkAvailability: (productId, quantity) =>
        request(`/mrp/check-availability?productId=${productId}&quantity=${quantity}`),

    // Get material shortages
    getShortages: () => request('/mrp/shortages'),

    // Get reorder suggestions
    getReorderSuggestions: () => request('/mrp/reorder-suggestions'),
};

// ============================================
// REPORTS & KPIs API
// ============================================
export const reportsApi = {
    // Dashboard KPIs
    getDashboardKPIs: () => request('/reports/dashboard'),

    // Inventory reports
    getInventoryValue: () => request('/reports/inventory-value'),
    getInventoryTurnover: (period = '30d') => request(`/reports/inventory-turnover?period=${period}`),
    getLowStockReport: () => request('/reports/low-stock'),
    getStockMovements: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/reports/stock-movements${query ? `?${query}` : ''}`);
    },

    // Production reports
    getProductionEfficiency: (period = '30d') => request(`/reports/production-efficiency?period=${period}`),
    getOperationsStatus: () => request('/reports/operations-status'),

    // Financial reports
    getQuotationsSummary: (period = '30d') => request(`/reports/quotations-summary?period=${period}`),
    getRequisitionsSummary: (period = '30d') => request(`/reports/requisitions-summary?period=${period}`),

    // QuickBooks sync status
    getQBSyncStatus: () => request('/reports/qb-sync-status'),
};

// ============================================
// QUICKBOOKS INTEGRATION API
// ============================================
export const quickbooksApi = {
    // Sync status
    getStatus: () => request('/quickbooks/status'),

    // Manual sync triggers
    syncClients: () => request('/quickbooks/sync/clients', { method: 'POST' }),
    syncProducts: () => request('/quickbooks/sync/products', { method: 'POST' }),
    syncMaterials: () => request('/quickbooks/sync/materials', { method: 'POST' }),

    // Queue management
    getQueue: (type) => request(`/quickbooks/queue${type ? `?type=${type}` : ''}`),
    retryFailed: () => request('/quickbooks/queue/retry-failed', { method: 'POST' }),

    // Accounts from QB
    getAccounts: () => request('/quickbooks/accounts'),
};

// ============================================
// USERS API
// ============================================
export const usersApi = {
    getAll: () => request('/users'),
    getById: (id) => request(`/users/${id}`),
    getCurrent: () => request('/users/me'),
    create: (data) => request('/users', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => request(`/users/${id}`, { method: 'DELETE' }),
    updateRole: (id, role) => request(`/users/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
    }),
    getByDepartment: (departmentId) => request(`/users?departmentId=${departmentId}`),
    getByArea: (areaId) => request(`/users?areaId=${areaId}`),
};

// ============================================
// AREAS & DEPARTMENTS API
// ============================================
export const areasApi = {
    getAll: () => request('/areas'),
    getById: (id) => request(`/areas/${id}`),
    create: (data) => request('/areas', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/areas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => request(`/areas/${id}`, { method: 'DELETE' }),
    getDepartments: (id) => request(`/areas/${id}/departments`),
};

export const departmentsApi = {
    getAll: () => request('/departments'),
    getById: (id) => request(`/departments/${id}`),
    create: (data) => request('/departments', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => request(`/departments/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => request(`/departments/${id}`, { method: 'DELETE' }),
};

// ============================================
// ACTIVITY LOG API
// ============================================
export const activityLogApi = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return request(`/activity-log${query ? `?${query}` : ''}`);
    },
    getByUser: (userId, limit = 50) => request(`/activity-log?userId=${userId}&limit=${limit}`),
    getByModel: (model, recordId) => request(`/activity-log?model=${model}&recordId=${recordId}`),
    getRecent: (limit = 50) => request(`/activity-log?limit=${limit}`),
};

// Export all APIs as a single object for convenience
export const api = {
    materials: materialsApi,
    products: productsApi,
    suppliers: suppliersApi,
    clients: clientsApi,
    warehouses: warehousesApi,
    categories: categoriesApi,
    units: unitsApi,
    requisitions: requisitionsApi,
    quotations: quotationsApi,
    projects: projectsApi,
    bom: bomApi,
    mrp: mrpApi,
    reports: reportsApi,
    quickbooks: quickbooksApi,
    users: usersApi,
    areas: areasApi,
    departments: departmentsApi,
    activityLog: activityLogApi,

    // Utility functions
    isEnabled: isApiEnabled,
    checkHealth: checkApiHealth,
};

export default api;
