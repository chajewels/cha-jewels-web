import Link from "next/link";
import { localePath } from "@/lib/locale";
import { pageMeta } from "@/lib/page-meta";
import { dict, tr } from "@/lib/i18n";
import { type Lang } from "@/lib/i18n-core";
import { getLang } from "@/lib/i18n-server";
import { Breadcrumbs } from "@/components/site/breadcrumbs";
import { layawayOffered } from "@/lib/layaway-availability";
import { ALL_ON, tokushoRowsFor } from "@/lib/content/legal";
import { guideBlocksFor, shoppingGuide, shoppingGuideIntro, type GuideBlock, type GuideRun } from "@/lib/content/shopping-guide";
import { Button } from "@/components/ui/button";
import { PageHead, PageSection } from "@/components/lumiere/page/page-head";
import { ResolveNumber } from "@/components/lumiere/common/resolve-number";

export const generateMetadata = () => pageMeta("shoppingGuide");

/**
 * THE SHOPPING GUIDE (owner plan 2026-10-27, step 6). Nine sections with
 * anchors, every word from lib/content/shopping-guide.ts. The Payment section
 * renders the legal-notice (tokusho) rows themselves (tokushoRowsFor with ALL_ON, exactly
 * as /legal/tokusho does), so the two pages say the same thing. Layaway blocks
 * are English-only (layawayOffered).
 */
export default async function ShoppingGuidePage() {
  const lang = await getLang();
  const layaway = layawayOffered(lang);
  const rows = tokushoRowsFor(layaway, ALL_ON);
  const intro = shoppingGuideIntro;

  return (
    <>
      {/* Home › Shopping guide (Phase 4): the page's <title>, from the same
          dict.meta entry pageMeta reads — visible crumb and BreadcrumbList
          from one array, above the heading. */}
      <div className="wrap ic-crumbs">
        <Breadcrumbs lang={lang} label={tr(lang)("pdp", "breadcrumb")} className="py-3 text-xs text-charcoal/70 sm:text-[13px]" items={[{ name: tr(lang)("nav", "home"), path: "/" }, { name: dict.meta.shoppingGuide.title[lang], path: "/shopping-guide" }]} />
      </div>
      <PageHead tone="ink" eyebrow={intro.eyebrow[lang]} title={intro.h1[lang]} lead={intro.lede[lang]}>
        <nav aria-labelledby="sg-contents">
          <p id="sg-contents" className="ic-contents__label">{intro.contents[lang]}</p>
          <ol className="ic-contents">
            {shoppingGuide.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>
                  <span className="ic-contents__n">{String(i + 1).padStart(2, "0")}</span>
                  <span>{s.title[lang]}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </PageHead>

      {shoppingGuide.map((s, i) => (
        <PageSection key={s.id} id={s.id} tone={i % 2 === 0 ? "bone" : "white"} className="ic-chapter">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="ic-chapter__no" aria-hidden="true"><ResolveNumber>{String(i + 1).padStart(2, "0")}</ResolveNumber></p>
              <h2 className="lm-h2 mt-3">{s.title[lang]}</h2>
            </div>
            <div className="min-w-0 space-y-5 text-[16px] leading-[1.85] text-charcoal [:lang(ja)_&]:text-[15.5px] [:lang(ja)_&]:leading-[1.95]">
              {guideBlocksFor(s.blocks, layaway).map((b, j) => <Block key={j} block={b} lang={lang} rows={rows} />)}
            </div>
          </div>
        </PageSection>
      ))}

      <PageSection tone="ink">
        <div className="ic-ask">
          <p className="ic-ask__title font-display">{intro.help[lang]}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="ic-btn-light"><Link href={localePath("/contact", lang)}>{intro.contact[lang]}</Link></Button>
            <Button asChild variant="outline" className="ic-btn-line"><Link href={localePath("/faq", lang)}>{intro.faq[lang]}</Link></Button>
          </div>
        </div>
      </PageSection>
    </>
  );
}

function Runs({ runs, lang }: { runs: GuideRun[]; lang: Lang }) {
  return (
    <>
      {runs.map((r, i) => r.href
        ? <Link key={i} href={localePath(r.href, lang)} className="font-medium text-gold-dark underline underline-offset-4">{r.t[lang]}</Link>
        : <span key={i}>{r.t[lang]}</span>)}
    </>
  );
}

function Block({ block, lang, rows }: { block: GuideBlock; lang: Lang; rows: ReturnType<typeof tokushoRowsFor> }) {
  switch (block.kind) {
    case "p": return <p className="max-w-[66ch]">{block.text[lang]}</p>;
    case "note": return <p className="ic-note max-w-[66ch]">{block.text[lang]}</p>;
    case "rich": return <p className="max-w-[66ch]"><Runs runs={block.runs} lang={lang} /></p>;
    case "list":
      return (
        <ul className="max-w-[66ch] space-y-2.5">
          {block.items.map((it, i) => (
            <li key={i} className="relative pl-5">
              <i aria-hidden="true" className="absolute left-0 top-[0.8em] h-1.5 w-1.5 rotate-45 bg-gold-dark" />
              {it[lang]}
            </li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="ic-cells sm:grid-cols-2">
          {block.items.map((st, i) => (
            <li key={i} className="ic-cell">
              <span className="font-display text-xs tracking-[0.2em] text-gold-dark [font-variant-numeric:lining-nums_tabular-nums]">{String(i + 1).padStart(2, "0")}</span>
              <p className="mt-2 font-display text-[19px] leading-snug text-charcoal-deep">{st.h[lang]}</p>
              <p className="mt-2 text-[14.5px] leading-relaxed text-charcoal/85">{st.p[lang]}</p>
            </li>
          ))}
        </ol>
      );
    case "tokusho": {
      const shown = block.keys.map((k) => rows.find((r) => r.k.en === k)).filter((r): r is (typeof rows)[number] => !!r);
      return (
        <dl className="ic-rows">
          {shown.map((r) => (
            <div key={r.k.en} className={`ic-cell grid gap-1 !py-4 sm:grid-cols-[minmax(0,180px)_minmax(0,1fr)] sm:gap-6 ${r.layaway ? "ring-1 ring-charcoal/15" : ""}`}>
              <dt className="text-[13px] font-semibold text-gold-dark">{r.k[lang]}</dt>
              <dd className="text-[15px] leading-[1.8] text-charcoal-deep">{r.v[lang]}</dd>
            </div>
          ))}
        </dl>
      );
    }
  }
}
