import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { syncCatalogSession } from "@/lib/catalog-session.functions";

/** The server request middleware checks the HttpOnly cookie before SSR. */
export async function requireCatalogSession() {
  if (typeof window === "undefined") return;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw redirect({ to: "/acceso" });

  try {
    await syncCatalogSession();
  } catch {
    throw redirect({ to: "/acceso" });
  }
}
