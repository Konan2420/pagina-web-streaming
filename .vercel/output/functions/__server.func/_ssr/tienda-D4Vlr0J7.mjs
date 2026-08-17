import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { g as createFileRoute, v as Link, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as supabase } from "./client-BoZLFmz6.mjs";
import { t as useServerFn } from "./useServerFn-CrZF2pjq.mjs";
import { c as createServerFn } from "./createServerFn-CVho-diU.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-eb4ID_9s.mjs";
import { t as createSsrRpc } from "./createSsrRpc-C6LzJFyz.mjs";
import { r as useAnalytics } from "./useAnalytics-CwCxI5iY.mjs";
import { t as useIsAdmin } from "./useIsAdmin-Cl5SWJ_w.mjs";
import { At as ArrowRight, B as LogOut, Ct as Check, D as Plus, F as Moon, H as LoaderCircle, I as Minus, K as Keyboard, L as MessageCircle, M as Package, St as ChevronDown, T as Save, Tt as Camera, U as LayoutGrid, V as Lock, W as LayoutDashboard, Z as House, _t as CircleQuestionMark, a as User, at as EyeOff, b as Share2, bt as CircleAlert, d as Sun, f as Store, ft as Command, g as ShoppingBag, gt as CircleUserRound, h as ShoppingCart, it as Eye, jt as ArrowLeft, k as Phone, kt as BadgeCheck, l as Trash2, m as Sparkles, mt as Clapperboard, o as Upload, ot as ExternalLink, p as Star, pt as Clock, q as Key, r as X, t as ZoomIn, ut as Copy, vt as CirclePlay, w as Search, wt as ChartColumn, x as Settings, z as Mail } from "../_libs/lucide-react.mjs";
import { a as objectType, i as numberType, o as stringType, t as arrayType } from "../_libs/zod.mjs";
import { i as useQuery, o as useQueryClient, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { a as categories, c as getAvatarUrl, i as buildWhatsAppMessage, l as products, n as buildCartWhatsAppMessage, r as buildProductInquiryWhatsAppMessage, s as estadoStyles, t as WA_NUMBER } from "./data-BqcQodSt.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { t as useFuturisticSound } from "./useSound-RUCf2ylS.mjs";
import { i as normalizeEffect } from "./avatar-effects-XfJ0Ki_h.mjs";
import { n as ProviderAvatar, t as AvatarEffect } from "./ProviderAvatar-wDRPd2M2.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tienda-D4Vlr0J7.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Devuelve, para los pedidos del usuario autenticado, qué proveedor los abasteció
* y si ya fueron calificados.
*/
var getMyOrderRatings = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("1e9f3d8e6cd0e9518837e328d748ebb09a052131a2f1d0dfd17727dd4398c40b"));
/** Califica al proveedor que entregó un pedido del usuario autenticado. */
var rateOrderSupplier = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({
	order_id: stringType().uuid(),
	rating: numberType().int().min(1).max(5),
	comment: stringType().max(500).optional()
}).parse(d)).handler(createSsrRpc("ef3298ae43384388bae11e2eaa4ab51922e84152ea2c2f356666130a135cea96"));
/**
* Resolves the least-privileged destination for an authenticated account.
* Administrators take precedence when an account also has the supplier role.
*/
async function getAuthDestination(userId) {
	const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
	if (error) {
		console.warn("[Auth] No se pudieron consultar los roles; se abre el panel de usuario.", error);
		return "/tienda";
	}
	const roles = new Set((data ?? []).map(({ role }) => role));
	if (roles.has("admin")) return "/admin";
	if (roles.has("proveedor")) return "/proveedor";
	return "/tienda";
}
function getAuthErrorMessage(err) {
	const message = err instanceof Error ? err.message.toLowerCase() : "";
	if (message.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
	if (message.includes("email not confirmed")) return "Confirma tu correo antes de iniciar sesión.";
	if (message.includes("user already registered")) return "Este correo ya tiene una cuenta. Inicia sesión.";
	if (message.includes("password should be")) return "La contraseña no cumple los requisitos de seguridad.";
	if (message.includes("unsupported provider") || message.includes("provider is not enabled")) return "El inicio de sesión con Google aún no está habilitado. Usa tu correo y contraseña o contacta al administrador.";
	if (message.includes("auth session missing") || message.includes("jwt expired")) return "El enlace de recuperación venció. Solicita uno nuevo.";
	if (message.includes("rate limit") || message.includes("too many requests")) return "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.";
	return err instanceof Error ? err.message : "No se pudo completar la autenticación.";
}
function setPendingOAuthRedirect() {
	try {
		window.sessionStorage.setItem("cmd-auth-redirect-pending", "1");
		return true;
	} catch {
		return false;
	}
}
function clearPendingOAuthRedirect() {
	try {
		window.sessionStorage.removeItem("cmd-auth-redirect-pending");
	} catch {}
}
function AuthModal({ open, onClose, initialMode = "login" }) {
	const [mode, setMode] = (0, import_react.useState)(initialMode);
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [confirm, setConfirm] = (0, import_react.useState)("");
	const [nombre, setNombre] = (0, import_react.useState)("");
	const [whatsapp, setWhatsapp] = (0, import_react.useState)("");
	const [terms, setTerms] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [info, setInfo] = (0, import_react.useState)(null);
	const [canResendConfirmation, setCanResendConfirmation] = (0, import_react.useState)(false);
	const [fieldErrors, setFieldErrors] = (0, import_react.useState)({});
	const track = useAnalytics();
	const router = useRouter();
	const getRedirectUrl = () => {
		if (typeof window === "undefined") return "/tienda";
		const configuredAppUrl = "https://cg3j72k6-3001.brs.devtunnels.ms".trim();
		try {
			return new URL("/tienda", configuredAppUrl).toString();
		} catch {
			return new URL("/tienda", window.location.origin).toString();
		}
	};
	async function redirectForRole(userId) {
		const to = await getAuthDestination(userId);
		await router.invalidate();
		await router.navigate({ to });
	}
	const closeModal = (0, import_react.useCallback)((force = false) => {
		if (loading && !force) return;
		setError(null);
		setInfo(null);
		setCanResendConfirmation(false);
		setFieldErrors({});
		setEmail("");
		setNombre("");
		setWhatsapp("");
		setTerms(false);
		setPassword("");
		setConfirm("");
		onClose();
	}, [loading, onClose]);
	(0, import_react.useEffect)(() => {
		if (open) setMode(initialMode);
	}, [open, initialMode]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const previousOverflow = document.body.style.overflow;
		const onKeyDown = (event) => {
			if (event.key === "Escape") closeModal();
		};
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", onKeyDown);
		return () => {
			document.body.style.overflow = previousOverflow;
			window.removeEventListener("keydown", onKeyDown);
		};
	}, [open, closeModal]);
	if (!open) return null;
	function resetState() {
		setError(null);
		setInfo(null);
		setCanResendConfirmation(false);
		setFieldErrors({});
	}
	function clearSensitiveFields() {
		setPassword("");
		setConfirm("");
	}
	function changeMode(nextMode) {
		resetState();
		clearSensitiveFields();
		setMode(nextMode);
	}
	function validateSignup() {
		const e = {};
		if (!nombre.trim()) e.nombre = "Ingresa tu nombre completo";
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Correo inválido";
		if (!/^[0-9+\s()-]{7,}$/.test(whatsapp)) e.whatsapp = "Número de WhatsApp inválido";
		if (password.length < 8) e.password = "Mínimo 8 caracteres";
		if (confirm !== password) e.confirm = "Las contraseñas no coinciden";
		if (!terms) e.terms = "Debes aceptar los términos";
		return e;
	}
	async function handleSubmit(e) {
		e.preventDefault();
		resetState();
		setLoading(true);
		const normalizedEmail = email.trim().toLowerCase();
		try {
			if (mode === "login") {
				const { data, error } = await supabase.auth.signInWithPassword({
					email: normalizedEmail,
					password
				});
				if (error) throw error;
				if (!data.user || !data.session) throw new Error("No se pudo establecer una sesión válida.");
				track("login", {
					eventName: "email_login",
					metadata: { method: "email" }
				});
				closeModal(true);
				await redirectForRole(data.user.id);
			} else if (mode === "signup") {
				const errs = validateSignup();
				if (Object.keys(errs).length > 0) {
					setFieldErrors(errs);
					setLoading(false);
					return;
				}
				const { data, error } = await supabase.auth.signUp({
					email: normalizedEmail,
					password,
					options: {
						emailRedirectTo: getRedirectUrl(),
						data: {
							nombre_completo: nombre.trim(),
							whatsapp: whatsapp.trim()
						}
					}
				});
				if (error) throw error;
				track("signup", {
					eventName: "email_signup",
					metadata: { method: "email" }
				});
				if (data.session) {
					closeModal(true);
					await redirectForRole(data.session.user.id);
				} else {
					clearSensitiveFields();
					setCanResendConfirmation(true);
					setInfo("Revisa tu correo y confirma tu cuenta para iniciar sesión.");
				}
			} else if (mode === "forgot") {
				const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo: getRedirectUrl() });
				if (error) throw error;
				setInfo("Te enviamos un enlace para restablecer tu contraseña.");
			} else {
				if (password.length < 8) {
					setFieldErrors({ password: "Mínimo 8 caracteres" });
					return;
				}
				if (confirm !== password) {
					setFieldErrors({ confirm: "Las contraseñas no coinciden" });
					return;
				}
				const { data, error } = await supabase.auth.updateUser({ password });
				if (error) throw error;
				if (!data.user) throw new Error("El enlace de recuperación ya no es válido. Solicita uno nuevo.");
				clearSensitiveFields();
				track("password_reset", {
					eventName: "password_updated",
					metadata: { method: "recovery" }
				});
				closeModal(true);
				await redirectForRole(data.user.id);
			}
		} catch (err) {
			const rawMessage = err instanceof Error ? err.message.toLowerCase() : "";
			const msg = getAuthErrorMessage(err);
			setError(msg);
			setCanResendConfirmation(rawMessage.includes("email not confirmed"));
			console.error("AuthModal error:", err);
		} finally {
			setLoading(false);
		}
	}
	async function handleResendConfirmation() {
		const normalizedEmail = email.trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
			setFieldErrors({ email: "Ingresa el correo con el que creaste la cuenta" });
			return;
		}
		resetState();
		setLoading(true);
		try {
			const { error: resendError } = await supabase.auth.resend({
				type: "signup",
				email: normalizedEmail,
				options: { emailRedirectTo: getRedirectUrl() }
			});
			if (resendError) throw resendError;
			setCanResendConfirmation(true);
			setInfo("Enviamos un nuevo correo de verificación. Usa únicamente el enlace más reciente.");
		} catch (err) {
			setCanResendConfirmation(true);
			setError(getAuthErrorMessage(err));
		} finally {
			setLoading(false);
		}
	}
	async function handleGoogle() {
		resetState();
		setLoading(true);
		try {
			setPendingOAuthRedirect();
			const { data, error } = await supabase.auth.signInWithOAuth({
				provider: "google",
				options: {
					redirectTo: getRedirectUrl(),
					skipBrowserRedirect: true
				}
			});
			if (error) {
				clearPendingOAuthRedirect();
				throw error;
			}
			if (!data.url) {
				clearPendingOAuthRedirect();
				throw new Error("No se pudo iniciar la redirección a Google. Inténtalo nuevamente.");
			}
			track("login", {
				eventName: "google_oauth_redirect",
				metadata: { method: "google" }
			});
			window.location.assign(data.url);
		} catch (err) {
			clearPendingOAuthRedirect();
			setError(getAuthErrorMessage(err));
			setLoading(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-[100] grid place-items-center p-4 animate-fade-up",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 bg-black/70",
			onClick: () => closeModal(),
			"aria-hidden": "true"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "auth-modal-title",
			className: "relative w-full max-w-md rounded-2xl glass-card p-6 sm:p-8 border border-violet-2/30 max-h-[92vh] overflow-y-auto",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => closeModal(),
					disabled: loading,
					className: "absolute top-4 right-4 p-1.5 rounded-lg text-white/78 hover:text-white hover:bg-white/5",
					"aria-label": "Cerrar",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-5 h-5" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center mb-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						id: "auth-modal-title",
						className: "font-display text-3xl text-white uppercase tracking-wide",
						children: mode === "login" ? "Iniciar Sesión" : mode === "signup" ? "Crear Cuenta" : mode === "forgot" ? "Recuperar Contraseña" : "Nueva Contraseña"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-white/78",
						children: mode === "login" ? "Accede a tu cuenta para comprar" : mode === "signup" ? "Regístrate para acceder a la tienda" : mode === "forgot" ? "Te enviaremos un enlace a tu correo" : "Crea una contraseña nueva y segura para tu cuenta"
					})]
				}),
				mode !== "forgot" && mode !== "update" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: handleGoogle,
					disabled: loading,
					className: "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-white/90 disabled:opacity-60 transition",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
						className: "w-5 h-5",
						viewBox: "0 0 48 48",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								fill: "#EA4335",
								d: "M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								fill: "#4285F4",
								d: "M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								fill: "#FBBC05",
								d: "M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
								fill: "#34A853",
								d: "M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
							})
						]
					}), "Continuar con Google"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "my-5 flex items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1 h-px bg-white/10" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-white/62 uppercase tracking-wider",
							children: "o"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1 h-px bg-white/10" })
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					noValidate: true,
					onSubmit: handleSubmit,
					className: "space-y-3",
					children: [
						mode === "signup" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "w-4 h-4" }),
							error: fieldErrors.nombre,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								required: true,
								value: nombre,
								onChange: (e) => setNombre(e.target.value),
								placeholder: "Nombre completo",
								autoComplete: "name",
								"aria-label": "Nombre completo",
								className: "w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/74 focus:outline-none focus:border-violet-2/60 transition"
							})
						}) }),
						mode !== "update" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "w-4 h-4" }),
							error: fieldErrors.email,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "email",
								required: true,
								value: email,
								onChange: (e) => setEmail(e.target.value),
								placeholder: "tu@email.com",
								autoComplete: mode === "signup" ? "email" : "username",
								"aria-label": "Correo electrónico",
								className: "w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/74 focus:outline-none focus:border-violet-2/60 transition"
							})
						}),
						mode === "signup" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "w-4 h-4" }),
							error: fieldErrors.whatsapp,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "tel",
								required: true,
								value: whatsapp,
								onChange: (e) => setWhatsapp(e.target.value),
								placeholder: "WhatsApp (con código de país)",
								autoComplete: "tel",
								"aria-label": "Número de WhatsApp",
								className: "w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/74 focus:outline-none focus:border-violet-2/60 transition"
							})
						}),
						mode !== "forgot" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "w-4 h-4" }),
							error: fieldErrors.password,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "password",
								required: true,
								minLength: mode === "login" ? 6 : 8,
								value: password,
								onChange: (e) => setPassword(e.target.value),
								placeholder: mode === "login" ? "Contraseña" : "Contraseña (mín. 8 caracteres)",
								autoComplete: mode === "login" ? "current-password" : "new-password",
								"aria-label": "Contraseña",
								className: "w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/74 focus:outline-none focus:border-violet-2/60 transition"
							})
						}),
						(mode === "signup" || mode === "update") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "w-4 h-4" }),
							error: fieldErrors.confirm,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "password",
								required: true,
								value: confirm,
								onChange: (e) => setConfirm(e.target.value),
								placeholder: "Confirmar contraseña",
								autoComplete: "new-password",
								"aria-label": "Confirmar contraseña",
								className: "w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/74 focus:outline-none focus:border-violet-2/60 transition"
							})
						}),
						mode === "signup" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-start gap-2 text-xs text-white/70 cursor-pointer select-none",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: terms,
								onChange: (e) => setTerms(e.target.checked),
								className: "mt-0.5 w-4 h-4 rounded accent-red-accent"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Acepto los términos y condiciones" })]
						}), fieldErrors.terms && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-[11px] text-red-accent",
							children: fieldErrors.terms
						})] }),
						mode === "login" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => changeMode("forgot"),
							className: "text-xs text-violet-2 hover:text-white block ml-auto",
							children: "¿Olvidaste tu contraseña?"
						}),
						error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							role: "alert",
							className: "text-xs text-red-accent bg-red-accent/10 border border-red-accent/30 rounded-lg px-3 py-2",
							children: error
						}),
						info && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							role: "status",
							className: "text-xs text-green-300 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2",
							children: info
						}),
						canResendConfirmation && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: handleResendConfirmation,
							disabled: loading,
							className: "w-full text-xs font-medium text-violet-2 hover:text-white disabled:opacity-50 transition",
							children: "Reenviar correo de confirmación"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "submit",
							disabled: loading,
							className: "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl gradient-violet text-white text-sm font-semibold hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed transition",
							children: [loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-4 h-4 animate-spin" }), mode === "login" ? "Entrar" : mode === "signup" ? "Crear cuenta" : mode === "forgot" ? "Enviar enlace" : "Guardar contraseña"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-5 text-center text-xs text-white/70",
					children: mode === "signup" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						"¿Ya tienes cuenta?",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => changeMode("login"),
							className: "text-violet-2 hover:text-white font-semibold",
							children: "Inicia sesión"
						})
					] }) : mode === "forgot" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => changeMode("login"),
						className: "text-violet-2 hover:text-white font-semibold",
						children: "← Volver al inicio de sesión"
					}) : mode === "update" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Contraseña restablecida mediante enlace seguro." }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						"¿No tienes cuenta?",
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => changeMode("signup"),
							className: "text-violet-2 hover:text-white font-semibold",
							children: "Regístrate"
						})
					] })
				})
			]
		})]
	});
}
function Field({ icon, error, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-white/62 pointer-events-none",
			children: icon
		}), children]
	}), error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "mt-1 text-[11px] text-red-accent px-1",
		children: error
	})] });
}
function isOpenNow(inicio, fin) {
	const [hi, mi] = inicio.split(":").map(Number);
	const [hf, mf] = fin.split(":").map(Number);
	const now = /* @__PURE__ */ new Date();
	const cur = now.getHours() * 60 + now.getMinutes();
	const start = hi * 60 + mi;
	const end = hf * 60 + mf;
	return end >= start ? cur >= start && cur <= end : cur >= start || cur <= end;
}
function ProductModal({ product, onClose, onAddToCart, onBuyNow, isBuying = false }) {
	const { playHover, playClick } = useFuturisticSound();
	(0, import_react.useEffect)(() => {
		if (!product) return;
		const onKey = (e) => e.key === "Escape" && onClose();
		document.addEventListener("keydown", onKey);
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prev;
		};
	}, [product, onClose]);
	const abierto = (0, import_react.useMemo)(() => product ? isOpenNow(product.horario_atencion_inicio, product.horario_atencion_fin) : false, [product]);
	if (!product) return null;
	const waMessage = encodeURIComponent(buildWhatsAppMessage(product));
	`${product.whatsapp_contacto}${waMessage}`;
	const inquiryHref = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildProductInquiryWhatsAppMessage(product))}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 animate-fade-in",
		onClick: onClose,
		role: "dialog",
		"aria-modal": "true",
		"aria-labelledby": "product-modal-title",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-black/80 backdrop-blur-sm" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			onClick: (e) => e.stopPropagation(),
			className: "relative w-full h-[100dvh] sm:h-[min(86dvh,700px)] sm:max-w-4xl bg-[#0d0d14] border-y sm:border border-white/10 overflow-hidden animate-scale-in flex flex-col sm:grid sm:grid-cols-2 shadow-2xl sm:rounded-3xl",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => {
						playClick();
						onClose();
					},
					onMouseEnter: playHover,
					"aria-label": "Cerrar",
					className: "absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-black/50 border border-white/15 grid place-items-center text-white/80 hover:text-white hover:border-white/30",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-4 h-4" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "relative shrink-0 sm:h-full sm:min-h-0 overflow-hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative h-44 sm:h-full min-h-[160px] bg-gradient-to-br from-red-accent/50 via-violet/40 to-black overflow-hidden flex items-center justify-center",
						children: [product.image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: product.image,
							alt: product.name,
							className: "w-full h-full object-cover opacity-80"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "absolute inset-0 grid place-items-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-24 h-24 sm:w-36 sm:h-36 rounded-3xl bg-white/10 border border-white/20 grid place-items-center",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "w-12 h-12 sm:w-16 sm:h-16 text-white/90" })
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "absolute top-3 left-3 max-w-[70%] truncate px-3 py-1.5 rounded-full bg-black/60 border border-white/15 text-[10px] font-bold tracking-wider text-white uppercase",
							children: product.shortLabel ?? product.name
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 min-h-0 sm:h-full flex flex-col bg-[#0d0d14]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4 flex-1 min-h-0 overflow-touch scrollbar-none sm:scrollbar-thin",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								id: "product-modal-title",
								className: "font-display text-2xl sm:text-3xl text-white leading-tight",
								children: product.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "mt-1 font-display text-3xl sm:text-4xl text-gradient-violet",
								children: ["S/ ", product.price.toFixed(2)]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 flex items-center justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2.5 min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-9 h-9 rounded-xl bg-white/5 border border-white/10 grid place-items-center shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "w-4 h-4 text-white/70" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[10px] uppercase tracking-wider text-white/70",
											children: "Horario de atención"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-sm text-white font-semibold truncate",
											children: [
												"De ",
												product.horario_atencion_inicio,
												" a ",
												product.horario_atencion_fin
											]
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: `shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${abierto ? "bg-green-500/20 border border-green-500/40 text-green-300" : "bg-white/5 border border-white/15 text-white/78"}`,
									children: [abierto ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "w-3 h-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "w-3 h-3" }), abierto ? "Abierto" : "Cerrado"]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-white/[0.04] border border-white/10 p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] uppercase tracking-wider text-white/70 mb-2",
									children: "Descripción del producto"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm text-white/80 leading-relaxed whitespace-pre-line",
									children: product.descripcion_larga
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-gradient-to-br from-red-accent/10 to-violet/10 border border-white/10 p-4 flex items-start gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "w-4 h-4 text-red-accent mt-0.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs text-white/75 leading-relaxed",
									children: [
										"Activación por WhatsApp:",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-white font-semibold",
											children: ["+", product.whatsapp_contacto]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
										"Cualquier duda hacerla de preferencia antes de realizar la compra."
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-2xl bg-white/[0.04] border border-white/10 p-3.5 flex items-center gap-3",
								children: [
									product.supplier_avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProviderAvatar, {
										src: product.supplier_avatar_url,
										effect: product.supplier_avatar_effect ?? "none",
										verified: product.supplier_verified ?? false,
										size: "sm",
										alt: `Avatar de ${product.vendedor}`,
										className: "shrink-0"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-11 h-11 rounded-full gradient-violet grid place-items-center shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-white font-bold text-sm",
											children: product.vendedor.slice(0, 2).toUpperCase()
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-sm font-semibold text-white truncate",
												children: ["@", product.vendedor]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "w-4 h-4 text-red-accent fill-red-accent/30 shrink-0" })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] text-white/70",
											children: "Vendedor Autorizado"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										"aria-label": "Tienda verificada",
										className: "w-9 h-9 rounded-xl bg-white/5 border border-white/10 grid place-items-center text-white/70",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "w-4 h-4" })
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-2xl bg-white/[0.04] border border-white/10 p-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] uppercase tracking-wider text-white/70",
										children: "Duración"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-sm font-bold text-white",
										children: product.duracion
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-2xl bg-white/[0.04] border border-white/10 p-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] uppercase tracking-wider text-white/70",
										children: "Categoría"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-sm font-bold text-white capitalize",
										children: product.category
									})]
								})]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-4 sm:p-6 border-t border-white/10 bg-[#0d0d14] space-y-3 pb-safe-offset-4 shrink-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => {
									playClick();
									onAddToCart(product);
								},
								onMouseEnter: playHover,
								className: "w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl gradient-violet text-white text-sm font-bold hover:scale-[1.01] transition shadow-lg shadow-red-600/10",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "w-4 h-4" }),
									"Añadir al carrito — S/ ",
									product.price.toFixed(2)
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								disabled: isBuying,
								onClick: () => {
									if (isBuying) return;
									playClick();
									if (onBuyNow) onBuyNow(product);
									else {
										const whatsappUrl = `https://wa.me/${product.whatsapp_contacto}?text=${encodeURIComponent(buildWhatsAppMessage(product))}`;
										const link = document.createElement("a");
										link.href = whatsappUrl;
										link.target = "_blank";
										link.rel = "noopener noreferrer";
										link.className = "boton-comprar";
										link.click();
									}
								},
								onMouseEnter: playHover,
								className: "w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition disabled:cursor-not-allowed disabled:opacity-60",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "w-4 h-4" }), isBuying ? "Registrando pedido..." : "Comprar ahora"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
								href: inquiryHref,
								target: "_blank",
								rel: "noopener noreferrer",
								onClick: playClick,
								onMouseEnter: playHover,
								className: "w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#25D366] text-white text-sm font-bold hover:brightness-110 transition",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "w-4 h-4" }), "Consultar por WhatsApp"]
							})
						]
					})]
				})
			]
		})]
	});
}
var OUTPUT_SIZE = 512;
function AvatarUploader({ userId, fallbackInitials, onUploaded }) {
	const [currentUrl, setCurrentUrl] = (0, import_react.useState)(null);
	const [file, setFile] = (0, import_react.useState)(null);
	const [imgSrc, setImgSrc] = (0, import_react.useState)(null);
	const [zoom, setZoom] = (0, import_react.useState)(1);
	const [offset, setOffset] = (0, import_react.useState)({
		x: 0,
		y: 0
	});
	const [dragging, setDragging] = (0, import_react.useState)(false);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const dragStart = (0, import_react.useRef)(null);
	const imgRef = (0, import_react.useRef)(null);
	const inputRef = (0, import_react.useRef)(null);
	const path = `${userId}/avatar.png`;
	const loadCurrent = (0, import_react.useCallback)(async () => {
		try {
			const { data, error } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
			if (!error && data?.signedUrl) setCurrentUrl(`${data.signedUrl}&t=${Date.now()}`);
		} catch {
			setCurrentUrl(null);
		}
	}, [path]);
	(0, import_react.useEffect)(() => {
		loadCurrent();
	}, [loadCurrent]);
	function onPickFile(e) {
		const f = e.target.files?.[0];
		if (!f) return;
		if (!f.type.startsWith("image/")) {
			toast.error("Selecciona una imagen");
			return;
		}
		if (f.size > 8 * 1024 * 1024) {
			toast.error("Máximo 8MB");
			return;
		}
		setFile(f);
		setZoom(1);
		setOffset({
			x: 0,
			y: 0
		});
		const reader = new FileReader();
		reader.onload = () => setImgSrc(String(reader.result));
		reader.readAsDataURL(f);
	}
	function cancelEdit() {
		setFile(null);
		setImgSrc(null);
		setZoom(1);
		setOffset({
			x: 0,
			y: 0
		});
		if (inputRef.current) inputRef.current.value = "";
	}
	function onPointerDown(e) {
		e.target.setPointerCapture(e.pointerId);
		setDragging(true);
		dragStart.current = {
			x: e.clientX,
			y: e.clientY,
			ox: offset.x,
			oy: offset.y
		};
	}
	function onPointerMove(e) {
		if (!dragging || !dragStart.current) return;
		const dx = e.clientX - dragStart.current.x;
		const dy = e.clientY - dragStart.current.y;
		setOffset({
			x: dragStart.current.ox + dx,
			y: dragStart.current.oy + dy
		});
	}
	function onPointerUp(e) {
		setDragging(false);
		dragStart.current = null;
		e.target.releasePointerCapture(e.pointerId);
	}
	async function handleUpload() {
		if (!imgSrc || !imgRef.current) return;
		setUploading(true);
		try {
			const img = imgRef.current;
			const box = 320;
			const natW = img.naturalWidth;
			const natH = img.naturalHeight;
			const scale = Math.max(box / natW, box / natH) * zoom;
			const drawW = natW * scale;
			const drawH = natH * scale;
			const left = (box - drawW) / 2 + offset.x;
			const top = (box - drawH) / 2 + offset.y;
			const sx = (0 - left) / scale;
			const sy = (0 - top) / scale;
			const sSize = box / scale;
			const canvas = document.createElement("canvas");
			canvas.width = OUTPUT_SIZE;
			canvas.height = OUTPUT_SIZE;
			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("Canvas no soportado");
			ctx.imageSmoothingQuality = "high";
			ctx.drawImage(img, sx, sy, sSize, sSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
			const blob = await new Promise((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(/* @__PURE__ */ new Error("Error al procesar")), "image/png", .92));
			const { error } = await supabase.storage.from("avatars").upload(path, blob, {
				upsert: true,
				contentType: "image/png"
			});
			if (error) throw error;
			const { data: signed, error: signedError } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
			if (signedError) throw signedError;
			const url = signed?.signedUrl ? `${signed.signedUrl}&t=${Date.now()}` : null;
			if (url) setCurrentUrl(url);
			onUploaded?.(url ?? "");
			toast.success("Foto de perfil actualizada");
			cancelEdit();
		} catch (err) {
			const msg = err instanceof Error ? err.message : "No se pudo subir";
			toast.error(msg);
		} finally {
			setUploading(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
			className: "text-xs text-white/78 uppercase tracking-wider",
			children: "Foto de perfil"
		}), !imgSrc ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 bg-white/[0.04] grid place-items-center shrink-0",
					children: currentUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: currentUrl,
						alt: "Foto de perfil del usuario",
						className: "w-full h-full object-cover"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-white font-bold text-xl",
						children: fallbackInitials || "US"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => inputRef.current?.click(),
						className: "inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 hover:border-violet-2/40 text-white text-xs font-semibold transition",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Camera, { className: "w-4 h-4" }), currentUrl ? "Cambiar foto" : "Subir foto"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] text-white/62",
						children: "PNG o JPG · máx 8MB · recorte cuadrado"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: inputRef,
					type: "file",
					accept: "image/*",
					className: "hidden",
					onChange: onPickFile
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "rounded-xl border border-white/10 bg-white/[0.03] p-4 space-y-3",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-4 flex-col sm:flex-row",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-[320px] h-[320px] max-w-full rounded-full overflow-hidden bg-black/50 shrink-0 touch-none select-none cursor-grab active:cursor-grabbing mx-auto",
					onPointerDown,
					onPointerMove,
					onPointerUp,
					onPointerCancel: onPointerUp,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						ref: imgRef,
						src: imgSrc,
						alt: "Vista previa de tu foto de perfil",
						draggable: false,
						style: {
							position: "absolute",
							left: "50%",
							top: "50%",
							transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
							transformOrigin: "center center",
							minWidth: "100%",
							minHeight: "100%",
							maxWidth: "none",
							objectFit: "cover",
							pointerEvents: "none"
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 ring-2 ring-white/20 rounded-full pointer-events-none" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 w-full space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-xs text-white/78 mb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomIn, { className: "w-3.5 h-3.5" }), " Zoom"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "range",
							min: 1,
							max: 3,
							step: .01,
							value: zoom,
							onChange: (e) => setZoom(Number(e.target.value)),
							className: "w-full accent-red-accent"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-white/70",
							children: "Arrastra la imagen para ajustar la posición."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2 pt-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: handleUpload,
								disabled: uploading,
								className: "inline-flex items-center gap-2 px-4 py-2 rounded-xl gradient-violet text-white text-xs font-semibold disabled:opacity-60 hover:scale-[1.02] transition",
								children: [uploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "w-4 h-4" }), "Guardar foto"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: cancelEdit,
								disabled: uploading,
								className: "inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-white/80 text-xs font-semibold hover:text-white transition",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-4 h-4" }), "Cancelar"]
							})]
						})
					]
				})]
			})
		})]
	});
}
var STORAGE_KEY$1 = "cmd_cart_v1";
function load() {
	if (typeof window === "undefined") return EMPTY_STATE;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY$1);
		if (!raw) return { items: [] };
		const parsed = JSON.parse(raw);
		if (parsed && Array.isArray(parsed.items)) return { items: parsed.items };
	} catch {}
	return { items: [] };
}
var EMPTY_STATE = { items: [] };
var state = EMPTY_STATE;
var hydrated = false;
var listeners = /* @__PURE__ */ new Set();
function emit() {
	if (typeof window !== "undefined") try {
		window.localStorage.setItem(STORAGE_KEY$1, JSON.stringify(state));
	} catch {}
	listeners.forEach((l) => l());
}
function ensureHydrated() {
	if (!hydrated && typeof window !== "undefined") {
		state = load();
		hydrated = true;
	}
}
var cartStore = {
	subscribe(l) {
		ensureHydrated();
		listeners.add(l);
		return () => {
			listeners.delete(l);
		};
	},
	getState() {
		ensureHydrated();
		return state;
	},
	getServerState() {
		return EMPTY_STATE;
	},
	add(item, qty = 1) {
		ensureHydrated();
		if (state.items.find((i) => i.id === item.id)) state = { items: state.items.map((i) => i.id === item.id ? {
			...i,
			quantity: i.quantity + qty
		} : i) };
		else state = { items: [...state.items, {
			...item,
			quantity: qty
		}] };
		emit();
	},
	increment(id) {
		ensureHydrated();
		state = { items: state.items.map((i) => i.id === id ? {
			...i,
			quantity: i.quantity + 1
		} : i) };
		emit();
	},
	decrement(id) {
		ensureHydrated();
		const item = state.items.find((i) => i.id === id);
		if (!item) return;
		if (item.quantity <= 1) state = { items: state.items.filter((i) => i.id !== id) };
		else state = { items: state.items.map((i) => i.id === id ? {
			...i,
			quantity: i.quantity - 1
		} : i) };
		emit();
	},
	remove(id) {
		ensureHydrated();
		state = { items: state.items.filter((i) => i.id !== id) };
		emit();
	},
	clear() {
		ensureHydrated();
		state = { items: [] };
		emit();
	}
};
function useCart() {
	const s = (0, import_react.useSyncExternalStore)(cartStore.subscribe, cartStore.getState, cartStore.getServerState);
	const count = s.items.reduce((n, i) => n + i.quantity, 0);
	const total = s.items.reduce((n, i) => n + i.quantity * i.price, 0);
	return {
		items: s.items,
		count,
		total
	};
}
var FOCUSABLE = "a[href],area[href],button:not([disabled]),input:not([disabled]):not([type=\"hidden\"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex=\"-1\"])";
function CartDrawer({ open, onClose, onCheckout, checkoutPending = false }) {
	const { items, count, total } = useCart();
	const drawerRef = (0, import_react.useRef)(null);
	const restoreRef = (0, import_react.useRef)(null);
	const track = useAnalytics();
	(0, import_react.useEffect)(() => {
		if (!open) return;
		restoreRef.current = document.activeElement;
		const getFocusable = () => {
			const root = drawerRef.current;
			if (!root) return [];
			return Array.from(root.querySelectorAll(FOCUSABLE)).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);
		};
		const t = window.setTimeout(() => {
			(getFocusable()[0] ?? drawerRef.current)?.focus();
		}, 0);
		const onKey = (e) => {
			if (e.key === "Escape") {
				e.preventDefault();
				onClose();
				return;
			}
			if (e.key !== "Tab") return;
			const focusables = getFocusable();
			if (focusables.length === 0) {
				e.preventDefault();
				drawerRef.current?.focus();
				return;
			}
			const first = focusables[0];
			const last = focusables[focusables.length - 1];
			const active = document.activeElement;
			const inside = drawerRef.current?.contains(active ?? null);
			if (e.shiftKey) {
				if (!inside || active === first) {
					e.preventDefault();
					last.focus();
				}
			} else if (!inside || active === last) {
				e.preventDefault();
				first.focus();
			}
		};
		document.addEventListener("keydown", onKey);
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			window.clearTimeout(t);
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prev;
			restoreRef.current?.focus?.();
		};
	}, [open, onClose]);
	function handleClear() {
		if (items.length === 0) return;
		if (window.confirm("¿Vaciar todo el carrito?")) cartStore.clear();
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `fixed inset-0 z-[60] ${open ? "pointer-events-auto" : "pointer-events-none"}`,
		"aria-hidden": !open,
		inert: !open,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			onClick: onClose,
			className: `absolute inset-0 bg-black/60 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			ref: drawerRef,
			tabIndex: -1,
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": "cart-drawer-title",
			className: `absolute top-0 right-0 h-full w-full sm:max-w-md bg-[#0d0d14] border-l border-white/10 flex flex-col transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex items-center justify-between px-5 py-4 border-b border-white/10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-9 h-9 rounded-xl gradient-violet grid place-items-center",
							"aria-hidden": "true",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: "w-4 h-4 text-white" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "cart-drawer-title",
							className: "font-display text-lg text-white leading-none",
							children: "Tu Carrito"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[11px] text-white/70 mt-1",
							children: [
								count,
								" ",
								count === 1 ? "producto" : "productos"
							]
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onClose,
						"aria-label": "Cerrar carrito",
						className: "w-11 h-11 rounded-full bg-white/5 border border-white/10 grid place-items-center text-white hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
							"aria-hidden": "true",
							className: "w-4 h-4"
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex-1 overflow-y-auto",
					children: items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full grid place-items-center px-6 py-16 text-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-20 h-20 mx-auto rounded-2xl bg-white/[0.04] border border-white/10 grid place-items-center mb-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "w-9 h-9 text-white/62" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-white/70 mb-1",
								children: "Tu carrito está vacío"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-white/62 mb-5",
								children: "Agrega productos desde el catálogo."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: onClose,
								className: "inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-violet text-white text-xs font-bold hover:scale-[1.03] transition",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "w-4 h-4" }), " Ver tienda"]
							})
						] })
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "p-4 space-y-3",
						children: items.map((it) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "rounded-2xl bg-white/[0.04] border border-white/10 p-3 flex gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-14 h-14 rounded-xl bg-gradient-to-br from-red-accent/50 via-violet/40 to-black grid place-items-center shrink-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "w-6 h-6 text-white/90" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-semibold text-white leading-snug line-clamp-2",
										children: it.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => {
											track("remove_from_cart", {
												eventName: "remove_from_cart",
												metadata: {
													productId: it.id,
													productName: it.name,
													price: it.price,
													quantity: it.quantity
												}
											});
											cartStore.remove(it.id);
										},
										"aria-label": `Eliminar ${it.name} del carrito`,
										className: "shrink-0 w-11 h-11 rounded-lg bg-red-500/10 border border-red-500/30 grid place-items-center text-red-300 hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 transition",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
											"aria-hidden": "true",
											className: "w-4 h-4"
										})
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 flex items-center justify-between gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1",
										role: "group",
										"aria-label": `Cantidad de ${it.name}`,
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => cartStore.decrement(it.id),
												"aria-label": `Disminuir cantidad de ${it.name}`,
												className: "w-9 h-9 rounded-full grid place-items-center text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70 transition",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {
													"aria-hidden": "true",
													className: "w-3.5 h-3.5"
												})
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												"aria-live": "polite",
												className: "min-w-[28px] text-center text-sm font-bold text-white tabular-nums",
												children: it.quantity
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												onClick: () => cartStore.increment(it.id),
												"aria-label": `Aumentar cantidad de ${it.name}`,
												className: "w-9 h-9 rounded-full grid place-items-center text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70 transition",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
													"aria-hidden": "true",
													className: "w-3.5 h-3.5"
												})
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-display text-base text-gradient-violet",
										"aria-label": `Subtotal ${(it.price * it.quantity).toFixed(2)} soles`,
										children: ["S/ ", (it.price * it.quantity).toFixed(2)]
									})]
								})]
							})]
						}, it.id))
					})
				}),
				items.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
					className: "border-t border-white/10 p-4 bg-[#0d0d14]/95 space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs uppercase tracking-wider text-white/80",
								children: "Total"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-display text-2xl text-gradient-violet",
								"aria-live": "polite",
								children: ["S/ ", total.toFixed(2)]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							disabled: checkoutPending,
							onClick: () => {
								if (checkoutPending) return;
								track("begin_checkout", {
									eventName: "begin_checkout",
									metadata: {
										value: total,
										itemCount: items.length
									}
								});
								onCheckout();
							},
							className: "w-full inline-flex items-center justify-center gap-2 min-h-12 py-3 rounded-xl gradient-violet text-white text-sm font-bold hover:scale-[1.01] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:cursor-not-allowed disabled:opacity-60",
							children: checkoutPending ? "Registrando pedido..." : "Finalizar Compra"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								track("remove_from_cart", {
									eventName: "clear_cart",
									metadata: {
										itemCount: items.length,
										value: total
									}
								});
								handleClear();
							},
							className: "w-full inline-flex items-center justify-center gap-2 min-h-11 py-2.5 rounded-xl bg-transparent border border-white/20 text-white/85 text-xs font-semibold hover:border-red-500/60 hover:text-red-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
								"aria-hidden": "true",
								className: "w-3.5 h-3.5"
							}), " Vaciar Carrito"]
						})
					]
				})
			]
		})]
	});
}
var GROUPS = [
	{
		title: "Navegación",
		items: [
			{
				keys: ["1"],
				label: "Ir a Tienda",
				desc: "Ver catálogo de productos",
				icon: LayoutGrid
			},
			{
				keys: ["2"],
				label: "Mis Compras",
				desc: "Historial de pedidos",
				icon: Package,
				requiresAuth: true
			},
			{
				keys: ["3"],
				label: "Mi Perfil",
				desc: "Editar tus datos",
				icon: User,
				requiresAuth: true
			},
			{
				keys: ["G", "H"],
				label: "Ir al inicio",
				desc: "Volver a la landing",
				icon: House
			}
		]
	},
	{
		title: "Acciones",
		items: [{
			keys: ["/"],
			label: "Enfocar buscador",
			desc: "Buscar productos",
			icon: Search
		}, {
			keys: ["C"],
			label: "Carrito",
			desc: "Abrir / cerrar el drawer",
			icon: ShoppingCart
		}]
	},
	{
		title: "General",
		items: [{
			keys: ["?"],
			label: "Mostrar ayuda",
			desc: "Esta ventana",
			icon: CircleQuestionMark
		}, {
			keys: ["Esc"],
			label: "Cerrar",
			desc: "Cierra modales, drawers y ayuda",
			icon: X
		}]
	}
];
function isEditable(el) {
	if (!(el instanceof HTMLElement)) return false;
	const tag = el.tagName;
	return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}
function Kbd$1({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
		className: "inline-flex items-center justify-center text-[11px] font-mono font-semibold px-2 py-1 min-w-[28px] h-7 rounded-md bg-gradient-to-b from-white/[0.09] to-white/[0.04] border border-white/15 text-white",
		children
	});
}
function KeyboardShortcuts({ onFocusSearch, onToggleCart, onGoPanel, onGoHome, authed, onOpenTutorial }) {
	const [helpOpen, setHelpOpen] = (0, import_react.useState)(false);
	const [query, setQuery] = (0, import_react.useState)("");
	const gPressed = (0, import_react.useRef)(null);
	const searchRef = (0, import_react.useRef)(null);
	const dialogRef = (0, import_react.useRef)(null);
	const lastFocused = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.key === "Escape" && helpOpen) {
				setHelpOpen(false);
				return;
			}
			if (e.metaKey || e.ctrlKey || e.altKey) return;
			if (isEditable(e.target)) return;
			if (e.key === "?" || e.shiftKey && e.key === "/") {
				e.preventDefault();
				setHelpOpen((v) => !v);
				return;
			}
			if (e.key.toLowerCase() === "g") {
				gPressed.current = Date.now();
				return;
			}
			if (e.key.toLowerCase() === "h" && gPressed.current && Date.now() - gPressed.current < 1e3) {
				gPressed.current = null;
				e.preventDefault();
				onGoHome();
				return;
			}
			gPressed.current = null;
			switch (e.key) {
				case "/":
					e.preventDefault();
					onFocusSearch();
					break;
				case "c":
				case "C":
					e.preventDefault();
					onToggleCart();
					break;
				case "1":
					e.preventDefault();
					onGoPanel("tienda");
					break;
				case "2":
					if (authed) {
						e.preventDefault();
						onGoPanel("compras");
					}
					break;
				case "3":
					if (authed) {
						e.preventDefault();
						onGoPanel("perfil");
					}
					break;
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [
		helpOpen,
		authed,
		onFocusSearch,
		onToggleCart,
		onGoPanel,
		onGoHome
	]);
	(0, import_react.useEffect)(() => {
		if (!helpOpen) return;
		lastFocused.current = document.activeElement;
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const t = window.setTimeout(() => searchRef.current?.focus(), 40);
		return () => {
			document.body.style.overflow = prevOverflow;
			window.clearTimeout(t);
			lastFocused.current?.focus?.();
		};
	}, [helpOpen]);
	(0, import_react.useEffect)(() => {
		if (!helpOpen) return;
		const onTab = (e) => {
			if (e.key !== "Tab" || !dialogRef.current) return;
			const focusables = dialogRef.current.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex=\"-1\"])");
			if (focusables.length === 0) return;
			const first = focusables[0];
			const last = focusables[focusables.length - 1];
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first.focus();
			}
		};
		window.addEventListener("keydown", onTab);
		return () => window.removeEventListener("keydown", onTab);
	}, [helpOpen]);
	const filteredGroups = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		return GROUPS.map((g) => ({
			...g,
			items: g.items.filter((it) => {
				if (it.requiresAuth && !authed) return false;
				if (!q) return true;
				return it.label.toLowerCase().includes(q) || it.desc?.toLowerCase().includes(q) || it.keys.join(" ").toLowerCase().includes(q);
			})
		})).filter((g) => g.items.length > 0);
	}, [query, authed]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick: () => setHelpOpen(true),
		"aria-label": "Mostrar atajos de teclado",
		title: "Atajos de teclado (?)",
		className: "fixed bottom-4 left-4 z-40 hidden sm:inline-flex items-center gap-2 h-11 px-3 rounded-full bg-white/[0.04] border border-white/10 text-white/70 hover:text-white hover:border-red-600/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/60",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Keyboard, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
			className: "text-xs font-mono px-1.5 py-0.5 rounded bg-white/10 border border-white/10",
			children: "?"
		})]
	}), helpOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		role: "dialog",
		"aria-modal": "true",
		"aria-labelledby": "kbd-help-title",
		"aria-describedby": "kbd-help-desc",
		className: "fixed inset-0 z-[70] grid place-items-center p-4 animate-in fade-in duration-150",
		onClick: () => setHelpOpen(false),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-black/75" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: dialogRef,
			className: "relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-[#120a15]/98 to-[#0a060c]/98 animate-in zoom-in-95 duration-200",
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-4 p-5 sm:p-6 border-b border-white/5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-10 h-10 shrink-0 rounded-xl grid place-items-center bg-red-600-600/30",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Command, { className: "w-4 h-4 text-white" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								id: "kbd-help-title",
								className: "font-display text-xl sm:text-2xl text-white uppercase tracking-wide leading-none",
								children: "Atajos de teclado"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								id: "kbd-help-desc",
								className: "text-xs text-white/70 mt-1",
								children: "Navega más rápido usando el teclado"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setHelpOpen(false),
						"aria-label": "Cerrar ayuda",
						className: "w-9 h-9 shrink-0 grid place-items-center rounded-lg text-white/78 hover:text-white hover:bg-white/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/60",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-4 h-4" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-5 sm:px-6 pt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/62 pointer-events-none" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: searchRef,
							type: "text",
							value: query,
							onChange: (e) => setQuery(e.target.value),
							placeholder: "Buscar atajo...",
							"aria-label": "Buscar atajo",
							className: "w-full h-10 pl-9 pr-3 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/58 focus:outline-none focus:border-red-600/50 focus:bg-white/[0.06] transition"
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-5",
					children: filteredGroups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center py-10 text-sm text-white/62",
						children: [
							"No se encontraron atajos para \"",
							query,
							"\"."
						]
					}) : filteredGroups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-[11px] font-semibold uppercase tracking-[0.14em] text-white/62 mb-2 px-1",
						children: group.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "rounded-xl border border-white/[0.06] bg-white/[0.015] divide-y divide-white/[0.05] overflow-hidden",
						children: group.items.map((s) => {
							const Icon = s.icon;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.025] transition",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-8 h-8 shrink-0 rounded-lg grid place-items-center bg-white/[0.04] border border-white/[0.06] text-red-600",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "w-4 h-4" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1 min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm text-white/90 font-medium leading-tight",
											children: s.label
										}), s.desc && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs text-white/66 mt-0.5 leading-tight truncate",
											children: s.desc
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex items-center gap-1 shrink-0",
										children: s.keys.map((k, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1",
											children: [i > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] text-white/74 font-mono",
												children: "luego"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kbd$1, { children: k })]
										}, i))
									})
								]
							}, s.label);
						})
					})] }, group.title))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-t border-white/5 bg-white/[0.015] flex-wrap",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-white/62 leading-tight flex-1 min-w-0",
						children: "Los atajos se ignoran mientras escribes en un campo de texto."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 shrink-0",
						children: [onOpenTutorial && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								setHelpOpen(false);
								onOpenTutorial();
							},
							className: "inline-flex items-center gap-1.5 h-8 px-3 rounded-full gradient-violet text-white text-[11px] font-semibold hover:scale-[1.03] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CirclePlay, { className: "w-3.5 h-3.5" }), "Ver tutorial"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "hidden sm:flex items-center gap-1.5 text-[11px] text-white/62",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kbd$1, { children: "Esc" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "cerrar" })]
						})]
					})]
				})
			]
		})]
	})] });
}
var STORAGE_KEY = "cmd:kbd-tutorial-done";
var STEPS = [
	{
		title: "Atajos de teclado",
		desc: "CMD Streaming se puede controlar sin salir del teclado. En 30 segundos aprendes los atajos esenciales.",
		keys: [],
		icon: Sparkles,
		tip: "Puedes cerrar y retomar cuando quieras."
	},
	{
		title: "Buscar productos",
		desc: "Pulsa la barra diagonal para saltar directamente al buscador de la tienda.",
		keys: ["/"],
		icon: Search,
		tip: "Funciona desde cualquier parte del panel."
	},
	{
		title: "Abrir el carrito",
		desc: "Presiona C para abrir o cerrar el drawer del carrito sin usar el mouse.",
		keys: ["C"],
		icon: ShoppingCart,
		tip: "Vuelve a pulsar C para cerrarlo."
	},
	{
		title: "Cambiar de panel",
		desc: "Usa los números para saltar entre Tienda, Mis Compras y Mi Perfil.",
		keys: [
			"1",
			"2",
			"3"
		],
		icon: LayoutGrid,
		tip: "2 y 3 requieren sesión iniciada."
	},
	{
		title: "Volver al inicio",
		desc: "Pulsa G y luego H para regresar a la landing principal.",
		keys: ["G", "H"],
		icon: House,
		tip: "Es una secuencia: presiona G, después H."
	},
	{
		title: "Ayuda a mano",
		desc: "Con ? abres el buscador de todos los atajos disponibles.",
		keys: ["?"],
		icon: CircleQuestionMark,
		tip: "Esc cierra cualquier modal o drawer."
	}
];
function Kbd({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
		className: "inline-flex items-center justify-center text-sm font-mono font-semibold px-2.5 py-1.5 min-w-[36px] h-9 rounded-lg bg-gradient-to-b from-white/[0.12] to-white/[0.04] border border-white/20 text-white",
		children
	});
}
/** Onboarding walkthrough for keyboard shortcuts. */
function KeyboardTutorial({ open, onClose }) {
	const [step, setStep] = (0, import_react.useState)(0);
	const dialogRef = (0, import_react.useRef)(null);
	const lastFocused = (0, import_react.useRef)(null);
	const total = STEPS.length;
	const current = STEPS[step];
	const isLast = step === total - 1;
	const Icon = current?.icon ?? Sparkles;
	(0, import_react.useEffect)(() => {
		if (open) setStep(0);
	}, [open]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		lastFocused.current = document.activeElement;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const t = window.setTimeout(() => dialogRef.current?.focus(), 40);
		return () => {
			document.body.style.overflow = prev;
			window.clearTimeout(t);
			lastFocused.current?.focus?.();
		};
	}, [open]);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		const onKey = (e) => {
			if (e.key === "Escape") {
				e.preventDefault();
				finish(false);
				return;
			}
			if (e.key === "ArrowRight") {
				e.preventDefault();
				next();
				return;
			}
			if (e.key === "ArrowLeft") {
				e.preventDefault();
				prev();
				return;
			}
			if (e.key === "Enter") {
				e.preventDefault();
				next();
				return;
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, step]);
	function next() {
		if (isLast) finish(true);
		else setStep((s) => Math.min(total - 1, s + 1));
	}
	function prev() {
		setStep((s) => Math.max(0, s - 1));
	}
	function finish(completed) {
		if (completed) try {
			localStorage.setItem(STORAGE_KEY, "1");
		} catch {}
		onClose();
	}
	if (!open || !current) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		role: "dialog",
		"aria-modal": "true",
		"aria-labelledby": "kbd-tut-title",
		className: "fixed inset-0 z-[80] grid place-items-center p-4 animate-in fade-in duration-150",
		onClick: () => finish(false),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-black/80" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: dialogRef,
			tabIndex: -1,
			onClick: (e) => e.stopPropagation(),
			className: "relative w-full max-w-lg rounded-2xl border border-white/10 bg-gradient-to-b from-[#120a15]/98 to-[#0a060c]/98 animate-in zoom-in-95 duration-200 focus:outline-none",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "h-1 w-full rounded-t-2xl bg-white/[0.04] overflow-hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "h-full gradient-violet transition-all duration-500 ease-out",
						style: { width: `${(step + 1) / total * 100}%` }
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-4 px-6 pt-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Command, { className: "w-3.5 h-3.5 text-red-accent" }),
							"Tutorial",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-white/74",
								children: "·"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-white/70",
								children: [
									step + 1,
									" / ",
									total
								]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => finish(false),
						"aria-label": "Cerrar tutorial",
						className: "w-8 h-8 grid place-items-center rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-accent/60",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-4 h-4" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-6 pt-6 pb-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-14 h-14 rounded-2xl grid place-items-center gradient-violet mb-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "w-6 h-6 text-white" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "kbd-tut-title",
							className: "font-display text-2xl sm:text-3xl text-white uppercase tracking-wide leading-tight",
							children: current.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-white/70 leading-relaxed",
							children: current.desc
						}),
						current.keys.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-5 flex flex-wrap items-center gap-2",
							children: current.keys.map((k, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [i > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[11px] uppercase tracking-wider text-white/62 font-semibold",
									children: "luego"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kbd, { children: k })]
							}, i))
						}),
						current.tip && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-xs text-white/70 border-l-2 border-red-accent/60 pl-3 leading-relaxed",
							children: current.tip
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center justify-center gap-1.5 py-4",
					children: STEPS.map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setStep(i),
						"aria-label": `Ir al paso ${i + 1}`,
						className: `h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-red-accent" : i < step ? "w-1.5 bg-white/50" : "w-1.5 bg-white/15"}`
					}, i))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3 px-6 pb-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => finish(false),
						className: "text-xs text-white/70 hover:text-white/80 transition px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
						children: "Saltar"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: prev,
							disabled: step === 0,
							className: "inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-white/10 bg-white/[0.03] text-sm text-white/80 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:hover:border-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-accent/60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "w-4 h-4" }), "Anterior"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: next,
							className: "inline-flex items-center gap-1.5 h-10 px-5 rounded-full gradient-violet text-white text-sm font-semibold hover:scale-[1.03] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
							children: isLast ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-4 h-4" }), "Entendido"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: ["Siguiente", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "w-4 h-4" })] })
						})]
					})]
				})
			]
		})]
	});
}
/**
* Fondo global de la landing/tienda.
*
* Usa encuadres del mismo arte para conservar los detalles en escritorio y móvil.
*/
function PlatformBackground() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"aria-hidden": "true",
		className: "pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-[#050304]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("picture", {
				className: "absolute inset-0 block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("source", {
					media: "(min-width: 768px)",
					srcSet: "/landing/cmd-red-background-desktop.png"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: "/landing/cmd-red-background-mobile.png",
					alt: "",
					className: "h-full w-full object-cover object-center opacity-90 md:opacity-80",
					decoding: "async",
					fetchPriority: "high"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-[linear-gradient(to_bottom,rgba(5,3,4,0.42),rgba(5,3,4,0.3)_35%,rgba(5,3,4,0.58))]" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(5,3,4,0.58)_0%,rgba(5,3,4,0.2)_58%,rgba(5,3,4,0.45)_100%)]" })
		]
	});
}
var useHydrated = () => {
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setHydrated(true), []);
	return hydrated;
};
var FallingStars = () => {
	const hydrated = useHydrated();
	const stars = (0, import_react.useMemo)(() => {
		return Array.from({ length: 18 }).map((_, i) => ({
			id: i,
			left: `${Math.random() * 100}%`,
			top: `${Math.random() * 100}%`,
			delay: `${Math.random() * 5}s`,
			duration: `${3 + Math.random() * 4}s`,
			size: `${1 + Math.random() * 2}px`
		}));
	}, []);
	if (!hydrated) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		"aria-hidden": "true",
		className: "ambient-falling-stars fixed inset-0 pointer-events-none z-[-5] overflow-hidden",
		children: stars.map((star) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `absolute bg-white rounded-full animate-falling-star ${star.id >= 10 ? "hidden sm:block" : ""}`,
			style: {
				left: star.left,
				top: "-10px",
				width: star.size,
				height: star.size,
				animationDelay: star.delay,
				animationDuration: star.duration,
				opacity: 0
			}
		}, star.id))
	});
};
var FuturisticBackground = () => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		"aria-hidden": "true",
		className: "fixed inset-0 pointer-events-none z-[-10] overflow-hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 hidden bg-[linear-gradient(rgba(220,38,38,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(220,38,38,0.05)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] sm:block" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute top-0 left-1/2 hidden h-[40%] w-[120%] -translate-x-1/2 rounded-[100%] bg-red-accent/10 blur-3xl animate-arc sm:block" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute bottom-0 left-1/2 hidden h-[30%] w-[100%] -translate-x-1/2 rounded-[100%] bg-violet-2/5 blur-3xl animate-arc sm:block",
				style: { animationDelay: "-3s" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 hidden bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[size:100%_4px] pointer-events-none opacity-20 md:block" })
		]
	});
};
var itemSchema = objectType({
	id: stringType().min(1).max(120),
	name: stringType().min(1).max(200),
	quantity: numberType().int().min(1).max(20)
});
/**
* Crea los pedidos del usuario autenticado.
* El precio NUNCA se toma del cliente: se resuelve contra la tabla de productos
* o el catálogo estático (productos mock).
* No entrega credenciales — la entrega ocurre solo tras confirmar el pago.
*/
var createOrders = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).validator((d) => objectType({ items: arrayType(itemSchema).min(1).max(20) }).parse(d)).handler(createSsrRpc("b2e8895c567dd02e272bfc97fdca68290a46c3e6cd61885eaecdbb8f47f774c6"));
var Route = createFileRoute("/tienda")({
	head: () => ({
		meta: [
			{ title: "Tienda CMD Streaming — Cuentas Premium y Licencias" },
			{
				name: "description",
				content: "Explora nuestro catálogo de cuentas premium para streaming, herramientas de IA y licencias de software al mejor precio."
			},
			{
				property: "og:title",
				content: "Tienda CMD Streaming — Cuentas Premium"
			},
			{
				property: "og:description",
				content: "Netflix, Disney+, ChatGPT Plus y más con entrega inmediata."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				property: "og:url",
				content: "https://cmdstreaming.pe/tienda"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [{
			rel: "canonical",
			href: "https://cmdstreaming.pe/tienda"
		}],
		scripts: [{
			type: "application/ld+json",
			children: JSON.stringify({
				"@context": "https://schema.org",
				"@type": "ItemList",
				name: "Catálogo CMD Streaming",
				itemListElement: products.map((p, i) => ({
					"@type": "ListItem",
					position: i + 1,
					item: {
						"@type": "Product",
						name: p.name,
						category: p.category,
						offers: {
							"@type": "Offer",
							price: p.price.toFixed(2),
							priceCurrency: "PEN",
							availability: "https://schema.org/InStock"
						}
					}
				}))
			})
		}, {
			type: "application/ld+json",
			children: JSON.stringify({
				"@context": "https://schema.org",
				"@type": "BreadcrumbList",
				itemListElement: [{
					"@type": "ListItem",
					position: 1,
					name: "Inicio",
					item: "/"
				}, {
					"@type": "ListItem",
					position: 2,
					name: "Tienda",
					item: "/tienda"
				}]
			})
		}]
	}),
	component: TiendaPage
});
function normalizeOrderStatus(status) {
	if (status === "pagado" || status === "entregado" || status === "cancelado") return status;
	return "pendiente";
}
var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function getProductStock(productId, stockLevels) {
	const id = String(productId);
	if (!UUID_RE.test(id)) return {
		available: true,
		count: null
	};
	const count = stockLevels[id] ?? 0;
	return {
		available: count > 0,
		count
	};
}
function consumePendingOAuthRedirect() {
	try {
		if (window.sessionStorage.getItem("cmd-auth-redirect-pending") !== "1") return false;
		window.sessionStorage.removeItem("cmd-auth-redirect-pending");
		return true;
	} catch {
		return false;
	}
}
function getSafeExternalUrl(value) {
	if (!value) return null;
	try {
		const url = new URL(value);
		return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
	} catch {
		return null;
	}
}
async function copyText(value, successMessage = "Copiado al portapapeles") {
	try {
		if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
		else {
			const textarea = document.createElement("textarea");
			textarea.value = value;
			textarea.style.position = "fixed";
			textarea.style.opacity = "0";
			document.body.appendChild(textarea);
			textarea.select();
			const copied = document.execCommand("copy");
			textarea.remove();
			if (!copied) throw new Error("Clipboard copy was rejected");
		}
		toast.success(successMessage);
	} catch {
		toast.error("No se pudo copiar. Selecciona el texto manualmente.");
	}
}
function openWhatsApp(url) {
	if (!window.open(url, "_blank", "noopener,noreferrer")) toast.info("Permite las ventanas emergentes para continuar por WhatsApp.");
}
function TiendaPage() {
	const [session, setSession] = (0, import_react.useState)(null);
	const [authOpen, setAuthOpen] = (0, import_react.useState)(false);
	const [authMode, setAuthMode] = (0, import_react.useState)("login");
	const [activeCat, setActiveCat] = (0, import_react.useState)("todo");
	const [query, setQuery] = (0, import_react.useState)("");
	const [sort, setSort] = (0, import_react.useState)("destacado");
	const { count: cartCount, items: cartItems, total: cartTotal } = useCart();
	const [cartOpen, setCartOpen] = (0, import_react.useState)(false);
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [panel, setPanel] = (0, import_react.useState)("tienda");
	const [profile, setProfile] = (0, import_react.useState)(null);
	const [orders, setOrders] = (0, import_react.useState)([]);
	const [loadingOrders, setLoadingOrders] = (0, import_react.useState)(false);
	const [isOrderSubmitting, setIsOrderSubmitting] = (0, import_react.useState)(false);
	(0, import_react.useRef)(null);
	const searchRef = (0, import_react.useRef)(null);
	const router = useRouter();
	const queryClient = useQueryClient();
	const [tutorialOpen, setTutorialOpen] = (0, import_react.useState)(false);
	const [isDragging, setIsDragging] = (0, import_react.useState)(false);
	(0, import_react.useRef)(null);
	const track = useAnalytics();
	const createOrdersFn = useServerFn(createOrders);
	const isAdminHook = useIsAdmin();
	const isSupplier = isAdminHook.isSupplier;
	const isAdmin = isAdminHook.isAdmin;
	const { playHover, playClick } = useFuturisticSound();
	const [selectedDelivery, setSelectedDelivery] = (0, import_react.useState)(null);
	const [showPass, setShowPass] = (0, import_react.useState)(false);
	const [isAdminActive, setIsAdminActive] = (0, import_react.useState)(true);
	const [supplierAvatarFailed, setSupplierAvatarFailed] = (0, import_react.useState)(false);
	const ordersRequestId = (0, import_react.useRef)(0);
	const orderSubmissionRef = (0, import_react.useRef)(false);
	const [isSigningOut, setIsSigningOut] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let active = true;
		const redirectOAuthUser = async (authSession) => {
			if (!authSession || !consumePendingOAuthRedirect()) return;
			const to = await getAuthDestination(authSession.user.id);
			if (active && to !== "/tienda") await router.navigate({ to });
		};
		(async () => {
			const { data, error } = await supabase.auth.getSession();
			if (!active) return;
			if (error) {
				console.warn("[Auth] No se pudo recuperar la sesión local.", error);
				setSession(null);
				return;
			}
			setSession(data.session);
			redirectOAuthUser(data.session);
		})();
		const { data: sub } = supabase.auth.onAuthStateChange((event, nextSession) => {
			if (!active) return;
			setSession(nextSession);
			if (event === "PASSWORD_RECOVERY") {
				setAuthMode("update");
				setAuthOpen(true);
			}
			if (event === "SIGNED_IN") redirectOAuthUser(nextSession);
		});
		return () => {
			active = false;
			sub.subscription.unsubscribe();
		};
	}, [router]);
	(0, import_react.useEffect)(() => {
		const getStatus = async () => {
			const { data } = await supabase.from("admin_status").select("is_active").limit(1).maybeSingle();
			if (data) setIsAdminActive(data.is_active);
		};
		getStatus();
		const channel = supabase.channel("admin_status_changes").on("postgres_changes", {
			event: "UPDATE",
			schema: "public",
			table: "admin_status"
		}, (payload) => {
			setIsAdminActive(payload.new.is_active);
		}).subscribe();
		return () => {
			channel.unsubscribe();
		};
	}, []);
	const userId = session?.user.id;
	const [profileError, setProfileError] = (0, import_react.useState)(null);
	const [isCreatingProfile, setIsCreatingProfile] = (0, import_react.useState)(false);
	const fetchProfile = (0, import_react.useCallback)(async () => {
		if (!userId) return;
		setProfileError(null);
		try {
			const { data, error } = await supabase.from("profiles").select("nombre_completo, whatsapp, avatar_url").eq("id", userId).maybeSingle();
			if (error) {
				if (!(error.code === "42501" || error.message?.toLowerCase().includes("permission denied"))) console.warn("[Profile] Non-critical profile read error:", error);
				setProfile((prev) => prev ?? {
					nombre_completo: session?.user?.email?.split("@")[0] || "usuario",
					whatsapp: "",
					avatar_url: null
				});
				return;
			}
			if (!data) {
				setProfile({
					nombre_completo: session?.user?.email?.split("@")[0] || "usuario",
					whatsapp: "",
					avatar_url: null
				});
				return;
			}
			setProfile({
				nombre_completo: data.nombre_completo ?? "",
				whatsapp: data.whatsapp ?? "",
				avatar_url: data.avatar_url ?? null
			});
		} catch (err) {
			console.error("[Profile] Unexpected error:", err);
			setProfile({
				nombre_completo: session?.user?.email?.split("@")[0] || "usuario",
				whatsapp: "",
				avatar_url: null
			});
		}
	}, [userId, session?.user?.email]);
	(0, import_react.useCallback)(async () => {
		if (!userId || isCreatingProfile) return;
		setIsCreatingProfile(true);
		setProfileError(null);
		try {
			const { error } = await supabase.from("profiles").upsert({
				id: userId,
				email: session?.user.email || "",
				nombre_completo: session?.user.user_metadata?.full_name || session?.user.email?.split("@")[0] || ""
			}, { onConflict: "id" });
			if (error) {
				console.error("[Profile] Upsert error:", error);
				setProfileError({
					message: `Error al crear/actualizar perfil: ${error.message}`,
					code: error.code,
					details: error.details
				});
				toast.error("Error al procesar perfil");
				return;
			}
			toast.success("Perfil sincronizado correctamente");
			await fetchProfile();
		} catch (err) {
			console.error("[Profile] Unexpected error in upsert:", err);
			setProfileError({ message: "Error crítico al intentar sincronizar el perfil." });
		} finally {
			setIsCreatingProfile(false);
		}
	}, [
		fetchProfile,
		isCreatingProfile,
		session?.user.email,
		session?.user.user_metadata,
		userId
	]);
	(0, import_react.useEffect)(() => {
		if (userId) {
			fetchProfile();
			return;
		}
		ordersRequestId.current += 1;
		setProfile(null);
		setOrders([]);
		setSelectedDelivery(null);
		setShowPass(false);
		setCartOpen(false);
		setLoadingOrders(false);
	}, [userId, fetchProfile]);
	const loadOrders = (0, import_react.useCallback)(async () => {
		if (!userId) {
			ordersRequestId.current += 1;
			setOrders([]);
			setLoadingOrders(false);
			return;
		}
		const requestId = ++ordersRequestId.current;
		setLoadingOrders(true);
		const [regularResult, manualResult] = await Promise.all([supabase.from("orders").select(`
        id, 
        producto_id, 
        producto_nombre, 
        precio, 
        estado, 
        created_at,
        delivery:delivered_accounts (
          email,
          password,
          access_link,
          notes
        )
      `).eq("user_id", userId).order("created_at", { ascending: false }), supabase.from("manual_orders").select("id, producto_nombre, monto, estado, created_at, fecha_adquisicion, fecha_vencimiento").eq("user_id", userId).order("created_at", { ascending: false })]);
		if (requestId !== ordersRequestId.current) return;
		const { data: regularOrders, error: rError } = regularResult;
		const { data: manualOrders, error: mError } = manualResult;
		setLoadingOrders(false);
		if (rError || mError) toast.error("No se pudieron cargar todos tus pedidos");
		const formattedRegular = (regularOrders || []).map((o) => ({
			id: o.id,
			producto_id: o.producto_id,
			producto_nombre: o.producto_nombre,
			precio: o.precio,
			estado: normalizeOrderStatus(o.estado),
			created_at: o.created_at,
			delivery: o.delivery?.[0] ?? null,
			type: "regular"
		}));
		const formattedManual = (manualOrders || []).map((o) => ({
			id: o.id,
			producto_id: "manual",
			producto_nombre: o.producto_nombre,
			precio: o.monto,
			estado: normalizeOrderStatus(o.estado),
			created_at: o.created_at ?? o.fecha_adquisicion,
			delivery: null,
			fecha_adquisicion: o.fecha_adquisicion,
			fecha_vencimiento: o.fecha_vencimiento,
			type: "manual"
		}));
		setOrders([...formattedRegular, ...formattedManual].sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()));
	}, [userId]);
	(0, import_react.useEffect)(() => {
		if (panel === "compras") loadOrders();
	}, [panel, loadOrders]);
	(0, import_react.useEffect)(() => {
		if (!session) setPanel("tienda");
	}, [session]);
	const { data: dbProducts = [] } = useQuery({
		queryKey: ["public-products"],
		queryFn: async () => {
			const { data, error } = await supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false });
			if (error) throw error;
			return data;
		},
		staleTime: 6e4,
		gcTime: 10 * 6e4,
		refetchOnWindowFocus: false,
		retry: 1
	});
	const supplierIds = (0, import_react.useMemo)(() => Array.from(new Set(dbProducts.map((product) => product.supplier_id).filter((id) => Boolean(id)))), [dbProducts]);
	const { data: supplierMap = {} } = useQuery({
		queryKey: ["public-suppliers", supplierIds],
		enabled: supplierIds.length > 0,
		queryFn: async () => {
			const { data, error } = await supabase.rpc("get_public_suppliers", { _user_ids: supplierIds });
			if (error) throw error;
			const map = {};
			data?.forEach((row) => {
				map[row.user_id] = row;
			});
			return map;
		},
		staleTime: 6e4,
		gcTime: 10 * 6e4,
		refetchOnWindowFocus: false,
		retry: 1
	});
	const { data: mySupplier } = useQuery({
		queryKey: [
			"public-suppliers",
			"me",
			userId
		],
		enabled: !!userId,
		queryFn: async () => {
			if (!userId) return null;
			const { data, error } = await supabase.rpc("get_public_suppliers", { _user_ids: [userId] });
			if (error) throw error;
			return data?.[0] ?? null;
		}
	});
	(0, import_react.useEffect)(() => {
		setSupplierAvatarFailed(false);
	}, [mySupplier?.avatar_url]);
	(0, import_react.useEffect)(() => {
		const channel = supabase.channel("supplier_profiles_public").on("postgres_changes", {
			event: "*",
			schema: "public",
			table: "supplier_profiles"
		}, () => {
			queryClient.invalidateQueries({ queryKey: ["public-suppliers"] });
		}).subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [queryClient]);
	const allProducts = (0, import_react.useMemo)(() => {
		const dbMapped = dbProducts.map((p) => {
			const sup = p.supplier_id ? supplierMap[p.supplier_id] : void 0;
			return {
				id: p.id,
				name: p.name,
				category: p.category?.toLowerCase() || "streaming",
				price: p.price,
				image: p.image_url || "/placeholder.svg",
				description: p.description || "",
				whatsapp_contacto: WA_NUMBER,
				duracion: "30 Días",
				shortLabel: p.name.toUpperCase(),
				descripcion_larga: p.descripcion_larga || p.description || "Sin descripción detallada.",
				horario_atencion_inicio: "09:00",
				horario_atencion_fin: "22:00",
				vendedor: sup?.display_name || "camd",
				supplier_avatar_url: sup?.avatar_url ? getAvatarUrl(sup.avatar_url) : null,
				supplier_avatar_effect: sup?.avatar_effect ?? "none",
				supplier_verified: sup?.is_verified ?? false
			};
		});
		const existingNames = new Set(dbMapped.map((p) => p.name.toLowerCase()));
		const filteredMock = products.filter((p) => !existingNames.has(p.name.toLowerCase()));
		return [...dbMapped, ...filteredMock];
	}, [dbProducts, supplierMap]);
	const visible = (0, import_react.useMemo)(() => {
		const q = query.trim().toLowerCase();
		const list = allProducts.filter((p) => (activeCat === "todo" || p.category === activeCat) && (q === "" || p.name.toLowerCase().includes(q)));
		if (sort === "precio-asc") return [...list].sort((a, b) => a.price - b.price);
		if (sort === "precio-desc") return [...list].sort((a, b) => b.price - a.price);
		if (sort === "nombre") return [...list].sort((a, b) => a.name.localeCompare(b.name, "es"));
		return list;
	}, [
		allProducts,
		activeCat,
		query,
		sort
	]);
	const stockIds = (0, import_react.useMemo)(() => visible.map((p) => String(p.id)).filter((id) => UUID_RE.test(id)), [visible]);
	const { data: stockLevels = {} } = useQuery({
		queryKey: ["inventory-stock", stockIds],
		queryFn: async () => {
			if (stockIds.length === 0) return {};
			const { data, error } = await supabase.from("product_stock").select("product_id, available").in("product_id", stockIds);
			if (error) {
				console.error("Error fetching stock:", error);
				return {};
			}
			const counts = {};
			data?.forEach((row) => {
				counts[row.product_id] = row.available;
			});
			return counts;
		},
		enabled: stockIds.length > 0,
		refetchInterval: 3e4
	});
	function handleAdd(p) {
		if (!session) {
			setAuthOpen(true);
			return;
		}
		cartStore.add({
			id: p.id,
			name: p.name,
			price: p.price,
			whatsapp: p.whatsapp_contacto
		});
		track("add_to_cart", {
			eventName: "add_to_cart",
			metadata: {
				productId: p.id,
				productName: p.name,
				price: p.price
			}
		});
		toast.success(`${p.name} agregado al carrito`);
		setCartOpen(true);
	}
	async function handleCheckout() {
		if (!session) {
			setCartOpen(false);
			setAuthOpen(true);
			return;
		}
		if (cartItems.length === 0 || isOrderSubmitting || orderSubmissionRef.current) return;
		orderSubmissionRef.current = true;
		setIsOrderSubmitting(true);
		try {
			await createOrdersFn({ data: { items: cartItems.map((it) => ({
				id: it.id,
				name: it.name,
				quantity: it.quantity
			})) } });
			openWhatsApp(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildCartWhatsAppMessage(cartItems, cartTotal))}`);
			track("purchase", {
				eventName: "purchase",
				metadata: {
					value: cartTotal,
					currency: "PEN",
					itemCount: cartItems.length,
					items: cartItems.map((it) => ({
						id: it.id,
						name: it.name,
						qty: it.quantity,
						price: it.price
					}))
				}
			});
			toast.success("Pedido registrado — continúa por WhatsApp");
			cartStore.clear();
			setCartOpen(false);
			if (panel === "compras") loadOrders();
		} catch (err) {
			console.error("Error saving orders:", err);
			toast.error("No se pudo registrar el pedido. Intenta de nuevo.");
		} finally {
			orderSubmissionRef.current = false;
			setIsOrderSubmitting(false);
		}
	}
	async function handleBuyNow(p, quantity = 1) {
		if (!session) {
			setAuthOpen(true);
			return;
		}
		if (isOrderSubmitting || orderSubmissionRef.current) return;
		orderSubmissionRef.current = true;
		setIsOrderSubmitting(true);
		try {
			await createOrdersFn({ data: { items: [{
				id: p.id,
				name: p.name,
				quantity
			}] } });
			const msg = encodeURIComponent(buildWhatsAppMessage(p, { quantity }));
			openWhatsApp(`https://wa.me/${p.whatsapp_contacto}?text=${msg}`);
			track("purchase", {
				eventName: "buy_now",
				metadata: {
					productId: p.id,
					productName: p.name,
					value: p.price * quantity,
					currency: "PEN",
					quantity
				}
			});
			toast.success("Pedido registrado — continúa por WhatsApp");
			if (panel === "compras") loadOrders();
		} catch (err) {
			console.error("Error saving order:", err);
			toast.error("No se pudo registrar el pedido. Intenta de nuevo.");
		} finally {
			orderSubmissionRef.current = false;
			setIsOrderSubmitting(false);
		}
	}
	async function handleSignOut() {
		if (isSigningOut) return;
		setIsSigningOut(true);
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
			ordersRequestId.current += 1;
			orderSubmissionRef.current = false;
			await queryClient.cancelQueries();
			queryClient.clear();
			setSession(null);
			setProfile(null);
			setOrders([]);
			setSelectedDelivery(null);
			setShowPass(false);
			setCartOpen(false);
			setPanel("tienda");
			await router.navigate({
				to: "/tienda",
				replace: true
			});
			toast.success("Sesión cerrada");
		} catch (error) {
			console.error("No se pudo cerrar la sesión:", error);
			toast.error("No se pudo cerrar sesión. Intenta de nuevo.");
		} finally {
			setIsSigningOut(false);
		}
	}
	const displayName = profile?.nombre_completo?.trim() || session?.user.email?.split("@")[0] || "usuario";
	const initials = displayName.split(" ").map((s) => s[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
	const safeDeliveryUrl = getSafeExternalUrl(selectedDelivery?.access_link ?? null);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen text-foreground relative isolate overflow-x-hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlatformBackground, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FuturisticBackground, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FallingStars, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
					className: "sticky top-0 z-50 border-b border-white/5 bg-background/95 sm:bg-background/80 sm:backdrop-blur-xl",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center gap-6",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/",
								className: "flex items-center gap-2.5 shrink-0 group",
								onMouseEnter: playHover,
								onClick: playClick,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
									src: "/favicon.png",
									alt: "CMD Streaming",
									className: "h-10 w-10 rounded-xl object-contain transition-transform group-hover:scale-105"
								})
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center gap-3",
							children: session ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "hidden sm:flex items-center gap-3 pr-2 border-r border-white/10",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-9 h-9 bg-red-accent rounded-full overflow-hidden shrink-0 shadow-lg shadow-red-600/20",
											children: profile?.avatar_url ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
												src: getAvatarUrl(profile.avatar_url),
												alt: "Foto de perfil",
												className: "w-full h-full object-cover",
												onError: (e) => {
													e.currentTarget.style.display = "none";
												}
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "w-full h-full grid place-items-center text-[11px] font-bold text-white uppercase",
												children: initials || "US"
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "leading-tight",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-white/50",
												children: "Hola,"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-white font-bold truncate max-w-[120px]",
												children: displayName
											})]
										})]
									}),
									(isAdmin || isSupplier) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
										to: isAdmin ? "/admin" : "/proveedor",
										className: "p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-colors group",
										onMouseEnter: playHover,
										onClick: () => {
											playClick();
											track("cta_click", {
												eventName: "panel_link",
												metadata: {
													location: "tienda_header",
													role: isAdmin ? "admin" : "supplier"
												}
											});
										},
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings, { className: "w-5 h-5 group-hover:rotate-90 transition-transform duration-500" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onMouseEnter: playHover,
										onClick: () => {
											playClick();
											handleSignOut();
										},
										className: "p-2 text-white/60 hover:text-white hover:bg-white/5 rounded-full transition-colors",
										disabled: isSigningOut,
										"aria-label": "Cerrar sesión",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "w-5 h-5" })
									})
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center gap-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => {
										playClick();
										setAuthOpen(true);
									},
									onMouseEnter: playHover,
									className: "text-xs font-bold text-white px-4 py-2 bg-red-accent rounded-full hover:brightness-110 transition shadow-lg shadow-red-600/20",
									children: "Ingresar"
								})
							})
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "relative border-b border-white/10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 pb-8 sm:pb-10",
						children: [profileError && profileError.code !== "NOT_FOUND" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "w-5 h-5 text-red-500 shrink-0 mt-0.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-bold text-white uppercase tracking-wider",
											children: "Error del Sistema"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-white/70 mt-1",
											children: profileError.message
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-2 p-2 bg-black/40 rounded font-mono text-[10px] text-red-400 overflow-x-auto",
											children: [
												"Detalle Técnico: ",
												profileError.code,
												profileError.details && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
												profileError.details && `${profileError.details}`
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-4 flex flex-wrap gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onMouseEnter: playHover,
												onClick: () => {
													playClick();
													window.location.reload();
												},
												className: "px-3 py-1.5 bg-red-accent text-white text-[10px] uppercase font-bold tracking-widest transition",
												children: "Refrescar página"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onMouseEnter: playHover,
												onClick: () => {
													playClick();
													fetchProfile();
												},
												className: "px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-[10px] uppercase font-bold tracking-widest transition",
												children: "Reintentar lectura"
											})]
										})
									]
								})]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-transparent p-5 shadow-[0_0_50px_rgba(220,38,38,0.1)] sm:p-8 sm:shadow-[0_0_80px_rgba(220,38,38,0.12)] sm:backdrop-blur-xl",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "max-w-2xl",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-red-accent",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2.5 w-2.5 rounded-full bg-red-accent shadow-[0_0_10px_rgba(220,38,38,0.7)]" }), "Acceso inmediato y soporte 24/7"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
											className: "mt-4 font-display text-3xl sm:text-5xl uppercase text-white tracking-tight leading-[0.95]",
											children: session ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
												"Hola, ",
												displayName,
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
												"Tu tienda de streaming"
											] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
												"Tienda premium",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
												"Catálogo de cuentas"
											] })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-4 text-sm sm:text-base text-white/70 leading-relaxed max-w-xl",
											children: "Explora servicios y licencias con activación rápida, pagos seguros y una experiencia más rápida para encontrar exactamente lo que necesitas."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "mt-6 flex flex-wrap gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => {
													playClick();
													document.getElementById("catalogo")?.scrollIntoView({
														behavior: "smooth",
														block: "start"
													});
												},
												className: "inline-flex items-center justify-center gap-2 rounded-full bg-red-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {
													"aria-hidden": "true",
													className: "w-4 h-4"
												}), "Explorar catálogo"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												onClick: () => {
													playClick();
													if (!session) setAuthOpen(true);
													else setPanel("perfil");
												},
												className: "inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.05] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.1]",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleUserRound, {
													"aria-hidden": "true",
													className: "w-4 h-4"
												}), session ? "Mi cuenta" : "Ingresar ahora"]
											})]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-2 sm:grid-cols-3 gap-3 sm:min-w-[320px]",
									children: [
										{
											value: "1.2K",
											label: "Ventas"
										},
										{
											value: `${products.length}`,
											label: "Productos"
										},
										{
											value: "24/7",
											label: "Soporte"
										}
									].map((stat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-center backdrop-blur-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-display text-xl text-white",
											children: stat.value
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-[10px] uppercase tracking-[0.22em] text-white/60",
											children: stat.label
										})]
									}, stat.label))
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-8 flex flex-wrap items-center gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "inline-flex items-center gap-2.5 pr-4 border-r border-white/10 group/camd cursor-default",
										onMouseEnter: playHover,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative group/avatar",
											children: [!mySupplier?.avatar_effect || mySupplier.avatar_effect === "none" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 rounded-full animate-fire-aura pointer-events-none scale-110" }) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "relative z-10 transition-transform duration-300 group-hover/camd:scale-110",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarEffect, {
													effect: normalizeEffect(mySupplier?.avatar_effect),
													size: "sm",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "w-9 h-9 rounded-full bg-red-accent overflow-hidden shrink-0 shadow-lg shadow-red-600/20",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
															src: !supplierAvatarFailed && mySupplier?.avatar_url ? getAvatarUrl(mySupplier.avatar_url) : "/provider-avatars/provider-avatar-01.png",
															alt: "Avatar de CMD Streaming",
															className: "w-full h-full object-cover",
															onError: (e) => {
																if (!supplierAvatarFailed && mySupplier?.avatar_url) setSupplierAvatarFailed(true);
																else e.currentTarget.style.display = "none";
															}
														})
													})
												})
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "leading-tight",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs font-semibold text-white flex items-center gap-1 transition-colors group-hover/camd:text-red-accent",
												children: [mySupplier?.display_name || (session ? displayName : "@camd"), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: cn("w-3.5 h-3.5", isAdminActive ? "text-green-500 animate-pulse" : "text-red-accent") })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[10px] text-white/70 flex items-center gap-1",
												children: isAdminActive ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-1.5 h-1.5 rounded-full bg-green-500" }), "Disponible ahora"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "w-2.5 h-2.5" }), " Fuera de horario"] })
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => {
											playClick();
											setCartOpen(true);
										},
										onMouseEnter: playHover,
										"aria-label": `Abrir carrito${cartCount > 0 ? `, ${cartCount} ${cartCount === 1 ? "producto" : "productos"}` : ""}`,
										className: "relative inline-flex items-center gap-2 min-h-11 px-5 py-2.5 bg-red-accent text-white text-[11px] font-bold uppercase tracking-[0.16em] hover:brightness-110 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, {
												"aria-hidden": "true",
												className: "w-4 h-4"
											}),
											"Carrito",
											cartCount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												"aria-hidden": "true",
												className: "ml-1 px-1.5 py-0.5 bg-white text-red-accent text-[10px] font-bold leading-none",
												children: cartCount
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
										onClick: () => setPanel("tienda"),
										label: "Tienda",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {
											"aria-hidden": "true",
											className: "w-4 h-4"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
										onClick: () => setTutorialOpen(true),
										label: "Ayuda",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, {
											"aria-hidden": "true",
											className: "w-4 h-4"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
										onClick: () => {
											if (!session) setAuthOpen(true);
											else setPanel("perfil");
										},
										label: "Mi Cuenta",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleUserRound, {
											"aria-hidden": "true",
											className: "w-4 h-4"
										})
									}),
									isSupplier && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(IconBtn, {
										onClick: () => router.navigate({ to: "/proveedor" }),
										label: "Panel Proveedor",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayoutDashboard, {
											"aria-hidden": "true",
											className: "w-4 h-4"
										})
									})
								]
							})]
						})]
					})
				}),
				session && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "max-w-6xl mx-auto px-4 sm:px-6",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "inline-flex gap-1.5 w-full sm:w-auto overflow-x-auto scrollbar-none border border-white/10 p-1.5 bg-black/20 backdrop-blur-md rounded-lg",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelTabBtn, {
									active: panel === "tienda",
									onClick: () => {
										track("cta_click", {
											eventName: "panel_tienda",
											metadata: { location: "panel_tabs" }
										});
										setPanel("tienda");
									},
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: "w-4 h-4" }),
									label: "Tienda"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelTabBtn, {
									active: panel === "compras",
									onClick: () => {
										track("cta_click", {
											eventName: "panel_compras",
											metadata: { location: "panel_tabs" }
										});
										setPanel("compras");
									},
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "w-4 h-4" }),
									label: "Mis Compras"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PanelTabBtn, {
									active: panel === "perfil",
									onClick: () => {
										track("cta_click", {
											eventName: "panel_perfil",
											metadata: { location: "panel_tabs" }
										});
										setPanel("perfil");
									},
									icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleUserRound, { className: "w-4 h-4" }),
									label: "Mi Perfil"
								})
							]
						})
					})
				}),
				panel === "tienda" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "tienda-main-content",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "mt-8 relative",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "max-w-[1600px] mx-auto px-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] uppercase tracking-[0.28em] text-red-accent",
									children: "Explora por plataformas"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "text-3xl font-bold text-white tracking-tight",
									children: "Encuentra lo que más te interesa"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-white/50 text-sm",
									children: "Filtra rápido por tus categorías favoritas y ahorra tiempo."
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-4 min-[420px]:grid-cols-5 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-[repeat(18,minmax(0,1fr))] gap-2 sm:gap-3",
								children: categories.filter((c) => c.id !== "todo").map((cat) => {
									const isActive = activeCat === cat.id;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => {
											playClick();
											setActiveCat(cat.id);
										},
										onMouseEnter: playHover,
										style: isActive ? {
											borderColor: cat.accent,
											backgroundColor: `${cat.accent}1a`,
											boxShadow: `0 0 25px ${cat.accent}40`
										} : void 0,
										className: `group relative flex aspect-[1/1.05] min-h-[4.75rem] flex-col items-center justify-center rounded-2xl border p-1 transition-all duration-300 hover:scale-[1.02] sm:aspect-square ${isActive ? "" : "border-white/10 bg-black/40 sm:backdrop-blur-md hover:bg-white/5"}`,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											style: {
												color: "#fff",
												backgroundColor: isActive ? cat.accent : `${cat.accent}24`,
												boxShadow: isActive ? `0 0 18px ${cat.accent}80` : void 0
											},
											className: "mx-auto flex h-8 w-8 items-center justify-center rounded-lg transition-all group-hover:brightness-125",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(cat.icon, { className: "w-5 h-5" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											style: isActive ? { color: cat.accent } : void 0,
											className: `mt-2 block px-1 text-[9px] font-bold uppercase tracking-tighter leading-none transition-colors ${isActive ? "" : "text-white/65 group-hover:text-white"}`,
											children: cat.label.split(" ")[0]
										})]
									}, cat.id);
								})
							})]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "mt-8 border-t border-b border-white/5 bg-black/20 sm:backdrop-blur-sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "max-w-[1600px] mx-auto px-4 py-4 flex flex-col sm:flex-row items-center gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative w-full sm:max-w-md",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									ref: searchRef,
									value: query,
									onChange: (e) => setQuery(e.target.value),
									placeholder: "Buscar productos...",
									className: "w-full bg-white/5 border border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-red-accent/50 focus:ring-1 focus:ring-red-accent/20 transition-all"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3 ml-auto w-full sm:w-auto",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative group/sort flex-1 sm:flex-initial",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: sort,
										onChange: (e) => setSort(e.target.value),
										className: "appearance-none w-full bg-white/5 border border-white/10 rounded-full py-2.5 px-6 pr-10 text-xs font-bold text-white uppercase tracking-wider focus:outline-none transition-all cursor-pointer",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "destacado",
												children: "Todas las categorías"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "precio-asc",
												children: "Precio: Bajo a Alto"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "precio-desc",
												children: "Precio: Alto a Bajo"
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => {
										playClick();
										setActiveCat("todo");
										setQuery("");
										setSort("destacado");
										searchRef.current?.focus();
									},
									"aria-label": "Limpiar filtros",
									className: "flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-white/10 sm:px-6",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartColumn, { className: "w-4 h-4" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "hidden min-[420px]:inline",
											children: "Limpiar filtros"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "inline min-[420px]:hidden",
											children: "Limpiar"
										})
									]
								})]
							})]
						})
					})]
				}),
				panel === "tienda" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					id: "catalogo",
					className: "mt-6 pb-24 relative z-10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-[1600px] mx-auto px-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mb-8 flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[10px] uppercase tracking-[0.28em] text-red-accent",
								children: "Catálogo"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
								className: "mt-1 text-xl font-bold text-white flex items-center gap-2 uppercase tracking-widest text-sm",
								children: [activeCat === "todo" ? "Todos los productos" : activeCat, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-red-accent font-black",
									children: "#"
								})]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 sm:self-auto",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2 w-2 rounded-full bg-red-accent" }),
									visible.length,
									" productos disponibles"
								]
							})]
						}), visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border border-white/10 p-10 sm:p-16 grid place-items-center text-center rounded-2xl",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-14 h-14 border border-white/12 grid place-items-center mb-5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "w-6 h-6 text-white/70" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-white/60 mb-5",
									children: "No encontramos productos con esos filtros."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onMouseEnter: playHover,
									onClick: () => {
										playClick();
										setActiveCat("todo");
										setQuery("");
										document.getElementById("catalogo")?.scrollIntoView({
											behavior: "smooth",
											block: "start"
										});
									},
									className: "px-5 py-2.5 border border-white/20 text-white text-[11px] uppercase tracking-[0.18em] hover:bg-white hover:text-background transition",
									children: "Ver todo el catálogo"
								})
							]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-6 lg:gap-8",
							children: visible.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "product-card group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white/[0.02] transition-all duration-500 hover:border-white/20 hover:bg-white/[0.04] hover:shadow-[0_0_40px_rgba(220,38,38,0.1)] sm:rounded-[1.5rem] sm:backdrop-blur-xl",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative aspect-video overflow-hidden bg-white/[0.03] m-1 rounded-lg sm:rounded-xl group/img",
									children: [
										p.image && !p.image.includes("/placeholder.svg") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: p.image,
											alt: `Portada de ${p.name}`,
											loading: "lazy",
											decoding: "async",
											className: "h-full w-full object-cover transition-transform duration-700 motion-reduce:transition-none sm:group-hover/img:scale-110"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-full h-full bg-gradient-to-br from-white/[0.05] to-transparent flex items-center justify-center",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "w-6 sm:w-10 h-6 sm:h-10 text-white/10" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "absolute top-1.5 left-1.5 sm:top-3 sm:left-3 flex flex-col gap-1 pointer-events-none",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "px-1.5 sm:px-2 py-0.5 bg-red-accent/90 backdrop-blur-md text-[6px] sm:text-[9px] font-black text-white uppercase tracking-[0.1em] rounded-full shadow-xl",
												children: "Premium"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => {
												playClick();
												setSelected(p);
											},
											onMouseEnter: playHover,
											className: "absolute inset-0 grid place-items-center bg-black/25 opacity-100 transition-opacity duration-300 sm:bg-black/40 sm:opacity-0 sm:group-hover/img:opacity-100 sm:backdrop-blur-[2px]",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "px-3 sm:px-4 py-1 sm:py-1.5 bg-white text-black text-[6px] sm:text-[9px] font-black uppercase tracking-[0.1em] rounded-full transform translate-y-4 group-hover/img:translate-y-0 transition-transform duration-500",
												children: "Ver detalles"
											})
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "px-2 sm:px-4 pb-2 sm:pb-4 pt-1 flex flex-col flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mb-2 sm:mb-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "mb-0.5 text-xs font-display font-bold leading-tight tracking-tight text-white transition-colors group-hover:text-red-accent line-clamp-1 sm:mb-1 sm:text-base lg:text-lg",
											children: p.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1.5 text-[8px] sm:text-[10px] text-white/40 font-medium uppercase tracking-wider",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "flex items-center gap-1",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clapperboard, { className: "w-2 sm:w-2.5 h-2 sm:h-2.5" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "hidden min-[380px]:inline",
															children: p.duracion
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "inline min-[380px]:hidden",
															children: "30D"
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-0.5 h-0.5 rounded-full bg-white/10" }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "flex items-center gap-1",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BadgeCheck, { className: "w-2 sm:w-2.5 h-2 sm:h-2.5" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "hidden sm:inline",
															children: "Inmediata"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "inline sm:hidden",
															children: "Stock"
														})
													]
												})
											]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-auto space-y-2 sm:space-y-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-row items-center justify-between gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-col",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[6px] sm:text-[8px] text-white/30 uppercase font-black tracking-[0.1em] mb-0",
														children: "Precio"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-xs sm:text-lg lg:text-xl font-display font-bold text-white leading-none",
														children: ["S/ ", p.price.toFixed(2)]
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex h-10 items-center rounded-lg border border-white/10 bg-white/[0.03] px-1 shadow-inner sm:h-9 sm:rounded-xl",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															onClick: (e) => {
																e.stopPropagation();
																const input = e.currentTarget.nextElementSibling;
																const val = parseInt(input.value) || 1;
																if (val > 1) {
																	input.value = (val - 1).toString();
																	playClick();
																}
															},
															className: "flex h-full w-8 items-center justify-center text-white/50 transition-colors hover:text-white sm:w-7",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-sm sm:text-lg leading-none font-light",
																children: "-"
															})
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
															type: "number",
															defaultValue: "1",
															min: "1",
															max: getProductStock(p.id, stockLevels).count ?? 99,
															className: "w-7 border-none bg-transparent text-center text-xs font-black text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none sm:w-7",
															onClick: (e) => e.stopPropagation()
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
															type: "button",
															onClick: (e) => {
																e.stopPropagation();
																const input = e.currentTarget.previousElementSibling;
																const val = parseInt(input.value) || 1;
																if (val < (getProductStock(p.id, stockLevels).count ?? 99)) {
																	input.value = (val + 1).toString();
																	playClick();
																}
															},
															className: "flex h-full w-8 items-center justify-center text-white/50 transition-colors hover:text-white sm:w-7",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-sm sm:text-lg leading-none font-light",
																children: "+"
															})
														})
													]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex gap-1 sm:gap-1.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													onClick: (e) => {
														e.stopPropagation();
														playClick();
														const input = e.currentTarget.closest("article")?.querySelector("input[type=\"number\"]");
														handleBuyNow(p, parseInt(input?.value) || 1);
													},
													onMouseEnter: playHover,
													className: "group/btn flex min-h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-red-accent py-2 text-[9px] font-black uppercase tracking-[0.1em] text-white shadow-[0_4px_10px_-4px_rgba(220,38,38,0.4)] transition-all hover:brightness-125 sm:gap-2 sm:rounded-xl sm:py-2.5",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "w-3 sm:w-3.5 h-3 sm:h-3.5 group-hover:scale-110 transition-transform" }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "hidden min-[360px]:inline",
															children: "WhatsApp"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "inline min-[360px]:hidden",
															children: "Chat"
														})
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													onClick: (e) => {
														e.stopPropagation();
														playClick();
														const input = e.currentTarget.closest("article")?.querySelector("input[type=\"number\"]");
														const qty = parseInt(input?.value) || 1;
														for (let i = 0; i < qty; i++) handleAdd(p);
													},
													onMouseEnter: playHover,
													className: "grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-white transition-all hover:border-white/20 hover:bg-white/[0.08] sm:rounded-xl",
													"aria-label": "Agregar al carrito",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "w-3 sm:w-4 h-3 sm:h-4" })
												})]
											}),
											(() => {
												const stock = getProductStock(p.id, stockLevels);
												return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "flex items-center justify-center pt-0.5",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[6px] sm:text-[8px] font-black uppercase tracking-[0.05em] transition-colors ${stock.available ? "bg-green-500/5 border-green-500/20 text-green-400" : "bg-red-500/5 border-red-500/20 text-red-400"}`,
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: `w-1 h-1 rounded-full ${stock.available ? "bg-green-500 animate-pulse" : "bg-red-500"}` }), stock.available ? stock.count != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "hidden min-[400px]:inline",
															children: [stock.count, " en stock"]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "inline min-[400px]:hidden",
															children: [stock.count, " disp."]
														})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "hidden min-[400px]:inline",
															children: "Disponible"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "inline min-[400px]:hidden",
															children: "Disp."
														})] }) : "Agotado"]
													})
												});
											})()
										]
									})]
								})]
							}, p.id))
						})]
					})
				}),
				panel === "compras" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PurchasesPanel, {
					loading: loadingOrders,
					orders,
					onGoShop: () => setPanel("tienda"),
					onShowDelivery: (d) => setSelectedDelivery(d)
				}),
				panel === "perfil" && profile && userId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfilePanel, {
					userId,
					initials,
					profile,
					email: session.user.email ?? "",
					onSaved: (p) => setProfile({
						...profile,
						...p
					}),
					onAvatarUpdate: fetchProfile
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 flex flex-col gap-2.5 sm:gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						onMouseEnter: playHover,
						onClick: playClick,
						href: `https://wa.me/${WA_NUMBER}`,
						target: "_blank",
						rel: "noopener noreferrer",
						className: "w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#25D366] grid place-items-center hover:scale-110 transition",
						"aria-label": "WhatsApp",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircle, { className: "w-5 h-5 text-white" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onMouseEnter: playHover,
						onClick: () => {
							playClick();
							if (navigator.share) navigator.share({
								title: "CMD Streaming",
								url: window.location.href
							}).catch(() => {});
							else copyText(window.location.href, "Enlace copiado");
						},
						className: "w-11 h-11 sm:w-12 sm:h-12 bg-red-accent grid place-items-center hover:brightness-110 transition",
						"aria-label": "Compartir",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "w-5 h-5 text-white" })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthModal, {
					open: authOpen,
					initialMode: authMode,
					onClose: () => {
						setAuthOpen(false);
						setAuthMode("login");
					}
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartDrawer, {
					open: cartOpen,
					onClose: () => setCartOpen(false),
					onCheckout: handleCheckout,
					checkoutPending: isOrderSubmitting
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyboardShortcuts, {
					authed: !!session,
					onFocusSearch: () => {
						setPanel("tienda");
						requestAnimationFrame(() => searchRef.current?.focus());
					},
					onToggleCart: () => setCartOpen((v) => !v),
					onGoPanel: (p) => setPanel(p),
					onGoHome: () => router.navigate({ to: "/" }),
					onOpenTutorial: () => setTutorialOpen(true)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyboardTutorial, {
					open: tutorialOpen,
					onClose: () => setTutorialOpen(false)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductModal, {
					product: selected,
					onClose: () => setSelected(null),
					onAddToCart: (p) => {
						handleAdd(p);
						setSelected(null);
					},
					onBuyNow: (p) => {
						handleBuyNow(p);
					},
					isBuying: isOrderSubmitting
				}),
				selectedDelivery && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "fixed inset-0 z-[100] flex items-center justify-center p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "absolute inset-0 bg-black/80 backdrop-blur-sm",
						onClick: () => {
							setSelectedDelivery(null);
							setShowPass(false);
						}
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative w-full max-w-md bg-[#0d0d14] border border-white/10 rounded-3xl overflow-hidden animate-scale-in",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Key, { className: "w-5 h-5" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "text-lg font-bold text-white",
									children: "Credenciales de Acceso"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] text-white/40 uppercase tracking-wider font-bold",
									children: "Entrega Protegida"
								})] })]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setSelectedDelivery(null);
									setShowPass(false);
								},
								className: "w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "w-4 h-4" })
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-6 space-y-5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-4",
								children: [
									selectedDelivery.email && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1",
											children: "Email / Usuario"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative group",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												readOnly: true,
												value: selectedDelivery.email,
												className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => {
													copyText(selectedDelivery.email ?? "");
												},
												className: "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "w-3.5 h-3.5" })
											})]
										})]
									}),
									selectedDelivery.password && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1",
											children: "Contraseña"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "relative group",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: showPass ? "text" : "password",
												readOnly: true,
												value: selectedDelivery.password,
												className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none transition-all"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													onClick: () => setShowPass(!showPass),
													className: "w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all",
													children: showPass ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "w-3.5 h-3.5" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													onClick: () => {
														copyText(selectedDelivery.password ?? "");
													},
													className: "w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "w-3.5 h-3.5" })
												})]
											})]
										})]
									}),
									safeDeliveryUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1",
											children: "Enlace de Acceso"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
											href: safeDeliveryUrl,
											target: "_blank",
											rel: "noopener noreferrer",
											className: "w-full bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-sm text-primary font-bold flex items-center justify-between hover:bg-primary/20 transition-all",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Abrir Plataforma" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "w-4 h-4" })]
										})]
									}),
									selectedDelivery.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
											className: "text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1",
											children: "Notas del Administrador"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 whitespace-pre-line leading-relaxed italic",
											children: selectedDelivery.notes
										})]
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "pt-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] text-center text-white/20 italic",
									children: "Si tienes problemas con estas credenciales, contáctanos por WhatsApp."
								})
							})]
						})]
					})]
				})
			] })
		]
	});
}
function PanelTabBtn({ active, onClick, icon, label, accent = "text-sky-300" }) {
	const { playHover, playClick } = useFuturisticSound();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		onClick: () => {
			playClick();
			onClick();
		},
		onMouseEnter: playHover,
		"aria-pressed": active,
		className: `shrink-0 inline-flex items-center gap-2 px-5 py-3 text-[11px] sm:text-xs font-bold uppercase tracking-[0.14em] transition-all ${active ? "bg-red-accent text-white shadow-lg shadow-red-600/20 rounded-md" : "text-white/70 hover:text-white hover:bg-white/[0.04]"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("transition-colors", active ? "text-white" : accent),
			children: icon
		}), label]
	});
}
function IconBtn({ children, label, onClick }) {
	const { playHover, playClick } = useFuturisticSound();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: () => {
			playClick();
			onClick?.();
		},
		onMouseEnter: playHover,
		"aria-label": label,
		className: "group w-11 h-11 border border-white/12 grid place-items-center text-white/60 hover:border-white/35 transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-accent",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: cn("transition-colors group-hover:text-white", {
				Tienda: "text-cyan-300",
				Ayuda: "text-amber-300",
				"Mi Cuenta": "text-violet-300",
				"Panel Proveedor": "text-amber-300"
			}[label] ?? "text-sky-300"),
			children
		})
	});
}
function PurchasesPanel({ loading, orders, onGoShop, onShowDelivery }) {
	const { playHover, playClick } = useFuturisticSound();
	const queryClient = useQueryClient();
	const { data: ratingInfo = [] } = useQuery({
		queryKey: ["my-order-ratings"],
		queryFn: () => getMyOrderRatings()
	});
	const infoByOrder = (0, import_react.useMemo)(() => new Map(ratingInfo.map((rating) => [rating.order_id, rating])), [ratingInfo]);
	const rateMutation = useMutation({
		mutationFn: (vars) => rateOrderSupplier({ data: vars }),
		onSuccess: () => {
			toast.success("¡Gracias por calificar a tu proveedor!");
			queryClient.invalidateQueries({ queryKey: ["my-order-ratings"] });
		},
		onError: (error) => toast.error(error instanceof Error ? error.message : "No se pudo enviar la calificación")
	});
	const renderStars = (orderId) => {
		const info = infoByOrder.get(orderId);
		if (!info) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[10px] text-white/25",
			children: "—"
		});
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-1.5",
			title: `Proveedor: ${info.supplier_name}`,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProviderAvatar, {
				src: info.supplier_avatar_url,
				effect: info.supplier_avatar_effect,
				size: "sm",
				className: "scale-[0.55] -mx-2",
				alt: `Avatar de ${info.supplier_name}`
			}), [
				1,
				2,
				3,
				4,
				5
			].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => {
					playClick();
					rateMutation.mutate({
						order_id: orderId,
						rating: n
					});
				},
				className: "p-0.5 transition-transform hover:scale-110",
				"aria-label": `Calificar con ${n} estrellas`,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Star, { className: `w-3.5 h-3.5 ${info.rating && n <= info.rating ? "text-yellow-400 fill-yellow-400" : "text-white/25"}` })
			}, n))]
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "mt-6 pb-24",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-6xl mx-auto px-4 sm:px-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between mb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl text-white uppercase tracking-wide",
					children: "Mis Compras"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-xs text-white/70",
					children: [
						orders.length,
						" pedido",
						orders.length === 1 ? "" : "s"
					]
				})]
			}), loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-2xl glass-card p-10 grid place-items-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-6 h-6 text-white/78 animate-spin" })
			}) : orders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-2xl border-2 border-dashed border-white/15 p-10 sm:p-16 grid place-items-center text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/10 grid place-items-center mb-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "w-8 h-8 text-white/70" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-white/70 mb-4",
						children: "Aún no tienes pedidos."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onMouseEnter: playHover,
						onClick: () => {
							playClick();
							onGoShop();
						},
						className: "px-5 py-2.5 bg-red-accent text-white text-[11px] font-bold uppercase tracking-[0.16em] hover:brightness-110 transition",
						children: "Explorar catálogo"
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hidden sm:block rounded-2xl glass-card overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-white/[0.03] text-white/78 text-xs uppercase tracking-wider",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left px-4 py-3",
								children: "Producto"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left px-4 py-3",
								children: "Precio"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left px-4 py-3",
								children: "Estado"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left px-4 py-3",
								children: "Adquirido"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left px-4 py-3",
								children: "Vencimiento"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left px-4 py-3",
								children: "Calificar"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: orders.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-t border-white/5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-white",
								children: o.producto_nombre
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3 text-white/80",
								children: ["S/ ", Number(o.precio).toFixed(2)]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: `inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${estadoStyles[o.estado]}`,
										children: o.estado
									}), o.delivery && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => {
											playClick();
											if (o.delivery) onShowDelivery(o.delivery);
										},
										className: "inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Key, { className: "w-3 h-3" }), "Ver credenciales"]
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-white/78",
								children: o.fecha_adquisicion ? new Date(o.fecha_adquisicion).toLocaleDateString() : new Date(o.created_at).toLocaleDateString()
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-white/78 font-bold",
								children: o.fecha_vencimiento ? new Date(o.fecha_vencimiento).toLocaleDateString() : "N/A"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: renderStars(o.id)
							})
						]
					}, o.id)) })]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sm:hidden space-y-3",
				children: orders.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl glass-card p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold text-white leading-tight",
								children: o.producto_nombre
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col items-end gap-2 shrink-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: `inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase ${estadoStyles[o.estado]}`,
									children: o.estado
								}), o.delivery && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => {
										playClick();
										if (o.delivery) onShowDelivery(o.delivery);
									},
									className: "inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:underline",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Key, { className: "w-3 h-3" }), "Ver credenciales"]
								})]
							})]
						}),
						infoByOrder.get(o.id) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-white/40 uppercase tracking-wider",
								children: "Calificar"
							}), renderStars(o.id)]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-3 flex items-center justify-between text-xs",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-display text-base text-white",
								children: ["S/ ", Number(o.precio).toFixed(2)]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col items-end text-[10px] text-white/50",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
									"Adquirido:",
									" ",
									o.fecha_adquisicion || new Date(o.created_at).toLocaleDateString()
								] }), o.fecha_vencimiento && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-red-400",
									children: ["Vence: ", o.fecha_vencimiento]
								})]
							})]
						})
					]
				}, o.id))
			})] })]
		})
	});
}
function ProfilePanel({ userId, initials, profile, email, onSaved, onAvatarUpdate }) {
	const { playHover, playClick } = useFuturisticSound();
	const [nombre, setNombre] = (0, import_react.useState)(profile.nombre_completo);
	const [whatsapp, setWhatsapp] = (0, import_react.useState)(profile.whatsapp);
	const [saving, setSaving] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setNombre(profile.nombre_completo);
		setWhatsapp(profile.whatsapp);
	}, [profile]);
	async function handleSave(e) {
		e.preventDefault();
		if (!nombre.trim()) {
			toast.error("El nombre no puede estar vacío");
			return;
		}
		if (!/^[0-9+\s()-]{7,}$/.test(whatsapp)) {
			toast.error("Número de WhatsApp inválido");
			return;
		}
		setSaving(true);
		const { data: sess } = await supabase.auth.getSession();
		const uid = sess.session?.user.id;
		if (!uid) {
			setSaving(false);
			toast.error("Sesión no válida");
			return;
		}
		const payload = {
			id: uid,
			nombre_completo: nombre.trim(),
			whatsapp: whatsapp.trim()
		};
		const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
		setSaving(false);
		if (error) {
			console.error("Profile save failed", error);
			toast.error("No se pudo guardar, pero puedes seguir navegando");
			return;
		}
		onSaved({
			nombre_completo: payload.nombre_completo,
			whatsapp: payload.whatsapp
		});
		toast.success("Perfil actualizado");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "mt-6 pb-24",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-3xl mx-auto px-4 sm:px-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-2xl text-white uppercase tracking-wide mb-4",
					children: "Mi Perfil"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-2xl glass-card p-5 sm:p-6 mb-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarUploader, {
						userId,
						fallbackInitials: initials,
						onUploaded: () => {
							onAvatarUpdate?.();
						}
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleSave,
					className: "rounded-2xl glass-card p-5 sm:p-6 space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs text-white/78 uppercase tracking-wider",
							children: "Correo"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1.5 relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/62" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "email",
								value: email,
								disabled: true,
								className: "w-full pl-10 pr-3 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-white/78 text-sm cursor-not-allowed"
							})]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs text-white/78 uppercase tracking-wider",
							children: "Nombre completo"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1.5 relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/62" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								required: true,
								value: nombre,
								onChange: (e) => setNombre(e.target.value),
								className: "w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/74 focus:outline-none focus:border-violet-2/60 transition"
							})]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs text-white/78 uppercase tracking-wider",
							children: "WhatsApp"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-1.5 relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/62" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "tel",
								required: true,
								value: whatsapp,
								onChange: (e) => setWhatsapp(e.target.value),
								placeholder: "+51 999 999 999",
								className: "w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/74 focus:outline-none focus:border-violet-2/60 transition"
							})]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "submit",
							disabled: saving,
							onMouseEnter: playHover,
							onClick: () => playClick(),
							className: "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-red-accent text-white text-[11px] font-bold uppercase tracking-[0.16em] hover:brightness-110 disabled:opacity-60 disabled:hover:scale-100 transition",
							children: [saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "w-4 h-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "w-4 h-4" }), "Guardar cambios"]
						})
					]
				})
			]
		})
	});
}
//#endregion
export { Route as n, TiendaPage as r, AuthModal as t };
