import type { Lang } from "@/lib/i18n";
import type { LumiereHeroContent } from "@/lib/content/lumiere-home";

import type { HeroChrome } from "./hero-content";
import { HeroMotion } from "./hero-motion";
import { HeroStage } from "./hero-stage";

/**
 * Hero — the three Figma frames as one continuous, scroll-driven sequence.
 *
 * `HeroMotion` owns the pin and publishes progress; `HeroStage` is everything
 * that stays on screen while it runs. Laid out against a 1440x800 design frame
 * scaled by `--raw-unit-design`, so it holds its proportions from 1440 upward.
 *
 * Content and chrome come in from the server (lib/content/lumiere-home.ts and
 * the home view), so the copy follows the page's language and the controls
 * are the site's own.
 */
export interface HeroSectionProps {
  lang: Lang;
  content: LumiereHeroContent;
  chrome: HeroChrome;
}

export const HeroSection = (props: HeroSectionProps) => (
  <HeroMotion>
    <HeroStage {...props} />
  </HeroMotion>
);
