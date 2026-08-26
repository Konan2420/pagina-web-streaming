import { CardImageSlideshow } from "@/components/landing/CardImageSlideshow";
import { useInView } from "@/hooks/useInView";

// These public assets are versioned with the landing. Avoid source imports here:
// a missing local asset would crash the complete root route during SSR.
const LANDING_MEDIA = [
  "/landing/auth-platforms-collage.png",
  "/landing/cmd-red-background-desktop.jpg",
] as const;

type RowItem = {
  images: string[];
  title: string;
  meta: string;
  platform: string;
};

type Row = {
  id: string;
  title: string;
  kicker: string;
  items: RowItem[];
};

const ROWS: Row[] = [
  {
    id: "peliculas",
    title: "Películas",
    kicker: "Estrenos 2026 por plataforma",
    items: [
      { images: [...LANDING_MEDIA], title: "Órbita Cero", meta: "Sci-fi · 4K · 2026", platform: "Netflix" },
      {
        images: [...LANDING_MEDIA].reverse(),
        title: "Ciudad de Lluvia",
        meta: "Thriller · HDR · 2026",
        platform: "HBO Max",
      },
      {
        images: [...LANDING_MEDIA],
        title: "El Valle Dorado",
        meta: "Aventura · 4K · 2026",
        platform: "Disney+",
      },
      {
        images: [...LANDING_MEDIA].reverse(),
        title: "Código Silencio",
        meta: "Drama · 4K · 2026",
        platform: "Apple TV+",
      },
    ],
  },
  {
    id: "series",
    title: "Series",
    kicker: "Temporadas nuevas 2026",
    items: [
      {
        images: [...LANDING_MEDIA].reverse(),
        title: "Invierno Final",
        meta: "T1 · 2026 · Netflix Original",
        platform: "Netflix",
      },
      {
        images: [...LANDING_MEDIA],
        title: "La Mansión Chandler",
        meta: "T2 · 2026 · HDR",
        platform: "HBO Max",
      },
      {
        images: [...LANDING_MEDIA].reverse(),
        title: "Guardianes del Norte",
        meta: "T1 · 2026 · 4K",
        platform: "Disney+",
      },
      {
        images: [...LANDING_MEDIA],
        title: "Estación Meridiano",
        meta: "T3 · 2026 · 4K",
        platform: "Apple TV+",
      },
    ],
  },
  {
    id: "canales",
    title: "Canales en vivo",
    kicker: "Deportes, noticias e infantil",
    items: [
      {
        images: [...LANDING_MEDIA],
        title: "Fútbol en directo",
        meta: "+120 canales",
        platform: "Deportes",
      },
      { images: [...LANDING_MEDIA].reverse(), title: "Noticias 24h", meta: "+40 canales", platform: "Noticias" },
      { images: [...LANDING_MEDIA], title: "Infantil", meta: "+60 canales", platform: "Kids" },
      { images: [...LANDING_MEDIA].reverse(), title: "Documentales", meta: "+50 canales", platform: "Docs" },
    ],
  },
];

function ContentRow({ row }: { row: Row }) {
  const { ref, seen } = useInView<HTMLDivElement>(0.15);

  return (
    <div ref={ref} id={row.id} className="scroll-mt-24">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-red-accent">{row.kicker}</p>
          <h2 className="mt-2 font-display uppercase text-white text-2xl sm:text-3xl">
            {row.title}
          </h2>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {row.items.map((item, i) => (
          <article
            key={`${row.id}-${item.title}`}
            className={`group relative aspect-[3/4] overflow-hidden rounded-lg border border-white/10 transition-all duration-700 ${
              seen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
            }`}
            style={{ transitionDelay: seen ? `${i * 80}ms` : "0ms" }}
          >
            <CardImageSlideshow images={item.images} alt={item.title} />
            <span className="absolute left-3 top-3 z-10 rounded bg-[#DC2626] px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
              {item.platform}
            </span>
            <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(9,9,14,0.95)_10%,rgba(9,9,14,0.25)_55%,transparent_100%)]" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h4 className="font-display uppercase text-base text-white leading-tight">
                {item.title}
              </h4>
              <p className="mt-1 text-xs text-white/70">{item.meta}</p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

/** Editorial content rows — replaces the badge catalog with real programming. */
export function ContentShowcase() {
  return (
    <section className="py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-20">
        {ROWS.map((r) => (
          <ContentRow key={r.id} row={r} />
        ))}
      </div>
    </section>
  );
}
