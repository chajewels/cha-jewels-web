"use client";

import { useEffect, useRef, useState } from "react";
import { TestimonialCard } from "@/components/home/testimonials";
import type { Lang } from "@/lib/i18n";
import type { Testimonial } from "@/lib/types";

/** Seconds each card is on screen for. Duration scales with the count, so the
 *  speed a reader experiences is the same whether there are three or thirty. */
const SECONDS_PER_CARD = 6;
/** How long after the last touch before the track starts moving again. */
const RESUME_AFTER_MS = 5000;
/** Under a hovering pointer the track slows to this share of its speed. */
const HOVER_RATE = 0.5;

/**
 * The testimonials, scrolling right to left, forever.
 *
 * The list is rendered TWICE inside one track and the track is translated
 * exactly -50%. At the end of that translation the second copy sits precisely
 * where the first began, so the animation restarts with nothing to see — the
 * usual marquee seam comes from translating a single copy and snapping back.
 * The duplicate is `aria-hidden` and its focusables are taken out of the tab
 * order: it is the same eight quotes a second time, and a screen reader or a
 * tab sequence should meet them once.
 *
 * HOVER SLOWS IT TO HALF SPEED; FOCUS STOPS IT. A pointer resting on the
 * section is a reader leaning in, and the track eases down to half speed for
 * them — through the Web Animations API's updatePlaybackRate, which changes
 * speed without a jump, where rewriting the CSS duration would snap the
 * track to a new position. Keyboard focus inside still stops it outright: a
 * focused quote has to hold still to be read.
 *
 * ON TOUCH IT STOPS BEING AN ANIMATION. A transform cannot be dragged, so on
 * pointer-down the track becomes an ordinary `overflow-x-auto` snap scroller
 * and the reader swipes it themselves; five seconds after they stop, it
 * resumes. This is the whole reason the component is a client one.
 *
 * IT ALSO STOPS WHEN NOBODY IS THERE. An IntersectionObserver pauses it while
 * the section is off screen: a marquee running under the footer is a
 * compositor job and a wakeup every frame for an audience of nobody.
 *
 * Under `prefers-reduced-motion` there is no marquee at all — the cards are a
 * plain centred grid. BOTH LAYOUTS ARE IN THE MARKUP AND CSS PICKS ONE
 * (globals.css, `.marquee-motion` / `.marquee-still`). This used to render the
 * marquee and then swap itself for the grid in an effect once it had read the
 * media query, so a reader who had asked for no motion was served the moving
 * version first and watched it rearrange — the one thing the setting exists to
 * prevent. CSS decides it before a frame is painted.
 */
export function TestimonialMarquee({ items, lang }: { items: Testimonial[]; lang: Lang }) {
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dupRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const setRate = (rate: number) => {
    for (const a of trackRef.current?.getAnimations() ?? []) a.updatePlaybackRate(rate);
  };

  useEffect(() => () => { if (resumeTimer.current) clearTimeout(resumeTimer.current); }, []);

  // Off screen is paused. Starts false so nothing animates before the observer
  // has had its first say — a marquee that runs for one frame at the bottom of
  // a page nobody has scrolled to is exactly what this is removing.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // The duplicate set is decorative. Anything focusable inside it leaves the
  // tab order, so tabbing through the section visits each quote once.
  useEffect(() => {
    if (!dupRef.current) return;
    for (const el of dupRef.current.querySelectorAll<HTMLElement>("a, button, input, select, textarea, [tabindex]")) {
      el.tabIndex = -1;
    }
  }, [items]);

  const interacted = () => {
    setDragging(true);
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setDragging(false), RESUME_AFTER_MS);
  };

  const row = (dup: boolean) => (
    <div
      ref={dup ? dupRef : undefined}
      aria-hidden={dup ? "true" : undefined}
      className="flex shrink-0 gap-6 pr-6"
    >
      {items.map((x) => (
        <div key={`${dup ? "dup" : "set"}-${x.id}`} className="w-[min(22rem,85vw)] shrink-0 snap-start">
          <TestimonialCard item={x} lang={lang} />
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* The reduced-motion layout. Rendered always, shown by CSS only when the
          reader has asked for no motion — see globals.css. */}
      <div className="marquee-still mt-6 gap-3 lg:mt-10 lg:grid-cols-3 lg:gap-6">
        {items.map((x) => <TestimonialCard key={`still-${x.id}`} item={x} lang={lang} />)}
      </div>
    <div
      ref={boxRef}
      className="marquee-motion relative mt-6 lg:mt-10"
      // The edges fade rather than cut, so a card enters and leaves instead of
      // appearing. A mask works on alpha, so it fades to whatever is behind —
      // no colour to keep in step with the section.
      // 7rem, not 4: deep enough that a card visibly dissolves at the edge
      // rather than being cut by a soft line.
      style={{
        maskImage: "linear-gradient(to right, transparent, #000 7rem, #000 calc(100% - 7rem), transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, #000 7rem, #000 calc(100% - 7rem), transparent)",
      }}
      onMouseEnter={() => setRate(HOVER_RATE)}
      onMouseLeave={() => setRate(1)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onPointerDown={interacted}
      onTouchStart={interacted}
      onScrollCapture={interacted}
    >
      <div
        className={`flex ${dragging ? "snap-x snap-mandatory overflow-x-auto" : "overflow-hidden"}`}
        // A paused transform cannot be dragged; once someone touches it the
        // track becomes a real scroller and they drive.
      >
        <div
          ref={trackRef}
          className="marquee-track flex"
          data-paused={paused || dragging || !onScreen ? "true" : "false"}
          style={{ ["--marquee-duration" as string]: `${items.length * SECONDS_PER_CARD}s` }}
        >
          {row(false)}
          {row(true)}
        </div>
      </div>
    </div>
    </>
  );
}
