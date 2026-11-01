"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { animated, useSpring } from "@react-spring/web";

import { subscribeToTicker } from "@/lib/animation/ticker";
import {
  getSceneBudget,
  prefersReducedMotion,
  shouldRenderScene,
} from "@/lib/scene/device";
import { reportAssetError } from "@/components/lumiere/common/asset-banner";
import { markPendantReady } from "@/lib/scene/pendant-ready";
import { PENDANT_MODEL_URL } from "@/lib/scene/pendant/pendant-assets";
import { loadSceneLibraries } from "@/lib/scene/load-libraries";
// `import type` ONLY: a value import here put three.js in the home's first load
// (lib/scene/pendant/pendant-assets.ts explains).
import type {
  PendantFraming,
  PendantScene,
} from "@/lib/scene/pendant/pendant-scene";

import { range } from "./hero-geometry";
import {
  HERO_TILT,
  PENDANT,
  PENDANT_COMPACT,
  TIMELINE,
} from "./hero.config";
import { useHeroProgress } from "./hero-progress";
import type { HeroTilt } from "./use-hero-tilt";
import { useHeroContent } from "./hero-content";



/** The posters at the two full-bleed photographs' quality (report §10 step 1). */
const POSTER_QUALITY = 82;

/** Warm the scene a viewport before it scrolls in (optimize-3d-scene §4). */
const IN_VIEW_MARGIN = "100% 0px";

/**
 * The framing lives beside the box size in globals.css, so the breakpoint that
 * resizes the box is the same one that reframes the scene.
 */
const readFraming = (element: HTMLElement): PendantFraming => {
  const style = getComputedStyle(element);
  return {
    centre: parseFloat(style.getPropertyValue("--pendant-oval-centre")),
    span: parseFloat(style.getPropertyValue("--pendant-oval-span")),
  };
};

/**
 * The hero centrepiece: a 3D emerald pendant over a Cycles render of itself.
 *
 * The render is the poster — it is what bots, browsers without WebGL 2 and the
 * first paint get, framed identically to the scene. The scene loads in its own
 * chunk after hydration, compiles before it is shown, and then fades in over
 * the poster; only once it covers it is the poster hidden, so the crossfade
 * never reads as a double exposure.
 */
export interface HeroPendantProps {
  /** Shared with the card ring — see `useHeroTilt`. */
  tilt: HeroTilt;
}

export const HeroPendant = ({ tilt }: HeroPendantProps) => {
  const { content } = useHeroContent();
  const { pendant } = content;
  const progress = useHeroProgress();
  const boxRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const [isSceneShown, setIsSceneShown] = useState(false);

  const fade = useSpring({
    scene: isSceneShown ? 1 : 0,
    config: { tension: 120, friction: 26 },
  });

  useEffect(() => {
    const box = boxRef.current;
    const mount = mountRef.current;
    if (!box || !mount) return;

    // D-10: posters only for a bot, no WebGL 2, Save-Data, ≤ 4 GB of memory or
    // reduced motion (lib/scene/device.ts).
    if (!shouldRenderScene()) {
      markPendantReady();
      return;
    }

    // A fresh canvas per run: React runs effects twice in development, and two
    // renderers sharing one context would corrupt each other's state cache.
    const canvas = document.createElement("canvas");
    canvas.className = "block h-full w-full";
    mount.appendChild(canvas);

    const budget = getSceneBudget();
    const isAnimated = !prefersReducedMotion();
    const cleanups: (() => void)[] = [];
    let scene: PendantScene | null = null;
    let isDisposed = false;
    let isInView = true;

    // After the webfonts (the curtain's first wait, report §10 step 3): the
    // build then follows the type and the hero's images instead of sharing
    // the first tasks with them. Still under the curtain — the preloader waits
    // on this scene's gate, capped.
    document.fonts.ready
      .catch(() => undefined)
      // The libraries one task at a time (lib/scene/load-libraries.ts), then
      // the scene itself.
      .then(() => loadSceneLibraries())
      .then(() => import("@/lib/scene/pendant/pendant-scene"))
      .then(({ PendantScene: Scene }) =>
        Scene.create(canvas, budget, isAnimated),
      )
      .then((created) => {
        if (isDisposed) {
          created.dispose();
          return;
        }
        scene = created;

        const resize = () =>
          created.setSize(box.clientWidth, box.clientHeight, readFraming(box));
        resize();
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(box);
        cleanups.push(() => resizeObserver.disconnect());

        const inViewObserver = new IntersectionObserver(
          ([entry]) => {
            isInView = entry.isIntersecting;
          },
          { rootMargin: IN_VIEW_MARGIN },
        );
        inViewObserver.observe(box);
        cleanups.push(() => inViewObserver.disconnect());

        cleanups.push(
          subscribeToTicker(
            (time) => {
              if (!isInView || document.hidden) return;
              // Fully faded out once the cluster takes over — nothing to draw.
              const exit = range(
                progress.get(),
                TIMELINE.pendantExit[0],
                TIMELINE.pendantExit[1],
              );
              if (exit >= 1) return;
              // The same spring the card ring tilts from, faded out the same way.
              const weight = 1 - exit;
              created.setTilt(
                tilt.x.get() * HERO_TILT.yaw * weight,
                tilt.y.get() * HERO_TILT.pitch * weight,
              );
              created.render(time);
            },
            () => budget.frameGapMs,
          ),
        );

        created.render(performance.now());
        setIsSceneShown(true);
        markPendantReady();
      })
      .catch((error: unknown) => {
        // Preview: the red banner names the file; production: the poster stays.
        reportAssetError(PENDANT_MODEL_URL, error);
        markPendantReady();
      });

    return () => {
      isDisposed = true;
      cleanups.forEach((cleanup) => cleanup());
      scene?.dispose();
      canvas.remove();
    };
  }, [progress, tilt]);

  return (
    <div ref={boxRef} className="relative h-full w-full">
      {/* Which poster shows is the same breakpoint that sizes the box
          (globals.css, max-width 929px), so each is always shown in its own
          frame. */}
      <animated.div
        className="absolute inset-0"
        style={{ opacity: fade.scene.to((value) => (value > 0.995 ? 0 : 1)) }}
      >
        {/* ONE fetchPriority="high" on the page (report §10 step 1): the compact
            poster, the phone's LCP image. The desktop plate is eager but not
            prioritised, so it never queues ahead of the first paint. */}
        <Image
          src={pendant.poster.src}
          sizes="30vw"
          alt={pendant.poster.alt}
          width={PENDANT.width}
          height={PENDANT.height}
          quality={POSTER_QUALITY}
          loading="eager"
          className="hidden h-full w-full max-w-none object-fill min-[930px]:block"
        />
        <Image
          src={pendant.posterCompact.src}
          sizes="(max-width: 767px) 802px, 913px"
          alt={pendant.posterCompact.alt}
          width={PENDANT_COMPACT.width}
          height={PENDANT_COMPACT.height}
          quality={POSTER_QUALITY}
          priority
          fetchPriority="high"
          className="h-full w-full max-w-none object-fill min-[930px]:hidden"
        />
      </animated.div>
      <animated.div
        ref={mountRef}
        aria-hidden
        className="absolute inset-0"
        style={{ opacity: fade.scene }}
      />
    </div>
  );
};
