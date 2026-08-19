import { supabase } from "@/integrations/supabase/client";

export type AuthDestination = "/tienda" | "/mi-tienda" | "/proveedor" | "/admin";

/**
 * Resolves the least-privileged destination for an authenticated account.
 * Administrators take precedence when an account also has the supplier role.
 */
export async function getAuthDestination(userId: string): Promise<AuthDestination> {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);

  if (error) {
    console.warn("[Auth] No se pudieron consultar los roles; se abre el panel de usuario.", error);
    return "/tienda";
  }

  const roles = new Set((data ?? []).map(({ role }) => role));
  if (roles.has("admin")) return "/admin";
  if (roles.has("proveedor")) return "/proveedor";
  if (roles.has("vendedor")) return "/mi-tienda";
  return "/tienda";
}
