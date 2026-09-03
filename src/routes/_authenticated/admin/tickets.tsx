import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Clock3,
  Inbox,
  Loader2,
  Search,
  Send,
  Ticket,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
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

type TicketProfile = Pick<Tables<"profiles">, "id" | "nombre_completo" | "email" | "whatsapp">;
type AdminTicket = SupportTicket & { profile: TicketProfile | null };
type StatusFilter = "todos" | TicketStatus;
type CategoryFilter = "todas" | TicketCategory;

export const Route = createFileRoute("/_authenticated/admin/tickets")({
  component: TicketsAdminPage,
});

function TicketsAdminPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("todas");
  const [search, setSearch] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<AdminTicket | null>(null);
  const [replyMessage, setReplyMessage] = useState("");

  const ticketsQuery = useQuery({
    queryKey: ["admin-support-tickets"],
    queryFn: async () => {
      const { data: tickets, error: ticketsError } = await supabase
        .from("tickets")
        .select("*")
        .order("updated_at", { ascending: false });
      if (ticketsError) throw ticketsError;

      const userIds = [...new Set(tickets.map((ticket) => ticket.user_id))];
      let profileById: Record<string, TicketProfile> = {};

      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, nombre_completo, email, whatsapp")
          .in("id", userIds);
        if (profilesError) throw profilesError;
        profileById = Object.fromEntries((profiles ?? []).map((profile) => [profile.id, profile]));
      }

      return tickets.map<AdminTicket>((ticket) => ({
        ...ticket,
        profile: profileById[ticket.user_id] ?? null,
      }));
    },
  });

  const repliesQuery = useQuery({
    queryKey: ["admin-support-ticket-replies", selectedTicket?.id],
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

  const replyMutation = useMutation({
    mutationFn: async (message: string) => {
      if (!selectedTicket) throw new Error("No ticket selected");

      const { error: replyError } = await supabase.from("ticket_respuestas").insert({
        ticket_id: selectedTicket.id,
        mensaje: message.trim(),
      });
      if (replyError) throw replyError;

      const { data, error: ticketError } = await supabase
        .from("tickets")
        .select("*")
        .eq("id", selectedTicket.id)
        .single();
      if (ticketError) throw ticketError;
      return data as SupportTicket;
    },
    onSuccess: (ticket) => {
      setSelectedTicket((current) => (current ? { ...ticket, profile: current.profile } : current));
      setReplyMessage("");
      toast.success("Respuesta enviada al cliente.");
      void queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      void queryClient.invalidateQueries({ queryKey: ["admin-support-ticket-replies", ticket.id] });
    },
    onError: () => toast.error("No se pudo enviar la respuesta. Inténtalo nuevamente."),
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTicket) throw new Error("No ticket selected");
      const { data, error } = await supabase
        .from("tickets")
        .update({ estado: "cerrado" })
        .eq("id", selectedTicket.id)
        .select()
        .single();
      if (error) throw error;
      return data as SupportTicket;
    },
    onSuccess: (ticket) => {
      setSelectedTicket((current) => (current ? { ...ticket, profile: current.profile } : current));
      toast.success("Ticket cerrado.");
      void queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
    },
    onError: () => toast.error("No se pudo cerrar el ticket. Inténtalo nuevamente."),
  });

  const tickets = ticketsQuery.data ?? [];
  const openCount = tickets.filter((ticket) => ticket.estado === "abierto").length;
  const filteredTickets = tickets.filter((ticket) => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch =
      normalizedSearch === "" ||
      ticket.asunto.toLowerCase().includes(normalizedSearch) ||
      (ticket.profile?.nombre_completo ?? "").toLowerCase().includes(normalizedSearch) ||
      (ticket.profile?.email ?? "").toLowerCase().includes(normalizedSearch);
    const matchesStatus = statusFilter === "todos" || ticket.estado === statusFilter;
    const matchesCategory = categoryFilter === "todas" || ticket.categoria === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const sendReply = () => {
    if (!replyMessage.trim()) {
      toast.error("Escribe una respuesta antes de enviarla.");
      return;
    }
    replyMutation.mutate(replyMessage);
  };

  return (
    <AdminLayout title="Tickets" subtitle="Gestiona las consultas y solicitudes de soporte">
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <TicketStat label="Abiertos" value={openCount} tone="amber" />
        <TicketStat
          label="Respondidos"
          value={tickets.filter((ticket) => ticket.estado === "respondido").length}
          tone="sky"
        />
        <TicketStat
          label="Cerrados"
          value={tickets.filter((ticket) => ticket.estado === "cerrado").length}
          tone="slate"
        />
      </div>

      <div className="mb-5 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3 lg:grid-cols-[minmax(0,1fr)_11rem_12rem]">
        <label className="relative">
          <span className="sr-only">Buscar ticket</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por asunto, cliente o correo..."
            className="w-full rounded-xl border border-white/10 bg-black/15 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/60"
          />
        </label>
        <label>
          <span className="sr-only">Filtrar por estado</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="w-full rounded-xl border border-white/10 bg-black/15 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/60"
          >
            <option value="todos" className="bg-card">Todos los estados</option>
            {Object.entries(TICKET_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value} className="bg-card">
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filtrar por categoría</span>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}
            className="w-full rounded-xl border border-white/10 bg-black/15 px-3 py-2.5 text-sm text-white outline-none focus:border-primary/60"
          >
            <option value="todas" className="bg-card">Todas las categorías</option>
            {TICKET_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value} className="bg-card">
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {ticketsQuery.isLoading ? (
        <div className="grid min-h-64 place-items-center rounded-2xl border border-white/10 bg-white/[0.025]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Cargando tickets" />
        </div>
      ) : ticketsQuery.isError ? (
        <div className="rounded-2xl border border-red-400/25 bg-red-400/10 p-5 text-sm text-red-100">
          No se pudo cargar la bandeja de tickets. Intenta actualizar la página.
        </div>
      ) : filteredTickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
          <Inbox className="mx-auto h-8 w-8 text-white/25" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-white/70">No hay tickets para estos filtros.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
          <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto] gap-4 border-b border-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/35 md:grid">
            <span>Ticket</span>
            <span>Cliente</span>
            <span>Estado</span>
            <span>Actualizado</span>
          </div>
          <div className="divide-y divide-white/8">
            {filteredTickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                onClick={() => setSelectedTicket(ticket)}
                className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-white/[0.045] md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_auto_auto] md:items-center md:gap-4"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-white">{ticket.asunto}</span>
                  <span className="mt-1 block text-[10px] text-white/40">
                    {ticketCategoryLabel(ticket.categoria)}
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-xs text-white/70">
                    <User className="h-3.5 w-3.5 shrink-0 text-white/35" aria-hidden="true" />
                    <span className="truncate">{ticket.profile?.nombre_completo || "Usuario"}</span>
                  </span>
                  <span className="mt-1 block truncate text-[10px] text-white/35">
                    {ticket.profile?.email || ticket.profile?.whatsapp || "Sin contacto"}
                  </span>
                </span>
                <span><AdminTicketStatusBadge status={ticket.estado} /></span>
                <span className="flex items-center gap-1 text-[10px] text-white/40">
                  <Clock3 className="h-3 w-3" aria-hidden="true" />
                  {formatTicketDate(ticket.updated_at)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedTicket && (
        <AdminTicketModal
          ticket={selectedTicket}
          replies={repliesQuery.data ?? []}
          repliesLoading={repliesQuery.isLoading}
          replyMessage={replyMessage}
          replyPending={replyMutation.isPending}
          closePending={closeMutation.isPending}
          onClose={() => {
            setSelectedTicket(null);
            setReplyMessage("");
          }}
          onReplyMessageChange={setReplyMessage}
          onReply={sendReply}
          onCloseTicket={() => closeMutation.mutate()}
        />
      )}
    </AdminLayout>
  );
}

function TicketStat({ label, value, tone }: { label: string; value: number; tone: "amber" | "sky" | "slate" }) {
  const tones = {
    amber: "border-amber-400/20 bg-amber-400/[0.08] text-amber-200",
    sky: "border-sky-400/20 bg-sky-400/[0.08] text-sky-200",
    slate: "border-white/10 bg-white/[0.04] text-white/65",
  };

  return (
    <div className={cn("rounded-2xl border p-4", tones[tone])}>
      <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-75">{label}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function AdminTicketStatusBadge({ status }: { status: TicketStatus }) {
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

function AdminTicketModal({
  ticket,
  replies,
  repliesLoading,
  replyMessage,
  replyPending,
  closePending,
  onClose,
  onReplyMessageChange,
  onReply,
  onCloseTicket,
}: {
  ticket: AdminTicket;
  replies: TicketReply[];
  repliesLoading: boolean;
  replyMessage: string;
  replyPending: boolean;
  closePending: boolean;
  onClose: () => void;
  onReplyMessageChange: (value: string) => void;
  onReply: () => void;
  onCloseTicket: () => void;
}) {
  const canReply = ticket.estado !== "cerrado";

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onReply();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="admin-ticket-title">
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar ticket"
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <section className="relative flex w-full max-w-3xl max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-card shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 bg-white/[0.02] p-5 sm:p-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-primary">
                {ticketCategoryLabel(ticket.categoria)}
              </p>
              <AdminTicketStatusBadge status={ticket.estado} />
            </div>
            <h2 id="admin-ticket-title" className="mt-2 truncate text-lg font-black text-white sm:text-xl">
              {ticket.asunto}
            </h2>
            <p className="mt-1 text-xs text-white/45">
              {ticket.profile?.nombre_completo || "Usuario"} · {ticket.profile?.email || "Sin correo"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/5 text-white/55 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          <AdminConversationMessage
            author={ticket.profile?.nombre_completo || "Cliente"}
            date={ticket.created_at}
            message={ticket.descripcion}
            tone="user"
          />
          {repliesLoading ? (
            <div className="grid min-h-24 place-items-center">
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-label="Cargando respuestas" />
            </div>
          ) : (
            replies.map((reply) => (
              <AdminConversationMessage
                key={reply.id}
                author={reply.autor === "admin" ? "Administrador" : ticket.profile?.nombre_completo || "Cliente"}
                date={reply.created_at}
                message={reply.mensaje}
                tone={reply.autor === "admin" ? "admin" : "user"}
              />
            ))
          )}
        </div>

        <footer className="border-t border-white/10 p-5 sm:p-6">
          {canReply ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                rows={3}
                maxLength={3000}
                value={replyMessage}
                onChange={(event) => onReplyMessageChange(event.target.value)}
                placeholder="Escribe una respuesta para el cliente..."
                className="w-full resize-none rounded-xl border border-white/10 bg-black/15 px-3 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-primary/60"
              />
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={onCloseTicket}
                  disabled={closePending || replyPending}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-[10px] font-black uppercase tracking-wide text-white/70 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {closePending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Cerrar ticket
                </button>
                <button
                  type="submit"
                  disabled={replyPending || closePending || !replyMessage.trim()}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-[10px] font-black uppercase tracking-wide text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {replyPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Responder
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-white/55">Este ticket está cerrado.</p>
              <CheckCircle2 className="h-5 w-5 text-white/35" aria-hidden="true" />
            </div>
          )}
        </footer>
      </section>
    </div>
  );
}

function AdminConversationMessage({
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
        "rounded-2xl border p-4",
        tone === "admin"
          ? "border-primary/25 bg-primary/[0.08]"
          : "border-white/10 bg-white/[0.035]",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={cn("text-xs font-bold", tone === "admin" ? "text-primary" : "text-white/80")}>{author}</p>
        <time className="text-[10px] text-white/40">{formatTicketDate(date)}</time>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/70">{message}</p>
    </article>
  );
}
