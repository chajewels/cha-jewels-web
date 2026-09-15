import type { Lang } from "@/lib/i18n";
import type { LegalArticle, LegalBlock } from "@/lib/content/legal";

/**
 * A numbered legal document, rendered wholly in the selected language.
 *
 * Sibling of LegalDoc, not a replacement for it. LegalDoc takes a flat list of
 * heading + lines and is what /legal/terms needs; this takes numbered articles
 * whose bodies mix paragraphs, sub-lists and line-break-significant blocks,
 * which is what the privacy policy needs. Same visual language on purpose --
 * the gold hairline between articles, the display-face heading in gold-pale,
 * the 72ch measure -- so the two pages read as one set.
 *
 * ONE LANGUAGE, THE SELECTED ONE. No second-language column, and no notice,
 * banner or disclaimer block of any kind. Both were asked for explicitly.
 */
function Block({ block, lang }: { block: LegalBlock; lang: Lang }) {
  switch (block.kind) {
    case "p":
      return <p className="mt-4 text-champagne/80">{block.text[lang]}</p>;
    case "list":
      return (
        <ul className="mt-4 space-y-2 text-champagne/80">
          {block.items[lang].map((item) => (
            // The gold marker is the same hairline accent used elsewhere; the
            // list is a real <ul> so it is announced as one.
            <li key={item} className="relative pl-5 before:absolute before:left-0 before:text-gold-pale before:content-['\\2022']">
              {item}
            </li>
          ))}
        </ul>
      );
    case "lines":
      // Line breaks carry meaning here (a postal address), so each line is its
      // own row rather than wrapped prose.
      return (
        <div className="mt-4 text-champagne/80">
          {block.lines[lang].map((line) => (
            <div key={line}>{line}</div>
          ))}
        </div>
      );
  }
}

export function LegalArticles({
  lang,
  title,
  updated,
  articles,
}: {
  lang: Lang;
  title: Record<Lang, string>;
  updated: Record<Lang, string>;
  articles: LegalArticle[];
}) {
  return (
    <section lang={lang} className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[72ch]">
        <h1 className="text-[clamp(32px,4.6vw,64px)]">{title[lang]}</h1>
        {/* The document carries its own last-updated line, so the shared draft
            banner is not rendered here -- it states an older date and the two
            together would contradict each other on a legal page. */}
        <p className="mt-4 text-sm text-champagne/60">{updated[lang]}</p>

        <div className="mt-12">
          {articles.map((a) => (
            <article key={a.n} className="border-t border-rule py-6">
              <h2 className="font-display text-[clamp(20px,2.4vw,28px)] text-gold-pale">
                {a.n}. {a.h[lang]}
              </h2>
              {a.blocks.map((block, i) => (
                // Index is a safe key: the blocks of one article are a fixed,
                // ordered list that never reorders or filters.
                <Block key={i} block={block} lang={lang} />
              ))}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
