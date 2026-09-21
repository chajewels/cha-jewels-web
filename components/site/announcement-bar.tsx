"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";

/**
 * The announcement strip above the header.
 *
 * WHAT IT IS FOR: one owner-written sentence — holiday shipping dates, a
 * closure, a live sale — set in the Hub and read through lib/settings.ts. The
 * decision to render it at all is made on the SERVER (app/layout.tsx): active,
 * non-empty in this reader's language, not past its end date, and not on
 * /legal/*. Nothing here re-checks any of that; by the time this mounts the
 * only remaining question is whether this visitor has already dismissed it.
 *
 * DISMISSED PER SESSION, KEYED ON THE TEXT. `sessionStorage` rather than
 * `localStorage`: closing a notice means "I have read this one", not "never
 * show me anything again", and the next visit is a new conversation. The
 * dismissed TEXT is what is stored, not a boolean, so the next announcement
 * appears even for someone who closed the last one — a flag would silently
 * hide every future notice from exactly the people who engage with them.
 *
 * Every storage access is wrapped: Safari's private mode throws on write, some
 * managed browsers block it outright, and a bar that crashes the page it sits
 * on is worse than a bar that forgets it was closed.
 *
 * THE INLINE SCRIPT is the reason there is no flash. Hiding on mount would
 * paint the bar, then remove it, and shove the whole page up by 40px in front
 * of the reader on every hard navigation. The script runs during parse, before
 * first paint, and sets an attribute on <html> that the CSS in globals.css
 * hides the bar from. It writes nothing React owns — the same pattern a theme
 * toggle uses — so hydration is untouched, and the effect below then brings
 * React's own state into line.
 */
const STORAGE_KEY = "cj-announcement-dismissed";

/** Runs during HTML parse. Kept to one expression so it cannot outgrow review. */
const PREPAINT = `try{if(sessionStorage.getItem(${JSON.stringify(STORAGE_KEY)})===document.currentScript.dataset.t)document.documentElement.setAttribute("data-cj-announcement","dismissed")}catch(e){}`;

export function AnnouncementBar({ text, href, lang }: { text: string; href: string | null; lang: Lang }) {
  const t = tr(lang);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === text) setDismissed(true);
    } catch {
      // No storage: the bar simply shows. That is the safe direction.
    }
  }, [text]);

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, text);
    } catch {
      // The bar still closes for this page view; it just comes back on the next.
    }
    // Clear the pre-paint attribute's counterpart so a later announcement in the
    // same session is not hidden by a stale flag on <html>.
    document.documentElement.setAttribute("data-cj-announcement", "dismissed");
  }

  if (dismissed) return null;

  return (
    <>
      <div
        data-cj-announcement-bar
        className="bg-charcoal-deep text-chalk"
      >
        <div className="wrap flex items-center justify-center gap-3 py-2.5">
          <p className="text-center text-[13px] leading-snug">
            {href ? (
              // The sentence IS the link when there is somewhere to go. An
              // added "learn more" would be copy nobody wrote, in a language
              // nobody chose — the owner writes one line and it either points
              // somewhere or it does not.
              <Link href={href} className="text-orange underline underline-offset-4 hover:text-orange-hover">
                {text}
              </Link>
            ) : (
              text
            )}
          </p>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t("announcement", "dismiss")}
            className="-mr-1 shrink-0 rounded-full p-1 text-chalk/75 transition-colors hover:text-chalk focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-pale"
          >
            <X size={16} strokeWidth={1.8} aria-hidden="true" />
          </button>
        </div>
      </div>
      <script data-t={text} dangerouslySetInnerHTML={{ __html: PREPAINT }} />
    </>
  );
}
