import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { Users, Database, ShoppingCart, TrendingUp, Clock, ExternalLink, Tv } from "lucide-react";
import { getAdminDashboardStats } from "@/lib/admin.functions";
import { AdminLayout } from "@/components/admin/AdminLayout";
import type { LucideIcon } from "lucide-react";

type StatCardColor = "primary" | "blue" | "green" | "violet";

const adminStatsQueryOptions = queryOptions({
  queryKey: ["admin-dashboard-stats"],
  queryFn: () => getAdminDashboardStats(),
  staleTime: 30_000,
});

export const Route = createFileRoute("/_authenticated/admin/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminStatsQueryOptions),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats } = useSuspenseQuery(adminStatsQueryOptions);
  const { isAdmin } = Route.useRouteContext();

  return (
    <AdminLayout title="Resumen" subtitle="Visión general del sistema de ventas">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard icon={Users} label="Usuarios Totales" value={stats.totalUsers} color="blue" />
        <StatCard
          icon={Database}
          label="Cuentas en Stock"
          value={stats.totalStock}
          secondaryLabel={`${stats.availableStock} disponibles`}
          color="primary"
        />
        <StatCard
          icon={ShoppingCart}
          label="Ventas Realizadas"
          value={stats.totalSales}
          color="green"
        />
        <StatCard
          icon={TrendingUp}
          label="Eficiencia Stock"
          value={
            stats.totalStock > 0 ? Math.round((stats.availableStock / stats.totalStock) * 100) : 0
          }
          unit="%"
          color="violet"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Sales Table */}
        <div className="lg:col-span-2 glass-card rounded-2xl border border-border p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Ventas Recientes
            </h3>
            <Link
              to="/admin/ventas"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Ver todas <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">Usuario</th>
                  <th className="pb-3 font-medium">Producto</th>
                  <th className="pb-3 font-medium">Monto</th>
                  <th className="pb-3 font-medium text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {stats.recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-muted-foreground">
                      No hay ventas registradas aún.
                    </td>
                  </tr>
                ) : (
                  stats.recentSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="border-b border-border last:border-0 hover:bg-muted/45 transition-colors group"
                    >
                      <td className="py-4">
                        <p className="font-medium text-foreground truncate w-32">
                          {sale.profiles?.nombre_completo || "Invitado"}
                        </p>
                      </td>
                      <td className="py-4 text-muted-foreground">{sale.producto_nombre}</td>
                      <td className="py-4 font-mono text-primary">S/ {sale.precio.toFixed(2)}</td>
                      <td className="py-4 text-right text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div className="glass-card rounded-2xl border border-border p-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Acciones Rápidas
            </h3>
            <div className="space-y-3">
              <ActionButton
                icon={Database}
                label="Cargar Cuentas"
                href="/admin/stock"
                description="Añadir nuevas credenciales al stock."
              />
              {isAdmin && (
                <ActionButton
                  icon={Tv}
                  label="Gestionar Servicios"
                  href="/admin/servicios"
                  description="Editar plataformas y categorías."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  secondaryLabel,
  unit = "",
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  secondaryLabel?: string;
  unit?: string;
  color: StatCardColor;
}) {
  const colors: Record<StatCardColor, string> = {
    primary: "bg-primary/20 text-primary border-primary/30",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    green: "bg-green-500/20 text-green-400 border-green-500/30",
    violet: "bg-violet-500/20 text-violet-400 border-violet-500/30",
  };

  return (
    <div className="glass-card rounded-2xl border border-border p-6 hover:border-primary/35 transition-colors">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 rounded-xl grid place-items-center border ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-display text-foreground">{value}</span>
        {unit && <span className="text-lg font-display text-muted-foreground">{unit}</span>}
      </div>
      {secondaryLabel && <p className="text-xs text-muted-foreground mt-1">{secondaryLabel}</p>}
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  description,
  href,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  href: "/admin/stock" | "/admin/servicios";
}) {
  return (
    <Link
      to={href}
      className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/45 transition-all group border border-transparent hover:border-border"
    >
      <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-colors">
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
          {label}
        </p>
        <p className="text-xs text-muted-foreground leading-tight mt-0.5">{description}</p>
      </div>
    </Link>
  );
}
