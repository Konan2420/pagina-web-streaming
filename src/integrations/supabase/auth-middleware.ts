// Cliente Supabase propio del proyecto. Mantén las claves privadas solo en el servidor.
import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { useRuntimeConfig } from "nitro/runtime-config";
import type { Database } from "./types";

type AuthenticatedRequestContext = {
  supabase: ReturnType<typeof createClient<Database>>;
  userId: string;
  claims: { sub: string };
};

function isNewSupabaseApiKey(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => headers.set(key, value));
    }

    // New Supabase API keys are opaque strings, not bearer JWTs.
    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);
    return fetch(input, { ...init, headers });
  };
}

async function authenticateRequest(): Promise<AuthenticatedRequestContext> {
    const config = useRuntimeConfig();
    const SUPABASE_URL =
      config.supabaseUrl || process.env.NITRO_SUPABASE_URL || process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY =
      config.supabasePublishableKey ||
      process.env.NITRO_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      const missing = [
        ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
        ...(!SUPABASE_PUBLISHABLE_KEY ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
      ];
      const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Configura las variables de Supabase en .env.local o en tu proveedor de despliegue.`;
      throw new Error(message);
    }

    const request = getRequest();

    if (!request?.headers) {
      throw new Error("Unauthorized: No request headers available");
    }

    // Prefer the token supplied by the browser authentication middleware.
    // It avoids collisions with proxy/framework `Authorization` headers while
    // retaining the standard Bearer fallback for direct API consumers.
    const attachedToken = request.headers.get("x-supabase-access-token")?.trim();
    const authHeader = request.headers.get("authorization")?.trim();
    const bearerMatch = authHeader ? /^Bearer\s+(.+)$/i.exec(authHeader) : null;
    const token = attachedToken || bearerMatch?.[1].trim();

    if (!token) {
      throw new Error("Unauthorized: No valid session token was provided");
    }

    if (token.split(".").length !== 3) {
      throw new Error("Unauthorized: Invalid token");
    }

    const supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_PUBLISHABLE_KEY!, {
      global: {
        fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY!),
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        storage: undefined,
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // `getClaims` relies on local/JWKS claim verification and can reject a
    // freshly refreshed Supabase access token in some Nitro runtimes. Ask
    // Supabase Auth to validate this exact token instead. This remains a
    // server-side, fail-closed authentication check; a user id is accepted
    // only when Auth returns the authenticated user.
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      throw new Error("Unauthorized: Invalid token");
    }

  return {
    supabase,
    userId: data.user.id,
    claims: { sub: data.user.id },
  };
}

/** Sesión válida, sin aplicar aún el bloqueo de cuenta. Solo se usa para
 * consultar el estado propio y poder cerrar la sesión con un mensaje claro. */
export const requireSupabaseSession = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const context = await authenticateRequest();
    return next({ context });
  },
);

/**
 * Middleware central de las Server Functions protegidas. Una cuenta o red
 * suspendida no llega nunca al handler de negocio, incluso con una llamada
 * manual a la API.
 */
export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const context = await authenticateRequest();
    const { getAccountAccess, toSuspensionError } = await import("@/lib/ban.server");
    const access = await getAccountAccess(context.userId);
    if (!access.allowed) throw toSuspensionError(access);
    return next({ context });
  },
);
