import { g as createFileRoute, h as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/inventario-CPXMDNNq.js
var $$splitComponentImporter = () => import("./inventario-m6yLwhW1.mjs");
var Route = createFileRoute("/_authenticated/proveedor/inventario")({
	validateSearch: (search) => ({ add: search["add"] === true || search["add"] === "true" ? true : void 0 }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
