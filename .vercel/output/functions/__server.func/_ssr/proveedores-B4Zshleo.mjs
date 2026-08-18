import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as supabase } from "./client-BVMXBJHu.mjs";
import { D as Plus, M as Package, c as TrendingUp, i as Users, kt as BadgeCheck, p as Star, r as X, w as Search } from "../_libs/lucide-react.mjs";
import { r as effectLabel } from "./avatar-effects-XfJ0Ki_h.mjs";
import { i as useQuery, o as useQueryClient, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { T as setSupplierCommission, _ as useFuturisticSound, d as AdminLayout, v as ProviderAvatar } from "./router-CZAAJbb_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/proveedores-B4Zshleo.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function SuppliersManagement() {
	const { playHover, playClick } = useFuturisticSound();
	const [searchTerm, setSearchTerm] = (0, import_react.useState)("");
	const [showAdd, setShowAdd] = (0, import_react.useState)(false);
	const [newSupplierEmail, setNewSupplierEmail] = (0, import_react.useState)("");
	const [isSubmitting, setIsSubmitting] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(null);
	const queryClient = useQueryClient();
	const { data: suppliers = [], isLoading, error: queryError } = useQuery({
		queryKey: ["admin-suppliers"],
		queryFn: async () => {
			console.log("Fetching suppliers...");
			const { data, error } = await supabase.from("supplier_profiles").select(`
          *,
          profiles(
            nombre_completo,
            whatsapp
          )
        `);
			if (error) {
				console.error("Error fetching suppliers:", error);
				throw error;
			}
			console.log("Suppliers data received:", data);
			return data ?? [];
		}
	});
	const handleVerify = async (id, currentStatus) => {
		try {
			const { error } = await supabase.from("supplier_profiles").update({ is_verified: !currentStatus }).eq("id", id);
			if (error) throw error;
			toast.success(currentStatus ? "Verificación removida" : "Proveedor verificado con éxito");
			queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
		} catch (err) {
			toast.error("Error al actualizar verificación");
		}
	};
	const commissionMutation = useMutation({
		mutationFn: (vars) => setSupplierCommission({ data: vars }),
		onSuccess: () => {
			toast.success("Comisión actualizada");
			setEditing(null);
			queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
		},
		onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo actualizar la comisión")
	});
	const filtered = suppliers.filter((s) => {
		const profile = s.profiles;
		const displayName = s.display_name?.toLowerCase() || "";
		const fullName = profile?.nombre_completo?.toLowerCase() || "";
		const search = searchTerm.toLowerCase();
		return displayName.includes(search) || fullName.includes(search);
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminLayout, {
		title: "Gestión de Proveedores",
		subtitle: "Autoriza, verifica y monitorea a los proveedores externos.",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col sm:flex-row items-center justify-between gap-4 mb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full sm:w-96",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						placeholder: "Buscar por nombre o marca...",
						value: searchTerm,
						onChange: (e) => setSearchTerm(e.target.value),
						className: "w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2 w-full sm:w-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							playClick();
							setShowAdd(true);
						},
						className: "flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold text-sm hover:brightness-110 transition shadow-lg shadow-primary/20",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-5 h-5" }), " Invitar Proveedor"]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
				children: isLoading ? [1, 2].map((i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-48 bg-white/5 rounded-3xl animate-pulse" }, i)) : queryError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "lg:col-span-2 py-20 text-center border border-red-500/20 rounded-3xl bg-red-500/5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-red-400 font-bold mb-2",
						children: "Error al cargar proveedores"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-white/40 text-sm",
						children: queryError instanceof Error ? queryError.message : "Error desconocido"
					})]
				}) : filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "lg:col-span-2 py-20 text-center border border-white/5 rounded-3xl bg-white/[0.01]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "w-12 h-12 text-white/10 mx-auto mb-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-white/30 italic",
						children: [
							"No se encontraron proveedores (",
							suppliers.length,
							" en total)."
						]
					})]
				}) : filtered.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-ink/40 backdrop-blur-xl border border-white/5 p-8 rounded-[2.5rem] group hover:border-primary/20 transition-all relative overflow-hidden",
					onMouseEnter: playHover,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute -right-4 -top-4 w-32 h-32 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between mb-6 relative z-10",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProviderAvatar, {
									src: s.avatar_url,
									effect: s.avatar_effect,
									size: "sm",
									verified: s.is_verified,
									alt: s.display_name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h3", {
										className: "text-xl font-display text-white uppercase tracking-tight flex items-center gap-2",
										children: [s.display_name, s.is_verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "w-5 h-5 text-green-500" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-white/40 text-xs font-bold uppercase tracking-widest mt-0.5",
										children: s.profiles?.nombre_completo || "Perfil sin nombre"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-white/30 text-[10px] font-bold uppercase tracking-widest mt-1",
										children: ["Efecto: ", effectLabel(s.avatar_effect)]
									})
								] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col items-end gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold px-2 py-1 rounded-full border border-yellow-500/20",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "w-3 h-3 fill-yellow-500" }),
										" ",
										s.total_reviews ? `${Number(s.rating).toFixed(1)} (${s.total_reviews})` : "Sin reseñas"
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => handleVerify(s.id, !!s.is_verified),
									className: `text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border transition-all ${s.is_verified ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-white/5 text-white/40 border-white/10 hover:border-white/30"}`,
									children: s.is_verified ? "VERIFICADO" : "VERIFICAR"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-4 relative z-10",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-white/5 p-4 rounded-2xl border border-white/5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1",
									children: "Ventas"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "w-3.5 h-3.5 text-green-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xl font-display text-white",
										children: s.total_sales || 0
									})]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "bg-white/5 p-4 rounded-2xl border border-white/5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-1",
									children: "Comisión"
								}), editing?.user_id === s.user_id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "number",
											min: 0,
											max: 100,
											value: editing.value,
											onChange: (e) => setEditing({
												user_id: s.user_id,
												value: e.target.value
											}),
											className: "w-16 bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => commissionMutation.mutate({
												user_id: s.user_id,
												commission_rate: Number(editing.value)
											}),
											className: "text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-primary text-white",
											children: "Guardar"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => setEditing(null),
											className: "text-[9px] font-black uppercase px-2 py-1 rounded-lg bg-white/10 text-white/60",
											children: "X"
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => {
										playClick();
										setEditing({
											user_id: s.user_id,
											value: String(s.commission_rate ?? 70)
										});
									},
									className: "flex items-center gap-2 hover:text-primary transition-colors",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "w-3.5 h-3.5 text-blue-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xl font-display text-white",
										children: [Number(s.commission_rate ?? 70), "%"]
									})]
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-6 pt-6 border-t border-white/5 flex items-center justify-between relative z-10",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center gap-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[10px] text-white/30 font-medium",
									children: [
										"WhatsApp:",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-white/60",
											children: s.profiles?.whatsapp || "No registrado"
										})
									]
								})
							})
						})
					]
				}, s.id))
			}),
			showAdd && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-[100] flex items-center justify-center p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute inset-0 bg-black/80 backdrop-blur-sm",
					onClick: () => setShowAdd(false)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full max-w-lg bg-ink border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-8 border-b border-white/5 flex justify-between items-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-2xl font-display text-white uppercase tracking-tight",
							children: "Autorizar Proveedor"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-white/40 text-sm mt-1",
							children: "Selecciona un usuario para otorgarle el rol."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setShowAdd(false),
							className: "w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-5 h-5" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-8",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-white/60 mb-8",
								children: "Para activar un nuevo proveedor, primero debes asignarle el rol en la sección de gestión de usuarios."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/admin/usuarios",
								className: "block w-full py-4 bg-primary text-white rounded-2xl font-bold text-center text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20 mb-4",
								onClick: () => setShowAdd(false),
								children: "Ir a Usuarios para Asignar Rol"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setShowAdd(false),
								className: "w-full py-4 bg-white/5 text-white rounded-2xl font-bold text-sm hover:bg-white/10 transition-all border border-white/10",
								children: "Cancelar"
							})
						]
					})]
				})]
			})
		]
	});
}
//#endregion
export { SuppliersManagement as component };
