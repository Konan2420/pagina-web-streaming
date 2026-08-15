import { Bot, Gamepad2, Layers, MonitorSmartphone, Share2, Sparkles, Wallet } from "lucide-react";

const ITEMS = [
  {
    icon: Layers,
    title: "Un solo lugar",
    desc: "Series, cine, deportes y TV en vivo reunidos sin saltar entre apps ni recordar diez contraseñas.",
  },
  {
    icon: Bot,
    title: "Licencias de IA",
    desc: "Accede a las mejores herramientas de inteligencia artificial para potenciar tu productividad y creatividad.",
  },
  {
    icon: Gamepad2,
    title: "Recarga de juegos",
    desc: "Recargas instantáneas y seguras para tus juegos favoritos, todo desde un solo panel.",
  },
  {
    icon: Share2,
    title: "Redes Sociales",
    desc: "Mejora tu presencia digital con servicios especializados para todas tus plataformas sociales.",
  },
];

/** Value proposition grid. */
export function Features() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-red-accent">Por qué CMD</p>
          <h2 className="mt-4 font-display uppercase text-white">Entretenimiento sin fricción</h2>
          <p className="mt-4 text-white/75">
            Diseñamos el servicio para que la parte técnica desaparezca y solo quede lo importante:
            darle al play.
          </p>
        </div>

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 rounded-lg overflow-hidden">
          {ITEMS.map((it) => (
            <article
              key={it.title}
              className="bg-background p-7 hover:bg-white/[0.04] transition-colors"
            >
              <it.icon className="w-6 h-6 text-red-accent" aria-hidden="true" />
              <h3 className="mt-5 font-display uppercase text-xl text-white">{it.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/75">{it.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
