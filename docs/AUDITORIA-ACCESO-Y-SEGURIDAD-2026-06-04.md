# D-KRAFT — Auditoría de Acceso y Seguridad

**Fecha:** 2026-06-04
**Equipo:** CaliDevs (Aurelia · Livia · Victoria)
**Contexto:** Cliente que regresa (Sara, del team). Objetivo del día: retomar control
total de la app para hacer ajustes y habilitar el acceso de las personas.
**Estado del proyecto:** MVP (NO está en producción todavía).

---

## 1. Estado de accesos (control)

| Recurso                   | Estado           | Detalle                                                                                                                                                                  |
| ------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Supabase**              | ✅ Control total | Proyecto `qalqscfrcxzzvrcvqqbp` (org `kbckedrfnfnnnxvmxvsa`), región West US (Oregon). Cuenta propia (biz@calidevs.com). CLI logueado + service_role + management token. |
| **Netlify**               | ✅ Control total | Sitio `d-kraft` (id `86929edf-4c28-4fec-9c07-a2b6932f4e87`), URL `https://d-kraft.netlify.app`. Cuenta biz@calidevs.com.                                                 |
| **GitHub**                | 🟡 Parcial       | `devscali` tiene push/pull/triage en `saraesthervalenzuela-wq/dkraft-app`, pero **NO admin**. Pendiente: pedir a Sara subir a `devscali` a Admin (o transferir el repo). |
| **Dominio dkraft.com.mx** | ⚪ Aparte        | Apunta a un droplet de DigitalOcean (`159.223.161.84`) que NO es el Netlify. El sitio real servido por Netlify es `d-kraft.netlify.app` (custom_domain = none).          |

---

## 2. Arquitectura (resumen)

- **Stack:** React 19 + Vite 7 + Tailwind 4. Backend Supabase PostgreSQL. Deploy Netlify.
- **Proyecto activo:** el código vive en el **subdir** `dkraft-app/dkraft-app/src`
  (la raíz es wrapper + docs). Build: `cd dkraft-app && npm install && npm run build`,
  publica `dkraft-app/dist`. La carpeta `1/` de la raíz es basura (borrable).
- **Data en Supabase (un solo punto de verdad):** la "REST API fallback"
  `api.dkraft.com.mx` es un fantasma (no responde; `VITE_USE_API=false`). Toda la app
  corre contra Supabase con la `anon key`.
- **Datos vivos:** clients=258, products=76, categories=64, operations=33, units=10,
  profiles=7, materials=5, quotations=3, warehouses=2. Vacías: requisitions,
  attendance, activity_log, operation_stages.
- **QuickBooks:** solo papel (`QUICKBOOKS_HANDOFF.md`); NO existe código funcional.
  Regla de negocio: solo `billing_entity = 'DOVECREEK'` sincronizaría (INNOVATIVE no).

---

## 3. 🔴 Seguridad — RLS abierto (a tapar ANTES de producción)

Verificado en vivo contra la base:

- **43 políticas** dan acceso a los roles `anon`/`public` (de 125 totales):
  - **28 políticas `ALL`** (CRUD completo)
  - **1 `DELETE`**
  - **14 `SELECT`**
- **2 tablas con RLS DESACTIVADO por completo:** `departments` y `operations`.
- Consecuencia: con la `anon key` (que va pública en el bundle JS) se puede **leer,
  crear, modificar y borrar** toda la base sin login. Confirmado: `SELECT`/`INSERT`/
  `DELETE`/`PATCH` anónimos respondieron 200/204.

**Por qué pasó:** existe `supabase/DANGER_policies-public-read.sql.DISABLED`
(trackeado en git) y/o el `schema.sql` con RLS `TO authenticated` nunca se aplicó tal
cual en prod. El neto medido es: **anon = CRUD total.**

### ⚠️ Bloqueo importante para el cierre

**No se puede cerrar el `anon` sin antes arreglar el login**, porque la app HOY usa la
`anon key` para TODO (ver sección 4). Cerrar el hueco sin auth real dejaría la app sin
poder leer ni escribir. Como es MVP, el riesgo es aceptable de momento, pero el orden
correcto es: **(1) cablear Supabase Auth → (2) cerrar anon → (3) rotar la anon key.**

---

## 4. Modelo de autenticación (la pieza que falta)

- `src/context/AuthContext.jsx` → `login()` llama a **`loginToBackend`** (el API
  fantasma `api.dkraft.com.mx`), NO a Supabase Auth, y guarda el usuario en
  `localStorage`. Hay un `loginAsDemo()` (bypass que inyecta un ADMIN falso) usado en
  `components/auth/Login.jsx:121`.
- `src/lib/supabase.js` **SÍ tiene** helpers reales: `auth.signUp`,
  `auth.signInWithPassword`, `auth.signOut` (líneas 29/39/48) — pero **no están
  conectados** al flujo de login.
- En `auth.users` hay **7 usuarios** (6 con sign-in registrado), seguramente de
  pruebas/versión previa, NO del flujo actual de la app.

**Implicación:** todas las llamadas a la base salen como rol `anon`. El rol
`authenticated` nunca se usa hoy.

---

## 5. Plan para habilitar el "acceso de personas" + cierre seguro

1. **Cablear Supabase Auth (real):** en `AuthContext.login()` usar
   `supabase.auth.signInWithPassword` (ya existe en `lib/supabase.js`) en vez del
   backend fantasma. Mapear el usuario al registro de `profiles` por email.
2. **Alta de usuarios:** crear los usuarios en `auth.users` (ej.
   `Avaladez@innovativemillwkmex.com`) y enlazarlos con su fila de `profiles`
   (rol ADMIN/USER/VIEWER, area/department). Definir password temporal + cambio.
3. **Cerrar el RLS** (SQL listo en sección 6) una vez que el login real funcione:
   habilitar RLS en todas las tablas, dropear las 43 políticas `anon`/`public`, dejar
   solo `TO authenticated`.
4. **Restringir PII de `profiles`** (que un USER no vea email/rol de todos; solo el
   suyo o si es ADMIN) y políticas por rol en tablas con dinero (`quotations`,
   `clients`, `suppliers`).
5. **Rotar la anon key** (Settings → API → nuevo JWT secret), actualizar
   `VITE_SUPABASE_ANON_KEY` en Netlify y redeploy.
6. **Limpiar el repo:** eliminar `DANGER_policies-public-read.sql.DISABLED`,
   `.gitignore` para `supabase/.temp/`, borrar carpeta `1/`.

---

## 6. SQL de cierre (listo, NO ejecutado todavía)

> Pendiente hasta que el login real esté cableado (sección 5, paso 1).

```sql
-- Diagnóstico
SELECT count(*) FILTER (WHERE roles && ARRAY['anon','public']::name[]) AS anon_public,
       count(*) AS total
FROM pg_policies WHERE schemaname='public';

-- Cierre (transaccional): ENABLE+FORCE RLS y DROP de toda policy anon/public
BEGIN;
DO $$ DECLARE r record; BEGIN
  FOR r IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
           WHERE n.nspname='public' AND c.relkind='r' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.relname);
    EXECUTE format('ALTER TABLE public.%I FORCE  ROW LEVEL SECURITY;', r.relname);
  END LOOP;
END $$;
DO $$ DECLARE p record; BEGIN
  FOR p IN SELECT schemaname, tablename, policyname FROM pg_policies
           WHERE schemaname='public' AND (roles && ARRAY['anon','public']::name[]) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;
COMMIT;
```

---

## 7. Próximos pasos (objetivos del día)

- [ ] Pedir a Sara: subir a `devscali` a **Admin** del repo (o transferir).
- [ ] Cablear **Supabase Auth** real en `AuthContext`.
- [ ] Alta de usuarios reales (empezando por `Avaladez@innovativemillwkmex.com`).
- [ ] Cerrar **RLS** + rotar **anon key** + actualizar Netlify.
- [ ] Limpieza de repo (DANGER file, carpeta `1/`, `.gitignore` temp).
