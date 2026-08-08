// Deploy-time feature flags.
//
// Ordering (cart + checkout) is disabled by default. To turn the store into a
// full shop later, set NEXT_PUBLIC_ENABLE_ORDERING=true in the web environment.
export const ENABLE_ORDERING = process.env.NEXT_PUBLIC_ENABLE_ORDERING === "true";

/**
 * Build a wa.me link for a WhatsApp number (digits only, international format).
 * Returns null when no number is configured.
 */
export function buildWhatsAppLink(
  number: string | undefined | null,
  message?: string | null
): string | null {
  if (!number) return null;
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
