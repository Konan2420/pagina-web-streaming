const PERU_COUNTRY_CODE = "51";

/**
 * Converts a saved Peruvian mobile number to the digits required by wa.me.
 * It accepts spaces, hyphens, parentheses and either an explicit +51 or a
 * local nine-digit mobile number.
 */
export function normalizePeruWhatsAppNumber(value: string | null | undefined): string | null {
  let digits = (value ?? "").replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);

  if (digits.startsWith(PERU_COUNTRY_CODE)) {
    return digits.length === 11 && /^519\d{8}$/.test(digits) ? digits : null;
  }

  return /^9\d{8}$/.test(digits) ? `${PERU_COUNTRY_CODE}${digits}` : null;
}

/** Returns a manual WhatsApp URL, or null when the stored number is invalid. */
export function createWhatsAppUrl(
  phone: string | null | undefined,
  message: string,
): string | null {
  const normalizedPhone = normalizePeruWhatsAppNumber(phone);
  if (!normalizedPhone || !message.trim()) return null;
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}

/** Opens the pre-filled WhatsApp conversation. A person must still press Send. */
export function openWhatsAppUrl(url: string | null) {
  if (!url || typeof window === "undefined") return false;
  const popup = window.open(url, "_blank", "noopener,noreferrer");
  return Boolean(popup);
}
