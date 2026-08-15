import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Check, ShoppingBag } from "lucide-react";
import { Footer } from "@/components/landing/Footer";
import { Navbar } from "@/components/landing/Navbar";
import {
  getPlatformPage,
  type PlatformPage as PlatformPageData,
} from "@/components/landing/platform-pages";

export const Route = createFileRoute("/plataformas/$slug")({
  loader: ({ params }): PlatformPageData => {
    const page = getPlatformPage(params.slug);
    if (!page) throw notFound();
    return page;
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) return {};
    const url = `https://cmdstreaming.pe/plataformas/${params.slug}`;
    const title = `${loaderData.name} — precio y activación | CMD Streaming`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.description.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.tagline },
        { property: "og:type", content: "product" },
        { property: "og:url", content: url },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: loaderData.name,
            description: loaderData.description,
            brand: { "@type": "Brand", name: "CMD Streaming" },
            offers: {
              "@type": "Offer",
              price: loaderData.price.toFixed(2),
              priceCurrency: "PEN",
              availability: "https://schema.org/InStock",
              url,
            },
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Inicio", item: "/" },
              { "@type": "ListItem", position: 2, name: "Plataformas", item: "/plataformas" },
              { "@type": "ListItem", position: 3, name: loaderData.name, item: url },
            ],
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: loaderData.faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        },
      ],
    };
  },
  component: PlatformPage,
});

function PlatformPage() {
  const page: PlatformPageData = Route.useLoaderData();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 pt-28 pb-20 sm:px-6">
        <nav aria-label="Ruta de navegación" className="text-xs text-white/60">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/" className="hover:text-white">
                Inicio
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/plataformas" className="hover:text-white">
                Plataformas
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-white/85">{page.name}</li>
          </ol>
        </nav>

        <header className="mt-6">
          <h1 className="text-4xl sm:text-5xl">{page.name}</h1>
          <p className="mt-3 text-lg text-white/80">{page.tagline}</p>
          <p className="mt-5 max-w-2xl text-white/72">{page.description}</p>
          <p className="mt-6 text-2xl font-semibold text-red-accent">
            S/ {page.price.toFixed(2)}{" "}
            <span className="text-sm font-normal text-white/70">/ {page.duracion}</span>
          </p>
          <Link
            to="/tienda"
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-red-accent px-6 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <ShoppingBag className="size-4" aria-hidden="true" />
            Comprar en la tienda
          </Link>
        </header>

        <section aria-labelledby="incluye" className="mt-14 border-t border-white/10 pt-10">
          <h2 id="incluye" className="text-2xl">
            Qué incluye
          </h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {page.includes.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-white/78">
                <Check className="mt-0.5 size-4 shrink-0 text-red-accent" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="faq-plataforma" className="mt-14 border-t border-white/10 pt-10">
          <h2 id="faq-plataforma" className="text-2xl">
            Preguntas frecuentes
          </h2>
          <dl className="mt-5 space-y-6">
            {page.faq.map((f) => (
              <div key={f.q}>
                <dt className="text-base font-semibold">{f.q}</dt>
                <dd className="mt-1 max-w-2xl text-sm text-white/75">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <Footer />
    </div>
  );
}
