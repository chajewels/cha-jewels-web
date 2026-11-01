"use client";

import { openConsent } from "@/lib/consent";

/**
 * "Cookie settings" in the footer: reopens the cookie banner. Its own module
 * (P2b): importing it from consent-banner.tsx carried the whole banner into
 * every page's first load, and the banner now arrives lazily
 * (components/site/consent-banner-lazy.tsx).
 */
export function CookieSettingsLink({ label, className }: { label: string; className?: string }) {
  return (
    <button type="button" className={className} onClick={openConsent}>
      {label}
    </button>
  );
}
