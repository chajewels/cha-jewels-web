import Link from "next/link";
import { pageMeta } from "@/lib/page-meta";
import { getLang } from "@/lib/i18n-server";
import { dict, tr } from "@/lib/i18n";
import { tokusho } from "@/lib/content/legal";

export const generateMetadata = () => pageMeta("tokusho");

/**
 * Tokusho (the Specified Commercial Transactions Act disclosure) —
 * JAPANESE IN BOTH LANGUAGES, AND THE PAGE SAYS SO.
 *
 * OWNER DECISION 2026-09-16, flagged in the PR rather than taken silently. The
 * choice was between translating the body on EN and keeping it Japanese with an
 * explicit explanation. This is the second.
 *
 * WHY: the Japanese text is the version the law governs. An English rendering
 * that nobody has had reviewed is not a convenience, it is a second statement
 * of a statutory disclosure that might not match the first — and the mismatch,
 * not the absence, is the thing that would matter. The commercial substance an
 * English reader needs (price, payment, delivery, returns, contact) is already
 * in English on /legal/terms and /legal/privacy, so sending them there is not a
 * dead end.
 *
 * WHAT WAS WRONG BEFORE: the page put a bare English subtitle, "Legal notice
 * (Specified Commercial Transactions Act)", above a wholly Japanese body. That
 * is the worst of both — it reads as a page that meant to be English and
 * failed, and it tells an English reader nothing about why they cannot read it.
 * Now, on EN, the heading is English, a notice states plainly that the body is
 * Japanese and why, and it points at the pages that do serve them.
 *
 * IF CYNTHIA'S COMPLIANCE REVIEWER PREFERS A TRANSLATION, it is additive: give
 * `tokusho.rows` an English column and render it under a clearly-labelled
 * "non-binding translation; the Japanese above governs" heading. Do not replace
 * the Japanese.
 */
export default async function Tokusho() {
  const lang = await getLang();
  const t = tr(lang);
  const ja = lang === "ja";

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[820px]">
        <h1 lang={lang} className="text-[clamp(32px,4vw,56px)]">{tokusho.title[lang]}</h1>

        {/* EN only. On JA the page is already in the reader's language and
            there is nothing to explain. */}
        {!ja && (
          <div className="mt-6 border border-gold px-4 py-4 text-sm">
            <p className="font-display text-base text-gold-pale">{dict.legal.tokushoJaH.en}</p>
            <p className="mt-2 text-champagne/80">{dict.legal.tokushoJaP.en}</p>
            <p className="mt-3 text-champagne/80">
              {dict.legal.tokushoJaSee.en}{" "}
              <Link className="text-gold-pale underline" href="/legal/terms">{t("footer", "sale")}</Link>
              {" · "}
              <Link className="text-gold-pale underline" href="/legal/privacy">{t("footer", "privacy")}</Link>
            </p>
          </div>
        )}

        <dl lang="ja" className="mt-10 divide-y divide-[rgba(201,162,39,.32)] border-y border-rule">
          {tokusho.rows.map(([k, v]) => (
            <div key={k} className="grid gap-2 py-4 sm:grid-cols-[200px_1fr]">
              <dt className="text-champagne/60">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
