"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { DUR, EASE_LUX, EASE_WIPE_IN, HERO_SINK } from "@/lib/motion";
import { HeroVideo } from "@/components/site/hero-video";
import { HeroSlides, type HeroSlide } from "@/components/home/hero-slides";
import type { Lang } from "@/lib/i18n";

/**
 * THE HERO'S MOTION, DECIDED IN ONE PLACE.
 *
 * The video and the slide deck were two components that each decided for
 * themselves whether to move, and neither could see the other. The result was
 * a 4 MB clip decoding behind a category photo that covered it completely, and
 * both of them still running after the reader had scrolled to the footer.
 *
 * So the section itself is a client component now, and it holds the five facts
 * both of them need:
 *
 *   active     which slide is showing. The video is only VISIBLE under slide 0
 *              — every category slide is full-bleed and covers it — so under
 *              any other slide it is decoding frames nobody can see.
 *   onScreen   an IntersectionObserver on this section. Scrolled away, nothing
 *              here should be costing anyone a frame or a byte.
 *   hidden     document.visibilityState. A backgrounded tab is not an audience.
 *   reduced    prefers-reduced-motion, SUBSCRIBED rather than read once: the
 *              setting can be turned on while the page is open, and a reader
 *              who does that is asking for it to stop now, not on next load.
 *   paused     the reader pressed the button. That outranks everything.
 *
 * The headline sheen (components/fx/hero-sheen.tsx) reads `sheenOn` from here
 * too, so the same button stops the light crossing the words. And the scroll
 * sink — media scaling 1 → 1.06, the copy drifting up and softening as the
 * reader scrolls past — is driven from this section's own scroll progress.
 * Transform and opacity only; static under reduced motion.
 *
 * THE HERO IMAGE'S OWN FIRST MOMENT (owner feedback on PR #132: "for the
 * hero images nothing changed"). Three layers, all CSS, all starting from the
 * server markup (app/globals.css, "HERO MEDIA"):
 *
 *   push-in   the video/poster eases 1 → 1.08 over a slide's length and
 *             holds; every category photo does the same while its slide is up,
 *             and each new slide starts again from 1. Frame one is exactly 1,
 *             so the LCP element paints unmoved and whole.
 *   sweep     a gold band crosses the whole image once, screen-blended, over
 *             the scrim and under the words, starting with the headline sheen.
 *   vignette  an overlay darkens the edges in over 1.5 s toward the crucible;
 *             only the overlay's opacity moves, never the image.
 *
 * `data-hero-motion` on the section carries "still" for the pause button,
 * off screen and hidden tab, and CSS pauses all three (the sweep is hidden
 * while still rather than frozen mid-image). Reduced motion: the blanket rule
 * removes the animations and each layer's resting style IS its final state —
 * pushed in, vignette settled, no sweep.
 *
 * SLIDE CHANGES GO UNDER A CURTAIN. Arrows, dots, keys and the auto-advance
 * do not glide the deck sideways any more: a dark curtain with a glowing gold
 * leading edge crosses the hero, the slide is swapped while it covers, and
 * the curtain carries on off the far side (`wipe`, below). Transform only,
 * on an overlay. A finger swipe stays the browser's own scroll — the curtain
 * is for changes the reader did not drag. Reduced motion: an instant swap.
 *
 * NOTHING IN THE HERO SCROLLS EXCEPT THE SLIDE TRACK (owner report from a
 * real iPhone, 2026-09-23: the deck frozen half-way between two slides, the
 * round button pushed past the screen edge). The section was overflow-HIDDEN,
 * and an overflow-hidden element is still a scroll container: it clips, but
 * focus, scrollIntoView or iOS itself can scroll it sideways. Its overlays —
 * the sweep resting past the right edge, the curtain, the pushed-in media —
 * made it 1250px wide on a 390px screen, and one tap scrolled the whole hero
 * sideways, taking the slide copy and the button with it; the slider logic
 * only watches its own track, so nothing ever put it back. The section and
 * each slide are overflow-CLIP now (page.tsx, hero-slides.tsx): same
 * clipping, but never scrollable. `contain: paint` below is belt and braces.
 *
 * THE SINK IS A SCROLL LISTENER, NOT motion's useScroll. useScroll brought
 * 19 kB of gzipped JavaScript to the homepage for three numbers, which on its
 * own would have spent over half the motion budget (docs/perf-baseline.md).
 * A passive listener that writes three transforms once per frame does the
 * same job, and skips the work entirely while the hero is off screen.
 *
 * ONE BUTTON FOR BOTH. Pressing pause stops the video AND the rotation,
 * because "pause" means "stop moving" to the person pressing it, and a control
 * that stopped half the motion would be a control that did not work.
 */
type HeroMotion = {
  active: number;
  setActive: (i: number) => void;
  /** Everything except the reader's own choice — the conditions for motion. */
  allowed: boolean;
  paused: boolean;
  reduced: boolean;
  /** The video may play: slide 0 AND allowed AND not paused. */
  videoOn: boolean;
  /** The deck may rotate: allowed AND not paused (any slide). */
  rotateOn: boolean;
  /**
   * The headline sheen may pass: on screen, tab visible, not paused. NOT
   * gated on `asked` — the first pass plays from the server markup, before
   * hydration, which is what gets it seen inside 3 s on a slow phone; reduced
   * motion is enforced in CSS before the first paint instead.
   */
  sheenOn: boolean;
  /** The video/photo layer the scroll sink scales (components/site/hero-video.tsx). */
  mediaRef: React.RefObject<HTMLDivElement | null>;
  /** Run `swap` under the gold-edged curtain (or at once, under reduced motion). */
  wipe: (swap: () => void) => void;
  /** The curtain's gold edge alone, crossing a slide the reader swiped to. */
  edge: () => void;
  toggle: () => void;
};

const Ctx = createContext<HeroMotion | null>(null);

export function useHeroMotion(): HeroMotion {
  const v = useContext(Ctx);
  if (!v) throw new Error("useHeroMotion outside <Hero>");
  return v;
}

export function Hero({ lang, slides, videoPlayLabel, videoPauseLabel, className, children }: {
  lang: Lang;
  slides: HeroSlide[];
  videoPlayLabel: string;
  videoPauseLabel: string;
  className: string;
  /** The scrim, passed through from the server so it keeps its place in the DOM. */
  children: React.ReactNode;
}) {
  const section = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [onScreen, setOnScreen] = useState(true);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [paused, setPaused] = useState(false);
  /**
   * Have we actually ASKED about motion yet?
   *
   * `reduced` starts false because the server cannot know, so for the render
   * between mount and the effect below every condition said yes — and that one
   * render was enough to arm the video and attach its <source> elements. A
   * reader with reduced motion on was still downloading the clip. Nothing is
   * allowed to move until the question has been answered once.
   */
  const [asked, setAsked] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMq = () => { setReduced(mq.matches); setAsked(true); };
    applyMq();
    mq.addEventListener("change", applyMq);
    const vis = () => setHidden(document.hidden);
    vis();
    document.addEventListener("visibilitychange", vis);
    return () => { mq.removeEventListener("change", applyMq); document.removeEventListener("visibilitychange", vis); };
  }, []);

  useEffect(() => {
    const el = section.current;
    if (!el) return;
    // A low threshold on purpose: a sliver of hero still on screen is still
    // being looked at. This is about the reader having moved ON, not about
    // pixel-perfect visibility.
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.01 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const allowed = asked && onScreen && !hidden && !reduced;

  const mediaRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  /** Ends the wipe in progress, if any (see `wipe`). */
  const wipeEnd = useRef<(() => void) | null>(null);
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const wipe = useCallback((swap: () => void) => {
    const el = curtainRef.current;
    if (!el || reducedRef.current || typeof el.animate !== "function") { swap(); return; }
    // ONE WIPE AT A TIME, AND EVERY WIPE ENDS. A newer wipe (a dot tapped
    // during autoplay) cancels this one; whatever happens, the swap runs
    // exactly once and the curtain goes back to hidden and parked — never
    // left part-way across the hero. The timer is the safety net for a
    // `finished` promise that never settles (a throttled or backgrounded
    // tab): past the wipe's length plus a margin, it snaps to the end state.
    wipeEnd.current?.();
    let done = false;
    const half = (DUR.wipe * 1000) / 2;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      swap();
      for (const a of el.getAnimations()) a.cancel();
      el.style.visibility = "";
      if (wipeEnd.current === finish) wipeEnd.current = null;
    };
    const timer = setTimeout(finish, DUR.wipe * 1000 + 400);
    wipeEnd.current = finish;
    el.style.visibility = "visible";
    const cover = el.animate([{ transform: "translateX(-101%)" }, { transform: "translateX(0%)" }],
      { duration: half, easing: `cubic-bezier(${EASE_WIPE_IN.join(",")})`, fill: "forwards" });
    cover.finished.then(() => {
      if (done) return;
      swap();
      swap = () => undefined; // already swapped under the curtain
      const reveal = el.animate([{ transform: "translateX(0%)" }, { transform: "translateX(101%)" }],
        { duration: half, easing: `cubic-bezier(${EASE_LUX.join(",")})`, fill: "forwards" });
      reveal.finished.then(finish, finish);
    }, finish);
  }, []);
  const edge = useCallback(() => {
    const el = curtainRef.current;
    if (!el || reducedRef.current || typeof el.animate !== "function") return;
    wipeEnd.current?.();
    // Only the glowing gold edge: the curtain's dark body is made transparent
    // for this pass, so the slide the reader swiped to stays in view.
    el.style.background = "linear-gradient(90deg, transparent 0%, transparent 86%, var(--c-gold-dark) 95%, var(--c-gold-pale) 99.4%, transparent 100%)";
    el.style.visibility = "visible";
    const end = () => { clearTimeout(timer); for (const a of el.getAnimations()) a.cancel(); el.style.visibility = ""; el.style.background = ""; };
    const timer = setTimeout(end, DUR.wipe * 1000 + 400);
    el.animate([{ transform: "translateX(-101%)" }, { transform: "translateX(101%)" }],
      { duration: DUR.wipe * 1000, easing: `cubic-bezier(${EASE_LUX.join(",")})`, fill: "forwards" })
      .finished.then(end, end);
  }, []);
  const contentRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = section.current, media = mediaRef.current, content = contentRef.current;
    if (!el || !media || !content) return;
    const clear = () => { media.style.transform = ""; content.style.transform = ""; content.style.opacity = ""; };
    if (reduced || !onScreen) { if (reduced) clear(); return; }
    let frame = 0;
    const paint = () => {
      frame = 0;
      // 0 with the hero's top at the viewport's top, 1 once its bottom has left.
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / r.height));
      media.style.transform = p ? `scale(${1 + (HERO_SINK.mediaScale - 1) * p})` : "";
      content.style.transform = p ? `translate3d(0, ${-HERO_SINK.contentDrift * p}px, 0)` : "";
      content.style.opacity = p ? String(1 - (1 - HERO_SINK.contentFade) * Math.min(1, p / 0.9)) : "";
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(paint); };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, [reduced, onScreen]);

  const value = useMemo<HeroMotion>(() => ({
    active,
    setActive,
    allowed,
    paused,
    reduced,
    videoOn: allowed && !paused && active === 0,
    rotateOn: allowed && !paused,
    sheenOn: onScreen && !hidden && !paused && !reduced,
    mediaRef,
    wipe,
    edge,
    toggle: () => setPaused((p) => !p),
  }), [active, allowed, paused, reduced, onScreen, hidden, wipe, edge]);

  return (
    <Ctx.Provider value={value}>
      <section ref={section} className={className} style={{ contain: "paint" }} data-hero-motion={paused || !onScreen || hidden ? "still" : "run"} data-active-slide={active}>
        <HeroVideo playLabel={videoPlayLabel} pauseLabel={videoPauseLabel} />
        {children}
        {/* Over the video and its scrim, under the words (z-10). */}
        <div aria-hidden="true" className="hero-vignette" />
        <div aria-hidden="true" className="hero-sweep" />
        <div ref={contentRef} className="relative z-10 w-full self-stretch">
          <HeroSlides lang={lang} slides={slides} />
        </div>
        {/* Over the slides, under the arrows, dots and pause button (z-20). */}
        <div ref={curtainRef} aria-hidden="true" className="hero-curtain" />
      </section>
    </Ctx.Provider>
  );
}
