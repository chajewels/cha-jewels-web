/**
 * Get Layers — "Hero 5 (Footer)", 1556:753. Every number is Figma's at the 1440
 * design width, read through the same design unit the four blocks above use.
 *
 * The three columns of the page meet here: the wordmark on the gutter's own 40,
 * the links at a quarter of the frame and 23 more, the subscription at three
 * quarters less 11. Figma states the last two as those sums, and they are kept
 * that way rather than resolved, so the file can be read against the code.
 */

export const LAYOUT = {
  height: 320,
  gutter: 40,
  top: 40,
  /** All three of the bottom line sit on it. */
  baseline: 286,
  logo: { width: 79.07, height: 40 },
  columns: { left: { percent: 25, offset: 23 }, gap: 50, head: 16, item: 10 },
  subscribe: {
    left: { percent: 75, offset: -11 },
    width: 331,
    gap: 24,
    fieldPad: 10,
    icon: 12,
  },
  meta: { gap: 12, dot: 4 },
} as const;

/**
 * Manrope's cap as a fraction of its size. Read off the file rather than
 * assumed: Figma reports 10 for a trimmed line at 14, which is this.
 */
export const CAP_RATIO_MANROPE = 0.714;

export const TYPE = {
  link: { size: 14, leading: 11.2 },
  note: { size: 12, leading: 14.4 },
} as const;

/** The thumb's target around a 12 glyph, and the padding that reaches it. */
export const TAP = { size: 44, icon: 12 } as const;
