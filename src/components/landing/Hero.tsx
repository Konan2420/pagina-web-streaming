import { Link } from "@tanstack/react-router";
import { ArrowRight, Play, ShieldCheck, Store, UserPlus, Zap } from "lucide-react";
import landingBg from "@/assets/hero.jpg";
import { SocialProof } from "./SocialProof";
import { useAnalytics } from "@/hooks/useAnalytics";
import { heroCopy } from "./data";

const PILLS = [
  { icon: Zap, label: "Activación en minutos" },
  { icon: ShieldCheck, label: "Pago seguro" },
  { icon: Play, label: "4K sin cortes" },
];

/** Cinematic hero: full-bleed still, editorial headline and conversion CTAs. */
export function Hero({ onOpenAuth }: { onOpenAuth?: (mode?: "login" | "signup") => void }) {
  const track = useAnalytics();

  return (
    <section
      id="inicio"
      className="relative flex min-h-[82svh] items-center overflow-hidden sm:min-h-[92svh] sm:items-end"
    >
      <img
        src={landingBg}
        alt="Escena cinematográfica de una película en streaming"
        className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none"
        width={1920}
        height={1080}
        decoding="async"
        loading="eager"
        fetchPriority="high"
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--background)_6%,rgba(9,9,14,0.7)_45%,rgba(9,9,14,0.4)_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(9,9,14,0.8)_0%,rgba(9,9,14,0.3)_55%,transparent_100%)] pointer-events-none" />

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-12 sm:pt-32 sm:pb-20">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-red-accent">
            <span className="h-px w-8 bg-red-accent" aria-hidden="true" />
            {heroCopy.overline}
          </p>

          <h1 className="mt-5 font-display uppercase text-white text-[2.75rem] leading-[0.95] sm:text-6xl lg:text-7xl text-balance animate-fade-up">
            <span className="animate-shine transition-all inline-block">{heroCopy.title.main}</span>
            <br />
            <span className="animate-shine transition-all inline-block">
              {heroCopy.title.break}
            </span>
            <span className="text-red-accent animate-shine transition-all inline-block">
              {heroCopy.title.accent}
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-white/80 leading-relaxed">
            {heroCopy.description}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                track("cta_click", {
                  eventName: "hero_create_account",
                  metadata: { location: "hero" },
                });
                onOpenAuth?.("signup");
              }}
              className="group inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-md bg-primary text-primary-foreground font-semibold text-sm tracking-wide uppercase hover:brightness-110 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <UserPlus
                className="w-4 h-4 group-hover:scale-110 transition-transform"
                aria-hidden="true"
              />
              {heroCopy.ctaPrimary}
              <ArrowRight
                className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all"
                aria-hidden="true"
              />
            </button>
            <Link
              to="/tienda"
              onClick={() =>
                track("cta_click", {
                  eventName: "hero_visit_store",
                  metadata: { location: "hero" },
                })
              }
              className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-md border border-white/25 bg-white/[0.06] text-white text-sm font-semibold tracking-wide uppercase hover:bg-white/[0.12] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Store className="w-4 h-4" aria-hidden="true" />
              {heroCopy.ctaSecondary}
            </Link>
          </div>

          <p className="mt-4 text-sm text-white/70">
            {heroCopy.loginText}{" "}
            <button
              type="button"
              onClick={() => {
                track("cta_click", { eventName: "hero_login", metadata: { location: "hero" } });
                onOpenAuth?.("login");
              }}
              className="text-white font-semibold underline underline-offset-4 decoration-red-accent hover:text-red-accent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              {heroCopy.loginAction}
            </button>
          </p>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {PILLS.map((p) => (
              <li key={p.label} className="flex items-center gap-2 text-sm text-white/75">
                <p.icon className="w-4 h-4 text-red-accent" aria-hidden="true" />
                {p.label}
              </li>
            ))}
          </ul>

          <SocialProof />
        </div>
      </div>
    </section>
  );
}
