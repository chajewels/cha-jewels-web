"use client";

// 📖 Docs: obsidian/frontend/hooks.md

import { useEffect, useMemo } from "react";
import { useSpringValue, type SpringValue } from "@react-spring/web";

import { getSceneBudget, prefersReducedMotion } from "@/lib/scene/device";

import { HERO_TILT } from "./hero.config";

export interface HeroTilt {
  /** Pointer across the viewport, -1 (left) to 1 (right), spring-smoothed. */
  x: SpringValue<number>;
  /** Pointer down the viewport, -1 (bottom) to 1 (top), spring-smoothed. */
  y: SpringValue<number>;
}

/**
 * One spring pair the whole frame-1 composition tilts from — the 3D pendant and
 * the card ring read the same values, so they turn as one object rather than
 * two that happen to follow the same cursor.
 *
 * Mouse and pen only: on a touch screen there is no hovering pointer to follow
 * (optimize-3d-scene §11), and under reduced motion nothing moves. Leaving the
 * window settles the tilt back to square.
 */
export const useHeroTilt = (): HeroTilt => {
  const x = useSpringValue(0, { config: HERO_TILT.spring });
  const y = useSpringValue(0, { config: HERO_TILT.spring });

  useEffect(() => {
    if (!getSceneBudget().pointerTilt || prefersReducedMotion()) return;

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      x.start((event.clientX / window.innerWidth) * 2 - 1);
      y.start(1 - (event.clientY / window.innerHeight) * 2);
    };
    const onPointerLeave = () => {
      x.start(0);
      y.start(0);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener(
        "pointerleave",
        onPointerLeave,
      );
    };
  }, [x, y]);

  // One object for the life of the component. `HeroPendant` builds its whole
  // scene in an effect that depends on this — a fresh `{ x, y }` per render
  // rebuilt the pendant (canvas, model, HDRI decode, shader compile) every time
  // the hero re-rendered: as the preloader lifted, and again mid-scroll when
  // frame 3's copy swapped in, a 135 ms stall each.
  return useMemo(() => ({ x, y }), [x, y]);
};
