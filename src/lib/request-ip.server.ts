import { getRequest } from "@tanstack/react-start/server";

/**
 * Obtiene la IP que Vercel entrega a una Server Function.
 * Nunca se lee desde el navegador: un encabezado escrito por el cliente no es
 * una fuente de confianza. En desarrollo puede no haber ninguna IP disponible.
 */
export function getTrustedRequestIp(): string | null {
  const headers = getRequest()?.headers;
  if (!headers) return null;

  const candidate =
    headers.get("x-vercel-forwarded-for") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip");

  if (!candidate) return null;
  const ip = candidate.trim();

  // IPv4 o IPv6. La conversión final a inet la hace Postgres; este filtro evita
  // enviar valores de encabezado arbitrarios a una consulta de moderación.
  if (!/^[0-9a-fA-F:.]+$/.test(ip)) return null;
  return ip;
}
