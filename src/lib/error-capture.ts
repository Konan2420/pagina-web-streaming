// Captures the original Error out-of-band so server.ts can recover the stack
// when h3 has already swallowed the throw into a generic 500 Response.

let lastCapturedError: { error: unknown; at: number } | undefined;
const TTL_MS = 5_000;

/**
 * A closed tab, navigation, reload or HMR refresh kills in-flight sockets and
 * Node emits `Error: aborted` (abortIncoming / ECONNRESET / ECONNABORTED).
 * The client is already gone, so this is noise — never record or report it.
 */
export function isRequestAbortError(error: unknown): boolean {
  if (error == null) return false;
  const err = error as { name?: string; message?: string; code?: string; cause?: unknown };
  const message = typeof err.message === "string" ? err.message.toLowerCase() : "";
  if (
    err.name === "AbortError" ||
    message === "aborted" ||
    message.includes("aborted") ||
    err.code === "ECONNRESET" ||
    err.code === "ECONNABORTED" ||
    err.code === "ABORT_ERR"
  ) {
    return true;
  }
  return err.cause != null && err.cause !== error ? isRequestAbortError(err.cause) : false;
}

function record(error: unknown) {
  if (isRequestAbortError(error)) return;
  lastCapturedError = { error, at: Date.now() };
}

if (typeof globalThis.addEventListener === "function") {
  globalThis.addEventListener("error", (event) => {
    const err = (event as ErrorEvent).error ?? event;
    if (isRequestAbortError(err)) {
      // Prevent it bubbling up as an unhandled runtime error / blank screen.
      event.preventDefault?.();
      return;
    }
    record(err);
  });
  globalThis.addEventListener("unhandledrejection", (event) => {
    const reason = (event as PromiseRejectionEvent).reason;
    if (isRequestAbortError(reason)) {
      event.preventDefault?.();
      return;
    }
    record(reason);
  });
}

// Node dev server: socket aborts surface as process-level uncaught errors.
// Vite registers its own uncaughtException listener, so filtering only inside
// our listener is not enough — the event is intercepted at process.emit so no
// other listener (or the editor's error overlay) ever sees "Error: aborted".
const proc = (globalThis as { process?: NodeJS.Process }).process;
if (
  proc &&
  typeof proc.on === "function" &&
  !(proc as unknown as { __abortGuard?: boolean }).__abortGuard
) {
  (proc as unknown as { __abortGuard?: boolean }).__abortGuard = true;

  const originalEmit = proc.emit.bind(proc) as (event: string, ...args: unknown[]) => boolean;
  (proc as unknown as { emit: unknown }).emit = function patchedEmit(
    event: string,
    ...args: unknown[]
  ) {
    if (
      (event === "uncaughtException" || event === "unhandledRejection") &&
      isRequestAbortError(args[0])
    ) {
      return true; // swallow: the client is already gone
    }
    return originalEmit(event, ...args);
  };

  proc.on("uncaughtException", (error: unknown) => {
    if (isRequestAbortError(error)) return;
    console.error(error);
  });
  proc.on("unhandledRejection", (reason: unknown) => {
    if (isRequestAbortError(reason)) return;
    console.error(reason);
  });
}

export function consumeLastCapturedError(): unknown {
  if (!lastCapturedError) return undefined;
  if (Date.now() - lastCapturedError.at > TTL_MS) {
    lastCapturedError = undefined;
    return undefined;
  }
  const { error } = lastCapturedError;
  lastCapturedError = undefined;
  return error;
}
