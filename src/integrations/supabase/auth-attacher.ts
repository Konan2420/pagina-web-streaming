import { createMiddleware } from "@tanstack/react-start";
import { hasPublicSupabaseConfig, supabase } from "./client";
import { withRequestTimeout } from "@/lib/request-timeout";

const REFRESH_WINDOW_MS = 60_000;

function isJwt(value: string | undefined): value is string {
  return Boolean(value && value.split(".").length === 3);
}

/**
 * Returns an access token that can be sent to a Server Function.
 *
 * Supabase persists both the access token and the refresh token in the browser.
 * `getSession()` can return the persisted access token while it is about to
 * expire, which created a race: a protected Server Function received the old
 * token and rejected it before the automatic refresh completed. Refresh here,
 * at the single request boundary, so every protected Server Function follows
 * the same rule.
 */
async function getUsableAccessToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;

  let session = data.session;
  const expiresAt = (session.expires_at ?? 0) * 1_000;
  const shouldRefresh =
    !isJwt(session.access_token) || !expiresAt || expiresAt <= Date.now() + REFRESH_WINDOW_MS;

  if (shouldRefresh) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error || !refreshed.data.session) return null;
    session = refreshed.data.session;
  }

  return isJwt(session.access_token) ? session.access_token : null;
}

// Must be registered as a global `functionMiddleware` in `src/start.ts`; otherwise
// the browser never attaches the bearer token to serverFn RPCs.
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    // The root loader obtains this public configuration through a Server
    // Function. That request happens before the browser has a Supabase client,
    // therefore it must not try to read a session or attach a token yet.
    // Subsequent Server Functions run after bootstrap and receive the token as
    // usual. This avoids a circular "configuration needed to request
    // configuration" failure.
    if (!hasPublicSupabaseConfig()) {
      return withRequestTimeout(next());
    }

    const token = await getUsableAccessToken();
    return withRequestTimeout(next({
      // Keep the standard header for compatibility with existing Server
      // Functions, and send the exact session token in a dedicated header.
      // Some dev/proxy layers can inject or replace `Authorization`; protected
      // functions read this dedicated value first so they always validate the
      // session obtained from Supabase in this browser.
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
            "x-supabase-access-token": token,
          }
        : {},
    }));
  },
);
