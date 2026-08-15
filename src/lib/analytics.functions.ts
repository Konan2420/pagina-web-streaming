import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { setResponseHeader } from "@tanstack/react-start/server";
import type { Database } from "@/integrations/supabase/types";

export type Json = Database["public"]["Tables"]["analytics_events"]["Row"]["metadata"];

export type TrackEventInput = {
  event_type: string;
  event_name?: string | null;
  user_id?: string | null;
  session_id?: string | null;
  path?: string | null;
  referrer?: string | null;
  metadata?: Json;
};

export type AnalyticsEvent = {
  id: string;
  event_type: string;
  event_name: string | null;
  path: string | null;
  created_at: string;
  metadata: Json;
};

export type AnalyticsDashboard = {
  totalEvents: number;
  events24h: number;
  events7d: number;
  events30d: number;
  uniqueSessions: number;
  eventsByType: { event_type: string; count: number }[];
  funnel: {
    page_views: number;
    signups: number;
    add_to_cart: number;
    purchase: number;
  };
  topProducts: { producto_id: string; producto_nombre: string; count: number; revenue: number }[];
  recentEvents: AnalyticsEvent[];
};

function countByKey<T>(items: T[], keyFn: (item: T) => string): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

/** Write a single analytics event from the client via server function. */
export const trackEvent = createServerFn({ method: "POST" })
  .validator((data: TrackEventInput) => {
    if (!data?.event_type || typeof data.event_type !== "string") {
      throw new Error("event_type is required");
    }
    return data;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("analytics_events").insert({
      event_type: data.event_type,
      event_name: data.event_name ?? null,
      user_id: data.user_id ?? null,
      session_id: data.session_id ?? null,
      path: data.path ?? null,
      referrer: data.referrer ?? null,
      metadata: data.metadata ?? {},
    });

    if (error) {
      console.error("[analytics] trackEvent failed", error);
      throw new Error("Failed to track event");
    }

    return { ok: true };
  });

/** Read-only dashboard for admins. Cached 60s at the edge. */
export const getAnalyticsDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AnalyticsDashboard> => {
    const { supabase, userId } = context;

    const { data: isAdmin, error: roleError } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      throw new Error("Forbidden: admin access required");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    setResponseHeader(
      "Cache-Control",
      "private, max-age=60, s-maxage=60, stale-while-revalidate=300",
    );

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const [
      totalRes,
      dayRes,
      weekRes,
      monthRes,
      pageViewsRes,
      signupsRes,
      cartRes,
      purchaseRes,
      recentEventsRes,
      purchasesListRes,
    ] = await Promise.all([
      supabaseAdmin.from("analytics_events").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .gte("created_at", dayAgo),
      supabaseAdmin
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      supabaseAdmin
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .gte("created_at", monthAgo),
      supabaseAdmin
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "page_view"),
      supabaseAdmin
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "signup"),
      supabaseAdmin
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "add_to_cart"),
      supabaseAdmin
        .from("analytics_events")
        .select("*", { count: "exact", head: true })
        .eq("event_type", "purchase"),
      supabaseAdmin
        .from("analytics_events")
        .select("id, event_type, event_name, path, session_id, created_at, metadata")
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("analytics_events")
        .select("metadata, session_id")
        .eq("event_type", "purchase")
        .gte("created_at", monthAgo)
        .order("created_at", { ascending: false })
        .limit(1000),
    ]);

    const recentEvents = (recentEventsRes.data ?? []).map((row) => ({
      id: row.id,
      event_type: row.event_type,
      event_name: row.event_name,
      path: row.path,
      created_at: row.created_at,
      metadata: row.metadata,
    }));

    const allRecentEvents = (recentEventsRes.data ?? []).slice(0, 1000);
    const uniqueSessions = new Set(allRecentEvents.map((e) => e.session_id).filter(Boolean)).size;

    const eventsByType = countByKey(allRecentEvents, (e) => e.event_type).map((e) => ({
      event_type: e.key,
      count: e.count,
    }));

    const productMap = new Map<
      string,
      { producto_id: string; producto_nombre: string; count: number; revenue: number }
    >();
    for (const row of purchasesListRes.data ?? []) {
      const meta = (row.metadata ?? {}) as Record<string, Json>;
      const id = String(meta.producto_id ?? "unknown");
      const name = String(meta.producto_nombre ?? "Sin nombre");
      const price = typeof meta.precio === "number" ? meta.precio : 0;
      const current = productMap.get(id) ?? {
        producto_id: id,
        producto_nombre: name,
        count: 0,
        revenue: 0,
      };
      current.count += 1;
      current.revenue += price;
      productMap.set(id, current);
    }
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

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
        purchase: purchaseRes.count ?? 0,
      },
      topProducts,
      recentEvents,
    };
  });
