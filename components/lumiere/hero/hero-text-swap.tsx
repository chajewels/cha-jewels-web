"use client";

import { useEffect, useState } from "react";

import { subscribeToTicker } from "@/lib/animation/ticker";

import { TEXT_SWAP } from "./hero.config";
import { useHeroProgress } from "./hero-progress";

/** Read on every frame — the scrub must not lag the threshold. */
const everyFrame = () => 0;

/**
 * Frame 3's copy handover is the shared `TextSwap` (components/common); this
 * file only decides when it happens.
 *
 * Whether the hero is in its photograph scene: true from `TEXT_SWAP.toPhoto`
 * on the way down, false again only below `TEXT_SWAP.toRest` on the way up.
 * A state, so the copy swaps once per crossing rather than per frame.
 */
export const usePhotoScene = (): boolean => {
  const progress = useHeroProgress();
  const [isPhoto, setIsPhoto] = useState(false);

  useEffect(
    () =>
      subscribeToTicker(() => {
        const p = progress.get();
        setIsPhoto((was) =>
          was ? p > TEXT_SWAP.toRest : p >= TEXT_SWAP.toPhoto,
        );
      }, everyFrame),
    [progress],
  );

  return isPhoto;
};
