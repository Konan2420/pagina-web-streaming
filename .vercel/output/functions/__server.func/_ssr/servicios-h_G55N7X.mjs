import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { D as Plus, S as Settings2, et as Globe, j as Pen, l as Trash2, s as Tv, u as Tag } from "../_libs/lucide-react.mjs";
import { u as useServerFn } from "./useIsAdmin-B5KXC5Eo.mjs";
import { o as useQueryClient, r as useSuspenseQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { D as updateServicio, S as addServicio, d as AdminLayout, o as Route$8, s as serviciosQueryOptions, w as deleteServicio } from "./router-CZAAJbb_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/servicios-h_G55N7X.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ServicesManagement() {
	const { data: servicios } = useSuspenseQuery(serviciosQueryOptions);
	const { isAdmin } = Route$8.useRouteContext();
	const [isModalOpen, setIsModalOpen] = (0, import_react.useState)(false);
	const [editingService, setEditingService] = (0, import_react.useState)(null);
	const queryClient = useQueryClient();
	const addServicioMutation = useServerFn(addServicio);
	const updateServicioMutation = useServerFn(updateServicio);
	const deleteServicioMutation = useServerFn(deleteServicio);
	const openCreateModal = () => {
		setEditingService(null);
		setIsModalOpen(true);
	};
	const openEditModal = (service) => {
		setEditingService(service);
		setIsModalOpen(true);
	};
	const closeModal = () => {
		setIsModalOpen(false);
		setEditingService(null);
	};
	const handleDelete = async (id, name) => {
		if (!confirm(`¿Estás seguro de eliminar el servicio "${name}"? Se eliminará también el stock asociado.`)) return;
		try {
			await deleteServicioMutation({ data: { id } });
			toast.success("Servicio eliminado");
			queryClient.invalidateQueries({ queryKey: ["admin-servicios-full"] });
			queryClient.invalidateQueries({ queryKey: ["admin-servicios-list"] });
		} catch (err) {
			toast.error("Error al eliminar: " + (err instanceof Error ? err.message : "Error desconocido"));
		}
	};
	const handleSaveServicio = async (e) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const data = {
			nombre: formData.get("nombre"),
			slug: formData.get("nombre").toLowerCase().replace(/\s+/g, "-"),
			categoria: formData.get("categoria"),
			icono: formData.get("icono") || void 0
		};
		try {
			if (editingService) {
				await updateServicioMutation({ data: {
					...data,
					id: editingService.id
				} });
				toast.success("Servicio actualizado correctamente");
			} else {
				await addServicioMutation({ data });
				toast.success("Servicio creado correctamente");
			}
			closeModal();
			queryClient.invalidateQueries({ queryKey: ["admin-servicios-full"] });
			queryClient.invalidateQueries({ queryKey: ["admin-servicios-list"] });
		} catch (err) {
			toast.error("Error al guardar el servicio: " + (err instanceof Error ? err.message : "Error desconocido"));
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminLayout, {
		title: "Servicios",
		subtitle: "Gestión de plataformas y categorías",
		children: [
			isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-end mb-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: openCreateModal,
					className: "flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-4 h-4" }), "Nuevo Servicio"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
				children: servicios.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "col-span-full py-12 text-center text-white/30 italic glass-card rounded-2xl border border-white/5",
					children: "Aún no has creado ningún servicio."
				}) : servicios.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "glass-card rounded-2xl border border-white/5 p-6 hover:border-white/10 transition-all group",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 grid place-items-center text-primary group-hover:scale-110 transition-transform",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tv, { className: "w-6 h-6" })
							}), isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => openEditModal(s),
									className: "p-2 text-white/20 hover:text-white transition-colors",
									"aria-label": `Editar ${s.nombre}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pen, { className: "w-4 h-4" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => handleDelete(s.id, s.nombre),
									className: "p-2 text-white/20 hover:text-red-500 transition-colors",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-4 h-4" })
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xl font-display text-white uppercase tracking-tight mb-1",
							children: s.nombre
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-white/40 mb-4 flex items-center gap-1.5 font-mono",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Globe, { className: "w-3 h-3" }),
								"/",
								s.slug
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center gap-2 mb-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-wider text-white/60 flex items-center gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, { className: "w-3 h-3 text-primary" }), s.categoria]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "pt-4 border-t border-white/5 flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-white/30 italic",
								children: ["Creado el ", new Date(s.created_at).toLocaleDateString()]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/admin/stock",
								className: "text-xs font-semibold text-primary hover:underline flex items-center gap-1",
								children: ["Ver stock ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, { className: "w-3 h-3" })]
							})]
						})
					]
				}, s.id))
			}),
			isModalOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-[100] flex items-center justify-center p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 bg-black/80 backdrop-blur-sm",
					onClick: closeModal
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full max-w-md bg-ink border border-white/10 rounded-2xl p-8 shadow-2xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-2xl font-display text-white uppercase tracking-tight mb-6",
						children: editingService ? "Editar Servicio" : "Nuevo Servicio"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleSaveServicio,
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-bold text-white/40 uppercase mb-2",
								children: "Nombre de la Plataforma"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								name: "nombre",
								type: "text",
								required: true,
								defaultValue: editingService?.nombre ?? "",
								className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all",
								placeholder: "Ej: Netflix, HBO Max, etc."
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-bold text-white/40 uppercase mb-2",
								children: "Categoría"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								name: "categoria",
								required: true,
								defaultValue: editingService?.categoria ?? "streaming",
								className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "streaming",
										className: "bg-ink",
										children: "Streaming"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "musica",
										className: "bg-ink",
										children: "Música"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "ia",
										className: "bg-ink",
										children: "IA & Herramientas"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "juegos",
										className: "bg-ink",
										children: "Juegos"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "redes",
										className: "bg-ink",
										children: "Redes Sociales"
									})
								]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-bold text-white/40 uppercase mb-2",
								children: "Icono Lucide (opcional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								name: "icono",
								type: "text",
								defaultValue: editingService?.icono ?? "",
								className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono",
								placeholder: "tv, play, zap, etc."
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-3 pt-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: closeModal,
									className: "flex-1 px-4 py-3 rounded-xl border border-white/10 text-white font-semibold text-sm hover:bg-white/5 transition-all",
									children: "Cancelar"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "submit",
									className: "flex-1 bg-primary text-white px-4 py-3 rounded-xl font-semibold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20",
									children: editingService ? "Guardar cambios" : "Crear Servicio"
								})]
							})
						]
					}, editingService?.id ?? "new")]
				})]
			})
		]
	});
}
//#endregion
export { ServicesManagement as component };
