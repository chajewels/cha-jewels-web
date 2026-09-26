/**
 * THE SITE'S MOTION TOKENS. Every duration, ease and distance the website
 * animates with comes from here — components read the numbers, and CSS
 * transitions and keyframes read the same numbers through the custom
 * properties in MOTION_CSS_VARS, which tailwind.config.ts puts on :root. A
 * one-off duration anywhere else is a bug.
 *
 * Slower than the Hub on purpose. The brief is Bulgari, Cartier, Tiffany: a
 * thing that moves here moves with weight and settles, it never snaps or
 * bounces. EASE_LUX is a long exponential-out — most of the travel happens in
 * the first third, and the rest is the settle the eye reads as "heavy".
 *
 * Plain module with no imports: tailwind.config.ts loads it at build time.
 */

/** cubic-bezier(0.16, 1, 0.3, 1) — the ease for everything that ARRIVES. */
export const EASE_LUX = [0.16, 1, 0.3, 1] as const;

/**
 * The one exception: light CROSSING a surface. EASE_LUX covers two thirds of
 * the distance in the first fifth of the time — right for a block settling
 * into place, but a sheen on that curve is a flicker at the far edge (tested:
 * gone before 1.3 s, and nobody saw it). Light moves at an even pace, easing
 * in and out at the ends.
 */
export const EASE_SHEEN = [0.45, 0.05, 0.35, 1] as const;

/**
 * A photo TRAVELLING: the product gallery (GALLERY below) and the full-screen
 * viewer. EASE_LUX was wrong here: it covers 90% of the width in the first
 * 200 ms, so between two similar dark photographs the eye saw a swap, not a
 * slide (measured on 101d094). This is an in-out curve with a soft start and
 * a long even middle, so the photo is visibly moving the whole time.
 */
export const EASE_SLIDE = [0.55, 0, 0.25, 1] as const;

/**
 * The full-screen viewer's photo CONTINUING after the hand lets go, and its
 * open/close. Decelerates to a stop, never past it: no overshoot, no bounce.
 */
export const EASE_GLIDE = [0.25, 0.6, 0.3, 1] as const;

/**
 * THE PRODUCT GALLERY'S TIMING — one token, read by every input (arrows,
 * thumbnails, keys, swipe) on every device, so a phone and a desktop move the
 * same. Owner review 2026-09-23: the photo change was too fast everywhere.
 *
 *   slide        a completed change, on EASE_SLIDE: 850 ms, calm and fully
 *                visible (10% of the travel at 200 ms, 30% at 300 ms, 69% at
 *                425 ms, 94% at 620 ms).
 *   releaseMin   a swipe completing after the finger lets go takes what is
 *                left of `slide`, but never less than this — a fast flick
 *                does not hurry it (the finger's speed is not carried over).
 *   easeRelease  its curve: the same soft in-out shape, starting just off
 *                rest so the photo does not stall under a lifted finger.
 *   springBack   a swipe that did not pass the threshold returning, on
 *                easeRelease: gentle, no bounce.
 *   settle       the arriving photo's PHOTO_SETTLE → 1, on EASE_SLIDE. Starts
 *                with the slide and ends just after it lands, so slide and
 *                settle read as one movement; the leaving photo's dim runs
 *                exactly the length of the slide.
 *   sweepDelay   the gold light starts a little after the slide and ends as
 *                the settle ends — it lands with the photo.
 *
 * Seconds. The "Photo 3 of 4" roll and the gold bar under the thumbnails run
 * on `slide` too (--dur-gallery-slide). Dragging itself is 1:1 with the
 * finger; only what happens after release is timed here.
 */
export const GALLERY = {
  slide: 0.85,
  releaseMin: 0.75,
  easeRelease: [0.35, 0.15, 0.25, 1] as const,
  springBack: 0.55,
  settle: 0.95,
  sweepDelay: 0.12,
} as const;

/** The hero curtain arriving: slow off the mark, fast into cover. */
export const EASE_WIPE_IN = [0.65, 0, 0.35, 1] as const;

/** Seconds. */
export const DUR = {
  /** Text and blocks rising into place. */
  reveal: 0.9,
  /** Photographs: wipes and settles take longer than text. */
  image: 1.2,
  /** Hover and tap feedback. */
  micro: 0.25,
  /**
   * One pass of light: the headline sheen, and the gold sweep across the
   * whole hero image, which share it so they move as one light.
   */
  sheen: 2.6,
  /** A hairline or an ornament drawing itself. */
  draw: 1.1,
  /** One lap of light around a shine border; a spotlight's touch glow. */
  shine: 2.4,
  /** The gold-edged curtain between hero slides: cover + reveal, in total. */
  wipe: 1.3,
  /** A photo crossing the full-screen viewer on EASE_SLIDE (the page gallery uses GALLERY). */
  slide: 0.65,
  /** The full-screen viewer opening from the photo, and closing back into it. */
  expand: 0.5,
  /** A client navigation's page entrance (fade + PAGE_RISE). Quick: it must not delay reading. */
  page: 0.45,
  /** The hero vignette settling in from the edges. */
  vignette: 1.5,
} as const;

/**
 * THE HEADER (components/site/header-shell.tsx). Hides on the way down the
 * page and comes back on the way up. `solidAfter`: past this many px it
 * takes its frosted background and shadow. `hideAfter`: it never hides above
 * this scroll position (the announcement bar and the first screen). `delta`:
 * scroll travel, px, that counts as a change of direction — smaller jitters
 * (a trackpad settling, iOS rubber-banding) are ignored. `hide`/`show`:
 * seconds; leaving is quicker than returning.
 */
export const HEADER = { solidAfter: 24, hideAfter: 160, delta: 8, hide: 0.35, show: 0.5 } as const;

/**
 * THE PAGE EMBLEMS (components/fx/emblem.tsx): a gold medallion that turns
 * in like a coin — from `turn` degrees about its vertical axis and `from`
 * scale — over DUR.image on EASE_LUX, then one band of gold light crosses it
 * over DUR.sheen, starting `sweepDelay` s in. Transform and overlay only:
 * never faded in, so an emblem is on screen from the first frame.
 */
export const EMBLEM = { turn: -48, from: 0.9, sweepDelay: 0.35 } as const;

/** A client navigation: the new page fades up this many px over DUR.page (app/template.tsx). */
export const PAGE_RISE = 12;

/**
 * THE LOYALTY LADDER (components/fx/tier-ladder.tsx). The rail and the tier
 * cards answer to one READING LINE, `line` of the viewport height, so a card
 * arrives when it is well in view rather than the moment it enters (owner
 * review of PR #136: the ladder sits deep in the page and the first trigger
 * fired before anyone saw it).
 *
 *   stacked (phone)  the rail follows scroll and its tip IS the reading line;
 *                    a card lights, and its medallion arrives, when the line
 *                    crosses the card's centre.
 *   across (lg)      the four cards share a row, so scroll cannot stagger
 *                    them. When the row's centre reaches the line — or the
 *                    whole row is in view (bottom above `fullAt`), whichever
 *                    is first — the rail SWEEPS across in `sweep` seconds on
 *                    EASE_SHEEN, and each card lights as the tip passes its
 *                    centre. A reader who stops scrolling still sees all four.
 *                    Scrolling back above the trigger sweeps it back.
 *
 * A card that leaves the viewport completely is reset, so its arrival plays
 * again when it comes back. `crownLap`: seconds for one turn of the top
 * tier's metallic border — slow on purpose.
 */
export const LADDER = { line: 0.6, fullAt: 0.95, sweep: 1.8, crownLap: 9 } as const;

/**
 * THE TIER MEDALLIONS (components/fx/tier-icon-style.tsx). Seconds.
 *
 * ARRIVAL, once per entry into view: Glimmer twinkles (`twinkle`), Radiant's
 * rays push out (`rays`), light crosses Elite's facets (`facets`, the table
 * flashing at `flashAt` of it), the crown rises `riseFrom` px from
 * `scaleFrom` (`rise`) as a shimmer crosses it (`shimmer`, `shimmerDelay` in).
 *
 * THEN, CONTINUOUSLY, while the card is on screen and the tab is visible:
 *   glimmerEvery  a twinkle with a turning glint, every this many seconds
 *   raysTurn      one full, slow turn of Radiant's rays; `raysPulse` is the
 *                 period of their brightness breathing
 *   eliteEvery    a sparkle across the facets and a flash at the table
 *   floatEvery    one rise-and-fall of the crown, `float` px; the gold
 *                 shimmer crosses it every `crownEvery`
 * The periods are all different and each tier starts at its own `offset`, so
 * the four drift apart and never pulse together.
 */
export const TIER_ICON = {
  twinkle: DUR.reveal,
  rays: DUR.draw,
  facets: 1.4,
  flashAt: 0.7,
  rise: DUR.image,
  riseFrom: 6,
  scaleFrom: 0.88,
  shimmer: 1.4,
  shimmerDelay: 0.35,
  glimmerEvery: 3.4,
  raysTurn: 30,
  raysPulse: 4.6,
  eliteEvery: 3.8,
  floatEvery: 5.2,
  float: 3,
  crownEvery: 4.2,
  offset: { glimmer: 0.2, radiant: 0, elite: 0.9, crown: 1.6 },
} as const;

/** The scale an arriving gallery photo starts at before settling to 1. */
export const PHOTO_SETTLE = 1.06;
/** How dark the leaving gallery photo goes (black overlay opacity). */
export const PHOTO_DIM = 0.6;
/** The desktop hover zoom, and the viewer's double-tap zoom. */
export const ZOOM = { hover: 2, tap: 2.5, max: 4 } as const;

/** Where the hero push-in ends and holds. */
export const HERO_PUSH = 1.08;

/** Seconds before first-load flourishes start, so the page has landed. */
export const DELAY = {
  /**
   * The first light: the headline sheen AND the gold sweep across the hero
   * image start together, so they read as one pass of light over the gold.
   */
  sheen: 0.8,
  /** The one-time shine around a CTA on touch screens, after the sheen. */
  shineTouch: 1.6,
} as const;

/** Seconds between siblings. */
export const STAGGER = {
  /** Letters, words, small items. */
  base: 0.06,
  /** Cards in a row: each card's own entrance is a sequence, so they need room. */
  card: 0.12,
} as const;

/**
 * How long each hero slide holds before the deck advances, seconds. Also the
 * length of each slide's push-in, so the image is still moving, slowly, for
 * as long as it is on screen.
 */
export const SLIDE_EVERY = 6;

/** How often the hero sheen returns while the hero is on screen, seconds. */
export const SHEEN_EVERY = 8;

/** How far a revealed block rises, px. */
export const RISE = 24;

/** Max tilt of a product card under a mouse, degrees; perspective in px. */
export const TILT_MAX = 6;
export const TILT_PERSPECTIVE = 900;

/** Max travel of a magnetic element, px. */
export const MAGNET_MAX = 6;

/** The hero as the reader scrolls past it. */
export const HERO_SINK = { mediaScale: 1.06, contentDrift: 56, contentFade: 0.35 } as const;

/**
 * CUSTOMER STORIES, the typing slideshow (components/home/story-show.tsx).
 * Owner approval 2026-09-26, as comped (reference/section-comps/NOTES.md).
 *
 *   typeCps   natural typing speed, by the quote's language: characters
 *             (graphemes) per second, one at a time.
 *   typeMax   no story takes longer than this to type, seconds. A longer story
 *             speeds up to fit (475 characters: ~106 per second).
 *   readCps   reading speed the hold is sized from (~200 wpm EN, ~480 字/min JA).
 *   holdMin / holdMax
 *             the hold after the last character = reading time − typing time,
 *             clamped to this range, seconds.
 *   lead      the name and stars settle before the first character, seconds.
 *   out / in  a story leaving (fade, rise 8px) and arriving (EASE_LUX, 10px).
 *   swipe     horizontal travel, px, that a touch drag needs to change story.
 */
export const STORY = {
  typeCps: { en: 35, ja: 18 },
  typeMax: 4.5,
  readCps: { en: 17, ja: 8 },
  holdMin: 3.5,
  holdMax: 10,
  lead: 0.35,
  out: 0.35,
  in: 0.6,
  swipe: 48,
} as const;

/**
 * OUR VALUES, the text burst (components/home/values-tiles.tsx). Owner
 * approval 2026-09-26: text only — no card glow, rays or particles.
 *
 *   cps       letters landing per second, per page language. Faster than
 *             STORY's typing: a value is a heading and one sentence, and four
 *             of them run in a row.
 *   beat      pause between a value's title and its description, seconds.
 *   letter    one letter's life: in with a gold-pale flash and a small pop
 *             (scale `pop`), settling to the text's own colour, seconds.
 *   pop       the letter's largest scale, at 30% of `letter`.
 *   overlap   the next value starts this long before the previous one's last
 *             letter has settled, seconds — one sentence hands to the next.
 *   inView    share of a tile that must be on screen before it may play.
 */
export const VALUE_BURST = {
  cps: { en: 45, ja: 20 },
  beat: 0.15,
  letter: 0.55,
  pop: 1.12,
  overlap: 0.3,
  inView: 0.6,
} as const;

/** The same numbers for CSS: set on :root by the plugin in tailwind.config.ts. */
export const MOTION_CSS_VARS = {
  "--ease-lux": `cubic-bezier(${EASE_LUX.join(", ")})`,
  "--ease-slide": `cubic-bezier(${EASE_SLIDE.join(", ")})`,
  "--dur-gallery-slide": `${GALLERY.slide}s`,
  "--dur-crown-lap": `${LADDER.crownLap}s`,
  // Sticky elements under the header move with it (--hdr-h, header-shell.tsx).
  "--dur-hdr-show": `${HEADER.show}s`,
  "--dur-hdr-hide": `${HEADER.hide}s`,
  "--dur-reveal": `${DUR.reveal}s`,
  "--dur-micro": `${DUR.micro}s`,
  "--ease-sheen": `cubic-bezier(${EASE_SHEEN.join(", ")})`,
  "--dur-sheen": `${DUR.sheen}s`,
  "--dur-draw": `${DUR.draw}s`,
  "--dur-image": `${DUR.image}s`,
  "--rise": `${RISE}px`,
  "--dur-shine": `${DUR.shine}s`,
  "--delay-sheen": `${DELAY.sheen}s`,
  "--dur-slide": `${SLIDE_EVERY}s`,
  "--dur-vignette": `${DUR.vignette}s`,
  "--hero-push": `${HERO_PUSH}`,
  "--delay-shine-touch": `${DELAY.shineTouch}s`,
  "--dur-story-out": `${STORY.out}s`,
  "--dur-story-in": `${STORY.in}s`,
  "--dur-burst-letter": `${VALUE_BURST.letter}s`,
  "--burst-pop": `${VALUE_BURST.pop}`,
} as const;
