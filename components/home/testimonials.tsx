import { tr, type Lang } from "@/lib/i18n";
import type { Story } from "@/lib/stories";
import { StoryShow } from "@/components/home/story-show";
import { ReviewSummary } from "@/components/reviews/review-list";
import { QuoteMark } from "@/components/fx/quote-mark";
import { SplitHeading } from "@/components/fx/split-text";
import { RevealGroup, RevealItem } from "@/components/fx/reveal";

/**
 * Customer Stories (Stitch §9). `stories` are the Hub's testimonials (GET
 * /testimonials) and approved reviews (GET /reviews) in one list, newest first
 * (lib/stories.ts, built in components/home/sections.tsx): the quote in the
 * page's language; stars from `rating` (row omitted when null); customer
 * name, with "Verified buyer" on a review; item chip, location and month +
 * year when present. The reviews' average and count sit at the right of the
 * heading while any review is approved.
 *
 * ONE CUSTOMER SECTION (owner decision 2026-10-17). The separate "Customer
 * reviews" grid that followed this section is gone; reviews play here.
 *
 * ONE STORY AT A TIME, TYPED (owner approval 2026-09-26). The heading block is
 * unchanged; the stories play in a typing slideshow — components/home/
 * story-show.tsx has the behaviour. It replaced the infinite marquee.
 *
 * THE CUSTOMER'S WORDS, EXACTLY. The quote is passed through untouched — not
 * trimmed, not re-spaced, line breaks kept — and the stage sets it with
 * `white-space: pre-wrap`, so what the Hub holds is what the page shows.
 *
 * NOTHING PUBLISHED, NOTHING RENDERED — no heading, no section, no gap.
 *
 * Three ILLUSTRATIVE testimonials from the Stitch mock used to fill this space
 * while the Hub had published none, through the same card, so the homepage
 * looked as designed. They were removed on 2026-09-22 with the rest of the
 * static copies: they were not real customers, and a section that shows
 * invented quotes whenever the real ones are missing is a section that will one
 * day show them on the live site without anyone noticing. Real or absent.
 *
 * A Hub that cannot be REACHED is a different thing again — it throws (see the
 * header of lib/hub-api.ts), so the homepage keeps serving its last successful
 * render rather than caching itself without this section for the next hour.
 */
export function Testimonials({ lang, stories, average, count }: { lang: Lang; stories: Story[]; average: number | null; count: number }) {
  const t = tr(lang);
  // Which stories, and how each is shown, is lib/stories.ts — the same rules
  // the header's mega-menus use (site frame, owner decision 2026-09-27).
  if (stories.length === 0) return null;

  return (
    // `id`: the anchor the mega-menus' "more stories" link lands on.
    <section id="customer-stories" className="scroll-mt-24 bg-white py-8 lg:py-16" aria-roledescription="carousel" aria-label={t("home", "testiH")}>
      <div className="wrap">
        <StoryShow
          stories={stories}
          labels={{
            prev: t("home", "storyPrev"), next: t("home", "storyNext"),
            pause: t("home", "storyPause"), play: t("home", "storyPlay"), upNext: t("home", "storyUpNext"),
            verified: t("reviews", "verified"),
          }}
          head={
            <>
              {/* Entrance (components/fx): the gold quote mark draws itself, the
                  heading rises in, the lines around it follow. */}
              <QuoteMark className="mb-3" />
              {/* The approved reviews' stars and count sit at the right of the
                  heading, as the removed reviews section had them; they wrap
                  under it where there is no room. */}
              <RevealGroup className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div className="max-w-[62ch] space-y-1">
                  <RevealItem index={0}><p className="text-[11px] font-bold uppercase tracking-widest text-gold-dark">{t("home", "testiEyebrow")}</p></RevealItem>
                  <SplitHeading text={t("home", "testiH")} lang={lang} className="font-display text-[clamp(28px,3.4vw,44px)] text-charcoal" />
                  <RevealItem index={2}><p className="text-sm text-charcoal/70">{t("home", "testiP")}</p></RevealItem>
                </div>
                {average != null && count > 0 && <RevealItem index={3}><ReviewSummary average={average} count={count} lang={lang} /></RevealItem>}
              </RevealGroup>
            </>
          }
        />
      </div>
    </section>
  );
}
