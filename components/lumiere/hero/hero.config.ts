// 📖 Docs: obsidian/frontend/components/common.md

/**
 * Hero composition geometry, in Figma design units (1 unit = 1px at the 1440
 * design width). Consumed through `--raw-unit-design` so the whole composition
 * stays proportional to the viewport.
 *
 * Source frames: Get Layers / Hero 5 — 1006:155 (frame 1), 1074:444 (frame 2),
 * 1074:501 (frame 3). All three are 1440x800.
 *
 * The eight cards sit on an exact circle: measured radii span 202.3–203.3 and
 * measured angles land within 0.3 degrees of a 45-degree step, so the spread is
 * export rounding, not design intent. The polar model below is therefore the
 * source of truth — it reproduces every card to within 0.6 units of Figma and,
 * unlike the raw values, stays rigid when the cluster rotates.
 */

/** Design frame the geometry was measured in. */
export const DESIGN = {
  width: 1440,
  height: 800,
} as const;

/**
 * The tablet band — 768 up to the `lg:` breakpoint, where the desktop layout
 * takes over.
 *
 * Between those two the unit was pinned at the phone's floor, which is what made
 * the ring read as a doily on a 768 screen: the composition was drawn for a
 * 1440 canvas at phone scale in the middle of a tablet. Here it gets a canvas of
 * its own instead.
 *
 * `designHeight` is the guard. Width alone would take a 900x600 window to a unit
 * of 1.06 and stack a 500px ring under a 250px headline in 600px of screen, so
 * whichever axis runs out first sets the scale.
 *
 * Both figures MUST match the tablet block in globals.css: card size and radius
 * come from the CSS variable while positions are computed here, and a
 * disagreement collapses the ring while the cards keep their size.
 */
export const TABLET = {
  min: 768,
  max: 1024,
  designWidth: 850,
  designHeight: 1150,
} as const;

/** A single card in the radial cluster, at frame-1 scale. */
export const CARD = {
  width: 105.398,
  height: 124.47,
  radius: 32,
} as const;

/** Frame 1 — cluster centred on the frame, cards facing outward. */
export const CLUSTER = {
  /** Centre, as a fraction of the stage. Figma: (720, 400.5) of 1440x800. */
  centerX: 0.5,
  centerY: 0.5,
  /** Mean measured radius, in design units. */
  radius: 202.78,
  count: 8,
  /** Angular step between cards, degrees. */
  step: 45,
  /** Angle of card index 0 (12 o'clock), degrees, screen coords (y down). */
  startAngle: -90,
} as const;

/**
 * Frame 1 -> frame 2 is one rigid similarity: the whole cluster rotates +45
 * degrees and scales 3.8872x. The scale is confirmed independently by the card
 * exports (409.704 / 105.398 = 3.8872). Its fixed point is (581.0, 550.7) —
 * within 7 units of card 6's centre, which is why card 6 appears to grow in
 * place into the hero.
 */
export const FRAME_2 = {
  scale: 3.8872,
  rotate: 45,
  /** Cluster centre in design units. */
  centerX: 1375.83,
  centerY: 519.8,
  radius: 788.16,
  /** Index of the card that lands in view as the hero. */
  heroIndex: 5,
} as const;

/**
 * Frame-2 cluster centre expressed as an offset from the frame centre, so it can
 * be applied against the viewport centre at any size.
 */
export const FRAME_2_OFFSET = {
  x: FRAME_2.centerX - DESIGN.width / 2,
  y: FRAME_2.centerY - DESIGN.height / 2,
} as const;

/**
 * Pointer tilt for frame 1. The pendant and the card ring turn together toward
 * the cursor, driven by one spring, so they read as a single piece of jewelry
 * on a single plate. Angles are at the screen edge.
 *
 * Fine pointers only (`getSceneBudget().pointerTilt`), never under reduced
 * motion, and faded out over `TIMELINE.pendantExit` — by frame 2 the ring is a
 * layout, not an object, and the hero card has to land square.
 */
export const HERO_TILT = {
  /** Turn about the vertical axis, radians. */
  yaw: 0.28,
  /** Turn about the horizontal axis, radians. */
  pitch: 0.1,
  /** Slow and heavy: the ring is large, and it should feel like it has mass. */
  spring: { tension: 90, friction: 24 },
} as const;

/**
 * Scroll timeline, in normalised pin progress.
 *
 * Phase A turns the cluster a full revolution, stopping the category index on
 * each quarter; the fifth category arrives as the last quarter blends into the
 * frame-2 growth. Ending phase A on a whole turn is what puts card 6 back at
 * the -135 slot, so the +45 of phase B lands it in the hero position.
 */
export const TIMELINE = {
  /**
   * Pinned scroll length, in viewport heights. Wheel effort is this divided by
   * Lenis's `wheelMultiplier` — dropping the multiplier to soften each notch
   * lengthened the scroll, so the pin came down to compensate.
   */
  pinHeights: 2,
  rotateEnd: 0.48,
  frame2End: 0.72,
  /**
   * Where the hero card finishes covering the screen. Deliberately short of 1:
   * the card is still travelling from its off-centre frame-2 position while it
   * grows, so at 95% it is nearly full-bleed but has not reached the right edge
   * yet — and the last few percent of a pin are the hardest to land on. Ending
   * early leaves a stretch that holds the finished frame instead.
   */
  frame3End: 1,
  /**
   * Full turns during phase A. This must stay a whole number: it is what
   * returns card 6 to the -135 slot, so the +45 of frame 2 lands it in the hero
   * position. A fraction here puts a different photograph in the centre.
   */
  turns: 1,
  /**
   * Progress at which each category becomes the active one. Five on this
   * site (the Hub's categories, report §8 / §14), spread over the same turn
   * the reference gave its four.
   */
  categoryStops: [0, 0.096, 0.192, 0.288, 0.384],
  /**
   * The seven non-hero cards fade out, at every width. It ends before
   * `frame2End` on purpose: past this point they are scaled up beyond three, so
   * anything of them still on screen is a slab, not the small corner frame 2
   * shows. The frame-2 composition is read at rest, and by then they are gone.
   */
  cardFade: [0.55, 0.68],
  pendantExit: [0.48, 0.6],
  /** Hero photo crossfades to the frame-3 image. */
  crossfade: [0.75, 0.9],
  /** Chrome inverts as the photo takes the screen. */
  invert: [0.7, 0.85],
  /**
   * The category index leaves as frame 3 arrives. It belongs to the browsing
   * state of frames 1 and 2; over a full-bleed photograph it is just two pills
   * floating on an image. Tied to the same window as the inversion, so it goes
   * as the photo takes over rather than blinking out on its own beat.
   */
  categoryExit: [0.7, 0.85],
} as const;

/**
 * Positions Figma pairs a vertical flip with the rotation. The two compose into
 * a reflection, not a turn, which is what keeps the earrings at position 5 from
 * hanging upside down. Position 1 sits at zero rotation and needs neither.
 *
 * Card 6 is excluded: it grows to fill the screen, and a mirror would carry
 * into the frame-3 photograph, where the design has none.
 */
/**
 * Final framing of frame 3 below the desktop breakpoint, per band.
 *
 * Desktop shows the photograph as Figma frames it and needs none of this. The
 * narrower screens crop into a picture composed for a wide one, and the subject
 * — the hand — does not sit where the crop leaves it, so each band gets its own
 * three numbers:
 *
 *   scaleBoost  extra scale over the cover fit. A cover fit is the smallest
 *               scale that leaves no gap; it keeps the whole scene, dark ground
 *               above and stone below, with the hand a third of the frame.
 *   shiftX/Y    where the card comes to rest, in design units from the screen's
 *               centre. Both are clamped at render to whatever overhang the
 *               scale leaves, so neither can pull an edge into view.
 *
 * The two bands differ more than they look. The phone's card overhangs the
 * screen by nearly a third and can be moved freely; the tablet's covers the
 * height exactly at a plain cover fit, with no vertical slack at all — which is
 * why its boost is not optional. Without it the crop is the only vertical lever
 * and it runs out about 90px short of centring the hand.
 */
export const FRAME_3_COMPACT = {
  tablet: { scaleBoost: 0.25, shiftX: 148, shiftY: 143 },
  phone: { scaleBoost: 0.42, shiftX: 267, shiftY: 129 },
} as const;

/**
 * Vertical anchor of the ring, as a fraction of the viewport height.
 *
 * The compact figure MUST match `--ring-top` in globals.css: the cards read it
 * from CSS and the hero's frame-2/frame-3 correction is computed from it here.
 *
 * It governs frame 1 only. Figma's phone frame puts the ring at 453 of 800 —
 * low, so the headline clears it — but frames 2 and 3 are a single card filling
 * the screen, and there "centred" means the viewport, not the ring. The
 * correction below carries it from one to the other over the growth.
 */
export const RING_TOP = {
  desktop: 0.5,
  compact: 0.57,
} as const;

export const FLIPPED_POSITIONS: readonly number[] = [2, 3, 4, 5, 8];

/**
 * Position 7 carries Figma's flip too, but only from 1024 up. It was taken out
 * of the list on a note about the bracelet's orientation on a phone, and frame 2
 * on desktop then showed that card mirrored against the design. Kept split
 * rather than unified so the phone stays exactly as approved.
 */
export const FLIPPED_POSITIONS_WIDE: readonly number[] = [
  ...FLIPPED_POSITIONS,
  7,
];

export interface CardPlacement {
  /** 1-based position, matching how the cards are numbered in the brief. */
  position: number;
  /** Offset from the cluster centre, in design units. */
  x: number;
  y: number;
  /** Card's own rotation, degrees. */
  rotate: number;
}

/**
 * Resolves the eight card placements from the polar model. Card `i` sits at
 * `startAngle + i * step` and is rotated so its top edge points away from the
 * centre — which is exactly `i * step`.
 */
export const resolveCardPlacements = (): CardPlacement[] =>
  Array.from({ length: CLUSTER.count }, (_, index) => {
    const angle = ((CLUSTER.startAngle + index * CLUSTER.step) * Math.PI) / 180;

    return {
      position: index + 1,
      x: CLUSTER.radius * Math.cos(angle),
      y: CLUSTER.radius * Math.sin(angle),
      rotate: index * CLUSTER.step,
    };
  });

/**
 * Vertical category index on the right edge, measured off the frame-1 mask
 * (node 1022:52). Figma flattens it to a vector mask, so these come from the
 * exported outlines: pills are stroke-1 rects on a 42-unit pitch, right-aligned
 * to the 40-unit page gutter, and the whole strip is 160 units tall.
 *
 * Every pill carries the same `--border-muted` stroke — the "active" centre item
 * is not a separate style, it is the gradient. So the strip renders in one
 * colour behind a fixed alpha mask, and shifting it is a plain translate.
 */
export const CATEGORY = {
  /**
   * Outer height of a pill, including its 1-unit stroke. Figma specifies
   * 10 padding + a cap-trimmed text box; because the browser's line box is
   * taller than a trimmed one, the height is pinned instead so the 42-unit
   * pitch stays exact.
   */
  itemHeight: 34,
  gap: 8,
  paddingX: 10,
  borderWidth: 1,
  fontSize: 16,
  /** 16 x 0.95, resolved to a length. */
  lineHeight: 15.2,
  /**
   * Width of the strip; pills are right-aligned within it. 85 for the English
   * pills; Japanese takes 100 (§13 row 7: プレラブド is 80 u of type) —
   * `lumiereHero(lang).categoryStripWidth`, read by the index.
   */
  width: 85,
  /**
   * The reference widened its second and fourth pills to the full strip; the
   * other three take their natural width from the text plus padding. The same
   * two positions here (Preloved, Watches).
   */
  fullWidthIndexes: [1, 3] as readonly number[],
  /** Height of the masked window — exactly five pills plus four gaps (the reference's four were 160). */
  windowHeight: 202,
  /** Distance the strip travels to advance one position. */
  pitch: 42,
} as const;

/**
 * Alpha ramp reproducing the frame-1 gradient. Figma ramps the *colour* from
 * #F9F7F4 through #CFCFD0 to #1C1C1C; against the #F4F0EC page that is the same
 * result as ramping alpha on #1C1C1C, and it survives the frame-3 inversion
 * unchanged — only the base colour swaps.
 */
/**
 * How much larger the index stands below the design width.
 *
 * Every figure in `CATEGORY` is a design pixel, so the strip shrinks with the
 * viewport like the rest of the hero — and unlike the rest of the hero it is
 * already at the small end of what reads: 16 of type at 1280 resolves to 14.2,
 * against a headline of 73. The composition around it has room the strip does
 * not, because it is pinned to the right edge rather than fitted between
 * things.
 *
 * 1.35, and not the 1.12 that would merely restore the design size: measured,
 * 1.12 moved the pill from 47.2 to 52.6 and the type from 14.2 to 15.9, and
 * that is under the step an eye registers — it read as unchanged. The strip is
 * pinned to the right edge with empty margin on both sides, so it can take the
 * room: at 1280 this is 19.2 of type in a 63 by 41 pill, against a top nav of
 * 13 and a headline of 73. Above the band it is 1 and the design width is
 * untouched.
 *
 * MUST match `--hero-category-scale` in globals.css: the sizes are written from
 * the sheet and the strip's travel from here, and if the two disagree the
 * highlighted pill drifts out of the window.
 */
export const CATEGORY_SCALE = {
  min: 1024,
  max: 1440,
  factor: 1.35,
} as const;

/** The factor for a given viewport, 1 outside the band. */
export const categoryScaleFor = (width: number): number =>
  width >= CATEGORY_SCALE.min && width < CATEGORY_SCALE.max
    ? CATEGORY_SCALE.factor
    : 1;

export const CATEGORY_MASK =
  "linear-gradient(180deg, transparent 0%, rgb(0 0 0 / 0.15) 10%, rgb(0 0 0 / 1) 50%, rgb(0 0 0 / 0.15) 90%, transparent 100%)";

/**
 * Chain-and-pendant centrepiece — frame 1 only. Figma node 1062:286.
 *
 * Now a 3D emerald pendant (`hero-pendant.tsx`). `src` is its poster: a Cycles
 * render from `assets-source/pendant-emerald.blend`, framed exactly as the
 * scene frames itself in this box — halo 136 units across, centred 426 down.
 */
export const PENDANT = {
  src: "/lumiere/placeholder/hero/pendant-emerald.webp",
  width: 421,
  height: 556,
  /** Offset from the top edge of the stage, in design units. */
  top: -26,
  /**
   * Where the ring's centre falls within the artwork, as a fraction of its
   * height. Figma puts the pendant's top at -26 in an 800-tall frame centred on
   * 400, so the centre lands 426 down a 556-tall image — 76.6%.
   *
   * A fraction rather than a fixed offset because the artwork is capped against
   * the viewport on small screens: an offset in design units stops agreeing
   * with the rendered height the moment the cap bites, and the pendant drifts
   * off the centre of the ring. A fraction holds at any size.
   */
  /**
   * Distance from the artwork's top edge down to the ring's centre. Figma sets
   * the top at -26 in a frame centred on 400, so the span is 426. Hanging the
   * pendant by this keeps the chain on the top edge and the pendant on the
   * ring's centre together — they are one measurement, not two.
   */
  centreOffsetUnits: 426,
} as const;

/**
 * The compact artwork — the same necklace drawn with a far longer chain.
 *
 * Below the desktop breakpoint the chain has to run from the pendant all the
 * way to the top of the screen, and how much chain that takes is set by the
 * screen, not by the design. Scaling the desktop file until its short chain
 * reached the top dragged the pendant up with it half again as large; this one
 * carries chain enough to reach on its own.
 *
 * Both figures were measured off the alpha channel and MUST match the compact
 * `--pendant-height` / `--pendant-width` in globals.css — that rule hangs the
 * file from the top of the screen and uses them to land the oval on the ring's
 * centre.
 */
export const PENDANT_COMPACT = {
  /** Cycles poster of the 3D pendant, rendered in this box's framing. */
  src: "/lumiere/placeholder/hero/pendant-emerald-compact.webp",
  width: 1024,
  height: 1536,
  /** Halo centre down the height (the old artwork's oval, rows 1248-1393). */
  ovalCentreRatio: 0.859701,
  /**
   * The artwork at the size the compact block renders it, in design units, and
   * the drop from its top edge to the oval's centre.
   *
   * Derived so the oval measures 136 units across — what the desktop pendant
   * measures — because that is the figure that has to survive the breakpoint:
   * the piece should carry the same weight against the cards at every width,
   * and the cards ride the unit.
   */
  renderWidthUnits: 1243.4,
  renderHeightUnits: 1865.1,
  ovalCentreUnits: 1603.5,
} as const;

/**
 * Opacity of the scroll cue at either end of the sequence. Figma's 30% is right
 * for black on the cream page; the same value in white over the frame-3
 * photograph is barely legible, so it lifts alongside the colour inversion.
 */
export const SCROLL_CUE_OPACITY = {
  onPage: 0.3,
  onPhoto: 0.65,
} as const;

/**
 * Exit parallax on the frame-3 photograph: once the pin lets go and the hero
 * scrolls away, the photograph follows at `1 - FRAME_3_PARALLAX` of the page's
 * speed, so it reads as lying behind the card rather than printed on it.
 *
 * It only ever lags downward, and the strip it opens at the card's top edge is
 * always above the viewport by then — the card fills the screen, and its top
 * has already left by more than the lag — so the frame needs no extra room and
 * the tuned rest crop is untouched.
 */
export const FRAME_3_PARALLAX = 0.4;

/**
 * The pendant's exit over `TIMELINE.pendantExit`: it stays where it hangs and
 * dissolves into a haze — it used to be drawn up out of frame. Three things
 * run together: it fades, it blurs (up to `blur` design units), and it washes
 * toward the paper (contrast down and brightness up by up to `wash`), the way
 * an object loses its edges and its darks as fog thickens in front of it.
 */
export const PENDANT_FOG = {
  blur: 28,
  wash: 0.45,
} as const;

/**
 * Frame 3 hands the headline and standfirst over to their own copy
 * (`headlinePhoto`, `taglinePhoto`) as the photograph takes the screen — at
 * the middle of the colour inversion, so the new words arrive already white.
 * The handover itself is the shared `TextSwap` and its timing.
 *
 * Two thresholds rather than one, so a reader resting on the boundary does
 * not set the copy flickering: it hands over at `toPhoto` on the way down and
 * only hands back below `toRest` on the way up.
 */
export const TEXT_SWAP = {
  toPhoto: 0.8,
  toRest: 0.74,
} as const;

/**
 * The ring's entrance once the preloader lifts: the cards come up one by one,
 * clockwise from 12 o'clock (card 0, then round by index), while the whole
 * ring swings `spin` degrees along its own circle into place — so the cards
 * read as being dealt round a dial that is still settling, rather than as
 * eight photographs fading in where they stand.
 *
 * `duration` is the whole entrance; each card takes `cardSpan` of it, and the
 * eight starts are spread evenly over the rest. A card fades in from `blur`
 * (design units) and from `scaleFrom` of its size — the same blur the headline
 * letters come out of, so the first screen assembles in one language.
 */
export const HERO_INTRO = {
  delay: 100,
  /** 1900 first; asked for quicker. */
  duration: 1150,
  spin: 40,
  cardSpan: 0.42,
  blur: 14,
  scaleFrom: 0.86,
} as const;
