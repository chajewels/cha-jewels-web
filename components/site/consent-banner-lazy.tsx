"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import type { ConsentCopy } from "@/components/site/consent-banner";

/**
 * THE COOKIE BANNER, ARRIVING IN IDLE (P2b, the second approved closer: the
 * chrome's client code deferred to idle). The banner reads the consent cookie
 * in the browser and renders nothing on the server either way, so nothing is
 * lost by mounting it after the page's first idle slot; what is gained is its
 * code leaving the hydration task. "Cookie settings" in the footer still opens
 * it — the open event is handled once the banner is mounted, and the footer
 * is below the fold by a long way.
 */
const ConsentBanner = dynamic(() => import("@/components/site/consent-banner").then((m) => m.ConsentBanner), { ssr: false });

const IDLE_TIMEOUT_MS = 2500;

export function ConsentBannerLazy(props: { privacyHref?: string; copy: ConsentCopy }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const run = () => setReady(true);
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(run, 300);
    return () => clearTimeout(id);
  }, []);
  return ready ? <ConsentBanner {...props} /> : null;
}
