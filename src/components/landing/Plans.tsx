import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useAnalytics } from "@/hooks/useAnalytics";

const PLANS = [
  {
    name: "Esencial",
    price: 15,
    subtitle: "Netflix Premium 4K — 1 mes",
    desc: "Ideal para empezar con tu plataforma favorita.",
    perks: ["1 perfil propio", "Calidad 4K UHD", "Soporte por WhatsApp", "Activación el mismo día"],
    featured: false,
  },
  {
    name: "Familiar",
    price: 35,
    subtitle: "Combo Streaming Total — 1 mes",
    desc: "El más elegido: varias plataformas para toda la casa.",
    perks: [
      "3 plataformas premium",
      "Hasta 4 dispositivos",
      "Calidad 4K",
      "Soporte prioritario 24/7",
    ],
    featured: true,
  },
  {
    name: "Total",
    price: 55,
    subtitle: "Pack Familiar 5 Apps — 1 mes",
    desc: "Cine, series, deportes y TV en vivo sin límites.",
    perks: [
      "5 apps a tu elección",
      "Dispositivos ilimitados",
      "4K + HDR",
      "Atención personalizada",
    ],
    featured: false,
  },
];

/** Pricing cards with real soles and clear conversion CTAs. */
export function Plans() {
  const track = useAnalytics();

  return (
    <section id="planes" className="py-20 sm:py-28 scroll-mt-24 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-red-accent">Planes</p>
          <h2 className="mt-4 font-display uppercase text-white">Elige cómo quieres ver</h2>
          <p className="mt-4 text-white/75">
            Precios transparentes en soles. Sin permanencia, sin cargos ocultos. Activa hoy mismo.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {PLANS.map((p) => (
            <article
              key={p.name}
              className={`relative rounded-lg border p-7 flex flex-col ${
                p.featured ? "border-red-accent bg-white/[0.05]" : "border-white/12 bg-white/[0.02]"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-7 px-3 py-1 rounded-sm bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.2em]">
                  Más elegido
                </span>
              )}
              <h3 className="font-display uppercase text-2xl text-white">{p.name}</h3>
              <p className="mt-1 text-sm text-white/75">{p.subtitle}</p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-[15px] font-semibold text-white/70">S/</span>
                <span className="font-display text-5xl text-white tracking-tight">{p.price}</span>
                <span className="text-sm text-white/60">/mes</span>
              </div>

              <p className="mt-3 text-sm text-white/75">{p.desc}</p>

              <ul className="mt-6 space-y-2.5 flex-1">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2.5 text-sm text-white/80">
                    <Check className="w-4 h-4 mt-0.5 text-red-accent shrink-0" aria-hidden="true" />
                    {perk}
                  </li>
                ))}
              </ul>

              <Link
                to="/tienda"
                onClick={() =>
                  track("cta_click", {
                    eventName: "plan_select",
                    metadata: { plan: p.name, price: p.price },
                  })
                }
                className={`mt-7 inline-flex items-center justify-center px-5 py-3.5 rounded-md text-sm font-semibold uppercase tracking-wide transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  p.featured
                    ? "bg-primary text-primary-foreground hover:brightness-110"
                    : "border border-white/25 text-white hover:bg-white/[0.08]"
                }`}
              >
                Comprar este plan
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
