"use client";

// Ported verbatim from the Lumière reference (src/hooks/use-scroll-progress.ts).
// §10 of docs/tasks/lumiere-p0-report.md moves its per-frame read onto doc-box in P5.

import { useEffect, type RefObject } from "react";
import { useSpringValue, type SpringValue } from "@react-spring/web";

import { subscribeToTicker } from "@/lib/animation/ticker";

/** Run on every frame — a scrubbed value must not lag behind the scroll. */
const everyFrame = () => 0;

/** Start tracking a little before the element arrives, so it is never caught at a stale value. */
const TRACK_MARGIN = "25% 0px";

export interface ScrollProgressOptions {
  /**
   * Measure the element's parent instead of the element. For a layer that moves
   * with the value: measuring itself would feed its own motion back into it.
   */
  measureParent?: boolean;
}

/**
 * Where an element is on its way through the viewport: 1 as its top edge enters
 * at the bottom, 0 when its centre sits on the viewport's centre, -1 as its
 * bottom edge leaves at the top. Clamped to that range.
 *
 * The value is a `SpringValue` pushed with `set`, not `start`, the way the
 * pinned blocks push theirs: Lenis already smooths the scroll, and a spring on
 * top would lag it. It is read on the shared ticker, only while the element is
 * near the viewport, and never under reduced motion (it stays 0).
 */
export const useScrollProgress = (
  ref: RefObject<HTMLElement | null>,
  { measureParent = false }: ScrollProgressOptions = {},
): SpringValue<number> => {
  const progress = useSpringValue(0);

  useEffect(() => {
    const node = ref.current;
    const target = measureParent ? node?.parentElement : node;
    if (!target) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let unsubscribe: (() => void) | null = null;
    const track = () => {
      const { top, height } = target.getBoundingClientRect();
      const viewport = window.innerHeight;
      const travel = (viewport + height) / 2;
      if (travel <= 0) return;
      const offset = top + height / 2 - viewport / 2;
      progress.set(Math.max(-1, Math.min(1, offset / travel)));
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !unsubscribe) {
          track();
          unsubscribe = subscribeToTicker(track, everyFrame);
        } else if (!entry.isIntersecting && unsubscribe) {
          unsubscribe();
          unsubscribe = null;
        }
      },
      { rootMargin: TRACK_MARGIN },
    );
    observer.observe(target);

    return () => {
      observer.disconnect();
      unsubscribe?.();
    };
  }, [measureParent, progress, ref]);

  return progress;
};
