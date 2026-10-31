"use client";

// Ported from the Lumière reference (src/hooks/animation/use-motion-off.ts).
// The reference also answered true on its "robot form" (a crawler-only page
// served by its proxy). That form is not ported (docs/tasks/lumiere-redesign.md
// §3.4), so the hook is the reduced-motion flag alone.

import { useState } from "react";
import { useReducedMotion } from "@react-spring/web";

const reducedAtStart = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * True when motion is off: the visitor prefers reduced motion. **Every looping
 * spring must read it** — `loop: !motionOff` — because the flag switches on
 * react-spring's global `skipAnimation`, under which a loop ends each lap
 * instantly and starts the next in the same tick: the page freezes.
 *
 * The media query is read on the first render: `useReducedMotion()` alone
 * reports `false` until its effect runs, by which time the loop has started.
 * The flag doesn't touch the DOM, so reading it during render can't mismatch.
 */
export const useMotionOff = (): boolean => {
  const [reducedFirst] = useState(reducedAtStart);
  const reduced = Boolean(useReducedMotion());
  return reducedFirst || reduced;
};
