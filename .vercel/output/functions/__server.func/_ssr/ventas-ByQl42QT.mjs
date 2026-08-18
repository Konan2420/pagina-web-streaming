import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { Et as Calendar, M as Package, ct as Database, st as DollarSign, w as Search } from "../_libs/lucide-react.mjs";
import { i as useQuery } from "../_libs/tanstack__react-query.mjs";
import { _ as useFuturisticSound } from "./router-CZAAJbb_.mjs";
import { i as getSupplierDashboardStats, l as getSupplierSales, t as SupplierLayout } from "./supplier.functions-Do9UnGB-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ventas-ByQl42QT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SupplierSales() {
	const { playHover } = useFuturisticSound();
	const [term, setTerm] = (0, import_react.useState)("");
	const [from, setFrom] = (0, import_react.useState)("");
	const [to, setTo] = (0, import_react.useState)("");
	const { data: allSales = [], isLoading } = useQuery({
		queryKey: ["supplier-sales"],
		queryFn: () => getSupplierSales()
	});
	const { data: stats } = useQuery({
		queryKey: ["supplier-stats"],
		queryFn: () => getSupplierDashboardStats()
	});
	const commissionRate = Number(stats?.commissionRate ?? 70);
	const sales = (0, import_react.useMemo)(() => {
		return allSales.filter((s) => {
			const name = s.products?.name?.toLowerCase() || "";
			if (term && !name.includes(term.toLowerCase()) && !(s.email || "").toLowerCase().includes(term.toLowerCase())) return false;
			const d = s.assigned_at || s.created_at;
			if (from && d && new Date(d) < new Date(from)) return false;
			if (to && d && new Date(d) > /* @__PURE__ */ new Date(`${to}T23:59:59`)) return false;
			return true;
		});
	}, [
		allSales,
		term,
		from,
		to
	]);
	const totalRevenue = sales.reduce((acc, sale) => acc + Number(sale.products?.price || 0), 0);
	const totalEarnings = totalRevenue * commissionRate / 100;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SupplierLayout, {
		title: "Mis Ventas",
		subtitle: "Historial de cuentas entregadas y ganancias acumuladas.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-ink/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] font-black text-white/40 uppercase tracking-widest mb-1",
							children: "Ventas Totales"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "w-5 h-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-3xl font-display text-white",
								children: sales.length
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-ink/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] font-black text-white/40 uppercase tracking-widest mb-1",
							children: "Ingresos Estimados"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DollarSign, { className: "w-5 h-5 text-green-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-3xl font-display text-white",
								children: ["S/ ", totalRevenue.toFixed(2)]
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-ink/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[10px] font-black text-white/40 uppercase tracking-widest mb-1",
							children: [
								"Mis Ganancias (",
								commissionRate,
								"%)"
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "w-5 h-5 text-blue-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-3xl font-display text-primary",
								children: ["S/ ", totalEarnings.toFixed(2)]
							})]
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col sm:flex-row gap-3 mb-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							value: term,
							onChange: (e) => setTerm(e.target.value),
							placeholder: "Buscar por producto o cuenta...",
							className: "w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "date",
						value: from,
						onChange: (e) => setFrom(e.target.value),
						className: "bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "date",
						value: to,
						onChange: (e) => setTo(e.target.value),
						className: "bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-ink/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "text-left text-[10px] text-white/40 border-b border-white/5 bg-white/[0.02] font-black uppercase tracking-widest",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-8 py-5",
									children: "Producto"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-8 py-5",
									children: "Credenciales"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-8 py-5",
									children: "Precio"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-8 py-5",
									children: "Tu Ganancia"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-8 py-5",
									children: "Fecha Entrega"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "divide-y divide-white/5",
							children: isLoading ? [
								1,
								2,
								3
							].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
								className: "animate-pulse",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									colSpan: 5,
									className: "h-16 px-8 py-4 bg-white/[0.01]"
								})
							}, i)) : sales.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 5,
								className: "px-8 py-20 text-center text-white/20 italic",
								children: "No tienes ventas registradas aún."
							}) }) : sales.map((sale) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "hover:bg-white/[0.02] transition-colors group",
								onMouseEnter: playHover,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-8 py-5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Database, { className: "w-4 h-4 text-primary" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-bold text-white",
												children: sale.products?.name
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-8 py-5 text-white/60 font-mono text-xs",
										children: sale.email
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "px-8 py-5 text-white font-bold",
										children: ["S/ ", Number(sale.products?.price || 0).toFixed(2)]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "px-8 py-5 text-green-400 font-bold",
										children: ["S/ ", (Number(sale.products?.price || 0) * commissionRate / 100).toFixed(2)]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-8 py-5 text-white/30 text-xs",
										children: sale.assigned_at || sale.created_at ? new Date(sale.assigned_at ?? sale.created_at ?? "").toLocaleDateString() : "—"
									})
								]
							}, sale.id))
						})]
					})
				})
			})
		]
	});
}
//#endregion
export { SupplierSales as component };
