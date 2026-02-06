# Aprendizajes de UI/UX - Proyecto D-Kraft
## Documento para Elena

---

## Resumen Ejecutivo

Este documento captura todos los patrones, decisiones y aprendizajes de UI/UX implementados en el proyecto D-Kraft. Sirve como guía de referencia para mantener consistencia y como documentacion de las mejores practicas aprendidas.

---

## 1. Stack Tecnologico

| Tecnologia | Version | Proposito |
|------------|---------|-----------|
| React | 19.2.0 | Framework principal |
| Tailwind CSS | 4.1.18 | Estilos utilitarios |
| Vite | 7.2.4 | Bundler y dev server |
| Supabase | 2.47.0 | Base de datos |

**Sin dependencias de UI externas** - Todo el sistema de diseno es custom, lo que da control total sobre la experiencia.

---

## 2. Sistema de Diseno

### Paleta de Colores

```
PRIMARIOS
---------
Deep Blue (Principal):
  - Base: #0033b3
  - Light: #0047e0
  - Dark: #001d66

Electric Orange (Acento):
  - Base: #d35400
  - Light: #e67e22
  - Bright: #f39c12

BACKGROUNDS (Dark Mode)
-----------------------
  - Primary: #0a1628
  - Secondary: rgba(15, 35, 80, 0.8)
  - Tertiary: rgba(20, 50, 110, 0.6)
  - Cards: rgba(15, 40, 90, 0.65)

BACKGROUNDS (Light Mode)
------------------------
  - Primary: #f8fafc
  - Secondary: #f1f5f9
  - Tertiary: #e2e8f0
  - Cards: rgba(255, 255, 255, 0.9)

STATUS
------
  - Success: #10b981 (verde)
  - Warning: #fbbf24 (amarillo)
  - Danger: #ef4444 (rojo)
  - Info: #0047e0 (azul)
```

### Tipografia

```
DISPLAY (Titulos)
  - Fuentes: Red Hat Display + Space Grotesk
  - Peso: 600-700
  - Letter-spacing: -0.5px

BODY (Texto)
  - Fuente: Plus Jakarta Sans
  - Peso Regular: 400
  - Peso Bold: 600-700

MONOSPACE (Datos)
  - Fuente: Coda / SF Mono
  - Uso: Tablas, codigo, datos numericos

ICONOS
  - Material Symbols Rounded (Google Fonts)
  - Tamano: 24px
  - Weight: 400
  - Fill: 1
```

### Espaciado

```
xs: 0.25rem (4px)
sm: 0.5rem (8px)
md: 1rem (16px)
lg: 1.5rem (24px)
xl: 2rem (32px)
```

### Border Radius

```
sm: 6px   (inputs, badges)
md: 10px  (botones)
lg: 16px  (contenedores)
xl: 24px  (cards, modales)
```

### Sombras

```css
/* Pequena */
shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);

/* Mediana */
shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);

/* Grande */
shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.5);

/* Glow naranja (acento) */
shadow-glow: 0 0 30px rgba(211, 84, 0, 0.15);
```

---

## 3. Patrones Visuales Clave

### Glassmorphism

El patron visual principal del proyecto. Se logra con:

```css
.glass-card {
  background: rgba(15, 40, 90, 0.65);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
}
```

**Cuando usarlo:**
- Cards de contenido
- Modales
- Sidebar
- Headers flotantes

### Dark-First Design

El tema oscuro es el predeterminado. El light mode es opcional.

```css
/* Variables se definen con data-theme */
[data-theme="dark"] {
  --bg-primary: #0a1628;
}

[data-theme="light"] {
  --bg-primary: #f8fafc;
}
```

### Micro-interacciones

Todas las interacciones tienen feedback visual:

```css
/* Hover en cards */
.card:hover {
  transform: scale(1.02);
  box-shadow: /* aumentada */;
}

/* Click en botones */
.button:active {
  transform: scale(0.97);
}

/* Focus en inputs */
.input:focus {
  border-color: var(--orange);
  box-shadow: 0 0 0 3px rgba(211, 84, 0, 0.2);
}
```

---

## 4. Componentes Base (Biblioteca)

### Button (7 variantes)

| Variante | Uso |
|----------|-----|
| `primary` | Acciones principales (guardar, crear) |
| `secondary` | Acciones secundarias (cancelar) |
| `glass` | Sobre fondos oscuros |
| `ghost` | Acciones sutiles |
| `danger` | Eliminar, acciones destructivas |
| `success` | Confirmaciones positivas |
| `orange` | Call-to-action especiales |

### Modal

- Tamanos: `small`, `medium`, `large`, `xlarge`
- Siempre tiene header con icono
- Footer con Cancel + Action buttons
- Detecta cambios sin guardar (isDirty)
- Overlay clickeable solo si no hay cambios

### Toast Notifications

```jsx
// Uso
const { showToast } = useToast();

showToast('success', 'Cliente guardado correctamente');
showToast('error', 'Error al guardar');
showToast('warning', 'Datos incompletos');
showToast('info', 'Sincronizando...');
```

Caracteristicas:
- Auto-dismiss en 5 segundos
- Progress bar animada
- Posicion: top-right
- Boton de cerrar manual

### Skeleton Loaders (10+ variantes)

**Usar skeletons en lugar de spinners genericos.**

```jsx
// Disponibles
<Skeleton type="text" />
<Skeleton type="avatar" />
<Skeleton type="card" />
<Skeleton type="table" />
<Skeleton type="stats" />
// etc.
```

### Empty States (10+ configuraciones)

Cada modulo tiene su empty state contextualizado:

```jsx
<EmptyState
  type="clients"  // Muestra icono y mensaje de clientes
  onAction={() => setShowModal(true)}
/>
```

---

## 5. Patrones de Navegacion

### Sidebar

- **Colapsible**: Toggle para expandir/contraer
- **Submenues**: Se expanden con animacion
- **Estado activo**: Clase `active` con subrayado
- **Mobile**: Se cierra automaticamente al seleccionar
- **Theme toggle**: Boton para cambiar dark/light
- **User menu**: Avatar + dropdown con opciones

### Global Search (Cmd+K)

Command palette estilo Spotlight/VS Code:
- Busqueda de items
- Navegacion rapida a modulos
- Acciones directas

### Keyboard Shortcuts

| Shortcut | Accion |
|----------|--------|
| `Cmd+K` | Abrir busqueda global |
| `?` o `Cmd+/` | Ver shortcuts |
| `g+d` | Ir a Dashboard |
| `g+c` | Ir a Clientes |
| `n` | Nuevo item |
| `Esc` | Cerrar modal |

### NavigationGuard

Protege contra perdida de cambios:

```jsx
const { setIsDirty } = useNavigationGuard();

// Marcar como modificado
setIsDirty(true);

// Al intentar navegar, muestra dialogo de confirmacion
```

---

## 6. Formularios

### Estructura Estandar

```jsx
const [formData, setFormData] = useState(emptyTemplate);
const [isDirty, setIsDirty] = useState(false);

const handleInputChange = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  setIsDirty(true);
};

const handleSave = async () => {
  try {
    await service.save(formData);
    setIsDirty(false);
    showToast('success', 'Guardado correctamente');
    onClose();
  } catch (error) {
    showToast('error', error.message);
  }
};
```

### Elementos de Formulario

```jsx
// Input con label e icono
<div className="form-group">
  <label>Nombre</label>
  <div className="input-wrapper">
    <Icon name="person" />
    <input
      type="text"
      value={formData.name}
      onChange={e => handleInputChange('name', e.target.value)}
      required
    />
  </div>
</div>
```

### Validacion

- **Cliente**: Atributos HTML5 (required, pattern, min, max)
- **Servidor**: Respuesta con `{ success: false, error: "mensaje" }`
- **Feedback**: Toast para errores y exitos

---

## 7. Feedback Visual

### Estados de Carga

```
1. Inicial: Mostrar Skeleton loader
2. Cargando: Mantener skeleton
3. Exito: Renderizar contenido con animacion
4. Vacio: Mostrar EmptyState
5. Error: Mostrar Toast de error
```

### Estados de Botones

```css
/* Normal */
opacity: 1; cursor: pointer;

/* Hover */
transform: scale(1.02); shadow aumentada;

/* Active/Click */
transform: scale(0.97);

/* Loading */
opacity: 0.7; cursor: wait; + spinner

/* Disabled */
opacity: 0.5; cursor: not-allowed;
```

### Animaciones de Entrada

```css
/* Pagina */
@keyframes pageSlideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Items de lista (stagger) */
@keyframes popIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Modal */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
```

---

## 8. Estructura de Modulos

Cada modulo sigue el mismo patron:

```
src/components/modules/[Modulo]/
  index.jsx          <- Componente principal
  [Modulo].css       <- Estilos especificos
  [Modulo]Modal.jsx  <- Modal de crear/editar
  [Modulo]Card.jsx   <- Card para vista grid
  [Modulo]Row.jsx    <- Row para vista tabla
```

### Estado Tipico de un Modulo

```jsx
// Datos
const [data, setData] = useState([]);
const [searchTerm, setSearchTerm] = useState('');
const [viewMode, setViewMode] = useState('grid');  // 'grid' | 'table'

// UI
const [isLoading, setIsLoading] = useState(true);
const [showModal, setShowModal] = useState(false);
const [currentItem, setCurrentItem] = useState(null);
const [selectedItems, setSelectedItems] = useState([]);

// Paginacion (via useTable hook)
const {
  currentPage,
  totalPages,
  paginatedData,
  goToPage
} = useTable(data, { pageSize: 10 });
```

### Vistas Grid vs Table

- **Grid**: Cards visuales, mejor para browsing
- **Table**: Datos densos, mejor para analisis
- **Toggle**: Boton en toolbar para cambiar

---

## 9. Hooks Custom

### useService

Abstrae la fuente de datos (Firebase vs API):

```jsx
const service = useService('clients');
const data = await service.getAll();
await service.create(item);
await service.update(id, item);
await service.delete(id);
```

### useTable

Maneja paginacion, ordenamiento, filtrado:

```jsx
const {
  paginatedData,
  currentPage,
  totalPages,
  sortConfig,
  handleSort,
  handlePageChange
} = useTable(data, {
  pageSize: 10,
  initialSort: { key: 'name', direction: 'asc' }
});
```

### useToast

```jsx
const { showToast } = useToast();
showToast('success', 'Mensaje');
```

### useNavigationGuard

```jsx
const { isDirty, setIsDirty, confirmNavigation } = useNavigationGuard();
```

---

## 10. Integraciones Especiales

### QuickBooks Sync

- **Polling**: Cada 30 segundos en modulo Clients
- **Campos**: `qb_customer_id`, `qb_sync_status`, `skip_qb_sync`
- **Solo DOVECREEK**: Entidad que sincroniza
- **Status visual**: Badge en cards/rows

### Transformacion de Datos

```
Base de datos (snake_case) <-> JavaScript (camelCase)

qb_customer_id  <->  qbCustomerId
created_at      <->  createdAt
```

---

## 11. Buenas Practicas Aprendidas

### 1. Skeletons > Spinners
Los skeleton loaders dan mejor percepcion de velocidad y muestran estructura del contenido.

### 2. Feedback Inmediato
Cada accion del usuario debe tener respuesta visual (hover, click, loading, success/error).

### 3. Proteger Cambios
Usar `isDirty` + NavigationGuard para evitar perdida de trabajo.

### 4. Consistencia Visual
Todos los modulos siguen el mismo patron de layout, colores, espaciado.

### 5. Animaciones Sutiles
Las animaciones deben ser rapidas (0.2-0.4s) y funcionales, no decorativas.

### 6. Empty States Contextuales
Cada modulo tiene su mensaje y accion especifica cuando no hay datos.

### 7. Keyboard First
Los power users pueden navegar todo con teclado (Cmd+K, shortcuts).

### 8. Error Handling Visible
Errores siempre mostrados via Toast, nunca silenciosos.

---

## 12. Estructura de Archivos

```
src/
├── components/
│   ├── auth/           # Login, Register, ForgotPassword
│   ├── common/         # Componentes reutilizables
│   │   ├── Button/
│   │   ├── Modal/
│   │   ├── Toast/
│   │   ├── Skeleton/
│   │   ├── EmptyState/
│   │   ├── GlobalSearch/
│   │   └── ...
│   ├── layout/         # Sidebar, AuthLayout
│   └── modules/        # 20+ modulos de negocio
│       ├── Clients/
│       ├── Materials/
│       ├── Products/
│       ├── Projects/
│       └── ...
├── context/            # React Context providers
│   ├── AuthContext.jsx
│   ├── ToastContext.jsx
│   └── NavigationGuardContext.jsx
├── hooks/              # Custom hooks
│   ├── useService.js
│   └── useTable.js
├── services/           # API client
├── styles/             # CSS global
│   └── main.css
└── App.jsx             # Componente raiz
```

---

## 13. Checklist para Nuevos Componentes

- [ ] Usa colores del sistema de diseno
- [ ] Tiene estados hover, active, focus, disabled
- [ ] Tiene skeleton loader para estado de carga
- [ ] Tiene empty state si aplica
- [ ] Usa Toast para feedback de acciones
- [ ] Protege cambios sin guardar si es formulario
- [ ] Tiene animacion de entrada sutil
- [ ] Es responsive (funciona en mobile)
- [ ] Soporta dark y light mode
- [ ] Usa iconos Material Symbols

---

## 14. Recursos

- **Iconos**: [Material Symbols](https://fonts.google.com/icons)
- **Fuentes**: Google Fonts (Red Hat Display, Plus Jakarta Sans, Space Grotesk)
- **Colores**: Variables CSS en `/src/styles/main.css`

---

*Documento creado: Febrero 2026*
*Proyecto: D-Kraft App - Sistema ERP/MRP*
