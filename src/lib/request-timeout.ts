/**
 * Límite común para solicitudes iniciadas por la interfaz.
 *
 * No cancela una operación de escritura que ya llegó al servidor: solamente
 * libera la interfaz y ofrece una acción clara al usuario. Las operaciones
 * de servidor siguen siendo idempotentes y deben validar sus datos allí.
 */
export const UI_REQUEST_TIMEOUT_MS = 18_000;

export class RequestTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs = UI_REQUEST_TIMEOUT_MS) {
    super("La solicitud tardó demasiado tiempo. Revisa tu conexión e inténtalo nuevamente.");
    this.name = "RequestTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

export function isRequestTimeoutError(error: unknown): error is RequestTimeoutError {
  return error instanceof RequestTimeoutError;
}

/** Espera una promesa con un plazo visible y consistente para la UI. */
export function withRequestTimeout<T>(
  promise: PromiseLike<T>,
  timeoutMs = UI_REQUEST_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new RequestTimeoutError(timeoutMs)), timeoutMs);
  });

  return Promise.race([Promise.resolve(promise), timeout]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}
