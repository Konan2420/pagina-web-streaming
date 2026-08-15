import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const itemSchema = z.object({
  id: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(20),
});

/**
 * Crea los pedidos del usuario autenticado.
 * El precio NUNCA se toma del cliente: se resuelve contra la tabla de productos
 * o el catálogo estático (productos mock).
 * No entrega credenciales — la entrega ocurre solo tras confirmar el pago.
 */
export const createOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d) => z.object({ items: z.array(itemSchema).min(1).max(20) }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const ids = data.items.map((i) => i.id).filter((id) => uuidRe.test(id));

    const priceById = new Map<string, number>();
    if (ids.length > 0) {
      const { data: products } = await supabase
        .from("products")
        .select("id, price, name")
        .in("id", ids)
        .eq("is_active", true);
      for (const p of products ?? []) priceById.set(p.id, Number(p.price));
    }

    const { catalogPriceById } = await import("@/components/tienda/data");

    const rows = data.items.map((item) => {
      const unitPrice = priceById.get(item.id) ?? catalogPriceById[item.id];
      if (unitPrice == null || unitPrice <= 0) {
        throw new Error(`El producto "${item.name}" no está disponible para compra online.`);
      }
      return {
        user_id: userId,
        producto_id: item.id,
        producto_nombre: item.quantity > 1 ? `${item.name} x${item.quantity}` : item.name,
        precio: unitPrice * item.quantity,
        estado: "pendiente" as const,
      };
    });

    const { data: created, error } = await supabase.from("orders").insert(rows).select("id");
    if (error) throw new Error("No se pudo registrar el pedido.");

    return { orderIds: (created ?? []).map((o) => o.id) };
  });
