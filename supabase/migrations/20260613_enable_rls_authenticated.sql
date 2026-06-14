-- ============================================================
-- D-KRAFT ERP — Cerrar RLS (acceso solo para usuarios autenticados)
-- ============================================================
-- Contexto / problema que resuelve:
--   Hoy la clave publishable (anon) — que viaja DENTRO del bundle JS — puede
--   LEER y ESCRIBIR todas las tablas sin iniciar sesión (RLS deshabilitado /
--   policies públicas del archivo DANGER_policies-public-read.sql).
--   Este script habilita RLS en todas las tablas, borra las policies existentes
--   (incluidas las públicas de `anon`) y deja UNA policy por tabla: acceso total
--   SOLO para el rol `authenticated` (usuarios logueados vía Supabase Auth).
--
-- PRE-REQUISITOS antes de correr esto (IMPORTANTE):
--   1) Deben existir usuarios reales en Supabase Auth (auth.users) para poder
--      iniciar sesión. Si no hay, NADIE podrá ver datos tras activar RLS.
--   2) Quitar el bypass demo del frontend (botón "Entrar como Demo" /
--      loginAsDemo): ese usuario NO pasa por Supabase Auth, así que sus queries
--      saldrán como `anon` y RLS las bloqueará (la app se vería vacía).
--
-- Cómo aplicar:
--   Supabase Dashboard → SQL Editor → pegar este archivo → Run.
--   (o `supabase db push` si usas la CLI con migraciones)
--
-- Es idempotente: se puede correr varias veces sin error.
-- ============================================================

do $$
declare
    t text;
    pol record;
    -- Todas las tablas de negocio (public)
    tables text[] := array[
        'profiles', 'categories', 'units', 'clients', 'suppliers', 'warehouses',
        'materials', 'products', 'product_materials', 'bom', 'bom_components',
        'projects', 'quotations', 'quotation_items', 'requisitions',
        'requisition_items', 'operations', 'operation_stages',
        'operation_materials', 'attendance', 'staff_operation_hours',
        'qa_inspections', 'activity_log'
    ];
begin
    foreach t in array tables loop
        -- Saltar tablas que no existan en este proyecto (robusto ante cambios de schema)
        if to_regclass('public.' || t) is null then
            raise notice 'Tabla public.% no existe, se omite', t;
            continue;
        end if;

        -- 1) Activar RLS (por sí solo ya bloquea todo lo que no tenga policy)
        execute format('alter table public.%I enable row level security;', t);
        execute format('alter table public.%I force row level security;', t);

        -- 2) Borrar TODAS las policies existentes (deja un estado limpio:
        --    elimina las policies públicas de `anon` del archivo DANGER)
        for pol in
            select policyname
            from pg_policies
            where schemaname = 'public' and tablename = t
        loop
            execute format('drop policy if exists %I on public.%I;', pol.policyname, t);
        end loop;

        -- 3) Policy única: acceso total SOLO para usuarios autenticados.
        --    `anon` queda sin ninguna policy => sin acceso.
        execute format(
            'create policy %I on public.%I for all to authenticated using (true) with check (true);',
            t || '_authenticated_all', t
        );
    end loop;
end $$;

-- ============================================================
-- Verificación: lista RLS activo + policies por tabla.
-- Tras correr, cada tabla debe tener rls=true y 1 policy (rol {authenticated}).
-- ============================================================
select
    c.relname              as tabla,
    c.relrowsecurity       as rls_activo,
    p.policyname           as policy,
    p.roles                as roles,
    p.cmd                  as comando
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public'
  and c.relkind = 'r'
order by c.relname;

-- ============================================================
-- (OPCIONAL) Endurecimiento por rol — para después.
-- El baseline de arriba deja que CUALQUIER usuario autenticado lea/escriba todo.
-- Para un ERP interno suele ser suficiente. Si luego quieres restringir, p.ej.
-- que solo ADMIN borre, o que `profiles` solo lo edite su dueño, se agregan
-- policies más finas usando auth.uid() y la columna role de profiles. Ejemplo:
--
--   create policy "profiles_self_update" on public.profiles
--     for update to authenticated
--     using (id = auth.uid()) with check (id = auth.uid());
-- ============================================================
