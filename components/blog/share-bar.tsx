"use client";

import { useEffect, useRef, useState } from "react";
import { type Lang } from "@/lib/i18n-core";
import { trOf } from "@/lib/i18n-client";
import { share as shareDict } from "@/lib/i18n/sections/share";
import { trackShare } from "@/lib/analytics";
import { SHARE_NETWORKS, buildShareUrl, withShareUtm, type ShareNetwork } from "@/lib/share";
import { Button } from "@/components/ui/button";
import { inputLight } from "@/lib/form-classes";

/**
 * SHARE BAR UNDER EVERY BLOG POST (owner S1–S7, 2026-10-16), articles and
 * news alike, both languages.
 *
 * Plain links to each platform's share page, opened in a new tab; nothing from
 * a third party loads on this page. `url` is the post's canonical URL in the
 * reader's language, built on the server (lib/share.ts postShareUrl) because
 * siteUrl() reads server-only environment.
 *
 * "Share…" opens the device's own share sheet and is drawn only after mount,
 * and only on a phone or tablet (`navigator.share` exists AND the pointer is
 * coarse) — the server cannot know, and a button that does nothing when
 * pressed is worse than no button.
 *
 * Copy link writes to the clipboard and says "Copied" for two seconds; where
 * the clipboard is unavailable or refused, the link is shown in a read-only
 * field, already selected, for the reader to copy by hand.
 */
export function ShareBar({ url, title, slug, lang }: { url: string; title: string; slug: string; lang: Lang }) {
  const t = trOf({ share: shareDict }, lang);
  const [canNative, setCanNative] = useState(false);
  const [copied, setCopied] = useState(false);
  const [manual, setManual] = useState<string | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // navigator.share alone is not "a phone": desktop Chrome, Edge and Safari
    // expose it too. The owner's rule is phones only, so a touch-first pointer
    // is required as well.
    setCanNative(typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, []);

  useEffect(() => { if (manual) field.current?.select(); }, [manual]);

  async function copy() {
    trackShare("copy", slug);
    const link = withShareUtm(url, "copy");
    try {
      if (!navigator.clipboard?.writeText) throw new Error("no clipboard");
      await navigator.clipboard.writeText(link);
      setManual(null);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setManual(link);
    }
  }

  async function native() {
    trackShare("native", slug);
    try {
      await navigator.share({ title, url: withShareUtm(url, "native") });
    } catch {
      // Dismissed by the reader, or refused by the browser: nothing to say.
    }
  }

  const btn = "min-h-11 w-full px-4 py-2 text-sm sm:w-auto";

  return (
    <section aria-labelledby="share-h" className="mt-12">
      <h2 id="share-h" className="text-xs uppercase tracking-[0.14em] text-charcoal/70 [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.05em]">{t("share", "h")}</h2>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {SHARE_NETWORKS.map((n) => (
          <li key={n}>
            <Button asChild variant="outline" className={btn}>
              <a
                href={buildShareUrl(n, url, title)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t("share", `${n}A`)}
                onClick={() => trackShare(n, slug)}
              >
                <Glyph network={n} />
                {t("share", n)}
              </a>
            </Button>
          </li>
        ))}
        <li>
          <Button type="button" variant="outline" className={btn} onClick={copy} aria-label={copied ? t("share", "copied") : t("share", "copyA")}>
            <Glyph network="copy" />
            {copied ? t("share", "copied") : t("share", "copy")}
          </Button>
        </li>
        {canNative && (
          <li>
            <Button type="button" variant="outline" className={btn} onClick={native} aria-label={t("share", "nativeA")}>
              <Glyph network="native" />
              {t("share", "native")}
            </Button>
          </li>
        )}
      </ul>
      <p role="status" className="sr-only">{copied ? t("share", "copied") : ""}</p>
      {manual && (
        <div className="mt-3">
          <label htmlFor="share-link" className="text-xs text-charcoal/70">{t("share", "manual")}</label>
          <input
            id="share-link" ref={field} type="text" readOnly value={manual}
            onFocus={(e) => e.currentTarget.select()}
            className={`mt-1 w-full rounded-[14px] px-3.5 py-2 text-sm ${inputLight}`}
          />
        </div>
      )}
    </section>
  );
}

/**
 * Small brand-neutral marks — a letter, a bubble, a phone, an "@", a link, an
 * arrow — not the platforms' logo artwork. Decorative: the button names itself.
 */
function Glyph({ network }: { network: ShareNetwork | "copy" | "native" }) {
  const common = { width: 16, height: 16, viewBox: "0 0 16 16", "aria-hidden": true, focusable: false, className: "shrink-0" } as const;
  const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  switch (network) {
    case "facebook":
      return <svg {...common}><text x="8" y="12.5" textAnchor="middle" fontSize="13" fontWeight="700" fill="currentColor" fontFamily="Arial, sans-serif">f</text></svg>;
    case "x":
      return <svg {...common}><path {...stroke} d="M3.5 3.5l9 9M12.5 3.5l-9 9" /></svg>;
    case "line":
      return <svg {...common}><path {...stroke} d="M8 2.75c-3.3 0-5.75 2.05-5.75 4.6 0 2.3 2 4.15 4.75 4.5l-.5 2.15 2.9-2.1c2.55-.35 4.35-2.2 4.35-4.55 0-2.55-2.45-4.6-5.75-4.6z" /></svg>;
    case "whatsapp":
      return <svg {...common}><rect {...stroke} x="4.5" y="1.75" width="7" height="12.5" rx="1.5" /><path {...stroke} d="M7 12h2" /></svg>;
    case "threads":
      return <svg {...common}><text x="8" y="12.5" textAnchor="middle" fontSize="13" fill="currentColor" fontFamily="Arial, sans-serif">@</text></svg>;
    case "copy":
      return <svg {...common}><path {...stroke} d="M6.75 9.25l2.5-2.5M7.5 4.75l1-1a2.47 2.47 0 013.5 3.5l-1 1M8.5 11.25l-1 1a2.47 2.47 0 01-3.5-3.5l1-1" /></svg>;
    case "native":
      return <svg {...common}><path {...stroke} d="M8 10V2.5M5.25 5.25L8 2.5l2.75 2.75M4 8v5.25h8V8" /></svg>;
  }
}
