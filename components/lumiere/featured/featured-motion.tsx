"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSpringValue } from "@react-spring/web";

import { createDocBox } from "@/lib/animation/doc-box";
import { smoothScrollY } from "@/lib/animation/smooth-scroll-y";
import { subscribeToTicker } from "@/lib/animation/ticker";

import { clamp01 } from "./featured-easing";
import { FeaturedProgressContext } from "./featured-progress";
import { SPREAD, STRIP_OVERRUN, TIMELINE } from "./featured.config";

/** Run on every frame — a scrub must not lag behind the scroll. */
const everyFrame = () => 0;

/** How much of a viewport the section rises through before it is fully in. */
const ENTRY_TRAVEL = 0.6;

export interface FeaturedMotionProps {
  /** How many pieces the strip carries (the Hub's featured pieces, 1–5). */
  count: number;
  children: React.ReactNode;
}

/**
 * Pins the block and publishes its two progresses.
 *
 * The track is `transitions × viewportsPerTransition` viewports of travel plus
 * one, and the stage sticks inside it, so the section holds still while the
 * page scrolls the rings through their states. `pin` is the fraction of that
 * travel consumed.
 *
 * `entry` is a different measurement on the same frame: how far the section has
 * risen into the viewport, which is what brings the left panel in. It has to be
 * separate — the panel should have arrived before the ring starts turning, and
 * the pin has not begun by then.
 *
 * Both are pushed with `set` rather than `start`. A spring would lag the
 * pointer and settle asynchronously, so scrubbing back would not land on the
 * values it passed on the way down; Lenis already smooths the input.
 */
export const FeaturedMotion = ({ count, children }: FeaturedMotionProps) => {
  const transitions = Math.max(count - 1, 0);
  const trackRef = useRef<HTMLDivElement>(null);
  const pin = useSpringValue(0);
  const entry = useSpringValue(0);
  const strip = useSpringValue(0);
  const [isPinned, setIsPinned] = useState(true);
  const [spread, setSpread] = useState<number>(SPREAD.wide);

  useEffect(() => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)");
    // The two edges the stylesheet works to: it stacks below 1440 and tightens
    // again below 768, and the slots follow both.
    const stacked = window.matchMedia("(max-width: 1439.98px)");
    const phone = window.matchMedia("(max-width: 767.98px)");

    const apply = () => {
      const active = !still.matches;
      setIsPinned(active);
      setSpread(
        phone.matches
          ? SPREAD.phone
          : stacked.matches
            ? SPREAD.tablet
            : SPREAD.wide,
      );

      // Unpinned, the block is simply its first state, already arrived.
      if (!active) {
        pin.set(0);
        strip.set(0);
        entry.set(1);
      }
    };

    apply();
    still.addEventListener("change", apply);
    stacked.addEventListener("change", apply);
    phone.addEventListener("change", apply);

    return () => {
      still.removeEventListener("change", apply);
      stacked.removeEventListener("change", apply);
      phone.removeEventListener("change", apply);
    };
  }, [entry, pin, strip]);

  useEffect(() => {
    if (!isPinned) return;

    const track = trackRef.current;
    if (!track) return;
    // Re-measured on a size change only — no layout read per frame (doc-box).
    const box = createDocBox(track);

    const unsubscribe = subscribeToTicker(() => {
      const { height } = box;
      // At Lenis's fractional position, not the browser's rounded one — see
      // smoothScrollY. The stage is pinned, so nothing here needs the rounding.
      const top = box.top - smoothScrollY();
      const travel = height - window.innerHeight;

      // A zero-height track means layout has not settled; leave the values
      // alone rather than caching a nonsense one.
      if (travel <= 0) return;

      pin.set(clamp01(-top / travel));
      // The strip runs at one speed across the whole time the block is on
      // screen — rising in, pinned, scrolling away — so it never stops: the
      // pinned stretch carries it from ring 0 to the last, and the same rate
      // carries it on either side, clamped a little past both ends.
      strip.set(
        Math.min(
          Math.max((-top / travel) * transitions, -STRIP_OVERRUN),
          transitions + STRIP_OVERRUN,
        ),
      );
      entry.set(
        clamp01(
          (window.innerHeight - top) / (window.innerHeight * (1 + ENTRY_TRAVEL)),
        ),
      );
    }, everyFrame);

    return () => {
      unsubscribe();
      box.dispose();
    };
  }, [entry, isPinned, pin, strip, transitions]);

  /** Where the page has to be for the ring to be showing state `index`. */
  const scrollToState = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;

    const travel = track.offsetHeight - window.innerHeight;
    if (travel <= 0 || transitions <= 0) return;

    window.scrollTo({
      top: track.offsetTop + (travel * index) / transitions,
      behavior: "smooth",
    });
  }, [transitions]);

  return (
    <FeaturedProgressContext.Provider value={{ pin, entry, strip, scrollToState, spread, transitions }}>
      <div
        ref={trackRef}
        className="relative"
        style={
          isPinned
            ? {
                height: `${
                  (transitions * TIMELINE.viewportsPerTransition + 1) *
                  100
                }svh`,
              }
            : undefined
        }
      >
        <div
          className={
            isPinned ? "sticky top-0 flex h-svh items-center" : undefined
          }
        >
          {children}
        </div>
      </div>
    </FeaturedProgressContext.Provider>
  );
};
