import { createFileRoute, useRouter } from "@tanstack/react-router";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { getAuthDestination } from "@/lib/auth-destination";
import { getCurrentAccountAccess } from "@/lib/ban.functions";
import { suspensionUrl } from "@/lib/suspension-client";
import {
  clearSupabaseAuthRedirectError,
  getSupabaseAuthRedirectError,
} from "@/lib/supabase-auth-redirect";

type CallbackStatus = "processing" | "error";
type EmailOtpType = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email";

const emailOtpTypes = new Set<EmailOtpType>([
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
]);

function readCallbackParams() {
  const url = new URL(window.location.href);
  const fragment = new URLSearchParams(url.hash.replace(/^#/, ""));

  return {
    code: url.searchParams.get("code"),
    tokenHash: url.searchParams.get("token_hash") ?? fragment.get("token_hash"),
    type: url.searchParams.get("type") ?? fragment.get("type"),
  };
}

function clearCallbackParams() {
  const url = new URL(window.location.href);
  for (const key of ["code", "token_hash", "type", "error", "error_code", "error_description"]) {
    url.searchParams.delete(key);
  }
  url.hash = "";
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
}

function toUserMessage(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  if (message.includes("code verifier") || message.includes("code challenge")) {
    return "No se pudo validar el enlace en este navegador. Solicita un enlace nuevo e inícialo en el mismo navegador donde te registraste.";
  }
  if (message.includes("expired") || message.includes("invalid") || message.includes("otp")) {
    return "Este enlace expiró, ya fue usado o no es válido. Solicita uno nuevo para continuar.";
  }
  return "No se pudo completar la autenticación. Inténtalo de nuevo o solicita un enlace de confirmación nuevo.";
}

export const Route = createFileRoute("/auth/callback")({
  // Los parámetros de Supabase llegan solo al navegador; evitar SSR garantiza
  // que el servidor nunca los procese ni los incluya en HTML renderizado.
  ssr: false,
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<CallbackStatus>("processing");
  const [message, setMessage] = useState("Estamos verificando tu cuenta…");

  useEffect(() => {
    let active = true;

    const completeAuthentication = async () => {
      const redirectError = getSupabaseAuthRedirectError();
      if (redirectError) {
        clearSupabaseAuthRedirectError();
        if (active) {
          setStatus("error");
          setMessage(redirectError.message);
        }
        return;
      }

      try {
        const { code, tokenHash, type } = readCallbackParams();

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && type && emailOtpTypes.has(type as EmailOtpType)) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as EmailOtpType,
          });
          if (error) throw error;
        }

        // En flujo implícito, supabase-js detecta y guarda los tokens del
        // hash. En PKCE o token_hash, las llamadas previas ya guardan sesión.
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session?.user) {
          throw new Error("No se recibió una sesión válida desde Supabase.");
        }

        clearCallbackParams();
        const access = await getCurrentAccountAccess();
        if (!access.allowed) {
          await supabase.auth.signOut({ scope: "local" });
          window.location.assign(
            suspensionUrl({ type: access.block === "ip" ? "ip" : "account", endsAt: access.endsAt }),
          );
          return;
        }
        const destination = await getAuthDestination(data.session.user.id);
        if (!active) return;

        await router.invalidate();
        await router.navigate({ to: destination, replace: true });
      } catch (error) {
        clearCallbackParams();
        if (active) {
          setStatus("error");
          setMessage(toUserMessage(error));
        }
      }
    };

    void completeAuthentication();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-2xl sm:p-8">
        <div className="mx-auto grid size-12 place-items-center rounded-full border border-primary/25 bg-primary/10 text-primary">
          {status === "processing" ? (
            <Loader2 className="size-6 animate-spin" aria-hidden="true" />
          ) : (
            <TriangleAlert className="size-6 text-destructive" aria-hidden="true" />
          )}
        </div>
        <h1 className="mt-5 text-xl font-bold text-foreground">
          {status === "processing" ? "Completando acceso" : "No pudimos completar el acceso"}
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
        {status === "processing" && (
          <p className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-primary">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Te redirigiremos automáticamente.
          </p>
        )}
        {status === "error" && (
          <a
            href="/?auth=login"
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Volver al inicio de sesión
          </a>
        )}
      </section>
    </main>
  );
}
