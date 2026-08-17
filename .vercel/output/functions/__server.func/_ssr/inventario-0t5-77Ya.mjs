import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as supabase } from "./client-BoZLFmz6.mjs";
import { Ct as Check, D as Plus, St as ChevronDown, l as Trash2, pt as Clock, w as Search, xt as ChevronUp, yt as CircleCheck } from "../_libs/lucide-react.mjs";
import { i as useQuery, o as useQueryClient, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { t as AdminLayout } from "./AdminLayout-C8SR68fz.mjs";
import { a as DialogDescription, c as DialogTitle, d as Textarea, i as DialogContent, l as DialogTrigger, n as Button, o as DialogFooter, r as Dialog, s as DialogHeader, t as Badge, u as Input } from "./badge-DkFvwYcE.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as SelectItemIndicator, c as SelectPortal, d as SelectSeparator$1, f as SelectTrigger$1, i as SelectItem$1, l as SelectScrollDownButton$1, m as SelectViewport, n as SelectContent$1, o as SelectItemText, p as SelectValue$1, r as SelectIcon, s as SelectLabel$1, t as Select$1, u as SelectScrollUpButton$1 } from "../_libs/@radix-ui/react-select+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/inventario-0t5-77Ya.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var Table = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: "relative w-full overflow-auto",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
		ref,
		className: cn("w-full caption-bottom text-sm", className),
		...props
	})
}));
Table.displayName = "Table";
var TableHeader = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
	ref,
	className: cn("[&_tr]:border-b", className),
	...props
}));
TableHeader.displayName = "TableHeader";
var TableBody = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
	ref,
	className: cn("[&_tr:last-child]:border-0", className),
	...props
}));
TableBody.displayName = "TableBody";
var TableFooter = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", {
	ref,
	className: cn("border-t bg-muted/50 font-medium [&>tr]:last:border-b-0", className),
	...props
}));
TableFooter.displayName = "TableFooter";
var TableRow = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
	ref,
	className: cn("border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted", className),
	...props
}));
TableRow.displayName = "TableRow";
var TableHead = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
	ref,
	className: cn("h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className),
	...props
}));
TableHead.displayName = "TableHead";
var TableCell = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
	ref,
	className: cn("p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]", className),
	...props
}));
TableCell.displayName = "TableCell";
var TableCaption = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("caption", {
	ref,
	className: cn("mt-4 text-sm text-muted-foreground", className),
	...props
}));
TableCaption.displayName = "TableCaption";
var Select = Select$1;
var SelectValue = SelectValue$1;
var SelectTrigger = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectTrigger$1, {
	ref,
	className: cn("flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className),
	...props,
	children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectIcon, {
		asChild: true,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4 opacity-50" })
	})]
}));
SelectTrigger.displayName = SelectTrigger$1.displayName;
var SelectScrollUpButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "h-4 w-4" })
}));
SelectScrollUpButton.displayName = SelectScrollUpButton$1.displayName;
var SelectScrollDownButton = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton$1, {
	ref,
	className: cn("flex cursor-default items-center justify-center py-1", className),
	...props,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "h-4 w-4" })
}));
SelectScrollDownButton.displayName = SelectScrollDownButton$1.displayName;
var SelectContent = import_react.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectPortal, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectContent$1, {
	ref,
	className: cn("relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className),
	position,
	...props,
	children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollUpButton, {}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectViewport, {
			className: cn("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),
			children
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectScrollDownButton, {})
	]
}) }));
SelectContent.displayName = SelectContent$1.displayName;
var SelectLabel = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectLabel$1, {
	ref,
	className: cn("px-2 py-1.5 text-sm font-semibold", className),
	...props
}));
SelectLabel.displayName = SelectLabel$1.displayName;
var SelectItem = import_react.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem$1, {
	ref,
	className: cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
	...props,
	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemIndicator, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }) })
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItemText, { children })]
}));
SelectItem.displayName = SelectItem$1.displayName;
var SelectSeparator = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectSeparator$1, {
	ref,
	className: cn("-mx-1 my-1 h-px bg-muted", className),
	...props
}));
SelectSeparator.displayName = SelectSeparator$1.displayName;
var Card = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("rounded-xl border bg-card text-card-foreground shadow", className),
	...props
}));
Card.displayName = "Card";
var CardHeader = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex flex-col space-y-1.5 p-6", className),
	...props
}));
CardHeader.displayName = "CardHeader";
var CardTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("font-semibold leading-none tracking-tight", className),
	...props
}));
CardTitle.displayName = "CardTitle";
var CardDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("text-sm text-muted-foreground", className),
	...props
}));
CardDescription.displayName = "CardDescription";
var CardContent = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("p-6 pt-0", className),
	...props
}));
CardContent.displayName = "CardContent";
var CardFooter = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	ref,
	className: cn("flex items-center p-6 pt-0", className),
	...props
}));
CardFooter.displayName = "CardFooter";
function InventoryPage() {
	const [search, setSearch] = (0, import_react.useState)("");
	const [isAddOpen, setIsAddOpen] = (0, import_react.useState)(false);
	const [selectedProduct, setSelectedProduct] = (0, import_react.useState)("");
	const [bulkMode, setBulkMode] = (0, import_react.useState)(false);
	const [credentials, setCredentials] = (0, import_react.useState)({
		email: "",
		password: "",
		access_link: "",
		notes: ""
	});
	const [bulkText, setBulkText] = (0, import_react.useState)("");
	const queryClient = useQueryClient();
	const { data: products } = useQuery({
		queryKey: ["admin-products-list"],
		queryFn: async () => {
			const { data, error } = await supabase.from("products").select("id, name").eq("is_active", true).order("name");
			if (error) throw error;
			return data;
		}
	});
	const { data: inventory, isLoading } = useQuery({
		queryKey: ["admin-account-inventory"],
		queryFn: async () => {
			const { data, error } = await supabase.from("account_inventory").select(`
          *,
          products(name)
        `).order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		}
	});
	const stats = (0, import_react.useMemo)(() => {
		if (!inventory) return {
			total: 0,
			available: 0,
			assigned: 0
		};
		return {
			total: inventory.length,
			available: inventory.filter((i) => i.status === "available").length,
			assigned: inventory.filter((i) => i.status === "assigned").length
		};
	}, [inventory]);
	const addMutation = useMutation({
		mutationFn: async () => {
			if (!selectedProduct) throw new Error("Selecciona un producto");
			if (bulkMode) {
				const lines = bulkText.split("\n").filter((l) => l.trim().includes(":"));
				if (lines.length === 0) throw new Error("Formato inválido. Usa email:password por línea");
				const inserts = lines.map((line) => {
					const [email, ...rest] = line.split(":");
					return {
						product_id: selectedProduct,
						email: email.trim(),
						password: rest.join(":").trim(),
						status: "available"
					};
				});
				const { error } = await supabase.from("account_inventory").insert(inserts);
				if (error) throw error;
			} else {
				if (!credentials.email || !credentials.password) throw new Error("Email y contraseña requeridos");
				const { error } = await supabase.from("account_inventory").insert([{
					product_id: selectedProduct,
					email: credentials.email,
					password: credentials.password,
					access_link: credentials.access_link,
					notes: credentials.notes,
					status: "available"
				}]);
				if (error) throw error;
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-account-inventory"] });
			toast.success(bulkMode ? "Cuentas agregadas en lote" : "Cuenta agregada exitosamente");
			setIsAddOpen(false);
			setCredentials({
				email: "",
				password: "",
				access_link: "",
				notes: ""
			});
			setBulkText("");
		},
		onError: (error) => {
			toast.error("Error: " + (error instanceof Error ? error.message : "Desconocido"));
		}
	});
	const deleteMutation = useMutation({
		mutationFn: async (id) => {
			const { error } = await supabase.from("account_inventory").delete().eq("id", id);
			if (error) throw error;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-account-inventory"] });
			toast.success("Cuenta eliminada");
		}
	});
	const verifyPaymentMutation = useMutation({
		mutationFn: async ({ id, order_id, verified }) => {
			const { error: invError } = await supabase.from("account_inventory").update({ payment_verified: verified }).eq("id", id);
			if (invError) throw invError;
			if (order_id) {
				const { error: orderError } = await supabase.from("orders").update({ payment_verified: verified }).eq("id", order_id);
				if (orderError) throw orderError;
			}
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["admin-account-inventory"] });
			toast.success("Estado de pago actualizado");
		},
		onError: (error) => {
			toast.error("Error: " + (error instanceof Error ? error.message : "Desconocido"));
		}
	});
	const filteredInventory = inventory?.filter((item) => item.email.toLowerCase().includes(search.toLowerCase()) || item.products?.name.toLowerCase().includes(search.toLowerCase()));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminLayout, {
		title: "Inventario de Cuentas",
		subtitle: "Gestiona las credenciales que se entregarán automáticamente",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "bg-ink/40 border-white/5 backdrop-blur-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
							className: "pb-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-sm font-medium text-white/60",
								children: "Total Cuentas"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xl font-bold text-white",
							children: stats.total
						}) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "bg-ink/40 border-white/5 backdrop-blur-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
							className: "pb-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-sm font-medium text-green-400",
								children: "Disponibles (Stock)"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xl font-bold text-green-400",
							children: stats.available
						}) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						className: "bg-ink/40 border-white/5 backdrop-blur-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
							className: "pb-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
								className: "text-sm font-medium text-primary",
								children: "Asignadas (Vendidas)"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xl font-bold text-primary",
							children: stats.assigned
						}) })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full md:w-96",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "Buscar por email o producto...",
						value: search,
						onChange: (e) => setSearch(e.target.value),
						className: "pl-10 bg-white/5 border-white/10 text-white"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Dialog, {
					open: isAddOpen,
					onOpenChange: setIsAddOpen,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTrigger, {
						asChild: true,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "w-full md:w-auto bg-primary hover:bg-primary/90",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-4 h-4 mr-2" }), "Cargar Inventario"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
						className: "bg-ink border-white/10 text-white max-w-md",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Agregar Nueva Cuenta" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
								className: "text-white/40",
								children: "Estas credenciales se entregarán automáticamente cuando alguien compre el producto."
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-4 py-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "text-sm font-medium",
											children: "Producto Relacionado"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
											value: selectedProduct,
											onValueChange: setSelectedProduct,
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
												className: "bg-white/5 border-white/10",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Selecciona un producto" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, {
												className: "bg-ink border-white/10",
												children: products?.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
													value: p.id,
													children: p.name
												}, p.id))
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2 p-1 bg-white/5 rounded-lg",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: !bulkMode ? "default" : "ghost",
											className: "flex-1",
											onClick: () => setBulkMode(false),
											children: "Manual"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											size: "sm",
											variant: bulkMode ? "default" : "ghost",
											className: "flex-1",
											onClick: () => setBulkMode(true),
											children: "Lote (Bulk)"
										})]
									}),
									bulkMode ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "text-sm font-medium",
												children: "Lista de Cuentas (email:password)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
												placeholder: "correo@ejemplo.com:clave123\notro@ejemplo.com:clave456",
												className: "bg-white/5 border-white/10 h-32 font-mono text-sm",
												value: bulkText,
												onChange: (e) => setBulkText(e.target.value)
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-white/40",
												children: "Una línea por cuenta. Separado por dos puntos."
											})
										]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-2 gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
														className: "text-sm",
														children: "Email"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: credentials.email,
														onChange: (e) => setCredentials({
															...credentials,
															email: e.target.value
														}),
														className: "bg-white/5 border-white/10"
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "space-y-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
														className: "text-sm",
														children: "Contraseña"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
														value: credentials.password,
														onChange: (e) => setCredentials({
															...credentials,
															password: e.target.value
														}),
														className: "bg-white/5 border-white/10"
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
													className: "text-sm",
													children: "Link de Acceso (opcional)"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: credentials.access_link,
													onChange: (e) => setCredentials({
														...credentials,
														access_link: e.target.value
													}),
													className: "bg-white/5 border-white/10"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "space-y-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
													className: "text-sm",
													children: "Notas/PIN (opcional)"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
													value: credentials.notes,
													onChange: (e) => setCredentials({
														...credentials,
														notes: e.target.value
													}),
													className: "bg-white/5 border-white/10"
												})]
											})
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogFooter, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								onClick: () => addMutation.mutate(),
								disabled: addMutation.isPending,
								className: "w-full",
								children: addMutation.isPending ? "Guardando..." : "Guardar Inventario"
							}) })
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-ink/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Table, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHeader, {
					className: "bg-white/5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
						className: "border-white/5 hover:bg-transparent",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "text-white/60",
								children: "Producto"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "text-white/60",
								children: "Email"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "text-white/60",
								children: "Estado"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "text-white/60",
								children: "Creado"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableHead, {
								className: "text-right text-white/60",
								children: "Acciones"
							})
						]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableBody, { children: isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					colSpan: 5,
					className: "text-center py-8 text-white/40",
					children: "Cargando inventario..."
				}) }) : filteredInventory?.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableRow, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
					colSpan: 5,
					className: "text-center py-8 text-white/40",
					children: "No se encontraron cuentas."
				}) }) : filteredInventory?.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableRow, {
					className: "border-white/5 hover:bg-white/5 group",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "font-medium text-white",
							children: item.products?.name
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(TableCell, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-white/80",
							children: item.email
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-white/40 font-mono",
							children: "****"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, { children: item.status === "available" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							className: "bg-green-500/10 text-green-400 border-green-500/20",
							children: "Disponible"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							className: "bg-primary/10 text-primary border-primary/20",
							children: "Asignada"
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "text-white/40 text-sm",
							children: new Date(item.created_at || Date.now()).toLocaleDateString()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TableCell, {
							className: "text-right",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-end gap-2",
								children: [item.status === "available" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "ghost",
									size: "icon",
									className: "text-white/20 hover:text-red-500 hover:bg-red-500/10",
									onClick: () => {
										if (confirm("¿Seguro que quieres eliminar esta cuenta disponible?")) deleteMutation.mutate(item.id);
									},
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-4 h-4" })
								}), item.status === "assigned" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "sm",
									onClick: () => verifyPaymentMutation.mutate({
										id: item.id,
										order_id: item.order_id || "",
										verified: !item.payment_verified
									}),
									disabled: verifyPaymentMutation.isPending,
									className: cn("py-1 h-7 text-[10px] font-bold uppercase tracking-wider transition-all", item.payment_verified ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20"),
									children: item.payment_verified ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-3 h-3 mr-1" }), "Pago Verificado"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "w-3 h-3 mr-1" }), "Confirmar Pago WA"] })
								})]
							})
						})
					]
				}, item.id)) })] })
			})
		]
	});
}
//#endregion
export { InventoryPage as component };
