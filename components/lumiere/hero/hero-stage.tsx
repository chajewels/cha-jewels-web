"use client";

import Image from "next/image";
import { animated } from "@react-spring/web";

import { CategoryIndex } from "./category-index";
import { HeroContentContext } from "./hero-content";
import { HeroCluster } from "./hero-cluster";
import { HeroFooter } from "./hero-footer";
import { HeroHeader } from "./hero-header";
import { range } from "./hero-geometry";
import { HeroHeadline } from "./hero-headline";
import type { HeroSectionProps } from "./hero-section";
import { usePhotoScene } from "./hero-text-swap";
import { TIMELINE } from "./hero.config";
import { useHeroProgress } from "./hero-progress";

/**
 * Black to white, tied to how much of the screen the photograph has taken.
 * Interpolated rather than toggled, so there is no moment where the copy is
 * unreadable against the image.
 */
const inkAt = (p: number): string => {
  const channel = Math.round(
    255 * range(p, TIMELINE.invert[0], TIMELINE.invert[1]),
  );

  return `rgb(${channel} ${channel} ${channel})`;
};

/**
 * The pinned stage — everything that stays on screen for the whole scrub.
 *
 * Chrome inherits its colour from here through `currentColor`, so the inversion
 * is one animated property rather than one per text node. The headline sits
 * above the cluster: the hero card grows underneath it and it has to stay
 * legible on top.
 */
export const HeroStage = ({ lang, content, chrome }: HeroSectionProps) => {
  const progress = useHeroProgress();
  // Frame 3's copy handover, shared by the headline and the standfirst so the
  // two change on the same frame.
  const isPhoto = usePhotoScene();

  return (
    <HeroContentContext.Provider value={{ lang, content, chrome }}>
      <animated.section
        aria-labelledby="hero-headline"
        // the preloader waits for this screen's own images (preloader.tsx)
        data-preload=""
        className="relative isolate h-svh w-full overflow-hidden bg-surface"
        style={{ color: progress.to(inkAt) }}
      >
        <Image
          src="/lumiere/shared/paper.webp"
          alt=""
          aria-hidden
          fill
          priority
          sizes="100vw"
          className="z-0 object-cover"
        />

        <div className="absolute inset-0 z-10">
          <HeroCluster />
        </div>

        {/* Below 1024 the ring fills the middle of the screen, so the headline
            moves out from beside it to above it. `lg:` restores the Figma
            placement verbatim — the desktop branch is untouched. */}
        {/* THE PAGE'S ONE <h1>: the hero headline (report §15.7; SEO
            governance). Its plain text is in the server HTML — the engine's
            letters are hidden copies over a visible, readable line. */}
        <h1
          id="hero-headline"
          // A flex column, and not for the layout: each line's mask carries a
          // negative margin to hide the slack it needs around the glyphs, and
          // between plain blocks those margins collapse with their neighbours —
          // one line's pull-back cancels the next one's and the headline grows by
          // a third. Flex items do not collapse margins, so every line pulls back
          // its own.
          className={"absolute left-u-40 z-30 flex max-w-[calc(100vw-80*var(--raw-unit-design))] flex-col items-start font-serif text-display top-[var(--headline-top)] w-auto lg:top-[calc(50%-104*var(--raw-unit-design))] lg:w-u-350"}
        >
          <HeroHeadline isPhoto={isPhoto} />
        </h1>

        <HeroHeader />
        <CategoryIndex />
        <HeroFooter isPhoto={isPhoto} />
      </animated.section>
    </HeroContentContext.Provider>
  );
};
