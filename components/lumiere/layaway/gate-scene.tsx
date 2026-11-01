"use client";

import { useEffect, useRef, useState } from "react";

import { subscribeToTicker } from "@/lib/animation/ticker";
import { getSceneBudget, shouldRenderScene } from "@/lib/scene/device";
import { whenAfterTTI } from "@/lib/scene/after-tti";
import { NearIsland } from "@/components/lumiere/common/near-island";
import type { GateScene } from "@/lib/scene/gate/gate-scene";

/**
 * THE HALCYON GATE beside the layaway steps (P3 item 5; lib/scene/gate/
 * gate-scene.ts is the port, docs/design-refs/halcyon-gate/ the source, the
 * contract and the tint). A THIRD WebGL context on the home, so it is never
 * drawn at the same time as the pendant or the rings: the three scenes each
 * render only while their own box is in view (and the tab visible) and the
 * band is a page below the featured stage, so at most one context draws per
 * frame.
 *
 *   - mounts when the band nears the viewport (NearIsland) and, like the
 *     other two scenes, only after the TTI window (lib/scene/after-tti.ts);
 *   - the poster (CSS: the tinted sky, the brass sea and the ring) stands
 *     for it under D-10's budget — a crawler, no WebGL 2, Save-Data, 4 GB of
 *     memory or less — and under reduced motion;
 *   - a real entrance (GetLayers reveal choreography for this scene): out of
 *     a white-out, the camera drops from high above the sea over 2.8 s —
 *     two CONFIG values driven from here, never the shader;
 *   - pauses off screen and when the tab is hidden (the shared ticker);
 *   - the pointer over the plate leaves the ripple trail; no click, no scroll.
 */
const ENTRANCE_MS = 2800;
const ENTRANCE_FROM = { camHeight: 0.4, brightness: 1.9 } as const;
const IN_VIEW_MARGIN = "10% 0px";

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

const Live = ({ box }: { box: React.RefObject<HTMLDivElement | null> }) => {
  useEffect(() => {
    const plate = box.current;
    if (!plate || !shouldRenderScene()) return;
    let disposed = false;
    let scene: GateScene | null = null;
    let canvas: HTMLCanvasElement | null = null;
    let inView = false;
    let unsubscribe: (() => void) | null = null;
    let started = 0;
    const budget = getSceneBudget();
    const cleanups: (() => void)[] = [];

    whenAfterTTI()
      .then(() => import("@/lib/scene/gate/gate-scene"))
      .then(({ createGateScene, GATE_CONFIG }) => {
        if (disposed) return;
        canvas = document.createElement("canvas");
        canvas.setAttribute("aria-hidden", "true");
        plate.appendChild(canvas);
        scene = createGateScene(canvas, GATE_CONFIG);
        const created = scene;
        const resize = () => created.setSize(plate.clientWidth, plate.clientHeight, Math.min(window.devicePixelRatio || 1, budget.maxPixelRatio));
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(plate);
        cleanups.push(() => ro.disconnect());

        const onMove = (e: PointerEvent) => {
          const r = plate.getBoundingClientRect();
          created.setPointer((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
        };
        plate.addEventListener("pointermove", onMove, { passive: true });
        cleanups.push(() => plate.removeEventListener("pointermove", onMove));

        const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; }, { rootMargin: IN_VIEW_MARGIN });
        observer.observe(plate);
        cleanups.push(() => observer.disconnect());

        unsubscribe = subscribeToTicker((time) => {
          if (!inView || document.hidden) return;
          if (!started) started = time;
          // The entrance: from the white-out high above the sea down to the shore.
          const k = easeOutExpo(Math.min(1, (time - started) / ENTRANCE_MS));
          created.setEntrance(
            ENTRANCE_FROM.camHeight + (GATE_CONFIG.camHeight - ENTRANCE_FROM.camHeight) * k,
            ENTRANCE_FROM.brightness + (GATE_CONFIG.brightness - ENTRANCE_FROM.brightness) * k,
          );
          created.render(time / 1000);
          if (plate.dataset.scene !== "live") plate.dataset.scene = "live";
        }, () => budget.frameGapMs);
      })
      .catch(() => {
        // The poster stays; nothing to report to a reader.
      });

    return () => {
      disposed = true;
      unsubscribe?.();
      cleanups.forEach((fn) => fn());
      scene?.dispose();
      canvas?.remove();
      delete plate.dataset.scene;
    };
  }, [box]);
  return null;
};

export const GateSceneIsland = ({ note }: { note: string }) => {
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div ref={box} className="layaway__plate" data-gate-plate>
      <div className="layaway__poster" aria-hidden="true"><span className="layaway__poster-ring" /></div>
      <p className="layaway__plate-note font-manrope">{note}</p>
      {ready && (
        <NearIsland margin="60% 0px">
          <Live box={box} />
        </NearIsland>
      )}
    </div>
  );
};
