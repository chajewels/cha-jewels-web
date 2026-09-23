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
  /** The hero vignette settling in from the edges. */
  vignette: 1.5,
} as const;

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

/** Max travel of a magnetic element, px. */
export const MAGNET_MAX = 6;

/** The hero as the reader scrolls past it. */
export const HERO_SINK = { mediaScale: 1.06, contentDrift: 56, contentFade: 0.35 } as const;

/** The same numbers for CSS: set on :root by the plugin in tailwind.config.ts. */
export const MOTION_CSS_VARS = {
  "--ease-lux": `cubic-bezier(${EASE_LUX.join(", ")})`,
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
} as const;
