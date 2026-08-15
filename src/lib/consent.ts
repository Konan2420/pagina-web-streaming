const KEY = "cmd_analytics_consent";

export type ConsentValue = "granted" | "denied";

type Listener = (v: ConsentValue | null) => void;
const listeners = new Set<Listener>();

export function getConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(v: ConsentValue) {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    // ignore
  }
  listeners.forEach((l) => l(v));
}

export function subscribeConsent(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function hasAnalyticsConsent(): boolean {
  return getConsent() === "granted";
}
