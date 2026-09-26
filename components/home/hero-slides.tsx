"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { tr, type Lang } from "@/lib/i18n";
import { useHeroMotion } from "@/components/home/hero";
import { HeroSlideView } from "@/components/home/hero-slide-views";
import { HERO_TRIO_HOLD, SLIDE_EVERY } from "@/lib/motion";
import type { HeroSlide } from "@/lib/hero-deck";

export type { HeroSlide };

/**
 * How long a slide holds, seconds: a three-piece slide HERO_TRIO_HOLD, so its
 * trio turns twice and each piece is featured once; every other slide, the
 * film included, SLIDE_EVERY (owner approval 2026-09-26).
 */
function holdOf(s: HeroSlide | undefined): number {
  return s?.kind === "category" && s.pieces.length === 3 ? HERO_TRIO_HOLD : SLIDE_EVERY;
}
/**
 * How long before a slide arrives its media is allowed to start loading. Long
 * enough that the bytes are usually there when the curtain lifts, short
 * enough that a reader who never waits out one rotation never pays for it.
 */
const PRELOAD_LEAD_MS = 900;
/** A horizontal finger travel past this, and wider than it is tall, is a swipe. */
const SWIPE_PX = 48;

/**
 * THE HERO DECK (hero v3, owner approvals 2026-09-26).
 *
 * Every slide is stacked in the same place and only the current one is shown
 * (the rest are `inert`, so neither focus nor a screen reader lands on a
 * hidden slide). A change — arrow, key, swipe or the auto-advance — goes under
 * the charcoal curtain with the gold edge (`wipe`, components/home/hero.tsx):
 * the slide is swapped while the curtain covers the hero, then the new slide's
 * text rises and the light crosses its gilt title (app/globals.css, "HERO
 * DECK v2"). Under reduced motion the swap is instant and nothing moves.
 *
 * CONTROLS: one cluster, bottom-left — counter, progress, slide name, arrows,
 * pause — so the Messenger button keeps the bottom-right to itself. The counter
 * and the segments count only the slides the deck actually has: a category
 * hidden by HERO_HIDE_EMPTY_CATEGORIES (lib/hero-deck.ts) is not a slide here
 * at all. A deck of one slide has no counter, no segments, no arrows and no
 * rotation; pause stays, because the film still moves.
 *
 * TEXT SIDES ALTERNATE by place in the deck: left on slides 1, 3, 5, right on
 * 2, 4, 6. The controls stay bottom-left on every slide.
 *
 * Auto-advance after `holdOf` the slide, held on hover, focus and touch, while the
 * tab is hidden, while the hero is off screen, under reduced motion, and by
 * the pause button (`rotateOn`). `aria-live` is polite only while the deck is
 * not rotating on its own, so a screen reader is never talked over.
 *
 * The HOLD is the deck's only: the slide on screen keeps its own motion (the
 * trio turning, each piece changing photos) while it is hovered, focused or
 * touched — `moving` is `rotateOn` alone. Holding that too froze the stage for
 * anyone looking at it (owner report 2026-09-26: "no slideshow"); the pause
 * button, reduced motion, a hidden tab and scrolling away still stop it.
 *
 * MEDIA LOADS WHEN IT IS WANTED. `reach` starts at 0: the film slide's piece
 * photo is the only slide photo in the first paint. A later slide mounts its
 * media PRELOAD_LEAD_MS before the deck rotates onto it, or when the reader
 * asks for it; it never unmounts, so going back costs nothing. The film slide
 * has no photo of its own: its poster is the page's one eager image.
 */
export function HeroSlides({ lang, slides }: { lang: Lang; slides: HeroSlide[] }) {
  const t = tr(lang);
  const { active, setActive, rotateOn, paused, toggle, wipe } = useHeroMotion();
  const count = slides.length;
  const [held, setHeld] = useState(false);
  // The first slide of a fresh load is painted final, with no entrance. Every
  // later arrival rises (the `hd-moved` class).
  const [moved, setMoved] = useState(false);
  const [reach, setReach] = useState(0);
  const reveal = useCallback((i: number) => setReach((r) => (i > r ? i : r)), []);
  const cur = Math.min(active, Math.max(0, count - 1));

  const goTo = useCallback((i: number) => {
    if (count < 2) return;
    const idx = ((i % count) + count) % count;
    if (idx === cur) return;
    reveal(idx);
    wipe(() => { setMoved(true); setActive(idx); });
  }, [count, cur, reveal, wipe, setActive]);

  const holdMs = holdOf(slides[cur]) * 1000;
  useEffect(() => {
    if (count < 2 || held || !rotateOn) return;
    const lead = setTimeout(() => reveal(cur + 1 < count ? cur + 1 : 0), holdMs - PRELOAD_LEAD_MS);
    const advance = setTimeout(() => goTo(cur + 1), holdMs);
    return () => { clearTimeout(lead); clearTimeout(advance); };
  }, [cur, count, held, rotateOn, goTo, reveal, holdMs]);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(cur + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(cur - 1); }
  }

  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => { setHeld(true); const p = e.touches[0]; touch.current = p ? { x: p.clientX, y: p.clientY } : null; };
  const onTouchEnd = (e: React.TouchEvent) => {
    const s = touch.current;
    touch.current = null;
    const p = e.changedTouches[0];
    if (!s || !p) return;
    const dx = p.clientX - s.x, dy = p.clientY - s.y;
    if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(dy) * 1.2) goTo(cur + (dx < 0 ? 1 : -1));
  };

  const running = rotateOn && !held && count > 1;
  const slide = slides[cur];
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div
      className={`hd${moved ? " hd-moved" : ""}`}
      aria-roledescription="carousel"
      aria-label={t("home", "heroDeck")}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false); }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => { touch.current = null; }}
    >
      <div className="hd-viewport" tabIndex={count > 1 ? 0 : undefined} onKeyDown={onKeyDown} aria-live={running ? "off" : "polite"}>
        {slides.map((s, i) => (
          <div
            key={s.key}
            className="hd-slide"
            role="group"
            aria-roledescription="slide"
            aria-label={t("home", "heroSlideLabel", { n: String(i + 1), total: String(count), name: s.name })}
            data-active={i === cur}
            inert={i !== cur}
          >
            <HeroSlideView
              slide={s}
              index={i}
              lang={lang}
              active={i === cur}
              mounted={i <= reach}
              side={i % 2 === 0 ? "left" : "right"}
              moving={i === cur && rotateOn}
            />
          </div>
        ))}
      </div>

      {/* The progress fill runs for this slide's own hold. */}
      <div className={`hd-ctrl${running ? " hd-run" : ""}`} style={{ ["--dur-slide" as string]: `${holdMs / 1000}s` }}>
        <div className="hd-in">
          {count > 1 && (
            <>
              <p className="hd-count" aria-hidden="true">{pad(cur + 1)}<span> / {pad(count)}</span></p>
              {/* Progress, not navigation: the arrows, keys and swipe move the
                  deck. `key` restarts the fill on every slide. */}
              <div className="hd-segs" aria-hidden="true" key={`${cur}-${running}`}>
                {slides.map((s, i) => <i key={s.key} data-done={i < cur ? "" : undefined} data-on={i === cur ? "" : undefined} />)}
              </div>
              <p className="hd-segname" aria-hidden="true">{slide?.short}</p>
              <button type="button" className="hd-round hd-arrow" aria-label={t("home", "slidePrev")} onClick={() => goTo(cur - 1)}>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m15 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <button type="button" className="hd-round hd-arrow" aria-label={t("home", "slideNext")} onClick={() => goTo(cur + 1)}>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            </>
          )}
          {/* ONE BUTTON FOR THE WHOLE HERO: the film, the rotation, the gilt
              light, the clock hand and the index all stop together. */}
          <button type="button" className="hd-round" aria-label={paused ? t("home", "heroPlay") : t("home", "heroPause")} onClick={toggle}>
            {paused
              ? <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z" /></svg>
              : <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M7 5h3.2v14H7zM13.8 5H17v14h-3.2z" /></svg>}
          </button>
        </div>
      </div>
    </div>
  );
}
