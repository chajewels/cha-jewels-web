import Link from "next/link";
import { tr, type Lang } from "@/lib/i18n";
import { getCollections } from "@/lib/queries/products";
import { collectionName } from "@/lib/catalog-i18n";

/**
 * Shop links come from the Hub's jewelry types, in the language of the page.
 * Nothing here names a collection: add or rename one in the Hub and the footer
 * follows. If the Hub is unreachable the list is just "All".
 */
export async function Footer({ lang }: { lang: Lang }) {
  const t = tr(lang);
  const collections = await getCollections().catch(() => []);
  return (
    <footer className="bg-velvet-deep py-14 text-sm">
      <div className="wrap grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div><p className="gilt font-display text-xl">Cha Jewels</p><p className="mt-3 max-w-[38ch] text-champagne/75">{t("footer", "blurb")}</p></div>
        <div>
          <h4 className="mb-3 font-display text-lg text-gold-pale">{t("footer", "shop")}</h4>
          <ul className="space-y-2 text-champagne/75">
            {collections.map((c) => <li key={c.id}><Link href={`/collections/${c.slug}`}>{collectionName(c, lang)}</Link></li>)}
            <li><Link href="/collections">{t("footer", "all")}</Link></li>
          </ul>
        </div>
        <div><h4 className="mb-3 font-display text-lg text-gold-pale">{t("footer", "help")}</h4><ul className="space-y-2 text-champagne/75"><li><Link href="/layaway">{t("footer", "terms")}</Link></li><li><Link href="/loyalty">{t("nav", "loyalty")}</Link></li><li><Link href="/faq">{t("footer", "faq")}</Link></li><li><Link href="/gold-guide">{t("footer", "goldGuide")}</Link></li><li><Link href="/about">{t("nav", "about")}</Link></li><li><Link href="/blog">{t("nav", "blog")}</Link></li></ul></div>
        <div><h4 className="mb-3 font-display text-lg text-gold-pale">{t("footer", "legal")}</h4><ul className="space-y-2 text-champagne/75"><li><Link href="/legal/tokusho">{t("footer", "tokusho")}</Link></li><li><Link href="/legal/privacy">{t("footer", "privacy")}</Link></li><li><Link href="/legal/terms">{t("footer", "sale")}</Link></li></ul></div>
      </div>
      <div className="wrap mt-10 flex flex-wrap justify-between gap-4 border-t border-rule pt-5 text-xs text-champagne/55"><span>© {new Date().getFullYear()} {t("footer", "company")}</span><span>{t("footer", "invoiceReg")}</span></div>
    </footer>
  );
}
