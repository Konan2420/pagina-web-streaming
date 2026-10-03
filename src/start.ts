import { createStart, createMiddleware } from "@tanstack/react-start";
import { createCsrfMiddleware } from "@/middlewares/csrf";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const catalogAccessMiddleware = createMiddleware().server(async ({ next }) => {
  const { getRequest, setResponseHeader } = await import("@tanstack/react-start/server");
  const request = getRequest();
  const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
  const isPublicPage =
    path === "/acceso" ||
    path === "/politicas" ||
    path === "/cuenta-suspendida" ||
    path === "/reset-password" ||
    path === "/auth/callback" ||
    path.startsWith("/credenciales/");
  const isInfrastructure =
    path.startsWith("/api/") ||
    path.startsWith("/assets/") ||
    path.startsWith("/_") ||
    path === "/sitemap.xml" ||
    path === "/robots.txt" ||
    /\.[a-z0-9]{2,16}$/i.test(path);

  if (
    (request.method === "GET" || request.method === "HEAD") &&
    !isPublicPage &&
    !isInfrastructure
  ) {
    const { hasValidCatalogSession } = await import("@/lib/catalog-session.server");
    if (!(await hasValidCatalogSession())) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: new URL("/acceso", request.url).toString(),
          "Cache-Control": "no-store",
        },
      });
    }
    setResponseHeader("Cache-Control", "private, no-store");
  }

  return next();
});

function isRequestAbort(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  if (error.name === "AbortError" || error.message.toLowerCase() === "aborted") {
    return true;
  }

  const cause = error.cause;
  return (
    cause instanceof Error &&
    (cause.name === "AbortError" ||
      cause.message.toLowerCase() === "aborted" ||
      ("code" in cause && cause.code === "ECONNRESET"))
  );
}

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    // A navigation, reload, or closed tab can terminate an in-flight request.
    // The client is already gone, so swallow it instead of rethrowing: a
    // rethrow surfaces as an unhandled "Error: aborted" runtime error.
    if (isRequestAbort(error)) {
      return new Response(null, { status: 499 });
    }

    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [catalogAccessMiddleware, csrfMiddleware, errorMiddleware],
}));
