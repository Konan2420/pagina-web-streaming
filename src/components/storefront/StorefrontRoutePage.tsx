import { TiendaPage } from "@/components/tienda/TiendaPage";

/** Mi Tienda comparte la sidebar de la landing y evita redirecciones por rol. */
export function StorefrontRoutePage() {
  return <TiendaPage initialPanel="mi-tienda" redirectAuthenticatedRoles={false} />;
}
