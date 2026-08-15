import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart3,
  MousePointerClick,
  ShoppingCart,
  Users,
  CreditCard,
  TrendingUp,
  Clock,
  Activity,
} from "lucide-react";
import { getAnalyticsDashboard } from "@/lib/analytics.functions";

const dashboardQueryOptions = queryOptions({
  queryKey: ["analytics-dashboard"],
  queryFn: () => getAnalyticsDashboard(),
  staleTime: 60_000,
  gcTime: 5 * 60_000,
});

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — CMD Streaming" },
      { name: "description", content: "Panel de analítica interna de CMD Streaming." },
      { property: "og:title", content: "Analytics — CMD Streaming" },
      { property: "og:description", content: "Panel de analítica interna." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQueryOptions),
  component: AnalyticsPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background text-foreground p-8">
      <p className="text-red-400">
        Error: {error instanceof Error ? error.message : String(error)}
      </p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background text-foreground p-8">
      <p>No se encontraron datos.</p>
    </div>
  ),
});

function AnalyticsPage() {
  const { data: dashboard } = useSuspenseQuery(dashboardQueryOptions);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/tienda"
            className="inline-flex items-center gap-2 text-sm text-white/78 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la tienda
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl gradient-violet grid place-items-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl sm:text-3xl text-white uppercase">Analytics</h1>
            <p className="text-xs text-white/70">Métricas internas en tiempo real</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard icon={Activity} label="Eventos totales" value={dashboard.totalEvents} />
          <KpiCard icon={Clock} label="Últimas 24h" value={dashboard.events24h} />
          <KpiCard icon={TrendingUp} label="Últimos 7 días" value={dashboard.events7d} />
          <KpiCard icon={Users} label="Sesiones únicas" value={dashboard.uniqueSessions} />
        </div>

        {/* Funnel */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="glass-card rounded-2xl border border-white/10 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
              <MousePointerClick className="w-4 h-4 text-violet-2" />
              Embudo de conversión
            </h2>
            <div className="space-y-4">
              <FunnelStep
                label="Vistas de página"
                value={dashboard.funnel.page_views}
                max={dashboard.funnel.page_views}
              />
              <FunnelStep
                label="Registros"
                value={dashboard.funnel.signups}
                max={dashboard.funnel.page_views}
              />
              <FunnelStep
                label="Añadir al carrito"
                value={dashboard.funnel.add_to_cart}
                max={dashboard.funnel.page_views}
              />
              <FunnelStep
                label="Compras"
                value={dashboard.funnel.purchase}
                max={dashboard.funnel.page_views}
              />
            </div>
          </div>

          <div className="glass-card rounded-2xl border border-white/10 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
              <BarChart3 className="w-4 h-4 text-violet-2" />
              Eventos por tipo
            </h2>
            <div className="space-y-3">
              {dashboard.eventsByType.length === 0 && (
                <p className="text-sm text-white/62">Sin eventos registrados.</p>
              )}
              {dashboard.eventsByType.map((e) => (
                <div key={e.event_type} className="flex items-center gap-3">
                  <span className="text-xs text-white/70 capitalize w-32 truncate">
                    {e.event_type}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full gradient-violet"
                      style={{
                        width: `${Math.max(5, Math.min(100, (e.count / Math.max(...dashboard.eventsByType.map((x) => x.count))) * 100))}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-white font-semibold w-8 text-right">{e.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top products */}
        <div className="glass-card rounded-2xl border border-white/10 p-5 mb-8">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
            <CreditCard className="w-4 h-4 text-violet-2" />
            Productos más vendidos (30 días)
          </h2>
          {dashboard.topProducts.length === 0 ? (
            <p className="text-sm text-white/62">Aún no hay compras registradas.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-white/62 border-b border-white/10">
                    <th className="pb-2 font-medium">Producto</th>
                    <th className="pb-2 font-medium text-right">Ventas</th>
                    <th className="pb-2 font-medium text-right">Ingresos</th>
                  </tr>
                </thead>
                <tbody className="text-white/80">
                  {dashboard.topProducts.map((p) => (
                    <tr key={p.producto_id} className="border-b border-white/5 last:border-0">
                      <td className="py-3">{p.producto_nombre}</td>
                      <td className="py-3 text-right">{p.count}</td>
                      <td className="py-3 text-right">S/ {p.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent events */}
        <div className="glass-card rounded-2xl border border-white/10 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
            <ShoppingCart className="w-4 h-4 text-violet-2" />
            Eventos recientes
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-white/62 border-b border-white/10">
                  <th className="pb-2 font-medium">Evento</th>
                  <th className="pb-2 font-medium">Nombre</th>
                  <th className="pb-2 font-medium">Ruta</th>
                  <th className="pb-2 font-medium text-right">Hora</th>
                </tr>
              </thead>
              <tbody className="text-white/80">
                {dashboard.recentEvents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-white/62">
                      Sin eventos recientes.
                    </td>
                  </tr>
                )}
                {dashboard.recentEvents.map((e) => (
                  <tr key={e.id} className="border-b border-white/5 last:border-0">
                    <td className="py-2 capitalize">{e.event_type}</td>
                    <td className="py-2 text-white/78">{e.event_name ?? "—"}</td>
                    <td className="py-2 text-white/78 text-xs">{e.path ?? "—"}</td>
                    <td className="py-2 text-right text-xs text-white/78">
                      {new Date(e.created_at).toLocaleString("es-PE")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
}) {
  return (
    <div className="glass-card rounded-2xl border border-white/10 p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-violet-2" />
        <span className="text-xs text-white/70">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white">{value.toLocaleString("es-PE")}</p>
    </div>
  );
}

function FunnelStep({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-white/70">{label}</span>
        <span className="text-white font-semibold">
          {value} ({pct}%)
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full gradient-violet transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
