"use client";

import { useEffect, useState } from "react";
import { type Lang } from "@/lib/i18n-core";
import { social as socialDict } from "@/lib/i18n/sections/social";
import { support as supportDict } from "@/lib/i18n/sections/support";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/lumiere/common/reveal-text";
import { MessengerCta } from "@/components/site/support-stage";

/**
 * THE ERROR PAGE (build step 6, new; comp page-comps/supporting "error").
 * Shown when a page throws (a Hub outage on a page that needs the Hub). The
 * same empty stage as the 404, in the same voice, with "Try again" and
 * Messenger. Wording D6-1 (new, owner-reviewed on the preview).
 *
 * A client boundary cannot read the Hub or the language cookie on the server,
 * so it reads what the layout already rendered: <html lang> for the language
 * and <main data-messenger> for the Hub's Messenger link (no link, no button).
 * The site header and footer stay: this replaces only the page body.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const [lang, setLang] = useState<Lang>(() => (typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "ja"));
  const [messenger, setMessenger] = useState<string | null>(null);

  useEffect(() => {
    setLang(document.documentElement.lang === "en" ? "en" : "ja");
    setMessenger(document.getElementById("main")?.dataset.messenger || null);
    console.error(error);
  }, [error]);

  const s = supportDict;
  return (
    <section className="iac-oops">
      <div className="wrap">
        <h1 className="lm-h1"><Reveal>{s.errorH[lang]}</Reveal></h1>
        <p className="iac-oops__lead">{s.errorP[lang]}</p>
        <div className="iac-oops__acts">
          <Button type="button" onClick={() => reset()}>{s.retry[lang]}</Button>
          {messenger && <MessengerCta href={messenger} label={socialDict.messengerButton[lang]} />}
        </div>
      </div>
    </section>
  );
}
