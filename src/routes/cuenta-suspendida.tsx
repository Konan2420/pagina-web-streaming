import { createFileRoute } from "@tanstack/react-router";
import { Ban, Clock3, ShieldAlert } from "lucide-react";
import { useEffect } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/cuenta-suspendida")({
  ssr: false,
  component: SuspendedAccountPage,
});

function formatEndsAt(value: string | null) {
  if (!value) return "La suspensión es permanente.";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "La suspensión estará activa hasta nuevo aviso.";
  return `La suspensión finaliza el ${new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "America/Lima",
  }).format(date)}.`;
}

function SuspendedAccountPage() {
  const params = new URLSearchParams(window.location.search);
  const isIpRestriction = params.get("type") === "ip";
  const endsAt = params.get("until");

  useEffect(() => {
    void supabase.auth.signOut({ scope: "local" });
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-10">
      <section className="w-full max-w-lg rounded-2xl border border-destructive/35 bg-card p-6 text-center shadow-2xl sm:p-9">
        <div className="mx-auto grid size-14 place-items-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
          {isIpRestriction ? <ShieldAlert className="size-7" /> : <Ban className="size-7" />}
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-destructive">Acceso suspendido</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
          {isIpRestriction ? "El acceso desde esta red no está disponible" : "Tu cuenta está suspendida"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          {isIpRestriction
            ? "Por seguridad, no es posible iniciar sesión desde esta red. Si crees que es un error, contacta al soporte oficial."
            : "No puedes acceder a secciones, pedidos ni datos de la plataforma mientras la suspensión esté activa."}
        </p>
        {!isIpRestriction && (
          <p className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground">
            <Clock3 className="size-4 text-primary" />
            {formatEndsAt(endsAt)}
          </p>
        )}
      </section>
    </main>
  );
}
