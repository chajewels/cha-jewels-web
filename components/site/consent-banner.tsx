"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CONSENT_OPEN_EVENT, openConsent, writeConsent } from "@/lib/consent";
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
    <section role="region" aria-label={copy.region} data-consent-banner className="consent-banner border border-hairline bg-white p-5 text-charcoal shadow-[0_8px_28px_rgb(35_29_18/18%)] lg:rounded-sm">
      <h2 id="cj-consent-title" ref={heading} tabIndex={-1} className="font-display text-[18px] font-medium text-charcoal-deep outline-none">{copy.title}</h2>
      <p className="mt-2 text-[14px] leading-relaxed">
        {copy.body}{" "}
        <Link href={privacyHref} className="font-medium text-gold-dark underline underline-offset-2 hover:text-charcoal-deep">{copy.privacy}</Link>
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" className="min-h-11 px-3" onClick={() => choose("granted")}>{copy.accept}</Button>
        <Button type="button" variant="outline" className="min-h-11 px-3" onClick={() => choose("denied")}>{copy.necessary}</Button>
      </div>
    </section>
  );
}

/** "Cookie settings" in the footer: reopens the banner. */
export function CookieSettingsLink({ label, className }: { label: string; className?: string }) {
  return (
    <button type="button" className={className} onClick={openConsent}>
      {label}
    </button>
  );
}
