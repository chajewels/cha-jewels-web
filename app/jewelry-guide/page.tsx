import Image from "next/image";
import { localePath } from "@/lib/locale";
import Link from "next/link";
import { pageMeta } from "@/lib/page-meta";
import { dict, tr, type Lang } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { metalLabel } from "@/lib/metals";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import {
  GUIDE_SECTIONS, RING_SIZES, careStep, clasps, diamond4c, guideIntro, metalSteps, metals, necklaceLength, ringSize, sizeNotes,
  type GuideSectionId, type GuideStep,
} from "@/lib/content/jewelry-guide";
import { Button } from "@/components/ui/button";
import { GuideStory } from "@/components/fx/guide-story";
import { GuidePlate } from "@/components/editorial/guide-plate";
import { CaratScale, ClarityScale, ColorScale, CutScale } from "@/components/editorial/jewelry-guide-art";
import { NecklaceSizer } from "@/components/editorial/necklace-sizer";
import { RingSizer } from "@/components/editorial/ring-sizer";
import { RingSizeProvider, RingSizeRows } from "@/components/editorial/ring-size-context";
import { RevealBlock } from "@/components/fx/reveal";
import { NavHeading, SplitHeading } from "@/components/fx/split-text";

export const generateMetadata = () => pageMeta("jewelryGuide");

/**
 * THE JEWELRY GUIDE (owner decisions 2026-10-27). Seven sections, each with
 * an anchor the contents list and other pages link to (/jewelry-guide#metals
 * is where /gold-guide now redirects, next.config.ts). Light chalk page like
 * every inner page; the Gold Guide's dark plates and its scroll story live on
 * inside Metals and Care, where its copy was merged.
 *
 * Every word comes from lib/content/jewelry-guide.ts. Ring size and necklace
 * length are interactive (components/editorial/ring-sizer.tsx,
 * necklace-sizer.tsx) and move owner-approved AI images; those, and the
 * diamond, carry the same "Illustration" caption as the stamp illustrations.
 * The clasps are the owner's photographs (no caption). The 4C scales are
 * components/editorial/jewelry-guide-art.tsx. All images are in
 * public/images/jewelry-guide/. Tables never push the page sideways: the ring table
 * sits in its own scroll box, and the stamp list stacks.
 */
export default async function JewelryGuidePage() {
  const lang = await getLang();
  const t = tr(lang);
  const eyebrow = `text-[11px] font-semibold text-gold-dark ${lang === "en" ? "uppercase tracking-[0.14em]" : "tracking-[0.05em]"}`;
  return (
    <>
      <section className="border-b border-hairline pb-[clamp(48px,7vw,96px)]">
        <div className="wrap">
          {/* Home › Jewelry guide (Phase 4): the page's <title>, from the same
              dict.meta entry pageMeta reads — visible crumb and BreadcrumbList
              from one array, above the heading. */}
          <Breadcrumbs lang={lang} label={t("pdp", "breadcrumb")} className="py-3.5 text-xs text-charcoal/70 sm:pt-[22px] sm:text-[13px]" items={[{ name: t("nav", "home"), path: "/" }, { name: dict.meta.jewelryGuide.title[lang], path: "/jewelry-guide" }]} />
          <p className={`${eyebrow} pt-[clamp(24px,4vw,56px)]`}>{guideIntro.eyebrow[lang]}</p>
          <NavHeading text={guideIntro.h1[lang]} lang={lang} className="mt-3 max-w-[18ch] text-[clamp(36px,5.5vw,80px)]" />
          <p className="mt-5 max-w-[58ch] text-charcoal">{guideIntro.lede[lang]}</p>
          <nav aria-labelledby="jg-contents" className="mt-10">
            <p id="jg-contents" className={eyebrow}>{guideIntro.contents[lang]}</p>
            <ol className="rule-grid mt-4 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
              {GUIDE_SECTIONS.map((s, i) => (
                <li key={s.id} className="bg-white">
                  <a href={`#${s.id}`} className="flex min-h-[64px] h-full flex-col justify-between gap-2 p-4 text-sm font-medium text-charcoal-deep hover:text-gold-dark">
                    <span className="font-display text-xs tracking-[0.2em] text-gold-dark [font-variant-numeric:lining-nums_tabular-nums]">{String(i + 1).padStart(2, "0")}</span>
                    {s.title[lang]}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </section>

      {/* 1. RING SIZE */}
      <GuideSection id="ring-size" lang={lang}>
        <RingSizeProvider initial={RING_SIZES.findIndex(([n]) => n === 13)}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
          <div className="min-w-0">
            <p className="max-w-[62ch] text-charcoal">{ringSize.intro[lang]}</p>
            <p className="mt-4 max-w-[62ch] border-l-2 border-gold-dark pl-4 text-charcoal-deep">{ringSize.guideOnly[lang]}</p>
            <div className="mt-8">
              <RingSizer
                sizes={RING_SIZES} caption={t("gold", "illustration")}
                copy={Object.fromEntries(Object.entries(ringSize.sizer).map(([k, v]) => [k, v[lang]])) as Record<keyof typeof ringSize.sizer, string>}
              />
            </div>
            <h3 className="mt-10 font-display text-[clamp(20px,2.4vw,28px)]">{ringSize.measureH[lang]}</h3>
            <div className="rule-grid mt-4 grid">
              {ringSize.measure.map((m) => (
                <div key={m.h.en} className="bg-white p-5">
                  <h4 className="text-[15px] font-semibold text-charcoal-deep">{m.h[lang]}</h4>
                  <p className="mt-2 text-[15px] text-charcoal">{m.body[lang]}</p>
                </div>
              ))}
            </div>
            <h3 className="mt-10 font-display text-[clamp(20px,2.4vw,28px)]">{ringSize.tipsH[lang]}</h3>
            <ul className="mt-4 grid gap-3">
              {ringSize.tips.map((tip) => (
                <li key={tip.en} className="flex gap-3 text-[15px] text-charcoal"><span aria-hidden="true" className="mt-[0.6em] h-px w-4 shrink-0 bg-gold-dark" />{tip[lang]}</li>
              ))}
            </ul>
          </div>
          <div className="min-w-0">
            <div data-ring-table data-lenis-prevent className="max-h-[min(80vh,760px)] overflow-auto border border-hairline bg-white" tabIndex={0} role="region" aria-labelledby="jg-ring-caption">
              <table className="w-full border-collapse text-[15px] [font-variant-numeric:lining-nums_tabular-nums]">
                <caption id="jg-ring-caption" className="border-b border-hairline px-4 py-3 text-left text-sm font-semibold text-charcoal-deep">{ringSize.caption[lang]}</caption>
                <thead className="sticky top-0 bg-chalk text-left text-xs text-charcoal/80">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-semibold">{ringSize.colSize[lang]}</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">{ringSize.colDiameter[lang]} ({ringSize.unit[lang]})</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-semibold">{ringSize.colCircumference[lang]} ({ringSize.unit[lang]})</th>
                  </tr>
                </thead>
                <RingSizeRows sizes={RING_SIZES} />
              </table>
            </div>
            <p className="mt-3 text-sm text-charcoal/80">{ringSize.scale[lang]}</p>
          </div>
        </div>
        </RingSizeProvider>
      </GuideSection>

      {/* 2. NECKLACE LENGTH */}
      <GuideSection id="necklace-length" lang={lang}>
        <p className="max-w-[62ch] text-charcoal">{necklaceLength.intro[lang]}</p>
        <div className="mt-8">
          <NecklaceSizer
            caption={t("gold", "illustration")}
            lengths={necklaceLength.lengths.map((l) => ({ key: l.key, name: l.name[lang], cm: l.cm[lang], where: l.where[lang] }))}
            copy={{
              slider: necklaceLength.sizer.slider[lang], valueText: necklaceLength.sizer.valueText[lang], alt: necklaceLength.sizer.alt[lang],
              shorter: necklaceLength.sizer.shorter[lang], longer: necklaceLength.sizer.longer[lang], note: necklaceLength.sizer.note[lang],
              rangeNote: necklaceLength.note[lang], tip: necklaceLength.tip[lang],
            }}
          />
        </div>
      </GuideSection>

      {/* 3. SIZE NOTES */}
      <GuideSection id="size-notes" lang={lang}>
        <p className="max-w-[62ch] text-charcoal">{sizeNotes.intro[lang]}</p>
        <div className="rule-grid mt-8 grid sm:grid-cols-2 lg:grid-cols-3">
          {sizeNotes.items.map((it) => (
            <div key={it.key} className="bg-white p-5">
              <h3 className="font-display text-xl text-charcoal-deep">{it.name[lang]}</h3>
              <p className="mt-2 text-[15px] text-charcoal">{it.body[lang]}</p>
            </div>
          ))}
        </div>
      </GuideSection>

      {/* 4. CLASPS */}
      <GuideSection id="clasps" lang={lang}>
        <p className="max-w-[62ch] text-charcoal">{clasps.intro[lang]}</p>
        <div className="rule-grid mt-8 grid sm:grid-cols-2 lg:grid-cols-5 [&>*:last-child]:sm:col-span-2 [&>*:last-child]:lg:col-span-1">
          {clasps.items.map((c) => (
            <div key={c.key} className="flex flex-col bg-white p-5">
              <div className="mx-auto w-full max-w-[220px] bg-white">
                <Image src={c.img.src} alt={c.img.alt[lang]} width={800} height={800} sizes="220px" className="aspect-square h-auto w-full object-contain" />
              </div>
              <h3 className="mt-4 font-display text-xl text-charcoal-deep">{c.name[lang]}</h3>
              <p className="mt-2 text-[15px] text-charcoal">{c.how[lang]}</p>
            </div>
          ))}
        </div>
      </GuideSection>

      {/* 5. METALS — the Gold Guide's two steps, as its scroll story, then every stamp. */}
      <GuideSection id="metals" lang={lang}>
        <p className="max-w-[62ch] text-charcoal">{metals.intro[lang]}</p>
        <div className="mt-10">
          <GuideStory>
            <div className="hidden lg:block">
              <div className="fx-guide-pin">
                {/* Plates repeat the facts beside them, so they are hidden
                    from assistive tech — except the stamp plate, whose
                    illustrations carry alt text. */}
                {metalSteps.map((sec, i) => (
                  <div key={sec.h.en} data-plate={i} aria-hidden={i === 1 ? undefined : "true"}><GuidePlate i={i} sec={sec} lang={lang} /></div>
                ))}
              </div>
            </div>
            <div>
              {metalSteps.map((sec, i) => (
                <article key={sec.h.en} data-guide-step={i} className="fx-guide-step">
                  <RevealBlock index={0}>
                    <div aria-hidden={i === 1 ? undefined : "true"} data-plate={i} className="fx-guide-inline"><GuidePlate i={i} sec={sec} lang={lang} /></div>
                    <SplitHeading as="h3" text={sec.h[lang]} lang={lang} className="text-[clamp(24px,3vw,40px)]" />
                    <p className="mt-4 max-w-[62ch] text-charcoal">{sec.body[lang]}</p>
                    <Facts sec={sec} lang={lang} />
                  </RevealBlock>
                </article>
              ))}
            </div>
          </GuideStory>
        </div>
        <h3 className="mt-16 font-display text-[clamp(20px,2.4vw,28px)]">{metals.tableH[lang]}</h3>
        <dl className="mt-4 border-t border-hairline">
          {metals.rows.map((r) => (
            <div key={r.stamp} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-4 border-b border-hairline py-3 sm:grid-cols-[9rem_7rem_minmax(0,1fr)]">
              <dt className="font-display text-lg text-gold-dark [font-variant-numeric:lining-nums_tabular-nums]">{metalLabel(r.stamp, lang)}</dt>
              <dd className="text-sm text-charcoal/80 sm:pt-1">{r.metal[lang]}</dd>
              <dd className="col-span-2 mt-1 text-[15px] text-charcoal sm:col-span-1 sm:mt-0">{r.means[lang]}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 max-w-[62ch] text-sm text-charcoal/80">{metals.note[lang]}</p>
      </GuideSection>

      {/* 6. DIAMOND 4C */}
      <GuideSection id="diamond-4c" lang={lang}>
        <p className="max-w-[62ch] text-charcoal">{diamond4c.intro[lang]}</p>
        <div className="rule-grid mt-8 grid sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(0,1fr)] xl:grid-rows-2">
          <figure className="flex flex-col items-center justify-center bg-white p-6 sm:col-span-2 xl:col-span-1 xl:col-start-2 xl:row-span-2 xl:row-start-1">
            <div className="relative w-full max-w-[440px]">
              <Image src={diamond4c.image.src} alt={diamond4c.image.alt[lang]} width={960} height={800} sizes="(min-width: 1280px) 420px, (min-width: 640px) 480px, 90vw" className="h-auto w-full" />
              <span aria-hidden="true" className="absolute bottom-0 right-0 bg-charcoal-deep/85 px-2 py-0.5 text-[11px] tracking-[0.08em] text-chalk">{t("gold", "illustration")}</span>
            </div>
            <figcaption className="mt-4 grid w-full max-w-[440px] grid-cols-2 border-t border-hairline pt-3 text-center font-display text-base text-gold-dark sm:grid-cols-4">
              {diamond4c.items.map((it) => <span key={it.key} className="py-1">{it.name[lang]}</span>)}
            </figcaption>
          </figure>
          {diamond4c.items.map((it) => (
            <div key={it.key} className={`bg-white p-5 ${FOUR_C_PLACE[it.key]}`}>
              {lang === "ja" && <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark">{it.term}</p>}
              <h3 className="font-display text-xl text-charcoal-deep">{it.name[lang]}</h3>
              <div className="mt-4">
                {it.key === "color" && <ColorScale from={diamond4c.scales.color.from[lang]} to={diamond4c.scales.color.to[lang]} sr={diamond4c.scales.color.sr[lang]} />}
                {it.key === "clarity" && <ClarityScale from={diamond4c.scales.clarity.from[lang]} to={diamond4c.scales.clarity.to[lang]} sr={diamond4c.scales.clarity.sr[lang]} />}
                {it.key === "cut" && <CutScale from={diamond4c.scales.cut.from[lang]} to={diamond4c.scales.cut.to[lang]} sr={diamond4c.scales.cut.sr[lang]} />}
                {it.key === "carat" && <CaratScale unit={diamond4c.scales.carat.unit[lang]} note={diamond4c.scales.carat.note[lang]} sr={diamond4c.scales.carat.sr[lang]} />}
              </div>
              <p className="mt-4 text-[15px] text-charcoal">{it.body[lang]}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-charcoal/80">{diamond4c.note[lang]}</p>
      </GuideSection>

      {/* 7. CARE — the Gold Guide's care step and its plate. */}
      <GuideSection id="care" lang={lang}>
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16">
          <div aria-hidden="true" className="min-h-[min(72vw,340px)] lg:aspect-[4/5] lg:max-h-[520px]"><GuidePlate i={2} sec={careStep} lang={lang} /></div>
          <div className="min-w-0">
            <p className="max-w-[62ch] text-charcoal">{careStep.body[lang]}</p>
            <Facts sec={careStep} lang={lang} />
          </div>
        </div>
      </GuideSection>

      <section className="py-[clamp(48px,7vw,96px)]">
        <div className="wrap grid gap-6 border-t border-charcoal-deep pt-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <p className="font-display text-[clamp(22px,2.6vw,32px)] text-charcoal-deep">{guideIntro.askTitle[lang]}</p>
            <p className="mt-2 max-w-[58ch] text-charcoal">{guideIntro.askBody[lang]}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild><Link href={localePath("/contact", lang)}>{t("navMenu", "contact")}</Link></Button>
            <Button asChild variant="outline"><Link href={localePath("/collections", lang)}>{t("gold", "cta")}</Link></Button>
          </div>
        </div>
      </section>
    </>
  );
}

/** Where each C sits around the stone on wide screens: Cut and Carat left, Clarity and Colour right. */
const FOUR_C_PLACE: Record<(typeof diamond4c.items)[number]["key"], string> = {
  cut: "xl:col-start-1 xl:row-start-1",
  carat: "xl:col-start-1 xl:row-start-2",
  clarity: "xl:col-start-3 xl:row-start-1",
  color: "xl:col-start-3 xl:row-start-2",
};

/** One numbered section with its anchor; `scroll-mt` keeps the heading clear of the sticky header. */
function GuideSection({ id, lang, children }: { id: GuideSectionId; lang: Lang; children: React.ReactNode }) {
  const i = GUIDE_SECTIONS.findIndex((s) => s.id === id);
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-[88px] border-b border-hairline py-[clamp(48px,7vw,96px)]">
      <div className="wrap">
        <p className="font-display text-sm tracking-[0.2em] text-gold-dark [font-variant-numeric:lining-nums_tabular-nums]">{String(i + 1).padStart(2, "0")} / {String(GUIDE_SECTIONS.length).padStart(2, "0")}</p>
        <div id={`${id}-h`}><SplitHeading text={GUIDE_SECTIONS[i].title[lang]} lang={lang} className="mt-2 text-[clamp(28px,3.6vw,48px)]" /></div>
        <div className="mt-6">{children}</div>
      </div>
    </section>
  );
}

/** A step's three facts as hairline ledger cells (the Gold Guide's own pattern). */
function Facts({ sec, lang }: { sec: GuideStep; lang: Lang }) {
  return (
    <dl className="rule-grid mt-8 grid sm:grid-cols-3">
      {sec.facts.map((f) => (
        <div key={f.k.en} className="bg-white p-5">
          <dt className="text-xs text-charcoal/70">{f.k[lang]}</dt>
          <dd className="mt-1 font-display text-xl text-gold-dark">{f.v[lang]}</dd>
        </div>
      ))}
    </dl>
  );
}
