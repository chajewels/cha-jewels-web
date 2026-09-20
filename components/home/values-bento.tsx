import Image from "next/image";
import { BadgeCheck, Hammer, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";

/**
 * Our Values (Stitch §5): header, then the 7/5 bento — four charcoal cards
 * (01–04) and the workshop photo card. All copy from the dictionary's
 * home.value* keys; the Stitch wording differed slightly and the dictionary won.
 */
export function ValuesBento({ lang }: { lang: Lang }) {
  const t = tr(lang);
  const cards = [
    { Icon: Sparkles, h: t("home", "valueTimelessH"), p: t("home", "valueTimelessP") },
    { Icon: Scale, h: t("home", "valueWorthH"), p: t("home", "valueWorthP") },
    { Icon: Hammer, h: t("home", "valueCraftH"), p: t("home", "valueCraftP") },
    { Icon: ShieldCheck, h: t("home", "valueQualityH"), p: t("home", "valueQualityP") },
  ];
  return (
    <section className="py-8 lg:py-16">
      <div className="wrap">
        <div className="max-w-[62ch] space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gold-dark">{t("home", "valuesEyebrow")}</p>
          <h2 className="font-display text-[clamp(28px,3.4vw,44px)] text-charcoal">{t("home", "valuesH")}</h2>
          <p className="text-sm leading-relaxed text-charcoal/70 lg:text-base">{t("home", "valuesP")}</p>
        </div>
        <div className="mt-6 grid gap-3 lg:mt-10 lg:grid-cols-12 lg:gap-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7 lg:gap-6">
            {cards.map(({ Icon, h, p }, i) => (
              <article key={h} className="flex flex-col gap-2 rounded-sm bg-charcoal p-5 text-chalk shadow-sm lg:p-6">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-widest text-orange" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <Icon aria-hidden="true" className="h-5 w-5 text-orange" />
                </div>
                <h3 className="font-display text-xl text-chalk lg:text-2xl">{h}</h3>
                <p className="text-sm leading-relaxed text-chalk/75">{p}</p>
              </article>
            ))}
          </div>
          <div className="flex flex-col overflow-hidden rounded-sm border border-hairline bg-white shadow-sm lg:col-span-5">
            <div className="relative min-h-[220px] flex-1 lg:min-h-[320px]">
              <Image src="/images/home/pomelli-values.webp" alt={t("home", "valuesImageAlt")} fill sizes="(max-width: 1023px) 100vw, 40vw" className="object-cover" />
              <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
              <div className="absolute inset-x-3 bottom-2.5 flex items-center justify-between text-chalk">
                <span className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-teal" />{t("home", "valuesPill")}</span>
                <span className="rounded-sm bg-charcoal/60 px-2 py-0.5 text-[11px] backdrop-blur-sm">{t("home", "valuesPlace")}</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 bg-chalk p-3 text-sm text-charcoal">
              <p className="font-medium">{t("home", "valuesCaption")}</p>
              <BadgeCheck aria-hidden="true" className="h-4 w-4 shrink-0 text-charcoal" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
