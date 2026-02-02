# D-KRAFT ERP - Developer Handoff

## Resumen Ejecutivo

**D-KRAFT** (Dovecreek Knowledge-based Resource Assignment & Flow Tracking) es un sistema ERP/MRP especializado en manufactura.

| Stack | Tecnología |
|-------|------------|
| Frontend | React 19 + Vite 7 + Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| API REST | NextAuth en `https://api.dkraft.com.mx/api` |
| Integración | QuickBooks Online (pendiente) |
| Deploy | Netlify (frontend) + Supabase (backend) |

---

## 1. Arquitectura General

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                         │
│  src/components/modules/ → 22 módulos funcionales               │
│  src/context/AuthContext.jsx → Autenticación + Attendance       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE SERVICIOS                            │
│  src/services/api.js → Abstracción Supabase/REST                │
│  src/lib/supabase.js → Cliente Supabase + CRUD helpers          │
│  src/services/quickbooks/index.js → Integración QB (stubs)      │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌──────────────────────┐       ┌──────────────────────┐
│      SUPABASE        │       │     REST API         │
│  PostgreSQL + Auth   │       │  api.dkraft.com.mx   │
│  (PRIMARY)           │       │  (FALLBACK)          │
└──────────────────────┘       └──────────────────────┘
                                        │
                                        ▼
                              ┌──────────────────────┐
                              │   QuickBooks Online  │
                              │   (PENDIENTE)        │
                              └──────────────────────┘
```

---

## 2. Frontend - Estructura de Archivos

```
src/
├── components/
│   ├── auth/                    # Login, Register, ForgotPassword
│   ├── layout/                  # Sidebar, MainLayout
│   ├── common/                  # Componentes reutilizables
│   └── modules/                 # 22 módulos funcionales
│       ├── Dashboard/           # KPIs ejecutivos
│       ├── Staff/               # Gestión de personal
│       ├── StaffDuty/           # Asistencia y turnos
│       ├── Clients/             # Clientes
│       ├── Suppliers/           # Proveedores
│       ├── Materials/           # Inventario de materiales
│       ├── Products/            # Catálogo de productos
│       ├── BOM/                 # Bills of Materials
│       ├── Projects/            # Gestión de proyectos
│       ├── Operations/          # Operaciones de producción
│       ├── Quotations/          # Cotizaciones
│       ├── Requisitions/        # Requisiciones de compra
│       ├── Warehouses/          # Almacenes
│       ├── Categories/          # Categorías
│       ├── Units/               # Unidades de medida
│       ├── Reports/             # Reportes
│       ├── Performance/         # Análisis de rendimiento
│       ├── Quality/             # Control de calidad
│       ├── ProjectAnalysis/     # Análisis de proyectos
│       ├── ActivityLog/         # Log de auditoría
│       └── TopClients/          # Top clientes
├── context/
│   └── AuthContext.jsx          # Estado global de autenticación
├── services/
│   ├── api.js                   # APIs abstractas (924 líneas)
│   └── quickbooks/
│       └── index.js             # Módulo QB con stubs (484 líneas)
├── lib/
│   └── supabase.js              # Cliente Supabase (547 líneas)
├── hooks/
│   ├── useService.js
│   └── useTable.js
├── styles/
│   ├── tailwind.css
│   ├── main.css
│   ├── animations.css
│   └── glassmorphism.css
├── App.jsx                      # Routing principal
└── main.jsx                     # Entry point
```

---

## 3. Backend - Supabase

### 3.1 Tablas Principales

| Tabla | Descripción | Campos QB Sync |
|-------|-------------|----------------|
| `clients` | Clientes | ✅ qb_id, sync_status, sync_error, last_synced_at |
| `suppliers` | Proveedores | ✅ |
| `materials` | Materiales/Inventario | ✅ |
| `products` | Productos | ✅ |
| `quotations` | Cotizaciones | ✅ |
| `quotation_items` | Items de cotización | - |
| `requisitions` | Requisiciones de compra | ✅ |
| `requisition_items` | Items de requisición | - |
| `projects` | Proyectos | - |
| `operations` | Operaciones de producción | - |
| `operation_stages` | Etapas de operación | - |
| `bom` | Bills of Materials | - |
| `bom_components` | Componentes de BOM | - |
| `warehouses` | Almacenes | - |
| `categories` | Categorías | - |
| `units` | Unidades de medida | - |
| `profiles` | Perfiles de usuario | - |
| `attendance` | Registro de asistencia | - |
| `activity_log` | Log de auditoría | - |

### 3.2 Campos de Sincronización QB

Las tablas con sync tienen estos campos:
```sql
qb_id           VARCHAR(50)   -- ID del registro en QuickBooks
sync_status     VARCHAR(20)   -- 'local_only', 'synced', 'pending_push', 'error'
sync_error      TEXT          -- Mensaje de error si falló
last_synced_at  TIMESTAMPTZ   -- Timestamp de última sincronización
```

### 3.3 Conexión Supabase

```javascript
// src/lib/supabase.js
const supabaseUrl = 'https://qalqscfrcxzzvrcvqqbp.supabase.co'
const supabaseAnonKey = 'eyJ...' // En .env
```

---

## 4. Servicios API

### 4.1 Abstracción Dual (Supabase/REST)

El archivo `src/services/api.js` expone APIs que funcionan con Supabase (primary) o REST API (fallback):

```javascript
// Feature flags en .env
VITE_USE_SUPABASE=true   // Usa Supabase como primary
VITE_USE_API=false        // REST API como fallback

// Ejemplo de uso
import { clientsApi, productsApi, quotationsApi } from '../services/api';

// CRUD Operations
await clientsApi.getAll();
await clientsApi.getById(id);
await clientsApi.create(data);
await clientsApi.update(id, data);
await clientsApi.delete(id);

// QuickBooks sync (marca para sync)
await clientsApi.syncToQB(id);
await productsApi.syncToQB(id);
```

### 4.2 APIs Disponibles

| API | Métodos |
|-----|---------|
| `materialsApi` | getAll, getById, create, update, delete, getLowStock, search |
| `productsApi` | getAll, getById, create, update, delete, search, syncToQB |
| `suppliersApi` | getAll, getById, create, update, delete, search |
| `clientsApi` | getAll, getById, create, update, delete, search, syncToQB |
| `warehousesApi` | getAll, getById, create, update, delete, getStock |
| `categoriesApi` | getAll, getById, create, update, delete |
| `unitsApi` | getAll, getById, create, update, delete |
| `requisitionsApi` | getAll, getById, create, update, delete, submit, approve, reject |
| `quotationsApi` | getAll, getById, create, update, delete, sendToQB, addItem |
| `projectsApi` | getAll, getById, create, update, delete, getWithDetails |
| `bomApi` | getAll, getById, create, update, delete, addComponent, calculateCosts |
| `quickbooksApi` | getStatus, syncClients, syncProducts, getQueue |

---

## 5. Autenticación

### 5.1 Flujo de Auth

```javascript
// src/context/AuthContext.jsx
1. Usuario ingresa email/password
2. loginToBackend() → POST /api/auth/login
3. Si OK → guarda user en localStorage
4. attendanceTracker.clockIn() → registra entrada
5. Al logout → attendanceTracker.clockOut()
```

### 5.2 Estructura del User

```javascript
{
  id: 'uuid',
  email: 'user@example.com',
  displayName: 'Nombre',
  role: 'ADMIN' | 'USER' | 'VIEWER',
  areaId: 'uuid',
  departmentId: 'uuid'
}
```

---

## 6. QuickBooks Integration (PENDIENTE)

### 6.1 Estado Actual

| Componente | Estado |
|------------|--------|
| Módulo QB con stubs | ✅ Listo |
| Campos sync en BD | ✅ Listo |
| Credenciales | ⏳ Vacías |
| OAuth 2.0 | ⏳ Pendiente |
| Sync Clientes | ⏳ Pendiente |
| Sync Productos | ⏳ Pendiente |
| Sync Cotizaciones | ⏳ Pendiente |

### 6.2 Archivo Principal

**`src/services/quickbooks/index.js`** (484 líneas con stubs documentados)

### 6.3 Funciones por Implementar

```javascript
// AUTH
getAuthorizationUrl()           // Generar URL OAuth
exchangeCodeForTokens(code, realmId)  // Intercambiar code por tokens
refreshAccessToken()            // Refrescar token expirado
isConnected()                   // Verificar conexión activa
disconnect()                    // Revocar tokens

// SYNC CLIENTES → QB Customers
pushClientToQB(clientId)        // D-KRAFT → QB
pullClientsFromQB()             // QB → D-KRAFT

// SYNC PRODUCTOS → QB Items
pushProductToQB(productId)      // D-KRAFT → QB
pullProductsFromQB()            // QB → D-KRAFT

// SYNC COTIZACIONES → QB Estimates
pushQuotationToQB(quotationId)  // D-KRAFT → QB
convertQuotationToSalesOrder()  // Estimate → Invoice
```

### 6.4 Mapeo de Campos

**Clientes → Customers:**
| D-KRAFT | QuickBooks |
|---------|------------|
| name | DisplayName |
| email | PrimaryEmailAddr.Address |
| phone | PrimaryPhone.FreeFormNumber |
| company | CompanyName |
| address | BillAddr.Line1, City, etc. |

**Productos → Items:**
| D-KRAFT | QuickBooks |
|---------|------------|
| name | Name |
| description | Description |
| price | UnitPrice |
| - | Type: 'NonInventory' o 'Service' |

### 6.5 Credenciales Necesarias

```env
# .env
VITE_QB_CLIENT_ID=              # Obtener de Intuit Developer Portal
VITE_QB_CLIENT_SECRET=          # Obtener de Intuit Developer Portal
VITE_QB_REDIRECT_URI=https://app.dkraft.com.mx/callback/quickbooks
VITE_QB_ENVIRONMENT=sandbox     # 'sandbox' o 'production'
```

### 6.6 Tabla de Tokens (CREAR)

```sql
CREATE TABLE qb_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    realm_id VARCHAR(50) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    access_token_expires_at TIMESTAMPTZ NOT NULL,
    refresh_token_expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Variables de Entorno

```env
# Supabase (CONFIGURADO)
VITE_SUPABASE_URL=https://qalqscfrcxzzvrcvqqbp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Feature Flags
VITE_USE_SUPABASE=true
VITE_USE_API=false

# QuickBooks (PENDIENTE)
VITE_QB_CLIENT_ID=
VITE_QB_CLIENT_SECRET=
VITE_QB_REDIRECT_URI=
VITE_QB_ENVIRONMENT=sandbox
```

---

## 8. Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build producción
npm run build

# Lint
npm run lint

# Tests
npm run test
```

---

## 9. Deploy

### Netlify (Frontend)
- URL: https://app.dkraft.com.mx
- Build: `npm run build`
- Publish: `dist/`

### Supabase (Backend)
- URL: https://qalqscfrcxzzvrcvqqbp.supabase.co
- Dashboard: https://supabase.com/dashboard

---

## 10. Recursos

- [Supabase Docs](https://supabase.com/docs)
- [QuickBooks API](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/account)
- [QB OAuth 2.0](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0)
- [React 19 Docs](https://react.dev)
- [Tailwind CSS 4](https://tailwindcss.com/docs)

---

## 11. Checklist para QuickBooks

- [ ] Crear cuenta en [Intuit Developer Portal](https://developer.intuit.com)
- [ ] Crear app y obtener Client ID/Secret
- [ ] Configurar Redirect URI
- [ ] Crear tabla `qb_tokens` en Supabase
- [ ] Implementar OAuth flow
- [ ] Implementar sync de Clientes
- [ ] Implementar sync de Productos
- [ ] Implementar sync de Cotizaciones
- [ ] Testing en sandbox
- [ ] Migrar a producción

---

## Contacto

Para dudas sobre el proyecto, revisar:
- `QUICKBOOKS_HANDOFF.md` - Detalles específicos de QB
- `src/services/quickbooks/index.js` - Código con TODOs detallados
