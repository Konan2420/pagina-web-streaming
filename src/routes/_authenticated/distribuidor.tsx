import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { DistributorRouteShell } from "@/components/distributor/DistributorLayout";

export const Route = createFileRoute("/_authenticated/distribuidor")({
  ssr: false,
  beforeLoad: async () => {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) throw redirect({ to: "/tienda" });

    const [{ data: isDistributor, error: distributorError }, { data: isAdmin, error: adminError }] =
      await Promise.all([
        supabase.rpc("has_role", { _user_id: auth.user.id, _role: "distribuidor" }),
        supabase.rpc("has_role", { _user_id: auth.user.id, _role: "admin" }),
      ]);

    if (distributorError || adminError || (!isDistributor && !isAdmin)) {
      throw redirect({ to: "/catalogo" });
    }

    return { isDistributor: Boolean(isDistributor), isAdmin: Boolean(isAdmin) };
  },
  component: DistributorRouteShell,
});
