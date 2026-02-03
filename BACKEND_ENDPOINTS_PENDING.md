# Backend Endpoints Pendientes - D-Kraft MRP

Este documento lista los endpoints de API que necesitan ser implementados en el backend para que los siguientes modulos funcionen con la base de datos MySQL en lugar de localStorage.

**Fecha:** 2026-01-05
**Estado actual:** Los modulos Cotizaciones y Sales Orders funcionan con localStorage

---

## 1. Cotizaciones (Estimates) - `/api/quotations`

### Endpoints requeridos:

#### GET /api/quotations
- **Descripcion:** Obtener todas las cotizaciones
- **Response:**
```json
[
  {
    "id": "string",
    "folio": "string (COT-YYYYMM-XXX)",
    "clientId": "string",
    "clientName": "string",
    "billingEntity": "DOVECREEK | INNOVATIVE",
    "status": "DRAFT | SENT | APPROVED | REJECTED | CONVERTED | CANCELLED",
    "createdAt": "ISO date",
    "approvalDate": "ISO date | null",
    "eta": "ISO date | null",
    "deposit": "number",
    "depositPaid": "boolean",
    "subtotal": "number",
    "tax": "number",
    "total": "number",
    "notes": "string",
    "items": [
      {
        "id": "string",
        "productId": "string",
        "productName": "string",
        "description": "string",
        "quantity": "number",
        "unitPrice": "number",
        "discount": "number",
        "subtotal": "number"
      }
    ]
  }
]
```

#### GET /api/quotations/:id
- **Descripcion:** Obtener una cotizacion por ID

#### POST /api/quotations
- **Descripcion:** Crear nueva cotizacion
- **Body:** Mismo schema que el response (sin id, createdAt se genera automaticamente)
- **Nota:** Si `billingEntity === 'DOVECREEK'`, debe sincronizar con QuickBooks

#### PUT /api/quotations/:id
- **Descripcion:** Actualizar cotizacion existente
- **Campos actualizables:** status, approvalDate, eta, deposit, depositPaid, items, notes

#### DELETE /api/quotations/:id
- **Descripcion:** Eliminar cotizacion (solo si status es DRAFT o REJECTED)

---

## 2. Sales Orders (Requisitions) - `/api/requisitions` o `/api/sales-orders`

### Endpoints requeridos:

#### GET /api/requisitions
- **Descripcion:** Obtener todas las ordenes de venta
- **Response:**
```json
[
  {
    "id": "string",
    "folio": "string (SO-YYYYMM-XXX o REQ-YYYYMM-XXX)",
    "quotationId": "string | null",
    "quotationFolio": "string | null",
    "customerId": "string",
    "customerName": "string",
    "billingEntity": "DOVECREEK | INNOVATIVE",
    "status": "DRAFT | PENDING_APPROVAL | APPROVED | REJECTED | ORDERED | PARTIALLY_FULFILLED | FULFILLED | CANCELLED",
    "requestedAt": "ISO date",
    "requiredAt": "ISO date | null",
    "approvalDate": "ISO date | null",
    "eta": "ISO date | null",
    "deposit": "number",
    "depositPaid": "boolean",
    "warehouseId": "string | null",
    "warehouseName": "string",
    "projectId": "string | null",
    "projectName": "string",
    "subtotal": "number",
    "tax": "number",
    "total": "number",
    "comments": "string",
    "items": [
      {
        "id": "string",
        "productId": "string",
        "productName": "string",
        "description": "string",
        "quantity": "number",
        "unitPrice": "number",
        "discount": "number",
        "subtotal": "number"
      }
    ]
  }
]
```

#### GET /api/requisitions/:id
- **Descripcion:** Obtener una orden por ID

#### POST /api/requisitions
- **Descripcion:** Crear nueva orden de venta
- **Body:** Mismo schema que el response
- **Nota:** Si `billingEntity === 'DOVECREEK'`, debe sincronizar con QuickBooks

#### PUT /api/requisitions/:id
- **Descripcion:** Actualizar orden existente
- **Campos importantes:** status, approvalDate, approvalComments

#### DELETE /api/requisitions/:id
- **Descripcion:** Eliminar orden (solo si status es DRAFT o REJECTED)

---

## 3. Materiales - `/api/materials` (Existente pero con issues)

### Issue actual:
Cuando se crea un material, el backend intenta sincronizar con QuickBooks y falla:
```
Database error: QWC add-item failed: 400 Bad Request
```

### Solucion requerida:
- Soportar el flag `skipQBSync: true` en el body del POST para omitir la sincronizacion con QuickBooks
- O separar la sincronizacion de QB como un proceso en background que no bloquee la creacion del material

---

## 4. Entidades de Facturacion (Billing Entities)

### Logica de negocio importante:
- **DOVECREEK (Dovecreek Maquila):** Sincroniza con QuickBooks
- **INNOVATIVE (Innovative Mx):** NO sincroniza con QuickBooks

Cuando `billingEntity === 'DOVECREEK'`:
- Cotizaciones deben crear Estimates en QB
- Sales Orders deben crear Sales Orders en QB
- Materiales deben crear Items en QB

Cuando `billingEntity === 'INNOVATIVE'`:
- No sincronizar nada con QuickBooks
- El flag `skipQBSync: true` debe ser respetado

---

## Notas adicionales

### Flujo MRP:
1. **Cotizacion (Estimate)** -> Se crea con status DRAFT
2. Se envia al cliente -> status SENT
3. Cliente aprueba -> status APPROVED, se registra approvalDate
4. Se paga deposito -> depositPaid = true
5. Se convierte a Sales Order -> status CONVERTED
6. **Sales Order** se crea automaticamente desde la cotizacion aprobada

### LocalStorage Keys (para migracion):
- Cotizaciones: `dkraft_quotations`
- Sales Orders: `dkraft_sales_orders`

Cuando el backend este listo, los datos locales se pueden migrar a la base de datos.

---

## Contacto
Para preguntas sobre la estructura de datos o flujo de trabajo, revisar los componentes:
- `src/components/modules/Quotations/index.jsx`
- `src/components/modules/Requisitions/index.jsx`
