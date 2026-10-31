// Ported from the Lumière reference (src/lib/animation/smooth-scroll-y.ts);
// the only change is the store's path (lib/lumiere/scroll-store.ts).

import { useScroll } from "@/lib/lumiere/scroll-store";

/** Further apart than this, the two scroll readings have lost sync. */
const OUT_OF_SYNC_PX = 2;

/**
 * The page's scroll position as Lenis animates it — fractional — rather than
 * the browser's, which is rounded to whole pixels.
 *
 * The difference only shows at the end of a smoothed scroll: Lenis eases the
 * last few pixels over many frames, but `window.scrollY` (and so every
 * `getBoundingClientRect`) moves a whole pixel every second or third frame. A
 * pinned scrub that reads the rounded value steps — 0.7px, nothing, 0.7px —
 * and anything moving smoothly on top of it, like the hero's cursor tilt, makes
 * the steps read as a twitch.
 *
 * Only for scrubs whose content is pinned: an element that itself moves with
 * the page is placed by the browser at the rounded position, so it must keep
 * reading the rounded one. Falls back to `window.scrollY` when there is no
 * Lenis or when the two disagree by more than a couple of pixels (a jump, a
 * scrollbar drag before Lenis has caught up).
 */
export const smoothScrollY = (): number => {
  const native = window.scrollY;
  const lenis = useScroll.getState().lenis;
  if (!lenis) return native;
  const animated = lenis.animatedScroll;
  return Math.abs(animated - native) > OUT_OF_SYNC_PX ? native : animated;
};

/**
 * An element's top relative to the viewport, at the smoothed scroll position:
 * its document offset (exact, from the rounded pair) less `smoothScrollY()`.
 */
export const smoothTop = (rectTop: number): number =>
  rectTop + window.scrollY - smoothScrollY();
