import { billingCountryCode } from "@/lib/billing-countries";

/**
 * HOW AN ADDRESS IS SHOWN (WEB-2, 2026-10-05). The Hub stores an address as it
 * was typed; this only arranges and tidies it for reading — it never changes a
 * stored value and never guesses a missing part.
 *
 * Japan reads top-down, the way a Japanese address is written:
 *   〒124-0012 / 東京都 Katsushika-ku / 1-2-3 Tateishi, Room 4 / Japan
 * Everywhere else keeps the order the site used before:
 *   88 Ayala Ave / Makati Metro Manila 1226 / PH
 * A Japanese postal code of seven digits gets its hyphen (1240012 → 124-0012);
 * anything else is shown as typed.
 */
export type AddressParts = {
  line1?: string | null; line2?: string | null; city?: string | null;
  region?: string | null; postal_code?: string | null; country?: string | null;
};

const s = (v: unknown) => (typeof v === "string" ? v.normalize("NFKC").trim() : "");

/** 〒 and spaces stripped; seven digits → NNN-NNNN. Anything else returned trimmed, unchanged. */
export function jpPostal(v: string | null | undefined): string {
  const raw = s(v).replace(/^〒\s*/, "");
  const digits = raw.replace(/[\s-]/g, "");
  return /^\d{7}$/.test(digits) ? `${digits.slice(0, 3)}-${digits.slice(3)}` : raw;
}

export function isJapanAddress(a: AddressParts | null | undefined): boolean {
  return !!a && billingCountryCode(a.country) === "JP";
}

/** The address as display lines (no recipient name — callers show it themselves). */
export function addressLines(a: AddressParts | null | undefined): string[] {
  if (!a) return [];
  const street = [s(a.line1), s(a.line2)].filter(Boolean).join(", ");
  const country = s(a.country);
  if (isJapanAddress(a)) {
    const postal = jpPostal(a.postal_code);
    return [
      postal ? `〒${postal}` : "",
      [s(a.region), s(a.city)].filter(Boolean).join(" "),
      street,
      country,
    ].filter(Boolean);
  }
  return [street, [s(a.city), s(a.region), s(a.postal_code)].filter(Boolean).join(" "), country].filter(Boolean);
}
