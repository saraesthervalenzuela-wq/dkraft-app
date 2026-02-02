-- ============================================
-- D-KRAFT ERP - Fix Missing Foreign Key Relations
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Fecha: 2026-02-02
-- ============================================

-- Este script agrega las foreign keys faltantes que PostgREST
-- necesita para descubrir las relaciones automaticamente

-- ============================================
-- 1. MATERIALS -> CATEGORIES
-- ============================================

-- Verificar si la FK existe, si no, crearla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'materials_category_id_fkey'
        AND table_name = 'materials'
    ) THEN
        -- Primero verificar que la columna existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'materials' AND column_name = 'category_id'
        ) THEN
            ALTER TABLE public.materials
            ADD CONSTRAINT materials_category_id_fkey
            FOREIGN KEY (category_id) REFERENCES public.categories(id)
            ON DELETE SET NULL;
            RAISE NOTICE 'FK materials_category_id_fkey created';
        END IF;
    ELSE
        RAISE NOTICE 'FK materials_category_id_fkey already exists';
    END IF;
END $$;

-- ============================================
-- 2. PRODUCTS -> CATEGORIES
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'products_category_id_fkey'
        AND table_name = 'products'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'products' AND column_name = 'category_id'
        ) THEN
            ALTER TABLE public.products
            ADD CONSTRAINT products_category_id_fkey
            FOREIGN KEY (category_id) REFERENCES public.categories(id)
            ON DELETE SET NULL;
            RAISE NOTICE 'FK products_category_id_fkey created';
        END IF;
    ELSE
        RAISE NOTICE 'FK products_category_id_fkey already exists';
    END IF;
END $$;

-- ============================================
-- 3. BOM_COMPONENTS -> BOM (primary relation)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'bom_components_bom_id_fkey'
        AND table_name = 'bom_components'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'bom_components' AND column_name = 'bom_id'
        ) THEN
            ALTER TABLE public.bom_components
            ADD CONSTRAINT bom_components_bom_id_fkey
            FOREIGN KEY (bom_id) REFERENCES public.bom(id)
            ON DELETE CASCADE;
            RAISE NOTICE 'FK bom_components_bom_id_fkey created';
        END IF;
    ELSE
        RAISE NOTICE 'FK bom_components_bom_id_fkey already exists';
    END IF;
END $$;

-- ============================================
-- 4. PROJECTS -> QUOTATIONS
-- ============================================

-- Primero verificar si la columna quotation_id existe en projects
DO $$
BEGIN
    -- Agregar columna si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'quotation_id'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN quotation_id UUID;
        RAISE NOTICE 'Column quotation_id added to projects';
    END IF;

    -- Agregar FK si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'projects_quotation_id_fkey'
        AND table_name = 'projects'
    ) THEN
        ALTER TABLE public.projects
        ADD CONSTRAINT projects_quotation_id_fkey
        FOREIGN KEY (quotation_id) REFERENCES public.quotations(id)
        ON DELETE SET NULL;
        RAISE NOTICE 'FK projects_quotation_id_fkey created';
    ELSE
        RAISE NOTICE 'FK projects_quotation_id_fkey already exists';
    END IF;
END $$;

-- ============================================
-- 5. OPERATIONS -> PRODUCTS
-- ============================================

DO $$
BEGIN
    -- Agregar columna si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'operations' AND column_name = 'product_id'
    ) THEN
        ALTER TABLE public.operations ADD COLUMN product_id UUID;
        RAISE NOTICE 'Column product_id added to operations';
    END IF;

    -- Agregar FK si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'operations_product_id_fkey'
        AND table_name = 'operations'
    ) THEN
        ALTER TABLE public.operations
        ADD CONSTRAINT operations_product_id_fkey
        FOREIGN KEY (product_id) REFERENCES public.products(id)
        ON DELETE SET NULL;
        RAISE NOTICE 'FK operations_product_id_fkey created';
    ELSE
        RAISE NOTICE 'FK operations_product_id_fkey already exists';
    END IF;
END $$;

-- ============================================
-- 6. OPERATIONS -> REQUISITIONS
-- ============================================

DO $$
BEGIN
    -- Agregar columna si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'operations' AND column_name = 'requisition_id'
    ) THEN
        ALTER TABLE public.operations ADD COLUMN requisition_id UUID;
        RAISE NOTICE 'Column requisition_id added to operations';
    END IF;

    -- Agregar FK si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'operations_requisition_id_fkey'
        AND table_name = 'operations'
    ) THEN
        ALTER TABLE public.operations
        ADD CONSTRAINT operations_requisition_id_fkey
        FOREIGN KEY (requisition_id) REFERENCES public.requisitions(id)
        ON DELETE SET NULL;
        RAISE NOTICE 'FK operations_requisition_id_fkey created';
    ELSE
        RAISE NOTICE 'FK operations_requisition_id_fkey already exists';
    END IF;
END $$;

-- ============================================
-- 7. OPERATIONS -> BOM
-- ============================================

DO $$
BEGIN
    -- Agregar columna si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'operations' AND column_name = 'bom_id'
    ) THEN
        ALTER TABLE public.operations ADD COLUMN bom_id UUID;
        RAISE NOTICE 'Column bom_id added to operations';
    END IF;

    -- Agregar FK si no existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'operations_bom_id_fkey'
        AND table_name = 'operations'
    ) THEN
        ALTER TABLE public.operations
        ADD CONSTRAINT operations_bom_id_fkey
        FOREIGN KEY (bom_id) REFERENCES public.bom(id)
        ON DELETE SET NULL;
        RAISE NOTICE 'FK operations_bom_id_fkey created';
    ELSE
        RAISE NOTICE 'FK operations_bom_id_fkey already exists';
    END IF;
END $$;

-- ============================================
-- REFRESH POSTGREST SCHEMA CACHE
-- ============================================

-- Notificar a PostgREST que recargue el schema
NOTIFY pgrst, 'reload schema';

-- ============================================
-- VERIFICACION
-- ============================================

-- Mostrar todas las foreign keys de las tablas principales
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
    AND tc.table_name IN ('materials', 'products', 'bom_components', 'projects', 'operations')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- DONE!
-- ============================================

SELECT 'Foreign key relations fixed successfully!' AS status;
