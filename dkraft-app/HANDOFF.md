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

### Entidades de Facturación
- **DOVECREEK (Dovecreek Maquila)**: Sincroniza con QuickBooks
- **INNOVATIVE (Innovative Mx)**: NO sincroniza con QuickBooks

---

## 2. TECH STACK

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + Vite 7 |
| Estilos | CSS puro (Tailwind v4 parcial) |
| Backend/DB | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Hosting | Pendiente (Vercel recomendado) |

### Diseño Visual
- **Colores**: Deep Blue (#0033b3) + Electric Orange (#d35400)
- **Estilo**: Glassmorphism con blur y transparencias
- **Iconos**: Material Symbols Rounded (Google)

---

## 3. ESTRUCTURA DEL PROYECTO

```
src/
├── components/
│   ├── common/           # Componentes reutilizables
│   │   ├── Icon.jsx      # Wrapper para Material Symbols
│   │   ├── Modal.jsx     # Modal universal
│   │   ├── SearchBox.jsx # Barra de búsqueda
│   │   └── ...
│   ├── layout/
│   │   ├── Sidebar.jsx   # Navegación principal
│   │   └── ...
│   └── modules/          # Módulos de la app
│       ├── Clients/
│       ├── Suppliers/
│       ├── Materials/
│       ├── Products/
│       ├── Projects/
│       ├── Quotations/   # ⚠️ Usa localStorage
│       ├── Requisitions/ # ⚠️ Usa localStorage (Sales Orders)
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
│   └── initialData.js    # Datos de navegación y fallback
├── lib/
│   └── supabase.js       # ⭐ CLIENTE SUPABASE COMPLETO
├── services/
│   └── api.js            # Wrapper de APIs
├── hooks/
│   └── useService.js     # Hook para servicios
└── styles/
    └── main.css          # ⭐ TODOS LOS ESTILOS (23K+ líneas)
```

---

## 4. BACKEND - SUPABASE

### Configuración
```env
VITE_SUPABASE_URL=https://qalqscfrcxzzvrcvqqbp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

### Cliente Principal: `src/lib/supabase.js`

Este archivo contiene TODO lo necesario para el backend:

#### Autenticación
```javascript
import { auth } from '../lib/supabase'

auth.signIn(email, password)
auth.signUp(email, password, metadata)
auth.signOut()
auth.getUser()
auth.getSession()
```

#### CRUD Genérico
```javascript
import { db } from '../lib/supabase'

db.getAll('tabla', { filters, orderBy, limit })
db.getById('tabla', id)
db.create('tabla', data)
db.update('tabla', id, data)
db.delete('tabla', id)
db.search('tabla', 'columna', 'término')
```

#### Servicios por Tabla
```javascript
import {
  clientsService,
  suppliersService,
  materialsService,
  productsService,
  projectsService,
  quotationsService,
  requisitionsService,
  operationsService,
  bomService,
  warehousesService,
  categoriesService,
  unitsService,
  profilesService,
  attendanceService,
  activityLogService
} from '../lib/supabase'

// Ejemplo
const clients = await clientsService.getAll()
const client = await clientsService.create({ name: 'Nuevo', email: '...' })
```

#### Realtime (Suscripciones)
```javascript
import { realtime } from '../lib/supabase'

const unsubscribe = realtime.subscribe('materials', (payload) => {
  console.log('Cambio:', payload)
})
```

---

## 5. TABLAS SUPABASE REQUERIDAS

```sql
-- Principales
clients, suppliers, materials, products, projects

-- Documentos
quotations, quotation_items
requisitions, requisition_items (Sales Orders)

-- Producción
operations, operation_stages, operation_materials
bom, bom_components

-- Catálogos
warehouses, categories, units

-- Staff
profiles, attendance

-- Sistema
activity_log
```

---

## 6. MÓDULOS QUE USAN LOCALSTORAGE

⚠️ **Estos módulos NO están conectados a Supabase todavía:**

| Módulo | localStorage Key | Servicio Supabase |
|--------|------------------|-------------------|
| Quotations | `dkraft_quotations` | `quotationsService` |
| Sales Orders | `dkraft_sales_orders` | `requisitionsService` |

### Para conectarlos:
1. Importar el servicio de `../lib/supabase`
2. Reemplazar `localStorage.getItem/setItem` con llamadas al servicio
3. Agregar manejo de loading/error states

---

## 7. CÓMO CORRER EL PROYECTO

```bash
# Desarrollo
cd /Users/concepcion/Documents/GitHub/dkraft-app/dkraft-app
npm install
npm run dev
# Abrir http://localhost:5173

# Build producción
npm run build
# Genera carpeta dist/
```

---

## 8. DEPLOY A PRODUCCIÓN

### Opción A: Vercel (Recomendado)
```bash
npm i -g vercel
vercel
# Configurar variables de entorno en dashboard
```

### Opción B: Netlify
```bash
npm run build
# Subir carpeta dist/ a Netlify
# Configurar variables de entorno
```

### Variables de Entorno en Producción
```
VITE_SUPABASE_URL=https://qalqscfrcxzzvrcvqqbp.supabase.co
VITE_SUPABASE_ANON_KEY=tu_key_aqui
```

---

## 9. PENDIENTES PARA MVP

### Prioridad Alta
- [ ] Verificar que tablas existen en Supabase
- [ ] Conectar Quotations a Supabase
- [ ] Conectar Sales Orders a Supabase
- [ ] Deploy a producción

### Prioridad Media (Post-MVP)
- [ ] QuickBooks sync para DOVECREEK
- [ ] Exportar reportes a PDF
- [ ] Code splitting para reducir bundle

### Prioridad Baja
- [ ] PWA para móvil
- [ ] Notificaciones push

---

## 10. COMMITS IMPORTANTES

| Commit | Descripción |
|--------|-------------|
| `59a951c` | UI polish completo (status toggles, icons, Sales Orders facelift) |
| `7415bf2` | Minor fixes |
| `a58a636` | UI polish: badges, buttons, forms |
| `962c9f0` | Estado funcional con Supabase |
| `a55bc7a` | CSS original Deep Blue/Orange |

---

## 11. CONTACTOS

- **Proyecto**: D-KRAFT MRP
- **Supabase Project**: qalqscfrcxzzvrcvqqbp

---

## 12. NOTAS IMPORTANTES

1. **NO usar Firebase** - El proyecto usa Supabase
2. **Preservar main.css** - Contiene todos los estilos (23K+ líneas)
3. **Icon component** - Usar `<Icon name="nombre" />` no react-icons
4. **Status toggle** - Patrón de botones Active/Inactive para status

---

*Documentación generada para mantener contexto entre sesiones de desarrollo.*
