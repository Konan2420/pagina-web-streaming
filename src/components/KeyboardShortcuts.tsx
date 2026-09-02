import { useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  X,
  Search,
  ShoppingCart,
  LayoutGrid,
  Package,
  User,
  Home,
  HelpCircle,
  Command,
  PlayCircle,
} from "lucide-react";

type Props = {
  onFocusSearch: () => void;
  onToggleCart: () => void;
  onGoPanel: (panel: "tienda" | "compras" | "perfil") => void;
  onGoHome: () => void;
  authed: boolean;
  onOpenTutorial?: () => void;
};

type Shortcut = {
  keys: string[];
  label: string;
  desc?: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
};

type Group = {
  title: string;
  items: Shortcut[];
};

const GROUPS: Group[] = [
  {
    title: "Navegación",
    items: [
      { keys: ["1"], label: "Ir a Tienda", desc: "Ver catálogo de productos", icon: LayoutGrid },
      {
        keys: ["2"],
        label: "Mis Compras",
        desc: "Historial de pedidos",
        icon: Package,
        requiresAuth: true,
      },
      { keys: ["3"], label: "Mi Perfil", desc: "Editar tus datos", icon: User, requiresAuth: true },
      { keys: ["G", "H"], label: "Ir al inicio", desc: "Volver a la landing", icon: Home },
    ],
  },
  {
    title: "Acciones",
    items: [
      { keys: ["/"], label: "Enfocar buscador", desc: "Buscar productos", icon: Search },
      { keys: ["C"], label: "Carrito", desc: "Abrir / cerrar el drawer", icon: ShoppingCart },
    ],
  },
  {
    title: "General",
    items: [
      { keys: ["?"], label: "Mostrar ayuda", desc: "Esta ventana", icon: HelpCircle },
      { keys: ["Esc"], label: "Cerrar", desc: "Cierra modales, drawers y ayuda", icon: X },
    ],
  },
];

function isEditable(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center text-[11px] font-mono font-semibold px-2 py-1 min-w-[28px] h-7 rounded-md bg-gradient-to-b from-white/[0.09] to-white/[0.04] border border-white/15 text-white">
      {children}
    </kbd>
  );
}

export function KeyboardShortcuts({
  onFocusSearch,
  onToggleCart,
  onGoPanel,
  onGoHome,
  authed,
  onOpenTutorial,
}: Props) {
  const [helpOpen, setHelpOpen] = useState(false);
  const [query, setQuery] = useState("");
  const gPressed = useRef<number | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && helpOpen) {
        setHelpOpen(false);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isEditable(e.target)) return;

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }

      if (e.key.toLowerCase() === "g") {
        gPressed.current = Date.now();
        return;
      }
      if (e.key.toLowerCase() === "h" && gPressed.current && Date.now() - gPressed.current < 1000) {
        gPressed.current = null;
        e.preventDefault();
        onGoHome();
        return;
      }
      gPressed.current = null;

      switch (e.key) {
        case "/":
          e.preventDefault();
          onFocusSearch();
          break;
        case "c":
        case "C":
          e.preventDefault();
          onToggleCart();
          break;
        case "1":
          e.preventDefault();
          onGoPanel("tienda");
          break;
        case "2":
          if (authed) {
            e.preventDefault();
            onGoPanel("compras");
          }
          break;
        case "3":
          if (authed) {
            e.preventDefault();
            onGoPanel("perfil");
          }
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [helpOpen, authed, onFocusSearch, onToggleCart, onGoPanel, onGoHome]);

  // Modal open lifecycle: lock scroll, focus search, restore focus on close
  useEffect(() => {
    if (!helpOpen) return;
    lastFocused.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => searchRef.current?.focus(), 40);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
      lastFocused.current?.focus?.();
    };
  }, [helpOpen]);

  // Simple focus trap
  useEffect(() => {
    if (!helpOpen) return;
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onTab);
    return () => window.removeEventListener("keydown", onTab);
  }, [helpOpen]);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((it) => {
        if (it.requiresAuth && !authed) return false;
        if (!q) return true;
        return (
          it.label.toLowerCase().includes(q) ||
          it.desc?.toLowerCase().includes(q) ||
          it.keys.join(" ").toLowerCase().includes(q)
        );
      }),
    })).filter((g) => g.items.length > 0);
  }, [query, authed]);

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setHelpOpen(true)}
        aria-label="Mostrar atajos de teclado"
        title="Atajos de teclado (?)"
        className="fixed bottom-4 left-4 z-40 hidden sm:inline-flex items-center gap-2 h-11 px-3 rounded-full bg-white/[0.04] border border-white/10 text-white/70 hover:text-white hover:border-red-600/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/60"
      >
        <Keyboard className="w-4 h-4" />
        <kbd className="text-xs font-mono px-1.5 py-0.5 rounded bg-white/10 border border-white/10">
          ?
        </kbd>
      </button>

      {/* Help modal */}
      {helpOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="kbd-help-title"
          aria-describedby="kbd-help-desc"
          className="fixed inset-0 z-[70] grid place-items-center p-4 animate-in fade-in duration-150"
          onClick={() => setHelpOpen(false)}
        >
          <div className="absolute inset-0 bg-black/75" />
          <div
            ref={dialogRef}
            className="relative flex w-full max-w-xl max-h-[calc(100dvh-2rem)] flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-[#120a15]/98 to-[#0a060c]/98 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-4 p-5 sm:p-6 border-b border-white/5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-xl grid place-items-center bg-red-600-600/30">
                  <Command className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h2
                    id="kbd-help-title"
                    className="font-display text-xl sm:text-2xl text-white uppercase tracking-wide leading-none"
                  >
                    Atajos de teclado
                  </h2>
                  <p id="kbd-help-desc" className="text-xs text-white/70 mt-1">
                    Navega más rápido usando el teclado
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHelpOpen(false)}
                aria-label="Cerrar ayuda"
                className="w-9 h-9 shrink-0 grid place-items-center rounded-lg text-white/78 hover:text-white hover:bg-white/5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 sm:px-6 pt-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/62 pointer-events-none" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar atajo..."
                  aria-label="Buscar atajo"
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/58 focus:outline-none focus:border-red-600/50 focus:bg-white/[0.06] transition"
                />
              </div>
            </div>

            {/* Groups */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-5">
              {filteredGroups.length === 0 ? (
                <div className="text-center py-10 text-sm text-white/62">
                  No se encontraron atajos para "{query}".
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <section key={group.title}>
                    <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/62 mb-2 px-1">
                      {group.title}
                    </h3>
                    <ul className="rounded-xl border border-white/[0.06] bg-white/[0.015] divide-y divide-white/[0.05] overflow-hidden">
                      {group.items.map((s) => {
                        const Icon = s.icon;
                        return (
                          <li
                            key={s.label}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.025] transition"
                          >
                            <div className="w-8 h-8 shrink-0 rounded-lg grid place-items-center bg-white/[0.04] border border-white/[0.06] text-red-600">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-white/90 font-medium leading-tight">
                                {s.label}
                              </div>
                              {s.desc && (
                                <div className="text-xs text-white/66 mt-0.5 leading-tight truncate">
                                  {s.desc}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {s.keys.map((k, i) => (
                                <div key={i} className="flex items-center gap-1">
                                  {i > 0 && (
                                    <span className="text-[10px] text-white/74 font-mono">
                                      luego
                                    </span>
                                  )}
                                  <Kbd>{k}</Kbd>
                                </div>
                              ))}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-t border-white/5 bg-white/[0.015] flex-wrap">
              <p className="text-[11px] text-white/62 leading-tight flex-1 min-w-0">
                Los atajos se ignoran mientras escribes en un campo de texto.
              </p>
              <div className="flex items-center gap-2 shrink-0">
                {onOpenTutorial && (
                  <button
                    type="button"
                    onClick={() => {
                      setHelpOpen(false);
                      onOpenTutorial();
                    }}
                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full gradient-violet text-white text-[11px] font-semibold hover:scale-[1.03] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    Ver tutorial
                  </button>
                )}
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-white/62">
                  <Kbd>Esc</Kbd>
                  <span>cerrar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
