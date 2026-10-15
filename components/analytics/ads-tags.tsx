"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { analyticsEnabled } from "@/lib/analytics";
import { adsIds, adsLoadsOn, adsPageViewAllowed, googleConsent } from "@/lib/ads";
import { useHydrated } from "@/components/analytics/use-hydrated";
import { useConsent } from "@/components/analytics/use-consent";

/**
 * THE META PIXEL AND THE GOOGLE ADS TAG (owner rule 2026-10-15): NOTHING
 * ADVERTISING-RELATED LOADS OR FIRES UNTIL THE VISITOR PRESSES ACCEPT.
 *
 * The only file allowed to name either script (scripts/check-analytics.mjs
 * gate 9). It renders nothing unless ALL of these hold:
 *   - hydration is over (the server cannot see the host or localStorage),
 *   - analyticsEnabled(): a production deployment, not fixtures, not localhost,
 *   - the visitor's stored choice is "granted" (lib/consent.ts),
 *   - the path is not a customer's own page (/account/*, which holds pay-card),
 *   - both ids are configured (lib/ads.ts adsIds).
 * A preview, a fixture build or an unconfigured deployment therefore never
 * requests either script, whatever the visitor chose.
 *
 * WHAT IS SWITCHED OFF. Meta's history listener (`disablePushState`) and its
 * automatic event and metadata collection (`autoConfig`), and Google's
 * automatic page view on `config` — so the only page views are the ones
 * below, made only for a URL that passes the same rule as Metricool's.
 *
 * WITHDRAWAL. If the choice later becomes "denied" (Cookie settings), Google's
 * consent is updated to denied and no further call is made to either tag from
 * this site; lib/analytics.ts checks the choice before every event. A loaded
 * script cannot be unloaded; the next page load does not load it.
 */
const META_SRC = "https://connect.facebook.net/en_US/fbevents.js";
const googleSrc = (aw: string) => `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(aw)}`;

type Fn = ((...args: unknown[]) => void) & Record<string, unknown>;
type W = Window & { fbq?: Fn; _fbq?: Fn; gtag?: Fn; dataLayer?: unknown[] };

/** Meta's documented base-code stub, without its script tag (next/script loads it). */
function installFbq(w: W, pixel: string): void {
  if (!w.fbq) {
    const n = function (...args: unknown[]) {
      if (typeof n.callMethod === "function") (n.callMethod as (...a: unknown[]) => void)(...args);
      else (n.queue as unknown[][]).push(args);
    } as Fn;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    // Set before fbevents.js runs: no automatic PageView on pushState.
    n.disablePushState = true;
    w.fbq = n;
    if (!w._fbq) w._fbq = n;
  }
  w.fbq("set", "autoConfig", false, pixel);
  w.fbq("init", pixel);
}

/** gtag's documented stub. It must push the `arguments` object itself: gtag.js ignores arrays. */
function installGtag(w: W, aw: string): void {
  w.dataLayer = w.dataLayer ?? [];
  if (!w.gtag) {
    w.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      w.dataLayer!.push(arguments);
    } as Fn;
  }
  // Consent Mode: denied BEFORE gtag.js loads, then granted — this component
  // only runs after Accept, and the order is what Google's docs require.
  w.gtag("consent", "default", googleConsent("denied"));
  w.gtag("consent", "update", googleConsent("granted"));
  w.gtag("js", new Date());
  w.gtag("config", aw, { send_page_view: false });
}

/** The path last reported, at module scope like Metricool's: one page, one hit. */
let lastReported: string | null = null;
/** Whether the stubs were installed in this document (survives a remount). */
let installed = false;
/** The Google consent state last pushed, so each change is pushed once. */
let googleState: "granted" | "denied" | null = null;

export function AdsTags() {
  const hydrated = useHydrated();
  const consent = useConsent();
  const pathname = usePathname();
  const ids = hydrated ? adsIds() : null;
  // Strings, not the object: adsIds() builds a new one each render.
  const pixel = ids?.pixel ?? null;
  const aw = ids?.aw ?? null;
  const enabled = hydrated && analyticsEnabled() && pixel !== null && aw !== null;
  const granted = consent === "granted";
  const [ready, setReady] = useState(installed);

  // Install once, the first time everything allows it.
  useEffect(() => {
    if (installed || !enabled || !granted || !pixel || !aw || !adsLoadsOn(pathname)) return;
    try {
      const w = window as W;
      installFbq(w, pixel);
      installGtag(w, aw);
      installed = true;
      googleState = "granted";
      setReady(true);
    } catch {
      // Advertising never throws into the page.
    }
  }, [enabled, granted, pixel, aw, pathname]);

  // Follow a later change of mind on this page.
  useEffect(() => {
    if (!installed || consent === "unknown") return;
    const next = granted ? "granted" : "denied";
    if (next === googleState) return;
    googleState = next;
    try {
      (window as W).gtag?.("consent", "update", googleConsent(next));
    } catch {
      // As above.
    }
  }, [consent, granted]);

  // One page view per path, only for a clean URL, only while granted.
  useEffect(() => {
    if (!ready || !granted || !aw || lastReported === pathname) return;
    lastReported = pathname; // A skipped page counts as handled: it stays skipped.
    if (!adsPageViewAllowed(window.location.href)) return;
    try {
      const w = window as W;
      w.fbq?.("track", "PageView");
      w.gtag?.("event", "page_view", { send_to: aw });
    } catch {
      // As above.
    }
  }, [ready, granted, aw, pathname]);

  if (!enabled || !granted || !aw || !ready) return null;
  if (!adsLoadsOn(pathname)) return null;
  return (
    <>
      <Script id="cj-meta-pixel" src={META_SRC} strategy="afterInteractive" />
      <Script id="cj-google-ads" src={googleSrc(aw)} strategy="afterInteractive" />
    </>
  );
}
