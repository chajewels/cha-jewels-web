// Ported from the Lumière reference (src/lib/scene/rings-ready.ts); invariant "The rings build under the curtain".

/**
 * One-shot signal: the featured rings' scene is built (context, studio, every
 * ring, programs compiled) — or the page kept the posters. The preloader waits
 * on it, capped, so the build's GPU work (context, PMREM, compiles) happens
 * under the curtain instead of in a scroll frame (optimize-3d-scene §3).
 */

import { registerReadyGate } from "@/lib/lumiere/ready-gates";

let resolveReady: () => void = () => {};
const ready = new Promise<void>((resolve) => {
  resolveReady = resolve;
});
// Registered as the module loads — before any effect — so the preloader
// (components/lumiere/common/preloader.tsx) counts it from its first frame.
registerReadyGate("rings", ready);

export const markRingsReady = (): void => resolveReady();

/** Resolves when the rings are ready, or after `timeoutMs` — whichever is first. */
export const whenRingsReady = (timeoutMs: number): Promise<void> =>
  Promise.race([
    ready,
    new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs);
    }),
  ]);
