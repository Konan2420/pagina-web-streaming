import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { getConsent, setConsent } from "@/lib/consent";

/** Consent banner for analytics tracking. Shown until user makes a choice. */
export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getConsent() === null) setVisible(true);
  }, []);

  if (!visible) return null;

  const decide = (v: "granted" | "denied") => {
    setConsent(v);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Consentimiento de analítica"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 z-[60] max-w-md rounded-2xl glass-card border border-white/10 bg-background/90 p-4 sm:p-5 animate-fade-up"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full grid place-items-center gradient-violet shrink-0">
          <Cookie className="w-4 h-4 text-white" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">Tu privacidad</p>
          <p className="mt-1 text-xs text-white/70 leading-relaxed">
            Usamos analítica interna para entender cómo mejoras tu experiencia con CMD Streaming. No
            compartimos datos con terceros. Puedes cambiar tu decisión en cualquier momento.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => decide("granted")}
              className="inline-flex items-center justify-center px-4 py-2 rounded-full gradient-violet text-white text-xs font-semibold hover:scale-[1.03] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70"
            >
              Aceptar
            </button>
            <button
              type="button"
              onClick={() => decide("denied")}
              className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-white/15 bg-white/[0.03] text-white text-xs font-medium hover:border-white/30 hover:bg-white/[0.06] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70"
            >
              Rechazar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
