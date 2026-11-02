"use client";

import { createContext, useContext } from "react";
import type { SpringValue } from "@react-spring/web";

/**
 * The block's progresses.
 *
 * `pin` is the scrub through the pinned stretch, 0 at its start and 1 at its
 * end. `entry` is how far the section has risen into the viewport, which is
 * what brings the left panel in — the two are separate because they answer to
 * different stretches of scroll and one must not wait on the other. `strip` is
 * the ring strip's position in slots — ring `i` is centred at `strip = i` — and
 * unlike `pin` it keeps moving while the section scrolls in and out.
 *
 * In its own module for the reason the hero's is: declared inside the component
 * that provides it, the module would be both a client entry point and an import
 * of its own readers, and the bundler would instantiate the context twice.
 */
export interface FeaturedProgress {
  pin: SpringValue<number>;
  entry: SpringValue<number>;
  strip: SpringValue<number>;
  /** How many slots the strip travels while pinned: the pieces less one (the Hub's featured pieces, P5b — not a constant). */
  transitions: number;
  /** For the indicator: take the page to the scroll where state `index` sits. */
  scrollToState: (index: number) => void;
  /**
   * Where the side slots sit, as a fraction of the ring's own box. It is the
   * one number the breakpoints move, and it lives here rather than in CSS
   * because the trajectory is computed in JS.
   */
  spread: number;
}

export const FeaturedProgressContext = createContext<FeaturedProgress | null>(
  null,
);

export const useFeaturedProgress = (): FeaturedProgress => {
  const progress = useContext(FeaturedProgressContext);

  if (!progress) {
    throw new Error(
      "useFeaturedProgress must be called inside <FeaturedMotion>.",
    );
  }

  return progress;
};
