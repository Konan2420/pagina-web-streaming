import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import {
  Search,
  User,
  ArrowRight,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  Key,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { AdminLayout } from "@/components/admin/AdminLayout";
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
type DeliveryInput = Pick<
  TablesInsert<"delivered_accounts">,
  "order_id" | "user_id" | "email" | "password" | "access_link" | "notes"
>;

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
    const { data: delivered, error: deliveredError } = await supabase
      .from("delivered_accounts")
      .select("order_id, user_id, email, password, access_link, notes");

    if (deliveredError) console.error("Error fetching delivered accounts:", deliveredError);
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
  const queryClient = useQueryClient();

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

  const deliverMutation = useMutation({
    mutationFn: async (deliveryData: DeliveryInput) => {
      const { order_id, user_id, email, password, access_link, notes } = deliveryData;

      // 1. Insert into delivered_accounts
      const { error: deliveryError } = await supabase.from("delivered_accounts").insert({
        order_id,
        user_id,
        email,
        password,
        access_link,
        notes,
      });

      if (deliveryError) throw deliveryError;

      // 2. Update order status
      const { error: orderError } = await supabase
        .from("orders")
        .update({ estado: "delivered" })
        .eq("id", order_id);

      if (orderError) throw orderError;
    },
    onSuccess: () => {
      toast.success("Cuenta asignada y pedido marcado como entregado");
      queryClient.invalidateQueries({ queryKey: ["admin-pedidos-list"] });
      setSelectedPedido(null);
    },
    onError: (error) => {
      toast.error(`Error: ${error instanceof Error ? error.message : "Desconocido"}`);
    },
  });

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
                  <div className="flex items-center gap-3 md:w-40 justify-end shrink-0">
                    {!isDelivered ? (
                      <button
                        onClick={() => setSelectedPedido(pedido)}
                        className="w-full py-2 px-4 rounded-xl bg-primary text-white text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                      >
                        <Key className="w-3.5 h-3.5" />
                        Asignar Cuenta
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
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Asignación/Detalles */}
      {selectedPedido && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedPedido(null)}
          />
          <div className="relative w-full max-w-xl bg-[#0d0d14] border border-white/10 rounded-3xl overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {selectedPedido.delivery ? "Detalles de Entrega" : "Asignar Credenciales"}
                </h3>
                <p className="text-xs text-white/40 mt-1">
                  Pedido #{selectedPedido.id.slice(0, 8)} • {selectedPedido.producto_nombre}
                </p>
              </div>
              <button
                onClick={() => setSelectedPedido(null)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (selectedPedido.delivery) return;
                  const formData = new FormData(e.currentTarget);
                  deliverMutation.mutate({
                    order_id: selectedPedido.id,
                    user_id: selectedPedido.user_id,
                    email: String(formData.get("email") ?? ""),
                    password: String(formData.get("password") ?? ""),
                    access_link: String(formData.get("access_link") ?? ""),
                    notes: String(formData.get("notes") ?? ""),
                  });
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1">
                      Email / Usuario
                    </label>
                    <input
                      name="email"
                      defaultValue={selectedPedido.delivery?.email || ""}
                      readOnly={!!selectedPedido.delivery}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                      placeholder="ejemplo@correo.com"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1">
                      Contraseña
                    </label>
                    <input
                      name="password"
                      defaultValue={selectedPedido.delivery?.password || ""}
                      readOnly={!!selectedPedido.delivery}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1">
                    Link de Acceso (Opcional)
                  </label>
                  <input
                    name="access_link"
                    defaultValue={selectedPedido.delivery?.access_link || ""}
                    readOnly={!!selectedPedido.delivery}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
                    placeholder="https://..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider text-white/40 font-bold ml-1">
                    Notas / Instrucciones (PIN, Perfil, etc.)
                  </label>
                  <textarea
                    name="notes"
                    defaultValue={selectedPedido.delivery?.notes || ""}
                    readOnly={!!selectedPedido.delivery}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none disabled:opacity-50"
                    placeholder="Escribe aquí instrucciones adicionales para el cliente..."
                  />
                </div>

                {!selectedPedido.delivery && (
                  <div className="pt-4 flex flex-col gap-3">
                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      <p className="text-[11px] text-blue-300 leading-relaxed">
                        Al asignar la cuenta, el estado del pedido cambiará a "Entregado" y el
                        cliente podrá ver estas credenciales inmediatamente en su panel.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={deliverMutation.isPending}
                      className="w-full py-3.5 rounded-xl bg-primary text-white text-sm font-bold hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deliverMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Confirmar Entrega
                        </>
                      )}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default PedidosManagement;
