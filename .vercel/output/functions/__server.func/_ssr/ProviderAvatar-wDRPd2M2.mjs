import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as User, v as ShieldCheck } from "../_libs/lucide-react.mjs";
import { c as getAvatarUrl } from "./data-BqcQodSt.mjs";
import { i as normalizeEffect } from "./avatar-effects-XfJ0Ki_h.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ProviderAvatar-wDRPd2M2.js
var import_jsx_runtime = require_jsx_runtime();
/**
* Envoltorio circular que dibuja el efecto animado alrededor del avatar.
* Todas las animaciones son CSS (transform/opacity) y respetan prefers-reduced-motion.
*/
function AvatarEffect({ effect, size = "md", className = "", children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `avfx avfx-${normalizeEffect(effect)} avfx-${size} ${className}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": true,
				className: "avfx-l1"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				"aria-hidden": true,
				className: "avfx-l2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "avfx-content",
				children
			})
		]
	});
}
var BOX = {
	sm: "w-12 h-12",
	md: "w-28 h-28",
	lg: "w-40 h-40"
};
/**
* Avatar único del proveedor: misma imagen y mismo efecto en panel de proveedor,
* tienda pública, directorio y panel de administración.
*/
function ProviderAvatar({ src, effect, size = "md", status, verified, alt = "Avatar del proveedor", className = "" }) {
	const fx = normalizeEffect(effect);
	const resolved = getAvatarUrl(src);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `relative inline-block ${className}`,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AvatarEffect, {
				effect: fx,
				size,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: `${BOX[size]} rounded-full overflow-hidden border border-white/10 bg-white/5 grid place-items-center`,
					children: resolved ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: resolved,
						alt,
						loading: "lazy",
						className: "w-full h-full object-cover"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "w-1/2 h-1/2 text-muted-foreground" })
				})
			}),
			verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "absolute -bottom-1 -right-1 z-20 bg-green-500 text-white p-1 rounded-xl border-2 border-ink",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "w-3 h-3" })
			}),
			status && !verified && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `absolute bottom-0 right-0 z-20 w-3 h-3 rounded-full border-2 border-ink ${status === "online" ? "bg-green-500" : "bg-muted-foreground"}` })
		]
	});
}
//#endregion
export { ProviderAvatar as n, AvatarEffect as t };
