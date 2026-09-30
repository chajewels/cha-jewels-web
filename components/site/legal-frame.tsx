import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";
import { COMPANY_NAME_DISPLAY, tokusho } from "@/lib/content/legal";
import { LegalToc, LegalTocPhone, PrintLink, type TocItem } from "@/components/site/legal-toc";

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
      <section className="band-dark relative overflow-hidden bg-charcoal-deep text-chalk print:bg-white print:text-charcoal-deep">
        <div aria-hidden="true" className="cs-pool print:hidden" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,rgb(201_162_39/0),rgb(201_162_39/.6)_20%,#E8D28A_50%,rgb(201_162_39/.6)_80%,rgb(201_162_39/0))] print:hidden" />
        <div className="wrap relative pt-9 lg:pb-11 lg:pt-14">
          <p className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold-pale before:h-px before:w-7 before:bg-gold print:text-gold-dark [:lang(ja)_&]:text-[12px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.05em]">
            {t("footer", "legal")}
          </p>
          <h1 className="mt-3.5 max-w-[22ch] text-[clamp(32px,4.4vw,58px)] leading-[1.08] text-gold-pale print:text-charcoal-deep [:lang(ja)_&]:max-w-none [:lang(ja)_&]:text-[clamp(26px,3.2vw,40px)] [:lang(ja)_&]:leading-[1.4] [:lang(ja)_&]:[word-break:auto-phrase]">
            {title}
          </h1>
          <p className="mt-[18px] flex flex-wrap gap-x-7 gap-y-2 text-[13px] text-chalk/80 print:text-charcoal">
            <span className="cj-fig">{updated}</span>
            <span>{COMPANY_NAME_DISPLAY[lang]}</span>
          </p>
          <nav aria-label={t("legalPage", "pages")} className="mt-[30px] print:hidden">
            <ul className="-mx-4 flex overflow-x-auto border-b border-rule [mask-image:linear-gradient(90deg,#000_88%,transparent)] [scrollbar-width:none] lg:mx-0 lg:[mask-image:none]">
              {PAGES.map((p) => (
                <li key={p.key} className="flex-none">
                  <Link
                    href={p.href}
                    aria-current={p.key === page ? "page" : undefined}
                    className="relative flex min-h-[44px] items-center whitespace-nowrap px-4 text-sm text-chalk/75 hover:text-chalk aria-[current]:text-gold-pale aria-[current]:after:absolute aria-[current]:after:inset-x-4 aria-[current]:after:-bottom-px aria-[current]:after:h-0.5 aria-[current]:after:bg-gold-pale"
                  >
                    {t("footer", p.label)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>

      <div
        className={
          withSide
            ? "wrap grid pb-16 pt-7 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12 lg:pb-24 lg:pt-14 xl:grid-cols-[240px_minmax(0,1fr)_250px] xl:gap-14"
            : "wrap pb-16 pt-7 lg:pb-24 lg:pt-14"
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

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 border border-hairline bg-white px-5 py-5 text-sm text-charcoal-deep sm:px-6 print:hidden">
            <span>{t("legalPage", "questions")}</span>
            <a href="mailto:sales@chajewelsjp.com" className="text-gold-dark underline decoration-gold-dark/50 underline-offset-4 hover:decoration-gold-dark">sales@chajewelsjp.com</a>
            <Link href="/contact" className="text-gold-dark underline decoration-gold-dark/50 underline-offset-4 hover:decoration-gold-dark">{t("legalPage", "contact")}</Link>
          </div>

          <nav aria-label={t("legalPage", "pages")} className="mt-16 grid border-t border-hairline sm:grid-cols-3 print:hidden">
            {PAGES.filter((p) => p.key !== page).map((p) => (
              <Link
                key={p.key}
                href={p.href}
                className="flex min-h-[64px] items-center justify-between gap-3 border-b border-hairline py-4 font-medium text-charcoal-deep hover:text-gold-dark sm:border-b-0 sm:border-r sm:px-[18px] sm:first:pl-0 sm:last:border-r-0"
              >
                <span>{t("footer", p.label)}</span>
                <ChevronRight aria-hidden="true" className="h-4 w-4 flex-none text-gold-dark" strokeWidth={1.5} />
              </Link>
            ))}
          </nav>
        </div>

        {withSide && (
          <aside aria-label={t("legalPage", "business")} className="mt-10 lg:col-start-2 xl:col-start-3 xl:row-start-1 xl:mt-0">
            <div className="xl:sticky xl:top-24">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-dark [:lang(ja)_&]:text-[12px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{t("legalPage", "business")}</p>
              <dl className="mt-3 border-t border-hairline">
                {rail.map((r) => (
                  <div key={r.k.ja} className="border-b border-hairline py-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gold-dark [:lang(ja)_&]:text-[12px] [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">{r.k[lang]}</dt>
                    <dd className="mt-1 break-words text-[13.5px] leading-[1.55] text-charcoal-deep [font-variant-numeric:lining-nums]">{r.v[lang]}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
