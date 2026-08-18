import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as supabase } from "./client-BVMXBJHu.mjs";
import { D as Plus, M as Package, bt as CircleAlert, w as Search } from "../_libs/lucide-react.mjs";
import { i as useQuery, o as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { A as cn, d as AdminLayout } from "./router-CZAAJbb_.mjs";
import { a as DialogDescription, c as DialogTitle, d as Textarea, i as DialogContent, l as DialogTrigger, n as Button, o as DialogFooter, r as Dialog, s as DialogHeader, t as Badge, u as Input } from "./badge-DkFvwYcE.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/stock-B734Pb8U.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function StockManagement() {
	const [searchTerm, setSearchTerm] = (0, import_react.useState)("");
	const [isAddOpen, setIsAddOpen] = (0, import_react.useState)(false);
	const [selectedProduct, setSelectedProduct] = (0, import_react.useState)("");
	const [bulkText, setBulkText] = (0, import_react.useState)("");
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const [isAdminActive, setIsAdminActive] = (0, import_react.useState)(true);
	const [isUpdatingStatus, setIsUpdatingStatus] = (0, import_react.useState)(false);
	const queryClient = useQueryClient();
	const { data: products = [] } = useQuery({
		queryKey: ["admin-products-stock"],
		queryFn: async () => {
			const { data, error } = await supabase.from("products").select("id, name, image_url, category").eq("is_active", true).order("name");
			if (error) throw error;
			return data;
		}
	});
	const { data: inventory = [], isLoading } = useQuery({
		queryKey: ["admin-stock-inventory"],
		queryFn: async () => {
			const { data, error } = await supabase.from("account_inventory").select("id, product_id, status, email, created_at, payment_verified");
			if (error) throw error;
			return data;
		}
	});
	const productStock = (0, import_react.useMemo)(() => {
		const counts = {};
		inventory.forEach((item) => {
			if (!counts[item.product_id]) counts[item.product_id] = {
				available: 0,
				assigned: 0
			};
			if (item.status === "available" || item.status === "disponible") counts[item.product_id].available++;
			else if (item.status === "assigned" || item.status === "vendida") counts[item.product_id].assigned++;
		});
		return products.map((p) => ({
			...p,
			available: counts[p.id]?.available || 0,
			assigned: counts[p.id]?.assigned || 0
		})).filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category?.toLowerCase().includes(searchTerm.toLowerCase()));
	}, [
		products,
		inventory,
		searchTerm
	]);
	const handleBulkAdd = async () => {
		if (!selectedProduct) {
			toast.error("Selecciona una plataforma");
			return;
		}
		if (!bulkText.trim()) {
			toast.error("Ingresa las credenciales");
			return;
		}
		setIsSubmitting(true);
		try {
			const inserts = bulkText.split("\n").filter((l) => l.trim().length > 0).map((line) => {
				let email = "";
				let password = "";
				if (line.includes(":")) {
					const parts = line.split(":");
					email = parts[0].trim();
					password = parts.slice(1).join(":").trim();
				} else if (line.includes(",")) {
					const parts = line.split(",");
					email = parts[0].trim();
					password = parts.slice(1).join(",").trim();
				} else {
					email = line.trim();
					password = "TEMPPASSWORD";
				}
				return {
					product_id: selectedProduct,
					email,
					password,
					status: "disponible"
				};
			});
			const { error } = await supabase.from("account_inventory").insert(inserts);
			if (error) throw error;
			toast.success(`${inserts.length} cuentas añadidas correctamente`);
			setIsAddOpen(false);
			setBulkText("");
			setSelectedProduct("");
			queryClient.invalidateQueries({ queryKey: ["admin-stock-inventory"] });
			queryClient.invalidateQueries({ queryKey: ["inventory-stock"] });
			queryClient.invalidateQueries({ queryKey: ["admin-account-inventory"] });
		} catch (error) {
			toast.error("Error al añadir stock: " + (error instanceof Error ? error.message : "Desconocido"));
		} finally {
			setIsSubmitting(false);
		}
	};
	(0, import_react.useEffect)(() => {
		const getStatus = async () => {
			const { data, error } = await supabase.from("admin_status").select("is_active").limit(1).maybeSingle();
			if (data) setIsAdminActive(data.is_active);
		};
		getStatus();
	}, []);
	const toggleAdminStatus = async () => {
		setIsUpdatingStatus(true);
		try {
			const { data: statusData } = await supabase.from("admin_status").select("id").limit(1).single();
			const statusId = statusData?.id;
			if (!statusId) throw new Error("No se encontró el registro de estado");
			const { error } = await supabase.from("admin_status").update({ is_active: !isAdminActive }).eq("id", statusId);
			if (error) throw error;
			setIsAdminActive(!isAdminActive);
			toast.success(!isAdminActive ? "Estado: Activo" : "Estado: Fuera de horario");
			queryClient.invalidateQueries({ queryKey: ["admin-availability-status"] });
		} catch (error) {
			toast.error("Error al actualizar estado: " + (error instanceof Error ? error.message : "Desconocido"));
		} finally {
			setIsUpdatingStatus(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminLayout, {
		title: "Stock de Cuentas",
		subtitle: "Gestión centralizada de inventario por plataforma",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-6 p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("w-3 h-3 rounded-full animate-pulse", isAdminActive ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm font-bold text-white uppercase tracking-wider",
						children: ["Disponibilidad: ", isAdminActive ? "Activo" : "Fuera de horario"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] text-white/40 uppercase",
						children: "Implementa una opción en el panel para programar horarios de disponibilidad (por fecha y hora) en lugar de solo alternar manualmente."
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					size: "sm",
					disabled: isUpdatingStatus,
					onClick: toggleAdminStatus,
					className: cn("border-white/10 font-bold text-[10px] uppercase tracking-widest px-6", isAdminActive ? "text-red-400 hover:text-red-300" : "text-green-400 hover:text-green-300"),
					children: isAdminActive ? "Poner fuera de horario" : "Activar disponibilidad"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full md:w-96",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Buscar plataforma...",
						value: searchTerm,
						onChange: (e) => setSearchTerm(e.target.value),
						className: "pl-10 bg-white/5 border-white/10 text-white"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
					open: isAddOpen,
					onOpenChange: setIsAddOpen,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "w-full md:w-auto bg-primary hover:bg-primary/90",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-4 h-4 mr-2" }), "Añadir cuentas"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
						className: "bg-ink border-white/10 text-white max-w-4xl w-[95vw] h-[90vh] md:h-auto max-h-[90vh] flex flex-col p-0 overflow-hidden",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, {
								className: "p-6 pb-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Añadir Stock a Plataforma" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
									className: "text-white/40",
									children: "Selecciona una plataforma y carga las credenciales en lote."
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 overflow-y-auto p-6 space-y-6",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-sm font-medium text-white/60",
										children: "1. Selecciona la plataforma"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2",
										children: products.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											onClick: () => setSelectedProduct(p.id),
											className: cn("flex flex-col items-center p-2 rounded-xl border transition-all gap-1.5", selectedProduct === p.id ? "bg-primary/20 border-primary shadow-lg shadow-primary/20" : "bg-white/5 border-white/5 hover:border-white/20"),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-10 h-10 rounded-lg overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center",
												children: p.image_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: p.image_url,
													alt: p.name,
													className: "w-full h-full object-cover"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "w-5 h-5 text-white/20" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[9px] sm:text-[10px] font-bold uppercase truncate w-full text-center px-0.5",
												children: p.name
											})]
										}, p.id))
									})]
								}), selectedProduct && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-3 animate-in fade-in slide-in-from-top-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "text-sm font-medium text-white/60",
											children: "2. Carga credenciales (email:password)"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
											placeholder: "correo@ejemplo.com:clave123\notro@ejemplo.com:clave456",
											className: "bg-white/5 border-white/10 h-48 font-mono text-sm",
											value: bulkText,
											onChange: (e) => setBulkText(e.target.value)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2 text-xs text-white/40 bg-white/5 p-3 rounded-lg border border-white/5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "w-4 h-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Soporta formatos \"email:password\" o \"email,password\". Una cuenta por línea." })]
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
								className: "p-6 pt-0 mt-auto",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									onClick: () => setIsAddOpen(false),
									className: "border-white/10 text-white hover:bg-white/5",
									children: "Cancelar"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									onClick: handleBulkAdd,
									disabled: isSubmitting || !selectedProduct || !bulkText.trim(),
									className: "bg-primary hover:bg-primary/90",
									children: isSubmitting ? "Guardando..." : "Confirmar Carga"
								})]
							})
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-ink/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
							className: "bg-white/5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "text-left text-xs text-white/40 border-b border-white/5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-6 py-4 font-medium uppercase tracking-wider",
										children: "Plataforma"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-6 py-4 font-medium uppercase tracking-wider",
										children: "Categoría"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-6 py-4 font-medium uppercase tracking-wider text-center",
										children: "Stock Disponible"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-6 py-4 font-medium uppercase tracking-wider text-center",
										children: "Entregadas"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-6 py-4 font-medium uppercase tracking-wider text-right",
										children: "Acciones"
									})
								]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "divide-y divide-white/5",
							children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 5,
								className: "px-6 py-12 text-center text-white/40 italic",
								children: "Cargando datos de stock..."
							}) }) : productStock.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 5,
								className: "px-6 py-12 text-center text-white/40 italic",
								children: "No hay productos que coincidan con la búsqueda."
							}) }) : productStock.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "hover:bg-white/5 transition-colors group",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-4 whitespace-nowrap",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-10 h-10 rounded-lg bg-black/40 border border-white/10 overflow-hidden flex items-center justify-center shrink-0",
												children: product.image_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: product.image_url,
													alt: product.name,
													className: "w-full h-full object-cover"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "w-5 h-5 text-white/20" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-white uppercase tracking-tight",
												children: product.name
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-4 whitespace-nowrap text-white/40 uppercase text-[10px] font-bold tracking-widest",
										children: product.category || "GENERAL"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-4 whitespace-nowrap text-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
											variant: "outline",
											className: cn("px-3 py-1 font-bold", product.available > 0 ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"),
											children: [product.available, " DISPONIBLES"]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-4 whitespace-nowrap text-center font-mono text-white/40",
										children: product.assigned
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-4 whitespace-nowrap text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "ghost",
											size: "sm",
											onClick: () => {
												setSelectedProduct(product.id);
												setIsAddOpen(true);
											},
											className: "text-primary hover:text-primary hover:bg-primary/10 font-bold text-xs uppercase",
											children: "Cargar más"
										})
									})
								]
							}, product.id))
						})]
					})
				})
			})
		]
	});
}
//#endregion
export { StockManagement as component };
