"use client";

import { createContext, useContext } from "react";
import type { SpringValue } from "@react-spring/web";

/**
 * Scroll progress for the hero, 0 at frame 1 and 1 at frame 3.
 *
 * The context lives in its own module on purpose. When it was declared inside
 * the component that provides it, that module was both a client entry point and
 * an import of its own consumers, so the bundler instantiated it twice and the
 * provider and the readers ended up on two different contexts.
 */
export const HeroProgressContext = createContext<SpringValue<number> | null>(
  null,
);

export const useHeroProgress = (): SpringValue<number> => {
  const progress = useContext(HeroProgressContext);

  if (!progress) {
    throw new Error("useHeroProgress must be called inside <HeroMotion>.");
  }

  return progress;
};
