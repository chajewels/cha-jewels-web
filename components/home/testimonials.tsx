import { Star } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";

/**
 * PLACEHOLDER — replace before launch.
 *
 * Client Experiences (Stitch §9): three cards carrying the design file's
 * placeholder strings (home.testiPh* in lib/i18n.ts) until approved customer
 * quotes exist. When real testimonials land, replace the placeholder keys with
 * the approved copy — the layout stays.
 */
export function Testimonials({ lang }: { lang: Lang }) {
  const t = tr(lang);
  return (
    <section className="bg-white py-8 lg:py-16">
      <div className="wrap">
        <div className="max-w-[62ch] space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold-dark">{t("home", "testiEyebrow")}</p>
          <h2 className="font-display text-[clamp(28px,3.4vw,44px)] text-charcoal">{t("home", "testiH")}</h2>
          <p className="text-sm text-charcoal/70">{t("home", "testiP")}</p>
        </div>
        <div className="mt-6 grid gap-3 lg:mt-10 lg:grid-cols-3 lg:gap-6">
          {[0, 1, 2].map((i) => (
            <article key={i} className="flex flex-col gap-2 rounded-sm border border-hairline bg-chalk p-5 shadow-sm lg:p-6">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] text-charcoal"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-teal" />{t("home", "testiPhPill")}</span>
                <span className="flex text-gold-dark" aria-label="5 / 5">{[0, 1, 2, 3, 4].map((s) => <Star key={s} aria-hidden="true" className="h-4 w-4 fill-current" />)}</span>
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
