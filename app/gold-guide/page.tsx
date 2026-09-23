import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { guideSections } from "@/lib/content/gold-guide";
import { Button } from "@/components/ui/button";
import { GuideStory } from "@/components/fx/guide-story";
import { GuidePlate } from "@/components/editorial/guide-plate";
import { RevealBlock } from "@/components/fx/reveal";
import { NavHeading, SplitHeading } from "@/components/fx/split-text";

export const generateMetadata = () => pageMeta("goldGuide");

/**
 * THE GOLD GUIDE, TOLD AS A SCROLL STORY (components/fx/guide-story.tsx).
 *
 * lg and up: the plate column pins beside the steps; each step is roughly a
 * screen tall, and as it crosses the middle of the screen the pinned plate
 * crossfades to that step's plate (components/editorial/guide-plate.tsx).
 * Below lg: a plain stacked sequence — each step carries its own plate above
 * its text, and the steps rise in as they arrive.
 *
 * The copy is unchanged (lib/content/gold-guide.ts): headings, body and the
 * facts list are all still here as text; the plates only illustrate them.
 */
export default async function GoldGuidePage() {
  const lang = await getLang();
  const t = tr(lang);
  return (
    <>
      <section className="border-b border-hairline py-[clamp(48px,7vw,96px)]">
        <div className="wrap">
          <NavHeading text={t("gold", "h1")} lang={lang} className="max-w-[18ch] text-[clamp(36px,5.5vw,80px)]" />
          <p className="mt-5 max-w-[58ch] text-charcoal">{t("gold", "lede")}</p>
        </div>
      </section>
      <section className="border-b border-hairline py-[clamp(40px,6vw,80px)]">
        <div className="wrap">
          <GuideStory>
            <div aria-hidden="true" className="hidden lg:block">
              <div className="fx-guide-pin">
                {guideSections.map((sec, i) => (
                  <div key={sec.h.en} data-plate={i}><GuidePlate i={i} sec={sec} lang={lang} /></div>
                ))}
              </div>
            </div>
            <div>
              {guideSections.map((sec, i) => (
                <article key={sec.h.en} data-guide-step={i} className="fx-guide-step">
                  <RevealBlock index={0}>
                    <div aria-hidden="true" data-plate={i} className="fx-guide-inline"><GuidePlate i={i} sec={sec} lang={lang} /></div>
                    <p className="font-display text-sm tracking-[0.2em] text-gold-dark">{String(i + 1).padStart(2, "0")} / {String(guideSections.length).padStart(2, "0")}</p>
                    <SplitHeading text={sec.h[lang]} lang={lang} className="mt-2 text-[clamp(28px,3.6vw,48px)]" />
                    <p className="mt-4 max-w-[62ch] text-charcoal">{sec.body[lang]}</p>
                    <dl className="rule-grid mt-8 grid sm:grid-cols-3">
                      {sec.facts.map((f) => (
                        <div key={f.k.en} className="bg-white p-5">
                          <dt className="text-xs text-charcoal/70">{f.k[lang]}</dt>
                          <dd className="mt-1 font-display text-xl text-gold-dark">{f.v[lang]}</dd>
                        </div>
                      ))}
                    </dl>
                  </RevealBlock>
                </article>
              ))}
            </div>
          </GuideStory>
        </div>
      </section>
      <section className="py-[clamp(48px,7vw,96px)] text-center">
        <div className="wrap">
          <Button asChild><Link href="/collections">{t("gold", "cta")}</Link></Button>
        </div>
      </section>
    </>
  );
}
