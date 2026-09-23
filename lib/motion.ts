/**
 * THE SITE'S MOTION TOKENS. Every duration, ease and spring the website
 * animates with comes from here — motion components read the numbers, and
 * CSS keyframes read the same numbers through the custom properties in
 * MOTION_CSS_VARS, which app/layout.tsx sets on <html>. A one-off duration
 * anywhere else is a bug.
 *
 * Slower than the Hub on purpose. The brief is Bulgari, Cartier, Tiffany: a
 * thing that moves here moves with weight and settles, it never snaps or
 * bounces. EASE_LUX is a long exponential-out — most of the travel happens in
 * the first third, and the rest is the settle the eye reads as "heavy".
 *
 * Plain module, no "use client": the server layout imports the CSS variables.
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

/** Seconds. */
export const DUR = {
  /** Text and blocks rising into place. */
  reveal: 0.9,
  /** Photographs: wipes and settles take longer than text. */
  image: 1.2,
  /** Hover and tap feedback. */
  micro: 0.25,
  /** The hero headline sheen: one pass of the light across the words. */
  sheen: 2.6,
  /** A hairline or an ornament drawing itself. */
  draw: 1.1,
  /** One lap of light around a shine border; a spotlight's touch glow. */
  shine: 2.4,
} as const;

/** Seconds before first-load flourishes start, so the page has landed. */
export const DELAY = {
  /** The first hero sheen pass. */
  sheen: 0.35,
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

/** How often the hero sheen returns while the hero is on screen, seconds. */
export const SHEEN_EVERY = 8;

/** How far a revealed block rises, px. */
export const RISE = 24;

/** Max travel of a magnetic element, px. */
export const MAGNET_MAX = 6;

/** The hero as the reader scrolls past it. */
export const HERO_SINK = { mediaScale: 1.06, contentDrift: 56, contentFade: 0.35 } as const;

/** Standard motion transitions, built from the tokens above. */
export const T = {
  reveal: { duration: DUR.reveal, ease: EASE_LUX },
  image: { duration: DUR.image, ease: EASE_LUX },
  micro: { duration: DUR.micro, ease: EASE_LUX },
  draw: { duration: DUR.draw, ease: EASE_LUX },
} as const;

/** The same numbers for CSS. Set once, on <html>, by app/layout.tsx. */
export const MOTION_CSS_VARS = {
  "--ease-lux": `cubic-bezier(${EASE_LUX.join(", ")})`,
  "--dur-reveal": `${DUR.reveal}s`,
  "--dur-micro": `${DUR.micro}s`,
  "--ease-sheen": `cubic-bezier(${EASE_SHEEN.join(", ")})`,
  "--dur-sheen": `${DUR.sheen}s`,
  "--dur-draw": `${DUR.draw}s`,
  "--dur-image": `${DUR.image}s`,
  "--stagger-card": `${STAGGER.card}s`,
  "--dur-shine": `${DUR.shine}s`,
  "--delay-sheen": `${DELAY.sheen}s`,
  "--delay-shine-touch": `${DELAY.shineTouch}s`,
} as React.CSSProperties;
