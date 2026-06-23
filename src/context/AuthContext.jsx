import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase, auth } from "../lib/supabase";
import { isRecovery, onRecovery } from "../lib/recoveryFlag";

const AuthContext = createContext(null);

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
  // Modo recuperación de contraseña: activo cuando el usuario llega desde el
  // enlace del correo. Fuerza la pantalla de "nueva contraseña" aunque ya haya
  // sesión (el token de recovery crea una sesión válida automáticamente).
  // Se inicializa con la detección capturada en carga (recoveryFlag) — fuente
  // fiable porque lee la URL antes de que supabase la limpie. Si el evento
  // PASSWORD_RECOVERY llega después de montar, onRecovery() lo propaga.
  const [recoveryMode, setRecoveryMode] = useState(() => isRecovery());

  // Hidratar estado desde la sesión persistida por supabase-js + suscribirse
  // a cambios de auth (login/logout/refresh) para mantener el estado vivo.
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // Limpieza one-shot del bypass demo legacy (ya no se usa).
        localStorage.removeItem("dkraft_user");

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

    // Respaldo: si recoveryFlag detecta el evento PASSWORD_RECOVERY (incluso si
    // llegó antes de montar este efecto), activa el modo recuperación.
    const unsubRecovery = onRecovery(() => {
      if (mounted) setRecoveryMode(true);
    });

    const {
      data: { subscription },
    } = auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      // El usuario abrió el enlace de recuperación del correo. Marcamos el modo
      // recovery (set de estado síncrono, sin tocar supabase) para que el
      // AuthWrapper muestre la pantalla de nueva contraseña en vez del dashboard.
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      }

      // IMPORTANTE: el callback NO debe ser async ni await-ear llamadas a
      // supabase aquí dentro. supabase-js retiene el auth lock (navigator.locks)
      // mientras corre el callback, y cualquier query (que internamente pide el
      // token vía getSession) intentaría tomar el MISMO lock → deadlock, dejando
      // la app colgada en "Cargando..." al refrescar. Diferimos con setTimeout(0)
      // para que el callback retorne y libere el lock antes de tocar la DB.
      setTimeout(async () => {
        if (!mounted) return;
        try {
          if (session) {
            const mapped = await buildUserFromSession(session);
            if (mounted) setUser(mapped);
          } else {
            // Sin sesión Supabase: limpiar usuario.
            if (mounted) setUser(null);
          }
        } catch (err) {
          console.error("[Auth] onAuthStateChange error:", err.message);
        } finally {
          // Garantiza que el gate de carga se libere aunque init() se cruce.
          if (mounted) setLoading(false);
        }
      }, 0);
    });

    return () => {
      mounted = false;
      unsubRecovery();
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

      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;

      setUser(null);
      console.log("[Auth] Logout successful");
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Actualiza la contraseña del usuario actual en Supabase Auth. Requiere una
  // sesión válida (la que crea el enlace de recuperación cumple ese requisito).
  const updatePassword = useCallback(async (newPassword) => {
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (updateError) throw updateError;
  }, []);

  // Sale del flujo de recuperación. Como updateUser deja una sesión activa, al
  // salir el AuthWrapper renderiza el dashboard directamente.
  const exitPasswordRecovery = useCallback(() => setRecoveryMode(false), []);

  const clearError = () => setError(null);

  const value = {
    user,
    loading,
    error,
    recoveryMode,
    login,
    register,
    logout,
    updatePassword,
    exitPasswordRecovery,
    clearError,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
