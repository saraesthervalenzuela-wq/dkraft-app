-- ============================================
-- D-KRAFT ERP - PUBLIC READ POLICIES
-- Para permitir lectura sin autenticación (DEMO)
-- Ejecutar en Supabase SQL Editor DESPUÉS del schema
-- ============================================

CREATE POLICY "anon_read_clients" ON public.clients FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_suppliers" ON public.suppliers FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_products" ON public.products FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_materials" ON public.materials FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_categories" ON public.categories FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_units" ON public.units FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_warehouses" ON public.warehouses FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_projects" ON public.projects FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_quotations" ON public.quotations FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_requisitions" ON public.requisitions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_operations" ON public.operations FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_bom" ON public.bom FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_quotation_items" ON public.quotation_items FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_requisition_items" ON public.requisition_items FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_operation_stages" ON public.operation_stages FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_bom_components" ON public.bom_components FOR SELECT TO anon USING (true);

SELECT 'Public read policies created!' as status;
