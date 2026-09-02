import type { Tables } from "@/integrations/supabase/types";

export type SupportTicket = Tables<"tickets">;
export type TicketReply = Tables<"ticket_respuestas">;
export type TicketCategory = SupportTicket["categoria"];
export type TicketStatus = SupportTicket["estado"];

export const TICKET_CATEGORY_OPTIONS: Array<{ value: TicketCategory; label: string }> = [
  { value: "pago", label: "Pago" },
  { value: "producto_cuenta", label: "Producto/Cuenta" },
  { value: "cuenta_usuario", label: "Cuenta de usuario" },
  { value: "otro", label: "Otro" },
];

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  abierto: "Abierto",
  respondido: "Respondido",
  cerrado: "Cerrado",
};

export const TICKET_STATUS_STYLES: Record<TicketStatus, string> = {
  abierto: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  respondido: "border-sky-400/25 bg-sky-400/10 text-sky-200",
  cerrado: "border-white/15 bg-white/[0.05] text-white/50",
};

export function ticketCategoryLabel(category: TicketCategory): string {
  return TICKET_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ?? category;
}

export function formatTicketDate(value: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
