// ============================================================================
// D-KRAFT ERP — Edge Function: admin-users
// ----------------------------------------------------------------------------
// Operaciones privilegiadas sobre usuarios/staff (crear, editar, borrar,
// resetear password) usando el service_role SOLO del lado servidor.
//
// El front (repo PÚBLICO, servido estático) NUNCA ve el service_role: llama a
// esta función con supabase.functions.invoke('admin-users', { body }), y
// supabase-js adjunta el JWT de la sesión en el header Authorization.
//
// Guardia: el usuario que llama debe tener profiles.role ∈ {ADMIN, ADMIN_DEV}.
// verify_jwt queda ON (la plataforma rechaza tokens inválidos antes de entrar);
// aquí además resolvemos el rol real. OPTIONS (preflight) pasa sin auth.
//
// Mapeo de datos: el front maneja "username" como etiqueta visible; en la tabla
// profiles NO existe columna username -> se guarda en `name` y se espeja en
// `display_name`. Columnas verificadas en vivo: id, name, display_name, email,
// role, created_at, updated_at, etc.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ADMIN_ROLES = ["ADMIN", "ADMIN_DEV"];
const VALID_ROLES = [
  "ADMIN_DEV",
  "ADMIN",
  "USER",
  "STORE",
  "SALES",
  "COST",
  "REQUISITOR",
  "MANAGEMENT",
];

// --- CORS -------------------------------------------------------------------
// El front llama desde dkraft.com.mx, el stopgap de Vercel y localhost.
// Reflejamos el Origin cuando existe; si no, caemos a "*".
function corsHeaders(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin ?? "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(origin),
      "Content-Type": "application/json",
    },
  });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");

  // Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: corsHeaders(origin) });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, origin);
  }

  // --- Cliente admin (service_role inyectado por el runtime de edge) --------
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Server misconfigured" }, 500, origin);
  }
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // --- GUARDIA: resolver al que llama y verificar rol -----------------------
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!jwt) {
    return json({ error: "Missing Authorization token" }, 401, origin);
  }

  const { data: userData, error: userErr } = await admin.auth.getUser(jwt);
  if (userErr || !userData?.user) {
    return json({ error: "Invalid or expired session" }, 401, origin);
  }
  const callerId = userData.user.id;

  const { data: callerProfile, error: profErr } = await admin
    .from("profiles")
    .select("role")
    .eq("id", callerId)
    .single();

  if (profErr || !callerProfile) {
    return json({ error: "No profile for caller" }, 403, origin);
  }
  if (!ALLOWED_ADMIN_ROLES.includes(callerProfile.role)) {
    return json({ error: "Forbidden: admin role required" }, 403, origin);
  }

  // --- Parse body -----------------------------------------------------------
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400, origin);
  }

  const action = String(body.action ?? "");

  try {
    switch (action) {
      // ---------------------------------------------------------------- CREATE
      case "create": {
        const email = String(body.email ?? "").trim();
        const password = String(body.password ?? "");
        const name = String(body.name ?? "").trim();
        const role = String(body.role ?? "USER");

        if (!email || !password || !name) {
          return json(
            { error: "email, password and name are required" },
            400,
            origin,
          );
        }
        if (!VALID_ROLES.includes(role)) {
          return json({ error: `Invalid role: ${role}` }, 400, origin);
        }

        const { data: created, error: createErr } =
          await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name },
          });
        if (createErr || !created?.user) {
          return json(
            { error: createErr?.message ?? "Could not create user" },
            400,
            origin,
          );
        }

        const newId = created.user.id;
        // El trigger handle_new_user ya insertó una fila base; hacemos upsert
        // para fijar name/display_name/email/role de forma idempotente.
        const { error: upErr } = await admin.from("profiles").upsert(
          {
            id: newId,
            name,
            display_name: name,
            email,
            role,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        );
        if (upErr) {
          // Rollback: el auth user quedaría huérfano sin profile válido.
          await admin.auth.admin.deleteUser(newId);
          return json({ error: upErr.message }, 400, origin);
        }

        return json({ ok: true, id: newId, email, name, role }, 200, origin);
      }

      // ---------------------------------------------------------------- UPDATE
      case "update": {
        const id = String(body.id ?? "").trim();
        if (!id) {
          return json({ error: "id is required" }, 400, origin);
        }

        const name =
          body.name !== undefined ? String(body.name).trim() : undefined;
        const email =
          body.email !== undefined ? String(body.email).trim() : undefined;
        const role = body.role !== undefined ? String(body.role) : undefined;
        const password =
          body.password !== undefined && String(body.password).trim() !== ""
            ? String(body.password)
            : undefined;

        if (role !== undefined && !VALID_ROLES.includes(role)) {
          return json({ error: `Invalid role: ${role}` }, 400, origin);
        }

        // Auth-side updates (email / password) via admin API.
        const authUpdate: Record<string, unknown> = {};
        if (email !== undefined) authUpdate.email = email;
        if (password !== undefined) authUpdate.password = password;
        if (Object.keys(authUpdate).length > 0) {
          const { error: authErr } = await admin.auth.admin.updateUserById(
            id,
            authUpdate,
          );
          if (authErr) {
            return json({ error: authErr.message }, 400, origin);
          }
        }

        // Profile-side updates.
        const profileUpdate: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (name !== undefined) {
          profileUpdate.name = name;
          profileUpdate.display_name = name;
        }
        if (email !== undefined) profileUpdate.email = email;
        if (role !== undefined) profileUpdate.role = role;

        const { error: updErr } = await admin
          .from("profiles")
          .update(profileUpdate)
          .eq("id", id);
        if (updErr) {
          return json({ error: updErr.message }, 400, origin);
        }

        return json({ ok: true, id }, 200, origin);
      }

      // ---------------------------------------------------------------- DELETE
      case "delete": {
        const id = String(body.id ?? "").trim();
        if (!id) {
          return json({ error: "id is required" }, 400, origin);
        }
        if (id === callerId) {
          return json(
            { error: "You cannot delete your own account" },
            400,
            origin,
          );
        }

        // profiles.id REFERENCES auth.users(id) ON DELETE CASCADE:
        // borrar el auth user elimina la fila de profiles automáticamente.
        const { error: delErr } = await admin.auth.admin.deleteUser(id);
        if (delErr) {
          return json({ error: delErr.message }, 400, origin);
        }
        // Belt-and-suspenders: por si el cascade no aplicara.
        await admin.from("profiles").delete().eq("id", id);

        return json({ ok: true, id }, 200, origin);
      }

      // -------------------------------------------------------- RESET_PASSWORD
      case "reset_password": {
        const id = String(body.id ?? "").trim();
        const password = String(body.password ?? "");
        if (!id || !password) {
          return json({ error: "id and password are required" }, 400, origin);
        }
        const { error: pwErr } = await admin.auth.admin.updateUserById(id, {
          password,
        });
        if (pwErr) {
          return json({ error: pwErr.message }, 400, origin);
        }
        return json({ ok: true, id }, 200, origin);
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400, origin);
    }
  } catch (e) {
    return json(
      { error: (e as Error)?.message ?? "Unexpected server error" },
      500,
      origin,
    );
  }
});
