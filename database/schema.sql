-- =============================================
-- D-KRAFT MRP/ERP - Database Schema
-- Supabase (PostgreSQL)
-- Generated: 2026-02-01
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. CATÁLOGOS BASE
-- =============================================

-- Categories (for materials and products)
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Units of measurement
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    abbreviation VARCHAR(10),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    location TEXT,
    address TEXT,
    manager_name VARCHAR(100),
    phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Warehouse sections/zones
CREATE TABLE IF NOT EXISTS warehouse_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. CLIENTES Y PROVEEDORES
-- =============================================

-- Clients
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    company_name VARCHAR(200),
    email VARCHAR(100),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'México',
    tax_id VARCHAR(20),  -- RFC
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    credit_limit DECIMAL(12,2) DEFAULT 0,
    balance DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    billing_entity VARCHAR(20) DEFAULT 'DOVECREEK' CHECK (billing_entity IN ('DOVECREEK', 'INNOVATIVE')),
    notes TEXT,
    -- QuickBooks sync fields
    qb_customer_id VARCHAR(50),
    qb_sync_token VARCHAR(10),
    sync_status VARCHAR(20) DEFAULT 'local_only' CHECK (sync_status IN ('local_only', 'synced', 'pending_push', 'pending_pull', 'error')),
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    company_name VARCHAR(200),
    contact_name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'México',
    tax_id VARCHAR(20),  -- RFC
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    lead_time_days INT DEFAULT 7,
    minimum_order DECIMAL(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    notes TEXT,
    -- QuickBooks sync fields
    qb_vendor_id VARCHAR(50),
    sync_status VARCHAR(20) DEFAULT 'local_only',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. MATERIALES E INVENTARIO
-- =============================================

-- Materials (raw materials, components, consumables)
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    secondary_supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
    -- Pricing
    unit_cost DECIMAL(12,4) DEFAULT 0,
    last_cost DECIMAL(12,4) DEFAULT 0,
    avg_cost DECIMAL(12,4) DEFAULT 0,
    -- Stock levels
    stock DECIMAL(12,4) DEFAULT 0,
    reserved_stock DECIMAL(12,4) DEFAULT 0,
    available_stock DECIMAL(12,4) GENERATED ALWAYS AS (stock - reserved_stock) STORED,
    min_stock DECIMAL(12,4) DEFAULT 0,
    max_stock DECIMAL(12,4),
    reorder_point DECIMAL(12,4) DEFAULT 0,
    reorder_qty DECIMAL(12,4) DEFAULT 0,
    -- Location
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    location_code VARCHAR(50),  -- Shelf/bin location
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    is_critical BOOLEAN DEFAULT false,
    -- QuickBooks
    qb_item_id VARCHAR(50),
    sync_status VARCHAR(20) DEFAULT 'local_only',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock movements/transactions
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id),
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'transfer', 'adjustment', 'return')),
    quantity DECIMAL(12,4) NOT NULL,
    unit_cost DECIMAL(12,4),
    reference_type VARCHAR(50),  -- requisition, operation, purchase, etc
    reference_id UUID,
    notes TEXT,
    performed_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. PRODUCTOS Y BOM
-- =============================================

-- Products (finished goods)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(50) UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    -- Pricing
    unit_price DECIMAL(12,2) DEFAULT 0,
    cost DECIMAL(12,2) DEFAULT 0,
    margin DECIMAL(5,2) DEFAULT 30,
    -- Production
    production_time_hours DECIMAL(8,2),
    min_order_qty INT DEFAULT 1,
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    -- QuickBooks
    qb_item_id VARCHAR(50),
    sync_status VARCHAR(20) DEFAULT 'local_only',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bill of Materials
CREATE TABLE IF NOT EXISTS bom (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    version VARCHAR(20) DEFAULT '1.0',
    name VARCHAR(200),
    description TEXT,
    -- Costs
    labor_cost DECIMAL(12,2) DEFAULT 0,
    labor_hours DECIMAL(8,2) DEFAULT 0,
    overhead_cost DECIMAL(12,2) DEFAULT 0,
    overhead_percentage DECIMAL(5,2) DEFAULT 10,
    margin DECIMAL(5,2) DEFAULT 30,
    -- Calculated totals
    total_material_cost DECIMAL(12,2) DEFAULT 0,
    total_labor_cost DECIMAL(12,2) DEFAULT 0,
    total_overhead DECIMAL(12,2) DEFAULT 0,
    total_cost DECIMAL(12,2) DEFAULT 0,
    suggested_price DECIMAL(12,2) DEFAULT 0,
    -- Status
    is_active BOOLEAN DEFAULT true,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, version)
);

-- BOM Components (materials needed)
CREATE TABLE IF NOT EXISTS bom_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bom_id UUID NOT NULL REFERENCES bom(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    quantity DECIMAL(12,4) NOT NULL,
    unit_id UUID REFERENCES units(id),
    unit_cost DECIMAL(12,4) DEFAULT 0,
    total_cost DECIMAL(12,4) DEFAULT 0,
    waste_percentage DECIMAL(5,2) DEFAULT 0,
    is_optional BOOLEAN DEFAULT false,
    notes TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. COTIZACIONES (QUOTATIONS/ESTIMATES)
-- =============================================

-- Quotations
CREATE TABLE IF NOT EXISTS quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folio VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(200),  -- Denormalized for history
    billing_entity VARCHAR(20) DEFAULT 'DOVECREEK' CHECK (billing_entity IN ('DOVECREEK', 'INNOVATIVE')),
    -- Status workflow
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'CONVERTED', 'CANCELLED', 'EXPIRED')),
    -- Dates
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    valid_until DATE,
    approval_date TIMESTAMPTZ,
    eta DATE,  -- Estimated delivery
    -- Financial
    deposit DECIMAL(12,2) DEFAULT 0,
    deposit_percentage DECIMAL(5,2) DEFAULT 50,
    deposit_paid BOOLEAN DEFAULT false,
    deposit_paid_at TIMESTAMPTZ,
    subtotal DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 16,
    tax DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'MXN',
    -- Details
    notes TEXT,
    internal_notes TEXT,
    terms_conditions TEXT,
    -- Created by
    created_by UUID,
    approved_by UUID,
    -- QuickBooks
    qb_estimate_id VARCHAR(50),
    qb_invoice_id VARCHAR(50),
    skip_qb_sync BOOLEAN DEFAULT false,
    sync_status VARCHAR(20) DEFAULT 'local_only',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotation line items
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL REFERENCES quotations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    -- Item details (denormalized)
    product_name VARCHAR(200),
    product_sku VARCHAR(50),
    description TEXT,
    -- Quantities and pricing
    quantity DECIMAL(12,2) NOT NULL,
    unit_id UUID REFERENCES units(id),
    unit_price DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 16,
    subtotal DECIMAL(12,2) NOT NULL,
    -- Delivery
    delivery_date DATE,
    -- Sort
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 6. SALES ORDERS (REQUISITIONS)
-- =============================================

-- Requisitions / Sales Orders
CREATE TABLE IF NOT EXISTS requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folio VARCHAR(50) UNIQUE NOT NULL,
    -- Source
    quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    quotation_folio VARCHAR(50),
    -- Client/Project
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(200),
    project_id UUID,  -- Will reference projects table
    project_name VARCHAR(200),
    -- Destination
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    warehouse_name VARCHAR(100),
    -- Billing
    billing_entity VARCHAR(20) DEFAULT 'DOVECREEK' CHECK (billing_entity IN ('DOVECREEK', 'INNOVATIVE')),
    -- Status workflow
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED',
        'ORDERED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED'
    )),
    -- Requester
    requester_id UUID,
    requester_name VARCHAR(100),
    -- Dates
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    required_at DATE,
    approval_date TIMESTAMPTZ,
    eta DATE,
    fulfilled_at TIMESTAMPTZ,
    -- Financial
    deposit DECIMAL(12,2) DEFAULT 0,
    deposit_paid BOOLEAN DEFAULT false,
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    -- Details
    comments TEXT,
    approval_comments TEXT,
    rejection_reason TEXT,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    -- QuickBooks
    qb_sales_order_id VARCHAR(50),
    qb_invoice_id VARCHAR(50),
    skip_qb_sync BOOLEAN DEFAULT false,
    sync_status VARCHAR(20) DEFAULT 'local_only',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Requisition line items
CREATE TABLE IF NOT EXISTS requisition_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requisition_id UUID NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
    -- Product or Material
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
    -- Item details (denormalized)
    product_name VARCHAR(200),
    description TEXT,
    -- Quantities
    quantity DECIMAL(12,2) NOT NULL,
    unit_id UUID REFERENCES units(id),
    unit_price DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(12,2) DEFAULT 0,
    subtotal DECIMAL(12,2) DEFAULT 0,
    -- Fulfillment tracking
    status VARCHAR(20) DEFAULT 'REQUESTED' CHECK (status IN (
        'REQUESTED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'
    )),
    ordered_qty DECIMAL(12,2) DEFAULT 0,
    received_qty DECIMAL(12,2) DEFAULT 0,
    -- Dates
    needed_by DATE,
    received_at TIMESTAMPTZ,
    -- Supplier suggestion
    suggested_supplier_id UUID REFERENCES suppliers(id),
    suggested_supplier_name VARCHAR(200),
    -- Notes
    notes TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. PROYECTOS
-- =============================================

-- Projects
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    -- Relations
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(200),
    quotation_id UUID REFERENCES quotations(id) ON DELETE SET NULL,
    -- Status
    status VARCHAR(20) DEFAULT 'planning' CHECK (status IN (
        'planning', 'active', 'on_hold', 'completed', 'cancelled'
    )),
    -- Dates
    start_date DATE,
    end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    -- Financial
    budget DECIMAL(12,2),
    actual_cost DECIMAL(12,2) DEFAULT 0,
    -- Progress
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    -- Team
    manager_id UUID,
    manager_name VARCHAR(100),
    -- Notes
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key from requisitions to projects
ALTER TABLE requisitions
ADD CONSTRAINT fk_requisitions_project
FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;

-- =============================================
-- 8. OPERACIONES (WORK ORDERS)
-- =============================================

-- Operations / Work Orders
CREATE TABLE IF NOT EXISTS operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    folio VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200),
    -- Relations
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    project_name VARCHAR(200),
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(200),
    requisition_id UUID REFERENCES requisitions(id) ON DELETE SET NULL,
    bom_id UUID REFERENCES bom(id) ON DELETE SET NULL,
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'scheduled', 'in_progress', 'on_hold',
        'quality_check', 'completed', 'cancelled'
    )),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    -- Quantities
    quantity INT DEFAULT 1,
    completed_qty INT DEFAULT 0,
    rejected_qty INT DEFAULT 0,
    -- Dates
    scheduled_start DATE,
    scheduled_end DATE,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    due_date DATE,
    -- Progress
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    -- Assignment
    assigned_to UUID,
    assigned_name VARCHAR(100),
    -- Notes
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Operation stages/steps
CREATE TABLE IF NOT EXISTS operation_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
    stage_key VARCHAR(50) NOT NULL,  -- cutting, machining, assembly, finishing, packing, etc
    stage_name VARCHAR(100),
    description TEXT,
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'in_progress', 'completed', 'skipped', 'failed'
    )),
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    -- Dates
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    -- Assignment
    assigned_to UUID,
    assigned_name VARCHAR(100),
    -- Time tracking
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2),
    -- Notes
    notes TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials consumed in operations
CREATE TABLE IF NOT EXISTS operation_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    -- Quantities
    quantity_required DECIMAL(12,4) NOT NULL,
    quantity_allocated DECIMAL(12,4) DEFAULT 0,
    quantity_used DECIMAL(12,4) DEFAULT 0,
    quantity_wasted DECIMAL(12,4) DEFAULT 0,
    -- Source
    warehouse_id UUID REFERENCES warehouses(id),
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'allocated', 'issued', 'returned'
    )),
    issued_at TIMESTAMPTZ,
    issued_by UUID,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 9. QUALITY CONTROL
-- =============================================

-- Quality inspections
CREATE TABLE IF NOT EXISTS quality_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID REFERENCES operations(id) ON DELETE CASCADE,
    operation_stage_id UUID REFERENCES operation_stages(id) ON DELETE CASCADE,
    -- Type
    inspection_type VARCHAR(50) DEFAULT 'in_process' CHECK (inspection_type IN (
        'incoming', 'in_process', 'final', 'random'
    )),
    -- Result
    result VARCHAR(20) DEFAULT 'pending' CHECK (result IN (
        'pending', 'passed', 'failed', 'conditional'
    )),
    -- Details
    inspected_qty INT,
    passed_qty INT DEFAULT 0,
    failed_qty INT DEFAULT 0,
    -- Inspection data
    checklist JSONB,  -- Array of check items with pass/fail
    notes TEXT,
    defects_found TEXT,
    corrective_action TEXT,
    -- Inspector
    inspector_id UUID,
    inspector_name VARCHAR(100),
    inspected_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 10. STAFF / USUARIOS
-- =============================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(100),
    full_name VARCHAR(200),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    -- Role and permissions
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN (
        'admin', 'manager', 'supervisor', 'operator', 'viewer', 'user'
    )),
    permissions JSONB DEFAULT '[]',
    -- Department
    department VARCHAR(100),
    area VARCHAR(100),
    position VARCHAR(100),
    -- Contact
    phone VARCHAR(50),
    mobile VARCHAR(50),
    -- Profile
    avatar_url TEXT,
    -- Status
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    -- Work info
    hire_date DATE,
    hourly_rate DECIMAL(10,2),
    -- Settings
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance tracking
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    -- Times
    clock_in TIME,
    clock_out TIME,
    break_start TIME,
    break_end TIME,
    -- Calculated
    hours_worked DECIMAL(5,2),
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    -- Status
    status VARCHAR(20) DEFAULT 'Present' CHECK (status IN (
        'Present', 'Absent', 'Late', 'Half Day', 'Holiday', 'Vacation', 'Sick'
    )),
    -- Notes
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id, date)
);

-- Performance metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    -- Metrics
    operations_completed INT DEFAULT 0,
    units_produced INT DEFAULT 0,
    quality_score DECIMAL(5,2),  -- Percentage
    efficiency_score DECIMAL(5,2),  -- Percentage
    attendance_score DECIMAL(5,2),  -- Percentage
    overall_score DECIMAL(5,2),  -- Percentage
    -- Details
    notes TEXT,
    evaluated_by UUID,
    evaluated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 11. ACTIVITY LOG
-- =============================================

-- Activity log / Audit trail
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- Who
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name VARCHAR(100),
    user_email VARCHAR(100),
    -- What
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'create', 'update', 'delete', 'view', 'export',
        'login', 'logout', 'approve', 'reject', 'submit'
    )),
    -- Where
    module VARCHAR(50) NOT NULL,  -- clients, products, quotations, etc
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    entity_name VARCHAR(200),
    -- Changes
    old_data JSONB,
    new_data JSONB,
    changes JSONB,  -- Diff of what changed
    -- Context
    ip_address VARCHAR(50),
    user_agent TEXT,
    -- When
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 12. SYSTEM SETTINGS
-- =============================================

-- Application settings
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_public BOOLEAN DEFAULT false,
    updated_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QuickBooks sync queue
CREATE TABLE IF NOT EXISTS qb_sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,  -- client, product, quotation, etc
    entity_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
    priority INT DEFAULT 5,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'cancelled'
    )),
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_message TEXT,
    last_attempt_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ÍNDICES
-- =============================================

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- Materials
CREATE INDEX IF NOT EXISTS idx_materials_sku ON materials(sku);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category_id);
CREATE INDEX IF NOT EXISTS idx_materials_supplier ON materials(supplier_id);
CREATE INDEX IF NOT EXISTS idx_materials_warehouse ON materials(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_materials_status ON materials(status);
CREATE INDEX IF NOT EXISTS idx_materials_low_stock ON materials(stock, min_stock) WHERE stock < min_stock;

-- Products
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- BOM
CREATE INDEX IF NOT EXISTS idx_bom_product ON bom(product_id);
CREATE INDEX IF NOT EXISTS idx_bom_active ON bom(product_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_bom_components_bom ON bom_components(bom_id);
CREATE INDEX IF NOT EXISTS idx_bom_components_material ON bom_components(material_id);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);
CREATE INDEX IF NOT EXISTS idx_clients_company ON clients(company_name);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_billing_entity ON clients(billing_entity);
CREATE INDEX IF NOT EXISTS idx_clients_sync ON clients(sync_status);

-- Suppliers
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);

-- Quotations
CREATE INDEX IF NOT EXISTS idx_quotations_folio ON quotations(folio);
CREATE INDEX IF NOT EXISTS idx_quotations_client ON quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_billing ON quotations(billing_entity);
CREATE INDEX IF NOT EXISTS idx_quotations_date ON quotations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON quotation_items(quotation_id);

-- Requisitions
CREATE INDEX IF NOT EXISTS idx_requisitions_folio ON requisitions(folio);
CREATE INDEX IF NOT EXISTS idx_requisitions_client ON requisitions(client_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_project ON requisitions(project_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_quotation ON requisitions(quotation_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_status ON requisitions(status);
CREATE INDEX IF NOT EXISTS idx_requisitions_date ON requisitions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_requisition_items_requisition ON requisition_items(requisition_id);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_date ON projects(start_date);

-- Operations
CREATE INDEX IF NOT EXISTS idx_operations_folio ON operations(folio);
CREATE INDEX IF NOT EXISTS idx_operations_project ON operations(project_id);
CREATE INDEX IF NOT EXISTS idx_operations_product ON operations(product_id);
CREATE INDEX IF NOT EXISTS idx_operations_status ON operations(status);
CREATE INDEX IF NOT EXISTS idx_operations_date ON operations(due_date);
CREATE INDEX IF NOT EXISTS idx_operation_stages_operation ON operation_stages(operation_id);
CREATE INDEX IF NOT EXISTS idx_operation_materials_operation ON operation_materials(operation_id);
CREATE INDEX IF NOT EXISTS idx_operation_materials_material ON operation_materials(material_id);

-- Stock movements
CREATE INDEX IF NOT EXISTS idx_stock_movements_material ON stock_movements(material_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);

-- Activity log
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_date ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_module ON activity_log(module);

-- Attendance
CREATE INDEX IF NOT EXISTS idx_attendance_staff ON attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date DESC);

-- QB Sync Queue
CREATE INDEX IF NOT EXISTS idx_qb_sync_status ON qb_sync_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_qb_sync_entity ON qb_sync_queue(entity_type, entity_id);

-- =============================================
-- TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN
        SELECT table_name
        FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
            CREATE TRIGGER update_%I_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate quotation totals
CREATE OR REPLACE FUNCTION recalculate_quotation_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_subtotal DECIMAL(12,2);
    v_tax DECIMAL(12,2);
    v_total DECIMAL(12,2);
    v_tax_rate DECIMAL(5,2);
BEGIN
    -- Get tax rate from quotation
    SELECT tax_rate INTO v_tax_rate FROM quotations WHERE id = COALESCE(NEW.quotation_id, OLD.quotation_id);

    -- Calculate totals
    SELECT COALESCE(SUM(subtotal), 0) INTO v_subtotal
    FROM quotation_items
    WHERE quotation_id = COALESCE(NEW.quotation_id, OLD.quotation_id);

    v_tax := v_subtotal * (v_tax_rate / 100);
    v_total := v_subtotal + v_tax;

    -- Update quotation
    UPDATE quotations
    SET subtotal = v_subtotal, tax = v_tax, total = v_total
    WHERE id = COALESCE(NEW.quotation_id, OLD.quotation_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalculate_quotation_totals
AFTER INSERT OR UPDATE OR DELETE ON quotation_items
FOR EACH ROW
EXECUTE FUNCTION recalculate_quotation_totals();

-- Function to recalculate requisition totals
CREATE OR REPLACE FUNCTION recalculate_requisition_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_subtotal DECIMAL(12,2);
    v_tax DECIMAL(12,2);
    v_total DECIMAL(12,2);
BEGIN
    -- Calculate totals
    SELECT COALESCE(SUM(subtotal), 0) INTO v_subtotal
    FROM requisition_items
    WHERE requisition_id = COALESCE(NEW.requisition_id, OLD.requisition_id);

    v_tax := v_subtotal * 0.16;  -- 16% IVA
    v_total := v_subtotal + v_tax;

    -- Update requisition
    UPDATE requisitions
    SET subtotal = v_subtotal, tax = v_tax, total = v_total
    WHERE id = COALESCE(NEW.requisition_id, OLD.requisition_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalculate_requisition_totals
AFTER INSERT OR UPDATE OR DELETE ON requisition_items
FOR EACH ROW
EXECUTE FUNCTION recalculate_requisition_totals();

-- Function to update material available stock
CREATE OR REPLACE FUNCTION update_material_stock()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.movement_type = 'in' THEN
            UPDATE materials SET stock = stock + NEW.quantity WHERE id = NEW.material_id;
        ELSIF NEW.movement_type = 'out' THEN
            UPDATE materials SET stock = stock - NEW.quantity WHERE id = NEW.material_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_material_stock
AFTER INSERT ON stock_movements
FOR EACH ROW
EXECUTE FUNCTION update_material_stock();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on sensitive tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Profiles: users can see all but only update their own
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Attendance: users can see all, modify own
CREATE POLICY "Attendance viewable by authenticated" ON attendance
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert own attendance" ON attendance
    FOR INSERT WITH CHECK (auth.uid() = staff_id);

CREATE POLICY "Users can update own attendance" ON attendance
    FOR UPDATE USING (auth.uid() = staff_id);

-- =============================================
-- SEED DATA (OPTIONAL)
-- =============================================

-- Default categories
INSERT INTO categories (name, description) VALUES
    ('Woods', 'All types of wood and plywood materials'),
    ('Hardware', 'Screws, hinges, slides and other hardware'),
    ('Adhesives', 'Glues, sealants and bonding materials'),
    ('Finishes', 'Paints, lacquers and stains'),
    ('Panels', 'MDF, particle board and composite panels')
ON CONFLICT DO NOTHING;

-- Default units
INSERT INTO units (name, abbreviation, description) VALUES
    ('Piece', 'pz', 'Individual piece or unit'),
    ('Sheet', 'sht', 'Full sheet of material (4x8 ft typical)'),
    ('Box', 'box', 'Box of items (screws, nails, etc.)'),
    ('Pair', 'pr', 'Set of two items (hinges, slides)'),
    ('Gallon', 'gal', 'Liquid gallon (3.785 liters)'),
    ('Liter', 'L', 'Metric liter'),
    ('Linear Foot', 'lf', 'One foot of linear material'),
    ('Square Foot', 'sqft', 'One square foot of material'),
    ('Kilogram', 'kg', 'Metric kilogram'),
    ('Meter', 'm', 'Metric meter')
ON CONFLICT DO NOTHING;

-- Default warehouse
INSERT INTO warehouses (name, code, location, status) VALUES
    ('Main Warehouse', 'WH-001', 'Tijuana, BC', 'active'),
    ('Raw Materials', 'WH-002', 'Tijuana, BC', 'active'),
    ('Finished Goods', 'WH-003', 'Tijuana, BC', 'active')
ON CONFLICT DO NOTHING;

-- Default settings
INSERT INTO settings (key, value, description, category) VALUES
    ('company_name', '"D-KRAFT Manufacturing"', 'Company name', 'general'),
    ('tax_rate', '16', 'Default tax rate (IVA)', 'financial'),
    ('currency', '"MXN"', 'Default currency', 'financial'),
    ('deposit_percentage', '50', 'Default deposit percentage', 'financial'),
    ('qb_sync_enabled', 'true', 'Enable QuickBooks synchronization', 'integrations'),
    ('dovecreek_syncs_qb', 'true', 'DOVECREEK entity syncs to QuickBooks', 'integrations'),
    ('innovative_syncs_qb', 'false', 'INNOVATIVE entity syncs to QuickBooks', 'integrations')
ON CONFLICT (key) DO NOTHING;

-- =============================================
-- DONE
-- =============================================
