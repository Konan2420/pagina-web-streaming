import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics-D7tA51ap.js
var import_jsx_runtime = require_jsx_runtime();
var SplitErrorComponent = ({ error }) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
	className: "min-h-screen bg-background text-foreground p-8",
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "text-red-400",
		children: ["Error: ", error instanceof Error ? error.message : String(error)]
	})
});
//#endregion
export { SplitErrorComponent as errorComponent };
