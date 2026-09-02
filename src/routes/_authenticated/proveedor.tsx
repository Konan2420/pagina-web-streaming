import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SupplierRouteShell } from "@/components/supplier/SupplierLayout";

export const Route = createFileRoute("/_authenticated/proveedor")({
  ssr: false,
  beforeLoad: async () => {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) throw redirect({ to: "/tienda" });

    const [{ data: isProvider, error: providerError }, { data: isAdmin, error: adminError }] =
      await Promise.all([
        supabase.rpc("has_role", { _user_id: auth.user.id, _role: "proveedor" }),
        supabase.rpc("has_role", { _user_id: auth.user.id, _role: "admin" }),
      ]);

    if (providerError || adminError || (!isProvider && !isAdmin)) {
      throw redirect({ to: "/catalogo" });
    }

    return { isProvider: Boolean(isProvider), isAdmin: Boolean(isAdmin) };
  },
  component: SupplierRouteShell,
});
