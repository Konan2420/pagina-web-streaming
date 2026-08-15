import { createFileRoute, Link } from "@tanstack/react-router";
import { SupplierLayout } from "@/components/supplier/SupplierLayout";
import { useQuery } from "@tanstack/react-query";
import { getSupplierDashboardStats, getSupplierReviews } from "@/lib/supplier.functions";
import { Package, TrendingUp, CheckCircle2, Star, ShieldCheck, Plus } from "lucide-react";
import { ProviderAvatar } from "@/components/supplier/ProviderAvatar";
import { useFuturisticSound } from "@/hooks/useSound";

export const Route = createFileRoute("/_authenticated/proveedor/")({
  component: SupplierDashboard,
});

function SupplierDashboard() {
  const { playHover, playClick } = useFuturisticSound();
  const { data: stats, isLoading } = useQuery({
    queryKey: ["supplier-stats"],
    queryFn: () => getSupplierDashboardStats(),
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ["supplier-reviews"],
    queryFn: () => getSupplierReviews(),
  });

  if (isLoading) {
    return (
      <SupplierLayout title="Dashboard" subtitle="Cargando tus estadísticas...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/5 border border-white/10 rounded-2xl" />
          ))}
        </div>
      </SupplierLayout>
    );
  }

  const statCards = [
    {
      label: "Stock Disponible",
      value: stats?.availableStock ?? 0,
      icon: Package,
      color: "text-blue-400",
    },
    {
      label: "Ventas Totales",
      value: stats?.totalSales ?? 0,
      icon: TrendingUp,
      color: "text-green-400",
    },
    {
      label: "Mis Ganancias",
      value: `S/ ${Number(stats?.earnings ?? 0).toFixed(2)}`,
      icon: ShieldCheck,
      color: "text-purple-400",
    },
    {
      label: "Calificación",
      value: stats?.rating != null ? `${Number(stats.rating).toFixed(1)} ★` : "Sin calificación",
      icon: Star,
      color: "text-yellow-400",
    },
  ];

  return (
    <SupplierLayout
      title="Resumen General"
      subtitle="Gestiona tu inventario y revisa tu rendimiento como proveedor."
    >
      <div className="flex items-center gap-4 mb-8">
        <ProviderAvatar
          src={stats?.avatarUrl}
          effect={stats?.avatarEffect}
          size="sm"
          verified={stats?.isVerified}
          alt={`Avatar de ${stats?.displayName || "proveedor"}`}
        />
        <div>
          <p className="font-display text-lg text-white uppercase tracking-tight">
            {stats?.displayName || "Tu tienda"}
          </p>
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest">
            {stats?.isVerified ? "Proveedor verificado" : "Pendiente de verificación"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statCards.map((stat, i) => (
          <div
            key={i}
            className="bg-ink/40 backdrop-blur-xl border border-white/5 p-6 rounded-2xl hover:border-primary/30 transition-all group"
            onMouseEnter={playHover}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              {stat.label === "Calificación" && stats?.isVerified && (
                <div className="flex items-center gap-1 bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-500/20">
                  <CheckCircle2 className="w-3 h-3" /> VERIFICADO
                </div>
              )}
            </div>
            <p className="text-white/40 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
            <p
              className={`font-display text-white mt-1 ${typeof stat.value === "string" && stat.value.length > 6 ? "text-lg" : "text-3xl"}`}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-ink/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl">
          <h3 className="text-xl font-display text-white mb-6 uppercase tracking-tight">
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/proveedor/inventario"
              search={{ add: true }}
              onClick={() => playClick()}
              className="flex items-center justify-center gap-3 p-4 bg-primary text-white rounded-2xl font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="w-5 h-5" /> Agregar Cuentas
            </Link>
            <Link
              to="/proveedor/ventas"
              onClick={() => playClick()}
              className="flex items-center justify-center gap-3 p-4 bg-white/5 text-white rounded-2xl font-bold text-sm hover:bg-white/10 transition-all border border-white/10"
            >
              Ver Mis Ventas
            </Link>
          </div>
        </div>

        <div className="bg-ink/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl">
          <h3 className="text-xl font-display text-white mb-6 uppercase tracking-tight">
            Estado del Servicio
          </h3>
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
            <div
              className={`w-12 h-12 rounded-full grid place-items-center border ${stats?.isVerified ? "bg-green-500/20 border-green-500/30" : "bg-yellow-500/20 border-yellow-500/30"}`}
            >
              <CheckCircle2
                className={`w-6 h-6 ${stats?.isVerified ? "text-green-500" : "text-yellow-500"}`}
              />
            </div>
            <div>
              <p className="text-white font-bold text-sm">
                {!stats?.hasProfile
                  ? "Perfil incompleto"
                  : stats?.isVerified
                    ? "Cuenta Verificada"
                    : "Pendiente de verificación"}
              </p>
              <p className="text-white/40 text-xs">
                {!stats?.hasProfile
                  ? "Completa tu perfil para aparecer en la tienda."
                  : stats?.isVerified
                    ? "Tu perfil está visible en la tienda."
                    : "Un administrador debe verificar tu cuenta."}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-ink/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl">
          <h3 className="text-xl font-display text-white mb-6 uppercase tracking-tight">
            Modelo de Comisión
          </h3>
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                Tu porcentaje
              </p>
              <p className="text-4xl font-display text-primary">
                {Number(stats?.commissionRate ?? 70)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                Ventas brutas
              </p>
              <p className="text-xl font-display text-white">
                S/ {Number(stats?.grossRevenue ?? 0).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden mb-3">
            <div
              className="h-full bg-primary"
              style={{ width: `${Number(stats?.commissionRate ?? 70)}%` }}
            />
          </div>
          <p className="text-white/40 text-xs">
            Recibes S/ {Number(stats?.earnings ?? 0).toFixed(2)} de tus ventas. El porcentaje lo
            define la administración.
          </p>
        </div>

        <div className="bg-ink/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl">
          <h3 className="text-xl font-display text-white mb-6 uppercase tracking-tight">
            Reseñas de Clientes
          </h3>
          <div className="flex items-center gap-2 mb-5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star
                key={n}
                className={`w-5 h-5 ${n <= Math.round(Number(stats?.rating ?? 0)) ? "text-yellow-400 fill-yellow-400" : "text-white/15"}`}
              />
            ))}
            <span className="text-white/40 text-xs ml-2">
              {stats?.totalReviews
                ? `${Number(stats.rating).toFixed(1)} · ${stats.totalReviews} reseña${stats.totalReviews === 1 ? "" : "s"}`
                : "Aún sin reseñas"}
            </span>
          </div>
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {reviews.length === 0 ? (
              <p className="text-white/20 text-xs italic">
                Cuando tus clientes califiquen sus compras, aparecerán aquí.
              </p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`w-3 h-3 ${n <= r.rating ? "text-yellow-400 fill-yellow-400" : "text-white/15"}`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-white/30">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {r.comment && <p className="text-white/60 text-xs">{r.comment}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </SupplierLayout>
  );
}
