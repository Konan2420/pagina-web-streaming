import { createStart, createMiddleware } from "@tanstack/react-start";
import { createCsrfMiddleware } from "@/middlewares/csrf";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

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
  requestMiddleware: [csrfMiddleware, errorMiddleware],
}));
