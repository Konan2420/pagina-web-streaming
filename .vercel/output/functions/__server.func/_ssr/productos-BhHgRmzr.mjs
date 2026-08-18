import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as supabase } from "./client-BVMXBJHu.mjs";
import { A as Pencil, D as Plus, H as LoaderCircle, J as Info, M as Package, Y as Image, l as Trash2, o as Upload, r as X, w as Search } from "../_libs/lucide-react.mjs";
import { u as useServerFn } from "./useIsAdmin-B5KXC5Eo.mjs";
import { o as useQueryClient, r as useSuspenseQuery } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { C as deleteProduct, c as productsQueryOptions, d as AdminLayout, k as upsertProduct } from "./router-CZAAJbb_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/productos-BhHgRmzr.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ProductsManagement() {
	const { data: products } = useSuspenseQuery(productsQueryOptions);
	const [searchTerm, setSearchTerm] = (0, import_react.useState)("");
	const [isModalOpen, setIsModalOpen] = (0, import_react.useState)(false);
	const [editingProduct, setEditingProduct] = (0, import_react.useState)(null);
	const [isDeletingId, setIsDeletingId] = (0, import_react.useState)(null);
	const [isUploading, setIsUploading] = (0, import_react.useState)(false);
	const [imagePreview, setImagePreview] = (0, import_react.useState)(null);
	const [showHelper, setShowHelper] = (0, import_react.useState)(false);
	const queryClient = useQueryClient();
	const upsertMutation = useServerFn(upsertProduct);
	const deleteMutation = useServerFn(deleteProduct);
	const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category?.toLowerCase().includes(searchTerm.toLowerCase()));
	const handleImageUpload = async (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (file.size > 5242880) {
			toast.error("La imagen excede los 5MB");
			return;
		}
		if (![
			"image/jpeg",
			"image/png",
			"image/webp"
		].includes(file.type)) {
			toast.error("Formato no soportado (use JPG, PNG o WebP)");
			return;
		}
		setIsUploading(true);
		try {
			const fileExt = file.name.split(".").pop();
			const filePath = `${`${Math.random().toString(36).substring(2)}.${fileExt}`}`;
			const { data, error: uploadError } = await supabase.storage.from("product-images").upload(filePath, file);
			if (uploadError) throw uploadError;
			const { data: signedData, error: signedUrlError } = await supabase.storage.from("product-images").createSignedUrl(filePath, 31536e3);
			if (signedUrlError || !signedData) throw signedUrlError || /* @__PURE__ */ new Error("Failed to get signed URL");
			setImagePreview(signedData.signedUrl);
		} catch (err) {
			console.error("Upload error:", err);
			toast.error("Error al subir imagen: " + (err instanceof Error ? err.message : "Desconocido"));
		} finally {
			setIsUploading(false);
		}
	};
	const handleUpsert = async (e) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);
		const data = {
			id: editingProduct?.id,
			name: formData.get("name"),
			price: Number(formData.get("price")),
			description: formData.get("description"),
			category: formData.get("category"),
			image_url: imagePreview || formData.get("image_url"),
			is_active: formData.get("is_active") === "on",
			descripcion_larga: formData.get("descripcion_larga")
		};
		if (!data.name || data.price < 0) {
			toast.error("Nombre y precio válido son obligatorios");
			return;
		}
		try {
			await upsertMutation({ data });
			toast.success(data.id ? "Producto actualizado" : "Producto creado");
			setIsModalOpen(false);
			setEditingProduct(null);
			setImagePreview(null);
			queryClient.invalidateQueries({ queryKey: ["admin-products"] });
		} catch (err) {
			toast.error("Error: " + (err instanceof Error ? err.message : "Desconocido"));
		}
	};
	const openModal = (product = null) => {
		setEditingProduct(product);
		setImagePreview(product?.image_url || null);
		setIsModalOpen(true);
	};
	const handleDelete = async (id) => {
		if (!confirm("¿Estás seguro de eliminar este producto?")) return;
		setIsDeletingId(id);
		try {
			await deleteMutation({ data: { id } });
			toast.success("Producto eliminado");
			queryClient.invalidateQueries({ queryKey: ["admin-products"] });
		} catch (err) {
			toast.error("Error al eliminar");
		} finally {
			setIsDeletingId(null);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AdminLayout, {
		title: "Productos",
		subtitle: "Gestiona el catálogo de productos disponibles",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col sm:flex-row items-center justify-between gap-4 mb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-full sm:w-96",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						placeholder: "Buscar productos...",
						value: searchTerm,
						onChange: (e) => setSearchTerm(e.target.value),
						className: "w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 w-full sm:w-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setShowHelper(!showHelper),
						className: "p-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all",
						title: "Ayuda de edición",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "w-5 h-5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => openModal(),
						className: "flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary/20",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-4 h-4" }), " Nuevo Producto"]
					})]
				})]
			}),
			showHelper && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "glass-card rounded-2xl border border-primary/20 p-5 mb-8 animate-in fade-in slide-in-from-top-4 duration-300",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "w-5 h-5 text-primary" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "text-white font-semibold",
							children: "Gestión de Contenido en Tiempo Real"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-white/60 mt-1 leading-relaxed",
							children: [
								"Cada producto que edites o crees aquí se reflejará automáticamente en la",
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Landing Page" }),
								" y el ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "Panel de Usuario" }),
								". Puedes cambiar precios, imágenes y categorías para organizar tu tienda dinámicamente."
							]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setShowHelper(false),
							className: "ml-auto p-1 hover:bg-white/5 rounded-lg text-white/40",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-4 h-4" })
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
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
									children: "Producto"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-6 py-4 font-medium uppercase tracking-wider",
									children: "Categoría"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-6 py-4 font-medium uppercase tracking-wider",
									children: "Precio"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-6 py-4 font-medium uppercase tracking-wider",
									children: "Estado"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "px-6 py-4 font-medium uppercase tracking-wider text-right",
									children: "Acciones"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", {
							className: "divide-y divide-white/5",
							children: filteredProducts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 5,
								className: "px-6 py-12 text-center text-white/30 italic",
								children: "No hay productos aún."
							}) }) : filteredProducts.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "hover:bg-white/5 transition-colors group",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-4 whitespace-nowrap",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-10 h-10 rounded-lg bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0",
												children: product.image_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
													src: product.image_url,
													alt: product.name,
													className: "w-full h-full object-cover"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "w-5 h-5 text-white/20" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-semibold text-white",
												children: product.name
											})]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-4 whitespace-nowrap text-white/50",
										children: product.category || "General"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "px-6 py-4 whitespace-nowrap font-mono text-primary",
										children: ["S/ ", product.price.toFixed(2)]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-4 whitespace-nowrap",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: async () => {
												try {
													await upsertMutation({ data: {
														...product,
														is_active: !product.is_active
													} });
													queryClient.invalidateQueries({ queryKey: ["admin-products"] });
													toast.success(`Producto ${!product.is_active ? "activado" : "desactivado"}`);
												} catch (err) {
													toast.error("Error al cambiar estado");
												}
											},
											className: `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-colors ${product.is_active ? "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"}`,
											children: product.is_active ? "Activo" : "Inactivo"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-6 py-4 whitespace-nowrap text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-end gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => openModal(product),
												className: "p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white transition-colors",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "w-4 h-4" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												disabled: isDeletingId === product.id,
												onClick: () => handleDelete(product.id),
												className: "p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-red-400 transition-colors",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "w-4 h-4" })
											})]
										})
									})
								]
							}, product.id))
						})]
					})
				})
			}),
			isModalOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "glass-card w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between p-6 border-b border-white/5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-xl font-display text-white uppercase tracking-tight",
							children: editingProduct ? "Editar Producto" : "Nuevo Producto"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setIsModalOpen(false),
							className: "text-white/40 hover:text-white",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-5 h-5" })
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleUpsert,
						className: "p-6 space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5 sm:col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-xs font-bold text-white/40 uppercase tracking-widest",
										children: "Nombre"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "name",
										defaultValue: editingProduct?.name,
										required: true,
										className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-xs font-bold text-white/40 uppercase tracking-widest",
										children: "Precio (S/)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "price",
										type: "number",
										step: "0.01",
										defaultValue: editingProduct?.price,
										required: true,
										className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-xs font-bold text-white/40 uppercase tracking-widest",
										children: "Categoría"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										name: "category",
										defaultValue: editingProduct?.category || "Streaming",
										className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "streaming",
												className: "bg-[#121212]",
												children: "Streaming"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "combos",
												className: "bg-[#121212]",
												children: "Combos Premium"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "ia",
												className: "bg-[#121212]",
												children: "IA & Herramientas"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "apps",
												className: "bg-[#121212]",
												children: "Aplicaciones"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "licencias",
												className: "bg-[#121212]",
												children: "Licencias"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "cursos",
												className: "bg-[#121212]",
												children: "Cursos"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "recargas",
												className: "bg-[#121212]",
												children: "Recargas"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "videojuegos",
												className: "bg-[#121212]",
												children: "Videojuegos"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "giftcards",
												className: "bg-[#121212]",
												children: "Tarjetas de Regalo"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "invitaciones",
												className: "bg-[#121212]",
												children: "Invitaciones"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "redes",
												className: "bg-[#121212]",
												children: "Redes Sociales"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "music",
												className: "bg-[#121212]",
												children: "Música"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "adult",
												className: "bg-[#121212]",
												children: "Adultos"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "iptv",
												className: "bg-[#121212]",
												children: "IPTV"
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5 sm:col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-xs font-bold text-white/40 uppercase tracking-widest",
										children: "Imagen"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-20 h-20 rounded-xl bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0",
											children: imagePreview ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: imagePreview,
												className: "w-full h-full object-cover"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "w-8 h-8 text-white/10" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1 space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "relative",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "file",
													accept: "image/*",
													onChange: handleImageUpload,
													className: "absolute inset-0 opacity-0 cursor-pointer",
													disabled: isUploading
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
													className: "w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-2.5 rounded-lg border border-white/10 transition-all cursor-pointer",
													children: [isUploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "w-4 h-4" }), imagePreview ? "Cambiar Imagen" : "Subir Imagen"]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												name: "image_url",
												placeholder: "O pega una URL",
												value: imagePreview || "",
												onChange: (e) => setImagePreview(e.target.value),
												className: "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white/70 focus:outline-none"
											})]
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5 sm:col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-xs font-bold text-white/40 uppercase tracking-widest",
										children: "Descripción corta (Card)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										name: "description",
										defaultValue: editingProduct?.description ?? "",
										placeholder: "Ej: NETFLIX PREMIUM — PERFIL X 30 DÍAS",
										className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5 sm:col-span-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										className: "text-xs font-bold text-white/40 uppercase tracking-widest",
										children: "Descripción Larga (Detalles)"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										name: "descripcion_larga",
										defaultValue: editingProduct?.descripcion_larga ?? "",
										rows: 3,
										placeholder: "Instrucciones detalladas del producto...",
										className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 py-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "checkbox",
										id: "is_active",
										name: "is_active",
										defaultChecked: editingProduct ? Boolean(editingProduct.is_active) : true,
										className: "w-5 h-5 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
										htmlFor: "is_active",
										className: "text-sm text-white",
										children: "Producto Activo"
									})]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3 pt-4 border-t border-white/5 mt-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setIsModalOpen(false),
								className: "flex-1 bg-white/5 hover:bg-white/10 text-white font-semibold py-3 rounded-xl transition-all",
								children: "Cancelar"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "submit",
								className: "flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-primary/20",
								children: editingProduct ? "Guardar Cambios" : "Crear Producto"
							})]
						})]
					})]
				})
			})
		]
	});
}
//#endregion
export { ProductsManagement as component };
