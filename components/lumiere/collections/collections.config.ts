// 📖 Docs: obsidian/frontend/components/common.md

/**
 * Collections block geometry, in Figma design units (1 unit = 1px at the 1440
 * design width). Read off Get Layers / "Hero 5 (Collections)" — 1443:7 for the
 * resting state and 1509:157 for the hover — through the Figma MCP, not off the
 * rendered picture.
 *
 * The file defines no Figma Variables (`get_variable_defs` returns nothing), so
 * there are no upstream names to mirror; these follow the project's own
 * convention, as the hero's do.
 */

/** Design frame the geometry was measured in. */
export const DESIGN = {
  width: 1440,
  height: 1134,
} as const;

/**
 * Cap-height as a share of the font size, for Instrument Serif.
 *
 * Figma trims every text box to the caps (`text-box-trim: trim-both`,
 * `text-box-edge: cap alphabetic`), so a box it reports is shorter than the
 * line box a browser lays out. The ratio is what reconciles the two, and it
 * holds across the whole block: 64 -> 46.4, 48 -> 35, 32 -> 23, 18 -> 13.
 *
 * Everything positioned by Auto Layout depends on it. Without the correction
 * the flex column inside a card distributes the wrong heights and every
 * element lands a few pixels out.
 */
export const CAP_RATIO_SERIF = 0.725;

/**
 * The cards, in reading order. Widths alternate between the two rows; the
 * fifth card (D-8) runs the full row — `wide + gap + narrow`.
 */
export const CARD = {
  /** Both rows are this tall. */
  height: 425,
  /** Between columns and between rows alike. */
  gap: 12,
  /** Auto Layout padding on all four sides. */
  padding: 24,
  wide: 788,
  narrow: 560,
  /** The fifth card: both columns and the gap between them (D-8). */
  full: 1360,
} as const;

/** Where the block's own furniture sits. */
export const LAYOUT = {
  gutter: 40,
  /** Top of the heading's cap box. */
  headingTop: 64,
  headingWidth: 377,
  /** Top of the standfirst's cap box; it is right-aligned to the gutter. */
  leadTop: 135,
  leadWidth: 275,
  /** Top of the first row of cards. */
  gridTop: 208,
} as const;

/**
 * Type, in design units. Leadings are absolute rather than multipliers, as the
 * brief asks; each is the Figma multiplier already resolved against its size.
 */
export const TYPE = {
  heading: { size: 64, leading: 57.6 },
  /**
   * The sans faces carry their cap outright rather than through a ratio: they
   * are the two runs Figma sets in Inter Tight, which this project does not
   * vendor, so a ratio measured off the substitute would be the substitute's.
   * These come from Figma's own boxes — 33 tall over two lines at 20.8 leaves
   * 12.2, and 24 over two at 14 leaves 10.
   */
  lead: { size: 16, leading: 20.8, cap: 12.2 },
  /** The card label at rest. */
  label: { size: 32, leading: 28.8 },
  /** The same label on hover — the one thing that changes size. */
  title: { size: 48, leading: 43.2 },
  index: { size: 18, leading: 16.2 },
  note: { size: 14, leading: 14, cap: 10 },
  cta: { size: 16, leading: 12.8, tracking: 0.03 },
} as const;

/**
 * The hover state, as the difference between the two frames and nothing more.
 *
 * Both frames put their lowest element's cap on the same line — 401 down a
 * 425-tall card, which is the 24 padding — so the label's travel is the
 * distance between the two cap boxes: 401 at rest, 226.5 (191.5 + 35) on
 * hover.
 */
export const HOVER = {
  /** How far the label rises, in design units. */
  labelRise: 174.5,
  /** 32 / 48 — the label is set at its hover size and scaled down at rest. */
  labelScale: TYPE.label.size / TYPE.title.size,
  /** Figma's own gap between the CTA text and its rule. */
  ctaGap: 8,
  /** And between the CTA text and its arrow. */
  ctaIconGap: 12,
  /** Hairline under the CTA, as wide as the row above it and no wider. */
  rule: 1,
  icon: 12,
} as const;

/** 400ms in, 500ms out, on the brief's curve. */
export const TRANSITION = {
  enter: 400,
  exit: 500,
  easing: "cubic-bezier(.16,1,.3,1)",
} as const;

/**
 * Scroll parallax.
 *
 * `photo` is how far each card's photograph drifts against its card, as a
 * share of the card's height, in reading order. The frame is that much taller
 * at both ends, so the drift never shows an edge. Each card is given its own
 * depth: four equal drifts read as the whole grid sliding, while unequal ones
 * read as four photographs at four distances.
 *
 * `heading` is the headline's drift, in `em` of its own size (so it scales with
 * the type), and runs against the page so the headline sits back from the
 * cards.
 */
export const PARALLAX = {
  /**
   * 0.07–0.12 was set first and read as no parallax at all: a card crosses the
   * whole viewport in the time its photograph moved ~6% of that. These put the
   * photograph at roughly a sixth slower than the page. The frame, and so the
   * zoom on the crop, grows by 2 × depth.
   */
  photo: [0.18, 0.14, 0.16, 0.2, 0.17],
  heading: 0.5,
} as const;

/**
 * The cards' entrance: a fade and nothing else — no lift, no scale — so the
 * grid never shifts while it assembles. Each card fades when it comes into
 * view, but never sooner than `stagger` after the one before it, so they
 * arrive one by one in reading order however many are on screen at once.
 * The first screen's curve and length, so the blocks move at one speed.
 */
export const CARD_REVEAL = {
  stagger: 180,
  duration: 880,
} as const;
