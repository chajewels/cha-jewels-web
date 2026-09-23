import Image from "next/image";
import { Hammer, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";
import { Spotlight } from "@/components/fx/spotlight";
import { RevealGroup, RevealItem } from "@/components/fx/reveal";
import { SplitHeading } from "@/components/fx/split-text";

/**
 * Our Values (Stitch §5): header, then the 7/5 bento — four charcoal cards
 * (01–04) and the artisan photo card. All copy from the dictionary's
 * home.value* keys; the Stitch wording differed slightly and the dictionary won.
 *
 * The photo card is the photo alone: the caption bar and the pill/location
 * overlay are gone, and the gradient with them — it existed only to keep that
 * overlay legible. object-position 60% center holds the hands and the pearls
 * in frame as the card crops to its tall shape.
 *
 * Motion (components/fx): the four tiles rise in one after another, and each
 * carries a gold spotlight that follows a mouse pointer and lights its edge —
 * on touch, a single rising glow when the tile comes into view.
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
        <RevealGroup className="max-w-[62ch] space-y-1">
          <RevealItem index={0}><p className="text-[11px] font-bold uppercase tracking-widest text-gold-dark">{t("home", "valuesEyebrow")}</p></RevealItem>
          <SplitHeading text={t("home", "valuesH")} lang={lang} className="font-display text-[clamp(28px,3.4vw,44px)] text-charcoal" />
          <RevealItem index={2}><p className="text-sm leading-relaxed text-charcoal/70 lg:text-base">{t("home", "valuesP")}</p></RevealItem>
          {/* Moved down from the hero's intro slide, where it was the second
              paragraph over the video and was clamped to five lines on a
              phone. Same key, so the wording and both languages are
              unchanged — it is only in a place that can hold it. */}
          <RevealItem index={3}><p className="pt-2 text-sm leading-relaxed text-charcoal/70 lg:text-base">{t("hero", "lede2")}</p></RevealItem>
        </RevealGroup>
        <div className="mt-6 grid gap-3 lg:mt-10 lg:grid-cols-12 lg:gap-6">
          <RevealGroup className="grid gap-3 sm:grid-cols-2 lg:col-span-7 lg:gap-6">
            {cards.map(({ Icon, h, p }, i) => (
              <RevealItem key={h} index={i} className="flex">
              <Spotlight className="flex w-full flex-col gap-2 rounded-sm bg-charcoal p-5 text-chalk shadow-sm lg:p-6">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-widest text-orange" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                  <Icon aria-hidden="true" className="h-5 w-5 text-orange" />
                </div>
                <h3 className="font-display text-xl text-chalk lg:text-2xl">{h}</h3>
                <p className="text-sm leading-relaxed text-chalk/75">{p}</p>
              </Spotlight>
              </RevealItem>
            ))}
          </RevealGroup>
          <RevealGroup className="flex flex-col overflow-hidden rounded-sm border border-hairline bg-white shadow-sm lg:col-span-5">
            <div className="relative min-h-[220px] flex-1 lg:min-h-[320px]">
              {/* The photo wipes up and settles, like the collection cards. */}
              <div className="card-wipe" style={{ ["--i" as string]: 2 }}><Image src="/images/home/values-artisan.webp" alt={t("home", "valuesImageAlt")} fill sizes="(max-width: 1023px) 100vw, 40vw" className="object-cover object-[60%_center]" /></div>
            </div>
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
