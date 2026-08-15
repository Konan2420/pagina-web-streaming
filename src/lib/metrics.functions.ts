import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";

export type PublicMetrics = {
  totalUsers: number;
  totalOrders: number;
  ordersLast7Days: number;
  recentActivity: { name: string; when: string }[];
};

/** Retries an async op with exponential backoff (base 200ms, capped at 2s). */
async function withRetry<T>(op: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await op();
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1) break;
      await new Promise((r) => setTimeout(r, Math.min(200 * 2 ** i, 2000)));
    }
  }
  throw lastErr;
}

function firstName(full: string | null): string {
  const clean = (full ?? "").trim().split(/\s+/)[0] ?? "";
  return clean.length ? clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() : "Alguien";
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "hace instantes";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return `hace ${d} d`;
}

export const getPublicMetrics = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicMetrics> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Cache at the edge/CDN for 60s, allow serving stale for 5 min while refreshing.
    setResponseHeader(
      "Cache-Control",
      "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
    );

    const [usersRes, ordersRes, recentOrdersRes, recentProfilesRes] = await Promise.all([
      withRetry(async () =>
        supabaseAdmin.from("profiles").select("*", { count: "exact", head: true }),
      ),
      withRetry(async () =>
        supabaseAdmin.from("orders").select("*", { count: "exact", head: true }),
      ),
      withRetry(async () =>
        supabaseAdmin
          .from("orders")
          .select("*", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo),
      ),
      withRetry(async () =>
        supabaseAdmin
          .from("profiles")
          .select("nombre_completo, created_at")
          .order("created_at", { ascending: false })
          .limit(6),
      ),
    ]);

    const recentActivity = (recentProfilesRes.data ?? []).map((p) => ({
      name: firstName(p.nombre_completo),
      when: relativeTime(p.created_at),
    }));

    return {
      totalUsers: usersRes.count ?? 0,
      totalOrders: ordersRes.count ?? 0,
      ordersLast7Days: recentOrdersRes.count ?? 0,
      recentActivity,
    };
  },
);
