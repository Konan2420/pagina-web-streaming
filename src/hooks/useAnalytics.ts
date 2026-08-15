import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics.functions";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import type { Json } from "@/lib/analytics.functions";
import { hasAnalyticsConsent, subscribeConsent } from "@/lib/consent";

const SESSION_KEY = "cmd_analytics_session_id";

function getOrCreateSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return "unknown";
  }
}

function getCurrentPath(): string {
  return typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
}

function getReferrer(): string {
  return typeof document !== "undefined" ? document.referrer : "";
}

let currentUserId: string | null = null;

// Seed from the existing session so events fired before any auth change are attributed.
if (typeof window !== "undefined") {
  supabase.auth.getSession().then(({ data }) => {
    currentUserId = data.session?.user?.id ?? currentUserId;
  });
}

supabase.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_OUT") {
    currentUserId = null;
  } else {
    currentUserId = session?.user?.id ?? null;
  }
});

/** Send a single analytics event to the server. */
export function useAnalytics() {
  const sessionIdRef = useRef<string | null>(null);
  const track = useServerFn(trackEvent);

  const send = useCallback(
    (
      eventType: string,
      options: {
        eventName?: string;
        metadata?: Record<string, Json>;
        path?: string;
      } = {},
    ) => {
      if (!hasAnalyticsConsent()) return;
      if (!sessionIdRef.current) sessionIdRef.current = getOrCreateSessionId();
      track({
        data: {
          event_type: eventType,
          event_name: options.eventName ?? null,
          user_id: currentUserId,
          session_id: sessionIdRef.current,
          path: options.path ?? getCurrentPath(),
          referrer: getReferrer(),
          metadata: options.metadata ?? {},
        },
      }).catch(() => {
        // Silently ignore analytics failures to avoid breaking UX.
      });
    },
    [track],
  );

  return send;
}

/** Track a page view once per resolved navigation. */
export function usePageView() {
  const send = useAnalytics();
  const router = useRouter();
  const lastPath = useRef<string>("");

  useEffect(() => {
    const trackPath = () => {
      const path = getCurrentPath();
      if (!path || path === lastPath.current) return;
      lastPath.current = path;
      send("page_view", { eventName: "page_view", path });
    };
    trackPath();
    const unsub = router.subscribe("onResolved", trackPath);
    const unsubConsent = subscribeConsent((v) => {
      if (v === "granted") {
        lastPath.current = "";
        trackPath();
      }
    });
    return () => {
      unsub();
      unsubConsent();
    };
  }, [router, send]);
}
