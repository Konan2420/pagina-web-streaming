import { d as useLocation, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { c as createServerFn } from "./createServerFn-CVho-diU.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-eb4ID_9s.mjs";
import { t as createSsrRpc } from "./createSsrRpc-C6LzJFyz.mjs";
import { t as useIsAdmin } from "./useIsAdmin-Cl5SWJ_w.mjs";
import { M as Package, Q as History, W as LayoutDashboard, ct as Database, i as Users, jt as ArrowLeft } from "../_libs/lucide-react.mjs";
import { a as objectType, o as stringType, r as enumType, t as arrayType } from "../_libs/zod.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { n as AVATAR_EFFECT_VALUES } from "./avatar-effects-XfJ0Ki_h.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/supplier.functions-CkA1Z7Sy.js
var import_jsx_runtime = require_jsx_runtime();
function SupplierLayout({ children, title, subtitle }) {
	const location = useLocation();
	const { isSupplier, isAdmin } = useIsAdmin();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background text-foreground flex flex-col md:flex-row",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "w-full md:w-64 bg-ink/50 border-b md:border-b-0 md:border-r border-white/5 flex flex-col",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/tienda",
					className: "flex items-center gap-2 mb-8 group",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "w-4 h-4 text-white/40 group-hover:text-primary transition-colors" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-display text-xl text-white tracking-tighter",
						children: ["CMD ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-primary",
							children: "PROVEEDOR"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "space-y-1",
					children: [
						{
							label: "Dashboard",
							href: "/proveedor",
							icon: LayoutDashboard,
							accent: "text-amber-300"
						},
						{
							label: "Mi Inventario",
							href: "/proveedor/inventario",
							icon: Database,
							accent: "text-cyan-300"
						},
						{
							label: "Mis Ventas",
							href: "/proveedor/ventas",
							icon: History,
							accent: "text-emerald-300"
						},
						{
							label: "Perfil",
							href: "/proveedor/perfil",
							icon: Users,
							accent: "text-violet-300"
						}
					].map((item) => {
						const isActive = location.pathname === item.href;
						const Icon = item.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.href,
							className: cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group", isActive ? "bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20" : "text-white/60 hover:text-white hover:bg-white/5"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("w-5 h-5", isActive ? "text-slate-950" : `${item.accent} group-hover:brightness-125`) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-sm",
								children: item.label
							})]
						}, item.href);
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-auto p-6 border-t border-white/5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-10 h-10 rounded-full bg-primary/20 border border-primary/30 grid place-items-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "w-5 h-5 text-primary" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold text-white truncate",
							children: "Panel Proveedor"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-white/40 truncate",
							children: isAdmin ? "Admin Mode" : "Verified Partner"
						})]
					})]
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
			className: "flex-1 overflow-y-auto p-4 md:p-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-6xl mx-auto",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "mb-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-3xl sm:text-4xl text-white uppercase tracking-tight",
						children: title
					}), subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-white/50 text-sm mt-1",
						children: subtitle
					})]
				}), children]
			})
		})]
	});
}
var getSupplierDashboardStats = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("9e2b9d3e36ada01ec7f996db74d9fdc1d1fc613f4242f4de4b92965f0721adf0"));
/** Reseñas recibidas por el proveedor autenticado. */
var getSupplierReviews = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("c29b910eb930953c314ee458cc9902e659441a0a29e29dbb934e88c711bbbeac"));
var getSupplierSales = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("0eeb92c036002677c88ad07d39982d9b142d17bd25eb61bb8fe687bd514e33df"));
var deleteSupplierInventoryItem = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({ id: stringType().uuid() }).parse(d)).handler(createSsrRpc("7b1aea71c8c4677825ff11b1dde231d691148eb4f2ca1ffc62c5fc0d82e5f0f7"));
var getSupplierInventory = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("37aa040d5f660003ef4a7ef3872b086e464ecd95c6fae721d4e233567d3958aa"));
/** Productos que el proveedor puede abastecer: los asignados a él (o todos si es admin). */
var getSupplierProducts = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("d56919353a80ebfda6f27d8b7dd6f11521cdfc1c1810926f43b774c155399a9a"));
var addSupplierInventoryBulk = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	product_id: stringType().uuid(),
	accounts: arrayType(objectType({
		email: stringType().trim().email().max(320),
		password: stringType().min(1).max(500),
		access_link: stringType().trim().url().max(2e3).optional(),
		notes: stringType().trim().max(2e3).optional()
	})).min(1).max(100)
}).parse(d)).handler(createSsrRpc("13f06d8309a769fe16c6d2403e87ec1522570568e3607885d149fc926d174f1a"));
var getSupplierProfile = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("f9aa9e09a2850cad5ccd4d20eeb7bc2a9e1dea2d9f68f997d49511cd70cbb698"));
var updateSupplierProfile = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	display_name: stringType().min(2),
	avatar_url: stringType().optional(),
	avatar_effect: enumType(AVATAR_EFFECT_VALUES).optional()
}).parse(d)).handler(createSsrRpc("ca2a270dfe81144ae8432504bee690d560780501345c40c5c3277ec4992604f0"));
//#endregion
export { getSupplierInventory as a, getSupplierReviews as c, getSupplierDashboardStats as i, getSupplierSales as l, addSupplierInventoryBulk as n, getSupplierProducts as o, deleteSupplierInventoryItem as r, getSupplierProfile as s, SupplierLayout as t, updateSupplierProfile as u };
