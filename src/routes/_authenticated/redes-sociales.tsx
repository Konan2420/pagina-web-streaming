import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { TiendaPage } from "@/components/tienda/TiendaPage";

/** Generador SMM compartido: disponible para cualquier cuenta autenticada. */
export const Route = createFileRoute("/_authenticated/redes-sociales")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/tienda" });
  },
  component: () => <TiendaPage initialCategory="redes" redirectAuthenticatedRoles={false} />,
});
