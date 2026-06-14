-- ============================================
-- D-KRAFT ERP - Fix Missing Relations
-- Ejecutar en: https://supabase.com/dashboard/project/qalqscfrcxzzvrcvqqbp/sql/new
-- ============================================

-- 1. Materials -> Categories
DO $$ BEGIN
  ALTER TABLE public.materials
  ADD CONSTRAINT materials_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Products -> Categories
DO $$ BEGIN
  ALTER TABLE public.products
  ADD CONSTRAINT products_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Projects -> Quotations
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS quotation_id UUID;
DO $$ BEGIN
  ALTER TABLE public.projects
  ADD CONSTRAINT projects_quotation_id_fkey
  FOREIGN KEY (quotation_id) REFERENCES public.quotations(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Operations -> Products
ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS product_id UUID;
DO $$ BEGIN
  ALTER TABLE public.operations
  ADD CONSTRAINT operations_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Operations -> Requisitions
ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS requisition_id UUID;
DO $$ BEGIN
  ALTER TABLE public.operations
  ADD CONSTRAINT operations_requisition_id_fkey
  FOREIGN KEY (requisition_id) REFERENCES public.requisitions(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Operations -> BOM
ALTER TABLE public.operations ADD COLUMN IF NOT EXISTS bom_id UUID;
DO $$ BEGIN
  ALTER TABLE public.operations
  ADD CONSTRAINT operations_bom_id_fkey
  FOREIGN KEY (bom_id) REFERENCES public.bom(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Recargar schema cache de PostgREST
NOTIFY pgrst, 'reload schema';

-- Verificar
SELECT 'Foreign keys created!' AS status;
