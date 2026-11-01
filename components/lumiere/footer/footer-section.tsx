import Image from "next/image";
import Link from "next/link";

import { localePath } from "@/lib/locale";
import type { SwitchTargets } from "@/lib/locale-nav";
import { tr } from "@/lib/i18n";
import { type Lang } from "@/lib/i18n-core";
import { follow, footerTagline } from "@/lib/settings";
import { getCollections } from "@/lib/queries/products";
import { collectionName } from "@/lib/catalog-i18n";
import { LangSwitcher } from "@/components/site/lang-switcher";
import { layawayOffered } from "@/lib/layaway-availability";
import { COMPANY_ADDRESS, COMPANY_NAME_DISPLAY, CORPORATE_NO, REPRESENTATIVE_NAME } from "@/lib/content/legal";
import { CATEGORY_SHORT_NAME, CATEGORY_ORDER, LUMIERE_HOME_STRINGS } from "@/lib/content/lumiere-home";
import { CardMarks, PaidyMark } from "@/components/commerce/card-marks";
import { CookieSettingsLink } from "@/components/site/cookie-settings-link";
import { capTrim } from "@/components/lumiere/collections/cap-trim";

import { GiantWordmark } from "./giant-wordmark";

import { Separator } from "./footer-icons";
import { SubscribeForm } from "./subscribe-form";
import { CAP_RATIO_MANROPE, TYPE } from "./footer.config";

/** A collections list longer than this runs in two columns (app/lumiere/chrome.css). */
const TWO_COLUMNS_FROM = 7;

const line = capTrim(
  TYPE.link.size,
  TYPE.link.leading,
  CAP_RATIO_MANROPE * TYPE.link.size,
);

const note = capTrim(
  TYPE.note.size,
  TYPE.note.leading,
  CAP_RATIO_MANROPE * TYPE.note.size,
);

/**
 * THE LUMIÈRE FOOTER with this site's content (adapted from the reference's
 * footer-section.tsx — Get Layers "Hero 5 (Footer)", 1556:753; report §8
 * "Footer", §1a, §13 rows 28–29):
 *
 *   mark       the Cha Jewels badge and name (D-3), white on black
 *   columns    Shop — the five Hub categories under their short names (§14);
 *              Explore — the company pages and the guides; Help — customer
 *              care and the legal pages, "Legal notice" as the short label
 *              (row 29), Cookie settings; and the company block — the
 *              registered name (`COMPANY_NAME_DISPLAY`), representative,
 *              address, the corporate number (`CORPORATE_NO`, D-2), the invoice registration
 *              and the secondhand-dealer permit
 *   subscribe  the Hub's `footer.tagline` as the note, then the existing
 *              newsletter action (row 28 for the note under the field)
 *   bottom     © the company name, the legal links, the payment marks
 *              (cards + Paidy) and the Hub's social row (FB, Messenger,
 *              WhatsApp, LINE, email) — Instagram/TikTok are the reference's
 *              and are not carried
 *
 * NOTHING OF THE SITE FOOTER IS DROPPED (P2b item 9; components/site/
 * footer.tsx is the list): the Hub's collections column, every Company link
 * (FAQ and News included), the Care column under its own heading with the
 * legal pages, "Cookie settings", the newsletter heading over the form and
 * its note, "Follow us" over the social row, the founded / authentication
 * ledger lines in the company block, and the language switcher in the bottom
 * row. The social row is whatever the Hub's `social.follow` returns.
 *
 * P3: ON EVERY PAGE (app/layout.tsx renders it wherever the home does not),
 * and ONE VIEWPORT AT 1440×900 WITH NOTHING DROPPED (item 7): the link rows
 * tighter, the collections in two columns when the Hub's list is long, the
 * company block compact, and on a phone the four link columns as accordions
 * (native <details>, open before hydration) — the old footer's own pattern.
 * Halden's giant wordmark (report §7 P3 row) runs along the base, drawn by
 * the letter reveal and aria-hidden: the mark above carries the name.
 * `data-chrome-tone="dark"` tells the site header to go dark over it.
 *
 * A server component but for the e-mail line. Every Hub read is caught: an
 * unreachable Hub costs the tagline or the icons, never the page.
 */
export const FooterSection = async ({ lang, switchTargets }: { lang: Lang; switchTargets?: SwitchTargets }) => {
  const L = (h: string) => localePath(h, lang);
  const t = tr(lang);
  const layaway = layawayOffered(lang);
  const strings = LUMIERE_HOME_STRINGS[lang];
  const [followLinks, tagline, collections] = await Promise.all([
    follow().catch(() => []),
    footerTagline(lang).catch(() => null),
    getCollections().catch(() => []),
  ]);

  const columns: { key: string; title: string; links: { label: string; href: string }[] }[] = [
    {
      key: "collections",
      title: t("footer", "collections"),
      links: [...collections.map((c) => ({ label: collectionName(c, lang), href: L(`/collections/${c.slug}`) })), { label: t("footer", "all"), href: L("/collections") }],
    },
    {
      key: "shop",
      title: t("footer", "shop"),
      links: CATEGORY_ORDER.map((slug) => ({ label: CATEGORY_SHORT_NAME[slug][lang].title.replace(/[.。]$/, ""), href: L(`/categories/${slug}`) })),
    },
    {
      key: "company",
      title: t("trust", "company"),
      links: [
        { label: t("navMenu", "about"), href: L("/about") },
        { label: t("navMenu", "why"), href: L("/why-cha-jewels") },
        { label: t("navMenu", "faq"), href: L("/faq") },
        { label: t("navMenu", "blog"), href: L("/blog") },
        { label: t("navMenu", "news"), href: L("/blog?type=news") },
        { label: t("navMenu", "contact"), href: L("/contact") },
        { label: t("navMenu", "affiliations"), href: L("/affiliations") },
        { label: t("nav", "loyalty"), href: L("/loyalty") },
        { label: t("nav", "wholesale"), href: L("/wholesale") },
        ...(layaway ? [{ label: t("nav", "layaway"), href: L("/layaway") }] : []),
      ],
    },
    {
      key: "care",
      title: t("footer", "care"),
      links: [
        // The FAQ's layaway section, not /layaway: "Layaway terms" promises
        // terms. English only, because layaway is.
        ...(layaway ? [{ label: t("footer", "terms"), href: L("/faq#payments-and-layaway") }] : []),
        { label: t("footer", "faq"), href: L("/faq") },
        { label: t("footer", "shoppingGuide"), href: L("/shopping-guide") },
        { label: t("footer", "jewelryGuide"), href: L("/jewelry-guide") },
        { label: t("footer", "returns"), href: L("/legal/returns") },
        // §13 row 29: the short display label in the footer only; the page title is unchanged.
        { label: strings.legalNotice, href: L("/legal/tokusho") },
        { label: t("footer", "privacy"), href: L("/legal/privacy") },
        { label: t("footer", "sale"), href: L("/legal/terms") },
      ],
    },
  ];

  const legal = [
    { label: t("footer", "privacy"), href: L("/legal/privacy") },
    { label: t("footer", "sale"), href: L("/legal/terms") },
    // §13 row 29: the full title does not fit the footer line; the page title is unchanged.
    { label: strings.legalNotice, href: L("/legal/tokusho") },
  ];

  return (
    <footer className="footer footer--cha" data-chrome-tone="dark">
      <Link href={L("/")} className="footer__logo" aria-label="Cha Jewels">
        <Image
          src="/images/brand/logo-badge-192.webp"
          alt=""
          width={192}
          height={192}
          sizes="40px"
          className="footer__badge"
        />
        <span className="footer__wordmark font-serif">Cha Jewels</span>
      </Link>

      <nav className="footer__columns" aria-label={t("footer", "legal")}>
        {columns.map((column) => {
          const list = (
            <ul className={`footer__list${column.links.length >= TWO_COLUMNS_FROM ? " footer__list--two" : ""}`}>
              {column.links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="footer__link" style={line}>
                    {item.label}
                  </Link>
                </li>
              ))}
              {column.key === "care" && (
                <li>
                  {/* Reopens the cookie banner (components/site/consent-banner.tsx). */}
                  <CookieSettingsLink label={t("footer", "cookieSettings")} className="footer__link footer__link--button" />
                </li>
              )}
            </ul>
          );
          return (
            <div key={column.title} className="footer__column">
              {/* A wide screen: the title and the open list. */}
              <p className="footer__column-title" style={line}>
                {column.title}
              </p>
              {list}
              {/* A phone: the same list behind its title (app/lumiere/chrome.css decides which shows). */}
              <details>
                <summary className="footer__column-title">{column.title}</summary>
                {list}
              </details>
            </div>
          );
        })}

        {/* The company block (§1a, D-1, D-2): every line from lib/content/legal.ts. */}
        <div className="footer__column footer__company">
          <p className="footer__column-title" style={line}>{COMPANY_NAME_DISPLAY[lang]}</p>
          <ul className="footer__list footer__list--company">
            <li className="footer__company-line">{REPRESENTATIVE_NAME[lang]}</li>
            <li className="footer__company-line">{COMPANY_ADDRESS[lang]}</li>
            <li className="footer__company-line">{strings.corporateNo} {CORPORATE_NO}</li>
            {/* The site footer's trust ledger: founded and authentication, as text lines. */}
            <li className="footer__company-line">{t("trust", "founded")}: {t("trust", "foundedValue")} — {t("trust", "incorporated")}</li>
            <li className="footer__company-line">{t("trust", "auth")}: {t("trust", "authValue")} — {t("trust", "authNote")}</li>
            {/* The live permit and invoice lines, verbatim (as the site footer renders them). */}
            <li className="footer__company-line">{t("footer", "invoiceReg")}</li>
            <li className="footer__company-line">{t("footer", "secondhandPermit")}</li>
          </ul>
        </div>
      </nav>

      <div className="footer__subscribe">
        {/* The Hub's footer.tagline, rendered exactly with the owner's own line
            breaks — the only brand text under the mark (owner 2026-09-26). */}
        {tagline && <p className="footer__note footer__note--tagline" style={note}>{tagline}</p>}
        <p className="footer__column-title" style={line}>{t("footer", "newsletter")}</p>
        <SubscribeForm lang={lang} />
        <p className="footer__note" style={note}>
          {t("footer", "newsletterNote")}
        </p>
      </div>

      {/* A rule over the small print. The design width has none — there the three
          parts of the last line are spread across the frame and read as one — but
          stacked they need something to close the block above them. */}
      <span className="footer__rule" aria-hidden />

      <p className="footer__rights" style={line}>
        © {new Date().getFullYear()} {COMPANY_NAME_DISPLAY[lang]}
      </p>

      <ul className="footer__meta footer__meta--legal">
        {legal.map((item, index) => (
          <li key={item.href} className="footer__meta-item">
            {index > 0 && <Separator />}
            <Link href={item.href} className="footer__link" style={line}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="footer__meta footer__meta--social">
        {followLinks.length > 0 && <span className="footer__column-title footer__follow" style={line}>{t("footer", "follow")}</span>}
        <ul className="footer__meta footer__meta--social-list">
          {followLinks.map((item, index) => (
            <li key={item.key} className="footer__meta-item">
              {index > 0 && <Separator />}
              <a
                href={item.href}
                target={item.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={item.href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
                className="footer__link footer__link--bright"
                style={line}
                data-analytics={`footer-social-${item.key}`}
              >
                {t("social", item.key)}
              </a>
            </li>
          ))}
        </ul>
        <span className="footer__marks">
          <CardMarks label={t("footer", "cards")} />
          <PaidyMark label={t("footer", "paidy")} />
        </span>
        {/* The language toggle, as the site footer carries it (dark tone). */}
        <span className="footer__lang">
          <LangSwitcher lang={lang} targets={switchTargets} tone="dark" />
        </span>
      </div>

      {/* Halden's giant wordmark along the base (docs/design-refs/halden/
          footer-section.tsx): the name, letter by letter, as the rest of the
          page's headings arrive; aria-hidden — the mark above says it. */}
      <span className="footer__giant font-serif" aria-hidden="true">
        <GiantWordmark lang={lang} />
      </span>
    </footer>
  );
};
