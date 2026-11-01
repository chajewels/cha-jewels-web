// Ported from the Lumière reference (src/lib/scene/pendant-ready.ts).

/**
 * One-shot signal: the hero pendant is ready to show — its scene compiled and
 * drew a frame, or the page decided to keep the poster (bot, no WebGL 2, load
 * failure). The preloader waits on it so the gate never lifts onto a poster
 * that is about to be swapped.
 */

import { registerReadyGate } from "@/lib/lumiere/ready-gates";

let resolveReady: () => void = () => {};
const ready = new Promise<void>((resolve) => {
  resolveReady = resolve;
});
// Registered as the module loads — before any effect — so the preloader
// (components/lumiere/common/preloader.tsx) counts it from its first frame.
registerReadyGate("pendant", ready);

export const markPendantReady = (): void => resolveReady();

/** Resolves when the pendant is ready, or after `timeoutMs` — whichever is first. */
export const whenPendantReady = (timeoutMs: number): Promise<void> =>
  Promise.race([
    ready,
    new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs);
    }),
  ]);
