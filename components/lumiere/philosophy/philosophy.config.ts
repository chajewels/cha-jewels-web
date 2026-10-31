import type { LetterDirection } from "@/components/lumiere/common/letter-reveal";

/**
 * Get Layers — "Hero 5 (Philosophy)", 1443:61. Every number is Figma's at the
 * 1440 design width, read through the same design unit the three blocks above
 * use, so the four scale together.
 *
 * The four groups inside the section are positioned against the section, not
 * against the card: Figma's wrapper is a `display: contents` node, which draws
 * no box, so its children resolve against the frame. The card is one of those
 * children rather than their parent.
 */

export const LAYOUT = {
  height: 800,
  /** The backdrop's fill: taller than the frame, and lifted. */
  backdropHeight: 221.02,
  backdropTop: -85.08,
  card: { width: 1131, height: 689, top: 55 },
  /** 8.33% of the frame and 67 more — Figma states it as a sum, so it is kept as one. */
  textLeft: { percent: 8.33, offset: 67 },
  shapesLeft: { percent: 25, offset: 99 },
  topRow: { top: 87, gap: 55 },
  shapesTop: 157,
  middle: { top: 235, gap: 24 },
  bottom: { top: 596, width: 1067, gap: 24 },
  note: { top: 188, middle: 252 },
  photo: {
    width: 291,
    height: 329,
    /** The fill inside that box, as Figma crops it. */
    fillWidth: 115.12,
    fillHeight: 121.32,
    fillLeft: -0.6,
    fillTop: -1.56,
  },
  pill: { left: 266, top: 148, pad: 10, gap: 6, radius: 100, icon: 12 },
} as const;

export const TYPE = {
  /** Instrument Serif at 64 on a 0.9 leading — 57.6, stated in px, not as a ratio. */
  display: { size: 64, leading: 57.6 },
  note: { size: 18, leading: 18 },
  cta: { size: 13, leading: 10.4 },
} as const;

/**
 * The entry, as windows on one 0…1 progress rather than as delays.
 *
 * The order is the reading order and nothing else: the ground and the card,
 * then the first line, then the photograph as the centre of the argument, then
 * the lines under it, and last the pill — so the invitation arrives after the
 * sentence it belongs to has been read. The windows overlap, so this reads as
 * one movement passing down the block, not as nine separate arrivals.
 */
export const ENTRY = {
  backdrop: [0, 1],
  card: [0, 0.5],
  topRow: [0.12, 0.62],
  topNote: [0.2, 0.7],
  shapes: [0.18, 0.68],
  photo: [0.22, 0.78],
  sideNotes: [0.28, 0.78],
  bottomRow: [0.34, 0.84],
  keep: [0.42, 0.92],
  pill: [0.55, 0.9],
} as const;

/** How far the pieces travel, in em of their own type — scale-invariant. */
export const RISE = { display: 0.35, note: 0.5, pill: 0.6 } as const;

/** The card has no type of its own, so it moves by a share of its own height. */
export const CARD_RISE = 3;

export const ZOOM = { backdrop: 1.08, photo: 1.06 } as const;

/**
 * The drift — a second scroll channel, laid over the entry.
 *
 * The entry is a one-way arrival: it saturates the moment the block fills the
 * screen and then nothing moves again, however long you stay. The drift is what
 * keeps running, and it is measured from the middle rather than from the edge:
 * it is zero exactly when the section's centre meets the viewport's, which is
 * the composed state, and reaches its full value only as the block enters or
 * leaves. So the arrangement Figma states is what stands still on screen, and
 * the movement lives in the approach.
 *
 * Three depths, three speeds, all self-relative so they hold at every width:
 * the backdrop lags behind the card, the photograph runs ahead of it, and the
 * type opens a little between the two. Each is small enough that no single
 * piece reads as moving on its own — the depth is the only thing that shows.
 */
export const PARALLAX = {
  /**
   * Percent of the backdrop's own frame — it lags, so it takes the sign back.
   * The frame is more than twice the section's height and hangs 630 above it,
   * so this is all overhang and no edge ever comes into view.
   */
  backdrop: 8,
  /**
   * Percent of the photograph's own height, and the nearest thing here.
   *
   * The first pass was set at a quarter of this and read as nothing at all —
   * 5px of travel across a whole screen of scrolling is under the threshold
   * where an eye calls it movement. Restraint is in what moves, not in whether
   * the movement is visible: two layers, one axis, no easing of its own.
   */
  photo: 12,
  /**
   * The type's own channel — em of the display face, taken one way above the
   * picture and the other below it, so the rows breathe apart as the block goes
   * by. At Figma's 64 it is 3.2px, under a line's own leading.
   *
   * Not wired. It works, and it costs more than it gives: a display row driven
   * by two springs instead of one lands its glyphs on a different subpixel and
   * every serif edge in the card redraws — 1.5% of the frame at 1440, up to 124
   * of a channel on an edge, and this at the centred position where the drift
   * is exactly zero and not one box has moved. Bisected: with the rows left on
   * the single spring the same frame comes back identical to the pixel, and
   * with them on two it does not, whatever the drift is worth.
   *
   * Invisible at a glance, but it is the type of a finished block moving under
   * an animation that was asked to be restrained. Pass it as the third argument
   * to `enter()` on the display rows to turn it on.
   */
  display: 0.05,
} as const;

/**
 * Each display row's letter-by-letter entrance (`LetterReveal`): when it
 * starts, in ms after the card is in view, and which way its letters run.
 *
 * Each row plays as soon as it enters the viewport (`HEADING_ROOT_MARGIN`) —
 * the preset's 15% wait left the lower rows starting late, once the reader had
 * already reached them. The starts are a short beat apart within each group
 * (the three rows above the photograph, the three below), counted from when
 * that group comes into view, so each group opens as one cascade. The direction follows where the row stands: a row set
 * from the left edge runs left to right, one set to the right edge runs right
 * to left — from the edge it is anchored to — and the two centred rows open
 * from the middle out. These rows used to rise in on the scrubbed entry
 * (`ENTRY.topRow` and the rest); the letters play once instead.
 */
export const HEADING = {
  jewelry: { delay: 0, direction: "forward" },
  quite: { delay: 90, direction: "backward" },
  shapes: { delay: 180, direction: "centre" },
  longer: { delay: 0, direction: "forward" },
  look: { delay: 90, direction: "backward" },
  keep: { delay: 180, direction: "centre" },
} as const satisfies Record<
  string,
  { delay: number; direction: LetterDirection }
>;

/** The display rows play as they enter the viewport, not 15% inside it. */
export const HEADING_ROOT_MARGIN = "0px";
