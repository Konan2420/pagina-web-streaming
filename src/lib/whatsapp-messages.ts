type CredentialsMessageInput = {
  customerName: string | null | undefined;
  productName: string;
  username: string | null | undefined;
  password: string | null | undefined;
  accessLink?: string | null;
  notes?: string | null;
  expirationDate?: string | null;
};

type ExpiryReminderInput = {
  customerName: string | null | undefined;
  productName: string;
  expirationDate: string | null | undefined;
};

function valueOrDash(value: string | null | undefined) {
  return value?.trim() || "—";
}

export function formatWhatsAppDate(value: string | null | undefined) {
  if (!value) return "No registrada";
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day, 12));
}

/** Centralized template for the human-assisted credential delivery. */
export function buildCredentialsWhatsAppMessage(input: CredentialsMessageInput) {
  const optionalDetails = [
    input.accessLink ? `🔗 Enlace: ${input.accessLink}` : null,
    input.notes ? `📝 Nota: ${input.notes}` : null,
  ].filter(Boolean);

  return [
    `Hola ${valueOrDash(input.customerName)},`,
    "",
    `✅ Tu compra de *${input.productName}* ya fue entregada.`,
    "",
    "🔐 *Credenciales de acceso*",
    `Usuario: ${valueOrDash(input.username)}`,
    `Contraseña: ${valueOrDash(input.password)}`,
    ...optionalDetails,
    "",
    `📅 Vencimiento: ${formatWhatsAppDate(input.expirationDate)}`,
    "",
    "Por seguridad, no compartas estas credenciales con terceros.",
    "CMD Streaming",
  ].join("\n");
}

/** Centralized template for upcoming-expiration reminders. */
export function buildExpiryReminderWhatsAppMessage(input: ExpiryReminderInput) {
  return [
    `Hola ${valueOrDash(input.customerName)},`,
    "",
    `Tu *${input.productName}* vence el *${formatWhatsAppDate(input.expirationDate)}*.`,
    "Recarga a tiempo para no perder el acceso.",
    "CMD Streaming",
  ].join("\n");
}
