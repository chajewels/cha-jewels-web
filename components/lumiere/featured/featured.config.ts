/**
 * Get Layers — "Hero 5 (Featured Pieces)", 1443:53. Every number is Figma's at
 * the 1440 design width, and the block reads them through the same design unit
 * the hero and the collections block use, so the three scale together.
 */

/** Instrument Serif's cap as a fraction of its size — see `cap-trim`. */
export const CAP_RATIO_SERIF = 0.725;
/** Inter Tight's, from the 12.2 Figma reports at 16. */
export const CAP_RATIO_SANS = 0.7625;

/**
 * Figma's measurements, kept for reference. The live layout (globals.css,
 * `.featured__panels`) uses only the gutter and the seam: the panels fill the
 * window inside the gutter on all four sides, so they are 674x736 only at a
 * 1440x800 window.
 */
export const LAYOUT = {
  /** The gutter and measure the hero and the collections block already set. */
  gutter: 40,
  container: 1360,
  panel: 674,
  panelHeight: 736,
  panelPadY: 48,
  /** Figma's own figure; it is what makes the left panel 736 tall. */
  panelGap: 545,
  leftPadX: 228,
  /** 1360 less two panels — the seam between them. */
  seam: 12,
  height: 800,
} as const;

export const TYPE = {
  title: { size: 40, leading: 36 },
  pill: { size: 16, leading: 12.8 },
  materials: { size: 18, leading: 18 },
  cue: { size: 13, leading: 10.4 },
} as const;

export const PILL = {
  radius: 100,
  padX: 12,
  padY: 10,
  gap: 6,
  /** Between the two pills, which sit as one unit. */
  pairGap: 4,
  cartIcon: 13,
  cueIcon: 10,
  cuePad: 10,
  /** Between the pill pair and the materials line. */
  stackGap: 20,
  materialsGap: 12,
  materialsDot: 4,
} as const;

/**
 * The three slots the ring turns through. Sizes are the boxes Figma draws; the
 * block renders every view at the centre box and scales down to reach the
 * sides, so nothing animates width or height.
 */
export const SLOTS = {
  /**
   * The active ring, at half the 497 Figma draws. Asked for directly against a
   * measured reference rather than derived from the file, so it is a departure
   * from the mock and the only one in this block.
   *
   * The neighbours follow it down, keeping Figma's proportion between them:
   * 222 against 497 is 0.447, and 0.447 of 245 is the 109.5 below. Holding them
   * at their original 222 was tried and read wrong — three rings of nearly one
   * size, with only opacity saying which was active.
   *
   * Their places do not move: the side slots stay at ±226 from the centre, so
   * only the rings themselves are smaller.
   *
   * The side opacity was Figma's 0.15, set for photographs on a cream panel.
   * On the black stage a ring dims toward black rather than toward the page,
   * and at 0.15 its stones went out entirely; at 0.6 the neighbours still
   * step back from the active ring but keep their stones.
   */
  centre: { width: 245, height: 265, top: 235, offset: 0, opacity: 1 },
  side: { width: 109.5, height: 118.4, top: 248, offset: 226, opacity: 0.6 },
} as const;

/** 109.5 against the 245 every view is drawn at — Figma's 222/497. */
export const SIDE_SCALE = SLOTS.side.width / SLOTS.centre.width;

/**
 * Where a ring goes as it leaves past a side slot (or before it reaches one):
 * further out, smaller, and transparent.
 */
export const OFF_SLOT = { offset: 340, scale: 0.36, opacity: 0 } as const;

/**
 * The five 3D rings (`public/models/rings/`) stand in a row and slide past the
 * centre, first to last — a strip, not a cycle: the first ring opens with
 * nothing on its left, the last closes with nothing on its right.
 *
 * Four steps carry ring 1 to ring 5 through the centre while the section is
 * pinned, `viewportsPerTransition` of scroll each. The strip keeps moving at
 * the same speed while the section rises into view and while it scrolls away,
 * so it never stands still: it is already sliding when the block arrives and
 * still sliding when it leaves.
 */
export const RING_COUNT = 5;
export const TIMELINE = {
  transitions: RING_COUNT - 1,
  states: RING_COUNT,
  viewportsPerTransition: 0.8,
} as const;

/**
 * Where the side slots sit, as a fraction of the ring's own box. Figma's 226 of
 * 497, opened a little (×`SPREAD_OPEN`) for the 3D rings, which carry more air
 * than the photographs did. Stacked, the panel is far wider than the ring and
 * the neighbours drift to the edges reading as separate objects, so they come
 * in. On a phone they go the other way and are cut by the panel's edge — half
 * of each, both sides alike, so the crop reads as a device rather than as an
 * accident.
 */
const SPREAD_OPEN = 1.15;
export const SPREAD = {
  wide: (SLOTS.side.offset / SLOTS.centre.width) * SPREAD_OPEN,
  /**
   * Stacked, the panel is twice as wide as it is tall and the ring is drawn
   * against its height, so Figma's own spread — which keeps the neighbours at
   * two thirds of the way to the panel's edge — leaves too much between them
   * and the middle. They come in, with the daylight kept: measured at 1128, the
   * gap between the active ring's ink and its neighbour's falls from 180 to
   * 113, a tenth of the panel rather than a sixth.
   */
  tablet: 0.75 * SPREAD_OPEN,
  /**
   * On a phone the neighbours are meant to be cut in half by the panel's edge,
   * so their centres sit on it: at 375 the panel's half-width is 161.7 and the
   * ring's own box is 210.5 across, which is this. The old figure was set when
   * the box was half the size and left them entirely off the panel once the
   * stack began taking its height from the frame.
   */
  phone: 161.7 / 210.5,
} as const;

/**
 * How a 3D ring fills its slot box, and how it turns. The sphere around the
 * ring spans `fit` of the box's width; the poster renders were framed at
 * `posterFit`, so the poster plate is scaled by `fit / posterFit` to match.
 * The sphere is generous — it encloses the ring at every angle of its spin —
 * so `fit` runs past 1 for the ring itself to fill the box the way the old
 * photographs did. A ring turns round its own vertical axis by
 * `turnsPerTransition` of a turn for every slot it is away from the centre, so
 * whatever the amount, it faces its three-quarter view (the posters' pose)
 * when dead centre. A full turn per slot read as too busy; a quarter is enough
 * to show each ring in the round as it passes.
 */
export const RING_3D = {
  /** 1.28 first; raised by a quarter when the rings were asked to be bigger. */
  fit: 1.6,
  /**
   * The most of the panel's height the centre ring's sphere may take. Only
   * the stacked tablet panel reaches it (it asked for 1.15); the phone sits at
   * 0.92 and the desktop near half.
   */
  maxPanelShare: 0.92,
  posterFit: 0.9,
  turnsPerTransition: 0.25,
} as const;

/**
 * How far the strip runs before the pin and after it, in slots, while the
 * section scrolls in and out. Clamped so a ring waiting at the very edge has
 * not yet faded in before the block is anywhere near the screen.
 */
export const STRIP_OVERRUN = 1.5;

export const DECOR = {
  crossesWidth: 314,
  crossesHeight: 316,
  crossesLeft: 180,
  crossesTop: 210,
  indicatorWidth: 26,
  indicatorHeight: 6,
} as const;

/**
 * Scroll parallax on the left photograph, as a share of the panel's height.
 *
 * The photograph sits in a frame this much taller at both ends. It drifts only
 * while the block is moving on the page — over the strip's overrun as the
 * section rises in, from one end of the frame to its middle, and over the
 * overrun as it leaves, from the middle on to the other end — and holds still
 * for the whole pin, so nothing on the left moves while the rings change.
 * Driven by `strip`, which runs linearly across all three phases.
 */
/** 0.12 first; asked for a stronger drift. */
export const PHOTO_PARALLAX = 0.22;

/**
 * The left panel follows the ring in the centre slot. As the strip carries
 * ring k-1 out and ring k in, ring k's photograph rises over the last one from
 * the frame's foot behind a soft edge — a mask whose edge is `feather` of the
 * frame deep — settling from `zoom` larger as it does. It is scrubbed by the
 * strip, so it runs backwards on the way up and holds wherever the reader
 * stops.
 *
 * It takes the whole transition on a sine ease, the same stretch of scroll the
 * rings take to change places. A first cut wiped a hard edge across the middle
 * 60% at 1.1× and was asked to be much smoother. The name, price and materials
 * hand over at the transition's middle (`hysteresis` either side keeps a
 * reader resting there from flickering them).
 */
export const PIECE_SWITCH = {
  start: 0,
  span: 1,
  feather: 45,
  zoom: 0.05,
  hysteresis: 0.06,
} as const;
