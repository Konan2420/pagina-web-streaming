import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Search,
  User,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Key,
  ExternalLink,
  Loader2,
  Smartphone,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DeliveryCelebrationModal } from "@/components/admin/DeliveryCelebrationModal";
import { approvePaymentAndDeliver } from "@/lib/admin.functions";
import { buildCredentialsWhatsAppMessage } from "@/lib/whatsapp-messages";
import { createWhatsAppUrl, openWhatsAppUrl } from "@/lib/whatsapp";
import { toast } from "sonner";

type OrderProfile = Pick<Tables<"profiles">, "id" | "nombre_completo" | "whatsapp">;
type OrderDelivery = Pick<
  Tables<"delivered_accounts">,
  "order_id" | "user_id" | "email" | "password" | "access_link" | "notes"
>;
type OrderWithDetails = Tables<"orders"> & {
  profile: OrderProfile | null;
  delivery: OrderDelivery | null;
};
type DeliveryCredentials = Pick<
  Tables<"delivered_accounts">,
  "email" | "password" | "access_link" | "notes"
>;
type CompletedDelivery = {
  orderId: string;
  productName: string;
  delivery: DeliveryCredentials;
};

async function copyCredential(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copiado`);
    return true;
  } catch {
    toast.error("No se pudo copiar. Selecciona el dato manualmente.");
    return false;
  }
}

const pedidosQueryOptions = queryOptions({
  queryKey: ["admin-pedidos-list"],
  queryFn: async () => {
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersError) throw ordersError;

    const userIds = [...new Set(orders.map((o) => o.user_id).filter(Boolean))];
    let profilesMap: Record<string, OrderProfile> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nombre_completo, whatsapp")
        .in("id", userIds as string[]);
      profilesMap = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile]));
    }

    // Fetch delivered accounts to check status
    const { data: delivered } = await supabase
      .from("delivered_accounts")
      .select("order_id, user_id, email, password, access_link, notes");

    const deliveredMap = Object.fromEntries(
      (delivered || []).map((delivery) => [delivery.order_id, delivery]),
    );

    return orders.map<OrderWithDetails>((order) => ({
      ...order,
      profile: profilesMap[order.user_id] ?? null,
      delivery: deliveredMap[order.id] ?? null,
    }));
  },
});

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  loader: ({ context }) => context.queryClient.ensureQueryData(pedidosQueryOptions),
  component: PedidosManagement,
});

function PedidosManagement() {
  const { data: pedidos } = useSuspenseQuery(pedidosQueryOptions);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedPedido, setSelectedPedido] = useState<OrderWithDetails | null>(null);
  const [completedDelivery, setCompletedDelivery] = useState<CompletedDelivery | null>(null);
  const queryClient = useQueryClient();
  const approvePaymentAndDeliverFn = useServerFn(approvePaymentAndDeliver);

  const filteredPedidos = pedidos.filter((p) => {
    const matchesSearch =
      (p.producto_nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.profile?.nombre_completo || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "pending")
      return matchesSearch && (p.estado === "pendiente" || p.estado === "pending_delivery");
    if (filterStatus === "delivered")
      return matchesSearch && (p.estado === "entregado" || p.estado === "delivered");
    return matchesSearch;
  });

  const approveMutation = useMutation({
    mutationFn: (orderId: string) => approvePaymentAndDeliverFn({ data: { orderId } }),
    onSuccess: (result) => {
      toast.success("Pago aprobado y cuenta entregada correctamente");
      queryClient.invalidateQueries({ queryKey: ["admin-pedidos-list"] });
      setSelectedPedido(null);
      setCompletedDelivery(result);
    },
    onError: (error) => {
      toast.error(`Error: ${error instanceof Error ? error.message : "Desconocido"}`);
    },
  });

  function getCredentialsWhatsAppUrl(pedido: OrderWithDetails) {
    if (!pedido.delivery) return;
    return createWhatsAppUrl(
      pedido.profile?.whatsapp,
      buildCredentialsWhatsAppMessage({
        customerName: pedido.profile?.nombre_completo,
        productName: pedido.producto_nombre,
        username: pedido.delivery.email,
        password: pedido.delivery.password,
        accessLink: pedido.delivery.access_link,
        notes: pedido.delivery.notes,
        expirationDate: pedido.fecha_vencimiento,
      }),
    );
  }

  function sendCredentialsByWhatsApp(pedido: OrderWithDetails) {
    const url = getCredentialsWhatsAppUrl(pedido);
    if (!url) {
      toast.error("Sin número de WhatsApp registrado");
      return;
    }
    if (!openWhatsAppUrl(url)) {
      toast.info("Permite las ventanas emergentes para abrir WhatsApp.");
    }
  }

  return (
    <AdminLayout
      title="Pedidos y Entregas"
      subtitle="Gestiona la entrega de credenciales a los clientes"
    >
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar por cliente o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-full lg:w-auto">
          <button
            onClick={() => setFilterStatus("all")}
            className={`flex-1 lg:flex-none px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === "all" ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-white/60 hover:text-white"}`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterStatus("pending")}
            className={`flex-1 lg:flex-none px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === "pending" ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/20" : "text-white/60 hover:text-white"}`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilterStatus("delivered")}
            className={`flex-1 lg:flex-none px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${filterStatus === "delivered" ? "bg-green-500 text-white shadow-lg shadow-green-500/20" : "text-white/60 hover:text-white"}`}
          >
            Entregados
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredPedidos.length === 0 ? (
          <div className="py-20 text-center text-white/20 glass-card rounded-2xl border border-white/5">
            No hay pedidos que coincidan con los filtros.
          </div>
        ) : (
          filteredPedidos.map((pedido) => {
            const isDelivered =
              pedido.estado === "delivered" || pedido.estado === "entregado" || !!pedido.delivery;
            const credentialsWhatsAppUrl = getCredentialsWhatsAppUrl(pedido);

            return (
              <div
                key={pedido.id}
                className="glass-card rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isDelivered
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                    }`}
                  >
                    {isDelivered ? "Entregado" : "Pendiente"}
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
                        {pedido.profile?.nombre_completo || "Usuario Desconocido"}
                      </p>
                      <p className="text-[10px] text-white/40 font-mono">
                        {pedido.profile?.whatsapp || "Sin contacto"}
                      </p>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">{pedido.producto_nombre}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-mono text-primary font-bold">
                          S/ {Number(pedido.precio ?? 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-white/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(pedido.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-stretch gap-2 md:w-48 shrink-0">
                    {!isDelivered ? (
                      <button
                        onClick={() => setSelectedPedido(pedido)}
                        className="w-full py-2 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <Key className="w-3.5 h-3.5" />
                        Aprobar pago
                      </button>
                    ) : (
                      <button
                        onClick={() => setSelectedPedido(pedido)}
                        className="w-full py-2 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver Entrega
                      </button>
                    )}
                    {pedido.delivery && (
                      <button
                        type="button"
                        onClick={() => sendCredentialsByWhatsApp(pedido)}
                        disabled={!credentialsWhatsAppUrl}
                        title={
                          credentialsWhatsAppUrl
                            ? "Abrir WhatsApp con las credenciales pre-escritas"
                            : "Sin número de WhatsApp registrado"
                        }
                        className="w-full rounded-xl border border-green-400/25 bg-green-400/10 px-3 py-2 text-[11px] font-bold text-green-200 transition hover:bg-green-400/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/35"
                      >
                        <span className="flex items-center justify-center gap-1.5">
                          <Smartphone className="h-3.5 w-3.5" />
                          {credentialsWhatsAppUrl
                            ? "Enviar credenciales"
                            : "Sin número de WhatsApp registrado"}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedPedido?.delivery && (
        <DeliveryCelebrationModal
          open
          celebrate={false}
          orderId={selectedPedido.id}
          productName={selectedPedido.producto_nombre}
          delivery={selectedPedido.delivery}
          onClose={() => setSelectedPedido(null)}
          onCopy={copyCredential}
        />
      )}

      {selectedPedido && !selectedPedido.delivery && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="approval-title"
        >
          <button
            type="button"
            aria-label="Cerrar aprobación"
            onClick={() => setSelectedPedido(null)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <section className="relative w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl border border-white/10 bg-card shadow-2xl animate-in zoom-in-95 duration-200">
            <header className="flex items-start justify-between gap-4 border-b border-white/10 bg-white/[0.02] p-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  Pedido pendiente
                </p>
                <h3 id="approval-title" className="mt-1 text-xl font-black text-white">
                  Aprobar pago y entregar
                </h3>
                <p className="mt-1 text-xs text-white/45">
                  Pedido #{selectedPedido.id.slice(0, 8)} · {selectedPedido.producto_nombre}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPedido(null)}
                aria-label="Cerrar"
                className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-white/50 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </header>

            <div className="space-y-5 p-6">
              <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <p className="text-sm leading-relaxed text-amber-50">
                  Se verificará el pago, se reservará una única cuenta disponible y las credenciales
                  se entregarán al cliente. Esta acción no se puede duplicar.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 text-sm text-white/75">
                Producto:{" "}
                <span className="font-bold text-white">{selectedPedido.producto_nombre}</span>
              </div>
              <button
                type="button"
                onClick={() => approveMutation.mutate(selectedPedido.id)}
                disabled={approveMutation.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {approveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Procesando entrega...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Aprobar pago y entregar cuenta
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}

      {completedDelivery && (
        <DeliveryCelebrationModal
          open
          orderId={completedDelivery.orderId}
          productName={completedDelivery.productName}
          delivery={completedDelivery.delivery}
          onClose={() => setCompletedDelivery(null)}
          onCopy={copyCredential}
        />
      )}
    </AdminLayout>
  );
}
