// Firebase Storage Service
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata
} from "firebase/storage";
import { storage } from "./config";

/**
 * Upload a file to Firebase Storage
 * @param {File} file - File to upload
 * @param {string} path - Storage path (e.g., 'images/profile')
 * @param {string} fileName - Optional custom file name
 * @returns {Promise<Object>} Upload result with URL
 */
export const uploadFile = async (file, path, fileName = null) => {
  try {
    const name = fileName || `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${path}/${name}`);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      url: downloadURL,
      path: snapshot.ref.fullPath,
      name: name,
      size: file.size,
      type: file.type
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

/**
 * Upload a file with progress tracking
 * @param {File} file - File to upload
 * @param {string} path - Storage path
 * @param {Function} onProgress - Progress callback (0-100)
 * @param {string} fileName - Optional custom file name
 * @returns {Promise<Object>} Upload result with URL
 */
export const uploadFileWithProgress = (file, path, onProgress, fileName = null) => {
  return new Promise((resolve, reject) => {
    const name = fileName || `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${path}/${name}`);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(Math.round(progress));
      },
      (error) => {
        console.error("Error uploading file:", error);
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          url: downloadURL,
          path: uploadTask.snapshot.ref.fullPath,
          name: name,
          size: file.size,
          type: file.type
        });
      }
    );
  });
};

/**
 * Delete a file from Storage
 * @param {string} path - Full path to the file
 * @returns {Promise<boolean>} Success status
 */
export const deleteFile = async (path) => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

/**
 * Get download URL for a file
 * @param {string} path - Full path to the file
 * @returns {Promise<string>} Download URL
 */
export const getFileURL = async (path) => {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error getting file URL:", error);
    throw error;
  }
};

/**
 * List all files in a directory
 * @param {string} path - Directory path
 * @returns {Promise<Array>} List of file references
 */
export const listFiles = async (path) => {
  try {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);

    const files = await Promise.all(
      result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);
        return {
          name: itemRef.name,
          path: itemRef.fullPath,
          url: url,
          size: metadata.size,
          type: metadata.contentType,
          createdAt: metadata.timeCreated,
          updatedAt: metadata.updated
        };
      })
    );

    return files;
  } catch (error) {
    console.error("Error listing files:", error);
    throw error;
  }
};

/**
 * Get file metadata
 * @param {string} path - Full path to the file
 * @returns {Promise<Object>} File metadata
 */
export const getFileMetadata = async (path) => {
  try {
    const storageRef = ref(storage, path);
    const metadata = await getMetadata(storageRef);
    return {
      name: metadata.name,
      size: metadata.size,
      type: metadata.contentType,
      createdAt: metadata.timeCreated,
      updatedAt: metadata.updated,
      fullPath: metadata.fullPath
    };
  } catch (error) {
    console.error("Error getting file metadata:", error);
    throw error;
  }
};

// ============================================
// SPECIALIZED UPLOAD FUNCTIONS
// ============================================

/**
 * Upload profile image
 * @param {File} file - Image file
 * @param {string} userId - User ID
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Upload result
 */
export const uploadProfileImage = (file, userId, onProgress = null) => {
  const fileName = `profile_${userId}_${Date.now()}`;
  if (onProgress) {
    return uploadFileWithProgress(file, 'profiles', onProgress, fileName);
  }
  return uploadFile(file, 'profiles', fileName);
};

/**
 * Upload product image
 * @param {File} file - Image file
 * @param {string} productId - Product ID
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Upload result
 */
export const uploadProductImage = (file, productId, onProgress = null) => {
  const fileName = `product_${productId}_${Date.now()}`;
  if (onProgress) {
    return uploadFileWithProgress(file, 'products', onProgress, fileName);
  }
  return uploadFile(file, 'products', fileName);
};

/**
 * Upload material image
 * @param {File} file - Image file
 * @param {string} materialId - Material ID
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Upload result
 */
export const uploadMaterialImage = (file, materialId, onProgress = null) => {
  const fileName = `material_${materialId}_${Date.now()}`;
  if (onProgress) {
    return uploadFileWithProgress(file, 'materials', onProgress, fileName);
  }
  return uploadFile(file, 'materials', fileName);
};

/**
 * Upload project document
 * @param {File} file - Document file
 * @param {string} projectId - Project ID
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Upload result
 */
export const uploadProjectDocument = (file, projectId, onProgress = null) => {
  const fileName = `doc_${projectId}_${Date.now()}_${file.name}`;
  if (onProgress) {
    return uploadFileWithProgress(file, `projects/${projectId}`, onProgress, fileName);
  }
  return uploadFile(file, `projects/${projectId}`, fileName);
};
