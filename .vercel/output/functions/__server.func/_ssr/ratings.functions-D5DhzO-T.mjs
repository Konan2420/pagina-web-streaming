import { c as createServerFn } from "./createServerFn-CVho-diU.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-eb4ID_9s.mjs";
import { a as objectType, i as numberType, o as stringType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-zBGjJ5LZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ratings.functions-D5DhzO-T.js
/**
* Devuelve, para los pedidos del usuario autenticado, qué proveedor los abasteció
* y si ya fueron calificados.
*/
var getMyOrderRatings_createServerFn_handler = createServerRpc({
	id: "1e9f3d8e6cd0e9518837e328d748ebb09a052131a2f1d0dfd17727dd4398c40b",
	name: "getMyOrderRatings",
	filename: "src/lib/ratings.functions.ts"
}, (opts) => getMyOrderRatings.__executeServer(opts));
var getMyOrderRatings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getMyOrderRatings_createServerFn_handler, async ({ context }) => {
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { data: orders } = await supabaseAdmin.from("orders").select("id").eq("user_id", context.userId);
	const orderIds = (orders || []).map((o) => o.id);
	if (orderIds.length === 0) return [];
	const { data: inv } = await supabaseAdmin.from("account_inventory").select("order_id, supplier_id").in("order_id", orderIds).not("supplier_id", "is", null);
	const { data: ratings } = await supabaseAdmin.from("supplier_ratings").select("order_id, rating, comment").eq("user_id", context.userId);
	const supplierIds = Array.from(new Set((inv || []).map((i) => i.supplier_id)));
	const profiles = supplierIds.length ? (await supabaseAdmin.from("supplier_profiles").select("user_id, display_name, avatar_url, avatar_effect").in("user_id", supplierIds)).data ?? [] : [];
	const profileOf = new Map(profiles.map((profile) => [profile.user_id, profile]));
	const ratingOf = new Map((ratings || []).map((rating) => [rating.order_id, rating]));
	const seen = /* @__PURE__ */ new Set();
	const result = [];
	for (const row of inv || []) {
		const oid = row.order_id;
		if (!oid || seen.has(oid)) continue;
		seen.add(oid);
		const r = ratingOf.get(oid);
		result.push({
			order_id: oid,
			supplier_id: row.supplier_id,
			supplier_name: profileOf.get(row.supplier_id)?.display_name || "Proveedor",
			supplier_avatar_url: profileOf.get(row.supplier_id)?.avatar_url || null,
			supplier_avatar_effect: profileOf.get(row.supplier_id)?.avatar_effect || "none",
			rating: r?.rating ?? null,
			comment: r?.comment ?? null
		});
	}
	return result;
});
var rateOrderSupplier_createServerFn_handler = createServerRpc({
	id: "ef3298ae43384388bae11e2eaa4ab51922e84152ea2c2f356666130a135cea96",
	name: "rateOrderSupplier",
	filename: "src/lib/ratings.functions.ts"
}, (opts) => rateOrderSupplier.__executeServer(opts));
var rateOrderSupplier = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	order_id: stringType().uuid(),
	rating: numberType().int().min(1).max(5),
	comment: stringType().max(500).optional()
}).parse(d)).handler(rateOrderSupplier_createServerFn_handler, async ({ data, context }) => {
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { data: order } = await supabaseAdmin.from("orders").select("id, user_id").eq("id", data.order_id).maybeSingle();
	if (!order || order.user_id !== context.userId) throw new Error("Pedido no encontrado.");
	const { data: inv } = await supabaseAdmin.from("account_inventory").select("supplier_id").eq("order_id", data.order_id).not("supplier_id", "is", null).limit(1).maybeSingle();
	if (!inv?.supplier_id) throw new Error("Este pedido aún no tiene un proveedor asignado.");
	const { error } = await supabaseAdmin.from("supplier_ratings").upsert({
		user_id: context.userId,
		order_id: data.order_id,
		supplier_id: inv.supplier_id,
		rating: data.rating,
		comment: data.comment || null,
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}, { onConflict: "user_id,order_id" });
	if (error) throw new Error(error.message);
	return { success: true };
});
//#endregion
export { getMyOrderRatings_createServerFn_handler, rateOrderSupplier_createServerFn_handler };
