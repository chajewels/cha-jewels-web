import Link from "next/link";
import { pageMeta } from "@/lib/page-meta";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { COMPANY_ADDRESS, COMPANY_MAP_QUERY, COMPANY_NAME_DISPLAY, COMPANY_PHONE } from "@/lib/content/legal";
import { contactEmail, follow } from "@/lib/settings";
import { SocialIcons } from "@/components/site/social-icons";
import { ContactForm } from "@/components/site/contact-form";
import { Eyebrow, MessengerCta } from "@/components/site/support-stage";

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

  const panelLink = "inline-flex min-h-8 items-center text-gold-pale underline-offset-4 hover:underline";
  // tel: needs the digits unpunctuated; the label carries which line it is.
  const rows: { k: string; v: React.ReactNode }[] = [
    ...(email ? [{ k: t("contact", "email"), v: <a href={`mailto:${email}`} className={panelLink}>{email}</a> }] : []),
    { k: t("contact", "phoneOffice"), v: <a href={`tel:${COMPANY_PHONE.office.replace(/-/g, "")}`} className={`cj-fig ${panelLink}`}>{COMPANY_PHONE.office}</a> },
    { k: t("contact", "phoneMobile"), v: <a href={`tel:${COMPANY_PHONE.mobile.replace(/-/g, "")}`} className={`cj-fig ${panelLink}`}>{COMPANY_PHONE.mobile}</a> },
    { k: t("contact", "company"), v: <span className="text-chalk/90">{COMPANY_NAME_DISPLAY[lang]}</span> },
    {
      k: t("contact", "address"),
      v: (
        <>
          <span className="block leading-relaxed text-chalk/90">{address}</span>
          <a href={mapHref} target="_blank" rel="noreferrer" className={`text-[13px] font-semibold ${panelLink}`}>{t("contact", "map")} →</a>
        </>
      ),
    },
  ];

  return (
    <section className="bg-chalk pb-[clamp(56px,7vw,96px)] pt-[clamp(40px,6vw,88px)] text-charcoal">
      <div className="wrap">
        <Eyebrow rule>{t("navMenu", "company")}</Eyebrow>
        <h1 className="mt-3.5 text-[clamp(34px,4.6vw,60px)] leading-[1.08] text-charcoal-deep [:lang(ja)_&]:text-[clamp(28px,3.4vw,44px)] [:lang(ja)_&]:leading-[1.35]">{t("contact", "h1Panel")}</h1>
        <p className="mt-[18px] max-w-[60ch] text-[17px] leading-[1.75] text-charcoal/85 [:lang(ja)_&]:text-[15.5px]">{t("contact", "panelLede")}</p>

        <div className="mt-10 grid items-start gap-7 lg:grid-cols-2 lg:gap-10">
          {/* Messenger first (audit Contact #1): on a phone it is the first
              thing under the heading, with every other way to reach us under it. */}
          <div className="band-dark relative grid gap-4 overflow-hidden bg-charcoal-deep p-6 text-chalk outline outline-1 -outline-offset-1 outline-gold/30 sm:p-[34px]">
            <div aria-hidden="true" className="cs-pool" />
            <Eyebrow dark rule className="relative">{t("support", "fastest")}</Eyebrow>
            <p className="relative font-display text-[clamp(21px,2.2vw,28px)] leading-snug text-gold-pale [:lang(ja)_&]:text-[19px] [:lang(ja)_&]:leading-[1.6]">{t("support", "contactLine")}</p>
            {messenger && <MessengerCta href={messenger} label={t("social", "messengerButton")} className="relative min-h-14 w-full text-base" />}

            <dl className="relative mt-1 border-t border-chalk/20">
              {rows.map((r) => (
                <div key={r.k} className="grid gap-0.5 border-b border-chalk/20 py-3 text-[14.5px] sm:grid-cols-[150px_minmax(0,1fr)] sm:items-baseline sm:gap-4">
                  <dt className="text-[13px] text-chalk/70">{r.k}</dt>
                  <dd className="min-w-0 break-words">{r.v}</dd>
                </div>
              ))}
            </dl>

            {followLinks.length > 0 && (
              <div className="relative">
                <p className="sr-only">{t("contact", "follow")}</p>
                <SocialIcons items={followLinks} tone="dark" lang={lang} />
              </div>
            )}
          </div>

          <div className="grid gap-5 border border-hairline bg-white p-[22px] sm:p-8">
            <h2 className="text-[clamp(22px,2.2vw,28px)] text-charcoal-deep">{t("support", "orNote")}</h2>
            <ContactForm lang={lang} />
            <p className="text-[13px] text-charcoal/75">
              {t("contact", "legalNote")}{" "}
              <Link href="/legal/tokusho" className="text-gold-dark underline underline-offset-4">{t("footer", "tokusho")}</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
