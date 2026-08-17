import { c as createServerFn } from "./createServerFn-CVho-diU.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-eb4ID_9s.mjs";
import { t as createSsrRpc } from "./createSsrRpc-C6LzJFyz.mjs";
import { a as objectType, i as numberType, n as booleanType, o as stringType, r as enumType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin.functions-Z_XiCNsk.js
var getAdminDashboardStats = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("3fc22913957c95863e91e9b8753cee7ebe75251273e0d56c4a5fffa0dca57a75"));
var getServicios = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("f0c5191e11aa7d282cf9722ccbb453806452ebc47d87ee2ef6a55b5837aeb3e2"));
createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("7b2f13ce37f884055d0ad7da1eb85179a5a20a5dfc51eaee4562f9bca87dc7e6"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	servicio_id: stringType(),
	email: stringType(),
	password: stringType(),
	perfil: stringType().optional(),
	vencimiento: stringType().optional()
}).parse(d)).handler(createSsrRpc("698db4875d185e5d330e10955fe3f6db67c6eea55da099e4a6695790d4c180bc"));
var addServicio = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	nombre: stringType(),
	slug: stringType(),
	categoria: stringType(),
	icono: stringType().optional()
}).parse(d)).handler(createSsrRpc("1c8e5037624a499aa8885a859c8468adf17cdc82792d588f72e4dbf087f87525"));
var updateServicio = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	id: stringType().uuid(),
	nombre: stringType().min(1),
	slug: stringType().min(1),
	categoria: stringType().min(1),
	icono: stringType().optional()
}).parse(d)).handler(createSsrRpc("00d2223e957c7badf0eaf91194db37ee932e2a180c65fa8e7551cabc6b952a76"));
var deleteServicio = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({ id: stringType() }).parse(d)).handler(createSsrRpc("51e59d04e97dabb85f554415d36bfb5dcdbabf680c61659a6a8aa272a9777ba8"));
createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({ id: stringType() }).parse(d)).handler(createSsrRpc("15a7b289f9c8890ab0dbe3185c877fbab1ffabc00a8cf6247c5fc7b33cd6bfbe"));
var getUsersWithRoles = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("6a1cfaf148d6341aacce4bd7f956dd14a7f0bbe67965099f7c257e9a15fb31a3"));
var updateUserRole = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	user_id: stringType(),
	role: enumType([
		"admin",
		"user",
		"proveedor"
	])
}).parse(d)).handler(createSsrRpc("03425c8b3be566d1d5640abcb1e3f1d7a33eb149a050904d9aae5bda333b76cd"));
var getAdminProducts = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("e172b200bb9d65f9dc2fcd0966dcb5c9aa593d039c308216e6fe8ea64858a5f7"));
var upsertProduct = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	id: stringType().optional(),
	name: stringType().min(1, "El nombre es obligatorio"),
	description: stringType().optional(),
	price: numberType().min(0, "El precio debe ser mayor o igual a 0"),
	image_url: stringType().optional(),
	category: stringType().optional(),
	is_active: booleanType().default(true),
	descripcion_larga: stringType().optional()
}).parse(d)).handler(createSsrRpc("87057b699c92d5e9cc4f021e767a44009606525481c8a27886c5fc0375dc6625"));
var deleteProduct = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({ id: stringType() }).parse(d)).handler(createSsrRpc("d58e9647e4364d7098cb0d840b98a827719a64c5b316ad80080e28b97fb3f1cb"));
var getManualOrders = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("2813f6c0f3ee34cc56ef9e01e04eceb93f1d14df34119e355493d8b5af6b890a"));
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
}).parse(d)).handler(createSsrRpc("ecc45578d596b154127612bda25ae87fc9535f8443b5b32e3107db4ffd609494"));
var updateManualOrder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	id: stringType(),
	estado: enumType([
		"pendiente",
		"verificado",
		"cancelado"
	])
}).parse(d)).handler(createSsrRpc("48bcba0f9ce8a9c1c1365609f4b25120c1c298172d327c9d1206e964ba6ba6ad"));
/** Actualiza el porcentaje de comisión de un proveedor (solo admin). */
var setSupplierCommission = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	user_id: stringType().uuid(),
	commission_rate: numberType().min(0).max(100)
}).parse(d)).handler(createSsrRpc("37c6c5c3f0fc6920c1ae316c1be4039108442f1049ad7979a2eb975dabb557f3"));
//#endregion
export { getAdminDashboardStats as a, getServicios as c, updateManualOrder as d, updateServicio as f, deleteServicio as i, getUsersWithRoles as l, upsertProduct as m, addServicio as n, getAdminProducts as o, updateUserRole as p, deleteProduct as r, getManualOrders as s, addManualOrder as t, setSupplierCommission as u };
