import { useEffect, useState } from "react";
import { Quote, ShieldCheck, Star, TrendingUp, Zap } from "lucide-react";
import { usePublicMetrics } from "@/hooks/usePublicMetrics";

const AVATAR_COLORS = [
  "from-red-500 to-orange-500",
  "from-violet-500 to-fuchsia-500",
  "from-amber-500 to-red-500",
  "from-rose-500 to-red-600",
  "from-purple-500 to-red-500",
];
const INITIALS = ["MG", "JR", "AL", "SC", "DV"];

const TRUST = [
  { icon: ShieldCheck, label: "Pago seguro" },
  { icon: Zap, label: "Activación inmediata" },
  { icon: Star, label: "Soporte 24/7" },
];

const FALLBACK_RECENT = [
  { name: "María", when: "hace instantes" },
  { name: "Carlos", when: "hace 3 min" },
  { name: "Lucía", when: "hace 6 min" },
];

function formatCount(n: number): string {
  if (n >= 1000) return `+${(n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(".0", "")}k`;
  return `+${n}`;
}

/** High-density social proof: avatars, rating, live activity, quote, trust badges. */
export function SocialProof() {
  const metrics = usePublicMetrics();
  const recent = metrics.recentActivity.length ? metrics.recentActivity : FALLBACK_RECENT;
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches || recent.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % recent.length), 3200);
    return () => clearInterval(t);
  }, [recent.length]);
  const current = recent[idx % recent.length];
  const clientsLabel =
    metrics.totalUsers > 0
      ? `${metrics.totalUsers.toLocaleString("es-ES")} ${metrics.totalUsers === 1 ? "cliente registrado" : "clientes registrados"}`
      : "Sé de los primeros en unirte";
  const weeklyLabel =
    metrics.ordersLast7Days > 0
      ? `+${metrics.ordersLast7Days} esta semana`
      : "Nuevas activaciones cada día";

  return (
    <div className="mt-6 space-y-4 animate-fade-up" style={{ animationDelay: "540ms" }}>
      {/* Row 1: avatars + rating + live pulse */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2" aria-hidden="true">
            {INITIALS.map((n, i) => (
              <div
                key={n}
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i]} ring-2 ring-background grid place-items-center text-[10px] font-bold text-white`}
              >
                {n}
              </div>
            ))}
            <div className="w-8 h-8 rounded-full bg-white/10 ring-2 ring-background grid place-items-center text-[10px] font-bold text-white/90">
              {metrics.totalUsers > INITIALS.length
                ? formatCount(metrics.totalUsers - INITIALS.length)
                : "★"}
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1" aria-label="Valoración 4.9 de 5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="w-3.5 h-3.5 fill-violet-2 text-violet-2"
                  aria-hidden="true"
                />
              ))}
              <span className="ml-1 text-sm font-semibold text-white">4.9</span>
            </div>
            <span className="text-[11px] text-white/74">{clientsLabel}</span>
          </div>
        </div>

        <div
          className="flex min-w-0 items-center gap-2 border-white/10 sm:border-l sm:pl-4"
          aria-live="off"
        >
          <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-accent/70 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-accent" />
          </span>
          <span className="text-[11px] text-white/70 truncate">
            <span className="text-white/90 font-medium">{current.name}</span> se registró{" "}
            <span className="text-white/74">{current.when}</span>
          </span>
        </div>
      </div>

      {/* Row 2: testimonial */}
      <figure className="relative rounded-2xl glass-card p-4 pl-5 overflow-hidden">
        <Quote className="absolute -top-1 -left-1 w-8 h-8 text-violet-2/20" aria-hidden="true" />
        <blockquote className="text-sm text-white/85 leading-snug">
          “Cancelé 4 suscripciones. Todo en uno, en 4K y sin cortes. Vale cada peso.”
        </blockquote>
        <figcaption className="mt-2 flex items-center gap-2 text-[11px] text-white/74">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-red-500 grid place-items-center text-[9px] font-bold text-white">
            AM
          </div>
          <span className="text-white/80 font-medium">Andrés M.</span>
          <span aria-hidden="true">·</span>
          <span>Cliente verificado</span>
          <span className="ml-auto flex items-center gap-1 text-red-accent">
            <TrendingUp className="w-3 h-3" aria-hidden="true" />
            <span className="font-semibold">{weeklyLabel}</span>
          </span>
        </figcaption>
      </figure>

      {/* Row 3: trust badges */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {TRUST.map((t) => (
          <div key={t.label} className="flex items-center gap-1.5 text-xs text-white/82">
            <t.icon className="w-3.5 h-3.5 text-violet-2" aria-hidden="true" />
            {t.label}
          </div>
        ))}
      </div>
    </div>
  );
}
