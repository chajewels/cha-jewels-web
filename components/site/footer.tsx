import Link from "next/link";
import { tr, type Lang } from "@/lib/i18n";
import { getCollections } from "@/lib/queries/products";
import { collectionName } from "@/lib/catalog-i18n";
import { layawayOffered } from "@/lib/layaway-availability";
import { follow, footerTagline } from "@/lib/settings";
import { COMPANY_NAME_DISPLAY } from "@/lib/content/legal";
import { SocialIcons } from "@/components/site/social-icons";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { LangSwitcher } from "@/components/site/lang-switcher";

/**
 * THE SITE FRAME'S FOOTER (build step 1, 2026-09-27; comps in
 * page-comps/site-frame). A charcoal-deep band under a gold hairline:
 *
 *   brand        the logo and the Hub's `footer.tagline`, rendered exactly —
 *                the ONLY text under the logo (owner decision 2026-09-26),
 *                with the owner's own line breaks (`whitespace-pre-line`)
 *   columns      Collections (the Hub's, in the page's language), Company,
 *                Customer care and legal, Newsletter + Follow us. Headings are
 *                gold-pale labels, not orange (audit footer #3)
 *   trust ledger four hairline cells: founded, authentication, the secondhand-dealer
 *                line and the qualified-invoice line — the last two are the
 *                live strings, verbatim
 *   bottom       © the company name as the owner decided per language
 *                (COMPANY_NAME_DISPLAY) and the language toggle
 *
 * Compacted 2026-10-03 (owner: "too large for a footer"): 32px link rhythm
 * from lg, Collections in two columns, tighter padding and ledger; phones
 * unchanged except the padding.
 *
 * On phones the three link groups are 56px accordions (native <details>, so
 * they work before hydration and without script) with 44px links; the audit
 * measured 17px tap targets. From `lg` they are plain columns.
 *
 * THE FOOTER IS CHROME, SO IT DEGRADES. Every Hub read is caught: an
 * unreachable Hub costs the collection list, the tagline and the icons, never
 * the page. A setting the Hub does not hold renders nothing.
 */
export async function Footer({ lang }: { lang: Lang }) {
  const t = tr(lang);
  const [collections, followLinks, tagline] = await Promise.all([
    getCollections().catch(() => []),
    follow().catch(() => []),
    footerTagline(lang).catch(() => null),
  ]);
  const layaway = layawayOffered(lang);

  const groups: { key: string; heading: string; links: { href: string; label: string }[] }[] = [
    {
      key: "collections",
      heading: t("footer", "collections"),
      links: [...collections.map((c) => ({ href: `/collections/${c.slug}`, label: collectionName(c, lang) })), { href: "/collections", label: t("footer", "all") }],
    },
    {
      key: "company",
      heading: t("trust", "company"),
      links: [
        { href: "/about", label: t("navMenu", "about") },
        { href: "/why-cha-jewels", label: t("navMenu", "why") },
        { href: "/faq", label: t("navMenu", "faq") },
        { href: "/blog", label: t("navMenu", "blog") },
        { href: "/blog?type=news", label: t("navMenu", "news") },
        { href: "/contact", label: t("navMenu", "contact") },
        { href: "/affiliations", label: t("navMenu", "affiliations") },
        { href: "/loyalty", label: t("nav", "loyalty") },
        { href: "/wholesale", label: t("nav", "wholesale") },
      ],
    },
    {
      key: "care",
      heading: t("footer", "care"),
      links: [
        // The FAQ's layaway section, not /layaway: "Layaway terms" promises
        // terms. English only, because layaway is.
        ...(layaway ? [{ href: "/faq#payments-and-layaway", label: t("footer", "terms") }] : []),
        { href: "/faq", label: t("footer", "faq") },
        { href: "/gold-guide", label: t("footer", "goldGuide") },
        { href: "/legal/returns", label: t("footer", "returns") },
        { href: "/legal/tokusho", label: t("footer", "tokusho") },
        { href: "/legal/privacy", label: t("footer", "privacy") },
        { href: "/legal/terms", label: t("footer", "sale") },
      ],
    },
  ];

  // `!` because the base layer's `:lang(ja) h2` (serif, 0.01em) outranks a
  // utility class; a footer heading is a Label, in Inter, on both languages.
  const heading = `text-[11px] !font-sans !font-semibold !leading-snug text-gold-pale ${lang === "en" ? "uppercase !tracking-[0.14em]" : "!tracking-[0.05em]"}`;
  // Owner 2026-10-03 22:21: the footer was too tall. From lg the links sit on
  // a 32px rhythm (phones keep the 44px tap target) and Collections runs in
  // two columns, so the tallest column is seven rows, not thirteen.
  const link = "inline-flex min-h-11 items-center text-chalk/80 hover:text-gold-pale lg:min-h-8 lg:text-[13.5px]";
  const figure = `${lang === "ja" ? "font-jp" : "font-display"} text-[17px] leading-snug text-gold-pale [font-variant-numeric:lining-nums_tabular-nums]`;

  return (
    <footer className="band-dark relative bg-charcoal-deep pb-8 pt-10 text-sm text-chalk lg:pt-12">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-gold-dark via-gold to-gold-dark" />
      <div className="wrap grid gap-x-8 lg:grid-cols-[1.2fr_1.5fr_1fr_1fr_1.2fr]">
        <div>
          <div className="flex items-center gap-3">
            <img src="/images/brand/logo-badge-192.webp" width={48} height={48} alt="" className="h-12 w-12" />
            <p className="gilt font-display text-2xl">Cha Jewels</p>
          </div>
          {/* The Hub's footer.tagline is the ONLY text under the logo (owner
              decision 2026-09-26). pre-line keeps the owner's own line breaks
              and blank lines exactly as typed in the Hub; nothing is added. */}
          {tagline && <p className="mt-4 max-w-[40ch] whitespace-pre-line text-[13.5px] leading-relaxed text-chalk/80">{tagline}</p>}
        </div>

        {groups.map((g) => (
          <div key={g.key} className="border-b border-rule first:border-t lg:border-0">
            <h2 className={`${heading} hidden lg:block lg:mb-3`}>{g.heading}</h2>
            <ul className={`hidden lg:block ${g.key === "collections" ? "lg:columns-2 lg:gap-x-6" : ""}`}>
              {g.links.map((l) => <li key={l.href} className="break-inside-avoid"><Link href={l.href} className={link}>{l.label}</Link></li>)}
            </ul>
            <details className="group lg:hidden">
              <summary className={`flex min-h-14 cursor-pointer list-none items-center justify-between [&::-webkit-details-marker]:hidden ${heading}`}>
                <h2 className={heading}>{g.heading}</h2>
                <svg aria-hidden="true" viewBox="0 0 12 12" className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2.5 4.5 6 8l3.5-3.5" /></svg>
              </summary>
              <ul className="pb-4">
                {g.links.map((l) => <li key={l.href}><Link href={l.href} className={`${link} text-[15px]`}>{l.label}</Link></li>)}
              </ul>
            </details>
          </div>
        ))}

        <div className="mt-8 lg:mt-0">
          <h2 className={heading}>{t("footer", "newsletter")}</h2>
          <p className="mt-2 text-[13.5px] leading-relaxed text-chalk/80">{t("footer", "newsletterNote")}</p>
          <NewsletterForm lang={lang} tone="dark" />
          {followLinks.length > 0 && (
            <>
              <h2 className={`${heading} mt-6`}>{t("footer", "follow")}</h2>
              <SocialIcons items={followLinks} tone="dark" lang={lang} className="mt-2" />
            </>
          )}
        </div>
      </div>

      {/* THE TRUST LEDGER. Hairline cells (gold at 32%, `.band-dark`'s rule).
          The permit and invoice cells carry the live footer strings verbatim. */}
      <dl className="wrap mt-8 lg:mt-10">
        <div className="grid grid-cols-2 border-y border-rule lg:grid-cols-4">
          <div className="border-b border-r border-rule py-4 pr-4 lg:border-b-0 lg:pl-0">
            <dt className={heading}>{t("trust", "founded")}</dt>
            <dd className={`mt-2 ${figure}`}>{t("trust", "foundedValue")}</dd>
            <dd className="mt-1 text-xs text-chalk/75">{t("trust", "incorporated")}</dd>
          </div>
          <div className="border-b border-rule py-4 pl-4 lg:border-b-0 lg:border-r lg:pr-4">
            <dt className={heading}>{t("trust", "auth")}</dt>
            <dd className={`mt-2 ${figure}`}>{t("trust", "authValue")}</dd>
            <dd className="mt-1 text-xs text-chalk/75">{t("trust", "authNote")}</dd>
          </div>
          <div className="border-r border-rule py-4 pr-4 lg:pl-4">
            {/* The live line already names itself: its caption is for screen readers only. */}
            <dt className="sr-only">{t("trust", "permit")}</dt>
            <dd className="text-[13px] leading-relaxed text-chalk/85 [font-variant-numeric:lining-nums_tabular-nums]">{t("footer", "secondhandPermit")}</dd>
          </div>
          <div className="py-4 pl-4">
            {/* The live line already names itself: its caption is for screen readers only. */}
            <dt className="sr-only">{t("trust", "invoice")}</dt>
            <dd className="text-[13px] leading-relaxed text-chalk/85 [font-variant-numeric:lining-nums_tabular-nums]">{t("footer", "invoiceReg")}</dd>
          </div>
        </div>
      </dl>

      <div className="wrap mt-5 flex flex-wrap items-center justify-between gap-4 text-xs text-chalk/75">
        {/* The REGISTERED name, from the one constant that holds it; English
            adds "Cha Jewels Co., Ltd." in front (owner decision 2026-09-25). */}
        <span>© {new Date().getFullYear()} {COMPANY_NAME_DISPLAY[lang]}</span>
        {/* Card brands accepted on a confirmed order (Square, D12). Text, not
            logos: the official brand marks go in when the owner supplies
            Square's merchant logo kit files. Same list as the order page. */}
        <span>{t("footer", "cards")}</span>
        <LangSwitcher lang={lang} tone="dark" />
      </div>
    </footer>
  );
}
