// Cliente Supabase propio del proyecto. Mantén las claves privadas solo en el servidor.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { RequestTimeoutError, UI_REQUEST_TIMEOUT_MS } from "@/lib/request-timeout";

export type PublicSupabaseConfig = {
  url: string;
  publishableKey: string;
};

let runtimeConfig: PublicSupabaseConfig | undefined;

function resolvePublicSupabaseConfig(): PublicSupabaseConfig | undefined {
  const url = runtimeConfig?.url || import.meta.env.VITE_SUPABASE_URL;
  const publishableKey =
    runtimeConfig?.publishableKey || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) return undefined;

  return { url, publishableKey };
}

/**
 * Indicates whether the browser can create the Supabase client without
 * triggering a configuration error. It is used by Server Function middleware
 * during the initial application bootstrap, before the root loader has
 * received the public configuration from the server.
 */
export function hasPublicSupabaseConfig(): boolean {
  return resolvePublicSupabaseConfig() !== undefined;
}

/**
 * Supplies the browser client with the public Supabase configuration resolved
 * by the SSR loader. The publishable key is designed to be used in browsers;
 * private service-role credentials are never accepted here.
 */
export function configurePublicSupabase(config: PublicSupabaseConfig): void {
  if (!config.url || !config.publishableKey) {
    throw new Error("La configuración pública de Supabase está incompleta.");
  }

  if (runtimeConfig?.url === config.url && runtimeConfig.publishableKey === config.publishableKey) {
    return;
  }

  runtimeConfig = config;
  _supabase = undefined;
}

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

    // Todo acceso HTTP de Supabase comparte un plazo finito. Así una red
    // cerrada no deja React Query ni la interfaz esperando indefinidamente.
    const controller = new AbortController();
    const requestSignal =
      init?.signal ||
      (typeof Request !== "undefined" && input instanceof Request ? input.signal : undefined);
    const abortFromCaller = () => controller.abort(requestSignal?.reason);
    if (requestSignal?.aborted) abortFromCaller();
    else requestSignal?.addEventListener("abort", abortFromCaller, { once: true });

    const timeout = setTimeout(
      () => controller.abort(new RequestTimeoutError(UI_REQUEST_TIMEOUT_MS)),
      UI_REQUEST_TIMEOUT_MS,
    );
    return fetch(input, { ...init, headers, signal: controller.signal }).finally(() => {
      clearTimeout(timeout);
      requestSignal?.removeEventListener("abort", abortFromCaller);
    });
  };
}

function createSupabaseClient() {
  // VITE_* is useful for a purely static/local build. In SSR deployments the
  // root loader provides the same public values at request time, so Vercel
  // does not need to bake environment values into the browser bundle.
  const config = resolvePublicSupabaseConfig();
  const SUPABASE_URL = config?.url;
  const SUPABASE_PUBLISHABLE_KEY = config?.publishableKey;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ["SUPABASE_PUBLISHABLE_KEY"] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Configura las variables de Supabase en .env.local o en tu proveedor de despliegue.`;
    throw new Error(message);
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: {
      fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
    },
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) _supabase = createSupabaseClient();
    return Reflect.get(_supabase, prop, receiver);
  },
});
