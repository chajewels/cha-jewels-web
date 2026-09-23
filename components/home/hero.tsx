"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { HERO_SINK } from "@/lib/motion";
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
    toggle: () => setPaused((p) => !p),
  }), [active, allowed, paused, reduced, onScreen, hidden]);

  return (
    <Ctx.Provider value={value}>
      <section ref={section} className={className}>
        <HeroVideo playLabel={videoPlayLabel} pauseLabel={videoPauseLabel} />
        {children}
        <div ref={contentRef} className="relative z-10 w-full self-stretch">
          <HeroSlides lang={lang} slides={slides} />
        </div>
      </section>
    </Ctx.Provider>
  );
}
