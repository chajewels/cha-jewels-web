"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CONSENT_OPEN_EVENT, writeConsent } from "@/lib/consent";
import { isPayCardPath } from "@/lib/csp";
import { isStatutoryPath } from "@/lib/statutory-path";
import { useConsent } from "@/components/analytics/use-consent";

/**
 * THE COOKIE BANNER (owner rule 2026-10-15): advertising loads only after
 * Accept. It asks once, while lib/consent.ts holds no choice, and again
 * whenever "Cookie settings" in the footer sends CONSENT_OPEN_EVENT.
 *
 * NEVER ASKS BY ITSELF on /legal/* (the statutory pages are read without
 * anything competing for the reader, the announcement bar's rule) or on the
 * pay-card page (the card form). "Cookie settings" still opens it there: that
 * is the visitor asking.
 *
 * TWO EQUAL BUTTONS. "Accept" and "Only necessary" are the same component, the
 * same variant and the same size, so neither is the easier one to press.
 *
 * Position and the tab-bar clearance are `.consent-banner` in app/globals.css:
 * on a phone it sits above whichever bottom bar the page has; from `lg` it is
 * a card at the bottom LEFT, so it never covers the Messenger button, which is
 * bottom right.
 *
 * A FULL-WIDTH BAR along the bottom at every width (`consent-banner--bar`,
 * app/lumiere/sections.css) — on the Lumière home since P2b item 4 (the
 * bottom-left card sat over the hero's standfirst, the collections lead and
 * the footer's company block) and on every page since P3, when the chrome
 * went site-wide. The hero band, the footer and the Messenger button lift
 * above the bar by its height (`--lm-consent`), so no control is ever under it.
 */
export type ConsentCopy = { region: string; title: string; body: string; accept: string; necessary: string; privacy: string };

export function ConsentBanner({ copy, privacyHref = "/legal/privacy" }: { privacyHref?: string; copy: ConsentCopy }) {
  const consent = useConsent();
  const path = usePathname() ?? "";
  const [opened, setOpened] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const open = () => setOpened(true);
    window.addEventListener(CONSENT_OPEN_EVENT, open);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, open);
  }, []);

  // Opened on request: take the reader there. Asked by itself: do not steal focus.
  useEffect(() => { if (opened) heading.current?.focus(); }, [opened]);

  // The statutory pages, prefixed by a locale or not (lib/statutory-path.ts).
  const quietHere = isStatutoryPath(path) || isPayCardPath(path);
  const asking = consent === "unset" && !quietHere;
  if (consent === "unknown" || (!asking && !opened)) return null;

  const choose = (ads: "granted" | "denied") => {
    writeConsent(ads);
    setOpened(false);
  };

  return (
    <section role="region" aria-label={copy.region} data-consent-banner className="consent-banner consent-banner--bar border border-border-muted bg-surface p-5 text-content shadow-[0_-8px_28px_rgb(0_0_0/10%)]">
      <h2 id="cj-consent-title" ref={heading} tabIndex={-1} className="font-serif text-[18px] text-content outline-none">{copy.title}</h2>
      <p className="mt-2 text-[14px] leading-relaxed">
        {copy.body}{" "}
        <Link href={privacyHref} className="font-medium text-content underline underline-offset-2 hover:opacity-70">{copy.privacy}</Link>
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" className="min-h-11 rounded-pill border-content px-3 font-manrope text-content hover:bg-content hover:text-content-inverse" onClick={() => choose("granted")}>{copy.accept}</Button>
        <Button type="button" variant="outline" className="min-h-11 rounded-pill border-content px-3 font-manrope text-content hover:bg-content hover:text-content-inverse" onClick={() => choose("denied")}>{copy.necessary}</Button>
      </div>
    </section>
  );
}

// "Cookie settings" lives in components/site/cookie-settings-link.tsx (P2b):
// a footer that imported it from here carried this whole module.
