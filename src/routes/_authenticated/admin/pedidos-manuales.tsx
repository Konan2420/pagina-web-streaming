import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import {
  Search,
  User,
  Package,
  Clock,
  Plus,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  getManualOrders,
  addManualOrder,
  updateManualOrder,
  getUsersWithRoles,
} from "@/lib/admin.functions";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";

const manualOrdersQueryOptions = queryOptions({
  queryKey: ["admin-manual-orders"],
  queryFn: () => getManualOrders(),
});

const usersQueryOptions = queryOptions({
  queryKey: ["admin-users-list"],
  queryFn: () => getUsersWithRoles(),
});

export const Route = createFileRoute("/_authenticated/admin/pedidos-manuales")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(manualOrdersQueryOptions);
    context.queryClient.ensureQueryData(usersQueryOptions);
  },
  component: ManualOrdersManagement,
});

function ManualOrdersManagement() {
  const { data: orders } = useSuspenseQuery(manualOrdersQueryOptions);
  const { data: users } = useSuspenseQuery(usersQueryOptions);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const addOrderFn = useServerFn(addManualOrder);
  const updateOrderFn = useServerFn(updateManualOrder);

  const [formData, setFormData] = useState({
    user_id: "",
    producto_nombre: "",
    monto: 0,
    fecha_adquisicion: new Date().toISOString().split("T")[0],
    fecha_vencimiento: "",
    whatsapp_cliente: "",
    nombre_cliente: "",
  });

  const filteredOrders = orders.filter(
    (o) =>
      (o.producto_nombre || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.nombre_cliente || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.profiles?.nombre_completo || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await addOrderFn({
        data: {
          ...formData,
          user_id: formData.user_id || null,
          fecha_vencimiento: formData.fecha_vencimiento || null,
        },
      });
      toast.success("Pedido registrado correctamente");
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-manual-orders"] });
      setFormData({
        user_id: "",
        producto_nombre: "",
        monto: 0,
        fecha_adquisicion: new Date().toISOString().split("T")[0],
        fecha_vencimiento: "",
        whatsapp_cliente: "",
        nombre_cliente: "",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al registrar pedido");
    }
  }

  async function handleUpdateStatus(id: string, estado: "pendiente" | "verificado" | "cancelado") {
    try {
      await updateOrderFn({ data: { id, estado } });
      toast.success("Estado actualizado");
      queryClient.invalidateQueries({ queryKey: ["admin-manual-orders"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al actualizar estado");
    }
  }

  return (
    <AdminLayout title="Pedidos WhatsApp" subtitle="Registro y verificación manual de pedidos">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Buscar por cliente o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Nuevo Registro
        </button>
      </div>

      <div className="grid gap-4">
        {filteredOrders.length === 0 ? (
          <div className="py-20 text-center text-white/20 glass-card rounded-2xl border border-white/5">
            No se encontraron pedidos registrados.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="glass-card rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                {/* Info Cliente */}
                <div className="flex items-center gap-3 md:w-64 shrink-0">
                  <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {order.profiles?.nombre_completo || order.nombre_cliente || "Cliente manual"}
                    </p>
                    <p className="text-[10px] text-white/40 flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      {order.profiles?.whatsapp || order.whatsapp_cliente || "Sin WhatsApp"}
                    </p>
                  </div>
                </div>

                {/* Producto */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/90">{order.producto_nombre}</p>
                      <p className="text-xs font-mono text-primary font-bold">
                        S/ {Number(order.monto).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fechas */}
                <div className="md:w-48">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-white/30 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-green-500/50" />
                      Adquirido: {new Date(order.fecha_adquisicion).toLocaleDateString()}
                    </span>
                    {order.fecha_vencimiento && (
                      <span className="text-[10px] text-white/30 flex items-center gap-1.5">
                        <AlertCircle className="w-3 h-3 text-red-500/50" />
                        Vence: {new Date(order.fecha_vencimiento).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Estado y Acciones */}
                <div className="flex items-center justify-between md:w-48 shrink-0">
                  <span
                    className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      order.estado === "verificado"
                        ? "bg-green-500/10 text-green-400 border border-green-500/20"
                        : order.estado === "cancelado"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                    }`}
                  >
                    {order.estado}
                  </span>

                  <div className="flex items-center gap-2">
                    {order.estado !== "verificado" && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, "verificado")}
                        className="p-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                        title="Verificar"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                    {order.estado !== "cancelado" && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, "cancelado")}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                        title="Cancelar"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Registro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-white/10 bg-ink p-5 sm:p-6">
            <h2 className="text-xl font-display text-white uppercase mb-6">
              Registrar Venta WhatsApp
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-white/40 uppercase mb-2">
                  Vincular a Usuario
                </label>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  value={formData.user_id}
                  onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                >
                  <option value="">-- Sin vincular (Cliente Invitado) --</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nombre_completo || user.email}
                    </option>
                  ))}
                </select>
              </div>

              {!formData.user_id && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase mb-2">
                      Nombre Cliente
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                      value={formData.nombre_cliente}
                      onChange={(e) => setFormData({ ...formData, nombre_cliente: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/40 uppercase mb-2">
                      WhatsApp
                    </label>
                    <input
                      type="text"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                      value={formData.whatsapp_cliente}
                      onChange={(e) =>
                        setFormData({ ...formData, whatsapp_cliente: e.target.value })
                      }
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-white/40 uppercase mb-2">
                  Producto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Netflix 1 Mes Ultra HD"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  value={formData.producto_nombre}
                  onChange={(e) => setFormData({ ...formData, producto_nombre: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/40 uppercase mb-2">
                  Monto (S/)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: Number(e.target.value) })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase mb-2">
                    Fecha Adquisición
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    value={formData.fecha_adquisicion}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha_adquisicion: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/40 uppercase mb-2">
                    Fecha Vencimiento
                  </label>
                  <input
                    type="date"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none"
                    value={formData.fecha_vencimiento}
                    onChange={(e) =>
                      setFormData({ ...formData, fecha_vencimiento: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-xl bg-primary text-white hover:brightness-110 transition-all text-sm font-bold uppercase tracking-wider"
                >
                  Guardar Registro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
