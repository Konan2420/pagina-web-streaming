import { createFileRoute } from "@tanstack/react-router";
import { PublicStorefront } from "@/components/storefront/PublicStorefront";

function PublicStorefrontRoute() {
  const { slug } = Route.useParams();
  return <PublicStorefront slug={slug} />;
}

export const Route = createFileRoute("/tienda-publica/$slug")({
  ssr: false,
  component: PublicStorefrontRoute,
});
