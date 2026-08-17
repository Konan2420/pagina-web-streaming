import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as supabase } from "./client-BoZLFmz6.mjs";
import { r as TiendaPage, t as AuthModal } from "./tienda-D4Vlr0J7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BeDUXsUN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/** Subscribes to Supabase auth state and returns the current session. */
function useSupabaseSession() {
	const [session, setSession] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		supabase.auth.getSession().then(({ data }) => setSession(data.session));
		const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
		return () => sub.subscription.unsubscribe();
	}, []);
	return session;
}
var INTERACTIVE_SELECTOR = [
	"a[href]",
	"button:not([disabled])",
	"input:not([disabled])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	"[role=\"button\"]",
	"[contenteditable=\"true\"]"
].join(", ");
var LANDING_SHORTCUT_KEYS = /* @__PURE__ */ new Set([
	"?",
	"/",
	"c",
	"1",
	"2",
	"3",
	"g",
	"h"
]);
function isInsideAuthModal(target) {
	return target instanceof Element && Boolean(target.closest("[aria-labelledby=\"auth-modal-title\"]"));
}
function isInteractiveTarget(target) {
	return target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));
}
/**
* Requires a Supabase session for every interactive control rendered by the
* root landing route while leaving the shared /tienda route unchanged.
*/
function LandingAuthGate({ children }) {
	const session = useSupabaseSession();
	const [authOpen, setAuthOpen] = (0, import_react.useState)(false);
	const openLogin = (0, import_react.useCallback)(() => setAuthOpen(true), []);
	(0, import_react.useEffect)(() => {
		if (session) setAuthOpen(false);
	}, [session]);
	(0, import_react.useEffect)(() => {
		const blockLandingShortcut = (event) => {
			if (session || isInsideAuthModal(event.target)) return;
			if (!LANDING_SHORTCUT_KEYS.has(event.key.toLowerCase())) return;
			event.preventDefault();
			event.stopPropagation();
			openLogin();
		};
		window.addEventListener("keydown", blockLandingShortcut, true);
		return () => window.removeEventListener("keydown", blockLandingShortcut, true);
	}, [openLogin, session]);
	const handleClickCapture = (event) => {
		if (session || isInsideAuthModal(event.target) || !isInteractiveTarget(event.target)) return;
		event.preventDefault();
		event.stopPropagation();
		openLogin();
	};
	const handleFocusCapture = (event) => {
		if (session || isInsideAuthModal(event.target) || !isInteractiveTarget(event.target)) return;
		if (event.target instanceof HTMLElement) event.target.blur();
		openLogin();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		onClickCapture: handleClickCapture,
		onFocusCapture: handleFocusCapture,
		children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthModal, {
			open: authOpen,
			onClose: () => setAuthOpen(false)
		})]
	});
}
var SplitComponent = () => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LandingAuthGate, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TiendaPage, {}) });
//#endregion
export { SplitComponent as component };
