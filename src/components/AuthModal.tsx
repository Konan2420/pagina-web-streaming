import { useCallback, useEffect, useState } from "react";
import { X, Mail, Lock, Loader2, User, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useRouter } from "@tanstack/react-router";
import { getAuthDestination } from "@/lib/auth-destination";

export type AuthMode = "login" | "signup" | "forgot" | "update";

type FieldErrors = Partial<
  Record<"nombre" | "email" | "whatsapp" | "password" | "confirm" | "terms", string>
>;

function getAuthErrorMessage(err: unknown) {
  const message = err instanceof Error ? err.message.toLowerCase() : "";
  if (message.includes("invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (message.includes("email not confirmed")) return "Confirma tu correo antes de iniciar sesión.";
  if (message.includes("user already registered"))
    return "Este correo ya tiene una cuenta. Inicia sesión.";
  if (message.includes("password should be"))
    return "La contraseña no cumple los requisitos de seguridad.";
  if (message.includes("unsupported provider") || message.includes("provider is not enabled")) {
    return "El inicio de sesión con Google aún no está habilitado. Usa tu correo y contraseña o contacta al administrador.";
  }
  if (message.includes("auth session missing") || message.includes("jwt expired")) {
    return "El enlace de recuperación venció. Solicita uno nuevo.";
  }
  if (message.includes("rate limit") || message.includes("too many requests"))
    return "Demasiados intentos. Espera unos minutos y vuelve a intentarlo.";
  return err instanceof Error ? err.message : "No se pudo completar la autenticación.";
}

function setPendingOAuthRedirect(): boolean {
  try {
    window.sessionStorage.setItem("cmd-auth-redirect-pending", "1");
    return true;
  } catch {
    // The login can continue even when storage is disabled. The user will
    // arrive at the store instead of being redirected automatically by role.
    return false;
  }
}

function clearPendingOAuthRedirect() {
  try {
    window.sessionStorage.removeItem("cmd-auth-redirect-pending");
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

export function AuthModal({
  open,
  onClose,
  initialMode = "login",
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: AuthMode;
}) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [nombre, setNombre] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [canResendConfirmation, setCanResendConfirmation] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const track = useAnalytics();
  const router = useRouter();

  const getRedirectUrl = () => {
    if (typeof window === "undefined") return "/tienda";

    // En una demo publicada por túnel, el correo debe regresar a la URL
    // pública y no a 127.0.0.1, que solo existe en el equipo local.
    const configuredAppUrl = import.meta.env.VITE_APP_URL?.trim();
    try {
      return new URL("/tienda", configuredAppUrl || window.location.origin).toString();
    } catch {
      return new URL("/tienda", window.location.origin).toString();
    }
  };

  async function redirectForRole(userId: string) {
    const to = await getAuthDestination(userId);
    await router.invalidate();
    await router.navigate({ to });
  }

  const closeModal = useCallback(
    (force = false) => {
      if (loading && !force) return;
      setError(null);
      setInfo(null);
      setCanResendConfirmation(false);
      setFieldErrors({});
      setEmail("");
      setNombre("");
      setWhatsapp("");
      setTerms(false);
      setPassword("");
      setConfirm("");
      onClose();
    },
    [loading, onClose],
  );

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeModal();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeModal]);

  if (!open) return null;

  function resetState() {
    setError(null);
    setInfo(null);
    setCanResendConfirmation(false);
    setFieldErrors({});
  }

  function clearSensitiveFields() {
    setPassword("");
    setConfirm("");
  }

  function clearForm() {
    setEmail("");
    setNombre("");
    setWhatsapp("");
    setTerms(false);
    clearSensitiveFields();
  }

  function changeMode(nextMode: AuthMode) {
    resetState();
    clearSensitiveFields();
    setMode(nextMode);
  }

  function validateSignup(): FieldErrors {
    const e: FieldErrors = {};
    if (!nombre.trim()) e.nombre = "Ingresa tu nombre completo";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Correo inválido";
    if (!/^[0-9+\s()-]{7,}$/.test(whatsapp)) e.whatsapp = "Número de WhatsApp inválido";
    if (password.length < 8) e.password = "Mínimo 8 caracteres";
    if (confirm !== password) e.confirm = "Las contraseñas no coinciden";
    if (!terms) e.terms = "Debes aceptar los términos";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    resetState();
    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (error) throw error;
        if (!data.user || !data.session)
          throw new Error("No se pudo establecer una sesión válida.");
        track("login", { eventName: "email_login", metadata: { method: "email" } });
        closeModal(true);
        await redirectForRole(data.user.id);
      } else if (mode === "signup") {
        const errs = validateSignup();
        if (Object.keys(errs).length > 0) {
          setFieldErrors(errs);
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            emailRedirectTo: getRedirectUrl(),
            data: { nombre_completo: nombre.trim(), whatsapp: whatsapp.trim() },
          },
        });
        if (error) throw error;
        track("signup", { eventName: "email_signup", metadata: { method: "email" } });
        if (data.session) {
          closeModal(true);
          await redirectForRole(data.session.user.id);
        } else {
          clearSensitiveFields();
          setCanResendConfirmation(true);
          setInfo("Revisa tu correo y confirma tu cuenta para iniciar sesión.");
        }
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: getRedirectUrl(),
        });
        if (error) throw error;
        setInfo("Te enviamos un enlace para restablecer tu contraseña.");
      } else {
        if (password.length < 8) {
          setFieldErrors({ password: "Mínimo 8 caracteres" });
          return;
        }
        if (confirm !== password) {
          setFieldErrors({ confirm: "Las contraseñas no coinciden" });
          return;
        }
        const { data, error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        if (!data.user)
          throw new Error("El enlace de recuperación ya no es válido. Solicita uno nuevo.");
        clearSensitiveFields();
        track("password_reset", {
          eventName: "password_updated",
          metadata: { method: "recovery" },
        });
        closeModal(true);
        await redirectForRole(data.user.id);
      }
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message.toLowerCase() : "";
      const msg = getAuthErrorMessage(err);
      setError(msg);
      setCanResendConfirmation(rawMessage.includes("email not confirmed"));
      console.error("AuthModal error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFieldErrors({ email: "Ingresa el correo con el que creaste la cuenta" });
      return;
    }

    resetState();
    setLoading(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: normalizedEmail,
        options: { emailRedirectTo: getRedirectUrl() },
      });
      if (resendError) throw resendError;
      setCanResendConfirmation(true);
      setInfo("Enviamos un nuevo correo de verificación. Usa únicamente el enlace más reciente.");
    } catch (err: unknown) {
      setCanResendConfirmation(true);
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    resetState();
    setLoading(true);
    try {
      setPendingOAuthRedirect();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getRedirectUrl(),
          skipBrowserRedirect: true,
        },
      });
      if (error) {
        clearPendingOAuthRedirect();
        throw error;
      }
      if (!data.url) {
        clearPendingOAuthRedirect();
        throw new Error("No se pudo iniciar la redirección a Google. Inténtalo nuevamente.");
      }
      track("login", { eventName: "google_oauth_redirect", metadata: { method: "google" } });
      window.location.assign(data.url);
    } catch (err: unknown) {
      clearPendingOAuthRedirect();
      setError(getAuthErrorMessage(err));
      setLoading(false);
    }
  }

  const title =
    mode === "login"
      ? "Iniciar Sesión"
      : mode === "signup"
        ? "Crear Cuenta"
        : mode === "forgot"
          ? "Recuperar Contraseña"
          : "Nueva Contraseña";
  const subtitle =
    mode === "login"
      ? "Accede a tu cuenta para comprar"
      : mode === "signup"
        ? "Regístrate para acceder a la tienda"
        : mode === "forgot"
          ? "Te enviaremos un enlace a tu correo"
          : "Crea una contraseña nueva y segura para tu cuenta";

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4 animate-fade-up">
      <div
        className="absolute inset-0 bg-black/70"
        onClick={() => closeModal()}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="relative w-full max-w-md rounded-2xl glass-card p-6 sm:p-8 border border-violet-2/30 max-h-[92vh] overflow-y-auto"
      >
        <button
          type="button"
          onClick={() => closeModal()}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-white/78 hover:text-white hover:bg-white/5"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <h2
            id="auth-modal-title"
            className="font-display text-3xl text-white uppercase tracking-wide"
          >
            {title}
          </h2>
          <p className="mt-2 text-sm text-white/78">{subtitle}</p>
        </div>

        {mode !== "forgot" && mode !== "update" && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-white/90 disabled:opacity-60 transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              Continuar con Google
            </button>

            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/62 uppercase tracking-wider">o</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
          </>
        )}

        <form noValidate onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <>
              <Field icon={<User className="w-4 h-4" />} error={fieldErrors.nombre}>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre completo"
                  autoComplete="name"
                  aria-label="Nombre completo"
                  className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/74 focus:outline-none focus:border-violet-2/60 transition"
                />
              </Field>
            </>
          )}

          {mode !== "update" && (
            <Field icon={<Mail className="w-4 h-4" />} error={fieldErrors.email}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete={mode === "signup" ? "email" : "username"}
                aria-label="Correo electrónico"
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/74 focus:outline-none focus:border-violet-2/60 transition"
              />
            </Field>
          )}

          {mode === "signup" && (
            <Field icon={<Phone className="w-4 h-4" />} error={fieldErrors.whatsapp}>
              <input
                type="tel"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="WhatsApp (con código de país)"
                autoComplete="tel"
                aria-label="Número de WhatsApp"
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/74 focus:outline-none focus:border-violet-2/60 transition"
              />
            </Field>
          )}

          {mode !== "forgot" && (
            <Field icon={<Lock className="w-4 h-4" />} error={fieldErrors.password}>
              <input
                type="password"
                required
                minLength={mode === "login" ? 6 : 8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "login" ? "Contraseña" : "Contraseña (mín. 8 caracteres)"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                aria-label="Contraseña"
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/74 focus:outline-none focus:border-violet-2/60 transition"
              />
            </Field>
          )}

          {(mode === "signup" || mode === "update") && (
            <Field icon={<Lock className="w-4 h-4" />} error={fieldErrors.confirm}>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirmar contraseña"
                autoComplete="new-password"
                aria-label="Confirmar contraseña"
                className="w-full pl-10 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/74 focus:outline-none focus:border-violet-2/60 transition"
              />
            </Field>
          )}

          {mode === "signup" && (
            <div>
              <label className="flex items-start gap-2 text-xs text-white/70 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => setTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-red-accent"
                />
                <span>Acepto los términos y condiciones</span>
              </label>
              {fieldErrors.terms && (
                <p className="mt-1 text-[11px] text-red-accent">{fieldErrors.terms}</p>
              )}
            </div>
          )}

          {mode === "login" && (
            <button
              type="button"
              onClick={() => changeMode("forgot")}
              className="text-xs text-violet-2 hover:text-white block ml-auto"
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}

          {error && (
            <p
              role="alert"
              className="text-xs text-red-accent bg-red-accent/10 border border-red-accent/30 rounded-lg px-3 py-2"
            >
              {error}
            </p>
          )}
          {info && (
            <p
              role="status"
              className="text-xs text-green-300 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2"
            >
              {info}
            </p>
          )}
          {canResendConfirmation && (
            <button
              type="button"
              onClick={handleResendConfirmation}
              disabled={loading}
              className="w-full text-xs font-medium text-violet-2 hover:text-white disabled:opacity-50 transition"
            >
              Reenviar correo de confirmación
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl gradient-violet text-white text-sm font-semibold hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed transition"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "login"
              ? "Entrar"
              : mode === "signup"
                ? "Crear cuenta"
                : mode === "forgot"
                  ? "Enviar enlace"
                  : "Guardar contraseña"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-white/70">
          {mode === "signup" ? (
            <>
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => changeMode("login")}
                className="text-violet-2 hover:text-white font-semibold"
              >
                Inicia sesión
              </button>
            </>
          ) : mode === "forgot" ? (
            <button
              type="button"
              onClick={() => changeMode("login")}
              className="text-violet-2 hover:text-white font-semibold"
            >
              ← Volver al inicio de sesión
            </button>
          ) : mode === "update" ? (
            <span>Contraseña restablecida mediante enlace seguro.</span>
          ) : (
            <>
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                onClick={() => changeMode("signup")}
                className="text-violet-2 hover:text-white font-semibold"
              >
                Regístrate
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

function Field({
  icon,
  error,
  children,
}: {
  icon: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/62 pointer-events-none">
          {icon}
        </div>
        {children}
      </div>
      {error && <p className="mt-1 text-[11px] text-red-accent px-1">{error}</p>}
    </div>
  );
}
