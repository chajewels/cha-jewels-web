import Link from "next/link";
import { localePath } from "@/lib/locale";
import { pageMeta } from "@/lib/page-meta";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { COMPANY_ADDRESS, COMPANY_MAP_QUERY, COMPANY_NAME_DISPLAY, COMPANY_PHONE } from "@/lib/content/legal";
import { contactEmail, follow } from "@/lib/settings";
import { SocialIcons } from "@/components/site/social-icons";
import { ContactForm } from "@/components/site/contact-form";
import { MessengerCta } from "@/components/site/support-stage";
import { PageHead, PageSection } from "@/components/lumiere/page/page-head";

export const generateMetadata = () => pageMeta("contact");

/**
 * CONTACT (build step 6; comp page-comps/supporting "contact").
 *
 * Messenger comes first: a dark panel holding the view's one orange action
 * (D6-2; the form's Send is charcoal), then every other way to reach a person
 * — email, both phones, the company name, the address with a map link, and
 * the Hub's social links. The form sits beside it from `lg`, under it on a
 * phone.
 *
 * The company name, the registered address and both phone numbers come from
 * lib/content/legal.ts — the same constants the statutory tokusho page prints,
 * so nothing here is typed and this page cannot drift from it. The email, the
 * social row and the Messenger link come from the Hub (lib/settings.ts); each
 * renders nothing when the Hub holds nothing.
 *
 * STILL NO OPENING HOURS: they are in no source file, and are not invented
 * here.
 */
export default async function Contact() {
  const lang = await getLang();
  const t = tr(lang);
  const address = COMPANY_ADDRESS[lang];
  const [email, followLinks] = await Promise.all([contactEmail(), follow()]);
  const messenger = followLinks.find((l) => l.key === "messenger")?.href ?? null;
  // Searches the bare street address (COMPANY_MAP_QUERY): the display address
  // with the building name sent Google to a nearby hotel instead.
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY_MAP_QUERY)}`;

  const panelLink = "inline-flex min-h-8 items-center";
  // tel: needs the digits unpunctuated; the label carries which line it is.
  const rows: { k: string; v: React.ReactNode }[] = [
    ...(email ? [{ k: t("contact", "email"), v: <a href={`mailto:${email}`} className={panelLink}>{email}</a> }] : []),
    { k: t("contact", "phoneOffice"), v: <a href={`tel:${COMPANY_PHONE.office.replace(/-/g, "")}`} className={`cj-fig ${panelLink}`}>{COMPANY_PHONE.office}</a> },
    { k: t("contact", "phoneMobile"), v: <a href={`tel:${COMPANY_PHONE.mobile.replace(/-/g, "")}`} className={`cj-fig ${panelLink}`}>{COMPANY_PHONE.mobile}</a> },
    { k: t("contact", "company"), v: <span>{COMPANY_NAME_DISPLAY[lang]}</span> },
    {
      k: t("contact", "address"),
      v: (
        <>
          <span className="block leading-relaxed">{address}</span>
          <a href={mapHref} target="_blank" rel="noreferrer" className={`text-[13px] font-semibold ${panelLink}`}>{t("contact", "map")} →</a>
        </>
      ),
    },
  ];

  return (
    <>
      <PageHead eyebrow={t("navMenu", "company")} title={t("contact", "h1Panel")} lead={t("contact", "panelLede")} />
      <PageSection tone="bone" className="!pt-0">
        <div className="ic-split">
          {/* Messenger first (audit Contact #1): on a phone it is the first
              thing under the heading, with every other way to reach us under it. */}
          <div className="lm-plate lm-plate--ink lm-rise grid gap-4">
            <p className="lm-eyebrow !mb-0">{t("support", "fastest")}</p>
            <p className="font-display text-[clamp(21px,2.2vw,28px)] leading-snug text-white [:lang(ja)_&]:text-[19px] [:lang(ja)_&]:leading-[1.6]">{t("support", "contactLine")}</p>
            {messenger && <MessengerCta href={messenger} label={t("social", "messengerButton")} className="ic-btn-light min-h-14 w-full text-base" />}

            <dl className="ic-methods mt-1">
              {rows.map((r) => (
                <div key={r.k} className="ic-method text-[14.5px]">
                  <dt>{r.k}</dt>
                  <dd>{r.v}</dd>
                </div>
              ))}
            </dl>

            {followLinks.length > 0 && (
              <div>
                <p className="sr-only">{t("contact", "follow")}</p>
                <SocialIcons items={followLinks} tone="dark" lang={lang} />
              </div>
            )}
          </div>

          <div className="ic-formsheet lm-rise grid gap-5">
            <h2 className="lm-h2 !text-[clamp(24px,2.4vw,32px)]">{t("support", "orNote")}</h2>
            <ContactForm lang={lang} />
            <p className="text-[13px] text-charcoal/75">
              {t("contact", "legalNote")}{" "}
              <Link href={localePath("/legal/tokusho", lang)} className="text-gold-dark underline underline-offset-4">{t("footer", "tokusho")}</Link>
            </p>
          </div>
        </div>
      </PageSection>
    </>
  );
}
