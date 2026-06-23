/**
 * Detección robusta del flujo de recuperación de contraseña.
 *
 * Cuando el usuario abre el enlace del correo, aterriza con el token de recovery
 * en la URL. supabase-js procesa la URL, crea la sesión y LIMPIA el hash de forma
 * asíncrona, emitiendo `PASSWORD_RECOVERY` dentro de un setTimeout(0) que puede
 * dispararse antes de que React suscriba su listener (carrera → evento perdido).
 *
 * Para no depender de esa carrera usamos DOS señales, ambas capturadas lo antes
 * posible (este módulo se importa de primero en main.jsx):
 *   1. Lectura directa de la URL (`type=recovery` en hash o query) al cargar.
 *   2. Suscripción TEMPRANA a onAuthStateChange para atrapar PASSWORD_RECOVERY
 *      aunque se emita antes de que monte React.
 *
 * AuthContext consume `isRecovery()` (estado inicial) y `onRecovery()` (para
 * enterarse si el evento llega después de montar).
 */
import { supabase } from './supabase';

// Snapshot de la URL en el instante de carga, antes de que supabase la limpie.
const initialHref =
  typeof window !== 'undefined' ? window.location.href : '';

const hasRecoveryParam = () => {
  if (typeof window === 'undefined') return false;
  const { hash, search } = window.location;
  return /type=recovery/.test(hash) || /type=recovery/.test(search);
};

let recoveryDetected = hasRecoveryParam();
const subscribers = new Set();

const markRecovery = (origin) => {
  if (!recoveryDetected) {
    // eslint-disable-next-line no-console
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

// Diagnóstico: deja ver en consola qué URL llegó y si se detectó recovery.
// eslint-disable-next-line no-console
console.info(
  '[recovery] URL inicial:',
  initialHref,
  '| recovery por URL:',
  recoveryDetected,
);

// Suscripción temprana (carga de módulo) para ganarle al setTimeout(0) de supabase.
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') markRecovery('evento');
  });
}

export const isRecovery = () => recoveryDetected;

export const onRecovery = (cb) => {
  subscribers.add(cb);
  if (recoveryDetected) cb(); // ya detectado antes de suscribirse
  return () => subscribers.delete(cb);
};

// Compat: estado inicial síncrono para quien lo prefiera.
export const cameFromRecoveryLink = recoveryDetected;
