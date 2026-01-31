-- ============================================
-- D-KRAFT ERP - SUPABASE SCHEMA
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    department VARCHAR(100),
    position VARCHAR(100),
    role VARCHAR(20) DEFAULT 'USER',
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    hire_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Units of measure
CREATE TABLE IF NOT EXISTS public.units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    abbreviation VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMERCIAL TABLES
-- ============================================

-- Clients
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    address TEXT,
    rfc VARCHAR(20),
    status VARCHAR(20) DEFAULT 'Active',
    qb_id VARCHAR(100),
    sync_status VARCHAR(20) DEFAULT 'local_only',
    sync_error TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE,
    name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    category VARCHAR(100),
    address TEXT,
    rfc VARCHAR(20),
    payment_terms VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Active',
    notes TEXT,
    qb_id VARCHAR(100),
    sync_status VARCHAR(20) DEFAULT 'local_only',
    sync_error TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVENTORY TABLES
-- ============================================

-- Warehouses
CREATE TABLE IF NOT EXISTS public.warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE,
    name VARCHAR(100) NOT NULL,
    location TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id),
    unit_id UUID REFERENCES public.units(id),
    supplier_id UUID REFERENCES public.suppliers(id),
    warehouse_id UUID REFERENCES public.warehouses(id),
    location VARCHAR(50),
    stock DECIMAL(10,2) DEFAULT 0,
    min_stock DECIMAL(10,2) DEFAULT 0,
    max_stock DECIMAL(10,2) DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Active',
    qb_id VARCHAR(100),
    sync_status VARCHAR(20) DEFAULT 'local_only',
    sync_error TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.categories(id),
    cost_price DECIMAL(10,2) DEFAULT 0,
    price DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'MXN',
    account VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Active',
    qb_id VARCHAR(100),
    sync_status VARCHAR(20) DEFAULT 'local_only',
    sync_error TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Materials (BOM link)
CREATE TABLE IF NOT EXISTS public.product_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.materials(id),
    quantity DECIMAL(10,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BOM (Bill of Materials)
-- ============================================

CREATE TABLE IF NOT EXISTS public.bom (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE,
    name VARCHAR(255) NOT NULL,
    product_id UUID REFERENCES public.products(id),
    description TEXT,
    version VARCHAR(10) DEFAULT '1.0',
    status VARCHAR(20) DEFAULT 'Draft',
    total_material_cost DECIMAL(10,2) DEFAULT 0,
    labor_cost DECIMAL(10,2) DEFAULT 0,
    overhead_cost DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0,
    margin DECIMAL(5,2) DEFAULT 0,
    suggested_price DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bom_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bom_id UUID REFERENCES public.bom(id) ON DELETE CASCADE,
    component_type VARCHAR(20) NOT NULL,
    material_id UUID REFERENCES public.materials(id),
    sub_bom_id UUID REFERENCES public.bom(id),
    quantity DECIMAL(10,2) NOT NULL,
    unit_cost DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PRODUCTION TABLES
-- ============================================

-- Projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID REFERENCES public.clients(id),
    status VARCHAR(20) DEFAULT 'Active',
    po_number VARCHAR(50),
    work_order VARCHAR(50),
    estimate_number VARCHAR(50),
    terms VARCHAR(50),
    ship_to TEXT,
    contact VARCHAR(255),
    sales_rep_id UUID REFERENCES public.profiles(id),
    csr_id UUID REFERENCES public.profiles(id),
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quotations
CREATE TABLE IF NOT EXISTS public.quotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number VARCHAR(50) UNIQUE,
    client_id UUID REFERENCES public.clients(id),
    project_id UUID REFERENCES public.projects(id),
    status VARCHAR(20) DEFAULT 'Draft',
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    valid_until DATE,
    qb_id VARCHAR(100),
    qb_type VARCHAR(20),
    sync_status VARCHAR(20) DEFAULT 'local_only',
    sync_error TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID REFERENCES public.quotations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Requisitions
CREATE TABLE IF NOT EXISTS public.requisitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    number VARCHAR(50) UNIQUE,
    type VARCHAR(20) DEFAULT 'SALES',
    client_id UUID REFERENCES public.clients(id),
    supplier_id UUID REFERENCES public.suppliers(id),
    project_id UUID REFERENCES public.projects(id),
    quotation_id UUID REFERENCES public.quotations(id),
    requester_id UUID REFERENCES public.profiles(id),
    status VARCHAR(20) DEFAULT 'DRAFT',
    subtotal DECIMAL(12,2) DEFAULT 0,
    tax DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    qb_id VARCHAR(100),
    sync_status VARCHAR(20) DEFAULT 'local_only',
    sync_error TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.requisition_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requisition_id UUID REFERENCES public.requisitions(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    material_id UUID REFERENCES public.materials(id),
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Operations (Work Orders)
CREATE TABLE IF NOT EXISTS public.operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_number VARCHAR(50) UNIQUE,
    project_id UUID REFERENCES public.projects(id),
    status VARCHAR(20) DEFAULT 'Pending',
    priority VARCHAR(20) DEFAULT 'Medium',
    current_stage VARCHAR(50),
    progress INTEGER DEFAULT 0,
    assigned_divisions TEXT[],
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.operation_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID REFERENCES public.operations(id) ON DELETE CASCADE,
    stage_key VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    assigned_to UUID[],
    start_date DATE,
    end_date DATE,
    estimated_hours DECIMAL(6,2) DEFAULT 0,
    actual_hours DECIMAL(6,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.operation_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID REFERENCES public.operations(id) ON DELETE CASCADE,
    material_id UUID REFERENCES public.materials(id),
    estimated DECIMAL(10,2) DEFAULT 0,
    distributed DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- HR & PERFORMANCE TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES public.profiles(id),
    date DATE NOT NULL,
    clock_in TIME,
    clock_out TIME,
    hours_worked DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Present',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.staff_operation_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES public.profiles(id),
    operation_id UUID REFERENCES public.operations(id),
    stage VARCHAR(50),
    date DATE NOT NULL,
    hours DECIMAL(5,2) NOT NULL,
    division VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- QUALITY ASSURANCE
-- ============================================

CREATE TABLE IF NOT EXISTS public.qa_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID REFERENCES public.operations(id),
    stage VARCHAR(50),
    inspector_id UUID REFERENCES public.profiles(id),
    inspection_date DATE,
    status VARCHAR(20) DEFAULT 'Pending',
    result VARCHAR(50),
    checklist JSONB,
    findings JSONB,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACTIVITY LOG
-- ============================================

CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_clients_qb_id ON public.clients(qb_id);
CREATE INDEX IF NOT EXISTS idx_clients_sync_status ON public.clients(sync_status);
CREATE INDEX IF NOT EXISTS idx_products_qb_id ON public.products(qb_id);
CREATE INDEX IF NOT EXISTS idx_materials_qb_id ON public.materials(qb_id);
CREATE INDEX IF NOT EXISTS idx_quotations_qb_id ON public.quotations(qb_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_qb_id ON public.requisitions(qb_id);
CREATE INDEX IF NOT EXISTS idx_operations_project ON public.operations(project_id);
CREATE INDEX IF NOT EXISTS idx_attendance_staff_date ON public.attendance(staff_id, date);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON public.activity_log(entity_type, entity_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bom_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisition_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operation_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_operation_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICIES - Allow authenticated users full access
-- ============================================

-- Profiles
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE TO authenticated USING (true);

-- Clients
CREATE POLICY "clients_select" ON public.clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients_insert" ON public.clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clients_update" ON public.clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "clients_delete" ON public.clients FOR DELETE TO authenticated USING (true);

-- Suppliers
CREATE POLICY "suppliers_select" ON public.suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "suppliers_insert" ON public.suppliers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "suppliers_update" ON public.suppliers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "suppliers_delete" ON public.suppliers FOR DELETE TO authenticated USING (true);

-- Materials
CREATE POLICY "materials_select" ON public.materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "materials_insert" ON public.materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "materials_update" ON public.materials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "materials_delete" ON public.materials FOR DELETE TO authenticated USING (true);

-- Products
CREATE POLICY "products_select" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_insert" ON public.products FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "products_update" ON public.products FOR UPDATE TO authenticated USING (true);
CREATE POLICY "products_delete" ON public.products FOR DELETE TO authenticated USING (true);

-- Projects
CREATE POLICY "projects_select" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects_insert" ON public.projects FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "projects_update" ON public.projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "projects_delete" ON public.projects FOR DELETE TO authenticated USING (true);

-- Quotations
CREATE POLICY "quotations_select" ON public.quotations FOR SELECT TO authenticated USING (true);
CREATE POLICY "quotations_insert" ON public.quotations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "quotations_update" ON public.quotations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "quotations_delete" ON public.quotations FOR DELETE TO authenticated USING (true);

-- Requisitions
CREATE POLICY "requisitions_select" ON public.requisitions FOR SELECT TO authenticated USING (true);
CREATE POLICY "requisitions_insert" ON public.requisitions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "requisitions_update" ON public.requisitions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "requisitions_delete" ON public.requisitions FOR DELETE TO authenticated USING (true);

-- Operations
CREATE POLICY "operations_select" ON public.operations FOR SELECT TO authenticated USING (true);
CREATE POLICY "operations_insert" ON public.operations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "operations_update" ON public.operations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "operations_delete" ON public.operations FOR DELETE TO authenticated USING (true);

-- Categories
CREATE POLICY "categories_select" ON public.categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories_insert" ON public.categories FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "categories_update" ON public.categories FOR UPDATE TO authenticated USING (true);
CREATE POLICY "categories_delete" ON public.categories FOR DELETE TO authenticated USING (true);

-- Units
CREATE POLICY "units_select" ON public.units FOR SELECT TO authenticated USING (true);
CREATE POLICY "units_insert" ON public.units FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "units_update" ON public.units FOR UPDATE TO authenticated USING (true);
CREATE POLICY "units_delete" ON public.units FOR DELETE TO authenticated USING (true);

-- Warehouses
CREATE POLICY "warehouses_select" ON public.warehouses FOR SELECT TO authenticated USING (true);
CREATE POLICY "warehouses_insert" ON public.warehouses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "warehouses_update" ON public.warehouses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "warehouses_delete" ON public.warehouses FOR DELETE TO authenticated USING (true);

-- BOM
CREATE POLICY "bom_select" ON public.bom FOR SELECT TO authenticated USING (true);
CREATE POLICY "bom_insert" ON public.bom FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "bom_update" ON public.bom FOR UPDATE TO authenticated USING (true);
CREATE POLICY "bom_delete" ON public.bom FOR DELETE TO authenticated USING (true);

-- BOM Components
CREATE POLICY "bom_components_select" ON public.bom_components FOR SELECT TO authenticated USING (true);
CREATE POLICY "bom_components_insert" ON public.bom_components FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "bom_components_update" ON public.bom_components FOR UPDATE TO authenticated USING (true);
CREATE POLICY "bom_components_delete" ON public.bom_components FOR DELETE TO authenticated USING (true);

-- Quotation Items
CREATE POLICY "quotation_items_select" ON public.quotation_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "quotation_items_insert" ON public.quotation_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "quotation_items_update" ON public.quotation_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "quotation_items_delete" ON public.quotation_items FOR DELETE TO authenticated USING (true);

-- Requisition Items
CREATE POLICY "requisition_items_select" ON public.requisition_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "requisition_items_insert" ON public.requisition_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "requisition_items_update" ON public.requisition_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "requisition_items_delete" ON public.requisition_items FOR DELETE TO authenticated USING (true);

-- Operation Stages
CREATE POLICY "operation_stages_select" ON public.operation_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY "operation_stages_insert" ON public.operation_stages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "operation_stages_update" ON public.operation_stages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "operation_stages_delete" ON public.operation_stages FOR DELETE TO authenticated USING (true);

-- Operation Materials
CREATE POLICY "operation_materials_select" ON public.operation_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "operation_materials_insert" ON public.operation_materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "operation_materials_update" ON public.operation_materials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "operation_materials_delete" ON public.operation_materials FOR DELETE TO authenticated USING (true);

-- Product Materials
CREATE POLICY "product_materials_select" ON public.product_materials FOR SELECT TO authenticated USING (true);
CREATE POLICY "product_materials_insert" ON public.product_materials FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "product_materials_update" ON public.product_materials FOR UPDATE TO authenticated USING (true);
CREATE POLICY "product_materials_delete" ON public.product_materials FOR DELETE TO authenticated USING (true);

-- Attendance
CREATE POLICY "attendance_select" ON public.attendance FOR SELECT TO authenticated USING (true);
CREATE POLICY "attendance_insert" ON public.attendance FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "attendance_update" ON public.attendance FOR UPDATE TO authenticated USING (true);
CREATE POLICY "attendance_delete" ON public.attendance FOR DELETE TO authenticated USING (true);

-- Staff Operation Hours
CREATE POLICY "staff_operation_hours_select" ON public.staff_operation_hours FOR SELECT TO authenticated USING (true);
CREATE POLICY "staff_operation_hours_insert" ON public.staff_operation_hours FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "staff_operation_hours_update" ON public.staff_operation_hours FOR UPDATE TO authenticated USING (true);
CREATE POLICY "staff_operation_hours_delete" ON public.staff_operation_hours FOR DELETE TO authenticated USING (true);

-- QA Inspections
CREATE POLICY "qa_inspections_select" ON public.qa_inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "qa_inspections_insert" ON public.qa_inspections FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "qa_inspections_update" ON public.qa_inspections FOR UPDATE TO authenticated USING (true);
CREATE POLICY "qa_inspections_delete" ON public.qa_inspections FOR DELETE TO authenticated USING (true);

-- Activity Log
CREATE POLICY "activity_log_select" ON public.activity_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "activity_log_insert" ON public.activity_log FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON public.materials FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_requisitions_updated_at BEFORE UPDATE ON public.requisitions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_operations_updated_at BEFORE UPDATE ON public.operations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bom_updated_at BEFORE UPDATE ON public.bom FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'USER')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- DONE!
-- ============================================
SELECT 'D-KRAFT Schema created successfully!' as status;
