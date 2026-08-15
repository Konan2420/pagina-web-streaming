import { Apple, Cast, Laptop, Monitor, Radio, Smartphone, Tv2 } from "lucide-react";

const STEPS = [
  {
    n: "01",
    title: "Crea tu cuenta",
    desc: "Un correo, una contraseña y listo. Menos de un minuto, sin tarjeta.",
  },
  {
    n: "02",
    title: "Elige tu plan",
    desc: "Selecciona la plataforma y duración que necesitas desde la tienda.",
  },
  {
    n: "03",
    title: "Recibe tu acceso",
    desc: "Activamos tu servicio y te enviamos los datos para empezar a ver.",
  },
];

const DEVICES = [
  { icon: Tv2, label: "Smart TV" },
  { icon: Smartphone, label: "Android" },
  { icon: Apple, label: "iOS" },
  { icon: Monitor, label: "Windows" },
  { icon: Laptop, label: "Mac" },
  { icon: Cast, label: "Fire TV" },
  { icon: Radio, label: "Enigma2" },
];

/** Three-step onboarding plus supported devices. */
export function HowItWorks() {
  return (
    <section id="dispositivos" className="py-20 sm:py-28 scroll-mt-24 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <p className="text-[11px] uppercase tracking-[0.28em] text-red-accent">Cómo funciona</p>
          <h2 className="mt-4 font-display uppercase text-white">De cero a ver en 3 pasos</h2>
          <p className="mt-4 text-white/75">
            Nada de configuraciones eternas. Nos encargamos de la parte aburrida para que solo
            tengas que elegir qué ver.
          </p>

          <div className="mt-10">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/55">Compatible con</p>
            <ul className="mt-4 flex flex-wrap gap-2.5">
              {DEVICES.map((d) => (
                <li
                  key={d.label}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md border border-white/12 bg-white/[0.04] text-sm text-white/80"
                >
                  <d.icon className="w-4 h-4 text-red-accent" aria-hidden="true" />
                  {d.label}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <ol className="lg:col-span-7 space-y-px bg-white/10 rounded-lg overflow-hidden">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="bg-background flex gap-6 p-7 hover:bg-white/[0.04] transition-colors"
            >
              <span className="font-display text-3xl sm:text-4xl text-red-accent leading-none">
                {s.n}
              </span>
              <div>
                <h3 className="font-display uppercase text-xl text-white">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/75">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
