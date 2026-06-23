# D-KRAFT ERP/MRP — Estado del Proyecto y Pendientes

**Fecha:** 2026-06-23
**Branch de referencia:** `main` @ `5171f0b`
**Stack:** React 19 + Vite 7 + Tailwind 4 · Supabase (PostgreSQL + Auth) · Deploy Netlify
**Estado general:** MVP funcional. NO en producción todavía (pendiente cierre de seguridad).

---

## 1. Cómo correr el proyecto

```bash
npm install
npm run dev        # http://localhost:5173 (o el puerto que asigne Vite)
```

Requisitos de entorno (`.env` en la raíz):

```env
VITE_SUPABASE_URL=https://qalqscfrcxzzvrcvqqbp.supabase.co
VITE_SUPABASE_ANON_KEY=...
VITE_USE_SUPABASE=true
VITE_USE_API=false
```

> El `.env` NO va en git (gitignored). Se copia aparte.
> `npm run build` puede colgarse si el repo vive en una carpeta de sincronización
> (iCloud/Dropbox). Para builds de producción usar Netlify CI, no build local.

---

## 2. Estructura del repo (aplanada)

La estructura se **aplanó** recientemente: el código ya NO vive en el subdir anidado
`dkraft-app/dkraft-app/src/`, ahora está directo en la raíz del repo:

```
/
├── src/                  ← app (componentes, módulos, services, hooks, lib)
├── public/
├── database/             ← schema.sql + diagramas
├── supabase/migrations/  ← migraciones SQL
├── docs/                 ← handoffs + este documento
├── package.json
├── index.html
└── vite.config.js
```

---

## 3. Integrado recientemente

Últimos cambios mergeados a `main` (hasta `5171f0b`):

- **Aplanamiento de la estructura** del repo (salió del doble anidado).
- **Módulo Work Centers** (`src/components/modules/WorkCenters/`).
- **Conector QuickBooks** (`src/services/quickbooksConnector.js`).
- **Sync condicional a QuickBooks** en Clients / Materials / Products / Suppliers
  (respeta la regla de billing entity: solo `DOVECREEK` sincroniza, `INNOVATIVE` no).
- **Projects:** selección de cliente desde la tabla `clients` (dropdown + `client_id`).
- **Products:** categoría opcional al crear/editar.
- **Auth:** ventanas de **Reset Password** (`src/components/auth/ResetPassword.jsx`).
- **RLS:** fix de nombre de tabla `departments` + migración
  `supabase/migrations/20260613_enable_rls_authenticated.sql`.
- **Scroll infinito** en Materials, Products, Quality y BOM (adiós paginación).
- **Settings** + placeholder **QB Health**.

---

## 4. Pendientes (en orden de prioridad)

### 🔴 Seguridad — bloqueante para producción

Referencia: `docs/AUDITORIA-ACCESO-Y-SEGURIDAD-2026-06-04.md`.

- [ ] **Verificar que la migración `20260613_enable_rls_authenticated.sql`
      esté aplicada en Supabase prod** (habilita RLS + políticas `authenticated`).
- [ ] **Confirmar que el login real (Supabase Auth)** esté cableado y desplegado
      (`AuthContext` debe usar `supabase.auth.signInWithPassword`, no el backend
      fantasma `api.dkraft.com.mx`).
- [ ] **Cerrar el acceso `anon`** una vez que el login real funcione (hoy la `anon
    key` da CRUD total a la base — aceptable solo mientras sea MVP).
- [ ] **Rotar la `anon key`** y actualizar en Netlify + redeploy.
- [ ] **Quitar `loginAsDemo()`** (bypass MVP que inyecta un ADMIN falso).
- [ ] Restringir PII en `profiles` (que un USER no vea email/rol de todos).

### 🟡 QuickBooks

- [ ] La integración es **solo stubs** (`src/services/quickbooks/index.js` +
      `quickbooksConnector.js`). Falta OAuth 2.0 real, tabla `qb_tokens`, y el
      push/pull real de Clients / Products / Estimates.
- [ ] Credenciales QB vacías (Intuit Developer Portal pendiente).
- Detalle: `QUICKBOOKS_HANDOFF.md` y `DEVELOPER_HANDOFF.md`.

### 🟡 Usuarios

- [ ] Activar `avaladez@innovativemillwkmex.com` (cuenta sin confirmar / sin password
      usable). Ojo: existen DOS cuentas Avaladez distintas (dovecreek vs innovative).

### 🟢 Mantenimiento

- [ ] **11 vulnerabilidades de npm** (1 low, 4 moderate, 6 high) — revisar cuáles son
      reales/críticas antes de `npm audit fix` (puede romper dependencias).
- [ ] Limpieza de repo: archivos legacy fuera del árbol git, `supabase/.temp/` al
      `.gitignore`.
- [ ] Acceso GitHub: `devscali` tiene write pero NO admin (admin solo lo tiene Sara).

---

## 5. Infraestructura y accesos

| Recurso         | Detalle                                                                    |
| --------------- | -------------------------------------------------------------------------- |
| **Supabase**    | Proyecto `qalqscfrcxzzvrcvqqbp` (West US / Oregon). Control total.         |
| **Netlify**     | Sitio `d-kraft` → `https://d-kraft.netlify.app`. Control total.            |
| **GitHub**      | `saraesthervalenzuela-wq/dkraft-app` — `devscali` con write (admin: Sara). |
| **Dominio**     | `dkraft.com.mx` apunta a un droplet aparte (NO es el Netlify).             |
| **Datos vivos** | clients≈258, products≈76, categories≈64, operations≈33 (al 2026-06-04).    |

### Reglas de negocio clave

- **Billing entities:** `DOVECREEK` (USA) sincroniza con QuickBooks · `INNOVATIVE`
  (México) NO sincroniza.
- **Flujo MRP:** Cotización → Aprobación → Sales Order → Proyecto → Operaciones →
  Producción.
- **UI:** Material Symbols Rounded (NO react-icons). Deep Blue `#0033b3` + Electric
  Orange `#d35400`, glassmorphism dark-first. Detalle: `docs/ELENA_UI_UX_APRENDIZAJES.md`.

---

## 6. Ramas

| Rama                                    | Notas                                            |
| --------------------------------------- | ------------------------------------------------ |
| `main`                                  | Rama de integración. Estado actual.              |
| `release-fixes-alba`                    | Fixes de feedback de Alba (ya mergeados a main). |
| `carlos`                                | Mismo set de fixes que release-fixes-alba.       |
| `staging`                               | Histórica (5 meses).                             |
| `feature/operations-supabase-migration` | Histórica (3 meses).                             |

---

_Documento de estado generado por el equipo CaliDevs — 2026-06-23._
