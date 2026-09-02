export type SupabaseAuthRedirectError = {
  code: string | null;
  message: string;
};

function normalize(value: string | null): string | null {
  return value?.trim().toLowerCase() || null;
}

function parseAuthErrorParams(rawParams: string): SupabaseAuthRedirectError | null {
  const params = new URLSearchParams(rawParams.replace(/^[?#]/, ""));
  const error = normalize(params.get("error"));
  const code = normalize(params.get("error_code"));

  if (!error && !code) return null;

  if (code === "otp_expired" || code === "otp_invalid" || code === "token_expired") {
    return {
      code,
      message: "Este enlace expiró o ya fue usado. Solicita un nuevo correo de recuperación.",
    };
  }

  if (code === "invalid_request" || code === "invalid_grant" || code === "bad_code") {
    return {
      code,
      message: "Este enlace no es válido. Solicita un nuevo correo de recuperación e inténtalo otra vez.",
    };
  }

  if (error === "access_denied" || error === "unauthorized" || error === "forbidden") {
    return {
      code,
      message: "No fue posible validar este enlace. Puede haber expirado, sido usado o pertenecer a otro navegador.",
    };
  }

  return {
    code,
    message: "No fue posible completar la autenticación con este enlace. Solicita uno nuevo para continuar.",
  };
}

/**
 * Supabase sends recovery and OAuth errors in the URL fragment. The dedicated
 * callback route reads these values before initializing a recovery session.
 */
export function getSupabaseAuthRedirectError(): SupabaseAuthRedirectError | null {
  if (typeof window === "undefined") return null;

  return (
    parseAuthErrorParams(window.location.hash) ?? parseAuthErrorParams(window.location.search)
  );
}

/** Removes only Supabase Auth error parameters after they have been consumed. */
export function clearSupabaseAuthRedirectError(): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  url.hash = "";
  url.searchParams.delete("error");
  url.searchParams.delete("error_code");
  url.searchParams.delete("error_description");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
}
