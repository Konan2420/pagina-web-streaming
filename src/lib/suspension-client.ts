export type SuspensionNotice = {
  type: "account" | "ip";
  endsAt: string | null;
};

export function suspensionUrl(notice: SuspensionNotice): string {
  const params = new URLSearchParams({ type: notice.type });
  if (notice.endsAt) params.set("until", notice.endsAt);
  return `/cuenta-suspendida?${params.toString()}`;
}

/** Traduce los errores deliberadamente genéricos del middleware a una pantalla segura. */
export function suspensionFromError(error: unknown): SuspensionNotice | null {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.startsWith("IP_ACCESS_BLOCKED")) return { type: "ip", endsAt: null };
  if (!message.startsWith("ACCOUNT_SUSPENDED")) return null;
  const [, endsAt] = message.split(":", 2);
  return { type: "account", endsAt: endsAt || null };
}
