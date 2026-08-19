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

export async function assertSupplier(supabase: SupabaseClient<Database>, userId: string) {
  if (!userId) throw new Error("No autenticado.");

  // Check if admin OR supplier
  const { data: isAdmin } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "admin",
  });

  if (isAdmin) return;

  const { data: isSupplier, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: "proveedor",
  });

  if (error) throw new Error("No se pudo verificar los permisos.");
  if (!isSupplier) throw new Error("Acceso restringido a proveedores.");
}

export async function assertSeller(supabase: SupabaseClient<Database>, userId: string) {
  if (!userId) throw new Error("No autenticado.");

  const [{ data: isAdmin, error: adminError }, { data: isSeller, error: sellerError }] =
    await Promise.all([
      supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
      supabase.rpc("has_role", { _user_id: userId, _role: "vendedor" }),
    ]);

  if (adminError || sellerError) throw new Error("No se pudo verificar los permisos.");
  if (!isAdmin && !isSeller) throw new Error("Acceso restringido a vendedores.");
}
