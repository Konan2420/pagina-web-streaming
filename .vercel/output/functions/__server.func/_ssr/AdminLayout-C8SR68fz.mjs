import { d as useLocation, v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as useIsAdmin } from "./useIsAdmin-Cl5SWJ_w.mjs";
import { Ot as Banknote, Q as History, W as LayoutDashboard, ct as Database, h as ShoppingCart, i as Users, jt as ArrowLeft, k as Phone, s as Tv, wt as ChartColumn } from "../_libs/lucide-react.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AdminLayout-C8SR68fz.js
var import_jsx_runtime = require_jsx_runtime();
function AdminLayout({ children, title, subtitle }) {
	const location = useLocation();
	const { isAdmin, isEditor, isSupplier } = useIsAdmin();
	const filteredItems = [
		{
			label: "Dashboard",
			href: "/admin",
			icon: LayoutDashboard,
			role: "any",
			accent: "text-red-300"
		},
		{
			label: "Productos",
			href: "/admin/productos",
			icon: ShoppingCart,
			role: "any",
			accent: "text-amber-300"
		},
		{
			label: "Servicios",
			href: "/admin/servicios",
			icon: Tv,
			role: "any",
			accent: "text-cyan-300"
		},
		{
			label: "Inventario Auto",
			href: "/admin/inventario",
			icon: Database,
			role: "any",
			accent: "text-violet-300"
		},
		{
			label: "Stock Cuentas",
			href: "/admin/stock",
			icon: Database,
			role: "any",
			accent: "text-indigo-300"
		},
		{
			label: "Ventas Auto",
			href: "/admin/ventas",
			icon: History,
			role: "any",
			accent: "text-emerald-300"
		},
		{
			label: "Pedidos y Entregas",
			href: "/admin/pedidos",
			icon: ShoppingCart,
			role: "any",
			accent: "text-orange-300"
		},
		{
			label: "Pedidos WA",
			href: "/admin/pedidos-manuales",
			icon: Phone,
			role: "any",
			accent: "text-green-300"
		},
		{
			label: "Payouts",
			href: "/admin/payouts",
			icon: Banknote,
			role: "admin",
			accent: "text-yellow-300"
		},
		{
			label: "Usuarios",
			href: "/admin/usuarios",
			icon: Users,
			role: "admin",
			accent: "text-sky-300"
		},
		{
			label: "Proveedores",
			href: "/admin/proveedores",
			icon: Users,
			role: "admin",
			accent: "text-pink-300"
		},
		{
			label: "Analítica",
			href: "/admin/analytics",
			icon: ChartColumn,
			role: "any",
			accent: "text-teal-300"
		}
	].filter((item) => {
		if (item.role === "any") return true;
		if (item.role === "admin") return isAdmin;
		if (item.role === "proveedor") return isSupplier;
		return false;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-background text-foreground flex flex-col md:flex-row",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "w-full md:w-64 bg-ink/50 border-b md:border-b-0 md:border-r border-white/5 flex flex-col",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex items-center gap-2 mb-8 group",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "w-4 h-4 text-white/40 group-hover:text-primary transition-colors" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-display text-xl text-white tracking-tighter",
						children: ["CMD ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-primary",
							children: "ADMIN"
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "space-y-1",
					children: filteredItems.map((item) => {
						const isActive = location.pathname === item.href;
						const Icon = item.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: item.href,
							className: cn("flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group", isActive ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/60 hover:text-white hover:bg-white/5"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("w-5 h-5", isActive ? "text-white" : `${item.accent} group-hover:brightness-125`) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
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
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "w-5 h-5 text-primary" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold text-white truncate",
							children: "Admin Panel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-white/40 truncate",
							children: "v1.2.0"
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
//#endregion
export { AdminLayout as t };
