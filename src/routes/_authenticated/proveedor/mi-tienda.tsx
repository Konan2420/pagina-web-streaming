import { createFileRoute } from "@tanstack/react-router";
import { StorefrontRoutePage } from "@/components/storefront/StorefrontRoutePage";

export const Route = createFileRoute("/_authenticated/proveedor/mi-tienda")({
  component: StorefrontRoutePage,
});
