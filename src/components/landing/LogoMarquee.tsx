import { platforms } from "./data";

const NAMES = platforms.filter((p) => p.tone !== "more").map((p) => p.name);
const LOOP = [...NAMES, ...NAMES];

/** Continuous platform logo marquee — editorial trust strip. */
export function LogoMarquee() {
  return (
    <section
      aria-label="Plataformas incluidas"
      className="border-y border-white/10 bg-white/[0.02] py-6 overflow-hidden"
    >
      <p className="text-center text-[11px] uppercase tracking-[0.3em] text-white/55">
        Incluye contenido de
      </p>
      <div className="mt-5 relative">
        <div className="flex w-max animate-marquee gap-10 sm:gap-14 pr-10">
          {LOOP.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className="font-display uppercase tracking-wide text-lg sm:text-xl text-white/70 whitespace-nowrap"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
