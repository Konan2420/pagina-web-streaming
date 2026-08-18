import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { P as isRedirect, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getServerFnById, n as createServerFn, t as TSS_SERVER_FUNCTION } from "./server-lRCoVKEP.mjs";
import { t as supabase } from "./client-BVMXBJHu.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-ChR131yV.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useServerFn-CrZF2pjq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/createSsrRpc-B55ibemW.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/analytics.functions-IBD5VM8v.js
/** Write a single analytics event from the client via server function. */
var trackEvent = createServerFn({ method: "POST" }).validator((data) => {
	if (!data?.event_type || typeof data.event_type !== "string") throw new Error("event_type is required");
	return data;
}).handler(createSsrRpc("39a0417704f811794703987a71b321d62c2696baad2dc944fcb08205fb9476df"));
/** Read-only dashboard for admins. Cached 60s at the edge. */
var getAnalyticsDashboard = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("391684d8ef65bd4077644dcb0f3c50cb5f1f46857fe0b226ffeb07dd899622ce"));
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/useAnalytics-7FP5kaY_.js
var KEY = "cmd_analytics_consent";
var listeners = /* @__PURE__ */ new Set();
function getConsent() {
	if (typeof window === "undefined") return null;
	try {
		const v = localStorage.getItem(KEY);
		return v === "granted" || v === "denied" ? v : null;
	} catch {
		return null;
	}
}
function setConsent(v) {
	try {
		localStorage.setItem(KEY, v);
	} catch {}
	listeners.forEach((l) => l(v));
}
function subscribeConsent(l) {
	listeners.add(l);
	return () => {
		listeners.delete(l);
	};
}
function hasAnalyticsConsent() {
	return getConsent() === "granted";
}
var SESSION_KEY = "cmd_analytics_session_id";
function getOrCreateSessionId() {
	try {
		const existing = sessionStorage.getItem(SESSION_KEY);
		if (existing) return existing;
		const id = crypto.randomUUID();
		sessionStorage.setItem(SESSION_KEY, id);
		return id;
	} catch {
		return "unknown";
	}
}
function getCurrentPath() {
	return typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
}
function getReferrer() {
	return typeof document !== "undefined" ? document.referrer : "";
}
var currentUserId = null;
if (typeof window !== "undefined") supabase.auth.getSession().then(({ data }) => {
	currentUserId = data.session?.user?.id ?? currentUserId;
});
supabase.auth.onAuthStateChange((event, session) => {
	if (event === "SIGNED_OUT") currentUserId = null;
	else currentUserId = session?.user?.id ?? null;
});
/** Send a single analytics event to the server. */
function useAnalytics() {
	const sessionIdRef = (0, import_react.useRef)(null);
	const track = useServerFn(trackEvent);
	return (0, import_react.useCallback)((eventType, options = {}) => {
		if (!hasAnalyticsConsent()) return;
		if (!sessionIdRef.current) sessionIdRef.current = getOrCreateSessionId();
		track({ data: {
			event_type: eventType,
			event_name: options.eventName ?? null,
			user_id: currentUserId,
			session_id: sessionIdRef.current,
			path: options.path ?? getCurrentPath(),
			referrer: getReferrer(),
			metadata: options.metadata ?? {}
		} }).catch(() => {});
	}, [track]);
}
/** Track a page view once per resolved navigation. */
function usePageView() {
	const send = useAnalytics();
	const router = useRouter();
	const lastPath = (0, import_react.useRef)("");
	(0, import_react.useEffect)(() => {
		const trackPath = () => {
			const path = getCurrentPath();
			if (!path || path === lastPath.current) return;
			lastPath.current = path;
			send("page_view", {
				eventName: "page_view",
				path
			});
		};
		trackPath();
		const unsub = router.subscribe("onResolved", trackPath);
		const unsubConsent = subscribeConsent((v) => {
			if (v === "granted") {
				lastPath.current = "";
				trackPath();
			}
		});
		return () => {
			unsub();
			unsubConsent();
		};
	}, [router, send]);
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/platform-pages-D-sJNagi.js
var platformPages = [
	{
		slug: "netflix",
		name: "Netflix Premium 4K",
		productId: "netflix-1",
		price: 15,
		duracion: "1 Mes",
		tagline: "Perfil Netflix Premium en 4K por 30 días",
		description: "Accede al catálogo completo de Netflix en calidad 4K UHD con un perfil propio. Activación el mismo día, sin permanencia y con soporte por WhatsApp durante toda la vigencia del plan.",
		includes: [
			"Perfil individual dentro de una cuenta Premium",
			"Calidad hasta 4K UHD con HDR según tu dispositivo",
			"Compatible con Smart TV, móvil, tablet, consola y navegador",
			"Garantía y reposición durante los 30 días"
		],
		faq: [{
			q: "¿El perfil de Netflix es solo mío?",
			a: "Sí. Recibes un perfil propio con tu nombre; no compartes historial ni recomendaciones con nadie más."
		}, {
			q: "¿Puedo descargar contenido?",
			a: "Sí, puedes descargar títulos para verlos sin conexión desde la app oficial de Netflix."
		}]
	},
	{
		slug: "disney-plus",
		name: "Disney+ Anual",
		productId: "disney-1",
		price: 45,
		duracion: "12 Meses",
		tagline: "Cuenta completa de Disney+ durante 12 meses",
		description: "Disney, Pixar, Marvel, Star Wars, National Geographic y Star en una sola cuenta completa durante un año entero. Entrega inmediata tras confirmar el pago.",
		includes: [
			"Cuenta completa con todos los perfiles disponibles",
			"12 meses de vigencia al mejor precio por mes",
			"Catálogo Disney, Pixar, Marvel, Star Wars y Star",
			"Soporte y reposición durante todo el año"
		],
		faq: [{
			q: "¿Cuántas pantallas puedo usar en Disney+?",
			a: "Al ser cuenta completa puedes usar las pantallas simultáneas que permite el plan de Disney+."
		}, {
			q: "¿Puedo cambiar la contraseña?",
			a: "Sí, al recibir la cuenta puedes personalizarla; te indicamos cómo hacerlo sin perder el acceso."
		}]
	},
	{
		slug: "hbo-max",
		name: "HBO Max Estándar",
		productId: "hbo-1",
		price: 12,
		duracion: "1 Mes",
		tagline: "Perfil HBO Max por 30 días",
		description: "Series originales de HBO, cine de Warner Bros y estrenos DC en un perfil HBO Max propio por 30 días, con activación rápida y garantía.",
		includes: [
			"Perfil propio en cuenta HBO Max",
			"Estrenos de Warner Bros y catálogo DC",
			"Compatible con todos los dispositivos habituales",
			"Garantía durante los 30 días del plan"
		],
		faq: [{
			q: "¿Incluye los estrenos de cine?",
			a: "Sí, accedes al catálogo estándar de la plataforma, incluidos los estrenos disponibles en HBO Max."
		}, {
			q: "¿Puedo renovar el mismo perfil?",
			a: "Sí. Si renuevas antes de que venza, mantienes el mismo perfil y tu progreso."
		}]
	},
	{
		slug: "prime-video",
		name: "Prime Video",
		productId: "prime-1",
		price: 10,
		duracion: "1 Mes",
		tagline: "Perfil Prime Video por 30 días",
		description: "Series originales de Amazon, cine y contenido exclusivo con un perfil Prime Video por 30 días. Precio fijo, sin cargos recurrentes.",
		includes: [
			"Perfil propio en cuenta Prime Video",
			"Series y películas originales de Amazon",
			"Ver en TV, móvil, tablet o navegador",
			"Soporte por WhatsApp en horario de atención"
		],
		faq: [{
			q: "¿Incluye los envíos de Amazon?",
			a: "No. El servicio cubre únicamente el acceso a Prime Video, no las ventajas de compra de Amazon."
		}, {
			q: "¿Se puede ver en Smart TV?",
			a: "Sí, desde la app oficial de Prime Video instalada en tu televisor."
		}]
	},
	{
		slug: "spotify",
		name: "Spotify Premium",
		productId: "spotify-1",
		price: 8,
		duracion: "1 Mes",
		tagline: "Spotify Premium por 30 días sin anuncios",
		description: "Música sin anuncios, descargas offline y calidad alta durante 30 días. Activación el mismo día y sin permanencia.",
		includes: [
			"Reproducción sin anuncios",
			"Descargas para escuchar sin conexión",
			"Calidad de audio alta",
			"Garantía durante los 30 días"
		],
		faq: [{
			q: "¿Pierdo mis playlists?",
			a: "No. Tus listas y tu biblioteca se mantienen tal cual las tienes."
		}, {
			q: "¿Funciona en cualquier país?",
			a: "Te indicamos la configuración adecuada al activar; funciona en los dispositivos habituales."
		}]
	},
	{
		slug: "combo-streaming",
		name: "Combo Streaming Total",
		productId: "combo-1",
		price: 35,
		duracion: "1 Mes",
		tagline: "3 plataformas de streaming por 30 días",
		description: "Elige tres plataformas de streaming y paga menos que contratándolas por separado. Una sola activación, un solo soporte y una sola fecha de renovación.",
		includes: [
			"3 plataformas a elección del catálogo",
			"Una única fecha de vencimiento",
			"Ahorro frente a la compra individual",
			"Soporte unificado por WhatsApp"
		],
		faq: [{
			q: "¿Qué plataformas puedo elegir?",
			a: "Cualquiera de las disponibles en la tienda: Netflix, Disney+, HBO Max, Prime Video y más."
		}, {
			q: "¿Puedo cambiar una plataforma a mitad de mes?",
			a: "El combo se define al activarlo; los cambios se aplican en la siguiente renovación."
		}]
	}
];
function getPlatformPage(slug) {
	return platformPages.find((p) => p.slug === slug);
}
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/useIsAdmin-B5KXC5Eo.js
/** Reads the signed-in user's persisted roles. UI checks never replace server authorization. */
function useIsAdmin() {
	const [isAdmin, setIsAdmin] = (0, import_react.useState)(false);
	const [isEditor, setIsEditor] = (0, import_react.useState)(false);
	const [isSupplier, setIsSupplier] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		async function check() {
			const { data: userData, error: userError } = await supabase.auth.getUser();
			const userId = userData.user?.id;
			if (!userId) {
				if (!cancelled) {
					setIsAdmin(false);
					setIsEditor(false);
					setIsSupplier(false);
					setLoading(false);
				}
				return;
			}
			try {
				if (userError) throw userError;
				const { data: rows, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
				if (error) throw error;
				const roles = (rows ?? []).map((row) => row.role);
				const admin = roles.includes("admin");
				const editor = roles.includes("editor");
				const supplier = roles.includes("proveedor");
				if (!cancelled) {
					setIsAdmin(admin);
					setIsEditor(editor);
					setIsSupplier(supplier);
					setLoading(false);
				}
			} catch (err) {
				console.error("Error in useIsAdmin check:", err);
				if (!cancelled) setLoading(false);
			}
		}
		check();
		const { data: sub } = supabase.auth.onAuthStateChange((event) => {
			if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
				setLoading(true);
				check();
			}
		});
		return () => {
			cancelled = true;
			sub.subscription.unsubscribe();
		};
	}, []);
	return {
		isAdmin,
		isEditor,
		isSupplier,
		isAuthorized: isAdmin || isSupplier,
		loading
	};
}
//#endregion
export { setConsent as a, getAnalyticsDashboard as c, getConsent as i, createSsrRpc as l, getPlatformPage as n, useAnalytics as o, platformPages as r, usePageView as s, useIsAdmin as t, useServerFn as u };
