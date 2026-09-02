import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, CalendarDays, Handshake, ShieldCheck } from "lucide-react";
import { DistributorLayout } from "@/components/distributor/DistributorLayout";
import { getDistributorDashboardStats } from "@/lib/distributor.functions";

export const Route = createFileRoute("/_authenticated/distribuidor/")({
  component: DistributorDashboard,
});

function DistributorDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["distributor-dashboard"],
    queryFn: () => getDistributorDashboardStats(),
  });

  return (
    <DistributorLayout
      title="Resumen comercial"
      subtitle="Un espacio exclusivo para tu operación comercial, separado de la tienda y de la gestión de proveedores."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <section className="rounded-2xl border border-white/8 bg-white/[0.035] p-5">
          <ShieldCheck className="h-5 w-5 text-emerald-300" />
          <p className="mt-5 text-[10px] font-black uppercase tracking-widest text-white/40">Estado de cuenta</p>
          <p className="mt-1 text-xl font-black text-white">
            {isLoading ? "—" : stats?.isActive ? "Activa" : "En revisión"}
          </p>
        </section>
        <section className="rounded-2xl border border-white/8 bg-white/[0.035] p-5">
          <Handshake className="h-5 w-5 text-sky-300" />
          <p className="mt-5 text-[10px] font-black uppercase tracking-widest text-white/40">Perfil comercial</p>
          <p className="mt-1 truncate text-xl font-black text-white">{isLoading ? "—" : stats?.displayName}</p>
        </section>
        <section className="rounded-2xl border border-white/8 bg-white/[0.035] p-5">
          <CalendarDays className="h-5 w-5 text-violet-300" />
          <p className="mt-5 text-[10px] font-black uppercase tracking-widest text-white/40">Vinculado desde</p>
          <p className="mt-1 text-xl font-black text-white">
            {isLoading || !stats?.joinedAt
              ? "—"
              : new Intl.DateTimeFormat("es-PE", { month: "short", year: "numeric" }).format(new Date(stats.joinedAt))}
          </p>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-sky-400/20 bg-sky-400/[0.06] p-5 sm:p-6">
        <div className="flex gap-4">
          <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
          <div>
            <h2 className="font-semibold text-white">Rol de distribución separado</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/55">
              Este panel no incluye billetera, categorías ni compra de productos. La creación de
              productos, el inventario y las credenciales están reservados para Proveedor; los
              pedidos, clientes y comisiones aparecerán aquí cuando administración los asigne a tu
              cuenta comercial.
            </p>
          </div>
        </div>
      </section>
    </DistributorLayout>
  );
}
