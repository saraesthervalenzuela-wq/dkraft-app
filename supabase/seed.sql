-- ============================================
-- D-KRAFT ERP - SEED DATA
-- Migración de datos existentes de initialData.js
-- Ejecutar DESPUÉS del schema.sql
-- ============================================

-- ============================================
-- CATEGORIES
-- ============================================
INSERT INTO public.categories (id, name, type) VALUES
    (uuid_generate_v4(), 'Boards', 'material'),
    (uuid_generate_v4(), 'Hardware', 'material'),
    (uuid_generate_v4(), 'Finishes', 'material'),
    (uuid_generate_v4(), 'Fasteners', 'material'),
    (uuid_generate_v4(), 'Glass', 'material'),
    (uuid_generate_v4(), 'Textiles', 'material'),
    (uuid_generate_v4(), 'Metals', 'material'),
    (uuid_generate_v4(), 'Electronics', 'material'),
    (uuid_generate_v4(), 'Wood', 'supplier'),
    (uuid_generate_v4(), 'Packaging', 'supplier');

-- ============================================
-- UNITS
-- ============================================
INSERT INTO public.units (id, name, abbreviation) VALUES
    (uuid_generate_v4(), 'Piece', 'pc'),
    (uuid_generate_v4(), 'Pair', 'pr'),
    (uuid_generate_v4(), 'Box', 'box'),
    (uuid_generate_v4(), 'Gallon', 'gal'),
    (uuid_generate_v4(), 'Square Meter', 'sqm'),
    (uuid_generate_v4(), 'Meter', 'm'),
    (uuid_generate_v4(), 'Kilogram', 'kg'),
    (uuid_generate_v4(), 'Liter', 'L');

-- ============================================
-- WAREHOUSES
-- ============================================
INSERT INTO public.warehouses (id, code, name, location, status) VALUES
    (uuid_generate_v4(), 'WH-001', 'Main Warehouse', 'Building A', 'Active'),
    (uuid_generate_v4(), 'WH-002', 'Raw Materials', 'Building B', 'Active'),
    (uuid_generate_v4(), 'WH-003', 'Finished Goods', 'Building C', 'Active');

-- ============================================
-- SUPPLIERS
-- ============================================
INSERT INTO public.suppliers (id, code, name, contact_name, email, phone, category, address, rfc, payment_terms, status, notes, sync_status) VALUES
    (uuid_generate_v4(), 'SUP001', 'Northern Woods', 'Fernando Vega', 'sales@northernwoods.com', '(664) 111-2233', 'Wood', 'Industrial Blvd 1234, Tijuana BC', 'MNO850101ABC', 'Net 30', 'Active', 'Main supplier for fine woods', 'local_only'),
    (uuid_generate_v4(), 'SUP002', 'Industrial Hardware SA', 'Carmen Diaz', 'contact@industrialhardware.mx', '(664) 222-3344', 'Hardware', 'Tech Ave 567, Tijuana BC', 'HIS900215DEF', 'Net 15', 'Active', 'Fast deliveries, good service', 'local_only'),
    (uuid_generate_v4(), 'SUP003', 'Premium Paints', 'Ricardo Morales', 'ricardo@premiumpaints.com', '(664) 333-4455', 'Finishes', '5th Street 890, Downtown, Tijuana BC', 'PPR880520GHI', 'Net 30', 'Active', '', 'local_only'),
    (uuid_generate_v4(), 'SUP004', 'Modern Textiles', 'Gabriela Fuentes', 'gfuentes@moderntextiles.com', '(664) 444-5566', 'Textiles', 'El Florido Industrial Park, Tijuana BC', 'TMO920830JKL', 'COD', 'Inactive', 'Temporarily out of stock', 'local_only'),
    (uuid_generate_v4(), 'SUP005', 'BC Glass & Crystals', 'Alberto Ramos', 'sales@bcglass.com', '(664) 555-6677', 'Glass', 'Diaz Ordaz Blvd 2345, Tijuana BC', 'VCB870115MNO', 'Net 45', 'Active', 'Tempered glass specialists', 'local_only'),
    (uuid_generate_v4(), 'SUP006', 'Pacific Steel', 'Oscar Medina', 'omedina@pacificsteel.mx', '(664) 666-7788', 'Metal', 'Otay Industrial Zone, Tijuana BC', 'ADP910425PQR', 'Net 30', 'Active', '', 'local_only');

-- ============================================
-- CLIENTS
-- ============================================
INSERT INTO public.clients (id, code, name, email, phone, company, status, sync_status) VALUES
    (uuid_generate_v4(), '0001', 'Jackson Moore', 'jackson.moore@gmail.com', '(664) 315 26 79', 'MooreTech', 'Inactive', 'local_only'),
    (uuid_generate_v4(), '0002', 'Alicia Smithson', 'alicia.smithson@gmail.com', '(664) 315 26 79', 'Smithson & Co.', 'Active', 'local_only'),
    (uuid_generate_v4(), '0003', 'Natalie Johnson', 'natalie.johnsonf@gmail.com', '(664) 315 26 79', 'Nova Wellness', 'Inactive', 'local_only'),
    (uuid_generate_v4(), '0004', 'Patrick Cooper', 'patrick.cooper@hotmail.com', '(664) 315 26 79', 'Cooper Logistics', 'Active', 'local_only'),
    (uuid_generate_v4(), '0005', 'Gilda Ramos', 'gilda.ramos@gmail.com', '(664) 315 26 79', 'Ramos Culinary', 'Inactive', 'local_only'),
    (uuid_generate_v4(), '0006', 'Clara Simmons', 'clara.simmons@gmail.com', '(664) 315 26 79', 'Simmons', 'Inactive', 'local_only'),
    (uuid_generate_v4(), '0007', 'Daniel White', 'daniel.white@gmail.com', '(664) 315 26 79', 'WhitePeak', 'Active', 'local_only'),
    (uuid_generate_v4(), '0008', 'Robert Garcia', 'robert.garcia@gmail.com', '(664) 287 43 21', 'Garcia Industries', 'Active', 'local_only'),
    (uuid_generate_v4(), '0009', 'Maria Elena Ruiz', 'maria.ruiz@outlook.com', '(664) 198 76 54', 'Ruiz & Associates', 'Active', 'local_only'),
    (uuid_generate_v4(), '0010', 'Fernando Lopez', 'flopez@company.com', '(664) 445 32 18', 'Lopez Tech', 'Inactive', 'local_only'),
    (uuid_generate_v4(), '0011', 'Ana Patricia Mendez', 'anamendez@gmail.com', '(664) 332 87 65', 'Mendez Furniture', 'Active', 'local_only'),
    (uuid_generate_v4(), '0012', 'Carlos Hernandez', 'carlos.h@hotmail.com', '(664) 556 43 21', 'Hernandez Corp', 'Active', 'local_only'),
    (uuid_generate_v4(), '0013', 'Sofia Vargas', 'sofia.vargas@gmail.com', '(664) 223 98 76', 'Vargas Design', 'Inactive', 'local_only'),
    (uuid_generate_v4(), '0014', 'Miguel Angel Torres', 'matorres@company.mx', '(664) 778 12 34', 'Torres Solutions', 'Active', 'local_only'),
    (uuid_generate_v4(), '0015', 'Laura Sanchez', 'laura.sanchez@outlook.com', '(664) 445 67 89', 'Sanchez & Co.', 'Active', 'local_only'),
    (uuid_generate_v4(), '0016', 'Diego Morales', 'dmorales@gmail.com', '(664) 112 34 56', 'Morales Studio', 'Inactive', 'local_only'),
    (uuid_generate_v4(), '0017', 'Isabella Reyes', 'isabella.r@company.com', '(664) 889 45 67', 'Reyes Interiors', 'Active', 'local_only');

-- ============================================
-- PRODUCTS
-- ============================================
INSERT INTO public.products (id, code, name, description, cost_price, price, currency, account, status, sync_status) VALUES
    (uuid_generate_v4(), 'PROD-001', 'Executive Desk', 'Executive desk in walnut wood with matte finish', 4500.00, 8500.00, 'MXN', 'Sales - Furniture', 'Active', 'local_only'),
    (uuid_generate_v4(), 'PROD-002', 'Premium Ergonomic Chair', 'Ergonomic chair with lumbar support and adjustable armrests', 2800.00, 5200.00, 'MXN', 'Sales - Furniture', 'Active', 'local_only'),
    (uuid_generate_v4(), 'PROD-003', '5-Tier Modular Bookshelf', '5-tier modular bookshelf in white melamine', 1800.00, 3400.00, 'MXN', 'Sales - Furniture', 'Active', 'local_only'),
    (uuid_generate_v4(), 'PROD-004', '8-Person Conference Table', 'Conference table for 8 people with metal base', 8500.00, 15000.00, 'MXN', 'Sales - Furniture', 'Active', 'local_only'),
    (uuid_generate_v4(), 'PROD-005', '4-Drawer File Cabinet', 'Metal 4-drawer file cabinet with lock', 2200.00, 4100.00, 'MXN', 'Sales - Furniture', 'Inactive', 'local_only'),
    (uuid_generate_v4(), 'PROD-006', 'Executive Credenza', 'Executive credenza with sliding doors and drawers', 5500.00, 9800.00, 'MXN', 'Sales - Furniture', 'Active', 'local_only');

-- ============================================
-- MATERIALS (usando referencias hardcoded por ahora)
-- ============================================
INSERT INTO public.materials (id, code, name, description, location, stock, min_stock, max_stock, cost, status, sync_status) VALUES
    (uuid_generate_v4(), 'MAT-001', 'MDF 18mm Natural', 'MDF board 18mm, natural finish', 'A-01-01', 150, 50, 300, 450.00, 'Active', 'local_only'),
    (uuid_generate_v4(), 'MAT-002', 'White Melamine 16mm', 'White melamine board 16mm', 'A-01-02', 85, 30, 200, 380.00, 'Active', 'local_only'),
    (uuid_generate_v4(), 'MAT-003', 'Soft Close Hinge', 'Soft close hinge 35mm', 'B-02-01', 500, 100, 1000, 45.00, 'Active', 'local_only'),
    (uuid_generate_v4(), 'MAT-004', 'Telescopic Slide 45cm', 'Full extension telescopic slide 45cm', 'B-02-02', 12, 50, 200, 120.00, 'Low Stock', 'local_only'),
    (uuid_generate_v4(), 'MAT-005', 'White Matte Lacquer', 'Polyurethane white matte lacquer, gallon', 'C-03-01', 25, 10, 50, 650.00, 'Active', 'local_only'),
    (uuid_generate_v4(), 'MAT-006', 'Screw 4x40mm', 'Particle board screw 4x40mm, box of 500', 'B-03-01', 45, 20, 100, 180.00, 'Active', 'local_only'),
    (uuid_generate_v4(), 'MAT-007', 'Tempered Glass 6mm', 'Clear tempered glass 6mm, per sqm', 'D-01-01', 30, 15, 60, 850.00, 'Active', 'local_only'),
    (uuid_generate_v4(), 'MAT-008', 'Gray Linen Fabric', 'Linen-type fabric gray color, linear meter', 'E-01-01', 0, 20, 100, 220.00, 'Out of Stock', 'local_only');

-- ============================================
-- Mensaje de éxito
-- ============================================
SELECT 'Seed data inserted successfully! Total records:' as status,
    (SELECT COUNT(*) FROM public.clients) as clients,
    (SELECT COUNT(*) FROM public.suppliers) as suppliers,
    (SELECT COUNT(*) FROM public.products) as products,
    (SELECT COUNT(*) FROM public.materials) as materials;
