import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { c as TrendingUp, ct as Database, h as ShoppingCart, i as Users, ot as ExternalLink, pt as Clock, s as Tv } from "../_libs/lucide-react.mjs";
import { r as useSuspenseQuery } from "../_libs/tanstack__react-query.mjs";
import { n as adminStatsQueryOptions, t as Route } from "./admin-BIPaWa1t.mjs";
import { t as AdminLayout } from "./AdminLayout-C8SR68fz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-Dm1eHDRG.js
var import_jsx_runtime = require_jsx_runtime();
function AdminDashboard() {
	const { data: stats } = useSuspenseQuery(adminStatsQueryOptions);
	const { isAdmin } = Route.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminLayout, {
		title: "Resumen",
		subtitle: "Visión general del sistema de ventas",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					icon: Users,
					label: "Usuarios Totales",
					value: stats.totalUsers,
					color: "blue"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					icon: Database,
					label: "Cuentas en Stock",
					value: stats.totalStock,
					secondaryLabel: `${stats.availableStock} disponibles`,
					color: "primary"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					icon: ShoppingCart,
					label: "Ventas Realizadas",
					value: stats.totalSales,
					color: "green"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
					icon: TrendingUp,
					label: "Eficiencia Stock",
					value: stats.totalStock > 0 ? Math.round(stats.availableStock / stats.totalStock * 100) : 0,
					unit: "%",
					color: "violet"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid lg:grid-cols-3 gap-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lg:col-span-2 glass-card rounded-2xl border border-white/5 p-6 overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between mb-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
						className: "text-lg font-semibold text-white flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "w-5 h-5 text-primary" }), "Ventas Recientes"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/admin/ventas",
						className: "text-xs text-primary hover:underline flex items-center gap-1",
						children: ["Ver todas ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "w-3 h-3" })]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "text-left text-xs text-white/40 border-b border-white/5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-3 font-medium",
									children: "Usuario"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-3 font-medium",
									children: "Producto"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-3 font-medium",
									children: "Monto"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "pb-3 font-medium text-right",
									children: "Fecha"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "text-white/70",
							children: stats.recentSales.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 4,
								className: "py-8 text-center text-white/30",
								children: "No hay ventas registradas aún."
							}) }) : stats.recentSales.map((sale) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-4",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-medium text-white truncate w-32",
											children: sale.profiles?.nombre_completo || "Invitado"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-4 text-white/50",
										children: sale.producto_nombre
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "py-4 font-mono text-primary",
										children: ["S/ ", sale.monto.toFixed(2)]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "py-4 text-right text-xs text-white/30 group-hover:text-white/60 transition-colors",
										children: new Date(sale.created_at).toLocaleDateString()
									})
								]
							}, sale.id))
						})]
					})
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "glass-card rounded-2xl border border-white/5 p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-sm font-semibold text-white/60 uppercase tracking-wider mb-4",
						children: "Acciones Rápidas"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
							icon: Database,
							label: "Cargar Cuentas",
							href: "/admin/stock",
							description: "Añadir nuevas credenciales al stock."
						}), isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ActionButton, {
							icon: Tv,
							label: "Gestionar Servicios",
							href: "/admin/servicios",
							description: "Editar plataformas y categorías."
						})]
					})]
				})
			})]
		})]
	});
}
function StatCard({ icon: Icon, label, value, secondaryLabel, unit = "", color }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "glass-card rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-colors",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 mb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `w-10 h-10 rounded-xl grid place-items-center border ${{
						primary: "bg-primary/20 text-primary border-primary/30",
						blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
						green: "bg-green-500/20 text-green-400 border-green-500/30",
						violet: "bg-violet-500/20 text-violet-400 border-violet-500/30"
					}[color]}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "w-5 h-5" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-medium text-white/40 uppercase tracking-wider",
					children: label
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline gap-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-3xl font-display text-white",
					children: value
				}), unit && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-lg font-display text-white/40",
					children: unit
				})]
			}),
			secondaryLabel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-white/30 mt-1",
				children: secondaryLabel
			})
		]
	});
}
function ActionButton({ icon: Icon, label, description, href }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: href,
		className: "flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "w-4 h-4" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm font-medium text-white group-hover:text-primary transition-colors",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-white/40 leading-tight mt-0.5",
			children: description
		})] })]
	});
}
//#endregion
export { AdminDashboard as component };
