import { createFileRoute, redirect } from "@tanstack/react-router";
import { products } from "@/components/tienda/data";
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
      { property: "og:image", content: "https://cmdstreaming.pe/cmd-logo.png" },
      { property: "og:image:alt", content: "Tienda CMD Streaming" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Tienda CMD Streaming — Cuentas Premium" },
      {
        name: "twitter:description",
        content: "Netflix, Disney+, ChatGPT Plus y más con entrega inmediata.",
      },
      { name: "twitter:image", content: "https://cmdstreaming.pe/cmd-logo.png" },
    ],
    links: [{ rel: "canonical", href: "https://cmdstreaming.pe/tienda" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Catálogo CMD Streaming",
          itemListElement: products.map((product, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Product",
              name: product.name,
              category: product.category,
              offers: {
                "@type": "Offer",
                price: product.price.toFixed(2),
                priceCurrency: "PEN",
                availability: "https://schema.org/InStock",
              },
            },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Inicio", item: "/" },
            { "@type": "ListItem", position: 2, name: "Tienda", item: "/tienda" },
          ],
        }),
      },
    ],
  }),
  component: TiendaPage,
});
