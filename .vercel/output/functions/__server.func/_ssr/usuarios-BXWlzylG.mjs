import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { _ as Shield, a as User, v as ShieldCheck, w as Search, y as ShieldAlert } from "../_libs/lucide-react.mjs";
import { u as useServerFn } from "./useIsAdmin-B5KXC5Eo.mjs";
import { o as useQueryClient, r as useSuspenseQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { O as updateUserRole, a as usersQueryOptions, d as AdminLayout, i as Route$6 } from "./router-CZAAJbb_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/usuarios-BXWlzylG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function UsersManagement() {
	const { data: users } = useSuspenseQuery(usersQueryOptions);
	const { isAdmin } = Route$6.useRouteContext();
	const [searchTerm, setSearchTerm] = (0, import_react.useState)("");
	const [updatingId, setUpdatingId] = (0, import_react.useState)(null);
	const queryClient = useQueryClient();
	const updateRoleMutation = useServerFn(updateUserRole);
	const navigate = Route$6.useNavigate();
	const filteredUsers = users.filter((u) => u.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) || u.whatsapp?.includes(searchTerm));
	const handleUpdateRole = async (userId, role) => {
		setUpdatingId(userId);
		try {
			await updateRoleMutation({ data: {
				user_id: userId,
				role
			} });
			toast.success("Rol actualizado correctamente");
			queryClient.invalidateQueries({ queryKey: ["admin-users-roles"] });
			if (role === "proveedor") {
				toast("Redirigiendo a proveedores...", { description: "El usuario ahora es un proveedor y su perfil ha sido creado." });
				setTimeout(() => {
					navigate({ to: "/admin/proveedores" });
				}, 1500);
			}
		} catch (err) {
			toast.error("Error al actualizar rol: " + (err instanceof Error ? err.message : "Error desconocido"));
		} finally {
			setUpdatingId(null);
		}
	};
	const getRoleBadge = (role) => {
		switch (role) {
			case "admin": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldAlert, { className: "w-3 h-3" }), " Admin"]
			});
			case "editor": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "w-3 h-3" }), " Editor"]
			});
			case "proveedor": return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-3 h-3" }), " Proveedor"]
			});
			default: return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/40 border border-white/10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "w-3 h-3" }), " Usuario"]
			});
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminLayout, {
		title: "Usuarios",
		subtitle: "Gestión de permisos y roles de acceso",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center justify-between gap-4 mb-6",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative w-full sm:w-96",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "text",
					placeholder: "Buscar por nombre o whatsapp...",
					value: searchTerm,
					onChange: (e) => setSearchTerm(e.target.value),
					className: "w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
				})]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "glass-card rounded-2xl border border-white/5 overflow-hidden",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "text-left text-xs text-white/40 border-b border-white/5 bg-white/[0.02]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4 font-medium uppercase tracking-wider",
								children: "Usuario"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4 font-medium uppercase tracking-wider",
								children: "WhatsApp"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4 font-medium uppercase tracking-wider",
								children: "Rol Actual"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "px-6 py-4 font-medium uppercase tracking-wider text-right",
								children: isAdmin ? "Cambiar Rol" : ""
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
						className: "divide-y divide-white/5",
						children: filteredUsers.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 4,
							className: "px-6 py-12 text-center text-white/30 italic",
							children: "No se encontraron usuarios."
						}) }) : filteredUsers.map((user) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "hover:bg-white/5 transition-colors group",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4 whitespace-nowrap",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "w-4 h-4" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold text-white",
											children: user.nombre_completo || "Sin nombre"
										})]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4 whitespace-nowrap text-white/40 font-mono text-xs",
									children: user.whatsapp || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4 whitespace-nowrap",
									children: getRoleBadge(user.role)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-6 py-4 whitespace-nowrap text-right",
									children: isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										disabled: updatingId === user.id,
										value: user.role,
										onChange: (e) => {
											const role = e.target.value;
											if (role === "admin" || role === "user" || role === "proveedor") handleUpdateRole(user.id, role);
										},
										className: "bg-ink border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "user",
												children: "Usuario"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "proveedor",
												children: "Proveedor"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "admin",
												children: "Administrador"
											})
										]
									})
								})
							]
						}, user.id))
					})]
				})
			})
		})]
	});
}
//#endregion
export { UsersManagement as component };
