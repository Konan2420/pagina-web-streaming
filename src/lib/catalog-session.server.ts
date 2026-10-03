import { getCookie, getRequest } from "@tanstack/react-start/server";

export const CATALOG_SESSION_COOKIE = "cmd_catalog_session";

/** Only Supabase Auth can validate this cookie. Never trust its contents alone. */
export async function hasValidCatalogSession(): Promise<boolean> {
  const token = getCookie(CATALOG_SESSION_COOKIE);
  if (!token) return false;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    return !error && Boolean(data.user);
  } catch {
    return false;
  }
}

export function catalogCookieIsSecure(): boolean {
  const request = getRequest();
  return (
    request.headers.get("x-forwarded-proto")?.split(",")[0].trim() === "https" ||
    new URL(request.url).protocol === "https:"
  );
}
