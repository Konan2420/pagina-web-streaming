import type { Tables } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

export type FestiveEvent = Tables<"festive_events">;
export type FestiveEventProduct = Tables<"festive_event_products">;
export type FestiveEventOpening = Tables<"festive_event_box_openings">;

export const festiveEventQueryKey = ["active-festive-event"] as const;

export const FESTIVE_THEME_PRESETS = [
  {
    key: "fiestas_patrias",
    label: "Fiestas Patrias",
    accent: "#dc2626",
    accent2: "#ffffff",
    icon: "flag",
  },
  { key: "halloween", label: "Halloween", accent: "#f97316", accent2: "#7c3aed", icon: "ghost" },
  { key: "navidad", label: "Navidad", accent: "#dc2626", accent2: "#16a34a", icon: "snowflake" },
  {
    key: "inocentes",
    label: "Día de los Inocentes",
    accent: "#ec4899",
    accent2: "#fbbf24",
    icon: "party",
  },
  { key: "ano_nuevo", label: "Año Nuevo", accent: "#fbbf24", accent2: "#0a0e1a", icon: "sparkles" },
] as const;

export async function fetchActiveFestiveEvent(): Promise<FestiveEvent | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("festive_events")
    .select("*")
    .eq("is_active", true)
    .lte("starts_at", now)
    .order("ends_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export function eventIsLive(event: FestiveEvent | null | undefined, now = Date.now()) {
  if (!event || !event.is_active) return false;
  const startsAt = Date.parse(event.starts_at);
  const endsAt = Date.parse(event.ends_at);
  return Number.isFinite(startsAt) && Number.isFinite(endsAt) && startsAt <= now && endsAt > now;
}

export function eventHasStarted(event: FestiveEvent | null | undefined, now = Date.now()) {
  if (!event || !event.is_active) return false;
  const startsAt = Date.parse(event.starts_at);
  return Number.isFinite(startsAt) && startsAt <= now;
}

export function eventHasEnded(event: FestiveEvent | null | undefined, now = Date.now()) {
  if (!event) return false;
  const endsAt = Date.parse(event.ends_at);
  return Number.isFinite(endsAt) && endsAt <= now;
}

export function formatCountdown(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(seconds / 86_400);
  const hours = Math.floor((seconds % 86_400) / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainingSeconds = seconds % 60;
  const clock = [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
  return days > 0 ? `${days}d ${clock}` : clock;
}

export function themeLabel(themeKey: string) {
  return FESTIVE_THEME_PRESETS.find((theme) => theme.key === themeKey)?.label ?? themeKey;
}
