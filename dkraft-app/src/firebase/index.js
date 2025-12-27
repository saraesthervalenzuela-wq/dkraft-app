// Firebase Services - Main Export
export { db, auth, storage, analytics } from './config';

// Firestore Services
export {
  // Generic CRUD
  getAll,
  getById,
  create,
  update,
  remove,
  queryDocuments,
  subscribeToCollection,
  subscribeToDocument,
  batchWrite,
  // Collection names
  COLLECTIONS,
  // Specific services
  staffService,
  clientsService,
  suppliersService,
  materialsService,
  productsService,
  projectsService,
  operationsService,
  categoriesService,
  unitsService,
  activityLogService,
  bomService
} from './firestore';

// Auth Services
export {
  registerUser,
  loginUser,
  logoutUser,
  resetPassword,
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
  getCurrentUser,
  subscribeToAuthState
} from './auth';

// Storage Services
export {
  uploadFile,
  uploadFileWithProgress,
  deleteFile,
  getFileURL,
  listFiles,
  getFileMetadata,
  uploadProfileImage,
  uploadProductImage,
  uploadMaterialImage,
  uploadProjectDocument
} from './storage';
