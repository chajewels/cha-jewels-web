import Link from "next/link";
import Image from "next/image";
import { pageMeta } from "@/lib/page-meta";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { layawayOffered } from "@/lib/layaway-availability";
import { Button } from "@/components/ui/button";
import { NavHeading, SplitHeading } from "@/components/fx/split-text";

export const generateMetadata = () => pageMeta("why");

/**
 * Why Cha Jewels — a light page, copy left and one photograph right.
 *
 * The headline, the sections and the CTA are LIVE TEXT, never baked into the
 * image: they are what a search engine and a screen reader read, and they have
 * to follow the language toggle. The photograph carries no words of its own
 * beyond the wordmark already in the shot.
 *
 * On lg and up the image is sticky beside the copy. Below lg the order is
 * headline, subheading, intro, THEN the image, then the sections — the reader
 * gets the point of the page before a 1400px photograph, and the sections stay
 * together underneath rather than being split by it.
 *
 * Section 4 is layaway and renders only where layaway is offered (English
 * only, owner decision 2026-09-15). The rule is lib/layaway-availability, not
 * a language check written here.
 */
export default async function WhyChaJewels() {
  const lang = await getLang();
  const t = tr(lang);
  const layaway = layawayOffered(lang);

  const sections = [
    { key: "s1", h: t("why", "s1h"), p: t("why", "s1p") },
    { key: "s2", h: t("why", "s2h"), p: t("why", "s2p") },
    { key: "s3", h: t("why", "s3h"), p: t("why", "s3p") },
    ...(layaway ? [{ key: "s4", h: t("why", "s4h"), p: t("why", "s4p") }] : []),
    { key: "s5", h: t("why", "s5h"), p: t("why", "s5p") },
  ];

  const image = (
    <Image
      src="/images/company/why-cha-jewels.webp"
      alt={t("why", "imageAlt")}
      width={1400}
      height={933}
      // The page's largest element on both layouts, so it is not lazy.
      priority
      sizes="(min-width: 1024px) 45vw, 100vw"
      className="aspect-[3/2] w-full rounded-sm border border-hairline object-cover"
    />
  );

  return (
    <section className="bg-chalk py-[clamp(48px,7vw,96px)] text-charcoal">
      <div className="wrap grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-14">
        <div className="max-w-xl">
          <NavHeading text={t("why", "h1")} lang={lang} className="text-[clamp(32px,5vw,64px)] leading-[1.12] text-charcoal-deep" />
          <p className="mt-4 font-display text-[clamp(18px,2.2vw,24px)] text-gold-dark">{t("why", "sub")}</p>
          <p className="mt-6 text-[17px] leading-relaxed text-charcoal-deep">{t("why", "intro")}</p>

          {/* Below lg the photograph sits here, after the intro and before the
              sections; from lg it is the sticky column instead. */}
          <div className="mt-8 lg:hidden">{image}</div>

          <div className="mt-10 space-y-8">
            {sections.map((s) => (
              <div key={s.key}>
                <SplitHeading text={s.h} lang={lang} className="font-display text-[clamp(22px,2.6vw,30px)] text-charcoal-deep" />
                <p className="mt-2 text-[17px] leading-relaxed text-charcoal/80">{s.p}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 font-display text-[clamp(20px,2.4vw,28px)] text-charcoal-deep">{t("why", "close")}</p>
          <div className="mt-6">
            <Button asChild><Link href="/collections">{t("why", "cta")}</Link></Button>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-[92px]">{image}</div>
        </div>
      </div>
    </section>
  );
}
