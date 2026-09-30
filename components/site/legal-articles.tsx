import Link from "next/link";
import type { Lang } from "@/lib/i18n";
import type { LegalArticle, LegalBlock } from "@/lib/content/legal";

/**
 * A numbered legal document, rendered wholly in the selected language. Since
 * build step 7 the title band, tabs, contents and business details are
 * LegalFrame's (components/site/legal-frame.tsx); this file is the text.
 *
 * The renderer for all three of them now: privacy, returns and the terms of
 * service. It takes numbered articles whose bodies mix paragraphs, sub-headings,
 * sub-lists, line-break-significant blocks (an address) and prose carrying a
 * link. The former LegalDoc -- a flat heading + lines shape -- was deleted with
 * the seven-section terms summary that was its only caller. Same visual
 * language throughout on purpose --
 * the gold hairline between articles, the display-face heading in gold-pale,
 * the 72ch measure -- so the two pages read as one set.
 *
 * ONE LANGUAGE, THE SELECTED ONE. No second-language column, and no notice,
 * banner or disclaimer block of any kind. Both were asked for explicitly.
 */
/**
 * Exported so the FAQ renders its answers through the SAME code path. That is
 * what guarantees a bullet on /faq is the identical native list-disc marker as
 * a bullet on /legal/privacy, rather than a second implementation that can
 * drift back into generated content.
 */
export function Block({ block, lang }: { block: LegalBlock; lang: Lang }) {
  switch (block.kind) {
    case "p":
      return <p className="mt-4 text-charcoal">{block.text[lang]}</p>;
    case "h":
      // A sub-heading INSIDE an article ("Available resolutions", "Step 2:
      // Contact us"). Deliberately smaller and champagne rather than gold: the
      // gold display face marks an article, and a sub-heading competing with it
      // would make a twelve-section document read as twenty-eight.
      return (
        <h3 className="mt-8 font-display text-[clamp(17px,1.6vw,20px)] leading-snug text-charcoal-deep">
          {block.text[lang]}
        </h3>
      );
    case "list":
      // NATIVE MARKERS, NOT GENERATED CONTENT (fixed 2026-09-16).
      //
      // This rendered a literal "\2022" over the first characters of every
      // bullet. The marker was a Tailwind arbitrary value whose backslash had
      // been doubled, so Tailwind emitted `content:"\\2022"` and CSS read the
      // pair as an escaped literal backslash -- the browser printed the five
      // characters instead of resolving the escape to a bullet.
      //
      // list-disc + marker: cannot fail that way: there is no string to escape.
      // Tailwind Preflight sets `list-style: none` on every ul, which is why a
      // marker has to be asked for explicitly here and in legal-doc.tsx.
      //
      // Build step 7: the marker is a small gold diamond (DESIGN's one
      // ornament), drawn as an empty span rather than generated `content`, so
      // there is still no string to escape. The FAQ shares it through Block.
      return (
        <ul className="mt-3.5 space-y-2 text-charcoal">
          {block.items[lang].map((item) => (
            <li key={item} className="relative pl-[22px]">
              <span aria-hidden="true" className="absolute left-1 top-[0.72em] h-1.5 w-1.5 rotate-45 bg-gold" />
              {item}
            </li>
          ))}
        </ul>
      );
    case "rich":
      // A paragraph carrying a link. The runs are per language because the
      // linked phrase does not sit in the same place in both sentences.
      // Index is a safe key: a block's runs are a fixed, ordered list.
      return (
        <p className="mt-4 text-charcoal">
          {block.runs[lang].map((run, i) =>
            run.href ? (
              <Link
                key={i}
                href={run.href}
                className="underline decoration-gold-dark/50 underline-offset-4 hover:text-gold-dark"
              >
                {run.t}
              </Link>
            ) : (
              <span key={i}>{run.t}</span>
            ),
          )}
        </p>
      );
    case "lines":
      // Line breaks carry meaning here (a postal address), so each line is its
      // own row rather than wrapped prose.
      return (
        <div className="mt-4 border-l-2 border-gold-dark bg-white px-5 py-4 text-charcoal-deep">
          {block.lines[lang].map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      );
  }
}

/** The id a section's heading carries, for the contents list. */
export const sectionId = (i: number) => `s${i + 1}`;

/** The contents list: each heading's own text, as it read before step 7 ("1. …"). */
export function legalToc(articles: LegalArticle[], lang: Lang) {
  return articles.map((a, i) => ({ id: sectionId(i), label: a.n === undefined ? a.h[lang] : `${a.n}. ${a.h[lang]}` }));
}

/**
 * The document itself, inside LegalFrame (build step 7). Styling only.
 *
 * - Body text 16px/1.8 on EN, 15.5px/1.95 on JA, in a 70ch column.
 * - A numbered heading shows its number as a gold-dark Playfair "01" (D7-2):
 *   display only, the data keeps `n`, and the contents list still reads "1.".
 * - An unnumbered article ahead of §1 (the returns policy's Important
 *   Summary) is the part customers need, so it is a dark ledger box.
 */
export function LegalArticles({
  lang,
  intro,
  articles,
}: {
  lang: Lang;
  /** Blocks shown above the first article — a scope note, an identifying line. */
  intro?: LegalBlock[];
  articles: LegalArticle[];
}) {
  return (
    <div className="max-w-[70ch] text-[16px] leading-[1.8] [:lang(ja)_&]:text-[15.5px] [:lang(ja)_&]:leading-[1.95]">
      {intro ? (
        <div className="mb-12 [&>:first-child]:mt-0">
          {intro.map((block, i) => (
            <Block key={i} block={block} lang={lang} />
          ))}
        </div>
      ) : null}

      {articles.map((a, ai) =>
        // Index, not a.n: an article may legitimately have no number (a
        // summary block ahead of section 1), and `key={undefined}` is a
        // silent duplicate-key bug rather than a visible one.
        a.n === undefined ? (
          <article key={ai} className="band-dark mb-2 bg-charcoal-deep px-[clamp(18px,4vw,28px)] pb-6 pt-7 text-chalk max-sm:-mx-[clamp(18px,4vw,48px)] [&_a]:text-gold-pale [&_li]:text-chalk/90 [&_p]:text-chalk/90 [&_ul]:text-chalk/90 [&_h3]:text-gold-pale print:bg-white print:text-charcoal-deep print:[&_p]:text-charcoal print:[&_li]:text-charcoal">
            <h2 id={sectionId(ai)} className="scroll-mt-24 text-[22px] leading-snug text-gold-pale print:text-charcoal-deep [:lang(ja)_&]:text-[20px] [:lang(ja)_&]:leading-[1.5]">
              {a.h[lang]}
            </h2>
            {a.blocks.map((block, i) => (
              <Block key={i} block={block} lang={lang} />
            ))}
          </article>
        ) : (
          <article key={ai} className="mt-14 border-t border-hairline pt-[22px] first:mt-0">
            <h2
              id={sectionId(ai)}
              className="flex scroll-mt-24 items-baseline gap-3.5 text-[22px] leading-[1.25] text-charcoal-deep sm:text-[26px] [:lang(ja)_&]:text-[20px] [:lang(ja)_&]:leading-[1.5] [:lang(ja)_&]:[word-break:auto-phrase] sm:[:lang(ja)_&]:text-[22px]"
            >
              <span className="min-w-[1.4em] flex-none font-display text-[24px] font-normal leading-none text-gold-dark [font-variant-numeric:lining-nums_tabular-nums] sm:text-[30px]">
                {String(a.n).padStart(2, "0")}
              </span>
              <span className="min-w-0">{a.h[lang]}</span>
            </h2>
            {a.blocks.map((block, i) => (
              // Index is a safe key: the blocks of one article are a fixed,
              // ordered list that never reorders or filters.
              <Block key={i} block={block} lang={lang} />
            ))}
          </article>
        ),
      )}
    </div>
  );
}
