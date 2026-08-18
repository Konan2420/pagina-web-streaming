import { n as createServerFn, s as setResponseHeader } from "./server-lRCoVKEP.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-ChR131yV.mjs";
import { t as createServerRpc } from "./createServerRpc-DBRgFQFD.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/analytics.functions-DAq5DtkL.js
function countByKey(items, keyFn) {
	const map = /* @__PURE__ */ new Map();
	for (const item of items) {
		const key = keyFn(item);
		if (!key) continue;
		map.set(key, (map.get(key) ?? 0) + 1);
	}
	return Array.from(map.entries()).map(([key, count]) => ({
		key,
		count
	})).sort((a, b) => b.count - a.count);
}
/** Write a single analytics event from the client via server function. */
var trackEvent_createServerFn_handler = createServerRpc({
	id: "39a0417704f811794703987a71b321d62c2696baad2dc944fcb08205fb9476df",
	name: "trackEvent",
	filename: "src/lib/analytics.functions.ts"
}, (opts) => trackEvent.__executeServer(opts));
var trackEvent = createServerFn({ method: "POST" }).validator((data) => {
	if (!data?.event_type || typeof data.event_type !== "string") throw new Error("event_type is required");
	return data;
}).handler(trackEvent_createServerFn_handler, async ({ data }) => {
	const { supabaseAdmin } = await import("./client.server-mxRd7bB2.mjs");
	const { error } = await supabaseAdmin.from("analytics_events").insert({
		event_type: data.event_type,
		event_name: data.event_name ?? null,
		user_id: data.user_id ?? null,
		session_id: data.session_id ?? null,
		path: data.path ?? null,
		referrer: data.referrer ?? null,
		metadata: data.metadata ?? {}
	});
	if (error) {
		console.error("[analytics] trackEvent failed", error);
		throw new Error("Failed to track event");
	}
	return { ok: true };
});
var getAnalyticsDashboard_createServerFn_handler = createServerRpc({
	id: "391684d8ef65bd4077644dcb0f3c50cb5f1f46857fe0b226ffeb07dd899622ce",
	name: "getAnalyticsDashboard",
	filename: "src/lib/analytics.functions.ts"
}, (opts) => getAnalyticsDashboard.__executeServer(opts));
var getAnalyticsDashboard = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(getAnalyticsDashboard_createServerFn_handler, async ({ context }) => {
	const { supabase, userId } = context;
	const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
		_user_id: userId,
		_role: "admin"
	});
	if (roleError || !isAdmin) throw new Error("Forbidden: admin access required");
	const { supabaseAdmin } = await import("./client.server-mxRd7bB2.mjs");
	setResponseHeader("Cache-Control", "private, max-age=60, s-maxage=60, stale-while-revalidate=300");
	const now = /* @__PURE__ */ new Date();
	const dayAgo = (/* @__PURE__ */ new Date(now.getTime() - 864e5)).toISOString();
	const weekAgo = (/* @__PURE__ */ new Date(now.getTime() - 6048e5)).toISOString();
	const monthAgo = (/* @__PURE__ */ new Date(now.getTime() - 2592e6)).toISOString();
	const [totalRes, dayRes, weekRes, monthRes, pageViewsRes, signupsRes, cartRes, purchaseRes, recentEventsRes, purchasesListRes] = await Promise.all([
		supabaseAdmin.from("analytics_events").select("*", {
			count: "exact",
			head: true
		}),
		supabaseAdmin.from("analytics_events").select("*", {
			count: "exact",
			head: true
		}).gte("created_at", dayAgo),
		supabaseAdmin.from("analytics_events").select("*", {
			count: "exact",
			head: true
		}).gte("created_at", weekAgo),
		supabaseAdmin.from("analytics_events").select("*", {
			count: "exact",
			head: true
		}).gte("created_at", monthAgo),
		supabaseAdmin.from("analytics_events").select("*", {
			count: "exact",
			head: true
		}).eq("event_type", "page_view"),
		supabaseAdmin.from("analytics_events").select("*", {
			count: "exact",
			head: true
		}).eq("event_type", "signup"),
		supabaseAdmin.from("analytics_events").select("*", {
			count: "exact",
			head: true
		}).eq("event_type", "add_to_cart"),
		supabaseAdmin.from("analytics_events").select("*", {
			count: "exact",
			head: true
		}).eq("event_type", "purchase"),
		supabaseAdmin.from("analytics_events").select("id, event_type, event_name, path, session_id, created_at, metadata").order("created_at", { ascending: false }).limit(50),
		supabaseAdmin.from("analytics_events").select("metadata, session_id").eq("event_type", "purchase").gte("created_at", monthAgo).order("created_at", { ascending: false }).limit(1e3)
	]);
	const recentEvents = (recentEventsRes.data ?? []).map((row) => ({
		id: row.id,
		event_type: row.event_type,
		event_name: row.event_name,
		path: row.path,
		created_at: row.created_at,
		metadata: row.metadata
	}));
	const allRecentEvents = (recentEventsRes.data ?? []).slice(0, 1e3);
	const uniqueSessions = new Set(allRecentEvents.map((e) => e.session_id).filter(Boolean)).size;
	const eventsByType = countByKey(allRecentEvents, (e) => e.event_type).map((e) => ({
		event_type: e.key,
		count: e.count
	}));
	const productMap = /* @__PURE__ */ new Map();
	for (const row of purchasesListRes.data ?? []) {
		const meta = row.metadata ?? {};
		const id = String(meta.producto_id ?? "unknown");
		const name = String(meta.producto_nombre ?? "Sin nombre");
		const price = typeof meta.precio === "number" ? meta.precio : 0;
		const current = productMap.get(id) ?? {
			producto_id: id,
			producto_nombre: name,
			count: 0,
			revenue: 0
		};
		current.count += 1;
		current.revenue += price;
		productMap.set(id, current);
	}
	const topProducts = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
	return {
		totalEvents: totalRes.count ?? 0,
		events24h: dayRes.count ?? 0,
		events7d: weekRes.count ?? 0,
		events30d: monthRes.count ?? 0,
		uniqueSessions,
		eventsByType,
		funnel: {
			page_views: pageViewsRes.count ?? 0,
			signups: signupsRes.count ?? 0,
			add_to_cart: cartRes.count ?? 0,
			purchase: purchaseRes.count ?? 0
		},
		topProducts,
		recentEvents
	};
});
//#endregion
export { getAnalyticsDashboard_createServerFn_handler, trackEvent_createServerFn_handler };
