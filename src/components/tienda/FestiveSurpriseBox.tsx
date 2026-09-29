import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, CheckCircle2, Gift, Loader2, LockKeyhole, Sparkles } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { toast } from "sonner";
import { GravitLoader } from "@/components/GravitLoader";
import { OrderCelebrationDialog } from "@/components/OrderCelebrationDialog";
import { useAuthState } from "@/hooks/useAuthState";
import {
  eventHasEnded,
  eventHasStarted,
  eventIsLive,
  festiveEventQueryKey,
  fetchActiveFestiveEvent,
  formatCountdown,
} from "@/lib/festive-events";
import type { OrderCredentialReceipt } from "@/lib/order-credentials";
import { supabase } from "@/integrations/supabase/client";

type WonProduct = { id: string; name: string; image_url: string | null };

function errorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/already opened/i.test(message)) return "Ya abriste tu caja de este evento.";
  if (/no festive boxes|box(es)? are available/i.test(message))
    return "Ya no quedan cajas disponibles.";
  if (/stock/i.test(message)) return "No quedan unidades disponibles para este sorteo.";
  if (/after the event ends|when the event ends/i.test(message))
    return "Podrás abrir la caja cuando termine el evento.";
  return message || "No se pudo abrir la caja sorpresa.";
}

function festiveWinnerMessage(themeKey: string, eventName: string) {
  switch (themeKey) {
    case "halloween":
      return `Felicidades, has sido ganador de la caja sorpresa de ${eventName}. ¡Que tengas un Halloween terroríficamente feliz!`;
    case "navidad":
      return `Felicidades, has sido ganador de la caja sorpresa de ${eventName}. ¡Te deseamos una Navidad llena de alegría y buenos regalos!`;
    case "ano_nuevo":
      return `Felicidades, has sido ganador de la caja sorpresa de ${eventName}. ¡Que tengas un Año Nuevo lleno de éxitos y felicidad!`;
    case "inocentes":
      return `Felicidades, has sido ganador de la caja sorpresa de ${eventName}. ¡Que tengas un feliz Día de los Inocentes y disfrutes tu premio!`;
    default:
      return `Felicidades, has sido ganador de la caja sorpresa de ${eventName}. ¡Disfruta tu premio y que tengas un día feliz!`;
  }
}

export function FestiveSurpriseBox() {
  const { session } = useAuthState();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => Date.now());
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [wonProduct, setWonProduct] = useState<WonProduct | null>(null);
  const [alreadyOpened, setAlreadyOpened] = useState(false);
  const [winnerReceipt, setWinnerReceipt] = useState<OrderCredentialReceipt | null>(null);
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);

  const eventQuery = useQuery({
    queryKey: festiveEventQueryKey,
    queryFn: fetchActiveFestiveEvent,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
  const event = eventQuery.data;

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const openingQuery = useQuery({
    queryKey: ["festive-opening", event?.id, session?.user.id],
    enabled: Boolean(event?.id && session?.user.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("festive_event_box_openings")
        .select("id, product_id_won, order_id, opened_at")
        .eq("event_id", event!.id)
        .eq("user_id", session!.user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const winnerReceiptQuery = useQuery({
    queryKey: ["festive-winner-receipt", openingQuery.data?.order_id, session?.user.id],
    enabled: Boolean(openingQuery.data?.order_id && event && eventHasEnded(event, now)),
    queryFn: async () => {
      const orderId = openingQuery.data?.order_id;
      if (!orderId) return null;
      const { data, error } = await supabase.rpc("get_order_celebration_receipt", {
        p_order_id: orderId,
      });
      if (error) throw error;
      return (data?.[0] ?? null) as OrderCredentialReceipt | null;
    },
    staleTime: 30_000,
  });

  const purchasesQuery = useQuery({
    queryKey: ["festive-purchases", event?.id, session?.user.id],
    enabled: Boolean(event?.id && session?.user.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("festive_event_box_purchases")
        .select("quantity")
        .eq("event_id", event!.id)
        .eq("user_id", session!.user.id);
      if (error) throw error;
      return (data ?? []).reduce((total, purchase) => total + purchase.quantity, 0);
    },
  });

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("El evento ya no está disponible.");
      if (!session) throw new Error("Inicia sesión para comprar cajas.");
      const { data, error } = await supabase.rpc("purchase_festive_boxes", {
        p_event_id: event.id,
        p_quantity: purchaseQuantity,
      });
      if (error) throw error;
      const result = data?.[0];
      if (!result) throw new Error("El servidor no confirmó la compra.");
      return result;
    },
    onSuccess: (result) => {
      void queryClient.invalidateQueries({
        queryKey: ["festive-purchases", event?.id, session?.user.id],
      });
      toast.success(
        `Compra confirmada: ${result.quantity} caja(s) por S/ ${Number(result.total_pen).toFixed(2)}.`,
      );
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  useEffect(() => {
    if (openingQuery.data) setAlreadyOpened(true);
  }, [openingQuery.data]);

  useEffect(() => {
    if (winnerReceiptQuery.data) setWinnerReceipt(winnerReceiptQuery.data);
  }, [winnerReceiptQuery.data]);

  const openMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error("El evento ya no está disponible.");
      if (!session) throw new Error("Inicia sesión para abrir tu caja sorpresa.");
      if (!purchasesQuery.data) throw new Error("Compra una caja antes de abrirla.");
      if (purchasesQuery.data < 1) throw new Error("Compra una caja antes de abrirla.");
      const { data, error } = await supabase.rpc("open_festive_box", { p_event_id: event.id });
      if (error) throw error;
      const opening = data?.[0];
      if (!opening) throw new Error("El servidor no devolvió el producto ganado.");
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, name, image_url")
        .eq("id", opening.product_id_won)
        .maybeSingle();
      if (productError) throw productError;
      const { data: receipt, error: receiptError } = await supabase.rpc(
        "get_order_celebration_receipt",
        { p_order_id: opening.order_id },
      );
      if (receiptError) throw receiptError;
      return { opening, product, receipt: (receipt?.[0] ?? null) as OrderCredentialReceipt | null };
    },
    onSuccess: ({ product, receipt }) => {
      setAlreadyOpened(true);
      setWonProduct(product);
      setWinnerReceipt(receipt);
      setShowWinnerDialog(Boolean(receipt));
      void import("canvas-confetti").then(({ default: confetti }) => {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.65 } });
      });
      void queryClient.invalidateQueries({
        queryKey: ["festive-opening", event?.id, session?.user.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ["festive-purchases", event?.id, session?.user.id],
      });
      toast.success("¡Caja abierta! Tu premio ya fue entregado en Mis Compras.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  if (!event || !eventHasStarted(event, now)) return null;
  const eventLive = eventIsLive(event, now);
  const eventEnded = eventHasEnded(event, now);
  const remaining = formatCountdown(Date.parse(event.ends_at) - now);
  const eventStyle = {
    ...(event.accent_color ? { "--event-accent": event.accent_color } : {}),
    ...(event.accent_color_2 ? { "--event-accent-2": event.accent_color_2 } : {}),
  } as CSSProperties;

  return (
    <>
      <section
        id="caja-sorpresa"
        data-cmd-event={event.theme_key}
        style={eventStyle}
        className="cmd-festive-box mb-8 scroll-mt-24 rounded-2xl border border-[color-mix(in_srgb,var(--event-accent)_40%,transparent)] p-5 sm:p-7"
      >
        <div className="relative z-10 flex flex-col items-center text-center">
          <div
            className={`cmd-surprise-box-art ${openMutation.isSuccess ? "is-open" : ""}`}
            aria-hidden="true"
          >
            {openMutation.isSuccess ? (
              <Gift className="h-10 w-10" />
            ) : (
              <Box className="h-10 w-10" />
            )}
          </div>
          <p className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[var(--event-accent-2)]/80">
            <Sparkles className="h-3.5 w-3.5" /> Caja sorpresa
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">Gana un producto del catálogo</h2>
          <p className="mt-2 max-w-xl text-sm text-white/65">
            El sorteo se resuelve de forma segura en Supabase y el premio se entrega automáticamente
            con el flujo normal de credenciales.
          </p>
          <p className="mt-3 text-xs font-semibold text-white/55">
            {eventEnded ? (
              <span className="text-[var(--event-accent-2)]">
                El evento terminó: ya puedes abrir tu caja.
              </span>
            ) : (
              <>
                Tiempo restante: <span className="text-[var(--event-accent-2)]">{remaining}</span>
              </>
            )}
          </p>
          <p className="mt-2 text-sm font-bold text-white">
            S/ 3.00 <span className="font-normal text-white/55">(USD 0.88) por caja</span>
          </p>

          {session && eventLive && (
            <div className="mt-5 flex w-full max-w-md flex-col gap-2 rounded-xl border border-white/10 bg-black/15 p-3 text-left sm:flex-row sm:items-end">
              <label className="flex-1 text-[10px] font-black uppercase tracking-wider text-white/55">
                Cajas a comprar
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={purchaseQuantity}
                  onChange={(event) =>
                    setPurchaseQuantity(
                      Math.min(1000, Math.max(1, Number(event.target.value) || 1)),
                    )
                  }
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-background px-3 py-2 text-sm font-normal normal-case tracking-normal text-white"
                />
              </label>
              <button
                type="button"
                onClick={() => purchaseMutation.mutate()}
                disabled={purchaseMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--event-accent)] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white disabled:opacity-60"
              >
                {purchaseMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Comprar {purchaseQuantity} caja{purchaseQuantity === 1 ? "" : "s"}
              </button>
            </div>
          )}
          {session && (
            <p className="mt-2 text-xs text-white/50">
              Compradas: {purchasesQuery.data ?? 0}. El sorteo permite como máximo 3 ganadores, una
              caja por usuario.
            </p>
          )}

          {wonProduct ? (
            <div className="cmd-festive-result mt-6 w-full max-w-md rounded-2xl border border-[color-mix(in_srgb,var(--event-accent-2)_35%,transparent)] p-4 text-left">
              <div className="flex items-center gap-3">
                {wonProduct.image_url ? (
                  <img
                    src={wonProduct.image_url}
                    alt=""
                    className="h-14 w-14 rounded-xl object-cover"
                  />
                ) : (
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-black/20">
                    <Gift className="h-6 w-6" />
                  </div>
                )}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-[var(--event-accent-2)]">
                    Premio ganado
                  </p>
                  <p className="mt-1 font-bold text-white">{wonProduct.name}</p>
                </div>
                <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-300" />
              </div>
              <p className="mt-3 text-xs text-white/60">
                Revisa <strong className="text-white">Mis Compras</strong> para ver la entrega
                protegida.
              </p>
            </div>
          ) : alreadyOpened ? (
            <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <LockKeyhole className="h-4 w-4 text-[var(--event-accent-2)]" /> Ya abriste tu caja
                de este evento.
              </div>
              {winnerReceiptQuery.isError ? (
                <p className="text-xs text-amber-200">
                  No se pudieron cargar las credenciales todavía.
                </p>
              ) : winnerReceipt ? (
                <button
                  type="button"
                  onClick={() => setShowWinnerDialog(true)}
                  className="rounded-lg bg-[var(--event-accent)] px-4 py-2 text-xs font-black uppercase tracking-wider text-white"
                >
                  Ver premio y credenciales
                </button>
              ) : null}
            </div>
          ) : !session ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white/70">
              Inicia sesión para abrir tu caja sorpresa.
            </div>
          ) : !eventEnded ? (
            <div className="mt-6 rounded-xl border border-[color-mix(in_srgb,var(--event-accent-2)_30%,transparent)] bg-black/15 px-4 py-3 text-center text-sm text-white/70">
              Podrás abrir la caja cuando termine el evento y conocer si eres uno de los ganadores.
            </div>
          ) : !purchasesQuery.data ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white/70">
              Comprueba tu saldo y compra una caja para participar en el sorteo.
            </div>
          ) : purchasesQuery.data < 1 ? (
            <div className="mt-6 rounded-xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white/70">
              Compra al menos una caja para participar en el sorteo.
            </div>
          ) : (
            <div className="mt-6 w-full max-w-sm">
              <button
                type="button"
                onClick={() => openMutation.mutate()}
                disabled={openMutation.isPending}
                className="cmd-festive-open-button inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {openMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Gift className="h-4 w-4" />
                )}
                {openMutation.isPending ? "Abriendo caja..." : "Abrir caja"}
              </button>
              {openMutation.isPending && <GravitLoader label="Abriendo caja" />}
            </div>
          )}
        </div>
      </section>
      {showWinnerDialog && winnerReceipt && (
        <OrderCelebrationDialog
          receipt={winnerReceipt}
          canShareWithClient={false}
          onClose={() => setShowWinnerDialog(false)}
          festiveCelebration={{
            eventName: event.name,
            message: festiveWinnerMessage(event.theme_key, event.name),
            accentColor: event.accent_color,
            accentColor2: event.accent_color_2,
          }}
        />
      )}
    </>
  );
}
