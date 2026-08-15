import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Helpers server-only para el panel de administración.
 * Nunca debe importarse desde código de cliente.
 */

/**
 * Verifica, contra la base de datos y con el cliente autenticado del usuario,
 * que quien llama tiene el rol de administrador.
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
