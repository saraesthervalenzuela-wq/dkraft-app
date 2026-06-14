/**
 * useService Hook
 * Provides a unified interface for data operations
 * Automatically switches between Firebase and API based on configuration
 */

import { useState, useCallback } from 'react';
import { isApiEnabled } from '../services/api';

// Import Firebase services
import {
    materialsService,
    productsService,
    suppliersService,
    clientsService,
    categoriesService,
    unitsService,
    projectsService,
    bomService,
    warehousesService,
    requisitionsService,
} from '../firebase';

// Import API services
import {
    materialsApi,
    productsApi,
    suppliersApi,
    clientsApi,
    categoriesApi,
    unitsApi,
    projectsApi,
    bomApi,
    warehousesApi,
    requisitionsApi,
} from '../services/api';

/**
 * Map of service names to their Firebase and API implementations
 */
const serviceMap = {
    materials: { firebase: materialsService, api: materialsApi },
    products: { firebase: productsService, api: productsApi },
    suppliers: { firebase: suppliersService, api: suppliersApi },
    clients: { firebase: clientsService, api: clientsApi },
    categories: { firebase: categoriesService, api: categoriesApi },
    units: { firebase: unitsService, api: unitsApi },
    projects: { firebase: projectsService, api: projectsApi },
    bom: { firebase: bomService, api: bomApi },
    warehouses: { firebase: warehousesService, api: warehousesApi },
    requisitions: { firebase: requisitionsService, api: requisitionsApi },
};

/**
 * Hook to get the appropriate service based on configuration
 * @param {string} serviceName - Name of the service (materials, products, etc.)
 * @returns {Object} Service object with CRUD methods
 */
export const useService = (serviceName) => {
    const useApi = isApiEnabled();
    const services = serviceMap[serviceName];

    if (!services) {
        console.warn(`Service "${serviceName}" not found`);
        return null;
    }

    return useApi ? services.api : services.firebase;
};

/**
 * Hook for data fetching with loading and error states
 * @param {string} serviceName - Name of the service
 * @returns {Object} Data fetching utilities
 */
export const useDataService = (serviceName) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const service = useService(serviceName);

    const fetchAll = useCallback(async (params = {}) => {
        if (!service) return;

        setLoading(true);
        setError(null);

        try {
            const result = await service.getAll(params);
            setData(result);
            return result;
        } catch (err) {
            setError(err.message);
            console.error(`Error fetching ${serviceName}:`, err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [service, serviceName]);

    const fetchById = useCallback(async (id) => {
        if (!service) return null;

        setLoading(true);
        setError(null);

        try {
            const result = await service.getById(id);
            return result;
        } catch (err) {
            setError(err.message);
            console.error(`Error fetching ${serviceName} by id:`, err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [service, serviceName]);

    const create = useCallback(async (itemData) => {
        if (!service) return null;

        setLoading(true);
        setError(null);

        try {
            const result = await service.create(itemData);
            setData(prev => [...prev, result]);
            return result;
        } catch (err) {
            setError(err.message);
            console.error(`Error creating ${serviceName}:`, err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [service, serviceName]);

    const update = useCallback(async (id, itemData) => {
        if (!service) return null;

        setLoading(true);
        setError(null);

        try {
            const result = await service.update(id, itemData);
            setData(prev => prev.map(item => item.id === id ? { ...item, ...result } : item));
            return result;
        } catch (err) {
            setError(err.message);
            console.error(`Error updating ${serviceName}:`, err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [service, serviceName]);

    const remove = useCallback(async (id) => {
        if (!service) return false;

        setLoading(true);
        setError(null);

        try {
            await service.delete(id);
            setData(prev => prev.filter(item => item.id !== id));
            return true;
        } catch (err) {
            setError(err.message);
            console.error(`Error deleting ${serviceName}:`, err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [service, serviceName]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        data,
        setData,
        loading,
        error,
        clearError,
        fetchAll,
        fetchById,
        create,
        update,
        remove,
        service,
        isApiEnabled: isApiEnabled(),
    };
};

export default useService;
