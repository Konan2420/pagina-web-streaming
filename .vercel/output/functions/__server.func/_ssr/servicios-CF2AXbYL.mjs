import { g as createFileRoute, h as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as getServicios } from "./admin.functions-Z_XiCNsk.mjs";
import { n as queryOptions } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/servicios-CF2AXbYL.js
var serviciosQueryOptions = queryOptions({
	queryKey: ["admin-servicios-full"],
	queryFn: () => getServicios()
});
var $$splitComponentImporter = () => import("./servicios-DT4WPE9j.mjs");
var Route = createFileRoute("/_authenticated/admin/servicios")({
	loader: ({ context }) => context.queryClient.ensureQueryData(serviciosQueryOptions),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { serviciosQueryOptions as n, Route as t };
