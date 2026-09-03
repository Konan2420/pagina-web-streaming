import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentAccountAccess } from "@/lib/ban.functions";
import { suspensionUrl } from "@/lib/suspension-client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/tienda" });
    const access = await getCurrentAccountAccess();
    if (!access.allowed) {
      await supabase.auth.signOut({ scope: "local" });
      throw redirect({
        href: suspensionUrl({ type: access.block === "ip" ? "ip" : "account", endsAt: access.endsAt }),
      });
    }
    return { user: data.user };
  },
  component: () => <Outlet />,
});
