# D-KRAFT Database Schema Diagram

## Entity Relationship Diagram

```mermaid
erDiagram
    %% ==========================================
    %% CATÁLOGOS BASE
    %% ==========================================

    categories {
        uuid id PK
        string name
        string description
        uuid parent_id FK
    }

    units {
        uuid id PK
        string name
        string abbreviation
        string description
    }

    warehouses {
        uuid id PK
        string name
        string code
        string location
        string status
    }

    warehouse_sections {
        uuid id PK
        uuid warehouse_id FK
        string name
        string code
    }

    %% ==========================================
    %% CLIENTES Y PROVEEDORES
    %% ==========================================

    clients {
        uuid id PK
        string name
        string company_name
        string email
        string phone
        string tax_id
        string billing_entity
        string status
        string qb_customer_id
        string sync_status
    }

    suppliers {
        uuid id PK
        string name
        string contact_name
        string email
        string phone
        int lead_time_days
        string status
    }

    %% ==========================================
    %% MATERIALES Y PRODUCTOS
    %% ==========================================

    materials {
        uuid id PK
        string sku
        string name
        uuid category_id FK
        uuid unit_id FK
        uuid supplier_id FK
        uuid warehouse_id FK
        decimal unit_cost
        decimal stock
        decimal min_stock
        string status
        string qb_item_id
    }

    products {
        uuid id PK
        string sku
        string name
        uuid category_id FK
        decimal unit_price
        decimal cost
        string status
        string qb_item_id
    }

    %% ==========================================
    %% BILL OF MATERIALS
    %% ==========================================

    bom {
        uuid id PK
        uuid product_id FK
        string version
        decimal labor_cost
        decimal overhead_cost
        decimal margin
        decimal total_cost
        decimal suggested_price
        boolean is_active
    }

    bom_components {
        uuid id PK
        uuid bom_id FK
        uuid material_id FK
        decimal quantity
        decimal unit_cost
        decimal total_cost
    }

    %% ==========================================
    %% COTIZACIONES
    %% ==========================================

    quotations {
        uuid id PK
        string folio
        uuid client_id FK
        string billing_entity
        string status
        date eta
        decimal deposit
        boolean deposit_paid
        decimal subtotal
        decimal tax
        decimal total
        string qb_estimate_id
    }

    quotation_items {
        uuid id PK
        uuid quotation_id FK
        uuid product_id FK
        string product_name
        decimal quantity
        decimal unit_price
        decimal subtotal
    }

    %% ==========================================
    %% SALES ORDERS (REQUISITIONS)
    %% ==========================================

    requisitions {
        uuid id PK
        string folio
        uuid quotation_id FK
        uuid client_id FK
        uuid project_id FK
        uuid warehouse_id FK
        string billing_entity
        string status
        date required_at
        decimal deposit
        decimal subtotal
        decimal tax
        decimal total
        string qb_sales_order_id
    }

    requisition_items {
        uuid id PK
        uuid requisition_id FK
        uuid product_id FK
        uuid material_id FK
        decimal quantity
        decimal unit_price
        decimal subtotal
        string status
        decimal ordered_qty
        decimal received_qty
    }

    %% ==========================================
    %% PROYECTOS
    %% ==========================================

    projects {
        uuid id PK
        string name
        string code
        uuid client_id FK
        uuid quotation_id FK
        string status
        date start_date
        date end_date
        decimal budget
        int progress
    }

    %% ==========================================
    %% OPERACIONES
    %% ==========================================

    operations {
        uuid id PK
        string folio
        uuid project_id FK
        uuid product_id FK
        uuid requisition_id FK
        uuid bom_id FK
        string status
        int quantity
        int progress
        date due_date
    }

    operation_stages {
        uuid id PK
        uuid operation_id FK
        string stage_key
        string stage_name
        string status
        int progress
        timestamp started_at
        timestamp completed_at
    }

    operation_materials {
        uuid id PK
        uuid operation_id FK
        uuid material_id FK
        uuid warehouse_id FK
        decimal quantity_required
        decimal quantity_used
        string status
    }

    %% ==========================================
    %% QUALITY
    %% ==========================================

    quality_inspections {
        uuid id PK
        uuid operation_id FK
        uuid operation_stage_id FK
        string inspection_type
        string result
        int inspected_qty
        int passed_qty
        int failed_qty
    }

    %% ==========================================
    %% INVENTARIO
    %% ==========================================

    stock_movements {
        uuid id PK
        uuid material_id FK
        uuid warehouse_id FK
        string movement_type
        decimal quantity
        string reference_type
        uuid reference_id
    }

    %% ==========================================
    %% STAFF
    %% ==========================================

    profiles {
        uuid id PK
        string email
        string full_name
        string role
        string department
        string status
    }

    attendance {
        uuid id PK
        uuid staff_id FK
        date date
        time clock_in
        time clock_out
        decimal hours_worked
        string status
    }

    %% ==========================================
    %% ACTIVITY LOG
    %% ==========================================

    activity_log {
        uuid id PK
        uuid user_id FK
        string action
        string module
        string entity_type
        uuid entity_id
        jsonb old_data
        jsonb new_data
    }

    %% ==========================================
    %% RELATIONSHIPS
    %% ==========================================

    %% Catálogos
    categories ||--o{ categories : "parent"
    warehouses ||--o{ warehouse_sections : "has"

    %% Materials
    categories ||--o{ materials : "categorizes"
    units ||--o{ materials : "measures"
    suppliers ||--o{ materials : "supplies"
    warehouses ||--o{ materials : "stores"

    %% Products
    categories ||--o{ products : "categorizes"

    %% BOM
    products ||--o{ bom : "has"
    bom ||--o{ bom_components : "contains"
    materials ||--o{ bom_components : "used_in"

    %% Quotations
    clients ||--o{ quotations : "requests"
    quotations ||--o{ quotation_items : "contains"
    products ||--o{ quotation_items : "quoted"

    %% Requisitions
    clients ||--o{ requisitions : "orders"
    quotations ||--o{ requisitions : "converts_to"
    projects ||--o{ requisitions : "requires"
    warehouses ||--o{ requisitions : "delivers_to"
    requisitions ||--o{ requisition_items : "contains"
    products ||--o{ requisition_items : "ordered"
    materials ||--o{ requisition_items : "requested"

    %% Projects
    clients ||--o{ projects : "owns"
    quotations ||--o{ projects : "originates"

    %% Operations
    projects ||--o{ operations : "includes"
    products ||--o{ operations : "produces"
    requisitions ||--o{ operations : "fulfills"
    bom ||--o{ operations : "uses"
    operations ||--o{ operation_stages : "has"
    operations ||--o{ operation_materials : "consumes"
    materials ||--o{ operation_materials : "consumed_in"
    warehouses ||--o{ operation_materials : "from"

    %% Quality
    operations ||--o{ quality_inspections : "inspected"
    operation_stages ||--o{ quality_inspections : "checked"

    %% Stock
    materials ||--o{ stock_movements : "tracks"
    warehouses ||--o{ stock_movements : "at"

    %% Staff
    profiles ||--o{ attendance : "records"
    profiles ||--o{ activity_log : "performs"
```

## Flujo de Datos Principal

```mermaid
flowchart LR
    subgraph VENTAS
        Q[Quotation] --> |aprobada| R[Requisition/SO]
    end

    subgraph PROYECTOS
        R --> |genera| P[Project]
        P --> |crea| O[Operations]
    end

    subgraph PRODUCCIÓN
        O --> |etapas| S[Stages]
        O --> |consume| M[Materials]
        S --> |inspección| QC[Quality]
    end

    subgraph INVENTARIO
        M --> |movimientos| SM[Stock Movements]
        SM --> |actualiza| INV[Inventory]
    end

    subgraph FACTURACIÓN
        R --> |sync| QB[QuickBooks]
        Q --> |sync| QB
    end
```

## Flujo de Status - Quotations

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> SENT : enviar a cliente
    SENT --> APPROVED : cliente aprueba
    SENT --> REJECTED : cliente rechaza
    APPROVED --> CONVERTED : crear Sales Order
    CONVERTED --> [*]
    REJECTED --> DRAFT : revisar
    DRAFT --> CANCELLED : cancelar
    CANCELLED --> [*]
```

## Flujo de Status - Requisitions (Sales Orders)

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> PENDING_APPROVAL : submit
    PENDING_APPROVAL --> APPROVED : aprobar
    PENDING_APPROVAL --> REJECTED : rechazar
    APPROVED --> ORDERED : ordenar materiales
    ORDERED --> PARTIALLY_FULFILLED : recepción parcial
    PARTIALLY_FULFILLED --> FULFILLED : completar
    ORDERED --> FULFILLED : recepción completa
    FULFILLED --> [*]
    REJECTED --> DRAFT : revisar
    DRAFT --> CANCELLED : cancelar
    CANCELLED --> [*]
```

## Flujo de Status - Operations

```mermaid
stateDiagram-v2
    [*] --> pending
    pending --> scheduled : programar
    scheduled --> in_progress : iniciar
    in_progress --> on_hold : pausar
    on_hold --> in_progress : reanudar
    in_progress --> quality_check : enviar a QC
    quality_check --> in_progress : rechazado
    quality_check --> completed : aprobado
    completed --> [*]
    pending --> cancelled : cancelar
    scheduled --> cancelled : cancelar
    cancelled --> [*]
```

## Relación con QuickBooks

```mermaid
flowchart TB
    subgraph DKRAFT[D-KRAFT System]
        C[Clients]
        P[Products]
        Q[Quotations]
        R[Requisitions]
    end

    subgraph SYNC[Sync Logic]
        CHECK{billing_entity?}
    end

    subgraph QB[QuickBooks Online]
        QBC[Customers]
        QBI[Items]
        QBE[Estimates]
        QBS[Sales Orders]
    end

    C --> CHECK
    P --> CHECK
    Q --> CHECK
    R --> CHECK

    CHECK --> |DOVECREEK| QB
    CHECK --> |INNOVATIVE| X[No Sync]

    C --> |sync| QBC
    P --> |sync| QBI
    Q --> |sync| QBE
    R --> |sync| QBS
```

## Tablas por Módulo

| Módulo | Tablas Principales | Tablas Relacionadas |
|--------|-------------------|---------------------|
| **Catálogos** | categories, units, warehouses | warehouse_sections |
| **Clientes** | clients | quotations, requisitions, projects |
| **Proveedores** | suppliers | materials |
| **Materiales** | materials | stock_movements, bom_components, operation_materials |
| **Productos** | products | bom, quotation_items, operations |
| **BOM** | bom | bom_components |
| **Cotizaciones** | quotations | quotation_items |
| **Sales Orders** | requisitions | requisition_items |
| **Proyectos** | projects | operations, requisitions |
| **Operaciones** | operations | operation_stages, operation_materials |
| **Calidad** | quality_inspections | - |
| **Staff** | profiles | attendance, performance_metrics |
| **Auditoría** | activity_log | - |

## Campos Clave para QuickBooks

| Tabla | Campo QB | Descripción |
|-------|----------|-------------|
| clients | qb_customer_id | ID del Customer en QB |
| clients | sync_status | Estado de sincronización |
| products | qb_item_id | ID del Item en QB |
| materials | qb_item_id | ID del Item en QB |
| quotations | qb_estimate_id | ID del Estimate en QB |
| requisitions | qb_sales_order_id | ID del Sales Order en QB |
| * | skip_qb_sync | Flag para saltar sync |
| * | billing_entity | DOVECREEK syncs, INNOVATIVE no |
