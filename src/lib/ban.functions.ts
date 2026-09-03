import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth, requireSupabaseSession } from "@/integrations/supabase/auth-middleware";

type ModerationDb = SupabaseClient;
async function getModerationDb(): Promise<ModerationDb> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as ModerationDb;
}

const uuid = z.string().uuid();

function dateFromInput(value: string | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error("La fecha indicada no es válida.");
  return parsed;
}

async function assertTargetCanBeBanned(targetUserId: string, actorId: string) {
  if (targetUserId === actorId) throw new Error("No puedes banear tu propia cuenta.");

  const db = await getModerationDb();
  const { data: adminRole, error } = await db
    .from("user_roles")
    .select("user_id")
    .eq("user_id", targetUserId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (adminRole) throw new Error("No se puede banear a una cuenta administradora.");
}

/** Consulta mínima para decidir si el cliente debe cerrar su sesión. */
export const getCurrentAccountAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseSession])
  .handler(async ({ context }) => {
    const { getAccountAccess } = await import("@/lib/ban.server");
    return getAccountAccess(context.userId);
  });

/** Guardia de red previa a login/registro/OAuth. No revela si una IP está en la lista. */
export const assertCurrentNetworkAllowed = createServerFn({ method: "GET" }).handler(async () => {
  const db = await getModerationDb();
  const { getTrustedRequestIp } = await import("@/lib/request-ip.server");
  const ip = getTrustedRequestIp();
  if (!ip) return { allowed: true };
  const now = new Date().toISOString();
  const { data, error } = await db
    .from("banned_ips")
    .select("id")
    .eq("ip_address", ip)
    .eq("status", "active")
    .lte("starts_at", now)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error("No se pudo verificar el acceso desde esta red.");
  if (data) throw new Error("IP_ACCESS_BLOCKED");
  return { allowed: true };
});

export const getUserBans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await getModerationDb();
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);

    const { error: reconcileError } = await db.rpc("reconcile_ban_statuses");
    if (reconcileError) throw new Error(reconcileError.message);

    const { data: bans, error: bansError } = await db
      .from("user_bans")
      .select("id, user_id, banned_by, reason, ip_address, starts_at, ends_at, status, revoked_by, revoked_at, revocation_reason, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (bansError) throw new Error(bansError.message);

    const rows = bans ?? [];
    const ids = [...new Set(rows.flatMap((row) => [row.user_id, row.banned_by, row.revoked_by]).filter(Boolean))];
    const [{ data: profiles, error: profilesError }, { data: roles, error: rolesError }] = await Promise.all([
      ids.length
        ? db.from("profiles").select("id, nombre_completo, email").in("id", ids)
        : Promise.resolve({ data: [], error: null }),
      ids.length
        ? db.from("user_roles").select("user_id, role").in("user_id", ids)
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (profilesError) throw new Error(profilesError.message);
    if (rolesError) throw new Error(rolesError.message);

    const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
    const rolesById = new Map<string, string[]>();
    for (const role of roles ?? []) {
      rolesById.set(role.user_id, [...(rolesById.get(role.user_id) ?? []), role.role]);
    }
    const priority = ["admin", "proveedor", "distribuidor", "user"];

    return rows.map((ban) => {
      const target = profileById.get(ban.user_id);
      const actor = ban.banned_by ? profileById.get(ban.banned_by) : undefined;
      const revoker = ban.revoked_by ? profileById.get(ban.revoked_by) : undefined;
      const targetRoles = rolesById.get(ban.user_id) ?? [];
      return {
        ...ban,
        user: {
          id: ban.user_id,
          name: target?.nombre_completo || "Usuario sin nombre",
          email: target?.email || "—",
          role: priority.find((role) => targetRoles.includes(role)) ?? "user",
        },
        bannedBy: actor?.nombre_completo || actor?.email || "Administrador eliminado",
        revokedBy: revoker?.nombre_completo || revoker?.email || null,
      };
    });
  });

export const createUserBan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) =>
    z
      .object({
        userId: uuid,
        reason: z.string().trim().min(3).max(1_000),
        startsAt: z.string().optional(),
        endsAt: z.string().nullable().optional(),
        banAssociatedIp: z.boolean().default(false),
      })
      .parse(value),
  )
  .handler(async ({ data, context }) => {
    const db = await getModerationDb();
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);
    await assertTargetCanBeBanned(data.userId, context.userId);

    const startsAt = dateFromInput(data.startsAt, new Date());
    const endsAt = data.endsAt ? dateFromInput(data.endsAt, startsAt) : null;
    if (endsAt && endsAt <= startsAt) throw new Error("La fecha de fin debe ser posterior al inicio.");

    const { error: reconcileError } = await db.rpc("reconcile_ban_statuses");
    if (reconcileError) throw new Error(reconcileError.message);

    const { data: existing, error: existingError } = await db
      .from("user_bans")
      .select("id")
      .eq("user_id", data.userId)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (existing) throw new Error("Esta cuenta ya tiene un baneo activo.");

    const { data: ipRow, error: ipError } = data.banAssociatedIp
      ? await db
          .from("user_access_ips")
          .select("ip_address")
          .eq("user_id", data.userId)
          .order("last_seen_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null, error: null };
    if (ipError) throw new Error(ipError.message);

    const { data: ban, error: banError } = await db
      .from("user_bans")
      .insert({
        user_id: data.userId,
        banned_by: context.userId,
        reason: data.reason,
        ip_address: ipRow?.ip_address ?? null,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt?.toISOString() ?? null,
      })
      .select("id")
      .single();
    if (banError) throw new Error(banError.message);

    let ipBanCreated = false;
    if (ipRow?.ip_address) {
      const { error: insertIpError } = await db.from("banned_ips").insert({
        ip_address: ipRow.ip_address,
        reason: data.reason,
        banned_by: context.userId,
        source_user_ban_id: ban.id,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt?.toISOString() ?? null,
      });
      if (insertIpError) throw new Error(insertIpError.message);
      ipBanCreated = true;
    }

    // Revoca tokens de refresco/sesiones gestionadas por Supabase. Las RLS y el
    // middleware siguen bloqueando cualquier JWT que alcance la aplicación.
    const { error: signOutError } = await db.auth.admin.signOut(data.userId, "global");
    return {
      success: true,
      ipBanCreated,
      sessionRevoked: !signOutError,
      sessionRevocationError: signOutError?.message ?? null,
    };
  });

export const revokeUserBan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((value) =>
    z
      .object({ banId: uuid, reason: z.string().trim().max(1_000).optional() })
      .parse(value),
  )
  .handler(async ({ data, context }) => {
    const db = await getModerationDb();
    const { assertAdmin } = await import("@/lib/admin.server");
    await assertAdmin(context.supabase, context.userId);

    const now = new Date().toISOString();
    const { data: ban, error: banError } = await db
      .from("user_bans")
      .update({
        status: "revoked",
        revoked_by: context.userId,
        revoked_at: now,
        revocation_reason: data.reason || null,
      })
      .eq("id", data.banId)
      .eq("status", "active")
      .select("id")
      .maybeSingle();
    if (banError) throw new Error(banError.message);
    if (!ban) throw new Error("El baneo ya no está activo o no existe.");

    const { error: ipError } = await db
      .from("banned_ips")
      .update({
        status: "revoked",
        revoked_by: context.userId,
        revoked_at: now,
        revocation_reason: data.reason || null,
      })
      .eq("source_user_ban_id", data.banId)
      .eq("status", "active");
    if (ipError) throw new Error(ipError.message);
    return { success: true };
  });
