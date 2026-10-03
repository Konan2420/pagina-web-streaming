import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { getAuthDestination } from "@/lib/auth-destination";
import { syncCatalogSession } from "@/lib/catalog-session.functions";

export const Route = createFileRoute("/acceso")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Accede a CMD Streaming" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AccessPage,
});

function AccessPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!error && data.user) {
          await syncCatalogSession();
          const destination = await getAuthDestination(data.user.id);
          if (active) await router.navigate({ to: destination, replace: true });
        }
      } catch {
        // A failed or expired session leaves the login form available.
      } finally {
        if (active) setChecking(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  if (checking) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">Comprobando sesión…</p>
      </main>
    );
  }

  return <AuthModal open onClose={() => {}} fullscreen />;
}
