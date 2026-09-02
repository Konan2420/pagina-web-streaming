import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { StorefrontManagement } from "@/components/storefront/StorefrontManagement";

export const Route = createFileRoute("/_authenticated/admin/mi-tienda")({
  component: () => (
    <AdminLayout
      title="Mi Tienda"
      subtitle="Supervisa y ajusta las tiendas de proveedores y distribuidores."
    >
      <StorefrontManagement />
    </AdminLayout>
  ),
});
