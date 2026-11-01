import Image from "next/image";

import type { Lang } from "@/lib/i18n";
import { hub } from "@/lib/hub-api";
import { isOptimizableImage } from "@/lib/image-hosts";
import { mergeStories, reviewsToStories, toStories, type Story } from "@/lib/stories";
import { lumiereStories } from "@/lib/content/lumiere-home";
import { ReviewSummary, Stars } from "@/components/reviews/review-list";
import { EngineIsland } from "@/components/lumiere/common/engine-island";

/**
 * CUSTOMER STORIES — the Cards Almanac reference re-skinned (report §7 home
 * row; docs/design-refs/cards-almanac): EVERY PUBLISHED STORY, newest first,
 * as a column of cards that pin and pile as the reader scrolls, each
 * settling flat over the last (P3 item 4: the stack showed a fixed six and
 * dropped the rest; the old home showed them all, and so does this one — no
 * story the owner published is left out). The stories are lib/stories.ts's — testimonials and approved reviews
 * in one list, newest first; a layaway story only where layaway is offered
 * (never on the Japanese home) — and THE CUSTOMER'S WORDS ARE SHOWN EXACTLY
 * (pre-wrap, untrimmed), as the typing slideshow showed them.
 *
 * The card: a cover (the review's first approved photo; a testimonial has none
 * and gets a quiet typographic plate), the month and year, the quote, then the
 * item chip, the customer's name with "Verified buyer" on a review, the
 * location and the stars. The reference's save button is not carried.
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
const STACK_ID = "customer-stories-stack";
/** GET /reviews caps `limit` at 50 (supabase/contracts/api.md): every approved review the route can hand over in one read. */
export const REVIEWS_PAGE_MAX = 50;

const Cover = ({ story }: { story: Story }) => {
  const photo = story.photos[0];
  if (photo) {
    return (
      <div className="almanac__cover">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes="(max-width: 619.98px) 92vw, 36vw"
          unoptimized={!isOptimizableImage(photo.src)}
          className="almanac__cover-photo"
        />
      </div>
    );
  }
  return (
    <div className="almanac__cover almanac__cover--type" aria-hidden="true">
      <span className="almanac__mark font-serif">“</span>
    </div>
  );
};

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

  return (
    <section id={STORIES_ID} aria-labelledby="stories-heading" className="almanac scroll-mt-24">
      <EngineIsland engine="almanac" target={STACK_ID} />
      <div className="almanac__intro">
        <p className="almanac__eyebrow font-manrope">{strings.eyebrow}</p>
        <h2 id="stories-heading" className="almanac__title font-serif">
          {strings.heading}
        </h2>
        <p className="almanac__sub font-tight">{strings.lead}</p>
        {average != null && count > 0 && (
          <div className="almanac__summary">
            <ReviewSummary average={average} count={count} lang={lang} />
          </div>
        )}
      </div>

      <div className="almanac__stack" id={STACK_ID} data-almanac>
        {stories.map((story) => (
          <article key={story.id} className="almanac__card" data-almanac-card lang={story.qLang}>
            <div className="almanac__media">
              <Cover story={story} />
            </div>
            <div className="almanac__body">
              {story.date && (
                <p className="almanac__date font-manrope">
                  <time dateTime={story.date.iso}>{story.date.label}</time>
                </p>
              )}
              <blockquote className="almanac__text font-serif">{story.quote}</blockquote>
            </div>
            <footer className="almanac__foot font-manrope">
              <div className="almanac__who">
                {story.item && <span className="almanac__tag">{story.item}</span>}
                <span className="almanac__name">
                  {story.name}
                  {story.verified && <span className="almanac__verified"> · {strings.verified}</span>}
                  {story.location && <span className="almanac__where"> · {story.location}</span>}
                </span>
              </div>
              {story.rating != null && <Stars value={story.rating} lang={lang} size={14} />}
            </footer>
          </article>
        ))}
        <div className="almanac__tail" aria-hidden="true" />
      </div>
      <span className="sr-only" aria-live="polite" data-almanac-live data-template={strings.count} />

    </section>
  );
};
