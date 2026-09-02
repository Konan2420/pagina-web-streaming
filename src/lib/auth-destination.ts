import { supabase } from "@/integrations/supabase/client";
import { getRoleDestination, resolvePrimaryRole, type RoleDestination } from "@/lib/role-access";

export type AuthDestination = RoleDestination;

/**
 * Resuelve el destino inicial según el rol persistido en Supabase.
 * El rol base `user` solo accede al catálogo; los roles elevados se
 * dirigen a sus paneles dedicados.
 */
export async function getAuthDestination(userId: string): Promise<AuthDestination> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);

  if (error) {
    return "/catalogo";
  }

  return getRoleDestination(resolvePrimaryRole((data ?? []).map(({ role }) => role)));
}

/** Returns a destination only for authenticated users; visitors stay on the public landing/store. */
export async function getCurrentUserDestination(): Promise<AuthDestination | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return getAuthDestination(data.user.id);
}
