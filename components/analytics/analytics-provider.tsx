"use client";

import { Analytics } from "@vercel/analytics/react";
import { analyticsEnabled } from "@/lib/analytics";

/**
 * Automatic page views, with the URL scrubbed before anything leaves the
 * browser.
 *
 * Vercel's own privacy documentation names the URL and the event data as the
 * two things that can carry personal data, so both are handled explicitly here
 * rather than assumed safe because the product is cookieless. "Cookieless" is a
 * statement about identifiers, not about what a URL contains: an auth token in
 * a query string is personal data whether or not a cookie was set.
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
  "/live/claim/",        // a single-use claim code is the last path segment
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

/** Exported for the test that proves the rules, not used elsewhere. */
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

export function AnalyticsProvider() {
  if (!analyticsEnabled()) return null;
  return (
    <Analytics
      beforeSend={(event) => {
        const url = redactUrl(event.url);
        return url === null ? null : { ...event, url };
      }}
    />
  );
}
