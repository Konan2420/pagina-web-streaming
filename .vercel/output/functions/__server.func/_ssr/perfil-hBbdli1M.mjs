import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as supabase } from "./client-BVMXBJHu.mjs";
import { Ct as Check, Dt as CalendarDays, H as LoaderCircle, M as Package, T as Save, X as ImagePlus, Y as Image, a as User, f as Store, it as Eye, m as Sparkles, o as Upload, p as Star, r as X, v as ShieldCheck, yt as CircleCheck } from "../_libs/lucide-react.mjs";
import { u as useServerFn } from "./useIsAdmin-B5KXC5Eo.mjs";
import { i as normalizeEffect, t as AVATAR_EFFECTS } from "./avatar-effects-XfJ0Ki_h.mjs";
import { i as useQuery, o as useQueryClient, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { _ as useFuturisticSound, v as ProviderAvatar, y as AvatarEffect } from "./router-CZAAJbb_.mjs";
import { i as getSupplierDashboardStats, s as getSupplierProfile, t as SupplierLayout, u as updateSupplierProfile } from "./supplier.functions-Do9UnGB-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/perfil-hBbdli1M.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PROVIDER_AVATARS = [
	{
		id: "provider-avatar-01",
		label: "Ejecutivo Proveedor",
		recommended: true
	},
	{
		id: "provider-avatar-02",
		label: "Ejecutivo Neón"
	},
	{
		id: "provider-avatar-03",
		label: "Ejecutiva Digital",
		recommended: true
	},
	{
		id: "provider-avatar-04",
		label: "Ejecutivo Senior"
	},
	{
		id: "provider-avatar-05",
		label: "Ejecutivo Clásico"
	}
].map((f) => ({
	id: f.id,
	url: `/provider-avatars/${f.id}.png`,
	thumb: `/provider-avatars/${f.id}-128.png`,
	label: f.label,
	recommended: "recommended" in f ? Boolean(f.recommended) : false
}));
var MAX_BYTES = 2097152;
var OUT_SIZE = 512;
var ALLOWED = [
	"image/png",
	"image/jpeg",
	"image/webp"
];
/** Galería de avatares predefinidos + subida de imagen propia. */
function ProviderAvatarPicker({ userId, currentUrl, saving, onApply }) {
	const [selected, setSelected] = (0, import_react.useState)(currentUrl);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const inputRef = (0, import_react.useRef)(null);
	const dirty = selected !== "" && selected !== currentUrl;
	async function handleFile(e) {
		const file = e.target.files?.[0];
		if (inputRef.current) inputRef.current.value = "";
		if (!file) {
			toast.error("Selecciona una imagen válida.");
			return;
		}
		if (!ALLOWED.includes(file.type)) {
			toast.error("Formato no compatible.");
			return;
		}
		if (file.size > MAX_BYTES) {
			toast.error("La imagen supera el tamaño máximo permitido.");
			return;
		}
		setUploading(true);
		try {
			const bitmap = await createImageBitmap(file);
			const side = Math.min(bitmap.width, bitmap.height);
			const sx = (bitmap.width - side) / 2;
			const sy = (bitmap.height - side) / 2;
			const canvas = document.createElement("canvas");
			canvas.width = OUT_SIZE;
			canvas.height = OUT_SIZE;
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("Tu navegador no soporta el recorte de imágenes.");
			ctx.imageSmoothingQuality = "high";
			ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, OUT_SIZE, OUT_SIZE);
			const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(/* @__PURE__ */ new Error("No se pudo procesar la imagen.")), "image/webp", .9));
			const path = `${userId}/supplier-avatar-${Date.now()}.webp`;
			const { error } = await supabase.storage.from("avatars").upload(path, blob, {
				upsert: true,
				contentType: "image/webp"
			});
			if (error) throw error;
			const { data: signed } = await supabase.storage.from("avatars").createSignedUrl(path, 31536e3);
			if (!signed?.signedUrl) throw new Error("No se pudo generar el enlace de la imagen.");
			setSelected(signed.signedUrl);
			toast.success("Imagen lista. Pulsa «Usar este avatar» para aplicarla.");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "No se pudo subir la imagen.");
		} finally {
			setUploading(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col lg:flex-row gap-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-center gap-3 shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative w-40 h-40 animate-fire-aura",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-40 h-40 rounded-full overflow-hidden border border-white/10 bg-white/5 relative z-10",
							children: selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: selected,
								alt: "Vista previa del avatar seleccionado",
								width: 512,
								height: 512,
								className: "w-full h-full object-cover"
							}) : null
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute bottom-2 right-2 z-20 w-4 h-4 rounded-full bg-green-500 border-2 border-ink" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: !dirty || saving,
						onClick: () => onApply(selected),
						className: "inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest disabled:opacity-40 hover:brightness-110 transition",
						children: [saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "w-4 h-4" }), "Usar este avatar"]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex-1 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4",
					children: PROVIDER_AVATARS.map((a) => {
						const active = selected === a.url;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setSelected(a.url),
							"aria-label": `Seleccionar avatar ${a.label}`,
							"aria-pressed": active,
							className: `relative rounded-full aspect-square overflow-hidden border-2 transition ${active ? "border-primary shadow-[0_0_18px_2px_hsl(var(--primary)/0.45)]" : "border-white/10 hover:border-primary/50"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: a.thumb,
								alt: a.label,
								width: 128,
								height: 128,
								loading: "lazy",
								decoding: "async",
								className: "w-full h-full object-cover"
							}), active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute bottom-1 right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground grid place-items-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-3.5 h-3.5" })
							})]
						}, a.id);
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-t border-white/5 pt-6 flex flex-col sm:flex-row sm:items-center gap-4 justify-between",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-foreground font-semibold",
						children: "¿Prefieres usar tu propia imagen?"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-muted-foreground mt-1",
						children: "PNG, JPG o WEBP · máx 2MB · recomendado 512 × 512 px"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: uploading,
						onClick: () => inputRef.current?.click(),
						className: "inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-foreground text-xs font-black uppercase tracking-widest hover:border-primary/50 transition disabled:opacity-50",
						children: [uploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "w-4 h-4" }), "Subir imagen"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: inputRef,
						type: "file",
						accept: "image/png,image/jpeg,image/webp",
						className: "hidden",
						onChange: handleFile
					})
				]
			}),
			!selected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "flex items-center gap-2 text-[11px] text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePlus, { className: "w-3.5 h-3.5" }), " Aún no has elegido un avatar."]
			})
		]
	});
}
/** Galería de efectos animados para el avatar del proveedor. */
function AvatarEffectPicker({ currentEffect, previewEffect, avatarUrl, saving, onPreview, onApply }) {
	const [big, setBig] = (0, import_react.useState)(false);
	const selected = normalizeEffect(previewEffect);
	const dirty = selected !== normalizeEffect(currentEffect);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
				className: "font-display text-lg text-foreground uppercase tracking-tight",
				children: "Efecto del Avatar"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground mt-1",
				children: "Personaliza tu perfil con un efecto animado único."
			})] }),
			big && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex justify-center py-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarEffect, {
					effect: selected,
					size: "lg",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-40 h-40 rounded-full overflow-hidden border border-white/10 bg-white/5",
						children: avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: avatarUrl,
							alt: "Vista previa del efecto",
							className: "w-full h-full object-cover"
						}) : null
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3",
				children: AVATAR_EFFECTS.map((fx) => {
					const active = selected === fx.id;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => onPreview(fx.id),
						"aria-pressed": active,
						title: fx.desc,
						className: `relative flex flex-col items-center gap-2.5 p-3 rounded-2xl border transition ${active ? "border-primary bg-primary/10" : "border-white/10 bg-white/[0.03] hover:border-primary/40"}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarEffect, {
								effect: fx.id,
								size: "sm",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-white/10",
									children: avatarUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: avatarUrl,
										alt: "",
										loading: "lazy",
										className: "w-full h-full object-cover"
									}) : null
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] font-black uppercase tracking-widest text-center leading-tight text-muted-foreground",
								children: fx.label
							}),
							active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground grid place-items-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-3 h-3" })
							})
						]
					}, fx.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: !dirty || saving,
						onClick: () => onApply(selected),
						className: "inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-primary-foreground text-[11px] font-black uppercase tracking-widest disabled:opacity-40 hover:brightness-110 transition",
						children: [saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "w-4 h-4" }), "Aplicar efecto"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setBig((v) => !v),
						className: "inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-foreground text-[11px] font-black uppercase tracking-widest hover:border-primary/50 transition",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "w-4 h-4" }), " Vista previa"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => onPreview("none"),
						className: "inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-muted-foreground text-[11px] font-black uppercase tracking-widest hover:border-primary/50 transition",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-4 h-4" }), " Quitar efecto"]
					})
				]
			})
		]
	});
}
function SupplierProfile() {
	const { playHover, playClick } = useFuturisticSound();
	const [tab, setTab] = (0, import_react.useState)("perfil");
	const [displayName, setDisplayName] = (0, import_react.useState)("");
	const [avatarUrl, setAvatarUrl] = (0, import_react.useState)("");
	const [userId, setUserId] = (0, import_react.useState)("");
	const [memberSince, setMemberSince] = (0, import_react.useState)("");
	const [avatarEffect, setAvatarEffect] = (0, import_react.useState)("none");
	const [previewFx, setPreviewFx] = (0, import_react.useState)("none");
	const queryClient = useQueryClient();
	const updateProfileFn = useServerFn(updateSupplierProfile);
	const { data: stats } = useQuery({
		queryKey: ["supplier-stats"],
		queryFn: () => getSupplierDashboardStats()
	});
	const { data: profile } = useQuery({
		queryKey: ["supplier-profile"],
		queryFn: () => getSupplierProfile()
	});
	(0, import_react.useEffect)(() => {
		if (!profile) return;
		setUserId(profile.user_id);
		setDisplayName(profile.display_name || "");
		setAvatarUrl(profile.avatar_url || "");
		const fx = normalizeEffect(profile.avatar_effect);
		setAvatarEffect(fx);
		setPreviewFx(fx);
		if (profile.joined_at) setMemberSince(new Date(profile.joined_at).getFullYear().toString());
	}, [profile]);
	const save = useMutation({
		mutationFn: (payload) => updateProfileFn({ data: payload }),
		onSuccess: (res) => {
			const saved = res?.profile;
			if (saved) {
				const fx = normalizeEffect(saved.avatar_effect);
				setAvatarEffect(fx);
				setPreviewFx(fx);
				setAvatarUrl(saved.avatar_url || "");
			}
			queryClient.invalidateQueries({ queryKey: ["supplier-profile"] });
			queryClient.invalidateQueries({ queryKey: ["supplier-stats"] });
			queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] });
			queryClient.invalidateQueries({ queryKey: ["my-order-ratings"] });
			queryClient.invalidateQueries({ queryKey: ["public-suppliers"] });
		}
	});
	const handleSave = (e) => {
		e.preventDefault();
		if (displayName.trim().length < 2) {
			toast.error("El nombre debe tener al menos 2 caracteres.");
			return;
		}
		save.mutate({
			display_name: displayName.trim(),
			avatar_url: avatarUrl || void 0,
			avatar_effect: avatarEffect
		}, {
			onSuccess: () => toast.success("Perfil actualizado correctamente"),
			onError: () => toast.error("Error al actualizar perfil")
		});
	};
	const applyAvatar = async (url) => {
		if (displayName.trim().length < 2) {
			toast.error("Primero define tu nombre comercial.");
			setTab("perfil");
			return;
		}
		try {
			await save.mutateAsync({
				display_name: displayName.trim(),
				avatar_url: url,
				avatar_effect: avatarEffect
			});
			toast.success("Avatar actualizado correctamente");
		} catch {
			toast.error("No se pudo guardar el avatar. Inténtalo nuevamente.");
		}
	};
	const applyEffect = async (fx) => {
		if (displayName.trim().length < 2) {
			toast.error("Primero define tu nombre comercial.");
			setTab("perfil");
			return;
		}
		try {
			await save.mutateAsync({
				display_name: displayName.trim(),
				avatar_url: avatarUrl || void 0,
				avatar_effect: normalizeEffect(fx)
			});
			toast.success("Efecto guardado correctamente.");
		} catch {
			toast.error("No se pudo guardar el efecto. Inténtalo nuevamente.");
		}
	};
	const rating = stats?.rating ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SupplierLayout, {
		title: "Mi Perfil",
		subtitle: "Configura tu identidad como proveedor en la plataforma.",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid lg:grid-cols-[1fr_320px] gap-8 items-start",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-6 min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2 p-1.5 rounded-2xl bg-white/[0.03] border border-white/5 w-fit",
					children: [{
						key: "perfil",
						label: "Perfil",
						icon: User
					}, {
						key: "avatar",
						label: "Avatar",
						icon: Image
					}].map(({ key, label, icon: Icon }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onMouseEnter: playHover,
						onClick: () => {
							playClick();
							setTab(key);
						},
						className: `inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition ${tab === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "w-3.5 h-3.5" }), label]
					}, key))
				}), tab === "perfil" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleSave,
					className: "bg-ink/40 backdrop-blur-xl border border-white/5 p-6 sm:p-8 rounded-[2.5rem] space-y-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1",
							children: "Nombre Comercial / Marca"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative group",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: displayName,
								onChange: (e) => setDisplayName(e.target.value),
								maxLength: 60,
								placeholder: "Ej: CMD Digital Store",
								className: "w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "submit",
						disabled: save.isPending,
						onMouseEnter: playHover,
						onClick: () => playClick(),
						className: "w-full flex items-center justify-center gap-3 py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20 disabled:opacity-50",
						children: [save.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-5 h-5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "w-5 h-5" }), "Guardar Cambios"]
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-ink/40 backdrop-blur-xl border border-white/5 p-6 sm:p-8 rounded-[2.5rem] space-y-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display text-lg text-foreground uppercase tracking-tight",
							children: "Avatar de Proveedor"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground mt-1",
							children: "Elige una imagen profesional para representar tu perfil y tu tienda."
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProviderAvatarPicker, {
							userId,
							currentUrl: avatarUrl,
							saving: save.isPending,
							onApply: applyAvatar
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-t border-white/5 pt-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarEffectPicker, {
								currentEffect: avatarEffect,
								previewEffect: previewFx,
								avatarUrl,
								saving: save.isPending,
								onPreview: setPreviewFx,
								onApply: applyEffect
							})
						})
					]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "bg-ink/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] p-7 text-center lg:sticky lg:top-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative w-28 h-28 mx-auto",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProviderAvatar, {
							src: avatarUrl,
							effect: tab === "avatar" ? previewFx : avatarEffect,
							size: "md",
							alt: `Avatar de ${displayName || "proveedor"}`
						}), stats?.isVerified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute -bottom-1 -right-1 z-20 bg-green-500 text-white p-1.5 rounded-xl border-2 border-ink",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-3.5 h-3.5" })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "mt-5 font-display text-lg text-foreground uppercase tracking-tight truncate",
						children: displayName || "Tu tienda"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-muted-foreground mt-1 flex items-center justify-center gap-1",
						children: stats?.isVerified ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "w-3 h-3 text-green-500" }), " Proveedor verificado"] }) : "Pendiente de verificación"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-5 space-y-2.5 text-[11px] text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "flex items-center justify-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: "w-3.5 h-3.5 text-primary" }), rating ? `${rating.toFixed(1)} (${stats?.totalReviews} reseñas)` : "Sin calificaciones aún"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "flex items-center justify-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "w-3.5 h-3.5" }),
									" ",
									stats?.availableStock ?? 0,
									" productos disponibles"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "flex items-center justify-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "w-3.5 h-3.5" }),
									" Miembro desde",
									" ",
									memberSince || (/* @__PURE__ */ new Date()).getFullYear()
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "flex items-center justify-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-2 h-2 rounded-full bg-green-500" }), " En línea"]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: "/tienda",
						onMouseEnter: playHover,
						className: "mt-6 inline-flex w-full items-center justify-center gap-2 py-3 rounded-2xl bg-white/5 border border-white/10 text-foreground text-[11px] font-black uppercase tracking-widest hover:border-primary/50 transition",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "w-3.5 h-3.5" }), " Ver tienda"]
					})
				]
			})]
		})
	});
}
//#endregion
export { SupplierProfile as component };
