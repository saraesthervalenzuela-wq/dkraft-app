import { createContext, useContext, useState, useEffect } from 'react';
import { loginToBackend, logoutFromBackend, registerToBackend } from '../services/api';

const AuthContext = createContext(null);

// Storage key for user data
const USER_KEY = 'dkraft_user';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for stored user on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      // Login to backend API using NextAuth
      const backendData = await loginToBackend(email, password);

      // Create user object from backend response (NextAuth session format)
      const userData = {
        id: backendData.user.id || backendData.user.sub,
        email: backendData.user.email,
        displayName: backendData.user.name || backendData.user.username || backendData.user.email,
        role: backendData.user.role || 'USER',
        areaId: backendData.user.areaId,
        departmentId: backendData.user.departmentId,
        image: backendData.user.image,
      };

      // Store user in localStorage
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);

      console.log('[Auth] Login successful:', userData.email);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, displayName, role = 'USER') => {
    try {
      setError(null);
      setLoading(true);

      // Register user via backend API
      const result = await registerToBackend(displayName, email, password, role);

      console.log('[Auth] Registration successful:', result);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);

      // Clear backend token
      logoutFromBackend();

      // Clear stored user
      localStorage.removeItem(USER_KEY);
      setUser(null);

      console.log('[Auth] Logout successful');
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Demo mode - bypass authentication for testing
  const loginAsDemo = () => {
    const demoUser = {
      id: 'demo-user',
      email: 'demo@dkraft.com',
      displayName: 'Usuario Demo',
      role: 'ADMIN'
    };
    localStorage.setItem(USER_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
  };

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    loginAsDemo,
    clearError,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
