import { Flag, Gift, Ghost, PartyPopper, Snowflake, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type CSSProperties } from "react";
import {
  eventHasEnded,
  eventHasStarted,
  festiveEventQueryKey,
  fetchActiveFestiveEvent,
  formatCountdown,
} from "@/lib/festive-events";

export function FestiveEventBanner() {
  const [now, setNow] = useState(() => Date.now());
  const eventQuery = useQuery({
    queryKey: festiveEventQueryKey,
    queryFn: fetchActiveFestiveEvent,
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const event = eventQuery.data;
  if (!event || !eventHasStarted(event, now)) return null;
  const eventEnded = eventHasEnded(event, now);
  const EventIcon =
    event.icon_key === "ghost"
      ? Ghost
      : event.icon_key === "snowflake"
        ? Snowflake
        : event.icon_key === "flag"
          ? Flag
          : event.icon_key === "party"
            ? PartyPopper
            : event.icon_key === "sparkles"
              ? Sparkles
              : Gift;
  const eventStyle = {
    ...(event.accent_color ? { "--event-accent": event.accent_color } : {}),
    ...(event.accent_color_2 ? { "--event-accent-2": event.accent_color_2 } : {}),
  } as CSSProperties;

  return (
    <section
      data-cmd-event={event.theme_key}
      style={eventStyle}
      className="cmd-festive-banner mb-5 overflow-hidden rounded-2xl border border-[color-mix(in_srgb,var(--event-accent)_45%,transparent)]"
      aria-label={`Evento festivo: ${event.name}`}
    >
      <div className="cmd-festive-banner-glow" aria-hidden="true" />
      <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex min-w-0 items-start gap-4">
          <div className="cmd-festive-icon grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[color-mix(in_srgb,var(--event-accent-2)_35%,transparent)] bg-[color-mix(in_srgb,var(--event-accent-2)_14%,transparent)]">
            <EventIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--event-accent-2)]/75">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Evento especial
            </p>
            <h2 className="text-xl font-black text-white sm:text-2xl">{event.banner_title}</h2>
            {event.banner_subtitle && (
              <p className="mt-1 max-w-2xl text-sm text-white/70">{event.banner_subtitle}</p>
            )}
            <p className="mt-3 text-xs font-semibold text-white/65">
              {eventEnded ? (
                <span className="text-[var(--event-accent-2)]">
                  El evento terminó. Abre tu caja para conocer el resultado.
                </span>
              ) : (
                <>
                  Termina en{" "}
                  <span className="text-[var(--event-accent-2)]">
                    {formatCountdown(Date.parse(event.ends_at) - now)}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            document
              .getElementById("caja-sorpresa")
              ?.scrollIntoView({ behavior: "smooth", block: "center" })
          }
          className="cmd-festive-cta shrink-0 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white transition-transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-[var(--event-accent-2)]/70"
        >
          {eventEnded ? "Abrir mi caja" : "Ver ofertas del evento"}
        </button>
      </div>
    </section>
  );
}
