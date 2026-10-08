/**
 * M3 (Square QC 2026-10-09): be.js is never even LOADED on a customer's own
 * pages. The pay-card page runs an enforced CSP with 'strict-dynamic' and is
 * reached by a full page load, so not rendering the script there keeps every
 * third-party script off the card page (PCI DSS SAQ A: the payment page must
 * not be open to script attacks). /account pages were never reported anyway.
 */
export function metricoolLoadsOn(pathname: string | null | undefined): boolean {
  const p = pathname ?? "";
  return !(p === "/account" || p.startsWith("/account/"));
}
