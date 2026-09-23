"use client";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { analyticsEnabled } from "@/lib/analytics";
import { redactUrl } from "@/components/analytics/analytics-provider";

/**
 * Core Web Vitals (FCP, LCP, INP, CLS) from real visitors, under exactly the
 * rules Analytics follows: the same gate, so it is off on previews, fixture
 * mode and localhost, and the same URL scrubbing, so a vital reported from a
 * blocked path is dropped and every other URL loses its query and fragment.
 *
 * Kept as its own component rather than folded into <AnalyticsProvider/> so
 * the analytics check can assert both independently. This is the only file
 * allowed to import @vercel/speed-insights — an ungated mount elsewhere would
 * report from previews and send unredacted URLs.
 */
export function SpeedInsightsProvider() {
  if (!analyticsEnabled()) return null;
  return (
    <SpeedInsights
      beforeSend={(event) => {
        const url = redactUrl(event.url);
        return url === null ? null : { ...event, url };
      }}
    />
  );
}
