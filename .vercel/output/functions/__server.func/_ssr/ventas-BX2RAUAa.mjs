import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { At as ArrowRight, M as Package, a as User, h as ShoppingCart, lt as CreditCard, pt as Clock, w as Search } from "../_libs/lucide-react.mjs";
import { r as useSuspenseQuery } from "../_libs/tanstack__react-query.mjs";
import { d as AdminLayout, r as ventasQueryOptions } from "./router-CZAAJbb_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ventas-BX2RAUAa.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function VentasManagement() {
	const { data: ventas } = useSuspenseQuery(ventasQueryOptions);
	const [searchTerm, setSearchTerm] = (0, import_react.useState)("");
	const [selectedVenta, setSelectedVenta] = (0, import_react.useState)(null);
	const filteredVentas = ventas.filter((v) => (v.producto_nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) || (v.profiles?.nombre_completo || "").toLowerCase().includes(searchTerm.toLowerCase()));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminLayout, {
		title: "Ventas",
		subtitle: "Historial de transacciones automáticas",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col sm:flex-row items-center justify-between gap-4 mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full sm:w-96",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						placeholder: "Buscar por usuario o producto...",
						value: searchTerm,
						onChange: (e) => setSearchTerm(e.target.value),
						className: "w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3 text-xs text-white/40 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "w-4 h-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"Total: ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-white font-bold",
							children: ventas.length
						}),
						" ventas"
					] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-4",
				children: filteredVentas.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-20 text-center text-white/20 glass-card rounded-2xl border border-white/5",
					children: "No se encontraron ventas que coincidan con la búsqueda."
				}) : filteredVentas.map((venta) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "glass-card rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all group relative overflow-hidden",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute top-0 right-0 p-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${venta.estado_pago === "completado" ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"}`,
							children: venta.estado_pago
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col md:flex-row md:items-center gap-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3 md:w-64 shrink-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "w-5 h-5" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold text-white",
									children: venta.profiles?.nombre_completo || "Usuario Desconocido"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] text-white/40 font-mono",
									children: venta.profiles?.whatsapp || "Sin contacto"
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 flex items-center gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "w-5 h-5" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium text-white/80",
									children: venta.producto_nombre
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 mt-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs font-mono text-primary font-bold",
										children: ["S/ ", Number(venta.monto ?? 0).toFixed(2)]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[10px] text-white/20 flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "w-3 h-3" }), venta.metodo_pago || "Directo"]
									})]
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between md:flex-col md:items-end gap-2 md:w-40 shrink-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-white/30 flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "w-3 h-3" }), new Date(venta.created_at).toLocaleString()]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => setSelectedVenta(venta),
									className: "flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline",
									children: ["Detalles ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "w-3 h-3" })]
								})]
							})
						]
					})]
				}, venta.id))
			}),
			selectedVenta && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					"aria-label": "Cerrar detalles de venta",
					onClick: () => setSelectedVenta(null),
					className: "absolute inset-0 bg-black/80 backdrop-blur-sm"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					role: "dialog",
					"aria-modal": "true",
					"aria-labelledby": "venta-details-title",
					className: "relative w-full max-w-lg rounded-2xl border border-white/10 bg-ink p-6 shadow-2xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] font-bold uppercase tracking-widest text-primary",
							children: "Venta"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "venta-details-title",
							className: "mt-1 text-xl font-display text-white uppercase",
							children: "Detalles de la transacción"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setSelectedVenta(null),
							className: "text-sm font-semibold text-white/60 hover:text-white",
							children: "Cerrar"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
						className: "mt-6 space-y-4 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-white/40",
								children: "Producto"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "mt-1 font-medium text-white",
								children: selectedVenta.producto_nombre
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-white/40",
								children: "Cliente"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "mt-1 text-white",
								children: selectedVenta.profiles?.nombre_completo || "Usuario desconocido"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-white/40",
								children: "Contacto"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "mt-1 text-white",
								children: selectedVenta.profiles?.whatsapp || "Sin contacto"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-white/40",
								children: "Monto y método"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
								className: "mt-1 text-white",
								children: [
									"S/ ",
									Number(selectedVenta.monto ?? 0).toFixed(2),
									" ·",
									" ",
									selectedVenta.metodo_pago || "Directo"
								]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-white/40",
								children: "Estado"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "mt-1 text-white",
								children: selectedVenta.estado_pago || "Pendiente"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
								className: "text-white/40",
								children: "Fecha"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
								className: "mt-1 text-white",
								children: new Date(selectedVenta.created_at).toLocaleString()
							})] })
						]
					})]
				})]
			})
		]
	});
}
//#endregion
export { VentasManagement as component };
