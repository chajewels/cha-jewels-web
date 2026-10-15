/**
 * The URL rules every analytics surface shares (Vercel Analytics, Speed
 * Insights, Metricool, and the advertising tags). Lived in
 * components/analytics/analytics-provider.tsx until 2026-10-15; moved here,
 * unchanged, so a unit test can import it without JSX.
 *
 * Vercel's own privacy documentation names the URL and the event data as the
 * two things that can carry personal data. "Cookieless" is a statement about
 * identifiers, not about what a URL contains.
 */

/**
 * Paths whose URL cannot be made safe by dropping the query string, because the
 * sensitive part is in the path itself or the page only exists to carry a
 * secret. These emit NO page view at all.
 */
const BLOCKED_PREFIXES = [
  "/auth/",              // /auth/confirm carries ?token_hash= — a live sign-in token
  "/account",            // every /account/* path is customer-scoped; /account/orders/<id>
                         // and /account/layaway/<id> put an order identifier in the path
  "/checkout/complete/", // the order id is the last path segment
  "/login",              // ?error= and ?next= describe a specific person's sign-in attempt
];

/**
 * The only query parameters allowed to survive. Everything else is dropped —
 * an allowlist rather than a blocklist, so a parameter added later is private
 * by default instead of leaking until someone notices.
 *
 * `lang` is the site language; `mode` is "full" or "layaway" on /checkout.
 * Neither identifies a person.
 */
const ALLOWED_PARAMS = new Set(["lang", "mode"]);

export function redactUrl(raw: string): string | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null; // Unparseable: drop rather than forward something unexamined.
  }
  if (BLOCKED_PREFIXES.some((p) => u.pathname === p.replace(/\/$/, "") || u.pathname.startsWith(p))) {
    return null;
  }
  const kept = new URLSearchParams();
  u.searchParams.forEach((v, k) => { if (ALLOWED_PARAMS.has(k)) kept.set(k, v); });
  u.search = kept.toString();
  u.hash = ""; // Supabase returns tokens in the fragment on some flows.
  return u.toString();
}

/**
 * WHETHER A PAGE MAY BE REPORTED BY A SCRIPT THAT READS THE URL ITSELF
 * -------------------------------------------------------------------
 * Metricool's whole tracker (read 2026-09-27) is one function: `t()` sets
 * `u = document.location.href`, adds the window size and `document.referrer`,
 * and requests a 1×1 image from tracker.metricool.com with those as the query.
 * It sets `u` AFTER reading our options, so the URL cannot be redacted the way
 * <AnalyticsProvider/> redacts Vercel's — we can only decide whether to call it.
 *
 * So a page is reported only when its full URL is already clean: redactUrl()
 * (the same rules Vercel's events go through) must hand it back unchanged,
 * except that `utm_*` campaign tags are allowed through, because campaign
 * attribution is what Metricool is for and a utm tag names a campaign, not a
 * person. A sign-in link, an account page, an order confirmation, or a URL
 * carrying any other parameter is simply not counted.
 *
 * Used by Metricool (metricool-tracker.tsx) and by the advertising tags
 * (ads-tags.tsx), which both send document.location.href as it stands.
 */
export function reportableUrl(href: string): boolean {
  let u: URL;
  try {
    u = new URL(href);
  } catch {
    return false;
  }
  // Keys collected first: deleting inside forEach skips the entry after each one.
  [...u.searchParams.keys()].filter((k) => k.startsWith("utm_")).forEach((k) => u.searchParams.delete(k));
  // redactUrl() drops the fragment; an anchor like #main is harmless, a token is not.
  if (u.hash.includes("=")) return false;
  u.hash = "";
  const clean = u.toString();
  return redactUrl(clean) === clean;
}
