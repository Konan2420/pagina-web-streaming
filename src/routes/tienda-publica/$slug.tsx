import { createFileRoute } from "@tanstack/react-router";
import { PublicStorefront } from "@/components/storefront/PublicStorefront";

export const Route = createFileRoute("/tienda-publica/$slug")({
  ssr: false,
  component: () => {
    const { slug } = Route.useParams();
    return <PublicStorefront slug={slug} />;
  },
});
