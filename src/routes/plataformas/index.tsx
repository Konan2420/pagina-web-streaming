import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { platformPages } from "@/lib/platform-pages";
import { AppTopbar } from "@/components/layout/AppTopbar";

export const Route = createFileRoute("/plataformas/")({
  head: () => ({
    meta: [
      { title: "Plataformas de streaming y precios — CMD Streaming" },
      {
        name: "description",
        content:
          "Precios y detalles de cada plataforma: Netflix, Disney+, HBO Max, Prime Video, Spotify y combos. Activación el mismo día y sin permanencia.",
      },
      { property: "og:title", content: "Plataformas de streaming y precios — CMD Streaming" },
      {
        property: "og:description",
        content: "Compara plataformas, precios y qué incluye cada plan de CMD Streaming.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://cmdstreaming.pe/plataformas" },
      {
        property: "og:image",
        content: "https://cmdstreaming.pe/cmd-logo.png",
      },
      { property: "og:image:alt", content: "Plataformas disponibles en CMD Streaming" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Plataformas de streaming y precios — CMD Streaming" },
      {
        name: "twitter:description",
        content: "Compara plataformas, precios y qué incluye cada plan de CMD Streaming.",
      },
      {
        name: "twitter:image",
        content: "https://cmdstreaming.pe/cmd-logo.png",
      },
    ],
    links: [{ rel: "canonical", href: "https://cmdstreaming.pe/plataformas" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Plataformas de streaming disponibles",
          itemListElement: platformPages.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: p.name,
            url: `/plataformas/${p.slug}`,
          })),
        }),
      },
    ],
  }),
  component: PlatformsIndex,
});

function PlatformsIndex() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AppTopbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-[11px] uppercase tracking-[0.28em] text-red-accent">Catálogo</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">Plataformas y precios</h1>
        <p className="mt-4 max-w-2xl text-white/75">
          Cada plataforma con su precio, duración y lo que incluye. Activación el mismo día,
          garantía durante toda la vigencia y sin cargos automáticos.
        </p>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {platformPages.map((p) => (
            <li key={p.slug}>
              <Link
                to="/plataformas/$slug"
                params={{ slug: p.slug }}
                className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-red-accent/60"
              >
                <h2 className="text-xl">{p.name}</h2>
                <p className="mt-2 flex-1 text-sm text-white/70">{p.tagline}</p>
                <span className="mt-5 flex items-center justify-between text-sm">
                  <span className="font-semibold text-red-accent">
                    S/ {p.price.toFixed(2)} · {p.duracion}
                  </span>
                  <ArrowRight
                    className="size-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
