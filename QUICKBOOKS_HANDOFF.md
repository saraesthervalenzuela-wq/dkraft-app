# QuickBooks Integration Handoff

## Overview

D-KRAFT ERP necesita sincronizar datos con QuickBooks Online para contabilidad. Este documento describe el trabajo pendiente y cómo completar la integración.

## Estado Actual

| Componente | Estado |
|------------|--------|
| Supabase DB | Listo |
| Campos de sync en tablas | Listo |
| Módulo QB con stubs | Listo |
| OAuth con QB | Pendiente |
| Sync de Clientes | Pendiente |
| Sync de Productos | Pendiente |
| Sync de Cotizaciones | Pendiente |

## Arquitectura

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   QuickBooks    │◄───────►│    Supabase     │◄───────►│   Frontend      │
│   Online API    │  Sync   │   PostgreSQL    │   API   │   React App     │
└─────────────────┘         └─────────────────┘         └─────────────────┘
        │                           │
        │                   ┌───────┴───────┐
        │                   │ Campos Sync:  │
        │                   │ - qb_id       │
        │                   │ - sync_status │
        │                   │ - sync_error  │
        │                   │ - last_synced │
        │                   └───────────────┘
        │
        └── OAuth 2.0 (tokens en Supabase)
```

## Archivos Clave

```
src/
├── lib/
│   └── supabase.js              # Cliente de Supabase (LISTO)
├── services/
│   └── quickbooks/
│       └── index.js             # Módulo QB con stubs (TU TRABAJO)
└── .env                         # Variables de entorno
```

## Credenciales Necesarias

Obtener de [Intuit Developer Portal](https://developer.intuit.com/):

```env
VITE_QB_CLIENT_ID=your_client_id
VITE_QB_CLIENT_SECRET=your_client_secret
VITE_QB_REDIRECT_URI=https://app.dkraft.com.mx/callback/quickbooks
VITE_QB_ENVIRONMENT=sandbox  # o 'production'
```

## Tablas con Campos de Sync

Estas tablas ya tienen los campos para sincronización:

- `clients`
- `suppliers`
- `materials`
- `products`
- `quotations`
- `requisitions`

**Campos:**
- `qb_id` - ID del registro en QuickBooks
- `sync_status` - Estado: 'local_only', 'synced', 'pending_push', 'error'
- `sync_error` - Mensaje de error si falló
- `last_synced_at` - Timestamp de última sincronización

## Funciones a Implementar

### 1. Autenticación OAuth 2.0

Archivo: `src/services/quickbooks/index.js`

```javascript
// TODO: Implementar estas funciones:
getAuthorizationUrl()        // Generar URL de OAuth
exchangeCodeForTokens()      // Intercambiar code por tokens
refreshAccessToken()         // Refrescar token expirado
isConnected()                // Verificar conexión activa
disconnect()                 // Revocar tokens
```

**Flujo OAuth:**
1. Usuario hace clic en "Conectar QuickBooks"
2. Redirect a `getAuthorizationUrl()`
3. Usuario autoriza en Intuit
4. Callback con `code` y `realmId`
5. `exchangeCodeForTokens(code, realmId)`
6. Guardar tokens en Supabase (crear tabla `qb_tokens`)

### 2. Sincronización de Clientes

```javascript
pushClientToQB(clientId)     // D-KRAFT → QB
pullClientsFromQB()          // QB → D-KRAFT
pullClientFromQB(qbId)       // Sync individual
```

**Mapeo de campos:**
| D-KRAFT | QuickBooks |
|---------|------------|
| name | DisplayName |
| email | PrimaryEmailAddr.Address |
| phone | PrimaryPhone.FreeFormNumber |
| company | CompanyName |
| address | BillAddr.Line1, City, etc. |

**Endpoint QB:** `POST/PUT /v3/company/{realmId}/customer`

### 3. Sincronización de Productos

```javascript
pushProductToQB(productId)   // D-KRAFT → QB
pullProductsFromQB()         // QB → D-KRAFT
```

**Mapeo de campos:**
| D-KRAFT | QuickBooks |
|---------|------------|
| name | Name |
| description | Description |
| price | UnitPrice |
| - | Type: 'NonInventory' o 'Service' |

**Endpoint QB:** `POST/PUT /v3/company/{realmId}/item`

### 4. Sincronización de Cotizaciones → Estimates

```javascript
pushQuotationToQB(quotationId)       // Crear Estimate en QB
convertQuotationToSalesOrder(id)     // Estimate → SalesReceipt/Invoice
```

**Mapeo:**
- Cliente debe existir en QB (push primero si no tiene qb_id)
- Cada item de cotización → Line en Estimate
- Totales, impuestos, etc.

**Endpoint QB:** `POST /v3/company/{realmId}/estimate`

## Manejo de Tokens

Los tokens de QB expiran:
- `access_token`: 1 hora
- `refresh_token`: 100 días

**Recomendación:** Crear tabla en Supabase:

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

## Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| 401 Unauthorized | Token expirado | Refrescar token |
| 400 Bad Request | Campos inválidos | Verificar mapeo |
| 429 Too Many Requests | Rate limit | Implementar backoff |
| Duplicate Name | Nombre ya existe | Buscar por nombre antes de crear |

## Testing

1. **Sandbox:** Usar `VITE_QB_ENVIRONMENT=sandbox`
2. **Crear empresa de prueba** en Intuit Developer Portal
3. **Probar flujo OAuth** completo
4. **Probar sync** con datos de prueba

## Recursos

- [QB API Reference](https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/account)
- [OAuth 2.0 Guide](https://developer.intuit.com/app/developer/qbo/docs/develop/authentication-and-authorization/oauth-2.0)
- [QB SDK for JS](https://github.com/intuit/oauth-jsclient) (opcional)

