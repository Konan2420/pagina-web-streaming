import type { Tables } from "@/integrations/supabase/types";

export type Recarga = Tables<"recargas">;
export type RechargeMethod = Recarga["metodo"];
export type RechargeCurrency = Recarga["moneda"];
export type RechargeStatus = Recarga["estado"];

export const RECHARGE_METHODS: Array<{
  value: RechargeMethod;
  label: string;
  currency: RechargeCurrency;
}> = [
  { value: "lemon_cash", label: "Lemon Cash (QR)", currency: "PEN" },
  { value: "yape_plin", label: "Yape / Plin", currency: "PEN" },
  { value: "binance", label: "Binance Pay (USD)", currency: "USD" },
];

export const RECHARGE_STATUS_LABELS: Record<RechargeStatus, string> = {
  pendiente: "Pendiente",
  verificado: "Verificado",
  rechazado: "Rechazado",
};

export const RECHARGE_STATUS_STYLES: Record<RechargeStatus, string> = {
  pendiente: "border-amber-400/25 bg-amber-400/10 text-amber-200",
  verificado: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  rechazado: "border-red-400/25 bg-red-400/10 text-red-200",
};

export function rechargeMethodLabel(method: RechargeMethod): string {
  return RECHARGE_METHODS.find((item) => item.value === method)?.label ?? method;
}

export function formatRechargeAmount(amount: number, currency: RechargeCurrency): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatRechargeDate(value: string): string {
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
