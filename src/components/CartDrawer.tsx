import { useEffect, useRef } from "react";
import { X, Minus, Plus, Trash2, ShoppingCart, ShoppingBag, Store, Loader2 } from "lucide-react";
import { cartStore, useCart, type CartItem } from "@/lib/cart-store";
import { useAnalytics } from "@/hooks/useAnalytics";

const FOCUSABLE =
  'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function CartDrawer({
  open,
  onClose,
  onCheckout,
  checkoutPending = false,
}: {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  checkoutPending?: boolean;
}) {
  const { items, count, total } = useCart();
  const drawerRef = useRef<HTMLElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);
  const track = useAnalytics();

  useEffect(() => {
    if (!open) return;

    restoreRef.current = document.activeElement as HTMLElement | null;

    const getFocusable = () => {
      const root = drawerRef.current;
      if (!root) return [] as HTMLElement[];
      return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute("disabled") && el.offsetParent !== null,
      );
    };

    // Move focus into the drawer
    const t = window.setTimeout(() => {
      const items = getFocusable();
      (items[0] ?? drawerRef.current)?.focus();
    }, 0);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusables = getFocusable();
      if (focusables.length === 0) {
        e.preventDefault();
        drawerRef.current?.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      const inside = drawerRef.current?.contains(active ?? null);
      if (e.shiftKey) {
        if (!inside || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (!inside || active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  function handleClear() {
    if (items.length === 0) return;
    if (window.confirm("¿Vaciar todo el carrito?")) cartStore.clear();
  }

  return (
    <div
      className={`fixed inset-0 z-[60] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
      inert={!open}
    >
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        ref={drawerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        className={`absolute top-0 right-0 h-full w-full sm:max-w-md bg-card border-l border-border flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl gradient-violet grid place-items-center"
              aria-hidden="true"
            >
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 id="cart-drawer-title" className="font-display text-lg text-white leading-none">
                Tu Carrito
              </h2>
              <p className="text-[11px] text-white/70 mt-1">
                {count} {count === 1 ? "producto" : "productos"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar carrito"
            className="w-11 h-11 rounded-full bg-white/5 border border-white/10 grid place-items-center text-white hover:border-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70"
          >
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="h-full grid place-items-center px-6 py-16 text-center">
              <div>
                <div className="w-20 h-20 mx-auto rounded-2xl bg-white/[0.04] border border-white/10 grid place-items-center mb-4">
                  <ShoppingCart className="w-9 h-9 text-white/62" />
                </div>
                <p className="text-sm text-white/70 mb-1">Tu carrito está vacío</p>
                <p className="text-xs text-white/62 mb-5">Agrega productos desde el catálogo.</p>
                <button
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full gradient-violet text-primary-foreground text-xs font-bold hover:scale-[1.03] transition"
                >
                  <Store className="w-4 h-4" /> Ver tienda
                </button>
              </div>
            </div>
          ) : (
            <ul className="p-4 space-y-3">
              {items.map((it) => (
                <li
                  key={it.id}
                  className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 flex gap-3"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/50 via-violet/40 to-background grid place-items-center shrink-0">
                    <Store className="w-6 h-6 text-white/90" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-white leading-snug line-clamp-2">
                        {it.name}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          track("remove_from_cart", {
                            eventName: "remove_from_cart",
                            metadata: {
                              productId: it.id,
                              productName: it.name,
                              price: it.price,
                              quantity: it.quantity,
                            },
                          });
                          cartStore.remove(it.id);
                        }}
                        aria-label={`Eliminar ${it.name} del carrito`}
                        className="shrink-0 w-11 h-11 rounded-lg bg-red-500/10 border border-red-500/30 grid place-items-center text-red-300 hover:bg-red-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70 transition"
                      >
                        <Trash2 aria-hidden="true" className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div
                        className="inline-flex items-center gap-1 bg-white/5 border border-white/10 rounded-full p-1"
                        role="group"
                        aria-label={`Cantidad de ${it.name}`}
                      >
                        <button
                          type="button"
                          onClick={() => cartStore.decrement(it.id)}
                          aria-label={`Disminuir cantidad de ${it.name}`}
                          className="grid h-11 w-11 place-items-center rounded-full text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70 sm:h-9 sm:w-9"
                        >
                          <Minus aria-hidden="true" className="w-3.5 h-3.5" />
                        </button>
                        <span
                          aria-live="polite"
                          className="min-w-[28px] text-center text-sm font-bold text-white tabular-nums"
                        >
                          {it.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => cartStore.increment(it.id)}
                          aria-label={`Aumentar cantidad de ${it.name}`}
                          className="grid h-11 w-11 place-items-center rounded-full text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-2/70 sm:h-9 sm:w-9"
                        >
                          <Plus aria-hidden="true" className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <span
                        className="font-display text-base text-gradient-violet"
                        aria-label={`Subtotal ${(it.price * it.quantity).toFixed(2)} soles`}
                      >
                        S/ {(it.price * it.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <footer className="border-t border-border p-4 bg-card/95 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-white/80">Total</span>
              <span className="font-display text-2xl text-gradient-violet" aria-live="polite">
                S/ {total.toFixed(2)}
              </span>
            </div>
            <button
              type="button"
              disabled={checkoutPending}
              onClick={() => {
                if (checkoutPending) return;
                track("begin_checkout", {
                  eventName: "begin_checkout",
                  metadata: { value: total, itemCount: items.length },
                });
                onCheckout();
              }}
              className="w-full inline-flex items-center justify-center gap-2 min-h-12 py-3 rounded-xl gradient-violet text-primary-foreground text-sm font-bold hover:scale-[1.01] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {checkoutPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Registrando pedido...
                </>
              ) : (
                "Finalizar Compra"
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                track("remove_from_cart", {
                  eventName: "clear_cart",
                  metadata: { itemCount: items.length, value: total },
                });
                handleClear();
              }}
              className="w-full inline-flex items-center justify-center gap-2 min-h-11 py-2.5 rounded-xl bg-transparent border border-white/20 text-white/85 text-xs font-semibold hover:border-red-500/60 hover:text-red-300 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/70"
            >
              <Trash2 aria-hidden="true" className="w-3.5 h-3.5" /> Vaciar Carrito
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}
