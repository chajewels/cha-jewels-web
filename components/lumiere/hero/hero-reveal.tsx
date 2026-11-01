"use client";

import { useEffect, useState, type ReactNode } from "react";
import { animated, easings, useSpring } from "@react-spring/web";

import { useHasLoaded, useLiftedEarly } from "@/lib/lumiere/preload-store";

/**
 * The hero's entrances.
 *
 * One idea, applied at two sizes. Large type is set line by line from behind a
 * mask, the way a compositor lays it: each line rises into its own slot and the
 * next follows a beat later. Small type only lifts and fades, because a masked
 * reveal on a 14px label reads as a trick where on a 55px serif it reads as
 * typesetting.
 *
 * Slow and heavily damped on purpose. The spring is tuned so nothing
 * overshoots: a bounce here would put a spring in a shop window, and the whole
 * composition — the still ring, the chain hanging into it — is built on things
 * coming to rest.
 */

/**
 * Timed rather than sprung, and the difference is the point.
 *
 * A spring soft enough not to overshoot spends most of its life in the tail:
 * the travel is over early and what remains is a long crawl nobody reads as
 * movement. A duration with an ease-out lands the same shape — fast away, slow
 * into place — but the whole of it is on screen, and it ends when it says it
 * does.
 */
const CONFIG = { duration: 880, easing: easings.easeOutCubic } as const;

/** Beat between one line of the headline and the next, in ms. */
export const LINE_STAGGER = 180;

/**
 * Beat between neighbouring items in a list. Shorter than a headline's, because
 * six of them run in a row and the same interval would turn a menu into a
 * sequence to sit through.
 */
export const ITEM_STAGGER = 90;

/**
 * Where each piece enters, in ms after the gate lifts. Written as one list
 * because the order is the point — the headline first and alone, then the page
 * assembling around it.
 */
export const REVEAL = {
  headline: 120,
  chrome: 340,
  tagline: 520,
  cta: 620,
} as const;

/** Delay before the first item of the burger menu, in ms after it opens. */
export const MENU_LEAD = 90;

/**
 * How long the menu is given to leave, in ms.
 *
 * Shorter than it takes to arrive, and deliberately: an entrance is worth
 * watching and an exit is in the way. It only has to be long enough that the
 * panel is seen to go rather than to vanish.
 */
export const MENU_EXIT_MS = 320;

/**
 * Honours the system setting. Read through an effect rather than at module
 * scope so the server and the first client render agree.
 */
const useReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);

    sync();
    query.addEventListener("change", sync);

    return () => query.removeEventListener("change", sync);
  }, []);

  return reduced;
};

/** The single spring behind every entrance here: 0 held, 1 arrived. */
const useEntrance = (active: boolean, delay: number) => {
  const reduced = useReducedMotion();
  // The curtain lifted before hydration (P2b): the element is already on
  // screen at rest, so the spring lands there at once rather than replaying.
  const liftedEarly = useLiftedEarly();

  return useSpring({
    t: active || reduced ? 1 : 0,
    delay: active && !reduced && !liftedEarly ? delay : 0,
    immediate: reduced || liftedEarly,
    config: CONFIG,
  }).t;
};


/**
 * Fade-and-lift, to be spread onto any `animated.*` tag.
 *
 * `rise` is in pixels rather than a share of the element, so a caption and a
 * paragraph travel the same distance and the group reads as one movement.
 *
 * Deliberately `transform` and not the `translate` property: several of these
 * elements are centred with `-translate-x-1/2`, which Tailwind compiles to
 * `translate`, and an inline value there would silently knock them off centre.
 */
export const useEnterSpring = (active: boolean, delay = 0, rise = 14) => {
  const t = useEntrance(active, delay);

  return {
    opacity: t,
    transform: t.to((value) => `translate3d(0, ${(1 - value) * rise}px, 0)`),
  };
};

/** The same, gated on the page being ready rather than on a caller's flag. */
export const useRevealSpring = (delay = 0, rise = 14) =>
  useEnterSpring(useHasLoaded(), delay, rise);

export interface MaskedProps {
  children: ReactNode;
  delay?: number;
  /** Omit to hang the entrance on the preloader. */
  active?: boolean;
}

/** Slack around the line, in ems. Instrument Serif's ascent and descent both
    reach about a fifth of the size past the line box these are set on. */
const BLEED = "0.22em";
/** The italic J's swash leans out past the left edge of its own line box. */
const SIDE_BLEED = "0.1em";

/**
 * A line rising into place from behind its own edge.
 *
 * No fade on this one — the mask does the work, and cross-fading a line that is
 * already sliding reads as two effects rather than one.
 *
 * Two things have to hold at once, and they pull against each other. The mask
 * must be taller than the line box or it shaves the type — these headlines are
 * set at 0.95 leading, tighter than the font's own ascent, so a mask drawn to
 * the box cuts 16px off the top of every line. And the travel must be at least
 * the mask's height, or the line is still peeking out of the bottom before it
 * starts.
 *
 * So the slack goes on the line and the mask is pulled back over it: the
 * animated box then *is* the mask, one translation of 100% hides it exactly,
 * and the negative margins hand every pixel of the room back to the layout —
 * line spacing and left gutter both land where they did before any of this
 * existed.
 */
const Masked = ({ children, delay = 0, active }: MaskedProps) => {
  const hasLoaded = useHasLoaded();
  const t = useEntrance(active ?? hasLoaded, delay);

  return (
    <span
      className="block overflow-hidden"
      style={{
        marginBlock: `calc(${BLEED} * -1)`,
        marginInline: `calc(${SIDE_BLEED} * -1)`,
      }}
    >
      <animated.span
        data-masked
        className="block will-change-transform"
        style={{
          transform: t.to((value) => `translate3d(0, ${(1 - value) * 100}%, 0)`),
        }}
      >
        <span
          className="block"
          style={{ paddingBlock: BLEED, paddingInline: SIDE_BLEED }}
        >
          {children}
        </span>
      </animated.span>
    </span>
  );
};

/** A menu label. Hangs on whether the menu is open. */
export const MaskedItem = ({ children, delay = 0, active }: MaskedProps) => (
  <Masked delay={delay} active={active}>
    {children}
  </Masked>
);

export interface RevealItemProps {
  children: ReactNode;
  delay?: number;
  rise?: number;
  className?: string;
}

/**
 * A list item that lifts into place. Its own component because a hook cannot
 * run inside the map that renders the list.
 */
export const RevealItem = ({
  children,
  delay = 0,
  rise = 18,
  className,
}: RevealItemProps) => {
  const style = useRevealSpring(delay, rise);

  return (
    <animated.li data-reveal className={className} style={style}>
      {children}
    </animated.li>
  );
};
