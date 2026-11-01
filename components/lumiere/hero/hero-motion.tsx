"use client";

import { useEffect, useRef, useState } from "react";
import { useSpringValue } from "@react-spring/web";

import { createDocBox } from "@/lib/animation/doc-box";
import { smoothScrollY } from "@/lib/animation/smooth-scroll-y";
import { subscribeToTicker } from "@/lib/animation/ticker";

import { TIMELINE } from "./hero.config";
import { HeroProgressContext } from "./hero-progress";

/** Run on every frame — the scrub must not lag behind the scroll. */
const everyFrame = () => 0;

export interface HeroMotionProps {
  children: React.ReactNode;
}

/**
 * Pins the hero and publishes scroll progress to it.
 *
 * The track is `pinHeights + 1` viewports tall and the stage sticks to the top,
 * so the section holds still while the page scrolls past it. Progress is the
 * fraction of that travel consumed.
 *
 * Progress is pushed with `set`, not `start`: a spring would lag the pointer and,
 * worse, settle asynchronously — scrubbing back would not land on exactly the
 * values it passed on the way down. Lenis already smooths the input, so a 1:1
 * mapping is both steadier and drift-free.
 */
export const HeroMotion = ({ children }: HeroMotionProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const progress = useSpringValue(0);
  const [isPinned, setIsPinned] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");

    const apply = () => {
      setIsPinned(!query.matches);
      if (query.matches) progress.set(0);
    };

    apply();
    query.addEventListener("change", apply);

    return () => query.removeEventListener("change", apply);
  }, [progress]);

  useEffect(() => {
    if (!isPinned) return;

    const track = trackRef.current;
    if (!track) return;
    // The track's document box, re-measured on a size change only: a layout
    // read per frame forced a whole-page layout mid-scroll (lib/animation/doc-box).
    const box = createDocBox(track);

    const unsubscribe = subscribeToTicker(() => {
      const { height } = box;
      // At Lenis's fractional position, not the browser's rounded one — see
      // smoothScrollY. The stage is pinned, so nothing here needs the rounding.
      const top = box.top - smoothScrollY();
      const travel = height - window.innerHeight;

      // A zero-height track means layout has not settled; leave progress alone
      // rather than caching a nonsense value.
      if (travel <= 0) return;

      progress.set(Math.min(1, Math.max(0, -top / travel)));
    }, everyFrame);

    return () => {
      unsubscribe();
      box.dispose();
    };
  }, [isPinned, progress]);

  return (
    <div
      ref={trackRef}
      className="relative"
      style={
        isPinned
          ? { height: `${(TIMELINE.pinHeights + 1) * 100}svh` }
          : undefined
      }
    >
      <div
        className={
          isPinned ? "sticky top-0 h-svh overflow-hidden" : "overflow-hidden"
        }
      >
        <HeroProgressContext.Provider value={progress}>
          {children}
        </HeroProgressContext.Provider>
      </div>
    </div>
  );
};
