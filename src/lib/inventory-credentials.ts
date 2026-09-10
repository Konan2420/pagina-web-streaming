export type CredentialTemplate = "account" | "account_2fa" | "redeem_code" | "access_link" | "none";

export type InventoryCredentials = {
  email?: string | null;
  password?: string | null;
  profile?: string | null;
  two_factor_secret?: string | null;
  backup_codes?: string | null;
  redeem_code?: string | null;
  access_link?: string | null;
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

export function credentialTemplateLabel(template: CredentialTemplate) {
  switch (template) {
    case "account_2fa":
      return "email:password:2fa";
    case "access_link":
      return "link";
    case "redeem_code":
      return "Código de canje";
    case "none":
      return "Sin credenciales";
    default:
      return "email:password";
  }
}

export function inventoryFormatHint(template: CredentialTemplate) {
  switch (template) {
    case "account_2fa":
      return "correo:contraseña:secreto-2fa (o correo | contraseña | secreto 2FA | códigos)";
    case "redeem_code":
      return "código de canje";
    case "access_link":
      return "https://enlace-de-acceso";
    case "none":
      return "Este producto no necesita inventario de credenciales.";
    default:
      return "correo:contraseña (o correo | contraseña | perfil)";
  }
}

/** Parses one bulk row. Pipes preserve values that themselves contain colons. */
export function parseInventoryLine(
  line: string,
  template: CredentialTemplate,
): InventoryCredentials {
  const trimmed = line.trim();
  if (template === "redeem_code") return { redeem_code: trimmed };
  if (template === "access_link") return { access_link: trimmed };

  const pipeValues = trimmed.split("|").map((value) => value.trim());
  if (pipeValues.length > 1) {
    return template === "account_2fa"
      ? {
          email: pipeValues[0] || null,
          password: pipeValues[1] || null,
          two_factor_secret: pipeValues[2] || null,
          backup_codes: pipeValues[3] || null,
        }
      : {
          email: pipeValues[0] || null,
          password: pipeValues[1] || null,
          profile: pipeValues[2] || null,
        };
  }

  if (template === "account_2fa") {
    const values = trimmed.split(":").map((value) => value.trim());
    return {
      email: values[0] || null,
      password: values[1] || null,
      two_factor_secret: values[2] || null,
      backup_codes: values.slice(3).join(":") || null,
    };
  }

  const divider = trimmed.indexOf(":");
  return divider >= 0
    ? {
        email: trimmed.slice(0, divider).trim(),
        password: trimmed.slice(divider + 1).trim(),
      }
    : { email: trimmed || null, password: null };
}

export function validateInventoryCredentials(
  credentials: InventoryCredentials,
  template: CredentialTemplate,
) {
  if (template === "none") return "Este producto no requiere credenciales.";

  if (template === "redeem_code") {
    return credentials.redeem_code?.trim() ? null : "Ingresa un código de canje.";
  }

  if (template === "access_link") {
    try {
      const url = new URL(credentials.access_link?.trim() || "");
      return url.protocol === "https:" || url.protocol === "http:"
        ? null
        : "El enlace debe usar http o https.";
    } catch {
      return "Ingresa un enlace de acceso válido.";
    }
  }

  if (!credentials.email?.trim() || !/^\S+@\S+\.\S+$/.test(credentials.email.trim())) {
    return "Ingresa un correo válido.";
  }
  if (!credentials.password?.trim()) return "Ingresa una contraseña.";
  if (template === "account_2fa" && !credentials.two_factor_secret?.trim()) {
    return "Ingresa el secreto 2FA.";
  }
  return null;
}
