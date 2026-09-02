import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Command,
  Home,
  HelpCircle,
  LayoutGrid,
  Search,
  ShoppingCart,
  Sparkles,
  X,
} from "lucide-react";

const STORAGE_KEY = "cmd:kbd-tutorial-done";

type Step = {
  title: string;
  desc: string;
  keys: string[];
  icon: React.ComponentType<{ className?: string }>;
  tip?: string;
};

const STEPS: Step[] = [
  {
    title: "Atajos de teclado",
    desc: "CMD Streaming se puede controlar sin salir del teclado. En 30 segundos aprendes los atajos esenciales.",
    keys: [],
    icon: Sparkles,
    tip: "Puedes cerrar y retomar cuando quieras.",
  },
  {
    title: "Buscar productos",
    desc: "Pulsa la barra diagonal para saltar directamente al buscador de la tienda.",
    keys: ["/"],
    icon: Search,
    tip: "Funciona desde cualquier parte del panel.",
  },
  {
    title: "Abrir el carrito",
    desc: "Presiona C para abrir o cerrar el drawer del carrito sin usar el mouse.",
    keys: ["C"],
    icon: ShoppingCart,
    tip: "Vuelve a pulsar C para cerrarlo.",
  },
  {
    title: "Cambiar de panel",
    desc: "Usa los números para saltar entre Tienda, Mis Compras y Mi Perfil.",
    keys: ["1", "2", "3"],
    icon: LayoutGrid,
    tip: "2 y 3 requieren sesión iniciada.",
  },
  {
    title: "Volver al inicio",
    desc: "Pulsa G y luego H para regresar a la landing principal.",
    keys: ["G", "H"],
    icon: Home,
    tip: "Es una secuencia: presiona G, después H.",
  },
  {
    title: "Ayuda a mano",
    desc: "Con ? abres el buscador de todos los atajos disponibles.",
    keys: ["?"],
    icon: HelpCircle,
    tip: "Esc cierra cualquier modal o drawer.",
  },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center text-sm font-mono font-semibold px-2.5 py-1.5 min-w-[36px] h-9 rounded-lg bg-gradient-to-b from-white/[0.12] to-white/[0.04] border border-white/20 text-white">
      {children}
    </kbd>
  );
}

/** Onboarding walkthrough for keyboard shortcuts. */
export function KeyboardTutorial({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  const total = STEPS.length;
  const current = STEPS[step];
  const isLast = step === total - 1;
  const Icon = current?.icon ?? Sparkles;

  // Reset when reopened
  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  // Lock scroll + restore focus
  useEffect(() => {
    if (!open) return;
    lastFocused.current = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => dialogRef.current?.focus(), 40);
    return () => {
      document.body.style.overflow = prev;
      window.clearTimeout(t);
      lastFocused.current?.focus?.();
    };
  }, [open]);

  // Keyboard controls
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish(false);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        next();
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step]);

  function next() {
    if (isLast) finish(true);
    else setStep((s) => Math.min(total - 1, s + 1));
  }
  function prev() {
    setStep((s) => Math.max(0, s - 1));
  }
  function finish(completed: boolean) {
    if (completed) {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    onClose();
  }

  if (!open || !current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kbd-tut-title"
      className="fixed inset-0 z-[80] grid place-items-center p-4 animate-in fade-in duration-150"
      onClick={() => finish(false)}
    >
      <div className="absolute inset-0 bg-black/80" />
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-2xl border border-white/10 bg-gradient-to-b from-[#120a15]/98 to-[#0a060c]/98 animate-in zoom-in-95 duration-200 focus:outline-none"
      >
        {/* Progress bar */}
        <div className="h-1 w-full rounded-t-2xl bg-white/[0.04] overflow-hidden">
          <div
            className="h-full gradient-violet transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 pt-5">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
            <Command className="w-3.5 h-3.5 text-red-accent" />
            Tutorial
            <span className="text-white/74">·</span>
            <span className="text-white/70">
              {step + 1} / {total}
            </span>
          </div>
          <button
            type="button"
            onClick={() => finish(false)}
            aria-label="Cerrar tutorial"
            className="w-8 h-8 grid place-items-center rounded-lg text-white/70 hover:text-white hover:bg-white/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-accent/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 pt-6 pb-2">
          <div className="w-14 h-14 rounded-2xl grid place-items-center gradient-violet mb-4">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <h2
            id="kbd-tut-title"
            className="font-display text-2xl sm:text-3xl text-white uppercase tracking-wide leading-tight"
          >
            {current.title}
          </h2>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">{current.desc}</p>

          {current.keys.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {current.keys.map((k, i) => (
                <div key={i} className="flex items-center gap-2">
                  {i > 0 && (
                    <span className="text-[11px] uppercase tracking-wider text-white/62 font-semibold">
                      luego
                    </span>
                  )}
                  <Kbd>{k}</Kbd>
                </div>
              ))}
            </div>
          )}

          {current.tip && (
            <p className="mt-4 text-xs text-white/70 border-l-2 border-red-accent/60 pl-3 leading-relaxed">
              {current.tip}
            </p>
          )}
        </div>

        {/* Step dots */}
        <div className="flex items-center justify-center gap-1.5 py-4">
          {STEPS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setStep(i)}
              aria-label={`Ir al paso ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? "w-6 bg-red-accent"
                  : i < step
                    ? "w-1.5 bg-white/50"
                    : "w-1.5 bg-white/15"
              }`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={() => finish(false)}
            className="text-xs text-white/70 hover:text-white/80 transition px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          >
            Saltar
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={prev}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-full border border-white/10 bg-white/[0.03] text-sm text-white/80 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:hover:border-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-accent/60"
            >
              <ArrowLeft className="w-4 h-4" />
              Anterior
            </button>
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full gradient-violet text-white text-sm font-semibold hover:scale-[1.03] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {isLast ? (
                <>
                  <Check className="w-4 h-4" />
                  Entendido
                </>
              ) : (
                <>
                  Siguiente
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Re-exported so consumers (e.g. help modal) can re-launch the tutorial.
export { STORAGE_KEY as KBD_TUTORIAL_STORAGE_KEY };
