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
    case "h":
      // A sub-heading INSIDE an article ("Available resolutions", "Step 2:
      // Contact us"). Deliberately smaller and champagne rather than gold: the
      // gold display face marks an article, and a sub-heading competing with it
      // would make a twelve-section document read as twenty-eight.
      return (
        <h3 className="mt-8 font-display text-[clamp(16px,1.6vw,20px)] text-champagne">
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
      return (
        <ul className="mt-4 list-disc space-y-2 pl-5 text-champagne/80 marker:text-gold-pale">
          {block.items[lang].map((item) => (
            <li key={item}>{item}</li>
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
  intro,
  articles,
}: {
  lang: Lang;
  title: Record<Lang, string>;
  updated: Record<Lang, string>;
  /** Blocks shown above the first article — a scope note, an identifying line. */
  intro?: LegalBlock[];
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

        {intro ? (
          <div className="mt-8">
            {intro.map((block, i) => (
              <Block key={i} block={block} lang={lang} />
            ))}
          </div>
        ) : null}

        <div className="mt-12">
          {articles.map((a, ai) => (
            // Index, not a.n: an article may legitimately have no number (a
            // summary block ahead of section 1), and `key={undefined}` is a
            // silent duplicate-key bug rather than a visible one.
            <article key={ai} className="border-t border-rule py-6">
              <h2 className="font-display text-[clamp(20px,2.4vw,28px)] text-gold-pale">
                {a.n === undefined ? a.h[lang] : `${a.n}. ${a.h[lang]}`}
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
