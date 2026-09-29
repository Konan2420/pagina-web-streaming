import { useMemo, useState, type CSSProperties } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Gift,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Trophy,
  WandSparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { FESTIVE_THEME_PRESETS, themeLabel } from "@/lib/festive-events";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/eventos-festivos")({
  component: FestiveEventsAdminPage,
});

type Product = Pick<
  Tables<"products">,
  "id" | "name" | "price" | "is_active" | "is_catalog_available"
>;
type Event = Tables<"festive_events">;
type Winner = {
  client_name: string;
  product_name: string;
  opened_at: string;
};

type EventForm = {
  id?: string;
  name: string;
  slug: string;
  themeKey: string;
  accentColor: string;
  accentColor2: string;
  iconKey: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  bannerTitle: string;
  bannerSubtitle: string;
  boxLimit: string;
  products: Record<string, number>;
};

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function defaultForm(): EventForm {
  const start = new Date();
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    name: "Halloween",
    slug: "halloween",
    themeKey: "halloween",
    accentColor: "#f97316",
    accentColor2: "#7c3aed",
    iconKey: "ghost",
    startsAt: toDateTimeLocal(start.toISOString()),
    endsAt: toDateTimeLocal(end.toISOString()),
    isActive: false,
    bannerTitle: "¡Caja sorpresa de Halloween!",
    bannerSubtitle: "Abre una caja y gana un producto del catálogo.",
    boxLimit: "3",
    products: {},
  };
}

function statusFor(event: Event) {
  const now = Date.now();
  if (Date.parse(event.ends_at) <= now)
    return { label: "Finalizado", className: "text-white/45 border-white/10 bg-white/5" };
  if (!event.is_active)
    return { label: "Inactivo", className: "text-white/45 border-white/10 bg-white/5" };
  if (Date.parse(event.starts_at) > now)
    return { label: "Programado", className: "text-amber-200 border-amber-300/20 bg-amber-300/10" };
  return { label: "Activo", className: "text-emerald-200 border-emerald-300/20 bg-emerald-300/10" };
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatWinnerDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function FestiveWinnersView({ events }: { events: Event[] }) {
  const [eventId, setEventId] = useState("");
  const winnersQuery = useQuery({
    queryKey: ["festive-box-winners", eventId || "all"],
    queryFn: async () => {
      // Deliberately request only the three fields exposed by the admin RPC.
      // No order, delivery, account, password, TOTP or credential columns are
      // queried or retained in this view.
      const { data, error } = await supabase.rpc("get_festive_box_winners", {
        _event_id: eventId || null,
      });
      if (error) throw error;
      return (data ?? []) as Winner[];
    },
  });

  const winners = winnersQuery.data ?? [];

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-300" />
            <h2 className="font-bold text-white">Ganadores</h2>
          </div>
          <p className="mt-1 text-xs text-white/45">
            Solo se muestran cliente, producto ganado y fecha de apertura.
          </p>
        </div>
        <label className="text-xs font-bold uppercase tracking-wide text-white/55">
          Evento
          <select
            value={eventId}
            onChange={(event) => setEventId(event.target.value)}
            className="mt-1.5 min-w-56 rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white"
          >
            <option value="">Todos los eventos</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="border-b border-white/10 px-5 py-3 text-sm text-white/60">
        <strong className="text-white">{winners.length}</strong>{" "}
        {winners.length === 1 ? "ganador" : "ganadores"}
      </div>

      {winnersQuery.isLoading ? (
        <div className="p-10 text-center text-sm text-white/55">
          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
          Cargando ganadores...
        </div>
      ) : winnersQuery.isError ? (
        <div className="p-10 text-center text-sm text-red-200">
          No se pudieron cargar los ganadores.
        </div>
      ) : winners.length === 0 ? (
        <div className="p-10 text-center text-sm text-white/50">
          {eventId ? "Aún no hay ganadores para este evento." : "Aún no hay ganadores registrados."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.02] text-[10px] uppercase tracking-wider text-white/45">
              <tr>
                <th className="px-5 py-3 font-bold">Cliente</th>
                <th className="px-5 py-3 font-bold">Producto ganado</th>
                <th className="px-5 py-3 font-bold">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {winners.map((winner, index) => (
                <tr
                  key={`${winner.opened_at}-${winner.client_name}-${index}`}
                  className="text-white/75"
                >
                  <td className="px-5 py-4 font-semibold text-white">{winner.client_name}</td>
                  <td className="px-5 py-4">{winner.product_name}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-white/55">
                    {formatWinnerDate(winner.opened_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function FestiveEventsAdminPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<EventForm | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeView, setActiveView] = useState<"config" | "winners">("config");

  const eventsQuery = useQuery({
    queryKey: ["admin-festive-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("festive_events")
        .select("*")
        .order("starts_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
  const productsQuery = useQuery({
    queryKey: ["admin-festive-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, is_active, is_catalog_available")
        .eq("is_active", true)
        .eq("is_catalog_available", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const editEvent = async (event: Event) => {
    const { data, error } = await supabase
      .from("festive_event_products")
      .select("*")
      .eq("event_id", event.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    const products = Object.fromEntries((data ?? []).map((item) => [item.product_id, item.weight]));
    setForm({
      id: event.id,
      name: event.name,
      slug: event.slug,
      themeKey: event.theme_key,
      accentColor: event.accent_color ?? "",
      accentColor2: event.accent_color_2 ?? "",
      iconKey: event.icon_key,
      startsAt: toDateTimeLocal(event.starts_at),
      endsAt: toDateTimeLocal(event.ends_at),
      isActive: event.is_active,
      bannerTitle: event.banner_title,
      bannerSubtitle: event.banner_subtitle ?? "",
      boxLimit: String(Math.min(3, Math.max(1, event.draw_limit ?? event.box_limit ?? 3))),
      products,
    });
    setPreviewOpen(false);
  };

  const saveMutation = useMutation({
    mutationFn: async (draft: EventForm) => {
      const startsAt = new Date(draft.startsAt);
      const endsAt = new Date(draft.endsAt);
      if (!draft.name.trim() || !draft.bannerTitle.trim())
        throw new Error("Nombre y título son obligatorios.");
      if (!draft.slug.trim()) throw new Error("El slug es obligatorio.");
      if (
        Number.isNaN(startsAt.getTime()) ||
        Number.isNaN(endsAt.getTime()) ||
        endsAt <= startsAt
      ) {
        throw new Error("El rango de fechas no es válido.");
      }
      const selectedProducts = Object.entries(draft.products).filter(
        ([, weight]) => Number(weight) > 0,
      );
      if (selectedProducts.length === 0)
        throw new Error("Selecciona al menos un producto para la caja.");
      const payload = {
        ...(draft.id ? { id: draft.id } : {}),
        name: draft.name.trim(),
        slug: slugify(draft.slug),
        theme_key: draft.themeKey.trim() || "fiestas_patrias",
        accent_color: /^#[0-9a-f]{6}$/i.test(draft.accentColor) ? draft.accentColor : null,
        accent_color_2: /^#[0-9a-f]{6}$/i.test(draft.accentColor2) ? draft.accentColor2 : null,
        icon_key: draft.iconKey.trim() || "gift",
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        is_active: draft.isActive,
        banner_title: draft.bannerTitle.trim(),
        banner_subtitle: draft.bannerSubtitle.trim() || null,
        draw_limit: Math.min(3, Math.max(1, Math.floor(Number(draft.boxLimit) || 3))),
      };
      const rows = selectedProducts.map(([productId, weight]) => ({
        product_id: productId,
        weight: Math.max(1, Math.floor(Number(weight))),
      }));
      const { data: saved, error } = await supabase.rpc("save_festive_event", {
        p_event: payload,
        p_products: rows,
      });
      if (error) throw new Error(error.message);
      if (!saved) throw new Error("Supabase no devolvió el evento guardado.");
      return saved;
    },
    onSuccess: () => {
      toast.success("Evento festivo guardado.");
      setForm(null);
      void queryClient.invalidateQueries({ queryKey: ["admin-festive-events"] });
      void queryClient.invalidateQueries({ queryKey: ["active-festive-event"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el evento."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.rpc("delete_festive_event", { p_event_id: eventId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Evento eliminado.");
      void queryClient.invalidateQueries({ queryKey: ["admin-festive-events"] });
      void queryClient.invalidateQueries({ queryKey: ["active-festive-event"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el evento."),
  });

  const selectedCount = useMemo(
    () => Object.values(form?.products ?? {}).filter((weight) => weight > 0).length,
    [form?.products],
  );

  return (
    <AdminLayout
      title="Eventos Festivos"
      subtitle="Configura banners y cajas sorpresa reutilizables para cualquier festividad"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-white/55">
          Los eventos activos aparecen automáticamente en la landing cuando están dentro de su rango
          de fechas.
        </p>
        <button
          type="button"
          onClick={() => setForm(defaultForm())}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Nuevo evento
        </button>
      </div>

      <div className="mt-6 flex gap-2 rounded-xl border border-white/10 bg-white/[0.025] p-1">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "config"}
          onClick={() => setActiveView("config")}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-semibold transition",
            activeView === "config" ? "bg-primary text-white" : "text-white/55 hover:bg-white/5",
          )}
        >
          Configuración
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeView === "winners"}
          onClick={() => setActiveView("winners")}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition",
            activeView === "winners" ? "bg-primary text-white" : "text-white/55 hover:bg-white/5",
          )}
        >
          <Trophy className="h-4 w-4" /> Ganadores
        </button>
      </div>

      {activeView === "winners" ? (
        <div className="mt-6">
          <FestiveWinnersView events={eventsQuery.data ?? []} />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
            <div className="border-b border-white/10 px-5 py-4">
              <h2 className="font-bold text-white">Eventos creados</h2>
            </div>
            {eventsQuery.isLoading ? (
              <div className="p-8 text-center text-sm text-white/55">
                <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                Cargando eventos...
              </div>
            ) : eventsQuery.data?.length ? (
              <div className="divide-y divide-white/5">
                {eventsQuery.data.map((event) => {
                  const status = statusFor(event);
                  return (
                    <div
                      key={event.id}
                      className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          data-cmd-event={event.theme_key}
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--event-accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--event-accent)_14%,transparent)] text-[var(--event-accent-2)]"
                        >
                          <Gift className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-white">{event.name}</p>
                          <p className="truncate text-xs text-white/45">
                            {themeLabel(event.theme_key)} · termina{" "}
                            {new Date(event.ends_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                            status.className,
                          )}
                        >
                          {status.label}
                        </span>
                        <button
                          type="button"
                          onClick={() => void editEvent(event)}
                          className="rounded-lg p-2 text-white/45 hover:bg-white/5 hover:text-white"
                          aria-label={`Editar ${event.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Eliminar ${event.name}?`))
                              deleteMutation.mutate(event.id);
                          }}
                          className="rounded-lg p-2 text-white/45 hover:bg-white/5 hover:text-red-300"
                          aria-label={`Eliminar ${event.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-white/50">
                Todavía no hay eventos festivos.
              </div>
            )}
          </section>

          {form && (
            <section className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold text-white">
                    {form.id ? "Editar evento" : "Nuevo evento"}
                  </h2>
                  <p className="mt-1 text-xs text-white/45">
                    La caja utiliza pesos relativos y se sortea en Supabase.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(null)}
                  className="text-xs text-white/45 hover:text-white"
                >
                  Cerrar
                </button>
              </div>
              <form
                className="mt-5 space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  saveMutation.mutate(form);
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-xs font-bold uppercase tracking-wide text-white/55">
                    Festividad
                    <select
                      value={form.themeKey}
                      onChange={(event) => {
                        const preset = FESTIVE_THEME_PRESETS.find(
                          (item) => item.key === event.target.value,
                        );
                        setForm({
                          ...form,
                          themeKey: event.target.value,
                          name: preset?.label ?? form.name,
                          accentColor: preset?.accent ?? form.accentColor,
                          accentColor2: preset?.accent2 ?? form.accentColor2,
                          iconKey: preset?.icon ?? form.iconKey,
                        });
                      }}
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white"
                    >
                      {FESTIVE_THEME_PRESETS.map((theme) => (
                        <option key={theme.key} value={theme.key}>
                          {theme.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1.5 text-xs font-bold uppercase tracking-wide text-white/55">
                    Nombre interno
                    <input
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white"
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="space-y-1.5 text-xs font-bold uppercase tracking-wide text-white/55">
                    Color principal
                    <input
                      type="color"
                      value={
                        /^#[0-9a-f]{6}$/i.test(form.accentColor) ? form.accentColor : "#dc2626"
                      }
                      onChange={(event) => setForm({ ...form, accentColor: event.target.value })}
                      className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-background p-1"
                    />
                  </label>
                  <label className="space-y-1.5 text-xs font-bold uppercase tracking-wide text-white/55">
                    Color secundario
                    <input
                      type="color"
                      value={
                        /^#[0-9a-f]{6}$/i.test(form.accentColor2) ? form.accentColor2 : "#ffffff"
                      }
                      onChange={(event) => setForm({ ...form, accentColor2: event.target.value })}
                      className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-background p-1"
                    />
                  </label>
                  <label className="space-y-1.5 text-xs font-bold uppercase tracking-wide text-white/55">
                    Ícono
                    <select
                      value={form.iconKey}
                      onChange={(event) => setForm({ ...form, iconKey: event.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white"
                    >
                      <option value="gift">Regalo</option>
                      <option value="flag">Bandera</option>
                      <option value="ghost">Fantasma</option>
                      <option value="snowflake">Copo de nieve</option>
                      <option value="party">Fiesta</option>
                      <option value="sparkles">Destellos</option>
                    </select>
                  </label>
                </div>
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-white/65">
                  Precio fijo por caja: <strong className="text-white">S/ 3.00</strong> ·{" "}
                  <strong className="text-white">USD 0.88</strong>. Se pueden comprar cantidades
                  ilimitadas; el sorteo entrega como máximo 3 cajas, una por usuario.
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-xs font-bold uppercase tracking-wide text-white/55">
                    Slug
                    <input
                      value={form.slug}
                      onChange={(event) => setForm({ ...form, slug: event.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white"
                    />
                  </label>
                  <label className="space-y-1.5 text-xs font-bold uppercase tracking-wide text-white/55">
                    Límite del sorteo (máx. 3 ganadores)
                    <input
                      type="number"
                      min="1"
                      max="3"
                      value={form.boxLimit}
                      onChange={(event) => setForm({ ...form, boxLimit: event.target.value })}
                      placeholder="Sin límite"
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white"
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-xs font-bold uppercase tracking-wide text-white/55">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" /> Inicio
                    </span>
                    <input
                      type="datetime-local"
                      value={form.startsAt}
                      onChange={(event) => setForm({ ...form, startsAt: event.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white"
                    />
                  </label>
                  <label className="space-y-1.5 text-xs font-bold uppercase tracking-wide text-white/55">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" /> Fin
                    </span>
                    <input
                      type="datetime-local"
                      value={form.endsAt}
                      onChange={(event) => setForm({ ...form, endsAt: event.target.value })}
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white"
                    />
                  </label>
                </div>
                <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/10 p-3 text-sm text-white">
                  <span>
                    <span className="block font-semibold">Activar ahora</span>
                    <span className="block text-xs text-white/45">
                      La RPC seguirá validando las fechas antes de entregar premios.
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
                    className="h-5 w-5 accent-primary"
                  />
                </label>
                <label className="block space-y-1.5 text-xs font-bold uppercase tracking-wide text-white/55">
                  Título del banner
                  <input
                    value={form.bannerTitle}
                    onChange={(event) => setForm({ ...form, bannerTitle: event.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white"
                  />
                </label>
                <label className="block space-y-1.5 text-xs font-bold uppercase tracking-wide text-white/55">
                  Subtítulo
                  <textarea
                    value={form.bannerSubtitle}
                    onChange={(event) => setForm({ ...form, bannerSubtitle: event.target.value })}
                    rows={2}
                    className="mt-1.5 w-full resize-none rounded-lg border border-white/10 bg-background px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white"
                  />
                </label>
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wide text-white/55">
                      Productos de la caja
                    </span>
                    <span className="text-xs text-white/45">{selectedCount} seleccionados</span>
                  </div>
                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-white/10 p-3">
                    {productsQuery.data?.map((product) => {
                      const selected = Object.prototype.hasOwnProperty.call(
                        form.products,
                        product.id,
                      );
                      return (
                        <label
                          key={product.id}
                          className="flex items-center gap-3 rounded-lg border border-white/5 bg-black/10 p-2.5"
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(event) => {
                              const products = { ...form.products };
                              if (event.target.checked) products[product.id] = 1;
                              else delete products[product.id];
                              setForm({ ...form, products });
                            }}
                            className="h-4 w-4 accent-primary"
                          />
                          <span className="min-w-0 flex-1 truncate text-sm text-white">
                            {product.name}
                            <span className="ml-2 text-xs text-white/40">
                              S/ {Number(product.price).toFixed(2)}
                            </span>
                          </span>
                          {selected && (
                            <input
                              type="number"
                              min="1"
                              value={form.products[product.id]}
                              onChange={(event) =>
                                setForm({
                                  ...form,
                                  products: {
                                    ...form.products,
                                    [product.id]: Number(event.target.value),
                                  },
                                })
                              }
                              className="w-20 rounded-md border border-white/10 bg-background px-2 py-1.5 text-center text-sm text-white"
                              aria-label={`Peso de ${product.name}`}
                            />
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPreviewOpen((value) => !value)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-white/70 hover:bg-white/5"
                  >
                    <WandSparkles className="h-4 w-4" /> Vista previa
                  </button>
                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Guardar
                    evento
                  </button>
                </div>
              </form>
              {previewOpen && (
                <div
                  data-cmd-event={form.themeKey}
                  style={
                    {
                      "--event-accent": form.accentColor,
                      "--event-accent-2": form.accentColor2,
                    } as CSSProperties
                  }
                  className="cmd-festive-banner mt-5 rounded-2xl border border-[color-mix(in_srgb,var(--event-accent)_45%,transparent)] p-5"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--event-accent-2)]/75">
                    Vista previa
                  </p>
                  <h3 className="mt-2 text-xl font-black text-white">
                    {form.bannerTitle || "Título del evento"}
                  </h3>
                  <p className="mt-1 text-sm text-white/70">
                    {form.bannerSubtitle || "Subtítulo del banner"}
                  </p>
                  <p className="mt-3 text-xs text-white/55">Termina en 7d 00:00:00</p>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
