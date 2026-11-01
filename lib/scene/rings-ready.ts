// Ported from the Lumière reference (src/lib/scene/rings-ready.ts). The
// reference's invariant "the rings build under the curtain" is NOT kept on
// this site (P2, report §10 step 3): the rings are built after the pendant has
// drawn its first frame and only as the featured block nears, in idle, so
// neither the curtain nor the hero's first frames pay for a scene two screens
// down. The signal stays for the asset banner and the tests.

/**
 * One-shot signal: the featured rings' scene is built (context, studio, every
 * ring, programs compiled) — or the page kept the posters. Not a preloader
 * gate any more (see above).
 */

let resolveReady: () => void = () => {};
const ready = new Promise<void>((resolve) => {
  resolveReady = resolve;
});

export const markRingsReady = (): void => resolveReady();

/** Resolves when the rings are ready, or after `timeoutMs` — whichever is first. */
export const whenRingsReady = (timeoutMs: number): Promise<void> =>
  Promise.race([
    ready,
    new Promise<void>((resolve) => {
      setTimeout(resolve, timeoutMs);
    }),
  ]);
