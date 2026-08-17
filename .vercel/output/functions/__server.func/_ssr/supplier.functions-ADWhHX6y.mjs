import { c as createServerFn } from "./createServerFn-CVho-diU.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-eb4ID_9s.mjs";
import { a as objectType, o as stringType, r as enumType, t as arrayType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-zBGjJ5LZ.mjs";
import { n as AVATAR_EFFECT_VALUES } from "./avatar-effects-XfJ0Ki_h.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/supplier.functions-ADWhHX6y.js
var getSupplierDashboardStats_createServerFn_handler = createServerRpc({
	id: "9e2b9d3e36ada01ec7f996db74d9fdc1d1fc613f4242f4de4b92965f0721adf0",
	name: "getSupplierDashboardStats",
	filename: "src/lib/supplier.functions.ts"
}, (opts) => getSupplierDashboardStats.__executeServer(opts));
var getSupplierDashboardStats = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getSupplierDashboardStats_createServerFn_handler, async ({ context }) => {
	const { assertSupplier } = await import("./roles.server-B8i9ZxAG.mjs");
	await assertSupplier(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { count: totalInventory } = await supabaseAdmin.from("account_inventory").select("*", {
		count: "exact",
		head: true
	}).eq("supplier_id", context.userId);
	const { count: availableStock } = await supabaseAdmin.from("account_inventory").select("*", {
		count: "exact",
		head: true
	}).eq("supplier_id", context.userId).eq("status", "available");
	const { count: soldCount } = await supabaseAdmin.from("account_inventory").select("*", {
		count: "exact",
		head: true
	}).eq("supplier_id", context.userId).eq("status", "assigned");
	const { data: profile } = await supabaseAdmin.from("supplier_profiles").select("*").eq("user_id", context.userId).maybeSingle();
	const { data: soldRows } = await supabaseAdmin.from("account_inventory").select("products(price)").eq("supplier_id", context.userId).eq("status", "assigned");
	const grossRevenue = (soldRows || []).reduce((acc, row) => acc + Number(row.products?.price || 0), 0);
	const commissionRate = Number(profile?.commission_rate ?? 70);
	const earnings = grossRevenue * commissionRate / 100;
	return {
		totalInventory: totalInventory || 0,
		availableStock: availableStock || 0,
		totalSales: soldCount || 0,
		isVerified: profile?.is_verified || false,
		hasProfile: !!profile,
		displayName: profile?.display_name || "",
		avatarUrl: profile?.avatar_url || "",
		avatarEffect: profile?.avatar_effect || "none",
		rating: profile?.total_reviews ? Number(profile.rating) : null,
		totalReviews: Number(profile?.total_reviews ?? 0),
		commissionRate,
		grossRevenue,
		earnings
	};
});
var getSupplierReviews_createServerFn_handler = createServerRpc({
	id: "c29b910eb930953c314ee458cc9902e659441a0a29e29dbb934e88c711bbbeac",
	name: "getSupplierReviews",
	filename: "src/lib/supplier.functions.ts"
}, (opts) => getSupplierReviews.__executeServer(opts));
var getSupplierReviews = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getSupplierReviews_createServerFn_handler, async ({ context }) => {
	const { assertSupplier } = await import("./roles.server-B8i9ZxAG.mjs");
	await assertSupplier(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { data, error } = await supabaseAdmin.from("supplier_ratings").select("id, rating, comment, created_at").eq("supplier_id", context.userId).order("created_at", { ascending: false }).limit(20);
	if (error) throw new Error(error.message);
	return data || [];
});
var getSupplierSales_createServerFn_handler = createServerRpc({
	id: "0eeb92c036002677c88ad07d39982d9b142d17bd25eb61bb8fe687bd514e33df",
	name: "getSupplierSales",
	filename: "src/lib/supplier.functions.ts"
}, (opts) => getSupplierSales.__executeServer(opts));
var getSupplierSales = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getSupplierSales_createServerFn_handler, async ({ context }) => {
	const { assertSupplier } = await import("./roles.server-B8i9ZxAG.mjs");
	await assertSupplier(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { data, error } = await supabaseAdmin.from("account_inventory").select("id, email, status, created_at, assigned_at, order_id, products(name, price)").eq("supplier_id", context.userId).eq("status", "assigned").order("assigned_at", { ascending: false });
	if (error) throw new Error(error.message);
	return data || [];
});
var deleteSupplierInventoryItem_createServerFn_handler = createServerRpc({
	id: "7b1aea71c8c4677825ff11b1dde231d691148eb4f2ca1ffc62c5fc0d82e5f0f7",
	name: "deleteSupplierInventoryItem",
	filename: "src/lib/supplier.functions.ts"
}, (opts) => deleteSupplierInventoryItem.__executeServer(opts));
var deleteSupplierInventoryItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(deleteSupplierInventoryItem_createServerFn_handler, async ({ data, context }) => {
	const { assertSupplier } = await import("./roles.server-B8i9ZxAG.mjs");
	await assertSupplier(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { data: row, error: readErr } = await supabaseAdmin.from("account_inventory").select("id, supplier_id, status").eq("id", data.id).maybeSingle();
	if (readErr) throw new Error(readErr.message);
	if (!row) throw new Error("Cuenta no encontrada.");
	if (row.supplier_id !== context.userId) throw new Error("No autorizado.");
	if (row.status !== "available") throw new Error("Solo puedes eliminar cuentas disponibles.");
	const { error } = await supabaseAdmin.from("account_inventory").delete().eq("id", data.id).eq("supplier_id", context.userId).eq("status", "available");
	if (error) throw new Error(error.message);
	return { success: true };
});
var getSupplierInventory_createServerFn_handler = createServerRpc({
	id: "37aa040d5f660003ef4a7ef3872b086e464ecd95c6fae721d4e233567d3958aa",
	name: "getSupplierInventory",
	filename: "src/lib/supplier.functions.ts"
}, (opts) => getSupplierInventory.__executeServer(opts));
var getSupplierInventory = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getSupplierInventory_createServerFn_handler, async ({ context }) => {
	const { assertSupplier } = await import("./roles.server-B8i9ZxAG.mjs");
	await assertSupplier(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { data, error } = await supabaseAdmin.from("account_inventory").select("*, products(name)").eq("supplier_id", context.userId).order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return data || [];
});
var getSupplierProducts_createServerFn_handler = createServerRpc({
	id: "d56919353a80ebfda6f27d8b7dd6f11521cdfc1c1810926f43b774c155399a9a",
	name: "getSupplierProducts",
	filename: "src/lib/supplier.functions.ts"
}, (opts) => getSupplierProducts.__executeServer(opts));
var getSupplierProducts = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getSupplierProducts_createServerFn_handler, async ({ context }) => {
	const { assertSupplier } = await import("./roles.server-B8i9ZxAG.mjs");
	await assertSupplier(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { data: isAdmin } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	let query = supabaseAdmin.from("products").select("*").eq("is_active", true);
	if (!isAdmin) query = query.eq("supplier_id", context.userId);
	const { data, error } = await query.order("name");
	if (error) throw new Error(error.message);
	return data || [];
});
var addSupplierInventoryBulk_createServerFn_handler = createServerRpc({
	id: "13f06d8309a769fe16c6d2403e87ec1522570568e3607885d149fc926d174f1a",
	name: "addSupplierInventoryBulk",
	filename: "src/lib/supplier.functions.ts"
}, (opts) => addSupplierInventoryBulk.__executeServer(opts));
var addSupplierInventoryBulk = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	product_id: stringType().uuid(),
	accounts: arrayType(objectType({
		email: stringType().trim().email().max(320),
		password: stringType().min(1).max(500),
		access_link: stringType().trim().url().max(2e3).optional(),
		notes: stringType().trim().max(2e3).optional()
	})).min(1).max(100)
}).parse(d)).handler(addSupplierInventoryBulk_createServerFn_handler, async ({ data, context }) => {
	const { assertSupplier } = await import("./roles.server-B8i9ZxAG.mjs");
	await assertSupplier(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { data: isAdmin } = await context.supabase.rpc("has_role", {
		_user_id: context.userId,
		_role: "admin"
	});
	const { data: product } = await supabaseAdmin.from("products").select("id, supplier_id, is_active").eq("id", data.product_id).maybeSingle();
	if (!product || !product.is_active) throw new Error("Producto no disponible.");
	if (!isAdmin && product.supplier_id !== context.userId) throw new Error("No estás autorizado para abastecer este producto.");
	const inventoryData = data.accounts.map((acc) => ({
		...acc,
		product_id: data.product_id,
		supplier_id: context.userId,
		status: "available"
	}));
	const { error } = await supabaseAdmin.from("account_inventory").insert(inventoryData);
	if (error) throw new Error(error.message);
	return { success: true };
});
var getSupplierProfile_createServerFn_handler = createServerRpc({
	id: "f9aa9e09a2850cad5ccd4d20eeb7bc2a9e1dea2d9f68f997d49511cd70cbb698",
	name: "getSupplierProfile",
	filename: "src/lib/supplier.functions.ts"
}, (opts) => getSupplierProfile.__executeServer(opts));
var getSupplierProfile = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getSupplierProfile_createServerFn_handler, async ({ context }) => {
	const { assertSupplier } = await import("./roles.server-B8i9ZxAG.mjs");
	await assertSupplier(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { data, error } = await supabaseAdmin.from("supplier_profiles").select("user_id, display_name, avatar_url, avatar_effect, is_verified, rating, total_reviews, joined_at").eq("user_id", context.userId).maybeSingle();
	if (error) throw new Error(error.message);
	return {
		user_id: context.userId,
		display_name: data?.display_name ?? "",
		avatar_url: data?.avatar_url ?? "",
		avatar_effect: data?.avatar_effect ?? "none",
		is_verified: data?.is_verified ?? false,
		rating: data?.rating ?? null,
		total_reviews: data?.total_reviews ?? 0,
		joined_at: data?.joined_at ?? null,
		exists: !!data
	};
});
var updateSupplierProfile_createServerFn_handler = createServerRpc({
	id: "ca2a270dfe81144ae8432504bee690d560780501345c40c5c3277ec4992604f0",
	name: "updateSupplierProfile",
	filename: "src/lib/supplier.functions.ts"
}, (opts) => updateSupplierProfile.__executeServer(opts));
var updateSupplierProfile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	display_name: stringType().min(2),
	avatar_url: stringType().optional(),
	avatar_effect: enumType(AVATAR_EFFECT_VALUES).optional()
}).parse(d)).handler(updateSupplierProfile_createServerFn_handler, async ({ data, context }) => {
	const { assertSupplier } = await import("./roles.server-B8i9ZxAG.mjs");
	await assertSupplier(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { data: existing, error: readErr } = await supabaseAdmin.from("supplier_profiles").select("id").eq("user_id", context.userId).maybeSingle();
	if (readErr) throw new Error(readErr.message);
	const payload = {
		display_name: data.display_name,
		...data.avatar_url !== void 0 ? { avatar_url: data.avatar_url } : {},
		...data.avatar_effect !== void 0 ? { avatar_effect: data.avatar_effect } : {}
	};
	const { data: saved, error } = existing ? await supabaseAdmin.from("supplier_profiles").update(payload).eq("user_id", context.userId).select("user_id, display_name, avatar_url, avatar_effect").single() : await supabaseAdmin.from("supplier_profiles").insert({
		user_id: context.userId,
		...payload
	}).select("user_id, display_name, avatar_url, avatar_effect").single();
	if (error) {
		console.error("[updateSupplierProfile] fallo al guardar", {
			userId: context.userId,
			effect: data.avatar_effect,
			code: error.code,
			message: error.message
		});
		throw new Error(error.message);
	}
	return {
		success: true,
		profile: saved
	};
});
//#endregion
export { addSupplierInventoryBulk_createServerFn_handler, deleteSupplierInventoryItem_createServerFn_handler, getSupplierDashboardStats_createServerFn_handler, getSupplierInventory_createServerFn_handler, getSupplierProducts_createServerFn_handler, getSupplierProfile_createServerFn_handler, getSupplierReviews_createServerFn_handler, getSupplierSales_createServerFn_handler, updateSupplierProfile_createServerFn_handler };
