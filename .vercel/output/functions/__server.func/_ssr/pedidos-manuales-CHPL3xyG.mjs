import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { D as Plus, Et as Calendar, M as Package, a as User, bt as CircleAlert, ht as CircleX, k as Phone, w as Search, yt as CircleCheck } from "../_libs/lucide-react.mjs";
import { u as useServerFn } from "./useIsAdmin-B5KXC5Eo.mjs";
import { o as useQueryClient, r as useSuspenseQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { E as updateManualOrder, d as AdminLayout, l as manualOrdersQueryOptions, u as usersQueryOptions$1, x as addManualOrder } from "./router-CZAAJbb_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pedidos-manuales-CHPL3xyG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ManualOrdersManagement() {
	const { data: orders } = useSuspenseQuery(manualOrdersQueryOptions);
	const { data: users } = useSuspenseQuery(usersQueryOptions$1);
	const queryClient = useQueryClient();
	const [searchTerm, setSearchTerm] = (0, import_react.useState)("");
	const [isModalOpen, setIsModalOpen] = (0, import_react.useState)(false);
	const addOrderFn = useServerFn(addManualOrder);
	const updateOrderFn = useServerFn(updateManualOrder);
	const [formData, setFormData] = (0, import_react.useState)({
		user_id: "",
		producto_nombre: "",
		monto: 0,
		fecha_adquisicion: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
		fecha_vencimiento: "",
		whatsapp_cliente: "",
		nombre_cliente: ""
	});
	const filteredOrders = orders.filter((o) => (o.producto_nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) || (o.nombre_cliente || "").toLowerCase().includes(searchTerm.toLowerCase()) || (o.profiles?.nombre_completo || "").toLowerCase().includes(searchTerm.toLowerCase()));
	async function handleSubmit(e) {
		e.preventDefault();
		try {
			await addOrderFn({ data: {
				...formData,
				user_id: formData.user_id || null,
				fecha_vencimiento: formData.fecha_vencimiento || null
			} });
			toast.success("Pedido registrado correctamente");
			setIsModalOpen(false);
			queryClient.invalidateQueries({ queryKey: ["admin-manual-orders"] });
			setFormData({
				user_id: "",
				producto_nombre: "",
				monto: 0,
				fecha_adquisicion: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
				fecha_vencimiento: "",
				whatsapp_cliente: "",
				nombre_cliente: ""
			});
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Error al registrar pedido");
		}
	}
	async function handleUpdateStatus(id, estado) {
		try {
			await updateOrderFn({ data: {
				id,
				estado
			} });
			toast.success("Estado actualizado");
			queryClient.invalidateQueries({ queryKey: ["admin-manual-orders"] });
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Error al actualizar estado");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminLayout, {
		title: "Pedidos WhatsApp",
		subtitle: "Registro y verificación manual de pedidos",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col sm:flex-row items-center justify-between gap-4 mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full sm:w-96",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						placeholder: "Buscar por cliente o producto...",
						value: searchTerm,
						onChange: (e) => setSearchTerm(e.target.value),
						className: "w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setIsModalOpen(true),
					className: "w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-4 h-4" }), "Nuevo Registro"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-4",
				children: filteredOrders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-20 text-center text-white/20 glass-card rounded-2xl border border-white/5",
					children: "No se encontraron pedidos registrados."
				}) : filteredOrders.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "glass-card rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all group",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col md:flex-row md:items-center gap-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3 md:w-64 shrink-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "w-5 h-5" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold text-white",
									children: order.profiles?.nombre_completo || order.nombre_cliente || "Cliente manual"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[10px] text-white/40 flex items-center gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "w-3 h-3" }), order.profiles?.whatsapp || order.whatsapp_cliente || "Sin WhatsApp"]
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex-1",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "w-4 h-4" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-medium text-white/90",
										children: order.producto_nombre
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs font-mono text-primary font-bold",
										children: ["S/ ", Number(order.monto).toFixed(2)]
									})] })]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "md:w-48",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[10px] text-white/30 flex items-center gap-1.5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "w-3 h-3 text-green-500/50" }),
											"Adquirido: ",
											new Date(order.fecha_adquisicion).toLocaleDateString()
										]
									}), order.fecha_vencimiento && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[10px] text-white/30 flex items-center gap-1.5",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "w-3 h-3 text-red-500/50" }),
											"Vence: ",
											new Date(order.fecha_vencimiento).toLocaleDateString()
										]
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between md:w-48 shrink-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${order.estado === "verificado" ? "bg-green-500/10 text-green-400 border border-green-500/20" : order.estado === "cancelado" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"}`,
									children: order.estado
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [order.estado !== "verificado" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => handleUpdateStatus(order.id, "verificado"),
										className: "p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors",
										title: "Verificar",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-4 h-4" })
									}), order.estado !== "cancelado" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => handleUpdateStatus(order.id, "cancelado"),
										className: "p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors",
										title: "Cancelar",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "w-4 h-4" })
									})]
								})]
							})
						]
					})
				}, order.id))
			}),
			isModalOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-ink border border-white/10 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-xl font-display text-white uppercase mb-6",
						children: "Registrar Venta WhatsApp"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSubmit,
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-bold text-white/40 uppercase mb-2",
								children: "Vincular a Usuario"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none",
								value: formData.user_id,
								onChange: (e) => setFormData({
									...formData,
									user_id: e.target.value
								}),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "",
									children: "-- Sin vincular (Cliente Invitado) --"
								}), users.map((user) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: user.id,
									children: user.nombre_completo || user.email
								}, user.id))]
							})] }),
							!formData.user_id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-xs font-bold text-white/40 uppercase mb-2",
									children: "Nombre Cliente"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none",
									value: formData.nombre_cliente,
									onChange: (e) => setFormData({
										...formData,
										nombre_cliente: e.target.value
									})
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-xs font-bold text-white/40 uppercase mb-2",
									children: "WhatsApp"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none",
									value: formData.whatsapp_cliente,
									onChange: (e) => setFormData({
										...formData,
										whatsapp_cliente: e.target.value
									})
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-bold text-white/40 uppercase mb-2",
								children: "Producto"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								required: true,
								placeholder: "Ej: Netflix 1 Mes Ultra HD",
								className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none",
								value: formData.producto_nombre,
								onChange: (e) => setFormData({
									...formData,
									producto_nombre: e.target.value
								})
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-bold text-white/40 uppercase mb-2",
								children: "Monto (S/)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								step: "0.01",
								required: true,
								className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none",
								value: formData.monto,
								onChange: (e) => setFormData({
									...formData,
									monto: Number(e.target.value)
								})
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-xs font-bold text-white/40 uppercase mb-2",
									children: "Fecha Adquisición"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "date",
									required: true,
									className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none",
									value: formData.fecha_adquisicion,
									onChange: (e) => setFormData({
										...formData,
										fecha_adquisicion: e.target.value
									})
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-xs font-bold text-white/40 uppercase mb-2",
									children: "Fecha Vencimiento"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "date",
									className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none",
									value: formData.fecha_vencimiento,
									onChange: (e) => setFormData({
										...formData,
										fecha_vencimiento: e.target.value
									})
								})] })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3 pt-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setIsModalOpen(false),
									className: "flex-1 px-4 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-wider",
									children: "Cancelar"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									className: "flex-1 px-4 py-3 rounded-xl bg-primary text-white hover:brightness-110 transition-all text-sm font-bold uppercase tracking-wider",
									children: "Guardar Registro"
								})]
							})
						]
					})]
				})
			})
		]
	});
}
//#endregion
export { ManualOrdersManagement as component };
