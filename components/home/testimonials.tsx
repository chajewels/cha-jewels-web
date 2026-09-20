import { Star } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";
import type { Testimonial } from "@/lib/types";

/**
 * Client Experiences (Stitch §9). `items` comes from the Hub (GET
 * /testimonials). With at least one published testimonial the real cards
 * render: the quote in the page's language, falling back to the other language
 * when one is null; stars from `rating` (row omitted when null); customer name;
 * item and location when present.
 *
 * PLACEHOLDER: until the Hub publishes at least one testimonial the three
 * placeholder cards (home.testiPh* in lib/i18n.ts) render instead, so the
 * section keeps its shape. Nothing here is ever invented.
 */
export function Testimonials({ lang, items }: { lang: Lang; items: Testimonial[] }) {
  const t = tr(lang);
  const quoteOf = (x: Testimonial) => (lang === "ja" ? x.quote_ja ?? x.quote_en : x.quote_en ?? x.quote_ja);
  const real = items.filter((x) => quoteOf(x) && x.customer_name);
  const card = "flex flex-col gap-2 rounded-sm border border-hairline bg-chalk p-5 shadow-sm lg:p-6";
  const stars = (n: number) => (
    <span className="flex text-gold-dark" aria-label={`${n} / 5`}>
      {[0, 1, 2, 3, 4].map((s) => <Star key={s} aria-hidden="true" className={`h-4 w-4 ${s < n ? "fill-current" : "opacity-30"}`} />)}
    </span>
  );
  return (
    <section className="bg-white py-8 lg:py-16">
      <div className="wrap">
        <div className="max-w-[62ch] space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold-dark">{t("home", "testiEyebrow")}</p>
          <h2 className="font-display text-[clamp(28px,3.4vw,44px)] text-charcoal">{t("home", "testiH")}</h2>
          <p className="text-sm text-charcoal/70">{t("home", "testiP")}</p>
        </div>
        <div className="mt-6 grid gap-3 lg:mt-10 lg:grid-cols-3 lg:gap-6">
          {real.length > 0
            ? real.map((x) => {
                const rating = x.rating == null ? null : Math.max(0, Math.min(5, Math.round(x.rating)));
                const meta = [x.item, x.location].filter(Boolean).join(" · ");
                return (
                  <article key={x.id} className={card}>
                    {rating != null && <div className="flex items-center justify-end">{stars(rating)}</div>}
                    <p className="pt-1 text-sm italic leading-relaxed text-charcoal lg:text-base">{quoteOf(x)}</p>
                    <div className="flex items-center justify-between gap-2 pt-2 text-xs">
                      <span className="font-medium text-charcoal">{x.customer_name}</span>
                      {meta && <span className="text-charcoal/70">{meta}</span>}
                    </div>
                  </article>
                );
              })
            : [0, 1, 2].map((i) => (
                <article key={i} className={card}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] text-charcoal"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-teal" />{t("home", "testiPhPill")}</span>
                    {stars(5)}
                  </div>
                  <p className="pt-1 text-sm italic leading-relaxed text-charcoal lg:text-base">{t("home", "testiPhQuote")}</p>
                  <div className="flex items-center justify-between gap-2 pt-2 text-xs">
                    <span className="font-medium text-charcoal">{t("home", "testiPhName")}</span>
                    <span className="text-charcoal/70">{t("home", "testiPhItem")}</span>
                  </div>
                </article>
              ))}
        </div>
      </div>
    </section>
  );
}
