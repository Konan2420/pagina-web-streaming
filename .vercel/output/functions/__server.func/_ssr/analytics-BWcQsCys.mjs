import { t as getAnalyticsDashboard } from "./analytics.functions-Ci4eeTLq.mjs";
import { n as queryOptions } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics-BWcQsCys.js
var dashboardQueryOptions = queryOptions({
	queryKey: ["analytics-dashboard"],
	queryFn: () => getAnalyticsDashboard(),
	staleTime: 6e4,
	gcTime: 5 * 6e4
});
//#endregion
export { dashboardQueryOptions as t };
