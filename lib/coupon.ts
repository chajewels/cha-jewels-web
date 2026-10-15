/**
 * COUPON CODES (Hub la-tracking #527, owner 2026-10-15). One coupon per order,
 * off the pieces only, coupon first then points, layaway too. Every figure is
 * the Hub's (website_coupon_quote); this file only cleans what she types and
 * names the Hub's refusals. Pure: unit-tested in tests/checkout-coupon.test.mjs.
 */

/** The 409 refusals the Hub can give for a code (docs/WEBSITE-COUPONS.md in the Hub). */
export const COUPON_ERRORS = [
  "coupon_not_found", "coupon_inactive", "coupon_not_started", "coupon_expired", "coupon_exhausted",
  "coupon_customer_limit", "coupon_min_subtotal", "coupon_layaway_not_allowed", "coupon_full_price_only",
  "coupon_changed", "coupon_total_zero",
] as const;
export type CouponError = (typeof COUPON_ERRORS)[number];

export const COUPON_MAX_LENGTH = 20;
const COUPON_CODE = /^[A-Z0-9-]{1,20}$/;

export function isCouponError(code: string | null | undefined): code is CouponError {
  return typeof code === "string" && (COUPON_ERRORS as readonly string[]).includes(code);
}

/** The input box as she types: upper-cased, only A–Z 0–9 and "-", at most 20. */
export function couponTyped(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, COUPON_MAX_LENGTH);
}

/**
 * A code fit to send to the Hub: trimmed, spaces removed, upper-cased. null
 * when it is empty, longer than 20 or has any other character — never sent.
 */
export function normalizeCouponCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.replace(/\s+/g, "").toUpperCase();
  return COUPON_CODE.test(code) ? code : null;
}

/** The i18n key (checkout namespace) for a refusal, one per code: coupon_min_subtotal → couponMinSubtotal. */
export function couponErrorKey(code: CouponError): string {
  return code.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

/**
 * The coupon a draft, order or pay result carries, when it carries one: the
 * code and the Hub's discount in that record's currency. null when either is
 * absent (an older Hub, or no coupon) — then no "Coupon CODE" row is shown.
 */
export function appliedCoupon(r: { coupon_code?: string | null; coupon_discount?: number | null } | null | undefined): { code: string; discount: number } | null {
  const code = typeof r?.coupon_code === "string" ? r.coupon_code.trim() : "";
  const discount = Number(r?.coupon_discount ?? 0);
  return code !== "" && Number.isFinite(discount) && discount > 0 ? { code, discount } : null;
}

/** The choice block's coupon, when applied (not refused, not absent). */
export function choiceCoupon(c: { code: string; error: string | null; discount?: number } | null | undefined): { code: string; discount: number } | null {
  return c && c.error === null && typeof c.discount === "number" ? { code: c.code, discount: c.discount } : null;
}
