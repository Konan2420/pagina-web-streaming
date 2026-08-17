import { c as createServerFn } from "./createServerFn-CVho-diU.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-eb4ID_9s.mjs";
import { a as objectType, i as numberType, o as stringType, t as arrayType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-zBGjJ5LZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/orders.functions-4QnbZgU3.js
var itemSchema = objectType({
	id: stringType().min(1).max(120),
	name: stringType().min(1).max(200),
	quantity: numberType().int().min(1).max(20)
});
/**
* Crea los pedidos del usuario autenticado.
* El precio NUNCA se toma del cliente: se resuelve contra la tabla de productos
* o el catálogo estático (productos mock).
* No entrega credenciales — la entrega ocurre solo tras confirmar el pago.
*/
var createOrders_createServerFn_handler = createServerRpc({
	id: "b2e8895c567dd02e272bfc97fdca68290a46c3e6cd61885eaecdbb8f47f774c6",
	name: "createOrders",
	filename: "src/lib/orders.functions.ts"
}, (opts) => createOrders.__executeServer(opts));
var createOrders = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({ items: arrayType(itemSchema).min(1).max(20) }).parse(d)).handler(createOrders_createServerFn_handler, async ({ data, context }) => {
	const { supabase, userId } = context;
	const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	const ids = data.items.map((i) => i.id).filter((id) => uuidRe.test(id));
	const priceById = /* @__PURE__ */ new Map();
	if (ids.length > 0) {
		const { data: products } = await supabase.from("products").select("id, price, name").in("id", ids).eq("is_active", true);
		for (const p of products ?? []) priceById.set(p.id, Number(p.price));
	}
	const { catalogPriceById } = await import("./data-BqcQodSt.mjs").then((n) => n.o).then((n) => n.o);
	const rows = data.items.map((item) => {
		const unitPrice = priceById.get(item.id) ?? catalogPriceById[item.id];
		if (unitPrice == null || unitPrice <= 0) throw new Error(`El producto "${item.name}" no está disponible para compra online.`);
		return {
			user_id: userId,
			producto_id: item.id,
			producto_nombre: item.quantity > 1 ? `${item.name} x${item.quantity}` : item.name,
			precio: unitPrice * item.quantity,
			estado: "pendiente"
		};
	});
	const { data: created, error } = await supabase.from("orders").insert(rows).select("id");
	if (error) throw new Error("No se pudo registrar el pedido.");
	return { orderIds: (created ?? []).map((o) => o.id) };
});
//#endregion
export { createOrders_createServerFn_handler };
