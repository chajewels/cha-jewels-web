// Ported verbatim from the Lumière reference (src/utils/design-unit.ts).

/**
 * Converts a Figma design pixel into a CSS length.
 *
 * The hero is laid out against a 1440-wide frame; `--raw-unit-design` resolves
 * one of those pixels to `100vw / 1440`, so the composition stays proportional
 * to the viewport at every desktop width. See app/lumiere/tokens.css.
 */

/**
 * Rounds to a CSS-safe decimal string.
 *
 * `calc()` rejects exponential notation and silently drops the whole
 * declaration when it sees any — and trigonometry produces it readily: the
 * cosine of a right angle comes back as 6.1e-17, not 0. Left unrounded, a card
 * sitting exactly at twelve o'clock loses its transform and collapses onto the
 * centre. `toFixed` never emits an exponent, which is the point of using it.
 */
export const cssNumber = (value: number): string => value.toFixed(4);

export const designUnit = (value: number): string =>
  `calc(${cssNumber(value)} * var(--raw-unit-design))`;
