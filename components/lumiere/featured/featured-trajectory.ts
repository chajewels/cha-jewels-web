import { lerp } from "./featured-easing";
import { OFF_SLOT, SIDE_SCALE, SLOTS } from "./featured.config";

/**
 * Where a ring is on the strip.
 *
 * The rings stand in a row, first to last, and the row slides right to left
 * past the centre slot as the page scrolls. `d` is a ring's distance from the
 * centre in slots: 0 is the centre, 1 the right-hand slot, -1 the left, and
 * past ±1 a ring fades out on its way further off (or in, on its way to the
 * right slot). There is no wrap: before the first ring there is nothing on the
 * left, after the last nothing on the right.
 *
 * `x` comes back as a fraction of the ring's own box, measured from the panel's
 * centre, and `spread` is where the side slots sit in those same terms — the
 * one number the breakpoints move.
 */
export interface RingPlacement {
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

/**
 * Everything horizontal is a fraction of the ring's own box, not of the page.
 * The box is sized in the stylesheet — design units above 1440, a share of the
 * panel below it — so the same fractions hold at every width without this
 * module knowing which band it is in.
 */
const CENTRE_X = 0.5 / SLOTS.centre.width;
/** How much further out a ring travels while it fades: 340 against 226. */
const OFF_RATIO = OFF_SLOT.offset / SLOTS.side.offset;
// The side slots' centres sit half a unit below the centre slot's — 368
// against 367.5 — so the path carries that rather than the layout.
const SIDE_Y = 0.5;
/** Past the side slot, the fade-out takes this much more of a slot. */
const FADE_SPAN = 0.5;

export const ringOnStrip = (d: number, spread: number): RingPlacement => {
  const away = Math.abs(d);
  const side = Math.sign(d) || 1;
  const SIDE_X = spread;
  const OFF_X = spread * OFF_RATIO;

  // Between the side slots: through the centre.
  if (away <= 1) {
    return {
      x: d * SIDE_X + CENTRE_X * (1 - away),
      y: lerp(0, SIDE_Y, away),
      scale: lerp(1, SIDE_SCALE, away),
      opacity: lerp(SLOTS.centre.opacity, SLOTS.side.opacity, away),
    };
  }

  // Beyond a side slot: further out, smaller, fading to nothing.
  const f = Math.min(1, (away - 1) / FADE_SPAN);
  return {
    x: side * lerp(SIDE_X, OFF_X, f),
    y: SIDE_Y,
    scale: lerp(SIDE_SCALE, OFF_SLOT.scale, f),
    opacity: lerp(SLOTS.side.opacity, OFF_SLOT.opacity, f),
  };
};
