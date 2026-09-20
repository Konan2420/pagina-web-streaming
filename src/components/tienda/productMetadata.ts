export type DeliveryType = "manual" | "completa" | "perfil";
export type ScopeType = "global" | "pais_especifico";

export const COUNTRY_OPTIONS = [
  ["PE", "Perú"],
  ["MX", "México"],
  ["CO", "Colombia"],
  ["CL", "Chile"],
  ["AR", "Argentina"],
  ["EC", "Ecuador"],
  ["BO", "Bolivia"],
  ["BR", "Brasil"],
  ["US", "Estados Unidos"],
  ["ES", "España"],
] as const;

export function toDeliveryType(value: string | null | undefined): DeliveryType | null {
  return value === "manual" || value === "completa" || value === "perfil" ? value : null;
}

export function toScopeType(value: string | null | undefined): ScopeType | null {
  return value === "global" || value === "pais_especifico" ? value : null;
}

export function countryLabel(code: string | null | undefined) {
  return COUNTRY_OPTIONS.find(([value]) => value === code)?.[1] ?? code ?? "País específico";
}

export function countryFlag(code: string | null | undefined) {
  if (!code || code.length !== 2) return "🌐";
  return String.fromCodePoint(...code.toUpperCase().split("").map((char) => 127397 + char.charCodeAt(0)));
}
