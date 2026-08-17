import {
  useCallback,
  useEffect,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { AuthModal } from "@/components/AuthModal";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";

const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[role="button"]',
  '[contenteditable="true"]',
].join(", ");

const LANDING_SHORTCUT_KEYS = new Set(["?", "/", "c", "1", "2", "3", "g", "h"]);

function isInsideAuthModal(target: EventTarget | null) {
  return (
    target instanceof Element && Boolean(target.closest('[aria-labelledby="auth-modal-title"]'))
  );
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(INTERACTIVE_SELECTOR));
}

/**
 * Requires a Supabase session for every interactive control rendered by the
 * root landing route while leaving the shared /tienda route unchanged.
 */
export function LandingAuthGate({ children }: { children: ReactNode }) {
  const session = useSupabaseSession();
  const [authOpen, setAuthOpen] = useState(false);

  const openLogin = useCallback(() => setAuthOpen(true), []);

  useEffect(() => {
    if (session) setAuthOpen(false);
  }, [session]);

  useEffect(() => {
    const blockLandingShortcut = (event: KeyboardEvent) => {
      if (session || isInsideAuthModal(event.target)) return;
      if (!LANDING_SHORTCUT_KEYS.has(event.key.toLowerCase())) return;

      event.preventDefault();
      event.stopPropagation();
      openLogin();
    };

    window.addEventListener("keydown", blockLandingShortcut, true);
    return () => window.removeEventListener("keydown", blockLandingShortcut, true);
  }, [openLogin, session]);

  const handleClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (session || isInsideAuthModal(event.target) || !isInteractiveTarget(event.target)) return;

    event.preventDefault();
    event.stopPropagation();
    openLogin();
  };

  const handleFocusCapture = (event: FocusEvent<HTMLDivElement>) => {
    if (session || isInsideAuthModal(event.target) || !isInteractiveTarget(event.target)) return;

    if (event.target instanceof HTMLElement) event.target.blur();
    openLogin();
  };

  return (
    <div onClickCapture={handleClickCapture} onFocusCapture={handleFocusCapture}>
      {children}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
