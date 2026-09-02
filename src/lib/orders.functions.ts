import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const itemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(20),
});

/**
 * Crea y entrega los pedidos en una sola transacción de base de datos.
 * El catálogo, precio y cuenta disponible se resuelven exclusivamente en Supabase.
 */
export const createOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ items: z.array(itemSchema).min(1).max(20) }).parse(d))
  .handler(async ({ data, context }) => {
    const productIds = data.items.flatMap((item) =>
      Array.from({ length: item.quantity }, () => item.id),
    );
    const { data: created, error } = await context.supabase.rpc("place_orders_with_inventory", {
      _product_ids: productIds,
    });
    if (error) {
      if (error.message.toLowerCase().includes("stock")) {
        throw new Error("No hay stock suficiente para completar tu compra.");
      }
      throw new Error("No se pudo completar la compra.");
    }

    return { orderIds: (created ?? []).map((order) => order.order_id) };
  });
