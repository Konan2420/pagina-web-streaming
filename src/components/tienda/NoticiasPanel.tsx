import { ArrowUpRight, Bell, CalendarDays, Megaphone, Sparkles } from "lucide-react";

const news = [
  {
    title: "CMD Champions ya está activo",
    text: "Consulta el ranking mensual y descubre quién lidera la comunidad.",
    label: "Comunidad",
    icon: Sparkles,
  },
  {
    title: "Nuevos servicios en el catálogo",
    text: "Revisa las últimas plataformas, recargas y productos disponibles.",
    label: "Catálogo",
    icon: Megaphone,
  },
  {
    title: "Eventos y promociones",
    text: "Mantente atento a las cajas sorpresa y beneficios especiales del mes.",
    label: "Eventos",
    icon: CalendarDays,
  },
];

export function NoticiasPanel({ onGoRanking }: { onGoRanking: () => void }) {
  return (
    <section className="mx-auto mt-6 max-w-[1200px] px-4 pb-24 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card/80 shadow-2xl">
        <div className="relative border-b border-border bg-gradient-to-br from-primary/15 via-background to-background px-5 py-8 sm:px-8">
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                <Bell className="h-4 w-4" aria-hidden="true" /> Actualizaciones CMD
              </div>
              <h1 className="font-display text-4xl uppercase tracking-wide text-white sm:text-6xl">
                Noticias
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
                Las novedades de CMD Streaming, eventos, lanzamientos y oportunidades para tu
                negocio.
              </p>
            </div>
            <div className="cmd-news-orb" aria-hidden="true">
              <Bell />
            </div>
          </div>
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-6">
          {news.map(({ title, text, label, icon: Icon }) => (
            <article
              key={title}
              className="group rounded-xl border border-border bg-background p-4 transition hover:-translate-y-1 hover:border-primary/60 hover:bg-primary/[0.05]"
            >
              <div className="mb-5 flex items-center justify-between">
                <span className="cmd-news-icon">
                  <Icon aria-hidden="true" />
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40">
                  {label}
                </span>
              </div>
              <h2 className="text-base font-black text-white">{title}</h2>
              <p className="mt-2 text-xs leading-relaxed text-white/55">{text}</p>
            </article>
          ))}
        </div>
        <div className="flex justify-end border-t border-border px-4 py-4 sm:px-6">
          <button
            type="button"
            onClick={onGoRanking}
            className="inline-flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-[10px] font-black uppercase tracking-wide text-primary transition hover:bg-primary/20"
          >
            Ver ranking CMD Champions <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}

export default NoticiasPanel;
