import { createFileRoute } from "@tanstack/react-router";
import { PublicStorefront } from "@/components/storefront/PublicStorefront";
import { requireCatalogSession } from "@/lib/require-catalog-session";

function PublicStorefrontRoute() {
  const { slug } = Route.useParams();
  return <PublicStorefront slug={slug} />;
}

export const Route = createFileRoute("/tienda-publica/$slug")({
  ssr: false,
  beforeLoad: requireCatalogSession,
  component: PublicStorefrontRoute,
});
