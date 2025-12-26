// Firebase Authentication Service
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";
import { auth } from "./config";

/**
 * Register a new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User display name (optional)
 * @returns {Promise<Object>} User object
 */
export const registerUser = async (email, password, displayName = null) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
    }

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified
    };
  } catch (error) {
    console.error("Error registering user:", error);
    throw getAuthError(error);
  }
};

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User object
 */
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      photoURL: user.photoURL
    };
  } catch (error) {
    console.error("Error logging in:", error);
    throw getAuthError(error);
  }
};

/**
 * Sign out current user
 * @returns {Promise<boolean>} Success status
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Error logging out:", error);
    throw getAuthError(error);
  }
};

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<boolean>} Success status
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("Error sending password reset:", error);
    throw getAuthError(error);
  }
};

/**
 * Update user profile (display name and/or photo URL)
 * @param {Object} profileData - { displayName, photoURL }
 * @returns {Promise<Object>} Updated user object
 */
export const updateUserProfile = async (profileData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");

    await updateProfile(user, profileData);

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };
  } catch (error) {
    console.error("Error updating profile:", error);
    throw getAuthError(error);
  }
};

/**
 * Update user email
 * @param {string} newEmail - New email address
 * @param {string} currentPassword - Current password for re-authentication
 * @returns {Promise<boolean>} Success status
 */
export const updateUserEmail = async (newEmail, currentPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");

    // Re-authenticate user first
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    await updateEmail(user, newEmail);
    return true;
  } catch (error) {
    console.error("Error updating email:", error);
    throw getAuthError(error);
  }
};

/**
 * Update user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>} Success status
 */
export const updateUserPassword = async (currentPassword, newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("No user logged in");

    // Re-authenticate user first
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);

    await updatePassword(user, newPassword);
    return true;
  } catch (error) {
    console.error("Error updating password:", error);
    throw getAuthError(error);
  }
};

/**
 * Get current user
 * @returns {Object|null} Current user object or null
 */
export const getCurrentUser = () => {
  const user = auth.currentUser;
  if (!user) return null;

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    emailVerified: user.emailVerified,
    photoURL: user.photoURL
  };
};

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Callback function called on auth state change
 * @returns {Function} Unsubscribe function
 */
export const subscribeToAuthState = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      callback({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified,
        photoURL: user.photoURL
      });
    } else {
      callback(null);
    }
  });
};

/**
 * Convert Firebase auth errors to user-friendly messages
 * @param {Error} error - Firebase error
 * @returns {Error} Error with user-friendly message
 */
const getAuthError = (error) => {
  const errorMessages = {
    'auth/email-already-in-use': 'Este correo electrónico ya está registrado.',
    'auth/invalid-email': 'El correo electrónico no es válido.',
    'auth/operation-not-allowed': 'Operación no permitida.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
    'auth/user-not-found': 'No existe una cuenta con este correo electrónico.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/too-many-requests': 'Demasiados intentos. Intenta de nuevo más tarde.',
    'auth/requires-recent-login': 'Por favor, vuelve a iniciar sesión para realizar esta acción.',
    'auth/invalid-credential': 'Credenciales inválidas. Verifica tu correo y contraseña.'
  };

  const message = errorMessages[error.code] || error.message;
  const customError = new Error(message);
  customError.code = error.code;
  return customError;
};
