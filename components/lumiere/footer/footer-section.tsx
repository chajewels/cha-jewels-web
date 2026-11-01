import Image from "next/image";
import Link from "next/link";

import { localePath } from "@/lib/locale";
import { tr, type Lang } from "@/lib/i18n";
import { follow, footerTagline } from "@/lib/settings";
import { layawayOffered } from "@/lib/layaway-availability";
import { COMPANY_ADDRESS, COMPANY_NAME_DISPLAY, CORPORATE_NO, REPRESENTATIVE_NAME } from "@/lib/content/legal";
import { CATEGORY_SHORT_NAME, CATEGORY_ORDER, LUMIERE_HOME_STRINGS } from "@/lib/content/lumiere-home";
import { CardMarks, PaidyMark } from "@/components/commerce/card-marks";
import { CookieSettingsLink } from "@/components/site/consent-banner";
import { capTrim } from "@/components/lumiere/collections/cap-trim";

import { Separator } from "./footer-icons";
import { SubscribeForm } from "./subscribe-form";
import { CAP_RATIO_MANROPE, TYPE } from "./footer.config";

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
 * A server component but for the e-mail line. Every Hub read is caught: an
 * unreachable Hub costs the tagline or the icons, never the page.
 */
export const FooterSection = async ({ lang }: { lang: Lang }) => {
  const L = (h: string) => localePath(h, lang);
  const t = tr(lang);
  const layaway = layawayOffered(lang);
  const strings = LUMIERE_HOME_STRINGS[lang];
  const [followLinks, tagline] = await Promise.all([
    follow().catch(() => []),
    footerTagline(lang).catch(() => null),
  ]);

  const columns: { title: string; links: { label: string; href: string }[] }[] = [
    {
      title: t("footer", "shop"),
      links: [
        ...CATEGORY_ORDER.map((slug) => ({ label: CATEGORY_SHORT_NAME[slug][lang].title.replace(/[.。]$/, ""), href: L(`/categories/${slug}`) })),
        { label: t("footer", "all"), href: L("/collections") },
      ],
    },
    {
      title: t("trust", "company"),
      links: [
        { label: t("navMenu", "about"), href: L("/about") },
        { label: t("navMenu", "why"), href: L("/why-cha-jewels") },
        { label: t("navMenu", "blog"), href: L("/blog") },
        { label: t("navMenu", "affiliations"), href: L("/affiliations") },
        { label: t("nav", "loyalty"), href: L("/loyalty") },
        { label: t("nav", "wholesale"), href: L("/wholesale") },
        ...(layaway ? [{ label: t("nav", "layaway"), href: L("/layaway") }] : []),
        { label: t("navMenu", "contact"), href: L("/contact") },
      ],
    },
    {
      title: t("footer", "help"),
      links: [
        { label: t("footer", "faq"), href: L("/faq") },
        { label: t("footer", "shoppingGuide"), href: L("/shopping-guide") },
        { label: t("footer", "jewelryGuide"), href: L("/jewelry-guide") },
        ...(layaway ? [{ label: t("footer", "terms"), href: L("/faq#payments-and-layaway") }] : []),
        { label: t("footer", "returns"), href: L("/legal/returns") },
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
    <footer className="footer footer--cha">
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
        {columns.map((column) => (
          <div key={column.title} className="footer__column">
            <p className="footer__column-title" style={line}>
              {column.title}
            </p>
            <ul className="footer__list">
              {column.links.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="footer__link" style={line}>
                    {item.label}
                  </Link>
                </li>
              ))}
              {column.title === t("footer", "help") && (
                <li>
                  {/* Reopens the cookie banner (components/site/consent-banner.tsx). */}
                  <CookieSettingsLink label={t("footer", "cookieSettings")} className="footer__link footer__link--button" />
                </li>
              )}
            </ul>
          </div>
        ))}

        {/* The company block (§1a, D-1, D-2): every line from lib/content/legal.ts. */}
        <div className="footer__column footer__company">
          <p className="footer__column-title" style={line}>{COMPANY_NAME_DISPLAY[lang]}</p>
          <ul className="footer__list footer__list--company">
            <li className="footer__company-line">{REPRESENTATIVE_NAME[lang]}</li>
            <li className="footer__company-line">{COMPANY_ADDRESS[lang]}</li>
            <li className="footer__company-line">{strings.corporateNo} {CORPORATE_NO}</li>
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
      </div>
    </footer>
  );
};
