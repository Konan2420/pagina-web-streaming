import { createFileRoute } from "@tanstack/react-router";
import { LandingAuthGate } from "@/components/LandingAuthGate";
import { TiendaPage } from "./tienda";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CMD Streaming — Cine, series y TV en vivo en 4K" },
      {
        name: "description",
        content:
          "Películas, series, deportes y TV en vivo de tus plataformas favoritas en una sola experiencia 4K. Activación el mismo día y sin permanencia.",
      },
      { property: "og:title", content: "CMD Streaming — Cine, series y TV en vivo en 4K" },
      {
        property: "og:description",
        content:
          "Películas, series, deportes y TV en vivo de tus plataformas favoritas en una sola experiencia 4K. Activación el mismo día y sin permanencia.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://cmdstreaming.pe/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://cmdstreaming.pe/" }],
  }),
  component: () => (
    <LandingAuthGate>
      <TiendaPage />
    </LandingAuthGate>
  ),
});
