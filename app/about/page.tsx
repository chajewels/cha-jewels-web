import { pageMeta } from "@/lib/page-meta";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { aboutCopy } from "@/lib/content/about";
import { catalogue } from "@/lib/catalog-context";
import { Eyebrow } from "@/components/site/support-stage";
import { DarkBand, H_DISPLAY, H_HEAD, H_TITLE, LEDE, LEDE_DARK, Label, Proof, ProofCells, SEC, SEC_S, StageBand, specExample } from "@/components/site/brand-ui";

export const generateMetadata = () => pageMeta("about");

/**
 * ABOUT (build step 5; comp page-comps/brand-programmes "about").
 *
 *  1. The dark stage: the eyebrow, the title and the founding story. The AI
 *     logo coin is gone (audit About #1).
 *  2. The two customer questions set as display type, the answer under them,
 *     and the body copy beside them (with the approved origin clarifier).
 *  3. The timeline ledger on a dark band, every date real.
 *  4. What every listing states: the six details as cells, and a real piece's
 *     Hub data as the example.
 *  5. Mission and vision on a dark band.
 *  6. The products and services ledger, the closing line, the collections
 *     button and the affiliations link.
 *
 * PHOTOS (owner decision D5-6). The owner's photographs are not in the repo
 * yet, so the page ships WITHOUT photo slots and the timeline carries it.
 * Where they go when they exist — see the two OWNER-PHOTOS hooks below: the
 * hero's right column (the founder, or a live-selling still) and a row of
 * three under the services list (the showroom, hands at a hallmark check, a
 * live-selling session). Real photos only; no stock imagery.
 *
 * All copy is lib/content/about.ts, word for word the live page's.
 */
export default async function About() {
  const lang = await getLang();
  const t = tr(lang);
  const c = aboutCopy[lang];
  const example = specExample(await catalogue(), lang);

  return (
    <>
      <StageBand>
        <div className={`wrap ${SEC}`}>
          {/* OWNER-PHOTOS hook 1: with a photo, this becomes two columns
              (lg:grid-cols-[1.1fr_.9fr]) and the photo stands on the right. */}
          <div className="max-w-[760px]">
            <Eyebrow dark rule>{t("home", "heroSince")}</Eyebrow>
            <h1 className={`mt-[18px] text-gold-pale ${H_DISPLAY}`}>{c.h1}</h1>
            <p className={`mt-[18px] ${LEDE_DARK}`}>{c.intro}</p>
          </div>
        </div>
      </StageBand>

      <section className={`wrap ${SEC} grid items-start gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-16`}>
        <div>
          <p className="mb-[18px] text-charcoal/75">{c.questionsLead}</p>
          <ul className="grid gap-2.5">
            {c.questions.map((q, i) => (
              <li key={q} className={`font-display text-[clamp(28px,3.6vw,48px)] leading-[1.2] [:lang(ja)_&]:text-[clamp(24px,3vw,40px)] [:lang(ja)_&]:leading-[1.45] [:lang(ja)_&]:[word-break:auto-phrase] ${i === 0 ? "text-charcoal-deep" : "text-gold-dark"}`}>{q}</li>
            ))}
          </ul>
          <p className={`mt-[18px] ${LEDE}`}>{c.body[0]}</p>
        </div>
        <div className="max-w-[68ch] space-y-[1.1em] pt-1.5 text-base leading-[1.85] text-charcoal-deep [:lang(ja)_&]:text-[15.5px] [:lang(ja)_&]:leading-[2]">
          <p>{c.body[1]}</p>
          <p>{c.originNote}</p>
          <p>{c.body[3]}</p>
        </div>
      </section>

      <DarkBand>
        <div className={`wrap ${SEC_S}`}>
          <h2><Label dark>{c.recordLabel}</Label></h2>
          <ol className="mt-[18px] grid grid-cols-2 border-t border-rule lg:grid-cols-4">
            {c.timeline.map((e, i) => (
              <li key={e.year} className={`border-rule py-4 pr-3 lg:py-[22px] lg:pr-[22px] ${i % 2 === 1 ? "pl-3 lg:pl-[22px]" : ""} ${i === 2 ? "lg:pl-[22px]" : ""} ${i < 2 ? "border-b lg:border-b-0" : ""} ${i % 2 === 0 ? "border-r" : "lg:border-r"} lg:last:border-r-0`}>
                <p className="font-display text-[28px] leading-none text-gold-pale lining-nums lg:text-[34px]">{e.year}</p>
                <p className="mt-2.5 text-sm leading-relaxed text-chalk/80">{e.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </DarkBand>

      <section className={`wrap ${SEC} grid items-start gap-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-16`}>
        <div>
          <h2><Label>{c.listingLabel}</Label></h2>
          <p className={`mt-[18px] !text-base ${LEDE}`}>{c.body[2]}</p>
        </div>
        <div>
          <ul className="grid grid-cols-2 border-l border-t border-hairline sm:grid-cols-3">
            {c.listingCells.map((cell) => (
              <li key={cell} className="flex min-h-[64px] items-center gap-2.5 border-b border-r border-hairline bg-white px-4 py-4 text-[15px] font-medium text-charcoal-deep before:h-1.5 before:w-1.5 before:flex-none before:rotate-45 before:border before:border-gold-dark">{cell}</li>
            ))}
          </ul>
          {example && (
            <Proof className="mt-4" label={<Link href={`/products/${example.slug}`} className="underline decoration-gold-dark/50 underline-offset-4 hover:decoration-gold-dark">{c.example.replace("{name}", example.sku)}</Link>}>
              <ProofCells cells={[
                { v: example.metal, k: t("product", "metal") },
                { v: example.weight, k: t("product", "weight") },
                ...(example.stone ? [{ v: example.stone, k: t("product", "stone") }] : []),
              ]} />
            </Proof>
          )}
        </div>
      </section>

      <DarkBand>
        <div className={`wrap ${SEC} grid items-start gap-10 lg:grid-cols-2 lg:gap-16`}>
          {c.sections.map((s) => (
            <div key={s.heading}>
              <h2 className={`text-gold-pale ${H_HEAD}`}>{s.heading}</h2>
              <p className={`mt-[18px] ${LEDE_DARK}`}>{s.body}</p>
            </div>
          ))}
        </div>
      </DarkBand>

      <section className={`wrap ${SEC}`}>
        <h2 className={`text-charcoal-deep ${H_HEAD}`}>{c.listHeading}</h2>
        <ul className="mt-6 gap-x-10 sm:columns-2 lg:columns-3">
          {c.list.map((item) => (
            <li key={item} className="flex break-inside-avoid items-baseline gap-2.5 border-b border-hairline py-3 text-[15px] text-charcoal-deep before:h-1.5 before:w-1.5 before:flex-none before:-translate-y-0.5 before:rotate-45 before:border before:border-gold-dark">{item}</li>
          ))}
        </ul>
        {/* OWNER-PHOTOS hook 2: three real photos go here when they exist —
            the showroom or office, hands at a hallmark check, a live-selling
            session (grid, 1 column on a phone, 3 from sm). */}
        <p className="mt-12 max-w-[68ch] text-[17px] leading-relaxed text-charcoal-deep">{c.closing[0]}</p>
        <p className={`mt-4 font-display text-gold-dark ${H_TITLE}`}>{c.closing[1]}</p>
        <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/collections" className="btn-press inline-flex min-h-12 items-center justify-center gap-2 rounded-sm border border-gold-dark px-6 py-3 text-[15px] font-medium text-gold-dark hover:border-charcoal-deep hover:text-charcoal-deep">
            {c.cta} <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
          </Link>
          <Link href="/affiliations" className="inline-flex min-h-11 items-center text-[15px] text-gold-dark underline decoration-gold-dark/50 underline-offset-4 hover:decoration-gold-dark">{t("contact", "affiliationsFromAbout")}</Link>
        </div>
      </section>
    </>
  );
}
