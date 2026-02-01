# HANDOFF - D-KRAFT App

**Fecha:** 1 Feb 2026
**Estado:** ✅ FUNCIONANDO

---

## Resumen

Se restauró el diseño **Deep Blue + Orange con Glassmorphism** y se removió Firebase que estaba causando crashes.

---

## El Problema (Firebase)

**Quién lo causó:** Sara Esther Valenzuela (`saraesthervalenzuela@gmail.com`)
**Cuándo:** 25 de Diciembre 2025
**Commit:** `b051ad6` - "Autenticacion de inicio de sesion, ajuste en campos de materiales"

Firebase requería credenciales en `.env` que no existían, causando:
```
Firebase configuration missing. Please check your .env file.
Uncaught FirebaseError: Firebase: Error (auth/invalid-api-key)
```

---

## La Solución

1. **Eliminado Firebase** - Los archivos `src/firebase/config.js`, `auth.js`, `firestore.js`, `storage.js` fueron eliminados
2. **Supabase activo** - El archivo `src/firebase/index.js` ahora es un compatibility layer que usa Supabase
3. **CSS restaurado** - `src/styles/main.css` del commit `a55bc7a` (Deep Blue + Orange + Glassmorphism)

---

## Configuración Supabase

Archivo `.env`:
```
VITE_SUPABASE_URL=https://qalqscfrcxzzvrcvqqbp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Commits Importantes

| Commit | Descripción |
|--------|-------------|
| `962c9f0` | ✅ Estado actual funcional (Deep Blue/Orange + Supabase) |
| `a55bc7a` | CSS original con diseño naranja/glassmorphism |
| `b051ad6` | ⚠️ Donde se introdujo Firebase (NO USAR) |

---

## Para Desarrollar

```bash
cd /Users/concepcion/Documents/GitHub/dkraft-app/dkraft-app
npm run dev
# Abrir http://localhost:5173/
```

---

## IMPORTANTE

⚠️ **NO volver a añadir Firebase** - El proyecto usa **Supabase**
⚠️ **Preservar el commit `962c9f0`** - Es el estado funcional
⚠️ **El CSS naranja viene del commit `a55bc7a`** - Si se pierde, restaurar de ahí
