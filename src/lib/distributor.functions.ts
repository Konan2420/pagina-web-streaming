import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Read-only commercial dashboard. It never exposes product editing or inventory credentials. */
export const getDistributorDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertDistributor } = await import("@/lib/roles.server");
    await assertDistributor(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("distributor_profiles")
      .select("display_name, is_active, joined_at")
      .eq("user_id", context.userId)
      .maybeSingle();

    if (profileError) throw new Error(profileError.message);

    return {
      displayName: profile?.display_name ?? "Distribuidor",
      isActive: profile?.is_active ?? true,
      joinedAt: profile?.joined_at ?? null,
    };
  });
