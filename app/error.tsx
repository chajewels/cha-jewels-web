"use client";

import { useEffect, useState } from "react";
import { dict, type Lang } from "@/lib/i18n";
import { EmptyStage, MessengerCta } from "@/components/site/support-stage";

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

  const s = dict.support;
  return (
    <EmptyStage title={s.errorH[lang]} lede={s.errorP[lang]}>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="btn-press inline-flex min-h-12 items-center justify-center rounded-sm border border-chalk/55 px-6 py-3 text-[15px] font-medium text-chalk hover:border-chalk"
        >
          {s.retry[lang]}
        </button>
        {messenger && <MessengerCta href={messenger} label={dict.social.messengerButton[lang]} />}
      </div>
    </EmptyStage>
  );
}
