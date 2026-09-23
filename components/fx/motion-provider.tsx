"use client";
import { useEffect } from "react";
import { LazyMotion, MotionConfig } from "motion/react";

/**
 * FIRST LOAD OR CLIENT NAVIGATION?
 *
 * The LCP rule (docs/tasks/web-motion-signature.md, constraint 2): on the
 * first page load nothing above the fold may start hidden. Entrances that
 * hide first — the hero's split-text headline — are allowed only when the
 * reader has arrived by client-side navigation, when there is no LCP to
 * protect and the page is being built in front of them anyway.
 *
 * `booted` flips after this provider's first commit. React commits children
 * before parents, so everything in the first page load renders and mounts
 * while it is still false; anything rendered after that is a navigation.
 * Components read it once, at first render (useState initialiser), so the
 * answer cannot change under a mounted component.
 */
let booted = false;
export const isClientNavigation = () => booted;

/**
 * Mounted once in app/layout.tsx.
 *
 * LazyMotion + `m` components: only the domAnimation feature set ships
 * (animations, variants, in-view, hover/tap), not layout or drag. `strict`
 * makes a stray `motion.div` throw in development instead of silently pulling
 * the full bundle back in.
 *
 * THE FEATURES LOAD AFTER HYDRATION. domAnimation is 21 kB of the ~28 kB
 * gzipped motion costs, so it is a dynamic import (motion's documented lazy
 * pattern) and stays off the first-load path. Until it lands an `m` element
 * renders exactly as its markup says — and every reveal here renders its
 * FINISHED state from the server (components/fx/reveal.tsx), so the gap is
 * invisible: nothing is waiting on this to become visible.
 *
 * MotionConfig reducedMotion="user": motion components drop transforms for a
 * reader with Reduce Motion on. That alone still lets opacity animate, so
 * every effect in components/fx ALSO checks the setting itself and renders
 * static — see useReduced in components/fx/media.ts.
 */
const loadFeatures = () => import("@/components/fx/motion-features").then((r) => r.default);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => { booted = true; }, []);
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
