"use client";

// 📖 Docs: obsidian/frontend/components/common.md

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { animated, useSpring } from "@react-spring/web";

import { subscribeToTicker } from "@/lib/animation/ticker";
import { getSceneBudget, shouldRenderScene } from "@/lib/scene/device";
import { reportAssetError } from "@/components/lumiere/common/asset-banner";
import type {
  RingSlotState,
  RingsScene,
} from "@/lib/scene/rings/rings-scene";

import { useFeaturedProgress } from "./featured-progress";
import { ringOnStrip } from "./featured-trajectory";
import { RING_3D, SLOTS } from "./featured.config";
import { useFeaturedContent } from "./featured-content";
import { markRingsReady } from "@/lib/scene/rings-ready";

/** Start loading the scene this far before the block scrolls in (§4). */
const LOAD_MARGIN = "150% 0px";
/** Render only while the block is on, or about to be on, screen. */
const RENDER_MARGIN = "25% 0px";

/**
 * The ring strip on the featured stage: five rings in a row, first to last,
 * sliding right to left past the centre slot at one steady speed with the
 * scroll (`strip`), each turning a quarter round its own vertical axis per
 * slot (`RING_3D.turnsPerTransition`), at rest when dead centre.
 *
 * Two layers draw the same rings in the same places. The DOM layer is the
 * posters — Cycles renders in the 3D view's resting pose — placed by the same
 * strip; it is what bots, browsers without WebGL 2 and the first paint see.
 * The 3D layer is one canvas over the stage that reads the same placements
 * each frame, and once compiled it fades in and the posters fade out under it.
 */
/** The reference's poses: each ring's own lean, in degrees, over the shared three-quarter view. */
const POSES = [
  { roll: -9, pitch: 4 },
  { roll: 11, pitch: -3 },
  { roll: -5, pitch: 9 },
  { roll: 7, pitch: 2 },
  { roll: -12, pitch: -4 },
] as const;

export const FeaturedRings = () => {
  const { pieces } = useFeaturedContent();
  const featuredViews = pieces.map((piece, index) => ({
    src: piece.poster.src,
    alt: piece.poster.alt,
    model: piece.model.src,
    pose: POSES[index] ?? POSES[0],
  }));
  const { strip, spread } = useFeaturedProgress();
  const containerRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const spreadRef = useRef(spread);
  const [isSceneShown, setIsSceneShown] = useState(false);

  useEffect(() => {
    spreadRef.current = spread;
  }, [spread]);

  const fade = useSpring({
    scene: isSceneShown ? 1 : 0,
    config: { tension: 120, friction: 26 },
  });

  const viewsRef = useRef(featuredViews);
  useEffect(() => {
    viewsRef.current = featuredViews;
  });
  useEffect(() => {
    const container = containerRef.current;
    const anchor = anchorRef.current;
    const mount = mountRef.current;
    if (!container || !anchor || !mount) return;
    // D-10: posters only for a bot, no WebGL 2, Save-Data, ≤ 4 GB or reduced motion.
    if (!shouldRenderScene()) {
      markRingsReady();
      return;
    }
    const featuredViews = viewsRef.current;

    const budget = getSceneBudget();
    const cleanups: (() => void)[] = [];
    let scene: RingsScene | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let isDisposed = false;
    let isInView = false;
    let isDirty = true;
    let lastStrip = Number.NaN;
    let lastSpread = -1;
    // Slot geometry, measured: the centre box's centre and size within the container.
    const box = { cx: 0, cy: 0, width: 1, height: 1, ring: 1 };

    const measure = () => {
      const outer = container.getBoundingClientRect();
      const inner = anchor.getBoundingClientRect();
      box.cx = inner.left - outer.left + inner.width / 2;
      box.cy = inner.top - outer.top + inner.height / 2;
      box.width = inner.width;
      box.height = inner.height;
      // The centre ring's sphere, held inside the panel's height: on the
      // stacked tablet panel, wide and short, `fit` alone ran the ring into
      // the scroll cue above and the dots below.
      box.ring = Math.min(
        box.width * RING_3D.fit,
        outer.height * RING_3D.maxPanelShare,
      );
      scene?.setSize(outer.width, outer.height, box.ring);
      isDirty = true;
    };

    const slotsAt = (s: number): RingSlotState[] =>
      featuredViews.map((_, index) => {
        const d = index - s;
        const at = ringOnStrip(d, spreadRef.current);
        return {
          cx: box.cx + at.x * box.width,
          cy: box.cy + (at.y / SLOTS.centre.height) * box.height,
          size: box.ring * at.scale,
          opacity: at.opacity,
          // Measured from the centre, so a ring is at its resting pose when it
          // is dead centre, whatever the amount of turn.
          spin: -d * Math.PI * 2 * RING_3D.turnsPerTransition,
        };
      });

    const start = () => {
      canvas = document.createElement("canvas");
      canvas.className = "block h-full w-full";
      mount.appendChild(canvas);

      import("@/lib/scene/rings/rings-scene")
        .then(({ RingsScene: Scene }) =>
          Scene.create(
            canvas as HTMLCanvasElement,
            budget,
            featuredViews.map((view) => ({
              url: view.model,
              roll: (view.pose.roll * Math.PI) / 180,
              pitch: (view.pose.pitch * Math.PI) / 180,
            })),
          ),
        )
        .then((created) => {
          if (isDisposed) {
            created.dispose();
            return;
          }
          scene = created;
          measure();
          const resizeObserver = new ResizeObserver(measure);
          resizeObserver.observe(container);
          resizeObserver.observe(anchor);
          cleanups.push(() => resizeObserver.disconnect());

          cleanups.push(
            subscribeToTicker(
              () => {
                if (!isInView || document.hidden) return;
                const s = strip.get();
                // Everything here is driven by the scroll: a frame that has
                // not moved it has nothing new to draw.
                if (
                  !isDirty &&
                  s === lastStrip &&
                  spreadRef.current === lastSpread
                ) {
                  return;
                }
                lastStrip = s;
                lastSpread = spreadRef.current;
                isDirty = false;
                created.render(slotsAt(s));
              },
              () => budget.frameGapMs,
            ),
          );

          created.render(slotsAt(strip.get()));
          setIsSceneShown(true);
          markRingsReady();
        })
        .catch((error: unknown) => {
          // Preview: the red banner names the files; production: the posters stay.
          reportAssetError(featuredViews.map((view) => view.model).join(", "), error);
          markRingsReady();
        });
    };

    // Built once, at mount — under the preloader's curtain, which waits for it
    // (capped). Built as the block approached, it landed in scroll frames: a
    // 225 ms, then a 100 ms script task in collections; built in idle after the
    // entrance, its GPU work stalled hero frames (67 ms, 3/3, 4× phone). The
    // observer stays as a guard. Drawn only while it is near view.
    let isStarted = false;
    const startOnce = () => {
      if (isStarted || isDisposed) return;
      isStarted = true;
      loadObserver.disconnect();
      start();
    };
    const loadObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) startOnce();
      },
      { rootMargin: LOAD_MARGIN },
    );
    loadObserver.observe(container);
    cleanups.push(() => loadObserver.disconnect());

    // Under the curtain: the preloader waits for it (whenRingsReady, capped).
    startOnce();

    const viewObserver = new IntersectionObserver(
      ([entry]) => {
        isInView = entry.isIntersecting;
        if (isInView) isDirty = true;
      },
      { rootMargin: RENDER_MARGIN },
    );
    viewObserver.observe(container);
    cleanups.push(() => viewObserver.disconnect());

    return () => {
      isDisposed = true;
      cleanups.forEach((cleanup) => cleanup());
      scene?.dispose();
      canvas?.remove();
    };
  }, [strip]);

  return (
    <div ref={containerRef} className="featured__rings">
      {/* An unmoved copy of the slot box: the 3D layer measures the centre
          slot from it, whatever size the breakpoints give the box. */}
      <div ref={anchorRef} aria-hidden className="featured__ring featured__ring--anchor" />

      {featuredViews.map((view, index) => (
        <animated.div
          key={view.src}
          className="featured__ring"
          style={{
            opacity: strip.to((s) => ringOnStrip(index - s, spread).opacity),
            // Percentages of the ring's own box, which is itself sized in
            // design units — so the offsets scale with the page without a
            // `var()` ever entering the transform.
            transform: strip.to((s) => {
              const at = ringOnStrip(index - s, spread);
              const x = (at.x * 100).toFixed(4);
              const y = ((at.y / SLOTS.centre.height) * 100).toFixed(4);
              return `translate3d(${x}%, ${y}%, 0) scale(${at.scale.toFixed(5)})`;
            }),
          }}
        >
          <animated.div
            className="absolute inset-0"
            style={{
              // Held until the canvas fully covers it — a crossfade of two
              // near-identical rings reads as a double exposure.
              opacity: fade.scene.to((value) => (value > 0.995 ? 0 : 1)),
              // The poster was framed at `posterFit`; the 3D ring is drawn at `fit`.
              transform: `scale(${(RING_3D.fit / RING_3D.posterFit).toFixed(4)})`,
            }}
          >
            <Image
              src={view.src}
              alt={view.alt}
              fill
              sizes="35vw"
              className="featured__ring-plate"
            />
          </animated.div>
        </animated.div>
      ))}

      <animated.div
        ref={mountRef}
        aria-hidden
        className="featured__rings-canvas"
        style={{ opacity: fade.scene }}
      />
    </div>
  );
};
