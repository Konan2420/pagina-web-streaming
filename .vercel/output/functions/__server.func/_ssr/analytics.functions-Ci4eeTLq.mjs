import { c as createServerFn } from "./createServerFn-CVho-diU.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-eb4ID_9s.mjs";
import { t as createSsrRpc } from "./createSsrRpc-C6LzJFyz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics.functions-Ci4eeTLq.js
/** Write a single analytics event from the client via server function. */
var trackEvent = createServerFn({ method: "POST" }).validator((data) => {
	if (!data?.event_type || typeof data.event_type !== "string") throw new Error("event_type is required");
	return data;
}).handler(createSsrRpc("39a0417704f811794703987a71b321d62c2696baad2dc944fcb08205fb9476df"));
/** Read-only dashboard for admins. Cached 60s at the edge. */
var getAnalyticsDashboard = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("391684d8ef65bd4077644dcb0f3c50cb5f1f46857fe0b226ffeb07dd899622ce"));
//#endregion
export { trackEvent as n, getAnalyticsDashboard as t };
