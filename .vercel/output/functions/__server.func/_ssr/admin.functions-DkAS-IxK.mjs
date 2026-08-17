import { c as createServerFn } from "./createServerFn-CVho-diU.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-eb4ID_9s.mjs";
import { a as objectType, i as numberType, n as booleanType, o as stringType, r as enumType } from "../_libs/zod.mjs";
import { t as createServerRpc } from "./createServerRpc-zBGjJ5LZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.functions-DkAS-IxK.js
var getAdminDashboardStats_createServerFn_handler = createServerRpc({
	id: "3fc22913957c95863e91e9b8753cee7ebe75251273e0d56c4a5fffa0dca57a75",
	name: "getAdminDashboardStats",
	filename: "src/lib/admin.functions.ts"
}, (opts) => getAdminDashboardStats.__executeServer(opts));
var getAdminDashboardStats = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getAdminDashboardStats_createServerFn_handler, async ({ context }) => {
	const { assertAdmin } = await import("./admin.server-JsoFb4Ku.mjs");
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { count: totalUsers } = await supabaseAdmin.from("profiles").select("*", {
		count: "exact",
		head: true
	});
	const { count: totalStock } = await supabaseAdmin.from("cuentas_stock").select("*", {
		count: "exact",
		head: true
	});
	const { count: availableStock } = await supabaseAdmin.from("cuentas_stock").select("*", {
		count: "exact",
		head: true
	}).eq("estado", "disponible");
	const { count: totalSales } = await supabaseAdmin.from("ventas").select("*", {
		count: "exact",
		head: true
	});
	const { data: recentSales, error: recentSalesError } = await supabaseAdmin.from("ventas").select("*").order("created_at", { ascending: false }).limit(10);
	if (recentSalesError) throw new Error(recentSalesError.message);
	const userIds = [...new Set((recentSales || []).map((sale) => sale.user_id).filter((userId) => Boolean(userId)))];
	const { data: salesProfiles, error: salesProfilesError } = userIds.length ? await supabaseAdmin.from("profiles").select("id, nombre_completo").in("id", userIds) : {
		data: [],
		error: null
	};
	if (salesProfilesError) throw new Error(salesProfilesError.message);
	const salesProfilesMap = Object.fromEntries((salesProfiles || []).map((profile) => [profile.id, profile]));
	const recentSalesWithProfiles = (recentSales || []).map((sale) => ({
		...sale,
		profiles: sale.user_id ? salesProfilesMap[sale.user_id] ?? null : null
	}));
	return {
		totalUsers: totalUsers || 0,
		totalStock: totalStock || 0,
		availableStock: availableStock || 0,
		totalSales: totalSales || 0,
		recentSales: recentSalesWithProfiles
	};
});
var getServicios_createServerFn_handler = createServerRpc({
	id: "f0c5191e11aa7d282cf9722ccbb453806452ebc47d87ee2ef6a55b5837aeb3e2",
	name: "getServicios",
	filename: "src/lib/admin.functions.ts"
}, (opts) => getServicios.__executeServer(opts));
var getServicios = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getServicios_createServerFn_handler, async ({ context }) => {
	const { assertAdmin } = await import("./admin.server-JsoFb4Ku.mjs");
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { data } = await supabaseAdmin.from("servicios_streaming").select("*").order("nombre");
	return data || [];
});
var getStock_createServerFn_handler = createServerRpc({
	id: "7b2f13ce37f884055d0ad7da1eb85179a5a20a5dfc51eaee4562f9bca87dc7e6",
	name: "getStock",
	filename: "src/lib/admin.functions.ts"
}, (opts) => getStock.__executeServer(opts));
var getStock = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getStock_createServerFn_handler, async ({ context }) => {
	const { assertAdmin } = await import("./admin.server-JsoFb4Ku.mjs");
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { data } = await supabaseAdmin.from("cuentas_stock").select("*, servicios_streaming(nombre)").order("created_at", { ascending: false });
	return data || [];
});
var addStock_createServerFn_handler = createServerRpc({
	id: "698db4875d185e5d330e10955fe3f6db67c6eea55da099e4a6695790d4c180bc",
	name: "addStock",
	filename: "src/lib/admin.functions.ts"
}, (opts) => addStock.__executeServer(opts));
var addStock = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	servicio_id: stringType(),
	email: stringType(),
	password: stringType(),
	perfil: stringType().optional(),
	vencimiento: stringType().optional()
}).parse(d)).handler(addStock_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./admin.server-JsoFb4Ku.mjs");
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { error } = await supabaseAdmin.from("cuentas_stock").insert([data]);
	if (error) throw new Error(error.message);
	return { success: true };
});
var addServicio_createServerFn_handler = createServerRpc({
	id: "1c8e5037624a499aa8885a859c8468adf17cdc82792d588f72e4dbf087f87525",
	name: "addServicio",
	filename: "src/lib/admin.functions.ts"
}, (opts) => addServicio.__executeServer(opts));
var addServicio = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	nombre: stringType(),
	slug: stringType(),
	categoria: stringType(),
	icono: stringType().optional()
}).parse(d)).handler(addServicio_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./admin.server-JsoFb4Ku.mjs");
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { error } = await supabaseAdmin.from("servicios_streaming").insert([data]);
	if (error) throw new Error(error.message);
	return { success: true };
});
var updateServicio_createServerFn_handler = createServerRpc({
	id: "00d2223e957c7badf0eaf91194db37ee932e2a180c65fa8e7551cabc6b952a76",
	name: "updateServicio",
	filename: "src/lib/admin.functions.ts"
}, (opts) => updateServicio.__executeServer(opts));
var updateServicio = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	id: stringType().uuid(),
	nombre: stringType().min(1),
	slug: stringType().min(1),
	categoria: stringType().min(1),
	icono: stringType().optional()
}).parse(d)).handler(updateServicio_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./admin.server-JsoFb4Ku.mjs");
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { id, ...changes } = data;
	const { error } = await supabaseAdmin.from("servicios_streaming").update(changes).eq("id", id);
	if (error) throw new Error(error.message);
	return { success: true };
});
var deleteServicio_createServerFn_handler = createServerRpc({
	id: "51e59d04e97dabb85f554415d36bfb5dcdbabf680c61659a6a8aa272a9777ba8",
	name: "deleteServicio",
	filename: "src/lib/admin.functions.ts"
}, (opts) => deleteServicio.__executeServer(opts));
var deleteServicio = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({ id: stringType() }).parse(d)).handler(deleteServicio_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./admin.server-JsoFb4Ku.mjs");
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { error } = await supabaseAdmin.from("servicios_streaming").delete().eq("id", data.id);
	if (error) throw new Error(error.message);
	return { success: true };
});
var deleteStock_createServerFn_handler = createServerRpc({
	id: "15a7b289f9c8890ab0dbe3185c877fbab1ffabc00a8cf6247c5fc7b33cd6bfbe",
	name: "deleteStock",
	filename: "src/lib/admin.functions.ts"
}, (opts) => deleteStock.__executeServer(opts));
var deleteStock = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({ id: stringType() }).parse(d)).handler(deleteStock_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./admin.server-JsoFb4Ku.mjs");
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { error } = await supabaseAdmin.from("cuentas_stock").delete().eq("id", data.id);
	if (error) throw new Error(error.message);
	return { success: true };
});
var getUsersWithRoles_createServerFn_handler = createServerRpc({
	id: "6a1cfaf148d6341aacce4bd7f956dd14a7f0bbe67965099f7c257e9a15fb31a3",
	name: "getUsersWithRoles",
	filename: "src/lib/admin.functions.ts"
}, (opts) => getUsersWithRoles.__executeServer(opts));
var getUsersWithRoles = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getUsersWithRoles_createServerFn_handler, async ({ context }) => {
	const { assertAdmin } = await import("./admin.server-JsoFb4Ku.mjs");
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { data: profiles, error: pError } = await supabaseAdmin.from("profiles").select("id, nombre_completo, whatsapp, created_at");
	if (pError) throw new Error(pError.message);
	const { data: roles, error: rError } = await supabaseAdmin.from("user_roles").select("user_id, role");
	if (rError) throw new Error(rError.message);
	return profiles.map((p) => ({
		...p,
		email: "",
		role: roles.find((r) => r.user_id === p.id)?.role || "user"
	}));
});
var updateUserRole_createServerFn_handler = createServerRpc({
	id: "03425c8b3be566d1d5640abcb1e3f1d7a33eb149a050904d9aae5bda333b76cd",
	name: "updateUserRole",
	filename: "src/lib/admin.functions.ts"
}, (opts) => updateUserRole.__executeServer(opts));
var updateUserRole = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	user_id: stringType(),
	role: enumType([
		"admin",
		"user",
		"proveedor"
	])
}).parse(d)).handler(updateUserRole_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./admin.server-JsoFb4Ku.mjs");
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	if (data.user_id === context.userId) throw new Error("No puedes cambiar tu propio rol.");
	const { error: deleteError } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.user_id);
	if (deleteError) throw new Error(deleteError.message);
	const { error: insertError } = await supabaseAdmin.from("user_roles").insert({
		user_id: data.user_id,
		role: data.role
	});
	if (insertError) throw new Error(insertError.message);
	if (data.role === "proveedor") {
		const { data: profile } = await supabaseAdmin.from("profiles").select("nombre_completo").eq("id", data.user_id).single();
		const { error: supplierError } = await supabaseAdmin.from("supplier_profiles").upsert({
			user_id: data.user_id,
			display_name: profile?.nombre_completo || "Nuevo Proveedor",
			is_verified: true,
			total_sales: 0,
			rating: 5
		}, { onConflict: "user_id" });
		if (supplierError) throw new Error(`No se pudo crear el perfil del proveedor: ${supplierError.message}`);
	}
	return { success: true };
});
var getAdminProducts_createServerFn_handler = createServerRpc({
	id: "e172b200bb9d65f9dc2fcd0966dcb5c9aa593d039c308216e6fe8ea64858a5f7",
	name: "getAdminProducts",
	filename: "src/lib/admin.functions.ts"
}, (opts) => getAdminProducts.__executeServer(opts));
var getAdminProducts = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getAdminProducts_createServerFn_handler, async ({ context }) => {
	const { assertAdmin } = await import("./admin.server-JsoFb4Ku.mjs");
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { data, error } = await supabaseAdmin.from("products").select("*").order("created_at", { ascending: false });
	if (error) throw new Error(error.message);
	return data || [];
});
var upsertProduct_createServerFn_handler = createServerRpc({
	id: "87057b699c92d5e9cc4f021e767a44009606525481c8a27886c5fc0375dc6625",
	name: "upsertProduct",
	filename: "src/lib/admin.functions.ts"
}, (opts) => upsertProduct.__executeServer(opts));
var upsertProduct = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	id: stringType().optional(),
	name: stringType().min(1, "El nombre es obligatorio"),
	description: stringType().optional(),
	price: numberType().min(0, "El precio debe ser mayor o igual a 0"),
	image_url: stringType().optional(),
	category: stringType().optional(),
	is_active: booleanType().default(true),
	descripcion_larga: stringType().optional()
}).parse(d)).handler(upsertProduct_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./admin.server-JsoFb4Ku.mjs");
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { id, ...rest } = data;
	if (id) {
		const { error } = await supabaseAdmin.from("products").update(rest).eq("id", id);
		if (error) throw new Error(error.message);
	} else {
		const { error } = await supabaseAdmin.from("products").insert([rest]);
		if (error) throw new Error(error.message);
	}
	return { success: true };
});
var deleteProduct_createServerFn_handler = createServerRpc({
	id: "d58e9647e4364d7098cb0d840b98a827719a64c5b316ad80080e28b97fb3f1cb",
	name: "deleteProduct",
	filename: "src/lib/admin.functions.ts"
}, (opts) => deleteProduct.__executeServer(opts));
var deleteProduct = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({ id: stringType() }).parse(d)).handler(deleteProduct_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./admin.server-JsoFb4Ku.mjs");
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
	if (error) throw new Error(error.message);
	return { success: true };
});
var getManualOrders_createServerFn_handler = createServerRpc({
	id: "2813f6c0f3ee34cc56ef9e01e04eceb93f1d14df34119e355493d8b5af6b890a",
	name: "getManualOrders",
	filename: "src/lib/admin.functions.ts"
}, (opts) => getManualOrders.__executeServer(opts));
var getManualOrders = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getManualOrders_createServerFn_handler, async ({ context }) => {
	const { assertAdmin } = await import("./admin.server-JsoFb4Ku.mjs");
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { data: orders, error: oError } = await supabaseAdmin.from("manual_orders").select("*").order("created_at", { ascending: false });
	if (oError) throw new Error(oError.message);
	if (!orders || orders.length === 0) return [];
	const userIds = [...new Set(orders.map((o) => o.user_id).filter(Boolean))];
	let profilesMap = {};
	if (userIds.length > 0) {
		const { data: profiles } = await supabaseAdmin.from("profiles").select("id, nombre_completo, whatsapp").in("id", userIds);
		profilesMap = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
	}
	return orders.map((o) => ({
		...o,
		profiles: o.user_id ? profilesMap[o.user_id] : null
	}));
});
var addManualOrder_createServerFn_handler = createServerRpc({
	id: "ecc45578d596b154127612bda25ae87fc9535f8443b5b32e3107db4ffd609494",
	name: "addManualOrder",
	filename: "src/lib/admin.functions.ts"
}, (opts) => addManualOrder.__executeServer(opts));
var addManualOrder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	user_id: stringType().optional().nullable(),
	producto_nombre: stringType().min(1),
	monto: numberType().min(0),
	fecha_adquisicion: stringType(),
	fecha_vencimiento: stringType().optional().nullable(),
	whatsapp_cliente: stringType().optional().nullable(),
	nombre_cliente: stringType().optional().nullable(),
	estado: enumType([
		"pendiente",
		"verificado",
		"cancelado"
	]).default("verificado")
}).parse(d)).handler(addManualOrder_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./admin.server-JsoFb4Ku.mjs");
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { error } = await supabaseAdmin.from("manual_orders").insert([data]);
	if (error) throw new Error(error.message);
	return { success: true };
});
var updateManualOrder_createServerFn_handler = createServerRpc({
	id: "48bcba0f9ce8a9c1c1365609f4b25120c1c298172d327c9d1206e964ba6ba6ad",
	name: "updateManualOrder",
	filename: "src/lib/admin.functions.ts"
}, (opts) => updateManualOrder.__executeServer(opts));
var updateManualOrder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	id: stringType(),
	estado: enumType([
		"pendiente",
		"verificado",
		"cancelado"
	])
}).parse(d)).handler(updateManualOrder_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./admin.server-JsoFb4Ku.mjs");
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { error } = await supabaseAdmin.from("manual_orders").update({ estado: data.estado }).eq("id", data.id);
	if (error) throw new Error(error.message);
	return { success: true };
});
var setSupplierCommission_createServerFn_handler = createServerRpc({
	id: "37c6c5c3f0fc6920c1ae316c1be4039108442f1049ad7979a2eb975dabb557f3",
	name: "setSupplierCommission",
	filename: "src/lib/admin.functions.ts"
}, (opts) => setSupplierCommission.__executeServer(opts));
var setSupplierCommission = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	user_id: stringType().uuid(),
	commission_rate: numberType().min(0).max(100)
}).parse(d)).handler(setSupplierCommission_createServerFn_handler, async ({ data, context }) => {
	const { assertAdmin } = await import("./admin.server-JsoFb4Ku.mjs");
	await assertAdmin(context.supabase, context.userId);
	const { supabaseAdmin } = await import("./client.server-D26vNS3H.mjs");
	const { error } = await supabaseAdmin.from("supplier_profiles").update({ commission_rate: data.commission_rate }).eq("user_id", data.user_id);
	if (error) throw new Error(error.message);
	return { success: true };
});
//#endregion
export { addManualOrder_createServerFn_handler, addServicio_createServerFn_handler, addStock_createServerFn_handler, deleteProduct_createServerFn_handler, deleteServicio_createServerFn_handler, deleteStock_createServerFn_handler, getAdminDashboardStats_createServerFn_handler, getAdminProducts_createServerFn_handler, getManualOrders_createServerFn_handler, getServicios_createServerFn_handler, getStock_createServerFn_handler, getUsersWithRoles_createServerFn_handler, setSupplierCommission_createServerFn_handler, updateManualOrder_createServerFn_handler, updateServicio_createServerFn_handler, updateUserRole_createServerFn_handler, upsertProduct_createServerFn_handler };
