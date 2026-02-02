-- ============================================
-- D-KRAFT ERP - COMPLETE SCHEMA FIX
-- Execute in Supabase SQL Editor
-- This adds ALL missing columns to ALL tables
-- Date: 2026-02-02
-- ============================================

-- ============================================
-- 1. CLIENTS TABLE
-- ============================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_name VARCHAR(200);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'México';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tax_id VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(50) DEFAULT 'Net 30';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS credit_limit DECIMAL(12,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS balance DECIMAL(12,2) DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_entity VARCHAR(20) DEFAULT 'DOVECREEK';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website VARCHAR(200);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS qb_customer_id VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS qb_sync_token VARCHAR(10);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'local_only';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- 2. SUPPLIERS TABLE
-- ============================================
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS company_name VARCHAR(200);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_name VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS mobile VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'México';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tax_id VARCHAR(20);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(50) DEFAULT 'Net 30';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS lead_time_days INT DEFAULT 7;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS minimum_order DECIMAL(12,2) DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS rating INT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS website VARCHAR(200);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS qb_vendor_id VARCHAR(50);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'local_only';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- 3. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES categories(id),
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. UNITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    abbreviation VARCHAR(10),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. WAREHOUSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    location TEXT,
    address TEXT,
    manager_name VARCHAR(100),
    phone VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. MATERIALS TABLE
-- ============================================
ALTER TABLE materials ADD COLUMN IF NOT EXISTS sku VARCHAR(50);
ALTER TABLE materials ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS unit_id UUID;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS supplier_id UUID;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS secondary_supplier_id UUID;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(12,4) DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS last_cost DECIMAL(12,4) DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS avg_cost DECIMAL(12,4) DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS stock DECIMAL(12,4) DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS reserved_stock DECIMAL(12,4) DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS min_stock DECIMAL(12,4) DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS max_stock DECIMAL(12,4);
ALTER TABLE materials ADD COLUMN IF NOT EXISTS reorder_point DECIMAL(12,4) DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS reorder_qty DECIMAL(12,4) DEFAULT 0;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS warehouse_id UUID;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS location_code VARCHAR(50);
ALTER TABLE materials ADD COLUMN IF NOT EXISTS qb_item_id VARCHAR(50);
ALTER TABLE materials ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'local_only';
ALTER TABLE materials ADD COLUMN IF NOT EXISTS skip_qb_sync BOOLEAN DEFAULT false;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE materials ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- 7. PRODUCTS TABLE
-- ============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_id UUID;
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_price DECIMAL(12,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(12,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS margin_percent DECIMAL(5,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS production_time_hours DECIMAL(8,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight DECIMAL(10,3);
ALTER TABLE products ADD COLUMN IF NOT EXISTS dimensions VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS qb_item_id VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'local_only';
ALTER TABLE products ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- 8. QUOTATIONS TABLE
-- ============================================
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS folio VARCHAR(50);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS billing_entity VARCHAR(20) DEFAULT 'DOVECREEK';
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS tax DECIMAL(12,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS total DECIMAL(12,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS deposit DECIMAL(12,2) DEFAULT 0;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT false;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS approval_date TIMESTAMPTZ;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS eta DATE;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS valid_until DATE;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS qb_estimate_id VARCHAR(50);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'local_only';
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- 9. QUOTATION_ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS quotation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quotation_id UUID NOT NULL,
    product_id UUID,
    description TEXT,
    quantity DECIMAL(12,4) DEFAULT 1,
    unit_price DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(5,2) DEFAULT 0,
    subtotal DECIMAL(12,2) DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. REQUISITIONS TABLE
-- ============================================
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS folio VARCHAR(50);
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS quotation_id UUID;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS billing_entity VARCHAR(20) DEFAULT 'DOVECREEK';
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS warehouse_id UUID;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12,2) DEFAULT 0;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS tax DECIMAL(12,2) DEFAULT 0;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS total DECIMAL(12,2) DEFAULT 0;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS deposit DECIMAL(12,2) DEFAULT 0;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT false;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS required_at DATE;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS approval_date TIMESTAMPTZ;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS eta DATE;
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS qb_sales_order_id VARCHAR(50);
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS sync_status VARCHAR(20) DEFAULT 'local_only';
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE requisitions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- 11. REQUISITION_ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS requisition_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requisition_id UUID NOT NULL,
    product_id UUID,
    description TEXT,
    quantity DECIMAL(12,4) DEFAULT 1,
    unit_price DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(5,2) DEFAULT 0,
    subtotal DECIMAL(12,2) DEFAULT 0,
    fulfilled_qty DECIMAL(12,4) DEFAULT 0,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. PROJECTS TABLE
-- ============================================
ALTER TABLE projects ADD COLUMN IF NOT EXISTS po_number VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS quotation_id UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tax DECIMAL(12,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total DECIMAL(12,2) DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- 13. BOM TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bom (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    status VARCHAR(20) DEFAULT 'draft',
    total_material_cost DECIMAL(12,2) DEFAULT 0,
    total_labor_cost DECIMAL(12,2) DEFAULT 0,
    total_cost DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 14. BOM_COMPONENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bom_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bom_id UUID NOT NULL,
    material_id UUID,
    quantity DECIMAL(12,4) DEFAULT 1,
    unit_cost DECIMAL(12,4) DEFAULT 0,
    total_cost DECIMAL(12,2) DEFAULT 0,
    waste_percent DECIMAL(5,2) DEFAULT 0,
    notes TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 15. OPERATIONS TABLE
-- ============================================
ALTER TABLE operations ADD COLUMN IF NOT EXISTS work_order_number VARCHAR(50);
ALTER TABLE operations ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE operations ADD COLUMN IF NOT EXISTS product_id UUID;
ALTER TABLE operations ADD COLUMN IF NOT EXISTS requisition_id UUID;
ALTER TABLE operations ADD COLUMN IF NOT EXISTS bom_id UUID;
ALTER TABLE operations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE operations ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
ALTER TABLE operations ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0;
ALTER TABLE operations ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE operations ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE operations ADD COLUMN IF NOT EXISTS completed_date DATE;
ALTER TABLE operations ADD COLUMN IF NOT EXISTS estimated_hours DECIMAL(8,2) DEFAULT 0;
ALTER TABLE operations ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(8,2) DEFAULT 0;
ALTER TABLE operations ADD COLUMN IF NOT EXISTS current_stage VARCHAR(50);
ALTER TABLE operations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE operations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- 16. PROFILES (STAFF) TABLE
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS position VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(200);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(50);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS shift VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================
-- 17. ACTIVITY_LOG TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 18. QB_SYNC_QUEUE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS qb_sync_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- ============================================
-- REFRESH SCHEMA CACHE
-- ============================================
NOTIFY pgrst, 'reload schema';

SELECT '============================================' as status;
SELECT 'MIGRATION COMPLETE!' as status;
SELECT 'All tables have been updated.' as status;
SELECT 'Schema cache has been refreshed.' as status;
SELECT '============================================' as status;
