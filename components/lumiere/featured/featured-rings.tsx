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
import { isOptimizableImage } from "@/lib/image-hosts";
import { useFeaturedContent } from "./featured-content";
import { markRingsReady } from "@/lib/scene/rings-ready";
import { whenPendantReady } from "@/lib/scene/pendant-ready";
import { loadSceneLibraries } from "@/lib/scene/load-libraries";

/** How much larger than the slot box a piece's photograph is drawn (the box is 245 × 265 design units). */
const PIECE_SCALE = 1.5;

/** Start loading the scene this far before the block scrolls in (§4). */
const LOAD_MARGIN = "150% 0px";
/**
 * The most the build waits for the pendant's first frame. A pendant that kept
 * its poster (no WebGL 2, a load error) resolves at once; a slow one holds the
 * rings this long and no longer.
 */
const PENDANT_WAIT_MS = 4000;
/** Idle slot the build asks for once it may start; a busy phone gets it by then anyway. */
const IDLE_TIMEOUT_MS = 1500;
/** Render only while the block is on, or about to be on, screen. */
const RENDER_MARGIN = "25% 0px";

/**
 * THE PIECE STRIP on the featured stage (P5b, owner decision 1): the Hub's featured pieces in a row, first to last,
 * sliding right to left past the centre slot at one steady speed with the
 * scroll (`strip`) — the same slot trajectory, springs and dots as ever.
 *
 * Until a piece has a model of its own (future `products.model_glb_url`) each piece is its photograph: the approved
 * cut-out standing free, else the photograph on a clean plate, so the stage always shows the piece named on the left.
 * No stand-in 3D ring ships. The 3D layer below is kept, and runs only when EVERY piece carries a model: one canvas over
 * the stage reads the same placements each frame, turns each piece a quarter round its own vertical axis per slot
 * (`RING_3D.turnsPerTransition`), and fades in over the photographs once compiled.
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
    src: piece.stage.src,
    alt: piece.stage.alt,
    kind: piece.stage.kind,
    model: piece.stage.model,
    pose: POSES[index] ?? POSES[0],
  }));
  // The 3D path needs a model for every piece: a strip of mixed pieces and rings would be the very mismatch this fixes.
  const models = featuredViews.map((view) => view.model);
  const hasModels = models.length > 0 && models.every((model): model is string => !!model);
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
    // D-10: photographs only for a bot, no WebGL 2, Save-Data, ≤ 4 GB or reduced motion — and while no model exists.
    if (!hasModels || !shouldRenderScene()) {
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

      loadSceneLibraries()
        .then(() => import("@/lib/scene/rings/rings-scene"))
        .then(({ RingsScene: Scene }) =>
          Scene.create(
            canvas as HTMLCanvasElement,
            budget,
            featuredViews.map((view) => ({
              url: view.model as string,
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

    // AFTER THE PENDANT'S FIRST FRAME, AS THE BLOCK NEARS, IN IDLE (P2, report
    // §10 step 3). The reference built the rings at mount under its curtain,
    // which on a phone meant the curtain waited for a second scene (context,
    // PMREM, five compiles) two screens below the fold, or lifted on its cap.
    // Here the build may start only once the hero's own scene has drawn (or
    // given up), and then only when the block is within a viewport and a half
    // — in an idle slot, so the hero's entrance frames are never shared with
    // it. The scene's own `yieldTask` steps keep each piece of the build short.
    let isStarted = false;
    let isNear = false;
    let pendantDone = false;
    const whenIdle = (run: () => void) => {
      if (typeof window.requestIdleCallback === "function") window.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS });
      else setTimeout(run, 50);
    };
    const startOnce = () => {
      if (isStarted || isDisposed || !isNear || !pendantDone) return;
      isStarted = true;
      loadObserver.disconnect();
      whenIdle(() => {
        if (!isDisposed) start();
      });
    };
    const loadObserver = new IntersectionObserver(
      ([entry]) => {
        isNear = entry.isIntersecting;
        startOnce();
      },
      { rootMargin: LOAD_MARGIN },
    );
    loadObserver.observe(container);
    cleanups.push(() => loadObserver.disconnect());
    whenPendantReady(PENDANT_WAIT_MS).then(() => {
      pendantDone = true;
      startOnce();
    });

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
  }, [strip, hasModels]);

  return (
    <div ref={containerRef} className="featured__rings">
      {/* An unmoved copy of the slot box: the 3D layer measures the centre
          slot from it, whatever size the breakpoints give the box. */}
      <div ref={anchorRef} aria-hidden className="featured__ring featured__ring--anchor" />

      {featuredViews.map((view, index) => (
        <animated.div
          key={`${index}-${view.src}`}
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
              // The 3D layer draws at `fit`; a photograph is framed to fill the slot box (`PIECE_SCALE`).
              transform: `scale(${(hasModels ? RING_3D.fit / RING_3D.posterFit : PIECE_SCALE).toFixed(4)})`,
            }}
          >
            <Image
              src={view.src}
              alt=""
              aria-hidden
              unoptimized={!isOptimizableImage(view.src)}
              fill
              sizes="35vw"
              className={`featured__ring-plate featured__ring-plate--${view.kind}`}
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
