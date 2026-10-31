import { CAP_RATIO_SERIF } from "./collections.config";

/**
 * Reconciles a browser's line box with the cap-trimmed box Figma reports.
 *
 * Figma sets `text-box-trim: trim-both` on this whole block, so the frame it
 * gives for a line of type is the cap height, not the leading. A browser lays
 * out the leading. The difference is `leading - cap`, and it is split evenly
 * above and below the line — which is exactly what a negative block margin
 * takes back.
 *
 * It holds for any number of lines: a paragraph's box is `(n - 1) * leading +
 * cap` trimmed against `n * leading` laid out, and the difference is still one
 * `leading - cap` however many lines there are.
 *
 * This is not cosmetic. Every position inside a card comes from Auto Layout
 * distributing these heights, so an untrimmed box moves everything below it.
 *
 * The trim is written in `em` rather than design units, so it is a proportion
 * of whatever size the text is actually drawn at. Below 1440 the block's type
 * leaves the design unit and rides its own ramp; a trim pinned to the unit
 * would drift away from the text it is trimming. In `em` it cannot.
 */
export const capTrim = (size: number, leading: number, cap: number) => ({
  marginBlock: `${(cap - leading) / 2 / size}em`,
});

/** The same, for Instrument Serif, where the cap follows a fixed ratio. */
export const capTrimSerif = (size: number, leading: number) =>
  capTrim(size, leading, size * CAP_RATIO_SERIF);
