import type { SupabaseClient } from "@supabase/supabase-js";

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getTrustedRequestIp } from "@/lib/request-ip.server";

type ModerationDb = SupabaseClient;
const db = supabaseAdmin as unknown as ModerationDb;

export type ActiveBan = {
  id: string;
  endsAt: string | null;
};

export type AccountAccess = {
  allowed: boolean;
  block: "account" | "ip" | null;
  endsAt: string | null;
};

function activeBanQuery(userId: string) {
  const now = new Date().toISOString();
  return db
    .from("user_bans")
    .select("id, ends_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .lte("starts_at", now)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
}

async function isIpBanned(ip: string | null): Promise<boolean> {
  if (!ip) return false;
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
  if (error) throw new Error(`No se pudo validar la restricción de red: ${error.message}`);
  return Boolean(data);
}

export async function recordAuthenticatedRequestIp(userId: string): Promise<string | null> {
  const ip = getTrustedRequestIp();
  if (!ip) return null;

  const now = new Date().toISOString();
  const { error } = await db.from("user_access_ips").upsert(
    {
      user_id: userId,
      ip_address: ip,
      last_seen_at: now,
    },
    { onConflict: "user_id,ip_address" },
  );
  if (error) throw new Error(`No se pudo registrar el acceso: ${error.message}`);
  return ip;
}

/** Verificación única usada por middleware, callback OAuth y guardas de rutas. */
export async function getAccountAccess(userId: string): Promise<AccountAccess> {
  // Refleja inmediatamente los vencimientos antes de consultar/listar.
  const { error: reconcileError } = await db.rpc("reconcile_ban_statuses");
  if (reconcileError) throw new Error(`No se pudo actualizar el estado de moderación: ${reconcileError.message}`);

  const [{ data: accountBan, error: accountError }, ip] = await Promise.all([
    activeBanQuery(userId),
    recordAuthenticatedRequestIp(userId),
  ]);
  if (accountError) throw new Error(`No se pudo validar el estado de la cuenta: ${accountError.message}`);

  if (accountBan) {
    return { allowed: false, block: "account", endsAt: accountBan.ends_at ?? null };
  }

  if (await isIpBanned(ip)) {
    return { allowed: false, block: "ip", endsAt: null };
  }

  return { allowed: true, block: null, endsAt: null };
}

export function toSuspensionError(access: AccountAccess): Error {
  const type = access.block === "ip" ? "IP_ACCESS_BLOCKED" : "ACCOUNT_SUSPENDED";
  return new Error(`${type}${access.endsAt ? `:${access.endsAt}` : ""}`);
}
