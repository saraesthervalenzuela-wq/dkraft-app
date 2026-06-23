/**
 * Detección del flujo de recuperación de contraseña (y de sus errores).
 *
 * Al abrir el enlace del correo, supabase redirige a la app con el resultado en
 * el hash de la URL:
 *   - Éxito:  #access_token=...&type=recovery   → mostramos el form de cambio.
 *   - Error:  #error=access_denied&error_code=otp_expired&error_description=...
 *             (enlace expirado / ya usado) → mostramos un aviso para pedir otro.
 *
 * supabase procesa y LIMPIA ese hash de forma asíncrona, así que leemos la URL
 * UNA sola vez al cargar este módulo (importado de primero en main.jsx), antes
 * de que se borre. Como respaldo extra para la condición de carrera, también nos
 * suscribimos temprano al evento PASSWORD_RECOVERY.
 */
import { supabase } from './supabase';

const readParams = () => {
  if (typeof window === 'undefined') {
    return { isRecovery: false, error: null };
  }
  const rawHash = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const fromHash = new URLSearchParams(rawHash);
  const fromSearch = new URLSearchParams(window.location.search);
  const get = (k) => fromHash.get(k) || fromSearch.get(k);

  const isRecovery = get('type') === 'recovery';

  const errorCode = get('error_code');
  const errorDesc = get('error_description');
  const errorRaw = get('error');
  const hasError = Boolean(errorCode || errorDesc || errorRaw);
  const error = hasError
    ? {
        code: errorCode || errorRaw || 'unknown',
        description: errorDesc
          ? decodeURIComponent(errorDesc.replace(/\+/g, ' '))
          : 'El enlace de recuperación no es válido o ya expiró.',
      }
    : null;

  return { isRecovery, error };
};

const initialHref = typeof window !== 'undefined' ? window.location.href : '';
const parsed = readParams();

let recoveryDetected = parsed.isRecovery;
export const recoveryError = parsed.error;

const subscribers = new Set();

const markRecovery = (origin) => {
  if (!recoveryDetected) {
    console.info('[recovery] detectado vía', origin);
  }
  recoveryDetected = true;
  subscribers.forEach((cb) => {
    try {
      cb();
    } catch {
      /* noop */
    }
  });
};

// Diagnóstico: deja ver en consola qué URL llegó y qué se detectó.
console.info(
  '[recovery] URL inicial:',
  initialHref,
  '| recovery por URL:',
  recoveryDetected,
  '| error:',
  parsed.error ? parsed.error.code : 'ninguno',
);

// Suscripción temprana para ganarle al setTimeout(0) con que supabase emite
// PASSWORD_RECOVERY durante su inicialización.
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') markRecovery('evento');
  });
}

// ¿Debemos mostrar la pantalla de recuperación? Sí si hubo éxito (type=recovery)
// o si llegó un error de enlace (para avisar en vez de caer al dashboard).
export const isRecovery = () => recoveryDetected;
export const shouldShowRecovery = () => recoveryDetected || Boolean(recoveryError);

export const onRecovery = (cb) => {
  subscribers.add(cb);
  if (recoveryDetected) cb(); // ya detectado antes de suscribirse
  return () => subscribers.delete(cb);
};

// Limpia el hash de auth de la URL para que un refresh no reactive el flujo de
// recuperación. Los tokens/errores del flujo implicit viven en el hash.
export const clearRecoveryFromUrl = () => {
  if (typeof window === 'undefined' || !window.location.hash) return;
  window.history.replaceState(
    null,
    '',
    window.location.pathname + window.location.search,
  );
};
