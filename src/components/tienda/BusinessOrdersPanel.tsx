import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Eye,
  Headphones,
  Loader2,
  MessageCircle,
  Package,
  Printer,
  RefreshCw,
  Search,
  Store,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { downloadXlsx } from "@/lib/xlsx-export";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

type BusinessOrderStatus =
  "all" | "en_curso" | "completado" | "interesado" | "por_vencer" | "vencido" | "cancelado";

type BusinessOrder = {
  order_id: string;
  source: "catalog" | "social";
  seller_id: string;
  business_client_id: string | null;
  client_profile_id: string | null;
  product_id: string;
  product_name: string;
  product_image_url: string | null;
  account_reference: string | null;
  auto_renew: boolean;
  auto_renew_at: string | null;
  client_name: string;
  client_phone: string | null;
  client_avatar_url: string | null;
  brand: string;
  created_at: string;
  expires_at: string | null;
  display_status: Exclude<BusinessOrderStatus, "all">;
  cost_price: number;
  sale_price: number;
  profit: number;
  is_renewable: boolean;
  total_count: number;
};

type StatusCounts = Record<BusinessOrderStatus, number>;

const STATUS_TABS: { value: BusinessOrderStatus; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "en_curso", label: "En curso" },
  { value: "completado", label: "Completados" },
  { value: "interesado", label: "Interesados" },
  { value: "por_vencer", label: "Por vencer" },
  { value: "vencido", label: "Vencidos" },
  { value: "cancelado", label: "Cancelados" },
];

const EMPTY_COUNTS: StatusCounts = {
  all: 0,
  en_curso: 0,
  completado: 0,
  interesado: 0,
  por_vencer: 0,
  vencido: 0,
  cancelado: 0,
};

function money(value: number) {
  return `S/ ${Number(value ?? 0).toFixed(2)}`;
}

function formatDateTime(value: string | null) {
  if (!value) return "Sin vencimiento";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(value))
    .replace(",", "");
}

function timeRemaining(order: BusinessOrder) {
  if (!order.expires_at) return { label: "Sin vencimiento", tone: "muted" as const };
  const ms = new Date(order.expires_at).getTime() - Date.now();
  const days = Math.ceil(ms / 86_400_000);
  if (days <= 0) return { label: "Vencido", tone: "danger" as const };
  if (days <= 3)
    return { label: days === 1 ? "falta 1 día" : `faltan ${days} días`, tone: "warning" as const };
  return { label: `faltan ${days} días`, tone: "success" as const };
}

function statusClass(status: Exclude<BusinessOrderStatus, "all">) {
  switch (status) {
    case "completado":
      return "border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
    case "interesado":
      return "border-violet-500/35 bg-violet-500/15 text-violet-700 dark:text-violet-300";
    case "por_vencer":
      return "border-amber-500/35 bg-amber-500/15 text-amber-800 dark:text-amber-300";
    case "vencido":
    case "cancelado":
      return "border-destructive/35 bg-destructive/10 text-destructive";
    default:
      return "border-primary/35 bg-primary/15 text-primary";
  }
}

function statusLabel(status: Exclude<BusinessOrderStatus, "all">) {
  return (
    {
      en_curso: "En curso",
      completado: "Completado",
      interesado: "Interesado",
      por_vencer: "Por vencer",
      vencido: "Vencido",
      cancelado: "Cancelado",
    } as const
  )[status];
}

function initials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "CL"
  );
}

function getWhatsAppUrl(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  const normalized = digits.length === 9 ? `51${digits}` : digits;
  return normalized.length >= 9
    ? `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
    : null;
}

async function downloadReceipt(order: BusinessOrder) {
  try {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const margin = 18;
    let y = 22;
    const addLine = (label: string, value: string) => {
      pdf.setFont("helvetica", "bold");
      pdf.text(label, margin, y);
      pdf.setFont("helvetica", "normal");
      const lines = pdf.splitTextToSize(value || "—", 110);
      pdf.text(lines, 72, y);
      y += Math.max(9, lines.length * 6 + 3);
    };

    pdf.setFillColor(17, 24, 39);
    pdf.rect(0, 0, 210, 38, "F");
    pdf.setTextColor(248, 250, 252);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("CMD Streaming", margin, 20);
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Comprobante de pedido #${order.order_id.slice(0, 8)}`, margin, 29);
    pdf.setTextColor(15, 23, 42);
    pdf.setFontSize(11);

    y = 54;
    addLine("Producto", order.product_name);
    addLine("Cliente", order.client_name);
    addLine("Fecha", formatDateTime(order.created_at));
    addLine("Vencimiento", formatDateTime(order.expires_at));
    addLine("Estado", statusLabel(order.display_status));
    addLine("Referencia", order.account_reference ?? "—");
    pdf.setDrawColor(203, 213, 225);
    pdf.line(margin, y + 2, 192, y + 2);
    y += 13;
    addLine("Costo", money(order.cost_price));
    addLine("Venta", money(order.sale_price));
    addLine("Ganancia", `+${money(order.profit)}`);
    pdf.setTextColor(100, 116, 139);
    pdf.setFontSize(8);
    pdf.text("Documento generado desde Mis Pedidos.", margin, 285);
    pdf.save(`comprobante-pedido-${order.order_id.slice(0, 8)}.pdf`);
    toast.success("Comprobante PDF descargado.");
  } catch {
    toast.error("No se pudo generar el comprobante PDF.");
  }
}

export type BusinessOrderSupportDraft = Pick<
  BusinessOrder,
  "order_id" | "product_name" | "client_name"
>;

type BusinessOrdersPanelProps = {
  isAdmin: boolean;
  isProvider: boolean;
  isDistributor: boolean;
  onGoShop: () => void;
  onOpenSupport: (ticketId: string) => void;
};

/** Dashboard comercial. El servidor aplica el alcance y nunca expone costos a un cliente final. */
export function BusinessOrdersPanel({
  isAdmin,
  isProvider,
  isDistributor,
  onGoShop,
  onOpenSupport,
}: BusinessOrdersPanelProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState<BusinessOrderStatus>("all");
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<BusinessOrder | null>(null);
  const canManage = isAdmin || isProvider || isDistributor;

  const filters = useMemo(
    () => ({
      p_scope: scope,
      p_search: search.trim() || null,
      p_brand: brand || null,
      p_month: month ? Number(month) : null,
      p_year: year ? Number(year) : null,
    }),
    [brand, month, scope, search, year],
  );

  useEffect(() => setPage(1), [filters, status]);

  const ordersQuery = useQuery({
    queryKey: ["business-orders", filters, status, page],
    enabled: canManage,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_business_orders", {
        ...filters,
        p_status: status,
        p_limit: PAGE_SIZE,
        p_offset: (page - 1) * PAGE_SIZE,
      });
      if (error) throw error;
      return (data ?? []) as BusinessOrder[];
    },
    staleTime: 15_000,
  });

  const countsQuery = useQuery({
    queryKey: ["business-order-status-counts", filters],
    enabled: canManage,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_business_order_status_counts", filters);
      if (error) throw error;
      const count = data?.[0];
      return {
        all: Number(count?.all_count ?? 0),
        en_curso: Number(count?.en_curso_count ?? 0),
        completado: Number(count?.completado_count ?? 0),
        interesado: Number(count?.interesado_count ?? 0),
        por_vencer: Number(count?.por_vencer_count ?? 0),
        vencido: Number(count?.vencido_count ?? 0),
        cancelado: Number(count?.cancelado_count ?? 0),
      } satisfies StatusCounts;
    },
    staleTime: 15_000,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["business-orders"] });
    void queryClient.invalidateQueries({ queryKey: ["business-order-status-counts"] });
  };

  const autoRenewMutation = useMutation({
    mutationFn: async ({ order, enabled }: { order: BusinessOrder; enabled: boolean }) => {
      const { data, error } = await supabase.rpc("set_business_order_auto_renew", {
        p_order_id: order.order_id,
        p_enabled: enabled,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.enabled
          ? "Autorrenovación activada: se cobrará desde tu billetera 3 días antes del vencimiento."
          : "Autorrenovación desactivada para este pedido.",
      );
      refresh();
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "No se pudo actualizar la autorrenovación.",
      ),
  });

  const supportMutation = useMutation({
    mutationFn: async (order: BusinessOrder) => {
      const { data, error } = await supabase.rpc("create_business_order_ticket", {
        p_source: order.source,
        p_order_id: order.order_id,
      });
      if (error) throw error;
      return { order, ticketId: data };
    },
    onSuccess: ({ ticketId }) => {
      toast.success("Ticket de soporte vinculado al pedido.");
      onOpenSupport(ticketId);
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "No se pudo abrir el ticket de soporte.",
      ),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ order, nextStatus }: { order: BusinessOrder; nextStatus: string }) => {
      const { error } = await supabase.rpc("set_business_order_status", {
        p_source: order.source,
        p_order_id: order.order_id,
        p_status: nextStatus,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Estado actualizado.");
      refresh();
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar."),
  });

  const notifyMutation = useMutation({
    mutationFn: async (order: BusinessOrder) => {
      const { data, error } = await supabase.rpc("notify_business_order_client", {
        p_source: order.source,
        p_order_id: order.order_id,
      });
      if (error) throw error;
      return data?.[0];
    },
    onSuccess: (result) => {
      if (result?.whatsapp) {
        const url = getWhatsAppUrl(result.whatsapp, result.message);
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      }
      toast.success(
        result?.recorded_internal
          ? "Aviso interno registrado y WhatsApp preparado."
          : "WhatsApp preparado para el cliente.",
      );
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No se pudo notificar."),
  });

  const credentialsQuery = useQuery({
    queryKey: ["business-order-credentials", selected?.order_id],
    enabled: selected?.source === "catalog",
    queryFn: async () => {
      if (!selected) return null;
      const { data, error } = await supabase.rpc("get_business_order_credentials", {
        p_order_id: selected.order_id,
      });
      if (error) throw error;
      return data?.[0] ?? null;
    },
    staleTime: 15_000,
  });

  const orders = ordersQuery.data ?? [];
  const counts = countsQuery.data ?? EMPTY_COUNTS;
  const total = orders[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const brands = Array.from(new Set(orders.map((order) => order.brand).filter(Boolean))).sort();
  const years = Array.from({ length: 5 }, (_, index) => String(new Date().getFullYear() - index));

  const exportVisibleOrders = () => {
    if (orders.length === 0) {
      toast.info("No hay pedidos visibles para exportar.");
      return;
    }
    downloadXlsx(
      `mis-pedidos-${new Date().toISOString().slice(0, 10)}`,
      [
        "Fecha",
        "Producto",
        "Cliente",
        "Referencia",
        "Tiempo restante",
        "Estado",
        "Vencimiento",
        "Costo",
        "Venta",
        "Ganancia",
      ],
      orders.map((order) => [
        formatDateTime(order.created_at),
        order.product_name,
        order.client_name,
        order.account_reference ?? "",
        timeRemaining(order).label,
        statusLabel(order.display_status),
        formatDateTime(order.expires_at),
        Number(order.cost_price),
        Number(order.sale_price),
        Number(order.profit),
      ]),
      "Pedidos",
    );
  };

  if (!canManage) {
    return (
      <section className="mt-6 pb-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-xl border border-border bg-card p-8 text-center sm:p-12">
            <Store className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
            <h1 className="mt-3 text-xl font-black text-foreground">Mis Pedidos</h1>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Esta gestión está disponible para administradores, proveedores y distribuidores.
            </p>
            <button
              type="button"
              onClick={onGoShop}
              className="cmd-on-accent mt-5 rounded-lg bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-wide"
            >
              Ver catálogo
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6 pb-24">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
        <header className="mb-6">
          <h1 className="font-display text-2xl tracking-wide text-foreground sm:text-3xl">
            Mis Pedidos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona tus pedidos y clientes en un solo lugar.
          </p>
        </header>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <label className="relative block min-w-0 flex-1 xl:max-w-[31rem]">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar productos..."
              className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
            />
          </label>
          <div className="grid grid-cols-1 gap-2 min-[540px]:grid-cols-3 xl:flex xl:items-center">
            <select
              value={brand}
              onChange={(event) => setBrand(event.target.value)}
              className="h-11 min-w-0 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none focus:border-primary/60"
            >
              <option value="">Todas las marcas</option>
              {brands.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="h-11 min-w-0 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none focus:border-primary/60"
            >
              <option value="">Todos los meses</option>
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {new Intl.DateTimeFormat("es-PE", { month: "long" }).format(
                    new Date(2026, index, 1),
                  )}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className="h-11 min-w-0 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none focus:border-primary/60"
            >
              <option value="">Todos los años</option>
              {years.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          {isAdmin && (
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value as "mine" | "all")}
              className="h-11 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground outline-none focus:border-primary/60"
            >
              <option value="mine">Mis pedidos</option>
              <option value="all">Todos los pedidos</option>
            </select>
          )}
          <button
            type="button"
            onClick={exportVisibleOrders}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-primary/35 bg-card px-4 text-sm font-bold text-foreground transition hover:border-primary hover:bg-primary/10"
          >
            <Download className="h-4 w-4 text-primary" aria-hidden="true" />
            Exportar Excel
          </button>
        </div>

        <div className="mt-5 overflow-x-auto border-b border-border">
          <div className="flex min-w-max gap-1" role="tablist" aria-label="Estados de pedidos">
            {STATUS_TABS.map((tab) => {
              const active = status === tab.value;
              const count = counts[tab.value];
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStatus(tab.value)}
                  className={cn(
                    "relative flex min-h-11 items-center gap-2 px-3 text-sm font-semibold transition",
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    active &&
                      "after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary",
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "rounded-md bg-muted px-2 py-0.5 text-xs font-black text-muted-foreground",
                      tab.value === "vencido" && count > 0 && "cmd-on-accent bg-destructive",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {ordersQuery.isLoading ? (
          <OrdersSkeleton />
        ) : ordersQuery.isError ? (
          <div className="mt-5 rounded-xl border border-destructive/35 bg-destructive/10 p-6 text-center">
            <p className="font-bold text-destructive">No se pudieron cargar tus pedidos.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Aplica la migración de Mis Pedidos y vuelve a intentar.
            </p>
            <button
              type="button"
              onClick={() => void ordersQuery.refetch()}
              className="mt-4 rounded-lg border border-destructive/40 px-3 py-2 text-xs font-bold text-destructive"
            >
              Reintentar
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-border bg-card p-10 text-center sm:p-14">
            <Package className="mx-auto h-9 w-9 text-muted-foreground" aria-hidden="true" />
            <h2 className="mt-3 text-lg font-bold text-foreground">
              No hay pedidos para estos filtros
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Cuando asignes o vendas un producto a un cliente, aparecerá aquí automáticamente.
            </p>
            <button
              type="button"
              onClick={onGoShop}
              className="cmd-on-accent mt-5 rounded-lg bg-primary px-4 py-2.5 text-xs font-black uppercase tracking-wide"
            >
              Ir al catálogo
            </button>
          </div>
        ) : (
          <>
            <div className="mt-5 hidden overflow-x-auto rounded-xl border border-border bg-card lg:block">
              <table className="min-w-[1360px] w-full text-left">
                <thead className="border-b border-border text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-3">Acciones</th>
                    <th className="px-3 py-3">Producto</th>
                    <th className="px-3 py-3">Cliente</th>
                    <th className="px-3 py-3">Tiempo restante</th>
                    <th className="px-3 py-3">Estado</th>
                    <th className="px-3 py-3">Fecha de expiración</th>
                    <th className="px-3 py-3 text-right">Costo</th>
                    <th className="px-3 py-3 text-right">Venta</th>
                    <th className="px-3 py-3 text-right">Ganancia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => (
                    <OrderTableRow
                      key={`${order.source}-${order.order_id}`}
                      order={order}
                      onDetail={setSelected}
                      onSupport={(item) => supportMutation.mutate(item)}
                      onAutoRenew={(item, enabled) =>
                        autoRenewMutation.mutate({ order: item, enabled })
                      }
                      onNotify={(item) => notifyMutation.mutate(item)}
                      onStatusChange={(item, nextStatus) =>
                        statusMutation.mutate({ order: item, nextStatus })
                      }
                      autoRenewing={autoRenewMutation.isPending}
                      openingSupport={supportMutation.isPending}
                      notifying={notifyMutation.isPending}
                      updating={statusMutation.isPending}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 space-y-3 lg:hidden">
              {orders.map((order) => (
                <OrderMobileCard
                  key={`${order.source}-${order.order_id}`}
                  order={order}
                  onDetail={setSelected}
                  onSupport={(item) => supportMutation.mutate(item)}
                  onAutoRenew={(item, enabled) =>
                    autoRenewMutation.mutate({ order: item, enabled })
                  }
                  onNotify={(item) => notifyMutation.mutate(item)}
                  onStatusChange={(item, nextStatus) =>
                    statusMutation.mutate({ order: item, nextStatus })
                  }
                  autoRenewing={autoRenewMutation.isPending}
                  openingSupport={supportMutation.isPending}
                  notifying={notifyMutation.isPending}
                  updating={statusMutation.isPending}
                />
              ))}
            </div>
          </>
        )}

        {totalPages > 1 && (
          <nav
            className="mt-5 flex items-center justify-center gap-3"
            aria-label="Paginación de pedidos"
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-card text-foreground disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-semibold text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-card text-foreground disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        )}
      </div>

      {selected && (
        <OrderDetailDialog
          order={selected}
          credentials={credentialsQuery.data ?? null}
          credentialsLoading={credentialsQuery.isLoading}
          credentialsError={credentialsQuery.isError}
          onClose={() => setSelected(null)}
        />
      )}
    </section>
  );
}

type OrderActionsProps = {
  order: BusinessOrder;
  onDetail: (order: BusinessOrder) => void;
  onSupport: (order: BusinessOrder) => void;
  onAutoRenew: (order: BusinessOrder, enabled: boolean) => void;
  onNotify: (order: BusinessOrder) => void;
  onStatusChange: (order: BusinessOrder, status: string) => void;
  autoRenewing: boolean;
  openingSupport: boolean;
  notifying: boolean;
  updating: boolean;
};

function OrderActionButtons({
  order,
  onSupport,
  onAutoRenew,
  autoRenewing,
  openingSupport,
}: Pick<
  OrderActionsProps,
  "order" | "onSupport" | "onAutoRenew" | "autoRenewing" | "openingSupport"
>) {
  const canAutoRenew = order.source === "catalog" && order.is_renewable;
  return (
    <div className="flex items-center gap-1.5">
      <IconButton
        label="Abrir ticket de soporte vinculado"
        disabled={openingSupport}
        onClick={() => onSupport(order)}
      >
        {openingSupport ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Headphones className="h-4 w-4" />
        )}
      </IconButton>
      <IconButton
        label={
          canAutoRenew
            ? order.auto_renew
              ? "Desactivar autorrenovación"
              : "Activar autorrenovación"
            : "Este pedido no es renovable"
        }
        disabled={!canAutoRenew || autoRenewing}
        onClick={() => onAutoRenew(order, !order.auto_renew)}
      >
        {autoRenewing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className={cn("h-4 w-4", order.auto_renew && "text-primary")} />
        )}
      </IconButton>
    </div>
  );
}

function CustomerActions({
  order,
  onNotify,
  notifying,
}: Pick<OrderActionsProps, "order" | "onNotify" | "notifying">) {
  const whatsappUrl = order.client_phone
    ? getWhatsAppUrl(
        order.client_phone,
        `Hola ${order.client_name}, te contactamos por tu pedido ${order.product_name}.`,
      )
    : null;
  return (
    <div className="flex items-center gap-1.5">
      <IconButton label="Descargar comprobante PDF" onClick={() => void downloadReceipt(order)}>
        <Printer className="h-4 w-4" />
      </IconButton>
      <a
        href={whatsappUrl ?? undefined}
        target="_blank"
        rel="noreferrer"
        aria-label="Abrir WhatsApp"
        onClick={(event) => {
          if (!whatsappUrl) {
            event.preventDefault();
            toast.info("Este cliente no tiene un WhatsApp válido.");
          }
        }}
        className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/60 hover:text-primary"
      >
        <MessageCircle className="h-4 w-4" />
      </a>
      <IconButton
        label="Registrar aviso interno y preparar WhatsApp"
        disabled={notifying}
        onClick={() => onNotify(order)}
      >
        {notifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
      </IconButton>
    </div>
  );
}

function OrderTableRow(props: OrderActionsProps) {
  const { order, onDetail, onStatusChange, updating } = props;
  const remaining = timeRemaining(order);
  return (
    <tr className="transition hover:bg-muted/55">
      <td className="px-3 py-3">
        <OrderActionButtons {...props} />
      </td>
      <td className="px-3 py-3">
        <div className="flex min-w-[16rem] items-center gap-2">
          <IconButton label="Ver detalle" onClick={() => onDetail(order)}>
            <Eye className="h-4 w-4" />
          </IconButton>
          <OrderThumbnail order={order} />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold uppercase text-foreground">
              {order.product_name}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {order.account_reference || order.brand}
            </p>
          </div>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex min-w-[15rem] items-center gap-2">
          <CustomerActions {...props} />
          <ClientAvatar order={order} />
          <span className="truncate text-sm font-semibold text-foreground">
            {order.client_name}
          </span>
        </div>
      </td>
      <td className="px-3 py-3">
        <RemainingBadge label={remaining.label} tone={remaining.tone} />
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={order.display_status} />
        <select
          aria-label={`Cambiar estado de ${order.product_name}`}
          disabled={updating}
          value={
            order.display_status === "por_vencer" || order.display_status === "vencido"
              ? "en_curso"
              : order.display_status
          }
          onChange={(event) => onStatusChange(order, event.target.value)}
          className="ml-2 rounded border border-border bg-background px-1.5 py-1 text-[10px] text-muted-foreground outline-none focus:border-primary"
        >
          <option value="en_curso">En curso</option>
          <option value="completado">Completado</option>
          <option value="interesado">Interesado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-sm font-medium text-foreground">
        {formatDateTime(order.expires_at)}
      </td>
      <td className="px-3 py-3 text-right text-sm font-bold text-foreground">
        {money(order.cost_price)}
      </td>
      <td className="px-3 py-3 text-right text-sm font-bold text-foreground">
        {money(order.sale_price)}
      </td>
      <td className="px-3 py-3 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">
        +{money(order.profit)}
      </td>
    </tr>
  );
}

function OrderMobileCard(props: OrderActionsProps) {
  const { order, onDetail, onStatusChange, updating } = props;
  const remaining = timeRemaining(order);
  return (
    <article className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <OrderThumbnail order={order} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold uppercase text-foreground">
                {order.product_name}
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {order.account_reference || order.brand}
              </p>
            </div>
            <StatusBadge status={order.display_status} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <RemainingBadge label={remaining.label} tone={remaining.tone} />
            <span className="text-xs text-muted-foreground">
              {formatDateTime(order.expires_at)}
            </span>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <ClientAvatar order={order} />
        <span className="mr-auto text-sm font-semibold text-foreground">{order.client_name}</span>
        <IconButton label="Ver detalle" onClick={() => onDetail(order)}>
          <Eye className="h-4 w-4" />
        </IconButton>
        <OrderActionButtons {...props} />
        <CustomerActions {...props} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-muted/55 p-3 text-center">
        <Metric label="Costo" value={money(order.cost_price)} />
        <Metric label="Venta" value={money(order.sale_price)} />
        <Metric label="Ganancia" value={`+${money(order.profit)}`} tone="profit" />
      </div>
      <label className="mt-3 flex items-center justify-between gap-3 text-xs font-semibold text-muted-foreground">
        Cambiar estado
        <select
          disabled={updating}
          value={
            order.display_status === "por_vencer" || order.display_status === "vencido"
              ? "en_curso"
              : order.display_status
          }
          onChange={(event) => onStatusChange(order, event.target.value)}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-xs text-foreground outline-none focus:border-primary"
        >
          <option value="en_curso">En curso</option>
          <option value="completado">Completado</option>
          <option value="interesado">Interesado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </label>
    </article>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone?: "profit" }) {
  return (
    <span>
      <span className="block text-[9px] font-black uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          "mt-1 block text-xs font-bold text-foreground",
          tone === "profit" && "text-emerald-600 dark:text-emerald-400",
        )}
      >
        {value}
      </span>
    </span>
  );
}
function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary/60 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
function OrderThumbnail({ order }: { order: BusinessOrder }) {
  return order.product_image_url ? (
    <img
      src={order.product_image_url}
      alt=""
      className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
    />
  ) : (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border bg-muted text-primary">
      <Package className="h-4 w-4" />
    </span>
  );
}
function ClientAvatar({ order }: { order: BusinessOrder }) {
  return order.client_avatar_url ? (
    <img
      src={order.client_avatar_url}
      alt=""
      className="h-8 w-8 shrink-0 rounded-full border border-border object-cover"
    />
  ) : (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/15 text-[10px] font-black text-primary">
      {initials(order.client_name)}
    </span>
  );
}
function RemainingBadge({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "warning" | "danger" | "muted";
}) {
  const classes = {
    success: "bg-emerald-500 text-emerald-950",
    warning: "bg-amber-400 text-amber-950",
    danger: "cmd-on-accent bg-destructive",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-black",
        classes[tone],
      )}
    >
      {label}
    </span>
  );
}
function StatusBadge({ status }: { status: Exclude<BusinessOrderStatus, "all"> }) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-black",
        statusClass(status),
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

function OrdersSkeleton() {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
      <div className="h-11 border-b border-border bg-muted/50" />
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="grid h-20 grid-cols-[0.8fr_2fr_1.5fr_1fr_1fr_1.3fr_0.8fr_0.8fr_0.8fr] gap-3 border-b border-border px-3 py-4 last:border-b-0"
        >
          <span className="animate-pulse rounded bg-muted" />
          <span className="animate-pulse rounded bg-muted" />
          <span className="animate-pulse rounded bg-muted" />
          <span className="animate-pulse rounded bg-muted" />
          <span className="animate-pulse rounded bg-muted" />
          <span className="animate-pulse rounded bg-muted" />
          <span className="animate-pulse rounded bg-muted" />
          <span className="animate-pulse rounded bg-muted" />
          <span className="animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function OrderDetailDialog({
  order,
  credentials,
  credentialsLoading,
  credentialsError,
  onClose,
}: {
  order: BusinessOrder;
  credentials: { email: string | null; profile: string | null } | null;
  credentialsLoading: boolean;
  credentialsError: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="business-order-detail"
    >
      <button
        type="button"
        aria-label="Cerrar detalle"
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />
      <section className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-card p-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
              Pedido {order.source === "social" ? "SMM" : "de catálogo"}
            </p>
            <h2 id="business-order-detail" className="mt-1 text-lg font-black text-foreground">
              {order.product_name}
            </h2>
          </div>
          <IconButton label="Cerrar" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </header>
        <div className="grid gap-4 p-5 text-sm">
          <Detail label="Cliente" value={order.client_name} />
          <Detail label="Referencia" value={order.account_reference || "Sin referencia"} />
          <Detail label="Creado" value={formatDateTime(order.created_at)} />
          <Detail label="Vencimiento" value={formatDateTime(order.expires_at)} />
          <Detail label="Estado" value={statusLabel(order.display_status)} />
          {order.source === "catalog" && (
            <section className="rounded-xl border border-border bg-muted/45 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary">
                Credenciales del servicio
              </p>
              {credentialsLoading ? (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Cargando credenciales protegidas…
                </div>
              ) : credentialsError ? (
                <p className="mt-3 text-xs text-destructive">
                  No se pudieron consultar las credenciales de este pedido.
                </p>
              ) : (
                <div className="mt-3 grid gap-3">
                  <CredentialField label="Correo" value={credentials?.email} />
                  <CredentialField label="Perfil" value={credentials?.profile} />
                </div>
              )}
            </section>
          )}
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/55 p-3">
            <Metric label="Costo" value={money(order.cost_price)} />
            <Metric label="Venta" value={money(order.sale_price)} />
            <Metric label="Ganancia" value={`+${money(order.profit)}`} tone="profit" />
          </div>
        </div>
      </section>
    </div>
  );
}
function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 break-words font-semibold text-foreground">{value}</p>
    </div>
  );
}
function CredentialField({ label, value }: { label: string; value: string | null | undefined }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success(`${label} copiado.`);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("No se pudo copiar el dato.");
    }
  };
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5">
      <p className="text-[9px] font-black uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className="min-w-0 flex-1 break-all text-sm font-semibold text-foreground">
          {value || "No registrado"}
        </p>
        <button
          type="button"
          disabled={!value}
          onClick={() => void copy()}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground transition hover:border-primary/60 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          aria-label={`Copiar ${label}`}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
