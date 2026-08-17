import { g as createFileRoute, h as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getAdminDashboardStats } from "./admin.functions-Z_XiCNsk.mjs";
import { n as queryOptions } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-BIPaWa1t.js
var adminStatsQueryOptions = queryOptions({
	queryKey: ["admin-dashboard-stats"],
	queryFn: () => getAdminDashboardStats(),
	staleTime: 3e4
});
var $$splitComponentImporter = () => import("./admin-Dm1eHDRG.mjs");
var Route = createFileRoute("/_authenticated/admin/")({
	loader: ({ context }) => context.queryClient.ensureQueryData(adminStatsQueryOptions),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { adminStatsQueryOptions as n, Route as t };
