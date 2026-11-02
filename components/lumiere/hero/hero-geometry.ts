/**
 * Pure geometry for the hero scrub. Every value is in Figma design units, which
 * become pixels through `--raw-unit-design` at render time — so a resize needs
 * no recomputation and cannot accumulate drift.
 */

import { cssNumber } from "@/lib/lumiere/design-unit";

import {
  CARD,
  CLUSTER,
  DESIGN,
  FRAME_2,
  FRAME_2_OFFSET,
  FRAME_3_COMPACT,
  RING_TOP,
  TABLET,
  TIMELINE,
} from "./hero.config";

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));

/** Clamps to the symmetric range around zero. */
const clampAbs = (value: number, limit: number): number =>
  Math.min(limit, Math.max(-limit, value));

export const easeInOut = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;

/** Progress mapped onto a sub-range, clamped outside it. */
export const range = (p: number, start: number, end: number): number =>
  clamp01((p - start) / (end - start));

export interface ClusterState {
  rotate: number;
  scale: number;
  dx: number;
  dy: number;
}

/**
 * Frame 2's growth and its off-centre framing, each as a share of Figma's. Both
 * are 1 wherever Figma's canvas is the one being drawn on.
 */
export interface CanvasRatio {
  scale: number;
  offset: number;
}

const NO_CANVAS_RATIO: CanvasRatio = { scale: 1, offset: 1 };

/** Left margin the frame-2 card rests on, as a fraction of the screen width. */
const FRAME_2_TABLET_REST = 0.12;

/**
 * The cluster as a rigid body: a full turn, then the +45 and 3.8872x of frame 2.
 * Finishing phase A on a whole turn is what returns card 6 to the -135 slot, so
 * the frame-2 rotation lands it in the hero position.
 */
export const clusterStateAt = (
  p: number,
  offsetScale = 1,
  canvasRatio: CanvasRatio = NO_CANVAS_RATIO,
): ClusterState => {
  const turn = 360 * TIMELINE.turns;

  if (p <= TIMELINE.rotateEnd) {
    return { rotate: turn * (p / TIMELINE.rotateEnd), scale: 1, dx: 0, dy: 0 };
  }

  const t = easeInOut(range(p, TIMELINE.rotateEnd, TIMELINE.frame2End));
  const rotate = turn + FRAME_2.rotate * t;
  const scale = 1 + (FRAME_2.scale * canvasRatio.scale - 1) * t;

  if (offsetScale === 0) {
    // Phone branch. Figma's offset exists to bring the hero slot into frame
    // on a 1440 canvas; simply dropping it strands the card on the rim of a
    // ring that has grown to a 508px radius — 321px off the left of a phone,
    // which is exactly what "the card flew away" was. So the offset is not
    // removed but recomputed: cancel the hero's own place on the ring and it
    // lands dead centre, at every step of the growth rather than only at the
    // end.
    const heroAngle =
      ((CLUSTER.startAngle + FRAME_2.heroIndex * CLUSTER.step + rotate) *
        Math.PI) /
      180;
    const radius = CLUSTER.radius * scale;

    return {
      rotate,
      scale,
      dx: -radius * Math.cos(heroAngle) * t,
      dy: -radius * Math.sin(heroAngle) * t,
    };
  }

  return {
    rotate,
    scale,
    dx: FRAME_2_OFFSET.x * canvasRatio.offset * t,
    dy: FRAME_2_OFFSET.y * canvasRatio.offset * t,
  };
};

/**
 * How much of the frame-2 composition to apply, as a share of Figma's.
 *
 * Figma's 3.8872 and its 656-unit offset are absolute counts of design units,
 * and they read as the composition they are only against the canvas they were
 * drawn on — 1440 x 800. A tablet's canvas is 862 x 1150: narrower and much
 * taller, so the same figures put the hero across 56% of the width and jam it
 * into the left edge.
 *
 * Scaling both by the width ratio alone fixes the edge and overcorrects the
 * size — the card comes out a third of the width but a fifth of the height,
 * where desktop gives it a third and a half. So the two are separated:
 *
 *   scale   the geometric mean of the width and height ratios, which is the
 *           honest way to fit a composition to a canvas of a different shape
 *           rather than favouring one axis.
 *   offset  derived, not chosen: it is whatever puts the grown card back where
 *           desktop puts it — off centre to the left, weight on the right.
 *           The hero's distance from the cluster centre grows with the scale,
 *           so the offset has to absorb that before it can place anything.
 *
 * Both are exactly 1 from the desktop breakpoint up. The phone takes the other
 * branch of `clusterStateAt` and never reads this.
 */
export const frameTwoCanvasRatio = (
  viewportWidth: number,
  viewportHeight: number,
  unitPx: number,
): CanvasRatio => {
  const none = { scale: 1, offset: 1 };

  if (!viewportWidth || !viewportHeight || !unitPx) return none;
  if (viewportWidth < TABLET.min || viewportWidth >= TABLET.max) return none;

  const canvasWidth = viewportWidth / unitPx;
  const scale = Math.sqrt(
    (canvasWidth / DESIGN.width) * (viewportHeight / unitPx / DESIGN.height),
  );

  // The card is rotated a quarter turn at frame 2, so its width on screen is
  // the card's height.
  const halfCard = (CARD.height * FRAME_2.scale * scale) / 2;
  // Where the hero should end up, in design units from the screen's centre.
  const target =
    FRAME_2_TABLET_REST * canvasWidth + halfCard - canvasWidth / 2;
  // ...and the cluster centre that puts it there, given that the hero sits a
  // grown radius to the left of it.
  const offset =
    (target + CLUSTER.radius * FRAME_2.scale * scale) / FRAME_2_OFFSET.x;

  return { scale, offset };
};

export interface CardState {
  x: number;
  y: number;
  rotate: number;
  scale: number;
}

/** Where card `index` sits, given the cluster's rigid transform. */
export const cardStateAt = (
  index: number,
  p: number,
  offsetScale = 1,
  canvasRatio: CanvasRatio = NO_CANVAS_RATIO,
): CardState => {
  const cluster = clusterStateAt(p, offsetScale, canvasRatio);
  const degrees = CLUSTER.startAngle + index * CLUSTER.step + cluster.rotate;
  const radians = (degrees * Math.PI) / 180;
  const radius = CLUSTER.radius * cluster.scale;

  return {
    x: cluster.dx + radius * Math.cos(radians),
    y: cluster.dy + radius * Math.sin(radians),
    rotate: index * CLUSTER.step + cluster.rotate,
    scale: cluster.scale,
  };
};

/**
 * How much of frame 2's off-centre framing to apply.
 *
 * Figma sets the cluster's frame-2 centre 656 units right of the frame centre.
 * That composition needs room: on a 375 screen it throws the hero card clean off
 * the side, so the phone drops it and the card grows on the spot instead. From
 * 768 up there is room, and the tablet takes the same path the desktop does.
 */
export const frameTwoOffsetScale = (viewportWidth: number): number =>
  viewportWidth >= TABLET.min ? 1 : 0;

/**
 * Whether the composition is below the desktop breakpoint.
 *
 * Deliberately not `frameTwoOffsetScale(w) === 0`, which is what it used to be.
 * The two questions only looked like one question: frame 2 asks whether there is
 * room for Figma's off-centre framing, and this asks whether frame 3 needs its
 * own crop and whether the ring hangs low. The tablet answers them differently —
 * yes to the first, yes to the second — and conflating them meant giving it
 * desktop's frame 2 also silently changed where frame 3 lands and which cards
 * are mirrored.
 */
export const isCompactFor = (viewportWidth: number): boolean =>
  viewportWidth < TABLET.max;

/**
 * Uniform scale at which an upright card covers the viewport.
 *
 * The viewport has to be measured in design units, and that conversion is the
 * live unit — not 1440. Below the breakpoint the unit is pinned at its floor,
 * so a 375 screen is 521 units across, not 1440; assuming the wider figure
 * inflates the scale by nearly three and blows the photograph up until a single
 * finger fills the screen.
 *
 * The framing nudges are not paid for here. Charging them to the fit was the
 * earlier approach and it defeats itself: asking for a wider cover to afford a
 * sideways nudge enlarges the photograph, which is the opposite of a nudge. The
 * card's overhang is what pays instead — see `maxRestOffset`.
 */
export const coverScale = (
  width: number,
  height: number,
  unitPx: number,
): number => {
  if (!width || !height || !unitPx) return DESIGN.width / CARD.width;

  return Math.max(width / unitPx / CARD.width, height / unitPx / CARD.height);
};

/**
 * How far the finished card may be nudged off centre before it uncovers an
 * edge — half its overhang, in design units, on the given axis.
 *
 * Zero when the card only just covers the screen, which is exactly the case
 * that used to leave a strip of page showing along one side.
 */
export const maxRestOffset = (
  cardSide: number,
  scale: number,
  viewportSide: number,
  unitPx: number,
): number =>
  Math.max(0, (cardSide * scale) / 2 - viewportSide / unitPx / 2);

export interface HeroCardState extends CardState {
  /** Local corner radius, in design units. */
  radius: number;
}

/**
 * The hero card. Up to frame 2 it simply rides the cluster; after that it leaves
 * the formation, grows to cover the viewport, and squares off its corners.
 */
export const heroStateAt = (
  p: number,
  width: number,
  height: number,
  unitPx: number,
  offsetScale = 1,
  /** Where the ring's centre sits as a fraction of the stage's height; the phone fit (hero-phone-fit.ts) moves it. */
  ringTop: number = RING_TOP.compact,
): HeroCardState => {
  const base = cardStateAt(
    FRAME_2.heroIndex,
    Math.min(p, TIMELINE.frame2End),
    offsetScale,
    frameTwoCanvasRatio(width, height, unitPx),
  );

  // Read off the width, not off `offsetScale`: from 768 up the offset is applied
  // but the screen is still compact, and frame 3 still needs its own framing.
  const isCompact = isCompactFor(width);

  // The ring hangs below the middle on compact widths, per Figma's phone frame.
  // A card that grows to fill the screen has to end on the viewport's centre
  // instead, or it leaves an uncovered band the height of the difference along
  // the top edge.
  const centreShift = isCompact
    ? ((RING_TOP.desktop - ringTop) * height) / unitPx
    : 0;

  // ...but it is not paid until frame 3, at any width. Two reasons, and they
  // agree. Where Figma's offset applies the cluster is a rigid body: every card
  // holds its place on the ring while the formation turns and scales, and a
  // hero drifting vertically out of its slot mid-move is visibly no longer part
  // of it. On the phone there is no formation left to break, but the ring's
  // anchor is where the card belongs at rest — the screen's own centre sits
  // behind the headline, and a card centred on it leaves 20px of air above and
  // 144 below. The anchor is the middle of what is actually free.
  //
  // Divided by the live scale at every width, so the corner keeps its 32 on
  // screen. Figma states 32 on the frame-2 card at its displayed size, and the
  // card grows by nearly four getting there — left in local terms it comes out
  // near 150 and the card reads as a capsule rather than a rounded rectangle.
  if (p <= TIMELINE.frame2End) {
    return { ...base, radius: CARD.radius / base.scale };
  }

  const t = easeInOut(range(p, TIMELINE.frame2End, TIMELINE.frame3End));
  // Desktop takes the photograph as Figma frames it — no boost, no nudge.
  const framing = !isCompact
    ? null
    : offsetScale === 0
      ? FRAME_3_COMPACT.phone
      : FRAME_3_COMPACT.tablet;

  const cover =
    coverScale(width, height, unitPx) * (1 + (framing?.scaleBoost ?? 0));
  const scale = base.scale + (cover - base.scale) * t;

  // Where the card finishes, relative to the centre of the screen, clamped to
  // whatever overhang the cover leaves. The clamp is what guarantees the edges:
  // ask for more than the card has to give and it stops at the edge instead of
  // pulling a strip of page into view.
  const restX = clampAbs(
    framing?.shiftX ?? 0,
    maxRestOffset(CARD.width, cover, width, unitPx),
  );
  const restY = clampAbs(
    framing?.shiftY ?? 0,
    maxRestOffset(CARD.height, cover, height, unitPx),
  );
  // Settle on the next whole turn so the card finishes upright.
  const upright = Math.ceil(base.rotate / 360) * 360;
  // Holds 32 on screen, then runs to a square edge as the card fills the frame.
  const visualRadius = CARD.radius * (1 - t);

  return {
    x: base.x * (1 - t) + restX * t,
    // Starts where phase B left off and lands on the screen's centre, plus
    // whatever framing nudge the overhang allows.
    y: base.y * (1 - t) + (centreShift + restY) * t,
    rotate: base.rotate + (upright - base.rotate) * t,
    scale,
    radius: visualRadius / scale,
  };
};

/**
 * Factor turning the hero card's local corner radius into pixels.
 *
 * Figma states 20.649 on every card of the phone ring (1577:125) — exactly 32
 * times the compact unit — and 32 at the displayed size on frame 2. Both
 * describe the same card at different moments, so the factor rides the growth:
 * it holds the unit while the ring is at rest, where the hero has to match its
 * seven siblings, and reaches full pixels by frame 2. Pinned at 1 instead, the
 * hero sat at 32 against siblings at 20.6 and read as the one soft shape in an
 * otherwise even ring.
 *
 * From 1024 up the unit already expresses both and nothing ramps.
 */
export const radiusScaleAt = (
  p: number,
  unitPx: number,
  isCompact: boolean,
): number =>
  isCompact
    ? unitPx +
      (1 - unitPx) * easeInOut(range(p, TIMELINE.rotateEnd, TIMELINE.frame2End))
    : unitPx;

/**
 * One design unit in pixels, for a given viewport width.
 *
 * The floor MUST match `--raw-unit-design` in globals.css. Card size and corner
 * radius come from the CSS variable, while position and the photo box are
 * computed here; if the two disagree the ring collapses to a fraction of its
 * radius while the cards keep their size, and the composition piles up in the
 * middle. Any change to one belongs in both.
 */
export const UNIT_FLOOR_PX = 0.6452;

/**
 * Viewport height the phone's unit is capped against. Also in globals.css.
 *
 * Chosen so the cap crosses the floor at exactly 812: at that height and above
 * the floor wins and nothing changes, and only shorter phones step down.
 */
export const PHONE_DESIGN_HEIGHT = 1258.5;

export const unitPxFor = (
  viewportWidth: number,
  viewportHeight = 0,
): number => {
  const width = viewportWidth || DESIGN.width;

  // The tablet band draws against its own canvas rather than the phone floor.
  // Height is a ceiling, not an average: a short window has to shrink the whole
  // composition or the ring and the headline collide.
  if (width >= TABLET.min && width < TABLET.max) {
    const byWidth = width / TABLET.designWidth;

    return viewportHeight
      ? Math.min(byWidth, viewportHeight / TABLET.designHeight)
      : byWidth;
  }

  // The phone gets the same ceiling for the same reason. PHONE_DESIGN_HEIGHT is
  // set exactly where it crosses the floor at 812, so every phone that tall and
  // over is untouched and only the short ones step down.
  if (width < TABLET.min && viewportHeight) {
    return Math.min(UNIT_FLOOR_PX, viewportHeight / PHONE_DESIGN_HEIGHT);
  }

  return Math.max(UNIT_FLOOR_PX, width / DESIGN.width);
};

/**
 * Composes the animated transform in plain pixels.
 *
 * Deliberately no `calc()` and no `var()` here. React-spring re-serialises the
 * transform it animates, and doing so it inlines custom properties into the
 * string — which nests a `calc()` inside a `calc()` and yields a declaration
 * the browser drops, leaving every card stacked on the centre. Resolving the
 * unit in JS sidesteps the whole class of problem; the viewport width comes
 * from the shared resize store, so a resize still recomputes correctly.
 *
 * Numbers go through `cssNumber` because these are trigonometric outputs: a
 * card at twelve o'clock yields 6.1e-17, and exponential notation is invalid
 * in CSS.
 */
export const toTransform = (
  state: CardState,
  unitPx: number,
  flip = false,
): string =>
  [
    "translate(-50%, -50%)",
    `translate(${cssNumber(state.x * unitPx)}px, ${cssNumber(state.y * unitPx)}px)`,
    `rotate(${cssNumber(state.rotate)}deg)`,
    `scale(${cssNumber(state.scale)})`,
    // Innermost, so it mirrors the artwork before the rotation turns it. The
    // pair composes into a reflection rather than a turn — which is what keeps
    // a card at the bottom of the ring from reading upside down.
    flip ? "scaleY(-1)" : "",
  ]
    .filter(Boolean)
    .join(" ");

/**
 * Non-hero cards fade as they leave the frame, at every width.
 *
 * Letting them travel off at full opacity was tried and rejected: by the time
 * the hero starts growing the others have scaled up past three, so a corner
 * still on screen is a slab several hundred pixels across lying over the frame
 * rather than the small edge frame 2 shows. They go before that point instead.
 */
export const cardOpacityAt = (p: number): number =>
  1 - range(p, TIMELINE.cardFade[0], TIMELINE.cardFade[1]);

/**
 * Fractional position of the category strip.
 *
 * Whole numbers are the resting stops. The strip holds on a category for most
 * of each gap and travels over the final third, which is what makes it read as
 * "the picture scrolls, the category doesn't" between stops.
 */
export const categoryPositionAt = (p: number): number => {
  const stops = TIMELINE.categoryStops;

  for (let i = stops.length - 1; i >= 0; i -= 1) {
    if (p < stops[i]) continue;
    if (i === stops.length - 1) return i;

    const gap = stops[i + 1] - stops[i];

    return i + easeInOut(range(p, stops[i + 1] - gap / 3, stops[i + 1]));
  }

  return 0;
};
