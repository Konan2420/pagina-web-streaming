import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { D as Plus, ct as Database, l as Trash2, pt as Clock, r as X, w as Search, yt as CircleCheck } from "../_libs/lucide-react.mjs";
import { u as useServerFn } from "./useIsAdmin-B5KXC5Eo.mjs";
import { i as useQuery, o as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { _ as useFuturisticSound, n as Route$3 } from "./router-CZAAJbb_.mjs";
import { a as getSupplierInventory, n as addSupplierInventoryBulk, o as getSupplierProducts, r as deleteSupplierInventoryItem, t as SupplierLayout } from "./supplier.functions-Do9UnGB-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/inventario-CPTe9KaG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SupplierInventory() {
	const { playHover, playClick } = useFuturisticSound();
	const { add } = Route$3.useSearch();
	const [showAdd, setShowAdd] = (0, import_react.useState)(Boolean(add));
	const [searchTerm, setSearchTerm] = (0, import_react.useState)("");
	const [bulkText, setBulkText] = (0, import_react.useState)("");
	const [selectedProductId, setSelectedProductId] = (0, import_react.useState)("");
	const [deletingId, setDeletingId] = (0, import_react.useState)(null);
	const [isUploading, setIsUploading] = (0, import_react.useState)(false);
	const queryClient = useQueryClient();
	const addBulkFn = useServerFn(addSupplierInventoryBulk);
	const deleteFn = useServerFn(deleteSupplierInventoryItem);
	const { data: myProducts = [] } = useQuery({
		queryKey: ["supplier-products"],
		queryFn: () => getSupplierProducts()
	});
	const { data: inventory = [], isLoading } = useQuery({
		queryKey: ["supplier-inventory"],
		queryFn: () => getSupplierInventory()
	});
	const handleDelete = async (id) => {
		if (!window.confirm("¿Eliminar esta cuenta del inventario?")) return;
		setDeletingId(id);
		try {
			await deleteFn({ data: { id } });
			toast.success("Cuenta eliminada");
			queryClient.invalidateQueries({ queryKey: ["supplier-inventory"] });
			queryClient.invalidateQueries({ queryKey: ["supplier-stats"] });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "No se pudo eliminar la cuenta.");
		} finally {
			setDeletingId(null);
		}
	};
	const handleBulkAdd = async (e) => {
		e.preventDefault();
		if (isUploading) return;
		if (!selectedProductId || !bulkText.trim()) {
			toast.error("Selecciona un producto e ingresa las credenciales.");
			return;
		}
		const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
		if (lines.length === 0) return;
		if (lines.length > 100) {
			toast.error("Puedes cargar como máximo 100 cuentas por operación.");
			return;
		}
		const invalidLines = [];
		const accounts = lines.flatMap((line, index) => {
			const separator = line.indexOf(":");
			if (separator <= 0) {
				invalidLines.push(index + 1);
				return [];
			}
			const email = line.slice(0, separator).trim();
			const password = line.slice(separator + 1).trim();
			if (!email || !password || !/^\S+@\S+\.\S+$/.test(email)) {
				invalidLines.push(index + 1);
				return [];
			}
			return [{
				email,
				password
			}];
		});
		if (invalidLines.length > 0) {
			toast.error(`Revisa el formato de las líneas: ${invalidLines.join(", ")}. Usa email:contraseña.`);
			return;
		}
		const toastId = "supplier-inventory-upload";
		setIsUploading(true);
		toast.loading(`Procesando ${accounts.length} cuentas...`, { id: toastId });
		try {
			await addBulkFn({ data: {
				product_id: selectedProductId,
				accounts
			} });
			toast.success(`${accounts.length} cuentas agregadas con éxito`, { id: toastId });
			setBulkText("");
			setShowAdd(false);
			queryClient.invalidateQueries({ queryKey: ["supplier-inventory"] });
			queryClient.invalidateQueries({ queryKey: ["supplier-stats"] });
		} catch (err) {
			const message = err instanceof Error ? err.message : "Error al subir inventario.";
			toast.error(message, { id: toastId });
		} finally {
			setIsUploading(false);
		}
	};
	const filtered = inventory.filter((item) => item.email?.toLowerCase().includes(searchTerm.toLowerCase()) || item.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SupplierLayout, {
		title: "Mi Inventario",
		subtitle: "Carga y gestiona las cuentas que vendes.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col sm:flex-row items-center justify-between gap-4 mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full sm:w-96",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						placeholder: "Buscar por email o producto...",
						value: searchTerm,
						onChange: (e) => setSearchTerm(e.target.value),
						className: "w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => {
						playClick();
						setShowAdd(true);
					},
					className: "w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:brightness-110 transition shadow-lg shadow-primary/20",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-5 h-5" }), " Nueva Carga Masiva"]
				})]
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
									children: "Email / Usuario"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-8 py-5",
									children: "Estado"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-8 py-5",
									children: "Fecha Carga"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-8 py-5 text-right opacity-0",
									children: "Acciones"
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
									className: "px-8 py-4 h-16 bg-white/[0.01]"
								})
							}, i)) : filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 5,
								className: "px-8 py-20 text-center text-white/20 italic",
								children: "No tienes inventario cargado."
							}) }) : filtered.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "hover:bg-white/[0.02] transition-colors group",
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
												children: item.products?.name || "Desconocido"
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-8 py-5 text-white/60 font-mono text-xs",
										children: item.email
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-8 py-5",
										children: item.status === "available" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1.5 text-green-400 font-bold text-[10px] uppercase tracking-wider",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-3 h-3" }), " Disponible"]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "flex items-center gap-1.5 text-white/30 font-bold text-[10px] uppercase tracking-wider",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "w-3 h-3" }), " Vendida"]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-8 py-5 text-white/30 text-xs",
										children: item.created_at ? new Date(item.created_at).toLocaleDateString() : "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-8 py-5 text-right",
										children: item.status === "available" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: deletingId === item.id,
											onClick: () => handleDelete(item.id),
											onMouseEnter: playHover,
											className: "p-2 text-white/20 hover:text-red-400 transition-colors disabled:opacity-40",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-4 h-4" })
										})
									})
								]
							}, item.id))
						})]
					})
				})
			}),
			showAdd && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto py-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "fixed inset-0 bg-black/80 backdrop-blur-sm",
					onClick: () => setShowAdd(false)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full max-w-lg bg-ink border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl my-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-8 border-b border-white/5 flex justify-between items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-2xl font-display text-white uppercase tracking-tight",
							children: "Carga Masiva"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-white/40 text-sm mt-1",
							children: "Sube múltiples cuentas a la vez."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setShowAdd(false),
							className: "w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-5 h-5" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleBulkAdd,
						className: "p-8 space-y-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-[10px] font-black text-white/40 uppercase tracking-widest ml-1",
										children: "Producto Asociado"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: selectedProductId,
										onChange: (e) => setSelectedProductId(e.target.value),
										className: "w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "Selecciona un producto..."
										}), myProducts.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: product.id,
											children: product.name
										}, product.id))]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] text-white/30 mt-1 italic leading-relaxed",
										children: "* Selecciona el producto al que pertenecen estas cuentas."
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-[10px] font-black text-white/40 uppercase tracking-widest ml-1",
									children: "Credenciales (email:password)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									rows: 8,
									placeholder: "usuario1@mail.com:pass123\nusuario2@mail.com:pass456",
									value: bulkText,
									onChange: (e) => setBulkText(e.target.value),
									className: "w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all placeholder:text-white/10"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setShowAdd(false),
									className: "flex-1 py-4 bg-white/5 text-white rounded-2xl font-bold text-sm hover:bg-white/10 transition-all border border-white/10",
									children: "Cancelar"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									disabled: isUploading,
									className: "flex-[2] py-4 bg-primary text-white rounded-2xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20",
									children: isUploading ? "Subiendo inventario..." : "Subir Inventario"
								})]
							})
						]
					})]
				})]
			})
		]
	});
}
//#endregion
export { SupplierInventory as component };
