import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Tables } from "@/integrations/supabase/types";

type SupplierProfileSummary = Pick<
  Tables<"supplier_profiles">,
  "user_id" | "display_name" | "avatar_url" | "avatar_effect"
>;
type SupplierRatingSummary = Pick<Tables<"supplier_ratings">, "order_id" | "rating" | "comment">;

/**
 * Devuelve, para los pedidos del usuario autenticado, qué proveedor los abasteció
 * y si ya fueron calificados.
 */
export const getMyOrderRatings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("user_id", context.userId);

    const orderIds = (orders || []).map((o) => o.id);
    if (orderIds.length === 0)
      return [] as Array<{
        order_id: string;
        supplier_id: string;
        supplier_name: string;
        supplier_avatar_url: string | null;
        supplier_avatar_effect: string;
        rating: number | null;
        comment: string | null;
      }>;

    const { data: inv } = await supabaseAdmin
      .from("account_inventory")
      .select("order_id, supplier_id")
      .in("order_id", orderIds)
      .not("supplier_id", "is", null);

    const { data: ratings } = await supabaseAdmin
      .from("supplier_ratings")
      .select("order_id, rating, comment")
      .eq("user_id", context.userId);

    const supplierIds = Array.from(new Set((inv || []).map((i) => i.supplier_id as string)));
    const profiles: SupplierProfileSummary[] = supplierIds.length
      ? ((
          await supabaseAdmin
            .from("supplier_profiles")
            .select("user_id, display_name, avatar_url, avatar_effect")
            .in("user_id", supplierIds)
        ).data ?? [])
      : [];

    const profileOf = new Map(profiles.map((profile) => [profile.user_id, profile]));
    const ratingOf = new Map(
      ((ratings || []) as SupplierRatingSummary[]).map((rating) => [rating.order_id, rating]),
    );

    const seen = new Set<string>();
    const result: Array<{
      order_id: string;
      supplier_id: string;
      supplier_name: string;
      supplier_avatar_url: string | null;
      supplier_avatar_effect: string;
      rating: number | null;
      comment: string | null;
    }> = [];

    for (const row of inv || []) {
      const oid = row.order_id as string;
      if (!oid || seen.has(oid)) continue;
      seen.add(oid);
      const r = ratingOf.get(oid);
      result.push({
        order_id: oid,
        supplier_id: row.supplier_id as string,
        supplier_name: profileOf.get(row.supplier_id as string)?.display_name || "Proveedor",
        supplier_avatar_url: profileOf.get(row.supplier_id as string)?.avatar_url || null,
        supplier_avatar_effect: profileOf.get(row.supplier_id as string)?.avatar_effect || "none",
        rating: r?.rating ?? null,
        comment: r?.comment ?? null,
      });
    }

    return result;
  });

/** Califica al proveedor que entregó un pedido del usuario autenticado. */
export const rateOrderSupplier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) =>
    z
      .object({
        order_id: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, user_id")
      .eq("id", data.order_id)
      .maybeSingle();

    if (!order || order.user_id !== context.userId) throw new Error("Pedido no encontrado.");

    const { data: inv } = await supabaseAdmin
      .from("account_inventory")
      .select("supplier_id")
      .eq("order_id", data.order_id)
      .not("supplier_id", "is", null)
      .limit(1)
      .maybeSingle();

    if (!inv?.supplier_id) throw new Error("Este pedido aún no tiene un proveedor asignado.");

    const { error } = await supabaseAdmin.from("supplier_ratings").upsert(
      {
        user_id: context.userId,
        order_id: data.order_id,
        supplier_id: inv.supplier_id,
        rating: data.rating,
        comment: data.comment || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,order_id" },
    );

    if (error) throw new Error(error.message);
    return { success: true };
  });
