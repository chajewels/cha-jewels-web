"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { analyticsEnabled } from "@/lib/analytics";
import { reportableUrl } from "@/lib/redact-url";
import { useHydrated } from "@/components/analytics/use-hydrated";
import { metricoolLoadsOn } from "@/lib/metricool";

/**
 * Metricool web analytics: anonymous traffic statistics (pages visited,
 * referrer, window size) for the Metricool dashboard, next to the social
 * accounts it already reports on.
 *
 * The snippet Metricool supplies appends be.js to <head> and calls
 * `beTracker.t({hash})` once it has loaded. This is the same thing in
 * next/script form: the external src, then the init call in onLoad. The hash is
 * the brand's, copied exactly from that snippet.
 */
const METRICOOL_SRC = "https://tracker.metricool.com/resources/be.js";
const METRICOOL_HASH = "70bf26fd4e382804263bf49a03697654";

type BeTracker = { t: (opts: { hash: string }) => void };

/**
 * WHAT be.js SENDS: `t()` reads document.location.href itself, after our
 * options, so the URL cannot be redacted — we can only decide whether to call
 * it. A page is reported only when reportableUrl() (lib/redact-url.ts, shared
 * with the advertising tags) says its full URL is already clean.
 */

/**
 * The path last reported, at module scope so it survives a remount (and Strict
 * Mode's double effect): one page is one hit, however many times the effect
 * runs for it. A full page load clears it, and a fresh load is a fresh hit.
 */
let lastReported: string | null = null;

/**
 * be.js reports one page per `t()` call and knows nothing about client-side
 * navigation, so the call is made again whenever the path changes. A query-only
 * change (the ?lang= toggle) is not a new page, the same reading as
 * trackProductView's.
 */
export function MetricoolTracker() {
  const pathname = usePathname();
  // Only a trigger for the effect: whether be.js is there is read from window.
  const [ready, setReady] = useState(0);
  const hydrated = useHydrated();

  useEffect(() => {
    const tracker = (window as unknown as { beTracker?: BeTracker }).beTracker;
    if (!tracker || lastReported === pathname) return;
    lastReported = pathname; // A skipped page counts as handled: it stays skipped.
    if (!reportableUrl(window.location.href)) return;
    try {
      tracker.t({ hash: METRICOOL_HASH });
    } catch {
      // Analytics never throws into the page. See lib/analytics.ts.
    }
  }, [ready, pathname]);

  // Nothing until hydration is over: the server cannot see the host, so
  // rendering the script on the browser's first pass made its markup differ
  // from the server's (use-hydrated.ts, the cause of error #418).
  if (!hydrated) return null;
  // The layout already gates on a production build; this adds the browser-side
  // half of the same gate (localhost, `next start`, fixture mode).
  if (!analyticsEnabled()) return null;
  if (!metricoolLoadsOn(pathname)) return null;
  // onReady, not onLoad: next/script calls onLoad once per document, but this
  // component can mount again after that (a React remount, or an error
  // boundary rebuilding the tree), and a remounted copy waiting for onLoad
  // would never report another page. onReady runs after the load and on every
  // later mount.
  return <Script src={METRICOOL_SRC} strategy="afterInteractive" onReady={() => setReady((n) => n + 1)} />;
}
