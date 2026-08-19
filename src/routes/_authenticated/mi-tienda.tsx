import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { SellerStoreManager } from "@/components/tienda/SellerStoreManager";

export const Route = createFileRoute("/_authenticated/mi-tienda")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/tienda" });

    const [{ data: isSeller, error: sellerError }, { data: isAdmin, error: adminError }] =
      await Promise.all([
        supabase.rpc("has_role", { _user_id: data.user.id, _role: "vendedor" }),
        supabase.rpc("has_role", { _user_id: data.user.id, _role: "admin" }),
      ]);

    if (sellerError || adminError || (!isSeller && !isAdmin)) {
      throw redirect({ to: "/tienda" });
    }
    return { isSeller, isAdmin };
  },
  component: SellerStoreManager,
});
