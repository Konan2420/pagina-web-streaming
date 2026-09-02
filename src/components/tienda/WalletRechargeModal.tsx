import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  History,
  Loader2,
  ReceiptText,
  Send,
  ShoppingBag,
  WalletCards,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import type { Tables } from "@/integrations/supabase/types";
import {
  formatRechargeAmount,
  formatRechargeDate,
  RECHARGE_METHODS,
  RECHARGE_STATUS_LABELS,
  RECHARGE_STATUS_STYLES,
  rechargeMethodLabel,
  type RechargeMethod,
  type RechargeStatus,
} from "@/lib/recargas";
import { cn } from "@/lib/utils";
import { useHorizontalScroll } from "@/hooks/useHorizontalScroll";

type PaymentSettings = Tables<"payment_settings">;

type WalletMovement = {
  id: string;
  date: string;
  type: "Recarga" | "Compra";
  method: string;
  amount: string;
  status: string;
  tone: "pending" | "verified" | "rejected" | "completed";
};

type WalletRechargeModalProps = {
  userId: string;
  onClose: () => void;
  onReportSupport: () => void;
};

/** Modal de solicitud de recargas: el pago se valida manualmente desde administración. */
export function WalletRechargeModal({
  userId,
  onClose,
  onReportSupport,
}: WalletRechargeModalProps) {
  const queryClient = useQueryClient();
  const methodsScroll = useHorizontalScroll();
  const [activeMethod, setActiveMethod] = useState<RechargeMethod>("lemon_cash");
  const [declaredName, setDeclaredName] = useState("");
  const [amount, setAmount] = useState("");
  const [forAnotherUser, setForAnotherUser] = useState(false);
  const [beneficiaryEmail, setBeneficiaryEmail] = useState("");

  const settingsQuery = useQuery({
    queryKey: ["payment-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_settings")
        .select("*")
        .eq("id", "default")
        .maybeSingle();
      if (error) throw error;
      return data as PaymentSettings | null;
    },
  });

  const movementsQuery = useQuery({
    queryKey: ["wallet-movements", userId],
    queryFn: async () => {
      const [rechargesResult, ordersResult, manualOrdersResult] = await Promise.all([
        supabase.from("recargas").select("*").order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("id, producto_nombre, precio, estado, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("manual_orders")
          .select("id, producto_nombre, monto, estado, created_at, fecha_adquisicion")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
      ]);

      if (rechargesResult.error) throw rechargesResult.error;
      if (ordersResult.error) throw ordersResult.error;
      if (manualOrdersResult.error) throw manualOrdersResult.error;

      const rechargeMovements: WalletMovement[] = (rechargesResult.data ?? []).map((recharge) => ({
        id: `recarga-${recharge.id}`,
        date: recharge.created_at,
        type: "Recarga",
        method: rechargeMethodLabel(recharge.metodo),
        amount: formatRechargeAmount(recharge.monto, recharge.moneda),
        status: RECHARGE_STATUS_LABELS[recharge.estado],
        tone:
          recharge.estado === "pendiente"
            ? "pending"
            : recharge.estado === "verificado"
              ? "verified"
              : "rejected",
      }));

      const orderMovements: WalletMovement[] = (ordersResult.data ?? []).map((order) => ({
        id: `orden-${order.id}`,
        date: order.created_at,
        type: "Compra",
        method: order.producto_nombre || "Producto CMD",
        amount: formatRechargeAmount(Number(order.precio ?? 0), "PEN"),
        status: order.estado === "cancelado" ? "Cancelado" : "Completado",
        tone: order.estado === "cancelado" ? "rejected" : "completed",
      }));

      const manualOrderMovements: WalletMovement[] = (manualOrdersResult.data ?? []).map((order) => ({
        id: `orden-manual-${order.id}`,
        date: order.created_at ?? order.fecha_adquisicion ?? new Date().toISOString(),
        type: "Compra",
        method: order.producto_nombre || "Producto CMD",
        amount: formatRechargeAmount(Number(order.monto ?? 0), "PEN"),
        status: order.estado === "cancelado" ? "Cancelado" : "Completado",
        tone: order.estado === "cancelado" ? "rejected" : "completed",
      }));

      return [...rechargeMovements, ...orderMovements, ...manualOrderMovements].sort(
        (first, second) => new Date(second.date).getTime() - new Date(first.date).getTime(),
      );
    },
  });

  const createRechargeMutation = useMutation({
    mutationFn: async () => {
      const method = RECHARGE_METHODS.find((item) => item.value === activeMethod)!;
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Monto inválido");
      }

      const { error } = await supabase.from("recargas").insert({
        metodo: activeMethod,
        monto: parsedAmount,
        moneda: method.currency,
        nombre_declarado: declaredName.trim(),
        para_otro_usuario: forAnotherUser,
        beneficiario_email: forAnotherUser ? beneficiaryEmail.trim() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Solicitud registrada como pendiente de verificación.");
      setDeclaredName("");
      setAmount("");
      setBeneficiaryEmail("");
      setForAnotherUser(false);
      void queryClient.invalidateQueries({ queryKey: ["wallet-movements", userId] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "No se pudo registrar la recarga.";
      toast.error(message.includes("recipient") ? "El correo receptor debe tener una cuenta CMD." : message);
    },
  });

  const selectedMethod = RECHARGE_METHODS.find((method) => method.value === activeMethod)!;
  const settings = settingsQuery.data ?? null;
  const methodInstructions = getMethodInstructions(activeMethod, settings);
  const nameLabel = activeMethod === "binance" ? "Nombre o ID de Binance Pay" : "Primer nombre o tag declarado";
  const qrUrl =
    activeMethod === "lemon_cash"
      ? settings?.lemon_qr_url
      : activeMethod === "yape_plin"
        ? settings?.yape_plin_qr_url
        : settings?.binance_qr_url;
  const qrLabel = activeMethod === "lemon_cash" ? "Lemon Cash" : activeMethod === "yape_plin" ? "Yape / Plin" : "Binance Pay";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (declaredName.trim().length < 2) {
      toast.error("Ingresa el nombre o identificador con el que realizaste el pago.");
      return;
    }
    if (forAnotherUser && !beneficiaryEmail.trim()) {
      toast.error("Ingresa el correo del usuario que recibirá el saldo.");
      return;
    }
    createRechargeMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="wallet-recharge-title">
      <button
        type="button"
        aria-label="Cerrar recarga de saldo"
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <section className="relative flex w-full max-w-4xl max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <WalletCards className="h-4 w-4" aria-hidden="true" />
              <span className="text-[10px] font-black uppercase tracking-[0.16em]">Mi Billetera</span>
            </div>
            <h2 id="wallet-recharge-title" className="mt-1 text-xl font-black text-white">Recargar saldo</h2>
            <p className="mt-1 text-xs text-white/50">Registra tu pago para que sea verificado por el equipo CMD.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-white/55 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="cmd-dark-scrollbar min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="relative">
            <div
              ref={methodsScroll.scrollRef}
              className={cn(
                "flex touch-pan-x gap-2 overflow-x-auto pb-1 scrollbar-none select-none",
                methodsScroll.isDragging ? "cursor-grabbing" : "cursor-grab",
              )}
              role="tablist"
              aria-label="Método de recarga"
              onPointerDown={methodsScroll.onPointerDown}
              onPointerMove={methodsScroll.onPointerMove}
              onPointerUp={methodsScroll.onPointerUp}
              onPointerCancel={methodsScroll.onPointerCancel}
              onClickCapture={methodsScroll.onClickCapture}
            >
              {RECHARGE_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  role="tab"
                  aria-selected={activeMethod === method.value}
                  onClick={() => setActiveMethod(method.value)}
                  className={cn(
                    "shrink-0 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-wide transition",
                    activeMethod === method.value
                      ? "border-primary/50 bg-primary/15 text-white"
                      : "border-border bg-background text-white/50 hover:border-primary/30 hover:text-white/85",
                  )}
                >
                  {method.label}
                </button>
              ))}
            </div>
            {methodsScroll.hasStartOverflow && (
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-background to-transparent" />
            )}
            {methodsScroll.hasEndOverflow && (
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-background to-transparent" />
            )}
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(15rem,0.9fr)]">
            <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-white/[0.02] p-4 sm:p-5">
              <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/[0.07] p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-white/70">{methodInstructions.primary}</p>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">Métodos soportados</p>
                <p className="mt-1 text-sm text-white/75">{methodInstructions.supported}</p>
              </div>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-white/55">{nameLabel}</span>
                <input
                  required
                  maxLength={120}
                  value={declaredName}
                  onChange={(event) => setDeclaredName(event.target.value)}
                  placeholder={activeMethod === "lemon_cash" ? "Ej.: mariana o @mariana" : "Ej.: Mariana Pérez"}
                  className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wide text-white/55">
                  Monto a recargar en {selectedMethod.currency}
                </span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder={selectedMethod.currency === "PEN" ? "20.00" : "5.00"}
                  className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-3 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={forAnotherUser}
                  onChange={(event) => setForAnotherUser(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[var(--color-primary,#DC2626)]"
                />
                <span>
                  ¿La recarga es para otro usuario?
                  <span className="mt-0.5 block text-xs text-white/40">El receptor debe tener una cuenta registrada en CMD Streaming.</span>
                </span>
              </label>
              {forAnotherUser && (
                <label className="block space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-white/55">Correo del usuario receptor</span>
                  <input
                    required
                    type="email"
                    value={beneficiaryEmail}
                    onChange={(event) => setBeneficiaryEmail(event.target.value)}
                    placeholder="usuario@correo.com"
                    className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                  />
                </label>
              )}
              <button
                type="submit"
                disabled={createRechargeMutation.isPending}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-accent px-4 text-[10px] font-black uppercase tracking-wide text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createRechargeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Ya pagué, verificar
              </button>
              <button
                type="button"
                onClick={onReportSupport}
                className="inline-flex w-full items-center justify-center gap-2 text-center text-xs font-semibold text-primary transition hover:text-white"
              >
                ¿Problemas con la verificación? Reportar manualmente en Soporte
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </form>

            <aside className="rounded-xl border border-border bg-background p-4 sm:p-5">
              <div className="mx-auto grid h-44 w-44 place-items-center overflow-hidden rounded-xl border border-white/10 bg-white p-2">
                {qrUrl ? (
                  <img
                    src={qrUrl}
                    alt={`Código QR para recarga ${qrLabel}`}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-100 p-4 text-center text-slate-500">
                    <CreditCard className="h-7 w-7" aria-hidden="true" />
                    <p className="mt-2 text-[10px] font-bold">QR no configurado</p>
                  </div>
                )}
              </div>
              <p className="mt-4 text-center text-sm font-bold text-white">
                {activeMethod === "lemon_cash"
                  ? settings?.lemon_tag
                    ? `LemonTag: ${settings.lemon_tag}`
                    : "Lemon Cash"
                  : methodInstructions.reference}
              </p>
              <div className="mt-5 border-t border-border pt-4">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/40">Importante</p>
                <p className="mt-2 text-xs leading-relaxed text-white/60">{methodInstructions.detail}</p>
              </div>
            </aside>
          </div>

          <section className="mt-6 border-t border-border pt-5" aria-labelledby="wallet-history-title">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" aria-hidden="true" />
              <h3 id="wallet-history-title" className="text-base font-bold text-white">Historial de movimientos</h3>
            </div>
            <p className="mt-1 text-xs text-white/45">Recargas solicitadas y compras asociadas a tu cuenta.</p>

            {movementsQuery.isLoading ? (
              <div
                className="mt-4 overflow-hidden rounded-xl border border-border bg-background"
                role="status"
                aria-label="Cargando historial de movimientos"
              >
                <div className="hidden grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto_auto] gap-4 border-b border-border px-4 py-3 sm:grid">
                  <Skeleton className="h-2.5 w-14 bg-white/[0.08]" />
                  <Skeleton className="h-2.5 w-12 bg-white/[0.08]" />
                  <Skeleton className="h-2.5 w-16 bg-white/[0.08]" />
                  <Skeleton className="h-2.5 w-14 bg-white/[0.08]" />
                  <Skeleton className="h-2.5 w-14 bg-white/[0.08]" />
                </div>
                {Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={index}
                    className="grid gap-2 border-b border-border px-4 py-3 last:border-b-0 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto_auto] sm:items-center sm:gap-4"
                  >
                    <Skeleton className="h-3 w-20 bg-white/[0.08]" />
                    <Skeleton className="h-3.5 w-24 bg-white/[0.08]" />
                    <Skeleton className="h-3 w-28 bg-white/[0.08]" />
                    <Skeleton className="h-3.5 w-14 bg-white/[0.08]" />
                    <Skeleton className="h-5 w-20 rounded-full bg-white/[0.08]" />
                  </div>
                ))}
                <span className="sr-only">Cargando historial de movimientos</span>
              </div>
            ) : movementsQuery.isError ? (
              <div className="mt-4 rounded-xl border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">
                No pudimos cargar el historial de movimientos.
              </div>
            ) : (movementsQuery.data?.length ?? 0) === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border bg-background p-6 text-center text-sm text-white/45">
                Aún no tienes movimientos registrados.
              </div>
            ) : (
              <div className="mt-4 overflow-hidden rounded-xl border border-border bg-background">
                <div className="hidden grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto_auto] gap-4 border-b border-border px-4 py-3 text-[9px] font-black uppercase tracking-[0.14em] text-white/40 sm:grid">
                  <span>Fecha</span><span>Tipo</span><span>Método</span><span>Monto</span><span>Estado</span>
                </div>
                <div className="divide-y divide-border">
                  {(movementsQuery.data ?? []).map((movement) => (
                    <div key={movement.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto_auto] sm:items-center sm:gap-4">
                      <span className="text-[10px] text-white/40">{formatRechargeDate(movement.date)}</span>
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-white/80">
                        {movement.type === "Recarga" ? <ReceiptText className="h-3.5 w-3.5 text-primary" /> : <ShoppingBag className="h-3.5 w-3.5 text-sky-300" />}
                        {movement.type}
                      </span>
                      <span className="truncate text-xs text-white/55">{movement.method}</span>
                      <span className="text-xs font-bold text-white">{movement.amount}</span>
                      <span><MovementStatus tone={movement.tone} label={movement.status} /></span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}

function MovementStatus({ tone, label }: { tone: WalletMovement["tone"]; label: string }) {
  const styles = {
    pending: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    verified: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    rejected: "border-red-400/25 bg-red-400/10 text-red-200",
    completed: "border-sky-400/25 bg-sky-400/10 text-sky-200",
  };

  return <span className={cn("inline-flex rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-wide", styles[tone])}>{label}</span>;
}

function getMethodInstructions(method: RechargeMethod, settings: PaymentSettings | null) {
  if (method === "lemon_cash") {
    return {
      primary: "Escanea el QR. Debes enviar el monto EXACTO que ingresaste para que el sistema lo verifique correctamente.",
      supported: "Yape, Plin, BCP, Interbank y transferencias desde otra cuenta Lemon Cash.",
      reference: settings?.lemon_tag ? `LemonTag: ${settings.lemon_tag}` : "El QR real será configurado por administración.",
      detail: "El QR mostrado es una referencia hasta que el equipo configure los datos reales de cobro. No envíes dinero si no has confirmado el destino con CMD.",
    };
  }

  if (method === "yape_plin") {
    return {
      primary: "Realiza el pago por Yape o Plin con el monto exacto ingresado y registra aquí el nombre mostrado en tu comprobante.",
      supported: "Yape y Plin mediante los datos oficiales mostrados por CMD Streaming.",
      reference: settings?.yape_plin_contact || "Los datos de Yape/Plin serán configurados por administración.",
      detail: "La solicitud quedará pendiente hasta que el equipo verifique el pago. Conserva tu comprobante por si necesitas reportarlo manualmente.",
    };
  }

  return {
    primary: "Envía el monto exacto en USD mediante Binance Pay y registra el nombre o ID usado para el pago.",
    supported: "Binance Pay en USD con el identificador oficial de CMD Streaming.",
    reference: settings?.binance_pay_id || "El ID de Binance Pay será configurado por administración.",
    detail: "El administrador definirá el monto equivalente acreditado en PEN al verificar la operación. No se aplica una conversión automática.",
  };
}
