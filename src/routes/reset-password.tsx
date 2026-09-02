import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, KeyRound, Loader2, TriangleAlert } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import {
  clearSupabaseAuthRedirectError,
  getSupabaseAuthRedirectError,
} from "@/lib/supabase-auth-redirect";

type RecoveryStatus = "checking" | "ready" | "invalid" | "completed";

function readRecoveryLink() {
  if (typeof window === "undefined") return { hasError: false, hasTokens: false };

  const fragment = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const query = new URLSearchParams(window.location.search);
  const params = fragment.size > 0 ? fragment : query;

  return {
    hasError: Boolean(params.get("error") || params.get("error_code")),
    hasTokens:
      params.get("type") === "recovery" &&
      Boolean(params.get("access_token")) &&
      Boolean(params.get("refresh_token")),
  };
}

export const Route = createFileRoute("/reset-password")({
  // Supabase sends implicit-flow credentials in the URL fragment, which is
  // browser-only. This page must never render on the server.
  ssr: false,
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const authError = useMemo(() => getSupabaseAuthRedirectError(), []);
  const link = useMemo(() => readRecoveryLink(), []);
  const [status, setStatus] = useState<RecoveryStatus>(authError || link.hasError ? "invalid" : "checking");
  const [message, setMessage] = useState(authError?.message ?? "Estamos verificando tu enlace de recuperación…");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authError || link.hasError) {
      clearSupabaseAuthRedirectError();
      return;
    }

    if (!link.hasTokens) {
      setStatus("invalid");
      setMessage("Este enlace no es válido o está incompleto. Solicita un nuevo correo de recuperación.");
      return;
    }

    let active = true;
    const verifyRecoverySession = async () => {
      // The browser Supabase client detects the implicit-flow tokens and stores
      // the session. Reading it here is a defensive check before password update.
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (error || !data.session) {
        setStatus("invalid");
        setMessage("Este enlace expiró, ya fue usado o no se pudo validar. Solicita un nuevo correo de recuperación.");
        return;
      }

      // Keep tokens out of the address bar once Supabase has stored the session.
      window.history.replaceState(window.history.state, "", "/reset-password");
      setMessage("");
      setStatus("ready");
    };

    void verifyRecoverySession();
    return () => {
      active = false;
    };
  }, [authError, link.hasError, link.hasTokens]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    if (password.length < 8) {
      setMessage("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setSubmitting(false);
      setMessage("No se pudo actualizar la contraseña. Solicita un nuevo enlace e inténtalo nuevamente.");
      return;
    }

    setStatus("completed");
    setSubmitting(false);
    await supabase.auth.signOut({ scope: "local" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl sm:p-8">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary">
          {status === "checking" ? <Loader2 className="size-6 animate-spin" /> : status === "invalid" ? <TriangleAlert className="size-6" /> : status === "completed" ? <CheckCircle2 className="size-6" /> : <KeyRound className="size-6" />}
        </div>

        {status === "checking" && <div className="mt-5 text-center"><h1 className="text-xl font-bold text-foreground">Verificando enlace</h1><p className="mt-2 text-sm text-muted-foreground">{message}</p></div>}

        {status === "invalid" && (
          <div className="mt-5 text-center">
            <h1 className="text-xl font-bold text-foreground">Enlace no disponible</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <a href="/tienda?auth=forgot" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">Solicitar correo</a>
              <a href="/tienda?auth=login" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-input px-4 text-sm font-semibold text-foreground transition-colors hover:bg-accent">Volver al login</a>
            </div>
          </div>
        )}

        {status === "ready" && (
          <form className="mt-5 space-y-4" onSubmit={submit}>
            <div className="text-center"><h1 className="text-xl font-bold text-foreground">Crea una nueva contraseña</h1><p className="mt-2 text-sm text-muted-foreground">Usa al menos 8 caracteres para proteger tu cuenta.</p></div>
            <label className="block text-sm font-medium text-foreground">Nueva contraseña<input autoComplete="new-password" className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-foreground outline-none transition-colors focus:border-primary" onChange={(event) => setPassword(event.target.value)} type="password" value={password} /></label>
            <label className="block text-sm font-medium text-foreground">Confirmar contraseña<input autoComplete="new-password" className="mt-2 h-11 w-full rounded-lg border border-input bg-background px-3 text-foreground outline-none transition-colors focus:border-primary" onChange={(event) => setConfirmation(event.target.value)} type="password" value={confirmation} /></label>
            {message && <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{message}</p>}
            <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70" disabled={submitting} type="submit">{submitting && <Loader2 className="size-4 animate-spin" />}Guardar nueva contraseña</button>
          </form>
        )}

        {status === "completed" && <div className="mt-5 text-center"><h1 className="text-xl font-bold text-foreground">Contraseña actualizada</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Ya puedes iniciar sesión con tu nueva contraseña.</p><a href="/tienda?auth=login" className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">Ir al login</a></div>}
      </section>
    </main>
  );
}
