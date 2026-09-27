import { layawayOffered } from "@/lib/layaway-availability";
import { isLayawayTestimonial } from "@/lib/content-rules";
import { graphemes, storySize, type QuoteLang } from "@/lib/story-timing";
import type { Lang } from "@/lib/i18n";
import type { Testimonial } from "@/lib/types";

/**
 * A customer story, ready to show: the ONE set of rules for turning the Hub's
 * testimonials into what a reader sees. The home page's Customer Stories
 * section (components/home/testimonials.tsx) and the header's mega-menus
 * (components/site/menu-story.tsx) both read from here, so they can never
 * disagree about which stories exist or how a story is shown.
 */
export type Story = {
  id: string;
  /** The customer's words EXACTLY as the Hub holds them: never trimmed, re-spaced or cut. Shown with pre-wrap. */
  quote: string;
  /** The language the words are in (not the page's), for `lang` and sizing. */
  qLang: QuoteLang;
  size: "l" | "m" | "s";
  name: string;
  item: string | null;
  rating: number | null;
  location: string | null;
  date: { iso: string; label: string } | null;
};

/**
 * The stories for a page in `lang`:
 *
 *   quote     in the page's language, falling back to the other language when
 *             that one is null
 *   shown     only with a quote and a customer name; a layaway story only
 *             where layaway is offered (English only, lib/layaway-availability).
 *             Quotes are never filtered for their wording (lib/content-rules.ts)
 *   rating    rounded into 0–5, or null (no stars row)
 *   date      month and year, never the day
 */
export function toStories(items: Testimonial[], lang: Lang): Story[] {
  const quoteOf = (x: Testimonial) => (lang === "ja" ? x.quote_ja ?? x.quote_en : x.quote_en ?? x.quote_ja);
  return items
    .filter((x) => quoteOf(x) && x.customer_name && (layawayOffered(lang) || !isLayawayTestimonial(x)))
    .map((x) => {
      const quote = quoteOf(x) as string;
      const qLang: QuoteLang = quote === x.quote_ja ? "ja" : "en";
      return {
        id: x.id,
        quote,
        qLang,
        size: storySize(graphemes(quote, qLang).length, qLang),
        name: x.customer_name,
        item: x.item,
        rating: x.rating == null ? null : Math.max(0, Math.min(5, Math.round(x.rating))),
        location: x.location,
        date: storyDate(x.testimonial_date, lang),
      };
    });
}

/**
 * When the testimonial was given, as month and year — never the day. A quote
 * is not an event, and a precise date invites the reader to work out how old
 * it is. `null` (absent or malformed) renders nothing.
 */
function storyDate(date: string | null, lang: Lang): Story["date"] {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return { iso: date, label: d.toLocaleDateString(lang === "ja" ? "ja-JP" : "en-US", { year: "numeric", month: "long" }) };
}
