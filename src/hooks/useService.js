/**
 * useService Hook
 * Provides a unified interface for data operations using the API backend
 */

import { useState, useCallback } from 'react';

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
 * Map of service names to their API implementations
 */
const serviceMap = {
    materials: materialsApi,
    products: productsApi,
    suppliers: suppliersApi,
    clients: clientsApi,
    categories: categoriesApi,
    units: unitsApi,
    projects: projectsApi,
    bom: bomApi,
    warehouses: warehousesApi,
    requisitions: requisitionsApi,
};

/**
 * Hook to get the appropriate API service
 * @param {string} serviceName - Name of the service (materials, products, etc.)
 * @returns {Object} Service object with CRUD methods
 */
export const useService = (serviceName) => {
    const service = serviceMap[serviceName];

    if (!service) {
        console.warn(`Service "${serviceName}" not found`);
        return null;
    }

    return service;
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
    };
};

export default useService;
