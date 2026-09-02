import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getRoleDestination, isCatalogOnlyRole, resolvePrimaryRole } from "@/lib/role-access";
import { TiendaPage } from "@/components/tienda/TiendaPage";

/** Ruta exclusiva de clientes: catálogo, filtros, compra y carrito. */
export const Route = createFileRoute("/_authenticated/catalogo")({
  ssr: false,
  beforeLoad: async () => {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) throw redirect({ to: "/tienda" });

    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.user.id);
    if (rolesError) throw redirect({ to: "/tienda" });

    const role = resolvePrimaryRole((roles ?? []).map((row) => row.role));
    if (!isCatalogOnlyRole(role)) throw redirect({ to: getRoleDestination(role) });
    return { user: auth.user };
  },
  component: () => <TiendaPage catalogOnly />,
});
