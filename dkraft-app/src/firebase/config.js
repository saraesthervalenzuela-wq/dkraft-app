// Firebase Configuration
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAh8iHSkSvMgKa_3Vzdlv4UQJVlgEiMcpA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dkraft-app.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dkraft-app",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dkraft-app.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "843357669944",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:843357669944:web:5f7bd72f27a18a299b34cd",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-YXBJ4LVXD7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Initialize Analytics (only in browser)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export default app;
