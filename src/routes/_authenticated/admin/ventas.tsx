import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import {
  History,
  ShoppingCart,
  Search,
  User,
  ArrowRight,
  ExternalLink,
  CreditCard,
  Package,
  Clock,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import type { Tables } from "@/integrations/supabase/types";

type SaleProfile = Pick<Tables<"profiles">, "id" | "nombre_completo" | "whatsapp">;
type SaleWithProfile = Tables<"ventas"> & { profiles: SaleProfile | null };

const ventasQueryOptions = queryOptions({
  queryKey: ["admin-ventas-list"],
  queryFn: async () => {
    // No hay FK declarada entre ventas.user_id y profiles, así que unimos manualmente.
    const { data, error } = await supabase
      .from("ventas")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    const ventas = data || [];
    const userIds = [...new Set(ventas.map((v) => v.user_id).filter(Boolean))];

    let profilesMap: Record<string, SaleProfile> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nombre_completo, whatsapp")
        .in("id", userIds as string[]);
      profilesMap = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile]));
    }

    return ventas.map<SaleWithProfile>((sale) => ({
      ...sale,
      profiles: sale.user_id ? (profilesMap[sale.user_id] ?? null) : null,
    }));
  },
});

export const Route = createFileRoute("/_authenticated/admin/ventas")({
  loader: ({ context }) => context.queryClient.ensureQueryData(ventasQueryOptions),
  component: VentasManagement,
});

function VentasManagement() {
  const { data: ventas } = useSuspenseQuery(ventasQueryOptions);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVenta, setSelectedVenta] = useState<SaleWithProfile | null>(null);

  const filteredVentas = ventas.filter(
    (v) =>
      (v.producto_nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.profiles?.nombre_completo || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <AdminLayout title="Ventas" subtitle="Historial de transacciones automáticas">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar por usuario o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-white/40 bg-white/5 px-4 py-2.5 rounded-xl border border-white/5">
          <ShoppingCart className="w-4 h-4 text-primary" />
          <span>
            Total: <span className="text-white font-bold">{ventas.length}</span> ventas
          </span>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredVentas.length === 0 ? (
          <div className="py-20 text-center text-white/20 glass-card rounded-2xl border border-white/5">
            No se encontraron ventas que coincidan con la búsqueda.
          </div>
        ) : (
          filteredVentas.map((venta) => (
            <div
              key={venta.id}
              className="glass-card rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    venta.estado_pago === "completado"
                      ? "bg-green-500/10 text-green-400 border border-green-500/20"
                      : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                  }`}
                >
                  {venta.estado_pago}
                </span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* User Info */}
                <div className="flex items-center gap-3 md:w-64 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {venta.profiles?.nombre_completo || "Usuario Desconocido"}
                    </p>
                    <p className="text-[10px] text-white/40 font-mono">
                      {venta.profiles?.whatsapp || "Sin contacto"}
                    </p>
                  </div>
                </div>

                {/* Product Info */}
                <div className="flex-1 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">{venta.producto_nombre}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-mono text-primary font-bold">
                        S/ {Number(venta.monto ?? 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-white/20 flex items-center gap-1">
                        <CreditCard className="w-3 h-3" />
                        {venta.metodo_pago || "Directo"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Date and Action */}
                <div className="flex items-center justify-between md:flex-col md:items-end gap-2 md:w-40 shrink-0">
                  <span className="text-xs text-white/30 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date(venta.created_at).toLocaleString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedVenta(venta)}
                    className="flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
                  >
                    Detalles <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedVenta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar detalles de venta"
            onClick={() => setSelectedVenta(null)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="venta-details-title"
            className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-ink p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Venta
                </p>
                <h2
                  id="venta-details-title"
                  className="mt-1 text-xl font-display text-white uppercase"
                >
                  Detalles de la transacción
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVenta(null)}
                className="text-sm font-semibold text-white/60 hover:text-white"
              >
                Cerrar
              </button>
            </div>
            <dl className="mt-6 space-y-4 text-sm">
              <div>
                <dt className="text-white/40">Producto</dt>
                <dd className="mt-1 font-medium text-white">{selectedVenta.producto_nombre}</dd>
              </div>
              <div>
                <dt className="text-white/40">Cliente</dt>
                <dd className="mt-1 text-white">
                  {selectedVenta.profiles?.nombre_completo || "Usuario desconocido"}
                </dd>
              </div>
              <div>
                <dt className="text-white/40">Contacto</dt>
                <dd className="mt-1 text-white">
                  {selectedVenta.profiles?.whatsapp || "Sin contacto"}
                </dd>
              </div>
              <div>
                <dt className="text-white/40">Monto y método</dt>
                <dd className="mt-1 text-white">
                  S/ {Number(selectedVenta.monto ?? 0).toFixed(2)} ·{" "}
                  {selectedVenta.metodo_pago || "Directo"}
                </dd>
              </div>
              <div>
                <dt className="text-white/40">Estado</dt>
                <dd className="mt-1 text-white">{selectedVenta.estado_pago || "Pendiente"}</dd>
              </div>
              <div>
                <dt className="text-white/40">Fecha</dt>
                <dd className="mt-1 text-white">
                  {new Date(selectedVenta.created_at).toLocaleString()}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </AdminLayout>
  );
}
