import type { Lang } from "@/lib/i18n";
import { hub } from "@/lib/hub-api";
import { mergeStories, reviewsToStories, toStories } from "@/lib/stories";
import { lumiereStories } from "@/lib/content/lumiere-home";
import { graphemes } from "@/lib/story-timing";
import { ReviewSummary } from "@/components/reviews/review-list";

import type { BeltStory } from "./stories-belt";
import { StoriesBeltIsland } from "./stories-belt-island";

/**
 * CUSTOMER STORIES — the Slider Slipstream reference (docs/design-refs/
 * slider-slipstream/owner-prompt.md; P4 item 1, the owner's choice, replacing
 * the Cards Almanac stack that grew one screen per story): a tilted CSS-3D
 * belt of cards on a dark in-flow band, EVERY published story on it, newest
 * first. The stories are lib/stories.ts's — testimonials and approved reviews
 * in one list; a layaway story only where layaway is offered (never on the
 * Japanese home); THE CUSTOMER'S WORDS ARE SHOWN EXACTLY (the card carries an
 * excerpt and its ellipsis; the dialog carries the whole quote, pre-wrap,
 * untrimmed).
 *
 * Nothing published, nothing rendered. The Hub read is NOT caught here: the
 * section boundary around it (home-view.tsx) turns a failure into no section,
 * without caching a home that has no customers (components/home/sections.tsx
 * explains). Reviews are caught — an outage there must not take the
 * testimonials with it.
 *
 * `id="customer-stories"`: the anchor the mega-menus' "more stories" lands on.
 */
export const STORIES_ID = "customer-stories";
/** GET /reviews caps `limit` at 50 (supabase/contracts/api.md): every approved review the route can hand over in one read. */
export const REVIEWS_PAGE_MAX = 50;
/** The card shows this many characters of the quote (graphemes); the dialog shows all of it. */
const EXCERPT = 118;

export const StoriesSection = async ({ lang }: { lang: Lang }) => {
  const strings = lumiereStories(lang);
  const [items, list] = await Promise.all([
    hub.testimonials(),
    // The Hub's page ceiling (50): every approved review the route can hand over.
    hub.reviews({ lang, limit: REVIEWS_PAGE_MAX }).catch(() => null),
  ]);
  const stories = mergeStories(toStories(items, lang), reviewsToStories(list?.reviews ?? [], lang));
  if (stories.length === 0) return null;
  const average = list?.average ?? null;
  const count = list?.count ?? 0;

  const belt: BeltStory[] = stories.map((s) => {
    const g = graphemes(s.quote, s.qLang);
    return {
      id: s.id,
      quote: s.quote,
      excerpt: g.length > EXCERPT ? `${g.slice(0, EXCERPT).join("").trimEnd()}…` : s.quote,
      qLang: s.qLang,
      name: s.name,
      item: s.item,
      rating: s.rating,
      location: s.location,
      dateLabel: s.date?.label ?? null,
      dateIso: s.date?.iso ?? null,
      verified: s.verified,
      photos: s.photos,
    };
  });

  return (
    <section id={STORIES_ID} aria-labelledby="stories-heading" className="slip" data-count={belt.length}>
      <div className="slip__intro">
        <p className="slip__eyebrow font-manrope">{strings.eyebrow}</p>
        <h2 id="stories-heading" className="slip__title font-serif">
          {strings.heading}
        </h2>
        <p className="slip__lead font-tight">{strings.lead}</p>
        {average != null && count > 0 && (
          <div className="slip__summary">
            <ReviewSummary average={average} count={count} lang={lang} />
          </div>
        )}
      </div>
      <StoriesBeltIsland stories={belt} strings={strings} lang={lang} />

      {/* Every story, verbatim, for assistive tech and crawlers: the belt's cards are drawn art
          (and the belt itself arrives as the band nears the viewport). */}
      <ol className="sr-only" data-stories-list>
        {belt.map((s) => (
          <li key={s.id} lang={s.qLang}>
            <blockquote style={{ whiteSpace: "pre-wrap" }}>{s.quote}</blockquote>
            <p>{[s.name, s.item, s.location, s.dateLabel].filter(Boolean).join(", ")}</p>
          </li>
        ))}
      </ol>
    </section>
  );
};
