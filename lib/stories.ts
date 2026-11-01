import { layawayOffered } from "@/lib/layaway-availability";
import { isLayawayTestimonial } from "@/lib/content-rules";
import { graphemes, storySize, type QuoteLang } from "@/lib/story-timing";
import { SITE_TIME_ZONE } from "@/lib/site-time";
import { REVIEW_MAX_PHOTOS, showable, type Review } from "@/lib/reviews";
import { tr } from "@/lib/i18n";
import { type Lang } from "@/lib/i18n-core";
import type { Testimonial } from "@/lib/types";

/**
 * A customer story, ready to show: the ONE set of rules for turning the Hub's
 * testimonials into what a reader sees. The home page's Customer Stories
 * section (components/home/testimonials.tsx) and the header's mega-menus
 * (components/site/menu-story.tsx) both read from here, so they can never
 * disagree about which stories exist or how a story is shown.
 *
 * Approved product reviews are stories too (owner decision 2026-10-17: one
 * customer section on the home page, not two): reviewsToStories turns them
 * into the same shape, and mergeStories puts both into one list. The header's
 * mega-menus stay on testimonials only.
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
  /** A review from a buyer (shown with the "verified" label); false for a testimonial. */
  verified: boolean;
  /**
   * The photos the owner approved with a review (Hub `photo_urls`, at most
   * REVIEW_MAX_PHOTOS), each with its caption in the page's language. Always
   * empty for a testimonial. Restored 2026-10-18: the home review cards showed
   * them, and moving reviews into the stories (2026-10-17) had dropped them.
   */
  photos: StoryPhoto[];
};

export type StoryPhoto = { src: string; alt: string };

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
        verified: false,
        photos: [],
      };
    });
}

/**
 * Approved reviews (GET /reviews, already in the page's language) as stories:
 *
 *   shown     only with a body (lib/reviews.ts showable). NOT filtered for
 *             layaway: a review is about a piece, and the owner's approval in
 *             the Hub is the gate
 *   quote     the body exactly as held, like a testimonial's
 *   location  the Hub's derived buyer location, trimmed; null when absent or
 *             blank (an older Hub payload has no field), shown like a
 *             testimonial's
 *   date      the approval's month and year, never the day
 *   photos    the approved photos, in the Hub's order, at most
 *             REVIEW_MAX_PHOTOS; anything that is not a non-empty string is
 *             skipped (an older Hub payload has no field), each captioned
 *             like the product page's review cards (reviews.photoAlt)
 *   id        `review:<id>`, so it never collides with a testimonial's id
 */
export function reviewsToStories(reviews: Review[], lang: Lang): Story[] {
  const t = tr(lang);
  return showable(reviews).map((r) => {
    const quote = r.body as string;
    const srcs = (Array.isArray(r.photos) ? r.photos : [])
      .filter((p): p is string => typeof p === "string" && p.trim().length > 0)
      .slice(0, REVIEW_MAX_PHOTOS);
    return {
      id: `review:${r.id}`,
      quote,
      qLang: lang,
      size: storySize(graphemes(quote, lang).length, lang),
      name: r.display_name,
      item: r.piece_name,
      rating: Math.max(0, Math.min(5, Math.round(r.rating))),
      location: typeof r.location === "string" && r.location.trim() ? r.location.trim() : null,
      date: storyDate(r.approved_at, lang),
      verified: true,
      photos: srcs.map((src, i) => ({ src, alt: t("reviews", "photoAlt", { name: r.display_name, n: String(i + 1) }) })),
    };
  });
}

/**
 * Testimonials and reviews as ONE list, newest first. A story with no date
 * goes after the dated ones, keeping its place among them. No cap.
 */
export function mergeStories(testimonials: Story[], reviews: Story[]): Story[] {
  const time = (s: Story) => (s.date ? new Date(s.date.iso).getTime() : null);
  return [...testimonials, ...reviews]
    .map((s, i) => ({ s, i, t: time(s) }))
    .sort((a, b) => {
      if (a.t != null && b.t != null && a.t !== b.t) return b.t - a.t;
      if ((a.t == null) !== (b.t == null)) return a.t == null ? 1 : -1;
      return a.i - b.i;
    })
    .map((x) => x.s);
}

/**
 * When the testimonial was given, as month and year — never the day. A quote
 * is not an event, and a precise date invites the reader to work out how old
 * it is. `null` (absent or malformed) renders nothing. Japan time
 * (lib/site-time.ts): a review's approval is a timestamp, and its month is the
 * shop's month.
 */
function storyDate(date: string | null, lang: Lang): Story["date"] {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return { iso: date, label: d.toLocaleDateString(lang === "ja" ? "ja-JP" : "en-US", { year: "numeric", month: "long", timeZone: SITE_TIME_ZONE }) };
}
