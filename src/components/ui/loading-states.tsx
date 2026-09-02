import { Loader2, RotateCcw, WifiOff } from "lucide-react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { isRequestTimeoutError } from "@/lib/request-timeout";

/** Indicador global, no bloqueante, para navegación y datos remotos. */
export function GlobalLoadingBar() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const navigationPending = useRouterState({ select: (state) => state.status === "pending" });
  const active = navigationPending || fetching > 0 || mutating > 0;

  return (
    <div
      aria-hidden={!active}
      aria-label={active ? "Cargando" : undefined}
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-red-accent/10 transition-opacity duration-200",
        active ? "opacity-100" : "opacity-0",
      )}
    >
      {active && <span className="cmd-loading-bar-indicator block h-full" />}
    </div>
  );
}

export function SectionLoadingState({
  label = "Cargando información…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-40 items-center justify-center gap-2 rounded-xl border border-red-accent/15 bg-red-accent/[0.035] px-5 text-sm text-white/65",
        className,
      )}
    >
      <Loader2 className="h-4 w-4 animate-spin text-red-300" aria-hidden="true" />
      {label}
    </div>
  );
}

export function QueryErrorState({
  error,
  title = "No se pudo cargar esta sección",
  onRetry,
  className,
}: {
  error: unknown;
  title?: string;
  onRetry: () => void;
  className?: string;
}) {
  const timedOut = isRequestTimeoutError(error);
  const detail = timedOut
    ? "La solicitud superó los 18 segundos. Revisa tu conexión y vuelve a intentarlo."
    : "No se modificó ningún dato. Puedes reintentar de forma segura.";

  return (
    <section
      role="alert"
      className={cn(
        "rounded-xl border border-red-accent/35 bg-red-accent/[0.07] p-5 text-center sm:p-7",
        className,
      )}
    >
      <WifiOff className="mx-auto h-5 w-5 text-red-300" aria-hidden="true" />
      <h2 className="mt-3 text-sm font-bold text-white">{title}</h2>
      <p className="mx-auto mt-1 max-w-xl text-xs leading-relaxed text-white/60">{detail}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-red-accent/50 px-3 text-xs font-bold text-red-100 transition hover:bg-red-accent/15 hover:text-white"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        Reintentar
      </button>
    </section>
  );
}
