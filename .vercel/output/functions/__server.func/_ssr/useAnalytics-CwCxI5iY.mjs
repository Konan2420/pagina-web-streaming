import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./client-BoZLFmz6.mjs";
import { t as useServerFn } from "./useServerFn-CrZF2pjq.mjs";
import { n as trackEvent } from "./analytics.functions-Ci4eeTLq.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/useAnalytics-CwCxI5iY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
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
export { usePageView as i, setConsent as n, useAnalytics as r, getConsent as t };
