import { createServerFn } from "@tanstack/react-start";
import { deleteCookie, setCookie } from "@tanstack/react-start/server";
import { requireSupabaseSession } from "@/integrations/supabase/auth-middleware";
import { CATALOG_SESSION_COOKIE, catalogCookieIsSecure } from "@/lib/catalog-session.server";

/** Called after login and token refresh. The middleware validates the bearer token. */
export const syncCatalogSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseSession])
  .handler(async () => {
    // requireSupabaseSession has validated this exact bearer with Supabase Auth.
    const { getRequest } = await import("@tanstack/react-start/server");
    const request = getRequest();
    const bearer =
      request.headers.get("x-supabase-access-token") ||
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!bearer) throw new Error("No se recibió la sesión validada.");
    setCookie(CATALOG_SESSION_COOKIE, bearer, {
      httpOnly: true,
      secure: catalogCookieIsSecure(),
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
    });
    return { ok: true };
  });

export const clearCatalogSession = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(CATALOG_SESSION_COOKIE, {
    httpOnly: true,
    secure: catalogCookieIsSecure(),
    sameSite: "lax",
    path: "/",
  });
  return { ok: true };
});
