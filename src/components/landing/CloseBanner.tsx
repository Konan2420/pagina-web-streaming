import { Link } from "@tanstack/react-router";
import { MessageCircle, UserPlus } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

/** Closing conversion band with contact anchor. */
export function CloseBanner({ onOpenAuth }: { onOpenAuth?: (mode?: "login" | "signup") => void }) {
  const track = useAnalytics();

  return (
    <section id="contacto" className="py-20 sm:py-28 scroll-mt-24 border-t border-white/10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.28em] text-red-accent">Empieza hoy</p>
        <h2 className="mt-4 font-display uppercase text-white">
          Tu próxima maratón empieza esta noche
        </h2>
        <p className="mt-4 text-white/75 mx-auto">
          Crea tu cuenta gratis, elige tu plan y recibe el acceso el mismo día. Si tienes dudas,
          hablamos contigo antes de comprar.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              track("cta_click", {
                eventName: "footer_create_account",
                metadata: { location: "close_banner" },
              });
              onOpenAuth?.("signup");
            }}
            className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-md bg-primary text-primary-foreground text-sm font-semibold uppercase tracking-wide hover:brightness-110 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <UserPlus className="w-4 h-4" aria-hidden="true" />
            Crear cuenta gratis
          </button>
          <Link
            to="/tienda"
            onClick={() =>
              track("cta_click", {
                eventName: "footer_store",
                metadata: { location: "close_banner" },
              })
            }
            className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-md border border-white/25 text-white text-sm font-semibold uppercase tracking-wide hover:bg-white/[0.08] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            Hablar con soporte
          </Link>
        </div>
      </div>
    </section>
  );
}
