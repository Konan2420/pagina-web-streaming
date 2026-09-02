import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Helpers server-only para roles.
 */

export async function assertAdmin(supabase: SupabaseClient<Database>, userId: string) {
  if (!userId) throw new Error("No autenticado.");
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });
  if (error) throw new Error("No se pudo verificar los permisos.");
  if (!data) throw new Error("Acceso restringido a administradores.");
}

/** Permite el panel de proveedor al rol proveedor y a administradores. */
export async function assertProvider(supabase: SupabaseClient<Database>, userId: string) {
  if (!userId) throw new Error("No autenticado.");

  const [{ data: isProvider, error: providerError }, { data: isAdmin, error: adminError }] =
    await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "proveedor" }),
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    ]);

  if (providerError || adminError) throw new Error("No se pudo verificar los permisos.");
  if (!isProvider && !isAdmin) throw new Error("Acceso restringido a proveedores.");
}

/** Permite el panel comercial al rol distribuidor y a administradores. */
export async function assertDistributor(supabase: SupabaseClient<Database>, userId: string) {
  if (!userId) throw new Error("No autenticado.");

  const [{ data: isDistributor, error: distributorError }, { data: isAdmin, error: adminError }] =
    await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "distribuidor" }),
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    ]);

  if (distributorError || adminError) throw new Error("No se pudo verificar los permisos.");
  if (!isDistributor && !isAdmin) throw new Error("Acceso restringido a distribuidores.");
}
