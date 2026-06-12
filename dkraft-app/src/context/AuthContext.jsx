import { createContext, useContext, useState, useEffect } from "react";
import { supabase, auth } from "../lib/supabase";

const AuthContext = createContext(null);

// Storage key (legacy) — solo lo usa loginAsDemo() mientras exista el bypass.
const USER_KEY = "dkraft_user";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * Mapea una sesión de Supabase Auth + su fila en `profiles` al shape de `user`
 * que consumen los componentes (id, email, displayName, role, areaId, departmentId).
 *
 * El profile se busca por `id` (profiles.id === auth.users.id por FK), con
 * fallback por email por si el trigger handle_new_user no llegó a correr.
 */
const buildUserFromSession = async (session) => {
  if (!session?.user) return null;

  const authUser = session.user;
  let profile = null;

  // 1) Buscar profile por id (camino normal: profiles.id = auth.users.id)
  const { data: byId } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();
  profile = byId;

  // 2) Fallback por email (por si el id no coincide / profile creado a mano)
  if (!profile && authUser.email) {
    const { data: byEmail } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", authUser.email)
      .maybeSingle();
    profile = byEmail;
  }

  return {
    id: authUser.id,
    email: authUser.email,
    displayName:
      profile?.name || authUser.user_metadata?.name || authUser.email,
    role: profile?.role || authUser.user_metadata?.role || "USER",
    // La tabla profiles real no tiene `area`; se mantiene la key por contrato,
    // mapeada a null hasta que exista la columna.
    areaId: profile?.area || null,
    departmentId: profile?.department || null,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hidratar estado desde la sesión persistida por supabase-js + suscribirse
  // a cambios de auth (login/logout/refresh) para mantener el estado vivo.
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Si hay un usuario demo legacy en localStorage, respetarlo (bypass MVP).
        const storedDemo = localStorage.getItem(USER_KEY);
        if (storedDemo) {
          try {
            const parsed = JSON.parse(storedDemo);
            if (parsed?.id === "demo-user") {
              if (mounted) setUser(parsed);
            } else {
              localStorage.removeItem(USER_KEY);
            }
          } catch {
            localStorage.removeItem(USER_KEY);
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          const mapped = await buildUserFromSession(session);
          if (mounted) setUser(mapped);
        }
      } catch (err) {
        console.error("[Auth] init error:", err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const {
      data: { subscription },
    } = auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (session) {
        const mapped = await buildUserFromSession(session);
        if (mounted) setUser(mapped);
      } else {
        // Sin sesión Supabase: limpiar salvo que sea el demo bypass.
        const storedDemo = localStorage.getItem(USER_KEY);
        let isDemo = false;
        try {
          isDemo = storedDemo && JSON.parse(storedDemo)?.id === "demo-user";
        } catch {
          isDemo = false;
        }
        if (!isDemo && mounted) setUser(null);
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      // Auth real contra Supabase. Esto emite el token `authenticated`,
      // de modo que las RLS dejan de salir como `anon`.
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });
      if (signInError) throw signInError;

      const userData = await buildUserFromSession(data.session);
      // onAuthStateChange también lo setea, pero lo hacemos aquí para que el
      // valor esté disponible de inmediato a quien await-ea login().
      setUser(userData);

      console.log("[Auth] Login successful:", userData?.email);
      return userData;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, displayName) => {
    try {
      setError(null);
      setLoading(true);

      // signUp con metadata `name`; el trigger handle_new_user crea la fila
      // en `profiles` (role default 'USER').
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: displayName } },
      });
      if (signUpError) throw signUpError;

      // Si la confirmación de email está OFF, signUp ya devuelve sesión.
      if (data.session) {
        const userData = await buildUserFromSession(data.session);
        setUser(userData);
        return userData;
      }

      // Confirmación de email ON: no hay sesión todavía.
      console.log("[Auth] Registro creado, pendiente de confirmación:", email);
      return null;
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

      // Limpiar el bypass demo si existiera.
      localStorage.removeItem(USER_KEY);

      // Cerrar sesión real (no-op si solo había demo).
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      setUser(null);
      console.log("[Auth] Logout successful");
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // ⚠️ BYPASS MVP — NO USAR EN PRODUCCIÓN.
  // Inyecta un ADMIN falso SIN pasar por Supabase Auth: las queries seguirán
  // saliendo como rol `anon`. Se mantiene SOLO porque aún no hay usuarios reales
  // creados. ELIMINAR junto con el botón demo de Login.jsx al cerrar el RLS.
  const loginAsDemo = () => {
    const demoUser = {
      id: "demo-user",
      email: "demo@dkraft.com",
      displayName: "Usuario Demo",
      role: "ADMIN",
      areaId: null,
      departmentId: null,
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
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
