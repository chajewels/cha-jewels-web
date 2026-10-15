"use client";

import { Analytics } from "@vercel/analytics/react";
import { analyticsEnabled } from "@/lib/analytics";
import { useHydrated } from "@/components/analytics/use-hydrated";
import { redactUrl } from "@/lib/redact-url";

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

/** Moved to lib/redact-url.ts (plain TypeScript, so unit tests can import it); re-exported for existing importers. */
export { redactUrl };

export function AnalyticsProvider() {
  // Nothing until hydration is over: the server cannot see the host (use-hydrated.ts).
  const hydrated = useHydrated();
  if (!hydrated) return null;
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
