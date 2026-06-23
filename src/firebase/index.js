import { auth as supabaseAuth } from '../lib/supabase';

export {
  supabase as db, auth, clientsService, suppliersService, materialsService,
  productsService, projectsService, operationsService, categoriesService,
  unitsService, activityLogService, bomService, warehousesService,
  requisitionsService, quotationsService
} from '../lib/supabase';

// URL a la que Supabase redirige tras el clic en el correo de recuperación.
// Configurable vía VITE_SITE_URL; si no, usa el origen actual (funciona en
// localhost y en producción), con fallback al dominio de producción.
const SITE_URL =
  import.meta.env.VITE_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : 'https://dkraft.com.mx');
export const storage = null;
export const analytics = null;
export const getAll = async () => [];
export const getById = async () => null;
export const create = async () => null;
export const update = async () => null;
export const remove = async () => null;
export const queryDocuments = async () => [];
export const subscribeToCollection = () => () => {};
export const subscribeToDocument = () => () => {};
export const batchWrite = async () => {};
export const COLLECTIONS = {};
export const registerUser = async () => {};
export const loginUser = async () => {};
export const logoutUser = async () => {};
export const resetPassword = (email) => supabaseAuth.resetPassword(email, SITE_URL);
export const updateUserProfile = async () => {};
export const updateUserEmail = async () => {};
export const updateUserPassword = async () => {};
export const getCurrentUser = () => null;
export const subscribeToAuthState = () => () => {};
export const uploadFile = async () => {};
export const deleteFile = async () => {};
export const getFileURL = async () => '';
export const staffService = { getAll: async () => [], getById: async () => null };
