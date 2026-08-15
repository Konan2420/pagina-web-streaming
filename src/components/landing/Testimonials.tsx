import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Andrés M.",
    location: "Lima",
    product: "Netflix Premium 4K",
    quote: "Cancelé 4 suscripciones. Todo en uno, en 4K y sin cortes. Vale cada peso.",
    initials: "AM",
    gradient: "from-red-500 to-orange-500",
  },
  {
    name: "María G.",
    location: "Arequipa",
    product: "Combo Streaming Total",
    quote: "La activación fue en minutos. La atención por WhatsApp es excelente.",
    initials: "MG",
    gradient: "from-violet-500 to-fuchsia-500",
  },
  {
    name: "Jorge R.",
    location: "Trujillo",
    product: "Disney+ Anual",
    quote: "Mi familia entera lo usa. Mucho más barato que contratar por separado.",
    initials: "JR",
    gradient: "from-amber-500 to-red-500",
  },
  {
    name: "Lucía S.",
    location: "Cusco",
    product: "Spotify Premium",
    quote: "Perfecto para escuchar sin anuncios y en modo offline. Muy confiable.",
    initials: "LS",
    gradient: "from-rose-500 to-red-600",
  },
  {
    name: "Carlos D.",
    location: "Callao",
    product: "HBO Max Estándar",
    quote: "Las series nuevas se ven increíbles. Cero interrupciones en los estrenos.",
    initials: "CD",
    gradient: "from-purple-500 to-red-500",
  },
  {
    name: "Diana V.",
    location: "Chiclayo",
    product: "Prime Video",
    quote: "Perfil propio con envío Prime incluido. Un negocio redondo para mi casa.",
    initials: "DV",
    gradient: "from-pink-500 to-rose-500",
  },
];

/** Dedicated testimonials grid to strengthen conversion before pricing. */
export function Testimonials() {
  return (
    <section id="testimonios" className="py-20 sm:py-28 scroll-mt-24 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-red-accent">Testimonios</p>
          <h2 className="mt-4 font-display uppercase text-white">Lo que dicen nuestros clientes</h2>
          <p className="mt-4 text-white/75">
            Historias reales de personas que ya disfrutan de sus plataformas favoritas sin
            complicaciones.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <article
              key={t.name}
              className="relative rounded-lg border border-white/12 bg-white/[0.02] p-6 flex flex-col"
            >
              <Quote
                className="absolute top-4 right-4 w-6 h-6 text-red-accent/30"
                aria-hidden="true"
              />
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.gradient} ring-2 ring-background grid place-items-center text-sm font-bold text-white`}
                >
                  {t.initials}
                </div>
                <div>
                  <h3 className="font-display uppercase text-base text-white leading-tight">
                    {t.name}
                  </h3>
                  <p className="text-[11px] text-white/70">
                    {t.location} · {t.product}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-0.5" aria-label="Valoración 5 de 5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 fill-red-accent text-red-accent"
                    aria-hidden="true"
                  />
                ))}
              </div>

              <blockquote className="mt-4 text-sm text-white/85 leading-relaxed flex-1">
                “{t.quote}”
              </blockquote>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
