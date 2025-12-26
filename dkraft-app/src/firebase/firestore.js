// Firestore Service - CRUD Operations
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from "firebase/firestore";
import { db } from "./config";

// ============================================
// GENERIC CRUD OPERATIONS
// ============================================

/**
 * Get all documents from a collection
 * @param {string} collectionName - Name of the collection
 * @returns {Promise<Array>} Array of documents
 */
export const getAll = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error getting ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Get a single document by ID
 * @param {string} collectionName - Name of the collection
 * @param {string} id - Document ID
 * @returns {Promise<Object|null>} Document data or null
 */
export const getById = async (collectionName, id) => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Add a new document to a collection
 * @param {string} collectionName - Name of the collection
 * @param {Object} data - Document data
 * @returns {Promise<Object>} Created document with ID
 */
export const create = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  } catch (error) {
    console.error(`Error adding document to ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Update an existing document
 * @param {string} collectionName - Name of the collection
 * @param {string} id - Document ID
 * @param {Object} data - Updated data
 * @returns {Promise<Object>} Updated document
 */
export const update = async (collectionName, id, data) => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { id, ...data };
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Delete a document
 * @param {string} collectionName - Name of the collection
 * @param {string} id - Document ID
 * @returns {Promise<boolean>} Success status
 */
export const remove = async (collectionName, id) => {
  try {
    const docRef = doc(db, collectionName, id);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Query documents with filters
 * @param {string} collectionName - Name of the collection
 * @param {Array} conditions - Array of conditions [{field, operator, value}]
 * @param {Object} options - Query options {orderByField, orderDirection, limitCount}
 * @returns {Promise<Array>} Array of matching documents
 */
export const queryDocuments = async (collectionName, conditions = [], options = {}) => {
  try {
    let q = collection(db, collectionName);
    const queryConstraints = [];

    // Add where conditions
    conditions.forEach(({ field, operator, value }) => {
      queryConstraints.push(where(field, operator, value));
    });

    // Add orderBy
    if (options.orderByField) {
      queryConstraints.push(orderBy(options.orderByField, options.orderDirection || 'asc'));
    }

    // Add limit
    if (options.limitCount) {
      queryConstraints.push(limit(options.limitCount));
    }

    q = query(q, ...queryConstraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error(`Error querying ${collectionName}:`, error);
    throw error;
  }
};

/**
 * Subscribe to real-time updates on a collection
 * @param {string} collectionName - Name of the collection
 * @param {Function} callback - Callback function called on updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToCollection = (collectionName, callback) => {
  const q = collection(db, collectionName);

  return onSnapshot(q, (querySnapshot) => {
    const documents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(documents);
  }, (error) => {
    console.error(`Error subscribing to ${collectionName}:`, error);
  });
};

/**
 * Subscribe to a single document
 * @param {string} collectionName - Name of the collection
 * @param {string} id - Document ID
 * @param {Function} callback - Callback function called on updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToDocument = (collectionName, id, callback) => {
  const docRef = doc(db, collectionName, id);

  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error(`Error subscribing to document:`, error);
  });
};

/**
 * Batch write multiple documents
 * @param {Array} operations - Array of {type: 'create'|'update'|'delete', collection, id?, data?}
 * @returns {Promise<boolean>} Success status
 */
export const batchWrite = async (operations) => {
  try {
    const batch = writeBatch(db);

    operations.forEach(({ type, collectionName, id, data }) => {
      if (type === 'create') {
        const docRef = doc(collection(db, collectionName));
        batch.set(docRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      } else if (type === 'update') {
        const docRef = doc(db, collectionName, id);
        batch.update(docRef, { ...data, updatedAt: serverTimestamp() });
      } else if (type === 'delete') {
        const docRef = doc(db, collectionName, id);
        batch.delete(docRef);
      }
    });

    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error in batch write:', error);
    throw error;
  }
};

// ============================================
// COLLECTION-SPECIFIC SERVICES
// ============================================

// Collections names (for consistency)
export const COLLECTIONS = {
  STAFF: 'staff',
  CLIENTS: 'clients',
  SUPPLIERS: 'suppliers',
  MATERIALS: 'materials',
  PRODUCTS: 'products',
  PROJECTS: 'projects',
  OPERATIONS: 'operations',
  CATEGORIES: 'categories',
  UNITS: 'units',
  ACTIVITY_LOG: 'activityLog',
  ATTENDANCE: 'attendance',
  QUALITY: 'quality'
};

// Staff Service
export const staffService = {
  getAll: () => getAll(COLLECTIONS.STAFF),
  getById: (id) => getById(COLLECTIONS.STAFF, id),
  create: (data) => create(COLLECTIONS.STAFF, data),
  update: (id, data) => update(COLLECTIONS.STAFF, id, data),
  delete: (id) => remove(COLLECTIONS.STAFF, id),
  subscribe: (callback) => subscribeToCollection(COLLECTIONS.STAFF, callback)
};

// Clients Service
export const clientsService = {
  getAll: () => getAll(COLLECTIONS.CLIENTS),
  getById: (id) => getById(COLLECTIONS.CLIENTS, id),
  create: (data) => create(COLLECTIONS.CLIENTS, data),
  update: (id, data) => update(COLLECTIONS.CLIENTS, id, data),
  delete: (id) => remove(COLLECTIONS.CLIENTS, id),
  subscribe: (callback) => subscribeToCollection(COLLECTIONS.CLIENTS, callback)
};

// Suppliers Service
export const suppliersService = {
  getAll: () => getAll(COLLECTIONS.SUPPLIERS),
  getById: (id) => getById(COLLECTIONS.SUPPLIERS, id),
  create: (data) => create(COLLECTIONS.SUPPLIERS, data),
  update: (id, data) => update(COLLECTIONS.SUPPLIERS, id, data),
  delete: (id) => remove(COLLECTIONS.SUPPLIERS, id),
  subscribe: (callback) => subscribeToCollection(COLLECTIONS.SUPPLIERS, callback)
};

// Materials Service
export const materialsService = {
  getAll: () => getAll(COLLECTIONS.MATERIALS),
  getById: (id) => getById(COLLECTIONS.MATERIALS, id),
  create: (data) => create(COLLECTIONS.MATERIALS, data),
  update: (id, data) => update(COLLECTIONS.MATERIALS, id, data),
  delete: (id) => remove(COLLECTIONS.MATERIALS, id),
  subscribe: (callback) => subscribeToCollection(COLLECTIONS.MATERIALS, callback)
};

// Products Service
export const productsService = {
  getAll: () => getAll(COLLECTIONS.PRODUCTS),
  getById: (id) => getById(COLLECTIONS.PRODUCTS, id),
  create: (data) => create(COLLECTIONS.PRODUCTS, data),
  update: (id, data) => update(COLLECTIONS.PRODUCTS, id, data),
  delete: (id) => remove(COLLECTIONS.PRODUCTS, id),
  subscribe: (callback) => subscribeToCollection(COLLECTIONS.PRODUCTS, callback)
};

// Projects Service
export const projectsService = {
  getAll: () => getAll(COLLECTIONS.PROJECTS),
  getById: (id) => getById(COLLECTIONS.PROJECTS, id),
  create: (data) => create(COLLECTIONS.PROJECTS, data),
  update: (id, data) => update(COLLECTIONS.PROJECTS, id, data),
  delete: (id) => remove(COLLECTIONS.PROJECTS, id),
  subscribe: (callback) => subscribeToCollection(COLLECTIONS.PROJECTS, callback)
};

// Operations Service
export const operationsService = {
  getAll: () => getAll(COLLECTIONS.OPERATIONS),
  getById: (id) => getById(COLLECTIONS.OPERATIONS, id),
  create: (data) => create(COLLECTIONS.OPERATIONS, data),
  update: (id, data) => update(COLLECTIONS.OPERATIONS, id, data),
  delete: (id) => remove(COLLECTIONS.OPERATIONS, id),
  subscribe: (callback) => subscribeToCollection(COLLECTIONS.OPERATIONS, callback)
};

// Categories Service
export const categoriesService = {
  getAll: () => getAll(COLLECTIONS.CATEGORIES),
  getById: (id) => getById(COLLECTIONS.CATEGORIES, id),
  create: (data) => create(COLLECTIONS.CATEGORIES, data),
  update: (id, data) => update(COLLECTIONS.CATEGORIES, id, data),
  delete: (id) => remove(COLLECTIONS.CATEGORIES, id),
  subscribe: (callback) => subscribeToCollection(COLLECTIONS.CATEGORIES, callback)
};

// Units Service
export const unitsService = {
  getAll: () => getAll(COLLECTIONS.UNITS),
  getById: (id) => getById(COLLECTIONS.UNITS, id),
  create: (data) => create(COLLECTIONS.UNITS, data),
  update: (id, data) => update(COLLECTIONS.UNITS, id, data),
  delete: (id) => remove(COLLECTIONS.UNITS, id),
  subscribe: (callback) => subscribeToCollection(COLLECTIONS.UNITS, callback)
};

// Activity Log Service
export const activityLogService = {
  getAll: () => getAll(COLLECTIONS.ACTIVITY_LOG),
  getById: (id) => getById(COLLECTIONS.ACTIVITY_LOG, id),
  create: (data) => create(COLLECTIONS.ACTIVITY_LOG, data),
  getRecent: (limitCount = 50) => queryDocuments(
    COLLECTIONS.ACTIVITY_LOG,
    [],
    { orderByField: 'createdAt', orderDirection: 'desc', limitCount }
  ),
  subscribe: (callback) => subscribeToCollection(COLLECTIONS.ACTIVITY_LOG, callback)
};
