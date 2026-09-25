import type { Testimonial } from "@/lib/types";

/**
 * RULES FOR TEXT THAT COMES FROM THE HUB, applied at render time.
 *
 * Hub-sourced copy (testimonials today) never passes through check:terms, which
 * only scans this repo. A rule that must hold for that text lives here.
 *
 * NOT A TERMINOLOGY FILTER. Testimonials are real customers' words, shown
 * exactly as written (owner decision 2026-09-25): the gold terminology rule
 * applies to Cha Jewels' own text, not to customer quotes. Nothing here edits
 * or drops a quote for its wording.
 */

/**
 * A testimonial about layaway. Layaway is English-site only
 * (lib/layaway-availability.ts), so these are hidden on the Japanese site.
 *
 * A KEYWORD STOPGAP. The Hub has no layaway flag on testimonials yet; until it
 * does, a layaway quote that avoids every one of these words gets through.
 */
export const LAYAWAY_TESTIMONIAL = /layaway|lay-away|レイアウェイ|分割|取り置き/i;

export function isLayawayTestimonial(x: Pick<Testimonial, "quote_en" | "quote_ja" | "item">): boolean {
  return [x.quote_en, x.quote_ja, x.item].some((s) => s != null && LAYAWAY_TESTIMONIAL.test(s));
}
