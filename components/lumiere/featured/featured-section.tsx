"use client";

import type { LumiereFeaturedContent } from "@/lib/content/lumiere-home";

import { FeaturedContentContext } from "./featured-content";
import { FeaturedMotion } from "./featured-motion";
import { FeaturedStage } from "./featured-stage";

/**
 * The featured piece — Get Layers "Hero 5 (Featured Pieces)", 1443:53.
 *
 * Two equal panels filling the window inside one gutter on all four sides
 * (Figma's 674x736 pair at 1440x800): the photograph on the left with the
 * piece's name and price over it, and on the right a pale stage where one ring
 * turns through three views.
 *
 * `FeaturedMotion` owns the pin and publishes progress; `FeaturedStage` is
 * everything that stays on screen while it runs — the same division the hero
 * uses, for the same reason. The pieces are the Hub's featured pieces (P5b: one to
 * five, the strip follows the count); the block is not drawn when there are none.
 */
export const FeaturedSection = ({ content }: { content: LumiereFeaturedContent }) => (
  <FeaturedContentContext.Provider value={content}>
    <FeaturedMotion count={content.pieces.length}>
      <FeaturedStage />
    </FeaturedMotion>
  </FeaturedContentContext.Provider>
);
