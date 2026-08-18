import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { D as Plus, M as Package, c as TrendingUp, p as Star, v as ShieldCheck, yt as CircleCheck } from "../_libs/lucide-react.mjs";
import { i as useQuery } from "../_libs/tanstack__react-query.mjs";
import { _ as useFuturisticSound, v as ProviderAvatar } from "./router-CZAAJbb_.mjs";
import { c as getSupplierReviews, i as getSupplierDashboardStats, t as SupplierLayout } from "./supplier.functions-Do9UnGB-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/proveedor-Dz_HhTr9.js
var import_jsx_runtime = require_jsx_runtime();
function SupplierDashboard() {
	const { playHover, playClick } = useFuturisticSound();
	const { data: stats, isLoading } = useQuery({
		queryKey: ["supplier-stats"],
		queryFn: () => getSupplierDashboardStats()
	});
	const { data: reviews = [] } = useQuery({
		queryKey: ["supplier-reviews"],
		queryFn: () => getSupplierReviews()
	});
	if (isLoading) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SupplierLayout, {
		title: "Dashboard",
		subtitle: "Cargando tus estadísticas...",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse",
			children: [
				1,
				2,
				3,
				4
			].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-32 bg-white/5 border border-white/10 rounded-2xl" }, i))
		})
	});
	const statCards = [
		{
			label: "Stock Disponible",
			value: stats?.availableStock ?? 0,
			icon: Package,
			color: "text-blue-400"
		},
		{
			label: "Ventas Totales",
			value: stats?.totalSales ?? 0,
			icon: TrendingUp,
			color: "text-green-400"
		},
		{
			label: "Mis Ganancias",
			value: `S/ ${Number(stats?.earnings ?? 0).toFixed(2)}`,
			icon: ShieldCheck,
			color: "text-purple-400"
		},
		{
			label: "Calificación",
			value: stats?.rating != null ? `${Number(stats.rating).toFixed(1)} ★` : "Sin calificación",
			icon: Star,
			color: "text-yellow-400"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SupplierLayout, {
		title: "Resumen General",
		subtitle: "Gestiona tu inventario y revisa tu rendimiento como proveedor.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-4 mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProviderAvatar, {
					src: stats?.avatarUrl,
					effect: stats?.avatarEffect,
					size: "sm",
					verified: stats?.isVerified,
					alt: `Avatar de ${stats?.displayName || "proveedor"}`
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-lg text-white uppercase tracking-tight",
					children: stats?.displayName || "Tu tienda"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-white/40 text-[11px] font-bold uppercase tracking-widest",
					children: stats?.isVerified ? "Proveedor verificado" : "Pendiente de verificación"
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12",
				children: statCards.map((stat, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-ink/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl hover:border-primary/30 transition-all group",
					onMouseEnter: playHover,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `p-2 rounded-lg bg-white/5 ${stat.color}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(stat.icon, { className: "w-5 h-5" })
							}), stat.label === "Calificación" && stats?.isVerified && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1 bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/20",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-3 h-3" }), " VERIFICADO"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-white/40 text-xs font-bold uppercase tracking-wider",
							children: stat.label
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: `font-display text-white mt-1 ${typeof stat.value === "string" && stat.value.length > 6 ? "text-lg" : "text-3xl"}`,
							children: stat.value
						})
					]
				}, i))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 lg:grid-cols-2 gap-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-ink/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xl font-display text-white mb-6 uppercase tracking-tight",
							children: "Acciones Rápidas"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/proveedor/inventario",
								search: { add: true },
								onClick: () => playClick(),
								className: "flex items-center justify-center gap-3 p-4 bg-primary text-white rounded-2xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-5 h-5" }), " Agregar Cuentas"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/proveedor/ventas",
								onClick: () => playClick(),
								className: "flex items-center justify-center gap-3 p-4 bg-white/5 text-white rounded-2xl font-bold text-sm hover:bg-white/10 transition-all border border-white/10",
								children: "Ver Mis Ventas"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-ink/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xl font-display text-white mb-6 uppercase tracking-tight",
							children: "Estado del Servicio"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: `w-12 h-12 rounded-full grid place-items-center border ${stats?.isVerified ? "bg-green-500/20 border-green-500/30" : "bg-yellow-500/20 border-yellow-500/30"}`,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: `w-6 h-6 ${stats?.isVerified ? "text-green-500" : "text-yellow-500"}` })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-white font-bold text-sm",
								children: !stats?.hasProfile ? "Perfil incompleto" : stats?.isVerified ? "Cuenta Verificada" : "Pendiente de verificación"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-white/40 text-xs",
								children: !stats?.hasProfile ? "Completa tu perfil para aparecer en la tienda." : stats?.isVerified ? "Tu perfil está visible en la tienda." : "Un administrador debe verificar tu cuenta."
							})] })]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-ink/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-xl font-display text-white mb-6 uppercase tracking-tight",
								children: "Modelo de Comisión"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-end justify-between gap-4 mb-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] font-black text-white/30 uppercase tracking-[0.2em]",
									children: "Tu porcentaje"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-4xl font-display text-primary",
									children: [Number(stats?.commissionRate ?? 70), "%"]
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-right",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] font-black text-white/30 uppercase tracking-[0.2em]",
										children: "Ventas brutas"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xl font-display text-white",
										children: ["S/ ", Number(stats?.grossRevenue ?? 0).toFixed(2)]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-2 w-full rounded-full bg-white/5 overflow-hidden mb-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full bg-primary",
									style: { width: `${Number(stats?.commissionRate ?? 70)}%` }
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-white/40 text-xs",
								children: [
									"Recibes S/ ",
									Number(stats?.earnings ?? 0).toFixed(2),
									" de tus ventas. El porcentaje lo define la administración."
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-ink/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
								className: "text-xl font-display text-white mb-6 uppercase tracking-tight",
								children: "Reseñas de Clientes"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 mb-5",
								children: [[
									1,
									2,
									3,
									4,
									5
								].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `w-5 h-5 ${n <= Math.round(Number(stats?.rating ?? 0)) ? "text-yellow-400 fill-yellow-400" : "text-white/15"}` }, n)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-white/40 text-xs ml-2",
									children: stats?.totalReviews ? `${Number(stats.rating).toFixed(1)} · ${stats.totalReviews} reseña${stats.totalReviews === 1 ? "" : "s"}` : "Aún sin reseñas"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-3 max-h-56 overflow-y-auto pr-1",
								children: reviews.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-white/20 text-xs italic",
									children: "Cuando tus clientes califiquen sus compras, aparecerán aquí."
								}) : reviews.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-4 bg-white/5 rounded-2xl border border-white/5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between mb-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex gap-0.5",
											children: [
												1,
												2,
												3,
												4,
												5
											].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `w-3 h-3 ${n <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-white/15"}` }, n))
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] text-white/30",
											children: new Date(r.created_at).toLocaleDateString()
										})]
									}), r.comment && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-white/60 text-xs",
										children: r.comment
									})]
								}, r.id))
							})
						]
					})
				]
			})
		]
	});
}
//#endregion
export { SupplierDashboard as component };
