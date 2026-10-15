import { reportableUrl } from "@/lib/redact-url";

/**
 * THE ADVERTISING TAGS' RULES, pure (owner rule 2026-10-15). The Meta Pixel and
 * the Google Ads tag load only after the visitor presses Accept on the cookie
 * banner (lib/consent.ts), and only through components/analytics/ads-tags.tsx —
 * the one file allowed to name their script URLs. This module decides
 * everything that can be decided without a browser, so it can be tested.
 *
 * WHAT THEY RECEIVE: pages viewed, a product viewed or added to the cart (by
 * SKU), a search term, the start of a checkout, and that an order was placed
 * with its amount and currency. Never a name, an email, an address, or the
 * order's reference number (owner 2026-10-15: no `transaction_id`, so the
 * privacy policy's "never your order number" stays literally true).
 *
 * No browser-side maths: every amount is the Hub's figure, passed through.
 */

export type AdsIds = { pixel: string; aw: string };

const PIXEL_ID = /^\d{5,20}$/;
const AW_ID = /^AW-\d{5,20}$/;
const LABEL = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * Both ids, or null. BOTH must be set (and well-formed — they go into a script
 * URL): a half-configured deployment loads neither, so the banner's promise
 * ("the Meta Pixel and the Google Ads tag") is never half true. The env reads
 * are literal so Next inlines them into the client bundle.
 */
export function adsIds(
  pixel: string | undefined = process.env.NEXT_PUBLIC_META_PIXEL_ID,
  aw: string | undefined = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
): AdsIds | null {
  const p = pixel?.trim() ?? "";
  const a = aw?.trim() ?? "";
  return PIXEL_ID.test(p) && AW_ID.test(a) ? { pixel: p, aw: a } : null;
}

/** The Google Ads purchase conversion label, or null when unset or malformed. */
export function purchaseLabel(label: string | undefined = process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL): string | null {
  const l = label?.trim() ?? "";
  return LABEL.test(l) ? l : null;
}

/**
 * Whether the tags may be loaded on a first render at this path. Never on a
 * customer's own pages: /account/* (which contains the pay-card page, whose
 * enforced CSP with 'strict-dynamic' must keep every third-party script off the
 * card form — PCI DSS SAQ A, the same rule as lib/metricool.ts).
 */
export function adsLoadsOn(pathname: string | null | undefined): boolean {
  const p = pathname ?? "";
  return !(p === "/account" || p.startsWith("/account/"));
}

/**
 * Whether a page view may be reported for this URL. Both tags send the page's
 * own URL as it stands, so — exactly like Metricool — a page is reported only
 * when its URL is already clean (lib/redact-url.ts reportableUrl): no sign-in
 * token, no account page, no order confirmation, no stray parameter.
 */
export const adsPageViewAllowed = (href: string): boolean => reportableUrl(href);

/** The consent map Google's Consent Mode takes; every signal moves together. */
export function googleConsent(state: "granted" | "denied") {
  return { ad_storage: state, ad_user_data: state, ad_personalization: state, analytics_storage: state } as const;
}

export type Purchase = { value: number; currency: string };

/**
 * The Hub's own total and currency from a pay result, or null when it has no
 * usable figure. Full payment, draft and layaway results all carry `total` and
 * `currency`; a full-payment result from a Hub predating peso settlement carries
 * only `total_jpy`, which was then the whole of it. Chosen, never computed.
 */
export function purchaseFromPayResult(r: { total?: number | null; total_jpy?: number | null; currency?: string | null }): Purchase | null {
  const hasTotal = typeof r.total === "number";
  const value = hasTotal ? r.total : r.total_jpy;
  const currency = hasTotal ? r.currency ?? "JPY" : "JPY";
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  if (!/^[A-Z]{3}$/.test(currency)) return null;
  return { value, currency };
}

/** One call to make on `fbq` or `gtag`, as its argument list. */
export type TagCall = { tag: "fbq" | "gtag"; args: unknown[] };

/**
 * The calls a placed order makes: Meta's Purchase always; Google's conversion
 * only when a purchase label is configured. No transaction_id (see above).
 */
export function purchaseCalls(p: Purchase, aw: string, label: string | null): TagCall[] {
  const calls: TagCall[] = [{ tag: "fbq", args: ["track", "Purchase", { value: p.value, currency: p.currency }] }];
  if (label) calls.push({ tag: "gtag", args: ["event", "conversion", { send_to: `${aw}/${label}`, value: p.value, currency: p.currency }] });
  return calls;
}
