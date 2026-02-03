import { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../lib/supabase';

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

  // Check for Supabase session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for existing Supabase session
        const session = await auth.getSession();
        if (session?.user) {
          const userData = {
            id: session.user.id,
            email: session.user.email,
            displayName: session.user.user_metadata?.display_name || session.user.email,
            role: session.user.user_metadata?.role || 'ADMIN'
          };
          localStorage.setItem(USER_KEY, JSON.stringify(userData));
          setUser(userData);
        } else {
          // Check localStorage as fallback (for demo mode)
          const storedUser = localStorage.getItem(USER_KEY);
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (e) {
              localStorage.removeItem(USER_KEY);
            }
          }
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const userData = {
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.display_name || session.user.email,
          role: session.user.user_metadata?.role || 'ADMIN'
        };
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        setUser(userData);
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem(USER_KEY);
        setUser(null);
      }
    });

    return () => subscription?.unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      // Login with Supabase
      const { user: supabaseUser } = await auth.signIn(email, password);

      const userData = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        displayName: supabaseUser.user_metadata?.display_name || supabaseUser.email,
        role: supabaseUser.user_metadata?.role || 'ADMIN'
      };

      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);

      console.log('[Auth] Login successful:', userData.email);
      return userData;
    } catch (err) {
      const errorMessage = err.message === 'Invalid login credentials'
        ? 'Credenciales inválidas. Verifica tu email y contraseña.'
        : err.message;
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, displayName) => {
    try {
      setError(null);
      setLoading(true);

      // Register with Supabase
      const { user: supabaseUser } = await auth.signUp(email, password, {
        display_name: displayName
      });

      console.log('[Auth] Registration successful:', email);
      return supabaseUser;
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

      // Sign out from Supabase
      await auth.signOut();

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
