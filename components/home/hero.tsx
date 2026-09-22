"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyMq = () => setReduced(mq.matches);
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

  const allowed = onScreen && !hidden && !reduced;
  const value = useMemo<HeroMotion>(() => ({
    active,
    setActive,
    allowed,
    paused,
    reduced,
    videoOn: allowed && !paused && active === 0,
    rotateOn: allowed && !paused,
    toggle: () => setPaused((p) => !p),
  }), [active, allowed, paused, reduced]);

  return (
    <Ctx.Provider value={value}>
      <section ref={section} className={className}>
        <HeroVideo playLabel={videoPlayLabel} pauseLabel={videoPauseLabel} />
        {children}
        <div className="relative z-10 w-full self-stretch">
          <HeroSlides lang={lang} slides={slides} />
        </div>
      </section>
    </Ctx.Provider>
  );
}
