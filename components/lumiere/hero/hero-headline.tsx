"use client";

import { TextSwap } from "@/components/lumiere/common/text-swap";
import { useHasLoaded, useLiftedEarly } from "@/lib/lumiere/preload-store";

import { useHeroContent } from "./hero-content";
import { REVEAL } from "./hero-reveal";

/**
 * The hero headline: frame 1's words entering letter by letter out of a blur
 * (the site's heading entrance) once the preloader lifts, the run carried on
 * across the line breaks; then handing over to the photograph's words as frame
 * 3 takes the screen, and back again on the way up (`TextSwap`).
 *
 * Gated on the preloader rather than on the viewport: the headline is on
 * screen from the start, so until the preloader lifts there is nothing to see
 * it with.
 *
 * The lines are `hero.h1a` / `hero.h1b` broken as §13 rows 1–2 approved them
 * (lib/content/lumiere-home.ts); Japanese carries no italic run.
 */
export interface HeroHeadlineProps {
  isPhoto: boolean;
}

export const HeroHeadline = ({ isPhoto }: HeroHeadlineProps) => {
  const hasLoaded = useHasLoaded();
  // Lifted before hydration (P2b): the words are already on screen, so the
  // first version is simply there — no letter entrance to replay.
  const liftedEarly = useLiftedEarly();
  const { content } = useHeroContent();

  return (
    <TextSwap
      versions={[content.headline, content.headlinePhoto]}
      active={isPhoto ? 1 : 0}
      first={liftedEarly ? undefined : { ready: hasLoaded, delay: REVEAL.headline }}
    />
  );
};
