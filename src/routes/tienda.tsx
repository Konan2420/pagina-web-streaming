import { createFileRoute, redirect } from "@tanstack/react-router";
import { TiendaPage } from "@/components/tienda/TiendaPage";

export const Route = createFileRoute("/tienda")({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Tienda CMD Streaming — Cuentas Premium y Licencias" },
      {
        name: "description",
        content:
          "Explora nuestro catálogo de cuentas premium para streaming, herramientas de IA y licencias de software al mejor precio.",
      },
      { property: "og:title", content: "Tienda CMD Streaming — Cuentas Premium" },
      {
        property: "og:description",
        content: "Netflix, Disney+, ChatGPT Plus y más con entrega inmediata.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://cmdstreaming.pe/tienda" },
      { property: "og:image", content: "https://cmd-streaming.vercel.app/cmd-logo.png" },
      { property: "og:image:alt", content: "Tienda CMD Streaming" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Tienda CMD Streaming — Cuentas Premium" },
      {
        name: "twitter:description",
        content: "Netflix, Disney+, ChatGPT Plus y más con entrega inmediata.",
      },
      { name: "twitter:image", content: "https://cmd-streaming.vercel.app/cmd-logo.png" },
    ],
    links: [{ rel: "canonical", href: "https://cmdstreaming.pe/tienda" }],
  }),
  component: TiendaPage,
});
