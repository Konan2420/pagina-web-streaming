import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AdminRouteShell } from "@/components/admin/AdminLayout";

export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) throw redirect({ to: "/tienda" });
    if (error) throw redirect({ to: "/tienda" });

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      throw redirect({ to: "/tienda" });
    }

    return { isAdmin: true };
  },
  component: AdminRouteShell,
});
