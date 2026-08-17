import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { Nt as Activity, P as MousePointerClick, c as TrendingUp, h as ShoppingCart, i as Users, jt as ArrowLeft, lt as CreditCard, pt as Clock, wt as ChartColumn } from "../_libs/lucide-react.mjs";
import { r as useSuspenseQuery } from "../_libs/tanstack__react-query.mjs";
import { t as dashboardQueryOptions } from "./analytics-BWcQsCys.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics-sGsoQDBn.js
var import_jsx_runtime = require_jsx_runtime();
function AnalyticsPage() {
	const { data: dashboard } = useSuspenseQuery(dashboardQueryOptions);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen bg-background text-foreground",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-7xl mx-auto px-4 sm:px-6 py-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-4 mb-8",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/tienda",
						className: "inline-flex items-center gap-2 text-sm text-white/78 hover:text-white transition",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "w-4 h-4" }), "Volver a la tienda"]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 mb-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-10 h-10 rounded-xl gradient-violet grid place-items-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartColumn, { className: "w-5 h-5 text-white" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-2xl sm:text-3xl text-white uppercase",
						children: "Analytics"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-white/70",
						children: "Métricas internas en tiempo real"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiCard, {
							icon: Activity,
							label: "Eventos totales",
							value: dashboard.totalEvents
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiCard, {
							icon: Clock,
							label: "Últimas 24h",
							value: dashboard.events24h
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiCard, {
							icon: TrendingUp,
							label: "Últimos 7 días",
							value: dashboard.events7d
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KpiCard, {
							icon: Users,
							label: "Sesiones únicas",
							value: dashboard.uniqueSessions
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid lg:grid-cols-2 gap-6 mb-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "glass-card rounded-2xl border border-white/10 p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "flex items-center gap-2 text-sm font-semibold text-white mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MousePointerClick, { className: "w-4 h-4 text-violet-2" }), "Embudo de conversión"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FunnelStep, {
									label: "Vistas de página",
									value: dashboard.funnel.page_views,
									max: dashboard.funnel.page_views
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FunnelStep, {
									label: "Registros",
									value: dashboard.funnel.signups,
									max: dashboard.funnel.page_views
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FunnelStep, {
									label: "Añadir al carrito",
									value: dashboard.funnel.add_to_cart,
									max: dashboard.funnel.page_views
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FunnelStep, {
									label: "Compras",
									value: dashboard.funnel.purchase,
									max: dashboard.funnel.page_views
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "glass-card rounded-2xl border border-white/10 p-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "flex items-center gap-2 text-sm font-semibold text-white mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartColumn, { className: "w-4 h-4 text-violet-2" }), "Eventos por tipo"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-3",
							children: [dashboard.eventsByType.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-white/62",
								children: "Sin eventos registrados."
							}), dashboard.eventsByType.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-white/70 capitalize w-32 truncate",
										children: e.event_type
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex-1 h-2 rounded-full bg-white/10 overflow-hidden",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "h-full rounded-full gradient-violet",
											style: { width: `${Math.max(5, Math.min(100, e.count / Math.max(...dashboard.eventsByType.map((x) => x.count)) * 100))}%` }
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-white font-semibold w-8 text-right",
										children: e.count
									})
								]
							}, e.event_type))]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "glass-card rounded-2xl border border-white/10 p-5 mb-8",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "flex items-center gap-2 text-sm font-semibold text-white mb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "w-4 h-4 text-violet-2" }), "Productos más vendidos (30 días)"]
					}), dashboard.topProducts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-white/62",
						children: "Aún no hay compras registradas."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "text-left text-xs text-white/62 border-b border-white/10",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-2 font-medium",
										children: "Producto"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-2 font-medium text-right",
										children: "Ventas"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-2 font-medium text-right",
										children: "Ingresos"
									})
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
								className: "text-white/80",
								children: dashboard.topProducts.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-white/5 last:border-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-3",
											children: p.producto_nombre
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-3 text-right",
											children: p.count
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "py-3 text-right",
											children: ["S/ ", p.revenue.toFixed(2)]
										})
									]
								}, p.producto_id))
							})]
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "glass-card rounded-2xl border border-white/10 p-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "flex items-center gap-2 text-sm font-semibold text-white mb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "w-4 h-4 text-violet-2" }), "Eventos recientes"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "text-left text-xs text-white/62 border-b border-white/10",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-2 font-medium",
										children: "Evento"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-2 font-medium",
										children: "Nombre"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-2 font-medium",
										children: "Ruta"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "pb-2 font-medium text-right",
										children: "Hora"
									})
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", {
								className: "text-white/80",
								children: [dashboard.recentEvents.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: 4,
									className: "py-4 text-white/62",
									children: "Sin eventos recientes."
								}) }), dashboard.recentEvents.map((e) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-white/5 last:border-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2 capitalize",
											children: e.event_type
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2 text-white/78",
											children: e.event_name ?? "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2 text-white/78 text-xs",
											children: e.path ?? "—"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "py-2 text-right text-xs text-white/78",
											children: new Date(e.created_at).toLocaleString("es-PE")
										})
									]
								}, e.id))]
							})]
						})
					})]
				})
			]
		})
	});
}
function KpiCard({ icon: Icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "glass-card rounded-2xl border border-white/10 p-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 mb-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "w-4 h-4 text-violet-2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs text-white/70",
				children: label
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-2xl font-bold text-white",
			children: value.toLocaleString("es-PE")
		})]
	});
}
function FunnelStep({ label, value, max }) {
	const pct = max > 0 ? Math.round(value / max * 100) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex justify-between text-xs mb-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-white/70",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "text-white font-semibold",
			children: [
				value,
				" (",
				pct,
				"%)"
			]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-2.5 rounded-full bg-white/10 overflow-hidden",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-full rounded-full gradient-violet transition-all",
			style: { width: `${pct}%` }
		})
	})] });
}
//#endregion
export { AnalyticsPage as component };
