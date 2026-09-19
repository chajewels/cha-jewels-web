import { pageMeta } from "@/lib/page-meta";
import { getLang } from "@/lib/i18n-server";
import { tokusho } from "@/lib/content/legal";

export const generateMetadata = () => pageMeta("tokusho");

/**
 * Tokusho (the Specified Commercial Transactions Act disclosure) — FOLLOWS THE
 * LANGUAGE TOGGLE, like every other page on the site. EN means English: the
 * title, every row label and every row value.
 *
 * Owner decision 2026-09-16, which overrules two earlier attempts of mine.
 * The page was Japanese in both languages: first under a bare English subtitle,
 * then under an English notice explaining why it was not translated. The notice
 * was never asked for and is gone. DO NOT add a notice, banner, disclaimer or
 * explanatory block back to this page — an English toggle gets an English page,
 * and that is the whole of it.
 *
 * Both columns live in lib/content/legal.ts, which also records what is
 * deliberately identical in the two (proper nouns and identifiers) and what
 * still needs the JP compliance review.
 */
export default async function Tokusho() {
  const lang = await getLang();

  return (
    <section lang={lang} className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[820px]">
        <h1 className="text-[clamp(32px,4vw,56px)]">{tokusho.title[lang]}</h1>
        <dl className="mt-10 divide-y divide-[rgba(201,162,39,.32)] border-y border-rule">
          {tokusho.rows.map(({ k, v }) => (
            // Keyed on the Japanese label because it is stable — the key must
            // not change when the toggle does.
            <div key={k.ja} className="grid gap-2 py-4 sm:grid-cols-[200px_1fr]">
              <dt className="text-chalk/60">{k[lang]}</dt>
              <dd>{v[lang]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
