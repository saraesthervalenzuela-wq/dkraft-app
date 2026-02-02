# D-KRAFT MRP System - Documentación Completa

**Última actualización:** 1 Feb 2026
**Estado:** MVP en desarrollo

---

## 1. RESUMEN DEL PROYECTO

D-KRAFT es un sistema MRP (Material Requirements Planning) para una empresa de manufactura de muebles/carpintería en Tijuana. Maneja el flujo completo desde cotizaciones hasta producción.

### Flujo de Negocio
```
Cotización → Aprobación → Sales Order → Proyecto → Operaciones → Producción
```

### Entidades de Facturación (IMPORTANTE)
| Entidad | QuickBooks Sync | Descripción |
|---------|-----------------|-------------|
| **DOVECREEK** | ✅ SÍ sincroniza | Dovecreek Maquila - Facturación USA |
| **INNOVATIVE** | ❌ NO sincroniza | Innovative Mx - Facturación México |

---

## 2. TECH STACK

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite 7 |
| Estilos | CSS puro (main.css 23K+ líneas) |
| Backend 1 | Supabase (PostgreSQL directo) |
| Backend 2 | API Custom (https://dkraft.com.mx/api) |
| Auth | Supabase Auth + JWT API |
| QuickBooks | Integración via API Custom |
| Hosting | Pendiente (Vercel recomendado) |

### Diseño Visual
- **Colores**: Deep Blue (#0033b3) + Electric Orange (#d35400)
- **Estilo**: Glassmorphism con blur y transparencias
- **Iconos**: Material Symbols Rounded (Google)

---

## 3. ARQUITECTURA DE BACKEND (DOS SISTEMAS)

### Sistema 1: Supabase (Acceso Directo)
**Archivo:** `src/lib/supabase.js`
**Uso:** CRUD simple, auth, realtime

```javascript
import { db, auth, clientsService } from '../lib/supabase'

// Auth
await auth.signIn(email, password)
await auth.signOut()

// CRUD genérico
await db.getAll('tabla')
await db.create('tabla', data)
await db.update('tabla', id, data)
await db.delete('tabla', id)

// Servicios específicos
await clientsService.getAll()
await materialsService.create(data)
```

### Sistema 2: API Custom (https://dkraft.com.mx/api)
**Archivo:** `src/services/api.js`
**Uso:** Lógica de negocio, QuickBooks, MRP, workflows

```javascript
import { api, isApiEnabled } from '../services/api'

// Verificar si API está habilitada
if (isApiEnabled()) {
    const clients = await api.clients.getAll()
}

// QuickBooks sync
await api.clients.syncToQB(clientId)
await api.quotations.sendToQB(quoteId, 'ESTIMATE')

// Workflows
await api.requisitions.approve(id, notes)
await api.quotations.createSalesOrder(id)

// MRP
await api.mrp.calculateRequirements(quotationId)
await api.mrp.getShortages()
```

### Configuración .env
```env
# Supabase (siempre activo)
VITE_SUPABASE_URL=https://qalqscfrcxzzvrcvqqbp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...

# API Custom (opcional)
VITE_API_URL=https://dkraft.com.mx/api
VITE_USE_API=true  # false para usar solo Supabase
```

---

## 4. QUICKBOOKS INTEGRATION

### Endpoints QuickBooks (`src/services/api.js`)

```javascript
// Status y cola
api.quickbooks.getStatus()           // Estado de conexión QB
api.quickbooks.getQueue()            // Cola de sync pendientes
api.quickbooks.retryFailed()         // Reintentar fallidos
api.quickbooks.getAccounts()         // Cuentas de QB

// Sync manual por entidad
api.quickbooks.syncClients()         // Sync todos los clientes
api.quickbooks.syncProducts()        // Sync todos los productos
api.quickbooks.syncMaterials()       // Sync todos los materiales

// Sync individual
api.clients.syncToQB(id)             // Sync cliente específico
api.products.syncToQB(id)            // Sync producto específico
api.quotations.sendToQB(id, type)    // Enviar cotización a QB
```

### Lógica de Sync por billingEntity

```javascript
// En Quotations/Requisitions
if (quotation.billingEntity === 'DOVECREEK') {
    // ✅ Sincroniza con QuickBooks
    await api.quotations.sendToQB(id, 'ESTIMATE')
} else {
    // ❌ INNOVATIVE - No sincroniza
}
```

### Flujo Cotización → QuickBooks

1. Usuario crea cotización con `billingEntity: 'DOVECREEK'`
2. Status cambia a SENT → Se puede enviar a QB como Estimate
3. Cliente aprueba → Status APPROVED
4. Se crea Sales Order → `api.quotations.createSalesOrder(id)`
5. Sales Order se sincroniza automáticamente a QB

---

## 5. ESTRUCTURA DEL PROYECTO

```
src/
├── components/
│   ├── common/              # Componentes reutilizables
│   │   ├── Icon.jsx         # Material Symbols wrapper
│   │   ├── Modal.jsx        # Modal universal
│   │   ├── SearchBox.jsx    # Búsqueda
│   │   └── ...
│   ├── layout/
│   │   └── Sidebar.jsx      # Navegación
│   └── modules/             # Módulos de la app
│       ├── Clients/
│       ├── Suppliers/
│       ├── Materials/
│       ├── Products/
│       ├── Projects/
│       ├── Quotations/      # ⚠️ localStorage + QB
│       ├── Requisitions/    # ⚠️ localStorage (Sales Orders)
│       ├── Operations/
│       ├── BOM/
│       ├── Staff/
│       ├── Warehouses/
│       ├── Categories/
│       ├── Units/
│       ├── Reports/
│       ├── Quality/
│       ├── Performance/
│       ├── ActivityLog/
│       └── ProjectAnalysis/
├── data/
│   └── initialData.js       # Nav + datos fallback
├── lib/
│   └── supabase.js          # ⭐ Cliente Supabase completo
├── services/
│   └── api.js               # ⭐ API Custom + QuickBooks
├── hooks/
│   └── useService.js        # Hook para servicios
└── styles/
    └── main.css             # ⭐ Todos los estilos
```

---

## 6. APIs DISPONIBLES (src/services/api.js)

### CRUD Estándar (todas las entidades)
```javascript
api.{entidad}.getAll(params)
api.{entidad}.getById(id)
api.{entidad}.create(data)
api.{entidad}.update(id, data)
api.{entidad}.delete(id)
```

### APIs por Módulo

| API | Métodos Especiales |
|-----|-------------------|
| `api.materials` | `getStock()`, `updateStock()`, `getLowStock()`, `getByCategory()` |
| `api.products` | `syncToQB()` |
| `api.clients` | `syncToQB()`, `getQuotations()`, `getRequisitions()` |
| `api.suppliers` | `getMaterials()` |
| `api.warehouses` | `getSections()`, `createSection()`, `getStock()` |
| `api.quotations` | `sendToClient()`, `approve()`, `reject()`, `sendToQB()`, `createSalesOrder()` |
| `api.requisitions` | `submit()`, `approve()`, `reject()`, `cancel()` |
| `api.projects` | `getRequisitions()`, `getQuotations()` |
| `api.bom` | `addComponent()`, `calculateCosts()`, `checkStock()` |
| `api.mrp` | `calculateRequirements()`, `generateRequisition()`, `getShortages()` |
| `api.operations` | `updateStage()`, `getByProject()`, `getByStatus()` |
| `api.quality` | `getByOperation()`, `getStats()` |
| `api.performance` | `getByStaff()`, `getByPeriod()`, `getAlerts()` |
| `api.reports` | `getDashboardKPIs()`, `getInventoryValue()`, `getQBSyncStatus()` |
| `api.quickbooks` | `getStatus()`, `syncClients()`, `getQueue()`, `retryFailed()` |

---

## 7. MÓDULOS Y SU ESTADO

| Módulo | Backend | QB Sync | Estado |
|--------|---------|---------|--------|
| Clients | API + Supabase | ✅ | Funcional |
| Suppliers | API + Supabase | ❌ | Funcional |
| Materials | API + Supabase | ✅ | Funcional |
| Products | API + Supabase | ✅ | Funcional |
| Projects | API + Supabase | ❌ | Funcional |
| **Quotations** | ⚠️ localStorage | ✅ | **Pendiente migrar** |
| **Requisitions** | ⚠️ localStorage | ✅ | **Pendiente migrar** |
| Operations | API + Supabase | ❌ | Funcional |
| BOM | API + Supabase | ❌ | Funcional |
| Warehouses | API + Supabase | ❌ | Funcional |
| Staff | Supabase | ❌ | Funcional |
| Quality | API | ❌ | Funcional |
| Performance | API | ❌ | Funcional |

---

## 8. TABLAS SUPABASE

```sql
-- Principales
clients          -- Clientes (con sync_status para QB)
suppliers        -- Proveedores
materials        -- Materiales/inventario
products         -- Productos terminados
projects         -- Proyectos

-- Documentos
quotations       -- Cotizaciones
quotation_items  -- Items de cotización
requisitions     -- Sales Orders
requisition_items

-- Producción
operations       -- Órdenes de trabajo
operation_stages -- Etapas de producción
operation_materials
bom              -- Bill of Materials
bom_components

-- Catálogos
warehouses
categories
units

-- Staff
profiles
attendance

-- Sistema
activity_log
```

---

## 9. CÓMO USAR LOS SERVICIOS

### Patrón en módulos (ejemplo Clients)

```javascript
import { useState, useEffect } from 'react';
import { isApiEnabled, clientsApi } from '../../../services/api';

const ClientsModule = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            if (isApiEnabled()) {
                try {
                    const data = await clientsApi.getAll();
                    setClients(data);
                } catch (error) {
                    console.error('Error:', error);
                }
            }
            setLoading(false);
        };
        loadData();
    }, []);

    const handleSyncToQB = async (clientId) => {
        await clientsApi.syncToQB(clientId);
        // Refresh data
    };
};
```

### Patrón para Quotations con QB

```javascript
const handleSendToQB = async (quotation) => {
    if (quotation.billingEntity === 'DOVECREEK') {
        await quotationsApi.sendToQB(quotation.id, 'ESTIMATE');
        // Update local state
    }
};

const handleConvertToSalesOrder = async (quotationId) => {
    const salesOrder = await quotationsApi.createSalesOrder(quotationId);
    // salesOrder se crea y sincroniza automáticamente
};
```

---

## 10. PENDIENTES MVP

### Prioridad Alta
- [ ] Migrar Quotations de localStorage a API
- [ ] Migrar Requisitions de localStorage a API
- [ ] Verificar endpoints de API funcionando
- [ ] Deploy a producción

### Prioridad Media
- [ ] Probar sync QuickBooks completo
- [ ] Exportar reportes a PDF
- [ ] Code splitting para bundle

### Prioridad Baja
- [ ] PWA móvil
- [ ] Notificaciones push

---

## 11. COMANDOS

```bash
# Desarrollo
npm run dev          # http://localhost:5173

# Producción
npm run build        # Genera dist/
npm run preview      # Preview del build

# Deploy Vercel
vercel               # Primera vez
vercel --prod        # Producción
```

---

## 12. COMMITS IMPORTANTES

| Commit | Descripción |
|--------|-------------|
| `bd2866f` | Documentación completa |
| `59a951c` | UI polish (status toggles, icons) |
| `962c9f0` | Estado funcional con Supabase |
| `a55bc7a` | CSS Deep Blue/Orange |

---

## 13. NOTAS IMPORTANTES

1. **NO usar Firebase** - El proyecto usa Supabase
2. **Dos backends** - Supabase para CRUD simple, API para lógica compleja
3. **billingEntity** - DOVECREEK sync QB, INNOVATIVE no
4. **Icon component** - Usar `<Icon name="x" />` no react-icons
5. **localStorage** - Solo Quotations y Requisitions (migrar a API)

---

## 14. TROUBLESHOOTING

### API no responde
```javascript
// Verificar en consola
console.log(isApiEnabled())  // debe ser true
await checkApiHealth()       // debe retornar true
```

### QuickBooks sync falla
```javascript
// Ver cola de errores
const queue = await api.quickbooks.getQueue()
// Reintentar fallidos
await api.quickbooks.retryFailed()
```

### Supabase error
```javascript
// Verificar conexión
import { supabase } from '../lib/supabase'
const { data, error } = await supabase.from('clients').select('*').limit(1)
```

---

*Documentación actualizada para mantener contexto entre sesiones.*
