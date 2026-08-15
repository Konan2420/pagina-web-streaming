import { Film, Headphones, ShieldCheck, Tv, Zap } from "lucide-react";
import { useCountUp } from "@/hooks/useCountUp";
import { useInView } from "@/hooks/useInView";

type Stat = {
  icon: typeof Film;
  value: string;
  big: number;
  suffix?: string;
  title: string;
  desc: string;
};

const STATS: Stat[] = [
  {
    icon: Film,
    big: 10000,
    suffix: "+",
    value: "+10.000",
    title: "Contenido ilimitado",
    desc: "Películas, series y más",
  },
  {
    icon: Tv,
    big: 1000,
    suffix: "+",
    value: "+1000",
    title: "Canales en vivo",
    desc: "Deportes, noticias y más",
  },
  { icon: Zap, big: 4, value: "4K", title: "Calidad 4K", desc: "Imagen Ultra HD" },
  {
    icon: ShieldCheck,
    big: 100,
    suffix: "%",
    value: "100%",
    title: "Seguro",
    desc: "Protegemos tu privacidad",
  },
  {
    icon: Headphones,
    big: 24,
    suffix: "/7",
    value: "24/7",
    title: "Soporte",
    desc: "Atención personalizada",
  },
];

function StatCard({ stat, start, index }: { stat: Stat; start: boolean; index: number }) {
  const n = useCountUp(stat.big, start, 1400 + index * 120);
  const display = (() => {
    if (stat.value === "4K") return "4K";
    if (stat.value === "24/7") return `${n}/7`;
    if (stat.value === "100%") return `${n}%`;
    if (stat.big >= 1000) return `+${n.toLocaleString("es-ES")}`;
    return `${n}${stat.suffix ?? ""}`;
  })();

  return (
    <div
      className={`relative rounded-2xl glass-card p-5 sm:p-6 text-center transition-all duration-700 hover:border-violet-2/50 ${
        start ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: start ? `${index * 90}ms` : "0ms" }}
    >
      <div className="mx-auto w-12 h-12 rounded-full border border-violet-2/50 grid place-items-center bg-violet/10">
        <stat.icon className="w-5 h-5 text-violet-2" />
      </div>
      <p className="mt-4 font-display text-3xl sm:text-4xl text-white tracking-tight">{display}</p>
      <p className="mt-2 text-sm font-semibold text-white/90">{stat.title}</p>
      <p className="mt-0.5 text-xs text-white/74 leading-snug">{stat.desc}</p>
    </div>
  );
}

/** Animated stats grid — counts up on scroll into view. */
export function StatsBar() {
  const { ref, seen } = useInView<HTMLDivElement>(0.25);

  return (
    <section ref={ref} className="py-20 sm:py-24 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-5 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-6">
          {STATS.map((s, i) => (
            <StatCard key={s.title} stat={s} start={seen} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
