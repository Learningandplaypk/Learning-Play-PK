/**
 * Priority support — WhatsApp deep link.
 * Number comes from NEXT_PUBLIC_SUPPORT_WHATSAPP (digits only, e.g. 923001234567).
 * Returns null when unset so the UI can hide the link instead of linking nowhere.
 */

export function supportWhatsAppNumber(): string | null {
  const raw = (process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "").replace(/[^\d]/g, "");
  return raw.length >= 10 ? raw : null;
}

export function supportWhatsAppUrl(message = "Salam! Mujhe madad chahiye."): string | null {
  const n = supportWhatsAppNumber();
  if (!n) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
