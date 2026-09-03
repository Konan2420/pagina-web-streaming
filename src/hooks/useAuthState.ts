import { useSyncExternalStore } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { withRequestTimeout } from "@/lib/request-timeout";
import { suspensionUrl } from "@/lib/suspension-client";

export type AccountRole = "admin" | "proveedor" | "distribuidor" | "user";
export type AuthStatus = "checking" | "authenticated" | "signed-out" | "error";

export type AuthSnapshot = {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  roles: readonly AccountRole[];
  error: Error | null;
  refreshedAt: number | null;
  lastEvent: string | null;
};

const signedOutSnapshot: AuthSnapshot = {
  status: "signed-out",
  session: null,
  user: null,
  roles: [],
  error: null,
  refreshedAt: null,
  lastEvent: null,
};

let snapshot: AuthSnapshot = { ...signedOutSnapshot, status: "checking" };
let initialized = false;
let refreshPromise: Promise<void> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let accessCheckTimer: ReturnType<typeof setInterval> | undefined;
let authSubscription: { unsubscribe: () => void } | null = null;
const listeners = new Set<() => void>();

function publish(next: AuthSnapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}

function roleList(rows: Array<{ role: string }> | null | undefined): AccountRole[] {
  const roles = new Set((rows ?? []).map((row) => row.role));
  return (["admin", "proveedor", "distribuidor", "user"] as const).filter((role) =>
    roles.has(role),
  );
}

async function enforceAccountAccess(session: Session): Promise<boolean> {
  const { getCurrentAccountAccess } = await import("@/lib/ban.functions");
  const access = await getCurrentAccountAccess();
  if (access.allowed) return true;

  await supabase.auth.signOut({ scope: "local" });
  publish({ ...signedOutSnapshot, lastEvent: "ACCOUNT_SUSPENDED" });
  if (typeof window !== "undefined" && window.location.pathname !== "/cuenta-suspendida") {
    window.location.replace(
      suspensionUrl({ type: access.block === "ip" ? "ip" : "account", endsAt: access.endsAt }),
    );
  }
  return false;
}

async function loadAuth(attempt = 0): Promise<void> {
  if (refreshPromise) return refreshPromise;

  publish({ ...snapshot, status: "checking", error: null });
  refreshPromise = (async () => {
    try {
      const { data, error } = await withRequestTimeout(supabase.auth.getSession());
      if (error) throw error;
      const session = data.session;
      if (!session) {
        publish(signedOutSnapshot);
        return;
      }

      if (!(await enforceAccountAccess(session))) return;

      const { data: rows, error: roleError } = await withRequestTimeout(
        supabase.from("user_roles").select("role").eq("user_id", session.user.id),
      );
      if (roleError) throw roleError;

      publish({
        status: "authenticated",
        session,
        user: session.user,
        roles: roleList(rows),
        error: null,
        refreshedAt: Date.now(),
        lastEvent: snapshot.lastEvent,
      });
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error("No se pudo validar la sesión.");
      // Un único reintento cubre una reconexión breve, sin dejar la interfaz
      // atrapada en un ciclo infinito cuando Supabase o la red no responden.
      if (attempt === 0) {
        retryTimer = setTimeout(() => {
          refreshPromise = null;
          void loadAuth(1);
        }, 1_500);
        return;
      }
      publish({ ...signedOutSnapshot, status: "error", error });
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function ensureStarted() {
  if (initialized) return;
  initialized = true;
  void loadAuth();
  accessCheckTimer = setInterval(() => void loadAuth(), 30_000);
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (retryTimer) clearTimeout(retryTimer);
    if (event === "SIGNED_OUT" || !session) {
      publish({ ...signedOutSnapshot, lastEvent: event });
      return;
    }
    publish({ ...snapshot, lastEvent: event });
    void loadAuth();
  });
  authSubscription = data.subscription;
}

function subscribe(listener: () => void) {
  ensureStarted();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return snapshot;
}

/** Estado único de sesión y roles para toda la aplicación cliente. */
export function useAuthState() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    ...state,
    isAdmin: state.roles.includes("admin"),
    isProvider: state.roles.includes("proveedor"),
    isDistributor: state.roles.includes("distribuidor"),
    retry: () => void loadAuth(),
  };
}

/** Útil para pruebas y limpieza controlada; no se usa en componentes. */
export function disposeAuthStateForTests() {
  if (retryTimer) clearTimeout(retryTimer);
  retryTimer = undefined;
  if (accessCheckTimer) clearInterval(accessCheckTimer);
  accessCheckTimer = undefined;
  authSubscription?.unsubscribe();
  authSubscription = null;
  initialized = false;
  refreshPromise = null;
  snapshot = { ...signedOutSnapshot, status: "checking" };
}
