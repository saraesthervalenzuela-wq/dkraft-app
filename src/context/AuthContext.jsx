import { createContext, useContext, useState, useEffect } from 'react';
import { loginToBackend, logoutFromBackend, registerToBackend } from '../services/api';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// Storage key for user data
const USER_KEY = 'dkraft_user';
const ATTENDANCE_KEY = 'dkraft_attendance_id';

// Attendance tracking helper
const attendanceTracker = {
    clockIn: async (user) => {
        try {
            const { data, error } = await supabase
                .from('attendance')
                .insert({
                    user_id: user.id !== 'demo-user' ? user.id : null,
                    user_email: user.email,
                    user_name: user.displayName || user.email,
                    clock_in: new Date().toISOString(),
                    status: 'working'
                })
                .select()
                .single();

            if (error) {
                console.error('[Attendance] Clock-in error:', error);
                return null;
            }

            // Store attendance ID for clock-out
            localStorage.setItem(ATTENDANCE_KEY, data.id);
            console.log('[Attendance] Clock-in successful:', data.id);
            return data;
        } catch (err) {
            console.error('[Attendance] Clock-in failed:', err);
            return null;
        }
    },

    clockOut: async () => {
        try {
            const attendanceId = localStorage.getItem(ATTENDANCE_KEY);
            if (!attendanceId) {
                console.log('[Attendance] No active attendance record');
                return null;
            }

            // Get current record to calculate hours
            const { data: record } = await supabase
                .from('attendance')
                .select('clock_in')
                .eq('id', attendanceId)
                .single();

            if (!record) return null;

            const clockIn = new Date(record.clock_in);
            const clockOut = new Date();
            const hoursWorked = ((clockOut - clockIn) / (1000 * 60 * 60)).toFixed(2);

            const { data, error } = await supabase
                .from('attendance')
                .update({
                    clock_out: clockOut.toISOString(),
                    hours_worked: parseFloat(hoursWorked),
                    status: 'offline',
                    updated_at: new Date().toISOString()
                })
                .eq('id', attendanceId)
                .select()
                .single();

            if (error) {
                console.error('[Attendance] Clock-out error:', error);
                return null;
            }

            localStorage.removeItem(ATTENDANCE_KEY);
            console.log('[Attendance] Clock-out successful, hours:', hoursWorked);
            return data;
        } catch (err) {
            console.error('[Attendance] Clock-out failed:', err);
            return null;
        }
    },

    // Get today's active workers
    getActiveWorkers: async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('date', today)
            .is('clock_out', null);

        if (error) {
            console.error('[Attendance] Get active workers error:', error);
            return [];
        }
        return data || [];
    }
};

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

      // Register attendance - CLOCK IN
      await attendanceTracker.clockIn(userData);

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
