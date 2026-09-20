import Link from "next/link";
import { tr, type Lang } from "@/lib/i18n";
import { getCollections } from "@/lib/queries/products";
import { collectionName } from "@/lib/catalog-i18n";
import { layawayOffered } from "@/lib/layaway-availability";

/**
 * The Stitch footer (docs/stitch/cha-desktop.html §12): charcoal, four columns
 * — brand, collections, customer care & legal, newsletter — orange column
 * headings, a bank-transfer-only pill and the company line at the bottom.
 *
 * Collection links come from the Hub's jewelry types, in the language of the
 * page. Nothing here names a collection: add or rename one in the Hub and the
 * footer follows. If the Hub is unreachable the list is just "All".
 *
 * The Stitch file's shipping-and-returns link pointed at /shipping-returns,
 * which does not exist; it maps to the existing /legal/returns route.
 */
export async function Footer({ lang }: { lang: Lang }) {
  const t = tr(lang);
  const collections = await getCollections().catch(() => []);
  const heading = "mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-orange";
  const link = "text-chalk/75 hover:text-chalk";
  return (
    <footer className="border-t border-charcoal-mid bg-charcoal-deep py-14 text-sm text-chalk">
      <div className="wrap grid gap-10 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-4">
          <div className="flex items-center gap-3">
            <img src="/images/brand/logo-badge-192.webp" width={48} height={48} alt="" className="h-12 w-12" />
            <p className="gilt font-display text-2xl">Cha Jewels</p>
          </div>
          <p className="mt-4 max-w-[40ch] leading-relaxed text-chalk/75">{t("footer", "blurb")}</p>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-teal/40 px-3 py-1 text-xs text-chalk/85">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-teal" />{t("footer", "checkedEach")}
          </span>
        </div>
        <div className="lg:col-span-2">
          <h4 className={heading}>{t("footer", "collections")}</h4>
          <ul className="space-y-2">
            {collections.map((c) => <li key={c.id}><Link href={`/collections/${c.slug}`} className={link}>{collectionName(c, lang)}</Link></li>)}
            <li><Link href="/collections" className={link}>{t("footer", "all")}</Link></li>
          </ul>
        </div>
        <div className="lg:col-span-3">
          <h4 className={heading}>{t("footer", "care")}</h4>
          <ul className="space-y-2">
            {layawayOffered(lang) && <li><Link href="/layaway" className={link}>{t("footer", "terms")}</Link></li>}
            <li><Link href="/gold-guide" className={link}>{t("footer", "goldGuide")}</Link></li>
            <li><Link href="/legal/tokusho" className={link}>{t("footer", "tokusho")}</Link></li>
            <li><Link href="/legal/returns" className={link}>{t("footer", "returns")}</Link></li>
            <li><Link href="/legal/privacy" className={link}>{t("footer", "privacy")}</Link></li>
            <li><Link href="/legal/terms" className={link}>{t("footer", "sale")}</Link></li>
            <li><Link href="/faq" className={link}>{t("footer", "faq")}</Link></li>
          </ul>
        </div>
        <div className="lg:col-span-3">
          <h4 className={heading}>{t("footer", "newsletterH")}</h4>
          <p className="leading-relaxed text-chalk/75">{t("footer", "newsletterP")}</p>
          {/* TODO(newsletter): no subscribe handler exists in this repo yet. The
              form is rendered disabled rather than posting nowhere — a sign-up
              that swallows the address is worse than one that says it is coming. */}
          <form className="mt-4 flex gap-2" aria-describedby="newsletter-soon">
            <input type="email" disabled placeholder={t("footer", "newsletterPlaceholder")} aria-label={t("footer", "newsletterPlaceholder")} className="min-h-10 min-w-0 flex-1 rounded-sm border border-charcoal-mid bg-charcoal px-3 text-sm text-chalk placeholder:text-chalk/40 disabled:cursor-not-allowed" />
            <button type="submit" disabled className="min-h-10 rounded-sm bg-orange px-4 text-sm font-medium text-charcoal-deep disabled:cursor-not-allowed disabled:opacity-60">{t("footer", "newsletterCta")}</button>
          </form>
          <p id="newsletter-soon" className="mt-2 text-xs text-chalk/55">{t("footer", "newsletterSoon")}</p>
        </div>
      </div>
      <div className="wrap mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-charcoal-mid pt-6 text-xs text-chalk/55">
        <span className="inline-flex items-center gap-2 rounded-full border border-orange/40 px-3 py-1 text-orange">{t("footer", "bankOnly")}</span>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span>© {new Date().getFullYear()} {t("footer", "company")}</span>
          <span>{t("footer", "invoiceReg")}</span>
        </div>
      </div>
    </footer>
  );
}
