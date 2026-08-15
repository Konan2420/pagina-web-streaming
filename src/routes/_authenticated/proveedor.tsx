import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/proveedor")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    const user = data.user;
    if (error || !user) {
      throw redirect({ to: "/tienda" });
    }

    const [{ data: isSupplier, error: supplierError }, { data: isAdmin, error: adminError }] =
      await Promise.all([
        supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "proveedor",
        }),
        supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin",
        }),
      ]);

    if (supplierError || adminError || (!isSupplier && !isAdmin)) {
      throw redirect({ to: "/tienda" });
    }

    return { isSupplier, isAdmin };
  },
  component: () => <Outlet />,
});
