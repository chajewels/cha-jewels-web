"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { tr, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { trackHeroSlideCta } from "@/lib/analytics";
import { useHeroMotion } from "@/components/home/hero";
import { HubImage } from "@/components/media/hub-image";
import { SplitText } from "@/components/fx/split-text";
import { HeroSheen } from "@/components/fx/hero-sheen";
import { Magnetic } from "@/components/fx/magnetic";
import { isClientNavigation } from "@/components/fx/boot-marker";
import { DUR, SLIDE_EVERY } from "@/lib/motion";

export type HeroSlide =
  | { kind: "intro"; layaway: boolean }
  | { kind: "category"; slug: string; name: string; description: string | null; image: string | null; cta: string | null };

const AUTO_ADVANCE_MS = SLIDE_EVERY * 1000;
const VISIBLE_THRESHOLD = 0.6;
/**
 * How long before a slide arrives its photo is allowed to start loading. Long
 * enough that the bytes are usually there when the scroll finishes, short
 * enough that a reader who never waits out one rotation never pays for it.
 */
const PRELOAD_LEAD_MS = 900;

/**
 * The hero deck: slide 0 is the brand headline over the video, then one slide
 * per published category in the Hub's sort_order. Native CSS scroll-snap, no
 * carousel library — the track is a horizontal scroller with mandatory centre
 * snapping, so touch swiping is the browser's own. Arrows from `md`, dots, and
 * ← → when the track has focus. The active index comes from an
 * IntersectionObserver on the slides, so dots and arrows stay in sync after a
 * swipe as well as after a click.
 *
 * Auto-advance every 6s, paused on hover, focus, touch, while the tab is
 * hidden, WHILE THE HERO IS OFF SCREEN, and off entirely under
 * prefers-reduced-motion (where every programmatic scroll is also instant).
 * The toggle in the corner pauses this as well as the video — one control for
 * the hero's motion, because "pause" means "stop moving".
 *
 * LAYERING. The section owns the video and its vertical scrim as the base
 * layer. Slide 0 draws nothing of its own, so the video shows through it
 * exactly as before. A category slide is full-bleed: its photo covers the
 * whole slide and therefore the video, and carries its OWN left-to-right scrim
 * so the copy has something to sit on whether the photo is cream (Fine
 * Jewelry) or near-black (Watches). object-position 65% keeps the subject in
 * frame while the left third is given over to text.
 *
 * Copy is the Hub's or the dictionary's — the name, the description and the
 * button label all come from the category, and nothing here is invented.
 */
/** Put the track exactly at `left`, with snapping off for that one frame. */
function jump(track: HTMLElement, left: number) {
  track.style.scrollSnapType = "none";
  track.scrollLeft = left;
  requestAnimationFrame(() => { track.style.scrollSnapType = ""; });
}

export function HeroSlides({ lang, slides }: { lang: Lang; slides: HeroSlide[] }) {
  const t = tr(lang);
  const trackRef = useRef<HTMLDivElement>(null);
  // Shared with the video: which slide is up, and whether the hero may move at
  // all (on screen, tab visible, reduced motion off, reader has not paused).
  // components/home/hero.tsx holds all of it.
  const { active, setActive, rotateOn, sheenOn, wipe, edge } = useHeroMotion();
  // Slide changes WE made go under the curtain; any other change of `active`
  // is a swipe, and gets the gold edge alone (components/home/hero.tsx).
  const programmatic = useRef(false);
  const lastActive = useRef(0);
  // First page load: the headline paints as plain text, at once (the LCP
  // rule). Arrived by client navigation: it rises in unit by unit. Decided
  // once, at first render.
  const [entering] = useState(isClientNavigation);
  const [held, setHeld] = useState(false);       // hover / focus / touch
  const count = slides.length;

  /**
   * HOW FAR INTO THE DECK THE PHOTOS ARE ALLOWED TO LOAD.
   *
   * Every category slide is laid out from the start — the track is one wide
   * row — so `loading="lazy"` does not hold them back: the browser's lazy
   * heuristic measures against the viewport with a generous margin, and slides
   * sitting just off the right edge are inside it. Measured on develop at both
   * 375 and 1440, ALL FIVE category photos were fetched on first paint, 818 KB
   * of them, behind an intro slide that shows none of them.
   *
   * So mounting is what is gated, not the loading attribute. `reach` starts at
   * 0 — the intro slide, which has no photo of its own — and a slide's <img>
   * does not exist in the DOM until the deck reaches it. It moves for exactly
   * three reasons: the deck is about to rotate onto the next slide, the reader
   * asked for a slide by arrow/dot/key, or a swipe has landed on one. It never
   * goes backwards: a photo already fetched stays mounted, because unmounting
   * it would only mean fetching it again on the way back.
   */
  const [reach, setReach] = useState(0);
  const reveal = useCallback((i: number) => setReach((r) => (i > r ? i : r)), []);

  const goTo = useCallback((i: number) => {
    const track = trackRef.current;
    if (!track || count === 0) return;
    const idx = ((i % count) + count) % count;
    const slide = track.children[idx] as HTMLElement | undefined;
    if (!slide) return;
    // Asked for by name, so it is wanted now rather than in PRELOAD_LEAD_MS.
    reveal(idx);
    // Swapped under the gold-edged curtain (components/home/hero.tsx), as an
    // instant jump rather than a sideways glide: the curtain is the
    // transition. Under reduced motion `wipe` just swaps.
    programmatic.current = true;
    wipe(() => jump(track, slide.offsetLeft));
  }, [count, reveal, wipe]);

  // THE TRACK ALWAYS COMES TO REST ON A SLIDE. On a real iPhone the deck was
  // found frozen between two slides (owner report, 2026-09-23). Two guards:
  //  - programmatic jumps set scrollLeft with snapping switched off for that
  //    frame (`jump`), the iOS workaround for a snap container that re-snaps
  //    a programmatic scroll to somewhere in between;
  //  - whenever the track stops moving (scrollend, or 180 ms without a scroll
  //    event where scrollend is missing) and no finger is on it, a track left
  //    more than 2px off a slide is set onto the nearest one. That covers
  //    swipes, momentum, and a scroll interrupted by the hero going off
  //    screen, the tab going to the background, or Reduce Motion changing.
  const touching = useRef(false);
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let idle = 0;
    const settle = () => {
      if (touching.current) return;
      const w = track.clientWidth;
      if (!w) return;
      const nearest = Math.round(track.scrollLeft / w);
      if (Math.abs(track.scrollLeft - nearest * w) > 2) jump(track, nearest * w);
    };
    const onScroll = () => { clearTimeout(idle); idle = window.setTimeout(settle, 180); };
    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("scrollend", settle);
    const onVisible = () => { if (!document.hidden) settle(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("resize", settle);
    return () => {
      clearTimeout(idle);
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("scrollend", settle);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("resize", settle);
    };
  }, []);

  // The scroller decides which slide is current, so a swipe, a snap after a
  // resize, or a keyboard scroll all land on the same truth as a dot click.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const slidesEl = Array.from(track.children) as HTMLElement[];
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting && e.intersectionRatio >= VISIBLE_THRESHOLD) setActive(slidesEl.indexOf(e.target as HTMLElement));
      }
    }, { root: track, threshold: [VISIBLE_THRESHOLD] });
    slidesEl.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [count]);

  // A swipe is the third way to arrive at a slide, and the only one that does
  // not go through goTo — the scroller reports it through `active`. Whatever
  // is showing must have its photo; and once the reader is moving through the
  // deck at all, the slide after it is fair game. Not at active 0, which is
  // where every visit starts and where the poster is the only image wanted.
  useEffect(() => {
    reveal(active);
    if (active > 0) reveal(active + 1);
    if (active !== lastActive.current) {
      if (!programmatic.current) edge();
      programmatic.current = false;
      lastActive.current = active;
    }
  }, [active, reveal, edge]);

  useEffect(() => {
    // `rotateOn` carries offscreen, hidden tab, reduced motion and the pause
    // button; `held` is hover/focus/touch and stays local to the deck.
    if (count < 2 || held || !rotateOn) return;
    // Two timers, not one: the photo for the slide we are about to move to
    // starts loading PRELOAD_LEAD_MS early, so "loads when it becomes next"
    // does not mean "appears a beat after it arrives". A setTimeout rather
    // than the old setInterval because this effect already re-ran on every
    // `active` change — the interval never survived to a second tick.
    const lead = setTimeout(() => reveal(active + 1), AUTO_ADVANCE_MS - PRELOAD_LEAD_MS);
    const advance = setTimeout(() => goTo(active + 1), AUTO_ADVANCE_MS);
    return () => { clearTimeout(lead); clearTimeout(advance); };
  }, [active, count, held, rotateOn, goTo, reveal]);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(active + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(active - 1); }
  }

  // Inset, not negative: the track is edge-to-edge now, so an arrow hung
  // outside it would sit off-screen rather than beside the slide.
  const arrow = "absolute top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-chalk/40 bg-charcoal-deep/50 text-chalk backdrop-blur hover:border-chalk hover:bg-charcoal-deep/70 md:grid";

  return (
    <div
      className="relative flex h-full flex-col"
      aria-roledescription="carousel"
      aria-label={t("home", "slideEyebrow")}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHeld(false); }}
      onTouchStart={() => { setHeld(true); touching.current = true; }}
      onTouchEnd={() => { touching.current = false; }}
      onTouchCancel={() => { touching.current = false; }}
    >
      <div
        ref={trackRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="flex h-full min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto outline-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold-pale"
      >
        {slides.map((s, i) => (
          <div
            key={s.kind === "intro" ? "intro" : s.slug}
            role="group"
            data-active={i === active}
            aria-roledescription="slide"
            aria-label={t("home", "slideOf", { n: String(i + 1), total: String(count) })}
            // overflow-CLIP: a category photo rests pushed in to 1.08, and
            // unclipped it would bleed a strip into the neighbouring slide.
            // Not overflow-hidden — see hero.tsx, "NOTHING IN THE HERO SCROLLS".
            className="relative flex h-full w-full shrink-0 snap-center items-center overflow-clip"
          >
            {/* py-8 below lg on the intro slide, not py-16. With the
                section's own padding on top of it there were 144px above the
                headline on a 667px screen — a fifth of the first screen spent
                on nothing, which is what pushed the two buttons under the
                mobile tab bar. Unchanged from lg up, where the section has a
                fixed height and the padding decides nothing. */}
            {s.kind === "intro" ? (
              <div className="wrap w-full py-8 text-center lg:py-24 lg:text-left">
                <div className="mx-auto max-w-[820px] lg:mx-0">
                  {/* `relative` for the sheen, which is laid exactly over
                      these letters (components/fx/hero-sheen.tsx). On a
                      client navigation the sheen waits for the words to
                      finish rising before it crosses them. */}
                  <h1 className="relative text-[clamp(30px,5vw,60px)] leading-[1.15] text-chalk">
                    <SplitText text={t("hero", "h1a")} lang={lang} play={entering} />
                    <br />
                    <SplitText text={t("hero", "h1b")} lang={lang} play={entering} delay={DUR.micro} className="text-gold-pale" />
                    <HeroSheen on={sheenOn} delay={entering ? DUR.reveal + DUR.image : undefined}>
                      {t("hero", "h1a")}<br />
                      <span className="hero-sheen__gold">{t("hero", "h1b")}</span>
                    </HeroSheen>
                  </h1>
                  {/* ONE paragraph. The intro slide carried two, the second
                      line-clamped to five lines on mobile — which is the
                      shape of copy nobody reads: too long to take in over a
                      photo, and cut off mid-thought anyway. It says what the
                      brand believes, so it now sits in the values section
                      below, where there is room for it and a reader who has
                      scrolled that far has asked for it. Same key, so both
                      languages moved together. */}
                  <p className="mt-6 text-[15px] leading-relaxed text-chalk/85 lg:text-base">{t("hero", "lede")}</p>
                  {/* The origin clarifier, its own line under the lede. */}
                  <p className="mt-3 text-[15px] leading-relaxed text-chalk/85 lg:text-base">{t("brand", "originNote")}</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3 lg:mt-9 lg:justify-start">
                    <Magnetic><Button asChild><Link href="/collections">{t("hero", "cta1")}</Link></Button></Magnetic>
                    {s.layaway && <Magnetic><Button asChild variant="ghost" className="border-chalk/60 text-chalk hover:border-chalk hover:text-chalk"><Link href="#layaway">{t("hero", "cta2")}</Link></Button></Magnetic>}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Full-bleed at every width — measured 375/768/1280/1440, the
                    photo is the viewport wide in all four — so `100vw` is the
                    literal truth rather than a guess, and the browser picks
                    from the 640…3840 ladder instead of taking the original.
                    `i <= reach` is the gate described above; the scrim goes
                    with the photo, because it exists to sit between the photo
                    and the copy. */}
                {s.image && i <= reach && (
                  <>
                    {/* The slow push-in, restarted each time this slide comes up
                        (.slide-push, app/globals.css). */}
                    <div className="slide-push"><HubImage src={s.image} alt="" fill sizes="100vw" className="object-cover object-[65%_center]" /></div>
                    <div aria-hidden="true" className="hero-slide-scrim" />
                  </>
                )}
                <div className="wrap relative z-10 w-full py-16 lg:py-24">
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange">{t("home", "slideEyebrow")}</p>
                    <h2 className="mt-4 font-display text-[clamp(32px,4.5vw,56px)] leading-[1.1] text-gold-pale">{s.name}</h2>
                    {s.description && <p className="mt-5 text-[15px] leading-relaxed text-chalk/85 lg:text-base">{s.description}</p>}
                    <div className="mt-8 flex">
                      <Magnetic><Button asChild><Link href={`/categories/${s.slug}`} onClick={() => trackHeroSlideCta(s.slug)}>{s.cta ?? t("home", "slideShop", { name: s.name })}</Link></Button></Magnetic>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button type="button" aria-label={t("home", "slidePrev")} onClick={() => goTo(active - 1)} className={`${arrow} left-2 lg:left-5`}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m15 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" aria-label={t("home", "slideNext")} onClick={() => goTo(active + 1)} className={`${arrow} right-2 lg:right-5`}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          {/* FROM `lg` UP these are overlaid: the section has a fixed height
              there, so a row stacked under the track would be pushed out of
              it.

              BELOW `lg` they are a row in the flow, under the track. They used
              to be overlaid there too, at a `bottom-24` picked by measuring
              one screen — 375x812, where 96px was what it took to clear the
              mobile tab bar. That number is only right at that height. At
              375x667 the same 96px lands the dots across the middle of "Shop
              the collections", drawing a row of dots over the primary call to
              action. In the flow they are under the content at every height,
              and there is no magic number to re-measure the next time the
              copy or the chrome changes. */}
          <div className="z-20 flex shrink-0 justify-center gap-2 pb-2 pt-3 lg:absolute lg:inset-x-0 lg:bottom-5 lg:pb-0 lg:pt-0" role="tablist" aria-label={t("home", "slideEyebrow")}>
            {slides.map((s, i) => (
              <button
                key={s.kind === "intro" ? "intro" : s.slug}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={t("home", "slideDot", { n: String(i + 1) })}
                onClick={() => goTo(i)}
                className="grid h-6 w-6 place-items-center"
              >
                <span className={`block h-2 w-2 rounded-full transition-colors ${i === active ? "bg-orange" : "bg-chalk/50"}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
