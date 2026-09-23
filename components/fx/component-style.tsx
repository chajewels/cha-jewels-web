/**
 * A COMPONENT'S OWN STYLESHEET, SHIPPED INLINE.
 *
 * Product-page and card motion needs a few dozen rules. Put in
 * app/globals.css they would push it past the 100 KiB at which Next splits
 * it into a second render-blocking file (it is close — docs/perf-baseline.md);
 * put in a CSS Module they became a THIRD render-blocking <link> on every page
 * that renders a card, which on a slow phone costs ~60 ms of LCP, measured.
 *
 * So each component carries its rules as a string and renders them through
 * React 19's hoisted <style href precedence>: inlined into <head>, emitted
 * once however many cards there are, and only on pages that render the
 * component. No request, no global growth.
 *
 * Colours are the palette tokens exposed as custom properties by
 * tailwind.config.ts (--c-gold, --c-gold-pale, …), mixed with color-mix()
 * for alpha; timings are the lib/motion.ts custom properties.
 */
export function ComponentStyle({ id, css }: { id: string; css: string }) {
  return <style href={id} precedence="component">{css}</style>;
}

/** `a` percent of a palette token, the rest transparent. */
export const mix = (token: string, a: number) => `color-mix(in srgb, var(--c-${token}) ${a}%, transparent)`;
