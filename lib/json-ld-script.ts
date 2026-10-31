/**
 * Serialises JSON-LD data for an inline <script type="application/ld+json">.
 *
 * Why (security audit 2026-10-31, W-03): JSON.stringify does not escape "<",
 * and the data carries Hub text the site does not author: product names and
 * descriptions, FAQ answers, post titles and, on product pages, CUSTOMER
 * review text and names. A value containing "</script>" (or "<!--") would end
 * the script element early and let the rest run as page HTML/script. The
 * site-wide CSP is report-only outside the pay-card page, so nothing else
 * stops it.
 *
 * Every "<" becomes the JSON escape \u003c. That is the same JSON value, so
 * Google and every JSON parser read identical data (JSON.parse round-trips
 * exactly); only the raw bytes of the few strings that contain "<" change.
 * Nothing else is altered, so ordinary pages emit the same bytes as before.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
