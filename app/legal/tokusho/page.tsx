import { pageMeta } from "@/lib/page-meta";
import { getLang } from "@/lib/i18n-server";
import { tokusho, tokushoRowsFor, tokushoUpdated } from "@/lib/content/legal";
import { layawayOffered } from "@/lib/layaway-availability";
import { hub } from "@/lib/hub-api";
import { LegalFrame } from "@/components/site/legal-frame";

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

  const layaway = layawayOffered(lang);
  // The payment rows name only what the checkout can take right now (Stripe
  // review 2026-10-09): the same switches as the footer marks.
  const offered = await hub.paymentsOffered();
  return (
    <LegalFrame lang={lang} page="tokusho" title={tokusho.title[lang]} updated={tokushoUpdated[lang]} toc={[]}>
      {/* Build step 7: a hairline ledger, the item in gold-dark beside its
          detail. On EN the ※ layaway row is tinted so it reads as a footnote;
          on JA it is not there at all (owner decision 2026-09-25). */}
      <dl className="border-t border-hairline text-[16px] leading-[1.8] [:lang(ja)_&]:text-[15.5px] [:lang(ja)_&]:leading-[1.95]">
        {tokushoRowsFor(layaway, offered).map(({ k, v, layaway: note }) => (
          // Keyed on the Japanese label because it is stable — the key must
          // not change when the toggle does.
          <div key={k.ja} className={`grid gap-1 border-b border-hairline py-[18px] sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-6 lg:grid-cols-[300px_minmax(0,1fr)] ${note ? "-mx-4 bg-white px-4" : ""}`}>
            <dt className="pt-[3px] text-[12px] font-semibold uppercase leading-[1.6] tracking-[0.1em] text-gold-dark [:lang(ja)_&]:text-[13.5px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{k[lang]}</dt>
            <dd className="min-w-0 break-words text-charcoal-deep">{v[lang]}</dd>
          </div>
        ))}
      </dl>
    </LegalFrame>
  );
}
