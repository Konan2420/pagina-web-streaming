import { l as getUsersWithRoles, s as getManualOrders } from "./admin.functions-Z_XiCNsk.mjs";
import { n as queryOptions } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/pedidos-manuales-b1f6GIyF.js
var manualOrdersQueryOptions = queryOptions({
	queryKey: ["admin-manual-orders"],
	queryFn: () => getManualOrders()
});
var usersQueryOptions = queryOptions({
	queryKey: ["admin-users-list"],
	queryFn: () => getUsersWithRoles()
});
//#endregion
export { usersQueryOptions as n, manualOrdersQueryOptions as t };
