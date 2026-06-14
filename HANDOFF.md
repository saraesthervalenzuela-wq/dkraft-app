# D-KRAFT MRP System - Developer Handoff

**Fecha de handoff:** 1 Feb 2026
**Estado:** Frontend 100% completo, Database creada, Backend pendiente

---

## 🚀 INICIO RÁPIDO

```bash
# 1. Clonar e instalar
git clone https://github.com/saraesthervalenzuela-wq/dkraft-app.git
cd dkraft-app/dkraft-app
npm install

# 2. Configurar .env
cp .env.example .env
# Editar con las credenciales de Supabase

# 3. Correr en desarrollo
npm run dev
# Abre http://localhost:5173
```

### Variables de Entorno (.env)
```env
VITE_SUPABASE_URL=https://qalqscfrcxzzvrcvqqbp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhbHFzY2ZyY3h6enZyY3ZxcWJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODUxMjQsImV4cCI6MjA4NTQ2MTEyNH0.nngJeNqoq9yuBiiQYqzw_GOKCNMiPxjFsQusch0rQxo
VITE_API_URL=https://dkraft.com.mx/api
VITE_USE_API=true
```

---

## 📋 RESUMEN DEL PROYECTO

**D-KRAFT** es un sistema MRP (Material Requirements Planning) para manufactura de muebles en Tijuana.

### Flujo de Negocio
```
Cotización → Aprobación → Sales Order → Proyecto → Operaciones → Producción
     ↓            ↓
    QB           QB
(DOVECREEK)  (DOVECREEK)
```

### Entidades de Facturación (CRÍTICO)
| Entidad | QuickBooks | Descripción |
|---------|------------|-------------|
| **DOVECREEK** | ✅ Sincroniza | Facturación USA |
| **INNOVATIVE** | ❌ NO sincroniza | Facturación México |

---

## ✅ LO QUE ESTÁ LISTO

| Componente | Estado | Notas |
|------------|--------|-------|
| **Frontend React** | ✅ 100% | Todos los módulos funcionan |
| **UI/UX** | ✅ Pulido | Glassmorphism, Deep Blue + Orange |
| **Database Schema** | ✅ Ejecutado | 26 tablas en Supabase |
| **API Client** | ✅ Listo | `src/services/api.js` |
| **Supabase Client** | ✅ Listo | `src/lib/supabase.js` |
| **Documentación** | ✅ Completa | Este archivo + diagramas |

---

## 🔧 LO QUE FALTA (TU TRABAJO)

### 1. Backend API (Prioridad ALTA)

El frontend espera una API REST en `https://dkraft.com.mx/api`

**Formato de respuesta esperado:**
```javascript
// Éxito
{
  "success": true,
  "data": { ... },
  "message": "OK"
}

// Error
{
  "success": false,
  "error": "Mensaje de error"
}
```

**Endpoints requeridos:**

#### Auth
```
POST /auth/login     → { email, password } → { token, user }
```

#### CRUD (para cada entidad)
```
GET    /{entity}        → Lista todos
GET    /{entity}/:id    → Obtiene uno
POST   /{entity}        → Crea nuevo
PUT    /{entity}/:id    → Actualiza
DELETE /{entity}/:id    → Elimina
```

**Entidades:** clients, suppliers, materials, products, projects, quotations, requisitions, operations, warehouses, categories, units, bom

#### Workflows Especiales
```
POST /quotations/:id/send              → Enviar a cliente (status: SENT)
POST /quotations/:id/approve           → Aprobar (status: APPROVED)
POST /quotations/:id/reject            → Rechazar (status: REJECTED)
POST /quotations/:id/create-sales-order → Convertir a Sales Order
POST /quotations/:id/send-to-qb        → Sincronizar con QuickBooks

POST /requisitions/:id/submit          → Enviar para aprobación
POST /requisitions/:id/approve         → Aprobar
POST /requisitions/:id/reject          → Rechazar
```

#### QuickBooks (si aplica)
```
GET  /quickbooks/status         → Estado de conexión
POST /quickbooks/sync/clients   → Sincronizar clientes
POST /clients/:id/sync-qb       → Sync cliente individual
GET  /quickbooks/queue          → Cola de sincronización
POST /quickbooks/queue/retry-failed → Reintentar fallidos
```

### 2. Deploy Frontend (Prioridad ALTA)

```bash
# Build
npm run build

# Deploy a Vercel
vercel --prod

# O cualquier hosting estático (Netlify, etc.)
```

**Variables en producción:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_API_URL`
- `VITE_USE_API=true`

### 3. QuickBooks Integration (Prioridad MEDIA)

Solo entidades con `billing_entity = 'DOVECREEK'` sincronizan.

Campos QB en tablas:
- `qb_customer_id` - ID del Customer en QB
- `qb_item_id` - ID del Item en QB
- `qb_estimate_id` - ID del Estimate
- `qb_sales_order_id` - ID del Sales Order
- `sync_status` - Estado de sync
- `skip_qb_sync` - Flag para omitir sync

---

## 🗄️ BASE DE DATOS

### Supabase Project
- **URL:** https://qalqscfrcxzzvrcvqqbp.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/qalqscfrcxzzvrcvqqbp

### Tablas Creadas (26)

| Grupo | Tablas |
|-------|--------|
| **Catálogos** | categories, units, warehouses, warehouse_sections |
| **Entidades** | clients, suppliers, materials, products |
| **Documentos** | quotations, quotation_items, requisitions, requisition_items |
| **Proyectos** | projects |
| **Producción** | operations, operation_stages, operation_materials, bom, bom_components |
| **Calidad** | quality_inspections |
| **Inventario** | stock_movements |
| **Staff** | profiles, attendance, performance_metrics |
| **Sistema** | activity_log, settings, qb_sync_queue |

### Archivos de Schema
```
database/
├── schema.sql           ← SQL completo (997 líneas)
└── SCHEMA_DIAGRAM.md    ← Diagramas ER en Mermaid
```

### Relaciones Principales
```
clients ─────┬──► quotations ──► quotation_items
             │
             ├──► requisitions ──► requisition_items
             │
             └──► projects ──► operations ──► operation_stages
                                    │
                                    └──► operation_materials

products ──► bom ──► bom_components ──► materials

materials ◄── suppliers
materials ◄── categories
materials ◄── units
materials ◄── warehouses
```

---

## 📁 ESTRUCTURA DEL PROYECTO

```
dkraft-app/
├── database/
│   ├── schema.sql              ← ⭐ SQL completo
│   └── SCHEMA_DIAGRAM.md       ← ⭐ Diagramas ER
├── src/
│   ├── components/
│   │   ├── common/             ← Componentes reutilizables
│   │   │   ├── Icon.jsx        ← Material Symbols wrapper
│   │   │   ├── Modal.jsx       ← Modal universal
│   │   │   └── SearchBox.jsx
│   │   ├── layout/
│   │   │   └── Sidebar.jsx     ← Navegación principal
│   │   └── modules/            ← ⭐ Módulos de la app
│   │       ├── Clients/
│   │       ├── Suppliers/
│   │       ├── Materials/
│   │       ├── Products/
│   │       ├── Quotations/     ← Cotizaciones + QB
│   │       ├── Requisitions/   ← Sales Orders + QB
│   │       ├── Projects/
│   │       ├── Operations/
│   │       ├── BOM/
│   │       ├── Warehouses/
│   │       ├── Categories/
│   │       ├── Units/
│   │       ├── Staff/
│   │       ├── Quality/
│   │       ├── Performance/
│   │       ├── Reports/
│   │       ├── ActivityLog/
│   │       └── ProjectAnalysis/
│   ├── lib/
│   │   └── supabase.js         ← ⭐ Cliente Supabase
│   ├── services/
│   │   └── api.js              ← ⭐ Cliente API (endpoints)
│   ├── context/
│   │   └── AuthContext.jsx     ← Autenticación
│   ├── styles/
│   │   └── main.css            ← ⭐ Todos los estilos (23K+ líneas)
│   └── App.jsx
├── HANDOFF.md                  ← Este archivo
└── package.json
```

---

## 🎨 DISEÑO VISUAL

### Colores
```css
--primary: #0033b3;      /* Deep Blue */
--accent: #d35400;       /* Electric Orange */
--background: #0a0a1a;   /* Dark background */
--surface: rgba(255,255,255,0.05); /* Glassmorphism */
```

### Iconos
Usar componente `<Icon name="xxx" />` con Material Symbols Rounded.

```jsx
import { Icon } from '../../common';

<Icon name="edit" />
<Icon name="delete" />
<Icon name="check_circle" />
```

**NO usar react-icons** - Todo el proyecto usa Material Symbols.

---

## 🔌 CÓMO FUNCIONAN LOS SERVICIOS

### API Custom (`src/services/api.js`)

```javascript
import { isApiEnabled, clientsApi, quotationsApi } from '../services/api';

// Verificar si API está habilitada
if (isApiEnabled()) {
    // CRUD
    const clients = await clientsApi.getAll();
    const client = await clientsApi.getById(id);
    const newClient = await clientsApi.create(data);
    await clientsApi.update(id, data);
    await clientsApi.delete(id);

    // QuickBooks
    await clientsApi.syncToQB(id);
    await quotationsApi.sendToQB(id, 'ESTIMATE');

    // Workflows
    await quotationsApi.createSalesOrder(id);
    await requisitionsApi.approve(id, notes);
}
```

### Supabase Directo (`src/lib/supabase.js`)

```javascript
import { db, auth, clientsService } from '../lib/supabase';

// Auth
await auth.signIn(email, password);
await auth.signOut();

// CRUD genérico
const items = await db.getAll('clients');
const item = await db.getById('clients', id);
await db.create('clients', data);
await db.update('clients', id, data);
await db.delete('clients', id);

// Servicios específicos
await clientsService.getPendingSync();
await materialsService.getLowStock();
await bomService.calculateCosts(id);
```

---

## 🔄 FLUJOS DE STATUS

### Quotations
```
DRAFT → SENT → APPROVED → CONVERTED
              ↘ REJECTED
```

### Requisitions (Sales Orders)
```
DRAFT → PENDING_APPROVAL → APPROVED → ORDERED → PARTIALLY_FULFILLED → FULFILLED
                         ↘ REJECTED
```

### Operations
```
pending → scheduled → in_progress → quality_check → completed
                    ↘ on_hold ↗
```

---

## 🧪 TESTING

```bash
# Verificar que el frontend compila
npm run build

# Preview del build
npm run preview

# Verificar conexión a Supabase
# En la consola del navegador:
import { supabase } from './lib/supabase'
await supabase.from('clients').select('*').limit(1)
```

---

## 📞 CONTACTO

Si tienes dudas sobre:
- **Frontend/React:** Revisa los módulos en `src/components/modules/`
- **API esperada:** Revisa `src/services/api.js`
- **Database:** Revisa `database/schema.sql` y `database/SCHEMA_DIAGRAM.md`
- **Estilos:** Revisa `src/styles/main.css`

---

## 📝 NOTAS FINALES

1. **El frontend está 100% listo** - No necesita cambios
2. **La base de datos está creada** - 26 tablas en Supabase
3. **Solo falta el backend API** - En `https://dkraft.com.mx/api`
4. **QuickBooks solo para DOVECREEK** - INNOVATIVE no sincroniza
5. **Usar Material Symbols** - NO react-icons

---

*Última actualización: 1 Feb 2026*
