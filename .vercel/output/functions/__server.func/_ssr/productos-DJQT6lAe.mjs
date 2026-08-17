import { o as getAdminProducts } from "./admin.functions-Z_XiCNsk.mjs";
import { n as queryOptions } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/productos-DJQT6lAe.js
var productsQueryOptions = queryOptions({
	queryKey: ["admin-products"],
	queryFn: () => getAdminProducts()
});
//#endregion
export { productsQueryOptions as t };
