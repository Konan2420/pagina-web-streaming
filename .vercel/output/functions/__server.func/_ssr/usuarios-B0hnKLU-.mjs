import { g as createFileRoute, h as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { l as getUsersWithRoles } from "./admin.functions-Z_XiCNsk.mjs";
import { n as queryOptions } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/usuarios-B0hnKLU-.js
var usersQueryOptions = queryOptions({
	queryKey: ["admin-users-roles"],
	queryFn: () => getUsersWithRoles()
});
var $$splitComponentImporter = () => import("./usuarios-C7_QCLYt.mjs");
var Route = createFileRoute("/_authenticated/admin/usuarios")({
	loader: ({ context }) => context.queryClient.ensureQueryData(usersQueryOptions),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { usersQueryOptions as n, Route as t };
