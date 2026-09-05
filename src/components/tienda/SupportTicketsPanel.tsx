import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  Clock3,
  FilePlus2,
  Inbox,
  Loader2,
  MessageCircle,
  Send,
  Store,
  Ticket,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  formatTicketDate,
  ticketCategoryLabel,
  TICKET_CATEGORY_OPTIONS,
  TICKET_STATUS_LABELS,
  TICKET_STATUS_STYLES,
  type SupportTicket,
  type TicketCategory,
  type TicketReply,
  type TicketStatus,
} from "@/lib/tickets";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type CreateTicketForm = {
  asunto: string;
  categoria: TicketCategory;
  descripcion: string;
};

export type SupportTicketPrefill = Partial<CreateTicketForm>;

const EMPTY_TICKET_FORM: CreateTicketForm = {
  asunto: "",
  categoria: "producto_cuenta",
  descripcion: "",
};

type SupportTicketsPanelProps = {
  userId?: string;
  onOpenAuth: () => void;
  onGoShop: () => void;
  onContactSupport: () => void;
  createTicketPrefill?: SupportTicketPrefill | null;
  onCreateTicketPrefillConsumed?: () => void;
  focusTicketId?: string | null;
  onFocusTicketConsumed?: () => void;
};

/** Panel de soporte del cliente: crea, consulta y responde sus propios tickets. */
export function SupportTicketsPanel({
  userId,
  onOpenAuth,
  onGoShop,
  onContactSupport,
  createTicketPrefill,
  onCreateTicketPrefillConsumed,
  focusTicketId,
  onFocusTicketConsumed,
}: SupportTicketsPanelProps) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [form, setForm] = useState<CreateTicketForm>(EMPTY_TICKET_FORM);
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    if (!createTicketPrefill) return;

    setForm({ ...EMPTY_TICKET_FORM, ...createTicketPrefill });
    setCreateOpen(true);
    onCreateTicketPrefillConsumed?.();
  }, [createTicketPrefill, onCreateTicketPrefillConsumed]);

  const ticketsQuery = useQuery({
    queryKey: ["support-tickets", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("user_id", userId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as SupportTicket[];
    },
  });

  const repliesQuery = useQuery({
    queryKey: ["support-ticket-replies", selectedTicket?.id],
    enabled: Boolean(selectedTicket),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ticket_respuestas")
        .select("*")
        .eq("ticket_id", selectedTicket!.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as TicketReply[];
    },
  });

  const createTicketMutation = useMutation({
    mutationFn: async (payload: CreateTicketForm) => {
      const { data, error } = await supabase
        .from("tickets")
        .insert({
          asunto: payload.asunto.trim(),
          categoria: payload.categoria,
          descripcion: payload.descripcion.trim(),
        })
        .select()
        .single();
      if (error) throw error;
      return data as SupportTicket;
    },
    onSuccess: (ticket) => {
      toast.success("Ticket creado. Te avisaremos cuando tengamos una respuesta.");
      setCreateOpen(false);
      setForm(EMPTY_TICKET_FORM);
      setSelectedTicket(ticket);
      void queryClient.invalidateQueries({ queryKey: ["support-tickets", userId] });
    },
    onError: () => toast.error("No se pudo crear el ticket. Inténtalo nuevamente."),
  });

  const replyMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!selectedTicket) throw new Error("No ticket selected");

      const { error: replyError } = await supabase.from("ticket_respuestas").insert({
        ticket_id: selectedTicket.id,
        mensaje: message.trim(),
      });
      if (replyError) throw replyError;

      const { data: updatedTicket, error: ticketError } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", selectedTicket.id)
        .single();
      if (ticketError) throw ticketError;
      return updatedTicket as SupportTicket;
    },
    onSuccess: (ticket) => {
      setReplyMessage("");
      setSelectedTicket(ticket);
      toast.success("Tu respuesta fue enviada.");
      void queryClient.invalidateQueries({ queryKey: ["support-tickets", userId] });
      void queryClient.invalidateQueries({ queryKey: ["support-ticket-replies", ticket.id] });
    },
    onError: () => toast.error("No se pudo enviar la respuesta. Inténtalo nuevamente."),
  });

  const tickets = ticketsQuery.data ?? [];

  useEffect(() => {
    if (!focusTicketId || !ticketsQuery.data) return;
    const ticket = ticketsQuery.data.find((item) => item.id === focusTicketId);
    if (!ticket) return;
    setSelectedTicket(ticket);
    onFocusTicketConsumed?.();
  }, [focusTicketId, onFocusTicketConsumed, ticketsQuery.data]);

  const openCreateTicket = () => {
    if (!userId) {
      onOpenAuth();
      return;
    }
    setCreateOpen(true);
  };

  const handleCreateTicket = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (form.asunto.trim().length < 3) {
      toast.error("Escribe un asunto de al menos 3 caracteres.");
      return;
    }
    if (form.descripcion.trim().length < 10) {
      toast.error("Describe el problema con al menos 10 caracteres.");
      return;
    }
    createTicketMutation.mutate(form);
  };

  return (
    <section className="mt-6 pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <Ticket className="h-4 w-4" aria-hidden="true" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em]">
                Centro de ayuda
              </span>
            </div>
            <h1 className="mt-2 font-display text-2xl uppercase tracking-wide text-white">
              Soporte
            </h1>
            <p className="mt-1 max-w-xl text-sm text-white/60">
              Crea un ticket para que el equipo revise tu consulta y mantén toda la conversación en
              un solo lugar.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onContactSupport}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-red-accent px-3.5 text-[10px] font-black uppercase tracking-wide text-white transition hover:brightness-110"
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Hablar por WhatsApp
            </button>
            <button
              type="button"
              onClick={onGoShop}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-border bg-background px-3.5 text-[10px] font-black uppercase tracking-wide text-white/80 transition hover:border-primary/60 hover:text-white"
            >
              <Store className="h-3.5 w-3.5" aria-hidden="true" />
              Volver a la tienda
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Mis tickets</h2>
            <p className="mt-1 text-xs text-white/45">
              Consulta el estado y las respuestas de tus solicitudes.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreateTicket}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/15 px-4 text-[10px] font-black uppercase tracking-wide text-white transition hover:border-primary hover:bg-primary/25"
          >
            <FilePlus2 className="h-3.5 w-3.5" aria-hidden="true" />
            Crear ticket
          </button>
        </div>

        {!userId ? (
          <div className="mt-4 rounded-xl border border-border bg-background p-6 text-center sm:p-8">
            <Inbox className="mx-auto h-7 w-7 text-white/30" aria-hidden="true" />
            <h3 className="mt-3 text-sm font-bold text-white">
              Inicia sesión para ver tus tickets
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/55">
              Así podremos asociar tu consulta, tus respuestas y el historial de soporte a tu
              cuenta.
            </p>
            <button
              type="button"
              onClick={onOpenAuth}
              className="mt-5 rounded-lg bg-red-accent px-4 py-2.5 text-[10px] font-black uppercase tracking-wide text-white transition hover:brightness-110"
            >
              Iniciar sesión
            </button>
          </div>
        ) : ticketsQuery.isLoading ? (
          <div
            className="mt-4 overflow-hidden rounded-xl border border-border bg-background"
            role="status"
            aria-label="Cargando tickets"
          >
            <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_auto_auto] gap-4 border-b border-border px-4 py-3 md:grid">
              <Skeleton className="h-2.5 w-20 bg-white/[0.08]" />
              <Skeleton className="h-2.5 w-16 bg-white/[0.08]" />
              <Skeleton className="h-2.5 w-14 bg-white/[0.08]" />
              <Skeleton className="h-2.5 w-14 bg-white/[0.08]" />
            </div>
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="grid gap-3 border-b border-border px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_auto_auto] md:items-center md:gap-4"
              >
                <div className="space-y-2">
                  <Skeleton className="h-4 w-4/5 bg-white/[0.08]" />
                  <Skeleton className="h-2.5 w-24 bg-white/[0.08] md:hidden" />
                </div>
                <Skeleton className="h-3 w-20 bg-white/[0.08]" />
                <Skeleton className="h-5 w-20 rounded-full bg-white/[0.08]" />
                <Skeleton className="hidden h-3 w-20 bg-white/[0.08] md:block" />
              </div>
            ))}
            <span className="sr-only">Cargando tickets</span>
          </div>
        ) : ticketsQuery.isError ? (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-red-100">
            No pudimos cargar tus tickets. Actualiza la página o intenta nuevamente.
          </div>
        ) : tickets.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-background p-8 text-center sm:p-12">
            <Ticket className="mx-auto h-8 w-8 text-white/25" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold text-white/75">
              Aún no tienes tickets creados.
            </p>
            <p className="mt-1 text-xs text-white/45">
              Si necesitas ayuda con un pago, producto o cuenta, crea tu primera solicitud.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-xl border border-border bg-background">
            <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_auto_auto] gap-4 border-b border-border px-4 py-3 text-[9px] font-black uppercase tracking-[0.15em] text-white/40 md:grid">
              <span>Asunto</span>
              <span>Categoría</span>
              <span>Estado</span>
              <span>Fecha</span>
            </div>
            <div className="divide-y divide-border">
              {tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  type="button"
                  onClick={() => setSelectedTicket(ticket)}
                  className="grid w-full gap-2 px-4 py-4 text-left transition hover:bg-white/[0.035] md:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_auto_auto] md:items-center md:gap-4"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {ticket.asunto}
                    </span>
                    <span className="mt-1 flex items-center gap-1 text-[10px] text-white/40 md:hidden">
                      <Clock3 className="h-3 w-3" aria-hidden="true" />
                      {formatTicketDate(ticket.created_at)}
                    </span>
                  </span>
                  <span className="text-xs text-white/55">
                    {ticketCategoryLabel(ticket.categoria)}
                  </span>
                  <span>
                    <TicketStatusBadge status={ticket.estado} />
                  </span>
                  <span className="hidden items-center gap-1 text-[10px] text-white/40 md:flex">
                    {formatTicketDate(ticket.created_at)}
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {createOpen && (
        <CreateTicketModal
          form={form}
          pending={createTicketMutation.isPending}
          onClose={() => setCreateOpen(false)}
          onChange={setForm}
          onSubmit={handleCreateTicket}
        />
      )}

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          replies={repliesQuery.data ?? []}
          repliesLoading={repliesQuery.isLoading}
          replyMessage={replyMessage}
          replyPending={replyMutation.isPending}
          onClose={() => {
            setSelectedTicket(null);
            setReplyMessage("");
          }}
          onReplyMessageChange={setReplyMessage}
          onReply={() => {
            if (!replyMessage.trim()) {
              toast.error("Escribe un mensaje antes de enviarlo.");
              return;
            }
            replyMutation.mutate(replyMessage);
          }}
        />
      )}
    </section>
  );
}

function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-wide",
        TICKET_STATUS_STYLES[status],
      )}
    >
      {TICKET_STATUS_LABELS[status]}
    </span>
  );
}

function CreateTicketModal({
  form,
  pending,
  onClose,
  onChange,
  onSubmit,
}: {
  form: CreateTicketForm;
  pending: boolean;
  onClose: () => void;
  onChange: (form: CreateTicketForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-ticket-title"
    >
      <button
        type="button"
        aria-label="Cerrar formulario de ticket"
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <form
        onSubmit={onSubmit}
        className="relative flex w-full max-w-xl max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
              Centro de ayuda
            </p>
            <h2 id="create-ticket-title" className="mt-1 text-xl font-black text-white">
              Crear ticket
            </h2>
            <p className="mt-1 text-xs text-white/50">Cuéntanos qué ocurrió para poder ayudarte.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-white/55 transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 space-y-4 overflow-y-auto p-5 sm:p-6">
          <label className="block space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-white/55">
              Asunto
            </span>
            <input
              required
              maxLength={140}
              value={form.asunto}
              onChange={(event) => onChange({ ...form, asunto: event.target.value })}
              placeholder="Ej.: No puedo acceder a mi producto"
              className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-white/55">
              Categoría
            </span>
            <select
              value={form.categoria}
              onChange={(event) =>
                onChange({ ...form, categoria: event.target.value as TicketCategory })
              }
              className="w-full rounded-lg border border-border bg-background px-3 py-3 text-sm text-white outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            >
              {TICKET_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-card">
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wide text-white/55">
              Descripción
            </span>
            <textarea
              required
              minLength={10}
              maxLength={3000}
              rows={6}
              value={form.descripcion}
              onChange={(event) => onChange({ ...form, descripcion: event.target.value })}
              placeholder="Indica el producto, el problema y cualquier detalle que ayude a revisarlo."
              className="w-full resize-y rounded-lg border border-border bg-background px-3 py-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/30 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
            />
          </label>
        </div>
        <footer className="flex flex-col-reverse gap-2 border-t border-border p-5 sm:flex-row sm:justify-end sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="min-h-10 rounded-lg border border-border px-4 text-[10px] font-black uppercase tracking-wide text-white/65 transition hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-red-accent px-4 text-[10px] font-black uppercase tracking-wide text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Enviar ticket
          </button>
        </footer>
      </form>
    </div>
  );
}

function TicketDetailModal({
  ticket,
  replies,
  repliesLoading,
  replyMessage,
  replyPending,
  onClose,
  onReplyMessageChange,
  onReply,
}: {
  ticket: SupportTicket;
  replies: TicketReply[];
  repliesLoading: boolean;
  replyMessage: string;
  replyPending: boolean;
  onClose: () => void;
  onReplyMessageChange: (value: string) => void;
  onReply: () => void;
}) {
  const ticketOpen = ticket.estado !== "cerrado";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ticket-detail-title"
    >
      <button
        type="button"
        aria-label="Cerrar detalle del ticket"
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <section className="relative flex w-full max-w-2xl max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border p-5 sm:p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                {ticketCategoryLabel(ticket.categoria)}
              </p>
              <TicketStatusBadge status={ticket.estado} />
            </div>
            <h2
              id="ticket-detail-title"
              className="mt-2 truncate text-lg font-black text-white sm:text-xl"
            >
              {ticket.asunto}
            </h2>
            <p className="mt-1 text-xs text-white/45">
              Creado el {formatTicketDate(ticket.created_at)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/5 text-white/55 transition hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          <ConversationMessage
            author="Tú"
            date={ticket.created_at}
            message={ticket.descripcion}
            tone="user"
          />
          {repliesLoading ? (
            <div className="grid min-h-24 place-items-center">
              <Loader2
                className="h-4 w-4 animate-spin text-primary"
                aria-label="Cargando respuestas"
              />
            </div>
          ) : (
            replies.map((reply) => (
              <ConversationMessage
                key={reply.id}
                author={reply.autor === "admin" ? "Equipo CMD" : "Tú"}
                date={reply.created_at}
                message={reply.mensaje}
                tone={reply.autor === "admin" ? "admin" : "user"}
              />
            ))
          )}
        </div>

        <footer className="border-t border-border p-5 sm:p-6">
          {ticketOpen ? (
            <div className="flex gap-2">
              <textarea
                rows={2}
                maxLength={3000}
                value={replyMessage}
                onChange={(event) => onReplyMessageChange(event.target.value)}
                placeholder="Escribe una respuesta..."
                className="min-h-11 flex-1 resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
              <button
                type="button"
                onClick={onReply}
                disabled={replyPending || !replyMessage.trim()}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-red-accent text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Enviar respuesta"
              >
                {replyPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          ) : (
            <p className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-3 text-center text-xs text-white/50">
              Este ticket está cerrado. Si necesitas otra ayuda, crea una nueva solicitud.
            </p>
          )}
        </footer>
      </section>
    </div>
  );
}

function ConversationMessage({
  author,
  date,
  message,
  tone,
}: {
  author: string;
  date: string;
  message: string;
  tone: "user" | "admin";
}) {
  return (
    <article
      className={cn(
        "rounded-xl border p-4",
        tone === "admin"
          ? "border-sky-400/20 bg-sky-400/[0.06]"
          : "border-white/10 bg-white/[0.035]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={cn("text-xs font-bold", tone === "admin" ? "text-sky-200" : "text-white/80")}>
          {author}
        </p>
        <time className="text-[10px] text-white/40">{formatTicketDate(date)}</time>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/70">{message}</p>
    </article>
  );
}
