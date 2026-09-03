import { useCallback, useEffect, useState } from "react";
import { X, Mail, Lock, Loader2, User, UserPlus, Phone, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useRouter } from "@tanstack/react-router";
import { getAuthDestination } from "@/lib/auth-destination";
import { assertCurrentNetworkAllowed, getCurrentAccountAccess } from "@/lib/ban.functions";
import { suspensionFromError, suspensionUrl } from "@/lib/suspension-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
    if (typeof window === "undefined") return "/auth/callback";

    // El callback debe volver siempre al mismo origen que inició la
    // autenticación. Así no queda atado a un dominio antiguo configurado en
    // VITE_APP_URL y se comporta igual en local, preview y producción.
    return new URL("/auth/callback", window.location.origin).toString();
  };

  const getPasswordRecoveryRedirectUrl = () => {
    if (typeof window === "undefined") return "/reset-password";

    return new URL("/reset-password", window.location.origin).toString();
  };

  async function redirectToSuspension(notice: { type: "account" | "ip"; endsAt: string | null }) {
    await supabase.auth.signOut({ scope: "local" });
    window.location.assign(suspensionUrl(notice));
  }

  async function ensureNetworkAllowed() {
    try {
      await assertCurrentNetworkAllowed();
      return true;
    } catch (cause) {
      const suspension = suspensionFromError(cause);
      if (suspension) {
        await redirectToSuspension(suspension);
        return false;
      }
      throw cause;
    }
  }

  async function redirectForRole(userId: string) {
    const access = await getCurrentAccountAccess();
    if (!access.allowed) {
      await redirectToSuspension({ type: access.block === "ip" ? "ip" : "account", endsAt: access.endsAt });
      return;
    }
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
    setShowPassword(false);
    setShowConfirm(false);
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
        if (!(await ensureNetworkAllowed())) return;
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
        if (!(await ensureNetworkAllowed())) return;
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
          redirectTo: getPasswordRecoveryRedirectUrl(),
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
      if (!(await ensureNetworkAllowed())) return;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: getRedirectUrl(),
          skipBrowserRedirect: true,
        },
      });
      if (error) {
        throw error;
      }
      if (!data.url) {
        throw new Error("No se pudo iniciar la redirección a Google. Inténtalo nuevamente.");
      }
      track("login", { eventName: "google_oauth_redirect", metadata: { method: "google" } });
      window.location.assign(data.url);
    } catch (err: unknown) {
      const suspension = suspensionFromError(err);
      if (suspension) {
        await redirectToSuspension(suspension);
        return;
      }
      setError(getAuthErrorMessage(err));
      setLoading(false);
    }
  }

  const title =
    mode === "login"
      ? "Ingresa a tu cuenta"
      : mode === "signup"
        ? "Crea tu cuenta"
        : mode === "forgot"
          ? "Recupera tu contraseña"
          : "Nueva contraseña";
  const subtitle =
    mode === "login"
      ? "Ingresa tus credenciales para continuar"
      : mode === "signup"
        ? "Regístrate para disfrutar de CMD Streaming"
        : mode === "forgot"
          ? "Te enviaremos un enlace a tu correo"
          : "Crea una contraseña nueva y segura para tu cuenta";

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={() => closeModal()}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        aria-describedby="auth-modal-description"
        className="relative my-auto grid w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0f] shadow-[0_24px_80px_rgba(0,0,0,0.6)] lg:grid-cols-[1.04fr_0.96fr]"
      >
        <button
          type="button"
          onClick={() => closeModal()}
          disabled={loading}
          className="absolute right-3 top-3 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/65 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 sm:right-4 sm:top-4 sm:h-9 sm:w-9"
          aria-label="Cerrar"
        >
          <X className="h-4 w-4" />
        </button>

        <aside className="relative hidden min-h-[640px] overflow-hidden lg:flex lg:flex-col lg:justify-end">
          <img
            src="/landing/auth-platforms-collage.png"
            alt="Collage de contenidos de streaming, deportes, música y videojuegos"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-tr from-black/65 via-transparent to-black/30"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/45 to-transparent"
          />
        </aside>

        <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-[#0a0a0f] px-6 py-8 sm:px-10 sm:py-10 lg:max-h-[680px]">
          <div className="mx-auto w-full max-w-sm">
            <div className="mb-7 text-center lg:text-left">
              <img src="/cmd-logo.png" alt="CMD Streaming" className="mx-auto w-28 lg:mx-0" />
              <h2
                id="auth-modal-title"
                className="mt-7 text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]"
              >
                {title}
              </h2>
              <p id="auth-modal-description" className="mt-2 text-sm text-white/55">
                {subtitle}
              </p>
            </div>

            {mode !== "forgot" && mode !== "update" && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogle}
                  disabled={loading}
                  className="h-11 w-full rounded-xl border-white/15 bg-white/[0.03] text-sm font-semibold text-white hover:bg-white/[0.08] hover:text-white"
                >
                  <GoogleIcon />
                  Continuar con Google
                </Button>

                <div className="my-6 flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/35">
                    o
                  </span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              </>
            )}

            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <>
                  <Field
                    label="Nombre completo"
                    htmlFor="auth-name"
                    icon={<User className="h-4 w-4" />}
                    error={fieldErrors.nombre}
                  >
                    <input
                      id="auth-name"
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Nombre completo"
                      autoComplete="name"
                      aria-label="Nombre completo"
                      className="h-11 w-full rounded-xl border border-white/10 bg-[#12131d] py-2 pl-10 pr-3 text-sm text-white placeholder:text-white/35 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </Field>
                </>
              )}

              {mode !== "update" && (
                <Field
                  label={mode === "login" ? "Usuario o Email" : "Correo electrónico"}
                  htmlFor="auth-email"
                  icon={<Mail className="h-4 w-4" />}
                  error={fieldErrors.email}
                >
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    autoComplete={mode === "signup" ? "email" : "username"}
                    aria-label="Correo electrónico"
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#12131d] py-2 pl-10 pr-3 text-sm text-white placeholder:text-white/35 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </Field>
              )}

              {mode === "signup" && (
                <Field
                  label="WhatsApp"
                  htmlFor="auth-whatsapp"
                  icon={<Phone className="h-4 w-4" />}
                  error={fieldErrors.whatsapp}
                >
                  <input
                    id="auth-whatsapp"
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="WhatsApp (con código de país)"
                    autoComplete="tel"
                    aria-label="Número de WhatsApp"
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#12131d] py-2 pl-10 pr-3 text-sm text-white placeholder:text-white/35 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </Field>
              )}

              {mode !== "forgot" && (
                <Field
                  label="Contraseña"
                  htmlFor="auth-password"
                  icon={<Lock className="h-4 w-4" />}
                  error={fieldErrors.password}
                  trailing={
                    <PasswordToggle
                      visible={showPassword}
                      onClick={() => setShowPassword((visible) => !visible)}
                      label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    />
                  }
                >
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={mode === "login" ? 6 : 8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "login" ? "Contraseña" : "Contraseña (mín. 8 caracteres)"}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    aria-label="Contraseña"
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#12131d] py-2 pl-10 pr-11 text-sm text-white placeholder:text-white/35 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </Field>
              )}

              {(mode === "signup" || mode === "update") && (
                <Field
                  label="Confirmar contraseña"
                  htmlFor="auth-confirm"
                  icon={<Lock className="h-4 w-4" />}
                  error={fieldErrors.confirm}
                  trailing={
                    <PasswordToggle
                      visible={showConfirm}
                      onClick={() => setShowConfirm((visible) => !visible)}
                      label={showConfirm ? "Ocultar confirmación" : "Mostrar confirmación"}
                    />
                  }
                >
                  <input
                    id="auth-confirm"
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirmar contraseña"
                    autoComplete="new-password"
                    aria-label="Confirmar contraseña"
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#12131d] py-2 pl-10 pr-11 text-sm text-white placeholder:text-white/35 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                    <p className="mt-1 text-[11px] text-destructive">{fieldErrors.terms}</p>
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
                  className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2"
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

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-primary text-sm font-bold text-white shadow-[0_10px_28px_rgba(59,130,246,0.25)] transition hover:bg-brand-hover hover:shadow-[0_12px_30px_rgba(96,165,250,0.4)]"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "login"
                  ? "Iniciar sesión"
                  : mode === "signup"
                    ? "Crear cuenta"
                    : mode === "forgot"
                      ? "Enviar enlace"
                      : "Guardar contraseña"}
              </Button>

              {mode === "login" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => changeMode("signup")}
                  disabled={loading}
                  className="h-11 w-full rounded-xl border-white/15 bg-white/[0.03] text-sm font-semibold text-white transition hover:border-primary/60 hover:bg-primary/10 hover:text-white"
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                  Crear cuenta
                </Button>
              )}
            </form>

            {mode !== "login" && (
              <p className="mt-6 text-center text-xs text-white/50">
                {mode === "signup" ? (
                  <>
                    ¿Ya tienes cuenta?{" "}
                    <button
                      type="button"
                      onClick={() => changeMode("login")}
                      className="font-semibold text-primary hover:text-brand-hover"
                    >
                      Inicia sesión
                    </button>
                  </>
                ) : mode === "forgot" ? (
                  <button
                    type="button"
                    onClick={() => changeMode("login")}
                    className="font-semibold text-primary hover:text-brand-hover"
                  >
                    ← Volver al inicio de sesión
                  </button>
                ) : (
                  <span>Contraseña restablecida mediante enlace seguro.</span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  icon,
  error,
  trailing,
  children,
}: {
  label: string;
  htmlFor: string;
  icon: React.ReactNode;
  error?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-white/90">
        {label}
      </Label>
      <div className="relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
          {icon}
        </div>
        {trailing && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>}
        {children}
      </div>
      {error && <p className="mt-1 text-[11px] text-destructive px-1">{error}</p>}
    </div>
  );
}

function PasswordToggle({
  visible,
  onClick,
  label,
}: {
  visible: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={visible}
      className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-8 sm:w-8"
    >
      {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 48 48">
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
  );
}
