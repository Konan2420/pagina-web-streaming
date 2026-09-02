import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  PackageCheck,
  PackagePlus,
  TrendingUp,
} from "lucide-react";
import { SupplierLayout } from "@/components/supplier/SupplierLayout";
import { getProviderDashboardStats, getProviderStockAlerts } from "@/lib/supplier.functions";

export const Route = createFileRoute("/_authenticated/proveedor/")({
  component: ProviderDashboard,
});

function ProviderDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["provider-dashboard"],
    queryFn: () => getProviderDashboardStats(),
  });
  const { data: stockAlerts = [] } = useQuery({
    queryKey: ["provider-stock-alerts"],
    queryFn: () => getProviderStockAlerts(),
  });

  const cards = [
    { label: "Productos", value: stats?.totalProducts ?? 0, icon: Boxes, tone: "text-sky-300" },
    {
      label: "Publicados",
      value: stats?.publishedProducts ?? 0,
      icon: CheckCircle2,
      tone: "text-emerald-300",
    },
    {
      label: "Stock disponible",
      value: stats?.availableInventory ?? 0,
      icon: PackagePlus,
      tone: "text-amber-300",
    },
    { label: "Ventas", value: stats?.totalSales ?? 0, icon: TrendingUp, tone: "text-primary" },
  ];

  return (
    <SupplierLayout
      title="Resumen"
      subtitle="Gestiona tus productos, inventario y ventas desde un espacio separado."
    >
      {stockAlerts.length > 0 && (
        <section className="mb-6 rounded-2xl border border-amber-300/25 bg-amber-300/[0.08] p-4 sm:p-5">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div className="min-w-0">
              <h2 className="text-sm font-black text-amber-50">Productos que necesitan stock</h2>
              <div className="mt-3 space-y-2">
                {stockAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-xl border border-amber-100/10 bg-black/10 px-3 py-2.5"
                  >
                    <p className="text-sm font-semibold text-white">{alert.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-amber-50/70">{alert.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <section
              key={card.label}
              className="rounded-2xl border border-white/8 bg-white/[0.035] p-5"
            >
              <Icon className={`h-5 w-5 ${card.tone}`} />
              <p className="mt-5 text-[10px] font-black uppercase tracking-widest text-white/40">
                {card.label}
              </p>
              <p className="mt-1 text-3xl font-black text-white">{isLoading ? "—" : card.value}</p>
            </section>
          );
        })}
      </div>

      <section className="mt-6 rounded-2xl border border-primary/20 bg-primary/[0.06] p-5 sm:p-6">
        <div className="flex gap-4">
          <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <h2 className="font-semibold text-white">Flujo de publicación protegido</h2>
            <p className="mt-1 text-sm leading-relaxed text-white/55">
              Puedes crear y actualizar productos propios. Cada cambio queda como borrador y CMD
              Streaming lo revisa antes de mostrarlo a los clientes.
            </p>
          </div>
        </div>
      </section>
    </SupplierLayout>
  );
}
