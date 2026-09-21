import { Star } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";
import type { Testimonial } from "@/lib/types";

/**
 * Client Experiences (Stitch §9). `items` comes from the Hub (GET
 * /testimonials). With at least one published testimonial the real cards
 * render: the quote in the page's language, falling back to the other language
 * when one is null; stars from `rating` (row omitted when null); customer name;
 * item chip and location when present.
 *
 * PLACEHOLDER: while the Hub has published nothing, the three ILLUSTRATIVE
 * testimonials from the Stitch mock (home.testiPh1..3* in lib/i18n.ts) render
 * through the same card, so the section looks exactly as designed. They are
 * not real customers and are replaced by the first published Hub testimonial.
 */
export function Testimonials({ lang, items }: { lang: Lang; items: Testimonial[] }) {
  const t = tr(lang);
  const quoteOf = (x: Testimonial) => (lang === "ja" ? x.quote_ja ?? x.quote_en : x.quote_en ?? x.quote_ja);
  const real = items.filter((x) => quoteOf(x) && x.customer_name);
  const placeholders: Testimonial[] = ([1, 2, 3] as const).map((n) => ({
    id: `placeholder-${n}`,
    customer_name: t("home", `testiPh${n}Name`),
    location: t("home", `testiPh${n}Loc`),
    quote_en: t("home", `testiPh${n}Quote`),
    quote_ja: t("home", `testiPh${n}Quote`),
    item: t("home", `testiPh${n}Item`),
    rating: 5,
  }));
  const shown = real.length > 0 ? real : placeholders;

  return (
    <section className="bg-white py-8 lg:py-16">
      <div className="wrap">
        <div className="max-w-[62ch] space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold-dark">{t("home", "testiEyebrow")}</p>
          <h2 className="font-display text-[clamp(28px,3.4vw,44px)] text-charcoal">{t("home", "testiH")}</h2>
          <p className="text-sm text-charcoal/70">{t("home", "testiP")}</p>
        </div>
        <div className="mt-6 grid gap-3 lg:mt-10 lg:grid-cols-3 lg:gap-6">
          {shown.map((x) => {
            const rating = x.rating == null ? null : Math.max(0, Math.min(5, Math.round(x.rating)));
            return (
              <article key={x.id} className="flex flex-col justify-between gap-5 rounded-sm border border-hairline bg-chalk p-5 shadow-sm lg:p-6">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <span aria-hidden="true" className="h-2 w-2 shrink-0 rotate-45 bg-orange" />
                    {x.item && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] text-charcoal">
                        <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-teal" />{x.item}
                      </span>
                    )}
                  </div>
                  {rating != null && (
                    <span role="img" className="flex text-gold-dark" aria-label={`${rating} / 5`}>
                      {[0, 1, 2, 3, 4].map((s) => <Star key={s} aria-hidden="true" className={`h-4 w-4 ${s < rating ? "fill-current" : "opacity-30"}`} />)}
                    </span>
                  )}
                  <p className="text-sm italic leading-relaxed text-charcoal lg:text-base">{quoteOf(x)}</p>
                </div>
                <div className="flex flex-col gap-0.5 border-t border-hairline pt-4">
                  <p className="text-sm font-semibold text-charcoal">{x.customer_name}</p>
                  {x.location && <p className="text-xs text-charcoal/70">{x.location}</p>}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
