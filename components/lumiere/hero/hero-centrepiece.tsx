"use client";

import { useEffect } from "react";
import Image from "next/image";
import { animated, to, type SpringValue } from "@react-spring/web";

import { isOptimizableImage } from "@/lib/image-hosts";
import { markPendantReady } from "@/lib/scene/pendant-ready";

import { range } from "./hero-geometry";
import { HERO_TILT, TIMELINE } from "./hero.config";
import { useHeroContent } from "./hero-content";
import { useHeroProgress } from "./hero-progress";
import type { HeroTilt } from "./use-hero-tilt";

const TILT_EPSILON = 0.0005;

/** The centrepiece's entrance, 0…1 over the same intro the cards run, a beat behind the first of them. */
const arrival = (t: number) => {
  const x = range(t, 0.25, 1);
  return 1 - (1 - x) ** 3;
};

/**
 * THE RING'S CENTREPIECE (P5b, owner decision 3): a real Cha Jewels piece where the placeholder emerald pendant hung.
 * The best piece of the Hub's hero deck — its approved hero cut-out standing free, else the photograph in a rounded
 * frame — at the ring's centre, with the pendant's own motion: it arrives with the cards, tilts toward the cursor on the
 * same spring pair as the ring (weight faded out over `TIMELINE.pendantExit`), and dissolves into the haze the box's
 * wrapper (hero-cluster.tsx) draws as the cluster starts to grow. No 3D here — the 3D pendant path (hero-pendant.tsx)
 * runs only when the Hub sends a site model.
 */
export const HeroCentrepiece = ({ tilt, intro }: { tilt: HeroTilt; intro: SpringValue<number> }) => {
  const { content } = useHeroContent();
  const progress = useHeroProgress();
  const { image, kind } = content.centrepiece;

  // The rings below the fold wait for the hero's own first frame (featured-rings.tsx); a still picture is ready now.
  useEffect(() => markPendantReady(), []);

  return (
    <animated.div
      className="relative h-full w-full"
      style={{
        opacity: intro.to(arrival),
        transform: to([tilt.x, tilt.y, progress, intro], (x, y, p, t) => {
          const weight = 1 - range(p, TIMELINE.pendantExit[0], TIMELINE.pendantExit[1]);
          const yaw = x * HERO_TILT.yaw * weight;
          const pitch = y * HERO_TILT.pitch * weight;
          const grow = 0.88 + 0.12 * arrival(t);
          const scale = grow === 1 ? "" : ` scale(${grow.toFixed(4)})`;
          if (Math.abs(yaw) < TILT_EPSILON && Math.abs(pitch) < TILT_EPSILON) return grow === 1 ? "none" : scale.trim();
          return `perspective(var(--hero-tilt-perspective)) rotateX(${pitch}rad) rotateY(${yaw}rad)${scale}`;
        }),
      }}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(max-width: 929px) 120px, 200px"
        quality={82}
        placeholder={image.blur ? "blur" : "empty"}
        blurDataURL={image.blur}
        unoptimized={!isOptimizableImage(image.src)}
        priority
        fetchPriority="high"
        className={`hero__centrepiece hero__centrepiece--${kind}`}
      />
    </animated.div>
  );
};
