import Link from "next/link";
import { localePath } from "@/lib/locale";
import { ChevronRight } from "lucide-react";
import { tr } from "@/lib/i18n";
import { type Lang } from "@/lib/i18n-core";
import { COMPANY_NAME_DISPLAY, tokusho } from "@/lib/content/legal";
import { LegalToc, LegalTocPhone, PrintLink, type TocItem } from "@/components/site/legal-toc";
import { PageHead } from "@/components/lumiere/page/page-head";

export type LegalPageKey = "terms" | "privacy" | "returns" | "tokusho";

/** The four legal pages, in tab order, labelled with the footer's own names for them. */
const PAGES: { key: LegalPageKey; href: string; label: "sale" | "privacy" | "returns" | "tokusho" }[] = [
  { key: "terms", href: "/legal/terms", label: "sale" },
  { key: "privacy", href: "/legal/privacy", label: "privacy" },
  { key: "returns", href: "/legal/returns", label: "returns" },
  { key: "tokusho", href: "/legal/tokusho", label: "tokusho" },
];

/**
 * Business details beside every policy: the legal notice's own rows, read
 * from `tokusho.rows` (picked by their English label, which is ASCII and so
 * allowed outside lib/content by check:i18n) so the wording is the statutory
 * page's, character for character, in both languages. Nothing is written afresh.
 */
const RAIL_ROWS = ["Seller", "Secondhand dealer permit", "Invoice registration number", "Email", "Telephone"];

/**
 * THE FRAME AROUND THE FOUR LEGAL PAGES (build step 7; comp page-comps/legal).
 * Styling only: every word of the documents is lib/content/legal.ts, unchanged,
 * and the layaway filters (legalArticlesFor / tokushoRowsFor) run in the pages
 * exactly as before.
 *
 * - A short dark title band: eyebrow, gold-pale title, the document's own
 *   "last updated" line and the company name (legal form on JA, combined form
 *   on EN), then the four pages as tabs.
 * - Body: contents on the left (sticky, current section marked) from `lg`, the
 *   text in a 70ch column, business details on the right from `xl`. Phones
 *   get a folding Contents panel and the details after the text.
 * - The end: a person answers questions, then the other three pages.
 * - "Print this page": `.print-legal` below turns the band to paper and drops
 *   the site chrome (app/globals.css).
 */
export function LegalFrame({
  lang,
  page,
  title,
  updated,
  toc,
  children,
}: {
  lang: Lang;
  page: LegalPageKey;
  title: string;
  updated: string;
  /** The sections, for the contents list. Empty on the legal notice, which has none. */
  toc: TocItem[];
  children: React.ReactNode;
}) {
  const t = tr(lang);
  const withSide = page !== "tokusho";
  const rail = tokusho.rows.filter((r) => RAIL_ROWS.includes(r.k.en)).sort((a, b) => RAIL_ROWS.indexOf(a.k.en) - RAIL_ROWS.indexOf(b.k.en));

  return (
    <div lang={lang} className="print-legal">
      <PageHead
        eyebrow={t("footer", "legal")}
        title={title}
      >
        <p className="ic-legal-meta">
          <span className="cj-fig">{updated}</span>
          <span>{COMPANY_NAME_DISPLAY[lang]}</span>
        </p>
        <nav aria-label={t("legalPage", "pages")} className="print:hidden">
          <ul className="ic-legal-tabs">
            {PAGES.map((p) => (
              <li key={p.key}>
                <Link href={localePath(p.href, lang)} aria-current={p.key === page ? "page" : undefined}>
                  {t("footer", p.label)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </PageHead>

      <section className="lm-sec lm-sec--sheet">
      <div
        className={
          withSide
            ? "wrap grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[240px_minmax(0,1fr)_250px] xl:gap-14"
            : "wrap"
        }
      >
        {withSide && toc.length > 0 && (
          <aside className="max-lg:hidden">
            <LegalToc items={toc} label={t("legalPage", "contents")} printLabel={t("legalPage", "print")} />
          </aside>
        )}

        <div className={withSide ? "min-w-0" : "max-w-[1000px]"}>
          {withSide && toc.length > 0 && (
            <div className="lg:hidden"><LegalTocPhone items={toc} label={t("legalPage", "contents")} /></div>
          )}

          {children}

          {!withSide && <div className="mt-6 print:hidden"><PrintLink label={t("legalPage", "print")} /></div>}

          <div className="ic-legal-ask print:hidden">
            <span>{t("legalPage", "questions")}</span>
            <a href="mailto:sales@chajewelsjp.com" className="text-gold-dark underline decoration-gold-dark/50 underline-offset-4 hover:decoration-gold-dark">sales@chajewelsjp.com</a>
            <Link href={localePath("/contact", lang)} className="text-gold-dark underline decoration-gold-dark/50 underline-offset-4 hover:decoration-gold-dark">{t("legalPage", "contact")}</Link>
          </div>

          <nav aria-label={t("legalPage", "pages")} className="ic-legal-more print:hidden">
            {PAGES.filter((p) => p.key !== page).map((p) => (
              <Link key={p.key} href={localePath(p.href, lang)}>
                <span>{t("footer", p.label)}</span>
                <ChevronRight aria-hidden="true" className="h-4 w-4 flex-none" strokeWidth={1.5} />
              </Link>
            ))}
          </nav>
        </div>

        {withSide && (
          <aside aria-label={t("legalPage", "business")} className="mt-10 lg:col-start-2 xl:col-start-3 xl:row-start-1 xl:mt-0">
            <div className="xl:sticky xl:top-24">
              <p className="ic-toc-title">{t("legalPage", "business")}</p>
              <dl className="mt-3 grid gap-2">
                {rail.map((r) => (
                  <div key={r.k.ja} className="rounded-[14px] bg-chalk px-4 py-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-dark [:lang(ja)_&]:text-[12px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{r.k[lang]}</dt>
                    <dd className="mt-1 break-words text-[13.5px] leading-[1.55] text-charcoal-deep [font-variant-numeric:lining-nums]">{r.v[lang]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        )}
      </div>
      </section>
    </div>
  );
}
