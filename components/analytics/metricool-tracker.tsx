"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { analyticsEnabled } from "@/lib/analytics";
import { redactUrl } from "@/components/analytics/analytics-provider";

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
 * WHAT be.js SENDS, AND WHY SOME PAGES ARE NOT REPORTED
 * ----------------------------------------------------
 * The whole tracker (read 2026-09-27) is one function: `t()` sets
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
 */
function reportableUrl(href: string): boolean {
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

  // The layout already gates on a production build; this adds the browser-side
  // half of the same gate (localhost, `next start`, fixture mode).
  if (!analyticsEnabled()) return null;
  // onReady, not onLoad: next/script calls onLoad once per document, but this
  // component can mount again after that — React rebuilds the tree when
  // hydration fails, which it does on production today (error #418) — and a
  // remounted copy waiting for onLoad would never report another page.
  // onReady runs after the load and on every later mount.
  return <Script src={METRICOOL_SRC} strategy="afterInteractive" onReady={() => setReady((n) => n + 1)} />;
}
