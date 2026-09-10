export type CredentialTemplate = "account" | "account_2fa" | "redeem_code" | "access_link" | "none";

export type OrderCredentialReceipt = {
  order_id: string;
  product_name: string;
  client_name: string;
  client_phone: string | null;
  expires_at: string | null;
  credential_template: string;
  supplier_name: string;
  supplier_whatsapp: string | null;
  email: string | null;
  password: string | null;
  profile: string | null;
  two_factor_secret: string | null;
  backup_codes: string | null;
  redeem_code: string | null;
  access_link: string | null;
  notes: string | null;
};

export type CredentialField = {
  id: string;
  label: string;
  value: string | null;
};

const credentialTemplates = new Set<CredentialTemplate>([
  "account",
  "account_2fa",
  "redeem_code",
  "access_link",
  "none",
]);

export function normalizeCredentialTemplate(value: string | null | undefined): CredentialTemplate {
  return credentialTemplates.has(value as CredentialTemplate)
    ? (value as CredentialTemplate)
    : "account";
}

export function credentialTemplateLabel(value: string | null | undefined) {
  switch (normalizeCredentialTemplate(value)) {
    case "account_2fa":
      return "Cuenta con verificación en dos pasos";
    case "redeem_code":
      return "Código de canje";
    case "access_link":
      return "Acceso mediante enlace";
    case "none":
      return "Sin credenciales de acceso";
    default:
      return "Cuenta de acceso";
  }
}

export function getCredentialFields(receipt: OrderCredentialReceipt): CredentialField[] {
  const template = normalizeCredentialTemplate(receipt.credential_template);

  switch (template) {
    case "account_2fa":
      return [
        { id: "email", label: "Correo / usuario", value: receipt.email },
        { id: "password", label: "Contraseña", value: receipt.password },
        { id: "two-factor", label: "Secreto TOTP", value: receipt.two_factor_secret },
        { id: "backup-codes", label: "Códigos de recuperación", value: receipt.backup_codes },
      ].filter((field) => field.value !== null && field.value !== "");
    case "redeem_code":
      return [{ id: "redeem-code", label: "Código de canje", value: receipt.redeem_code }];
    case "access_link":
      return [{ id: "access-link", label: "Enlace de acceso", value: receipt.access_link }];
    case "none":
      return [];
    default:
      return [
        { id: "email", label: "Correo / usuario", value: receipt.email },
        { id: "password", label: "Contraseña", value: receipt.password },
        { id: "profile", label: "Perfil", value: receipt.profile },
      ];
  }
}

export function formatOrderExpiry(value: string | null | undefined) {
  if (!value) return "Sin vencimiento registrado";

  return new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(new Date(value))
    .replace(",", "");
}

export function getSafeExternalUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function buildSupplierSupportMessage(receipt: OrderCredentialReceipt) {
  return [
    `Hola ${receipt.supplier_name}, necesito ayuda con ${receipt.product_name}.`,
    `Pedido: #${receipt.order_id.slice(0, 8)}.`,
  ].join("\n");
}

export function buildSecureCredentialsMessage(receipt: OrderCredentialReceipt, secureLink: string) {
  return [
    `Hola ${receipt.client_name},`,
    "",
    `✅ Tu compra de *${receipt.product_name}* fue confirmada.`,
    `📅 Vencimiento: ${formatOrderExpiry(receipt.expires_at)}.`,
    "",
    "🔐 Abre este enlace seguro de un solo uso para consultar tus credenciales:",
    secureLink,
    "",
    "El enlace vence en 15 minutos. No lo compartas con terceros.",
  ].join("\n");
}
