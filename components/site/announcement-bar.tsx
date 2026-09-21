"use client";

import { useEffect, useRef, useState } from "react";
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
 * first paint, and sets an attribute on <body> that the CSS in globals.css
 * hides the bar from; the effect below then brings React's own state into line.
 *
 * ON <body> RATHER THAN <html>, and this is the whole reason: React renders
 * both, so an attribute that appears before hydration is a mismatch it reports
 * and refuses to patch. The element carrying it therefore needs
 * `suppressHydrationWarning`, and <body> has no other attributes to lose — on
 * <html> the same suppression would also hide a wrong `lang`, which is a real
 * bug worth hearing about. See app/layout.tsx.
 *
 * IT ALSO PUBLISHES ITS OWN HEIGHT as `--announcement-h` on :root, because it
 * is not the only thing anchored to the top of the page: FlashNotice is
 * `fixed` under the header and was landing ON the header whenever this bar was
 * shown. The variable is the bar's measured height while it is mounted and 0px
 * the rest of the time, so nothing has to hardcode a number that changes when
 * the sentence wraps to two lines at 375px.
 */
const STORAGE_KEY = "cj-announcement-dismissed";

/** Read by FlashNotice (and anything else pinned under the header). */
const HEIGHT_VAR = "--announcement-h";

/** Runs during HTML parse. Kept to one expression so it cannot outgrow review. */
const PREPAINT = `try{if(sessionStorage.getItem(${JSON.stringify(STORAGE_KEY)})===document.currentScript.dataset.t)document.body.setAttribute("data-cj-announcement","dismissed")}catch(e){}`;

export function AnnouncementBar({ text, href, lang }: { text: string; href: string | null; lang: Lang }) {
  const t = tr(lang);
  const [dismissed, setDismissed] = useState(false);
  const bar = useRef<HTMLElement>(null);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === text) setDismissed(true);
    } catch {
      // No storage: the bar simply shows. That is the safe direction.
    }
  }, [text]);

  /**
   * MEASURED, NOT ASSUMED. The bar is one line at 1440 and two at 375, and a
   * constant here would be wrong at one of those widths the day someone writes
   * a longer sentence. A ResizeObserver also catches the rotate and the font
   * swap, both of which change the height after the first paint.
   *
   * The cleanup is the important half: it runs on dismiss as well as unmount,
   * so the variable goes back to 0px the moment the bar leaves and nothing is
   * left offset by a strip that is no longer there.
   */
  useEffect(() => {
    const el = bar.current;
    const root = document.documentElement;
    if (dismissed || !el) {
      root.style.setProperty(HEIGHT_VAR, "0px");
      return;
    }
    const publish = () => root.style.setProperty(HEIGHT_VAR, `${el.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.setProperty(HEIGHT_VAR, "0px");
    };
  }, [dismissed]);

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, text);
    } catch {
      // The bar still closes for this page view; it just comes back on the next.
    }
    // Keep the pre-paint flag in step, so a client-side navigation that
    // re-renders this layout does not paint the bar again.
    document.body.setAttribute("data-cj-announcement", "dismissed");
  }

  if (dismissed) return null;

  return (
    <>
      {/* An <aside>, not a <div>: it is a complementary landmark, so the
          sentence is inside one. Content outside every landmark is what axe's
          `region` rule reports, and a strip bolted above the header is exactly
          the thing that ends up orphaned there. */}
      <aside ref={bar} data-cj-announcement-bar className="bg-charcoal-deep text-chalk">
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
      </aside>
      <script data-t={text} dangerouslySetInnerHTML={{ __html: PREPAINT }} />
    </>
  );
}
