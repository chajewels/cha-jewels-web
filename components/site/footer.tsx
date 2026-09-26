import Link from "next/link";
import { tr, type Lang } from "@/lib/i18n";
import { getCollections } from "@/lib/queries/products";
import { collectionName } from "@/lib/catalog-i18n";
import { layawayOffered } from "@/lib/layaway-availability";
import { follow, footerTagline } from "@/lib/settings";
import { COMPANY_NAME_DISPLAY } from "@/lib/content/legal";
import { SocialIcons } from "@/components/site/social-icons";
import { NewsletterForm } from "@/components/site/newsletter-form";

/**
 * The Stitch footer (docs/stitch/cha-desktop.html §12): charcoal, four columns
 * — brand, collections, customer care & legal, follow us — orange column
 * headings and the company line at the bottom. The fourth column holds the
 * social icon row where the newsletter form used to be. The row and the brand
 * paragraph come from the Hub (lib/settings.ts) and have no fallback in this
 * repo: a setting the Hub does not hold renders NOTHING — no empty paragraph,
 * no heading over an empty row.
 *
 * THE FOOTER IS CHROME, SO IT DEGRADES. Every read here is caught, and a Hub
 * that cannot answer costs this footer its collection list, its paragraph and
 * its icons — not the page it sits at the bottom of. It is on EVERY page,
 * including /about and the four legal documents, none of which contain a word
 * that came from the Hub; a throw here took all of them down with it.
 *
 * That is the opposite of the rule for a page's own content, and deliberately
 * so — see the header of lib/hub-api.ts. A blank FAQ is a lie about the FAQ. A
 * footer missing its collection links is a footer missing its collection links.
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
  // Independent, so they go together rather than in sequence — and caught
  // INDIVIDUALLY, so one unavailable setting does not take the other two down
  // with it. Each falls to the same value an absent setting produces, which is
  // why nothing below needs to know which of the two happened.
  const [collections, followLinks, tagline] = await Promise.all([
    getCollections().catch(() => []),
    follow().catch(() => []),
    footerTagline(lang).catch(() => null),
  ]);
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
          {/* The Hub's footer.tagline is the ONLY text under the logo (owner
              decision 2026-09-26): footer copy is edited in the Hub, so this
              column adds no sentence of its own — brand.originNote included,
              which the owner's tagline already carries. Empty or unreachable
              renders nothing. pre-line keeps the owner's own line breaks and
              blank lines exactly as typed in the Hub; nothing is added. */}
          {tagline && <p className="mt-4 max-w-[40ch] whitespace-pre-line leading-relaxed text-chalk/75">{tagline}</p>}
        </div>
        <div className="lg:col-span-3">
          <h2 className={heading}>{t("footer", "collections")}</h2>
          <ul className="space-y-2">
            {collections.map((c) => <li key={c.id}><Link href={`/collections/${c.slug}`} className={link}>{collectionName(c, lang)}</Link></li>)}
            <li><Link href="/collections" className={link}>{t("footer", "all")}</Link></li>
          </ul>
        </div>
        <div className="lg:col-span-3">
          <h2 className={heading}>{t("footer", "care")}</h2>
          <ul className="space-y-2">
            {/* The FAQ's layaway section, not /layaway. "Layaway terms" is a
                promise of terms, and /layaway is a sales page with a
                calculator on it — the eight questions that actually answer
                "what am I agreeing to" are on /faq. Still English-only,
                because layaway is. */}
            {layawayOffered(lang) && <li><Link href="/faq#payments-and-layaway" className={link}>{t("footer", "terms")}</Link></li>}
            <li><Link href="/gold-guide" className={link}>{t("footer", "goldGuide")}</Link></li>
            <li><Link href="/legal/tokusho" className={link}>{t("footer", "tokusho")}</Link></li>
            <li><Link href="/legal/returns" className={link}>{t("footer", "returns")}</Link></li>
            <li><Link href="/legal/privacy" className={link}>{t("footer", "privacy")}</Link></li>
            <li><Link href="/legal/terms" className={link}>{t("footer", "sale")}</Link></li>
            <li><Link href="/faq" className={link}>{t("footer", "faq")}</Link></li>
          </ul>
        </div>
        <div className="lg:col-span-2">
          <h2 className={heading}>{t("footer", "newsletter")}</h2>
          <p className="leading-relaxed text-chalk/75">{t("footer", "newsletterNote")}</p>
          <NewsletterForm lang={lang} tone="dark" />
          {followLinks.length > 0 && (
            <>
              <h2 className={`${heading} mt-8`}>{t("footer", "follow")}</h2>
              <SocialIcons items={followLinks} tone="dark" lang={lang} />
            </>
          )}
        </div>
      </div>
      <div className="wrap mt-10 flex flex-wrap justify-between gap-4 border-t border-charcoal-mid pt-6 text-xs text-chalk/55">
        {/* The REGISTERED name, from the one constant that holds it. The i18n
            key this replaced carried the kabushiki-gaisha-first variant of the
            name in its Japanese string — the exact wrong form PR #36 found on
            the legal pages, and the reason COMPANY_NAME exists. English adds
            "Cha Jewels Co., Ltd." in front of it (owner decision 2026-09-25);
            the registered name itself is never translated. */}
        <span>© {new Date().getFullYear()} {COMPANY_NAME_DISPLAY[lang]}</span>
        <span>{t("footer", "invoiceReg")}</span>
        <span>{t("footer", "secondhandPermit")}</span>
      </div>
    </footer>
  );
}
