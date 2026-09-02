import { createFileRoute } from "@tanstack/react-router";
import { TiendaPage } from "@/components/tienda/TiendaPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CMD Streaming — Catálogo de plataformas y servicios digitales" },
      {
        name: "description",
        content:
          "Explora plataformas de streaming, inteligencia artificial, aplicaciones, licencias, recargas y más servicios digitales.",
      },
      { property: "og:title", content: "CMD Streaming — Catálogo de servicios digitales" },
      {
        property: "og:description",
        content: "Streaming, IA, aplicaciones, licencias y recargas en un solo catálogo.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://cmdstreaming.pe/" },
      {
        property: "og:image",
        content: "https://cmdstreaming.pe/cmd-logo.png",
      },
      { property: "og:image:alt", content: "CMD Streaming" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "CMD Streaming — Catálogo de servicios digitales" },
      {
        name: "twitter:description",
        content: "Streaming, IA, aplicaciones, licencias y recargas en un solo catálogo.",
      },
      {
        name: "twitter:image",
        content: "https://cmdstreaming.pe/cmd-logo.png",
      },
    ],
    links: [{ rel: "canonical", href: "https://cmdstreaming.pe/" }],
  }),
  component: CatalogHomePage,
});

/** Canonical public landing: the real CMD marketplace and catalog. */
function CatalogHomePage() {
  return <TiendaPage redirectAuthenticatedRoles={false} />;
}
