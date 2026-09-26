import { tr, type Lang } from "@/lib/i18n";
import { layawayOffered } from "@/lib/layaway-availability";
import { isLayawayTestimonial } from "@/lib/content-rules";
import { graphemes, storySize, type QuoteLang } from "@/lib/story-timing";
import type { Testimonial } from "@/lib/types";
import { StoryShow, type Story } from "@/components/home/story-show";
import { QuoteMark } from "@/components/fx/quote-mark";
import { SplitHeading } from "@/components/fx/split-text";
import { RevealGroup, RevealItem } from "@/components/fx/reveal";

/**
 * Customer Stories (Stitch §9). `items` comes from the Hub (GET
 * /testimonials): the quote in the page's language, falling back to the other
 * language when one is null; stars from `rating` (row omitted when null);
 * customer name; item chip, location and month + year when present.
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
export function Testimonials({ lang, items }: { lang: Lang; items: Testimonial[] }) {
  const t = tr(lang);
  const quoteOf = (x: Testimonial) => (lang === "ja" ? x.quote_ja ?? x.quote_en : x.quote_en ?? x.quote_ja);
  // Layaway is English-site only, so a layaway testimonial is hidden on the
  // Japanese site. Quotes are never filtered for their wording: they are
  // customers' own words, shown as written (lib/content-rules.ts).
  const shown = items.filter((x) => quoteOf(x) && x.customer_name && (layawayOffered(lang) || !isLayawayTestimonial(x)));
  if (shown.length === 0) return null;

  const stories: Story[] = shown.map((x) => {
    const quote = quoteOf(x) as string;
    // The language the words are in, not the page's: a Japanese page falls
    // back to an English quote, which is set, sized and timed as English.
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

  return (
    <section className="bg-white py-8 lg:py-16" aria-roledescription="carousel" aria-label={t("home", "testiH")}>
      <div className="wrap">
        <StoryShow
          stories={stories}
          labels={{
            prev: t("home", "storyPrev"), next: t("home", "storyNext"),
            pause: t("home", "storyPause"), play: t("home", "storyPlay"), upNext: t("home", "storyUpNext"),
          }}
          head={
            <>
              {/* Entrance (components/fx): the gold quote mark draws itself, the
                  heading rises in, the lines around it follow. */}
              <QuoteMark className="mb-3" />
              <RevealGroup className="max-w-[62ch] space-y-1">
                <RevealItem index={0}><p className="text-[11px] font-bold uppercase tracking-widest text-gold-dark">{t("home", "testiEyebrow")}</p></RevealItem>
                <SplitHeading text={t("home", "testiH")} lang={lang} className="font-display text-[clamp(28px,3.4vw,44px)] text-charcoal" />
                <RevealItem index={2}><p className="text-sm text-charcoal/70">{t("home", "testiP")}</p></RevealItem>
              </RevealGroup>
            </>
          }
        />
      </div>
    </section>
  );
}

/**
 * When the testimonial was given, as month and year — never the day.
 *
 * A quote is not an event, and a precise date invites the reader to work out
 * how old it is. `<time dateTime>` still carries the machine-readable value,
 * so the shortened display costs nothing a parser needs.
 *
 * `null` renders nothing: a missing date is not "unknown", it is simply a
 * line this story does not have.
 */
function storyDate(date: string | null, lang: Lang): Story["date"] {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null; // a malformed date is no date
  return { iso: date, label: d.toLocaleDateString(lang === "ja" ? "ja-JP" : "en-US", { year: "numeric", month: "long" }) };
}
