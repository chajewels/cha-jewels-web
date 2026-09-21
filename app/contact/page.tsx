import Link from "next/link";
import { pageMeta } from "@/lib/page-meta";
import { getLang } from "@/lib/i18n-server";
import { tr } from "@/lib/i18n";
import { COMPANY_ADDRESS, COMPANY_NAME, COMPANY_PHONE } from "@/lib/content/legal";
import { contactEmail, follow } from "@/lib/settings";
import { SocialIcons } from "@/components/site/social-icons";
import { ContactForm } from "@/components/site/contact-form";

export const generateMetadata = () => pageMeta("contact");

/**
 * Contact — a dark panel of ways to reach us, and a white card to write in.
 *
 * The company name, the registered address and both phone numbers come from
 * lib/content/legal.ts — the same constants the statutory tokusho page and the
 * invoice header print (components/account/print-header.tsx does the same), so
 * nothing here is typed and this page cannot drift from the statutory one.
 *
 * THE EMAIL AND THE FOLLOW ROW ARE THE EXCEPTION, and deliberately: they are
 * owner-editable in the Hub (lib/settings.ts). /legal/tokusho keeps printing
 * its own email from legal.ts, because a statutory disclosure is not editable
 * copy. The fallback here is the same address legal.ts states, so the two agree
 * until someone changes one on purpose — and if they ever disagree, the tokusho
 * row is the one that is right.
 *
 * From lg the card overlaps the panel's edge, which is the reference's look.
 * The overlap is a NEGATIVE MARGIN on the card rather than a transform: a
 * transform would leave the panel's full width in the layout and the two would
 * fight over the same gutter. Below lg the two stack and the overlap is dropped
 * entirely — a card hanging off the edge of a 375px panel is a horizontal
 * scrollbar, not a design.
 *
 * STILL NO OPENING HOURS: they are in no source file, and are not invented
 * here.
 */
export default async function Contact() {
  const lang = await getLang();
  const t = tr(lang);
  const address = COMPANY_ADDRESS[lang];
  const [email, followLinks] = await Promise.all([contactEmail(), follow()]);
  // Built from the address rather than a stored place id, so it follows the
  // address if that ever changes.
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  const panelLabel = "text-[11px] font-semibold uppercase tracking-[0.18em] text-chalk/70";
  const panelLink = "text-gold-pale underline-offset-4 hover:underline";

  return (
    <section className="bg-chalk py-[clamp(48px,7vw,96px)] text-charcoal">
      <div className="wrap">
        <div className="lg:grid lg:grid-cols-[1.05fr_.95fr] lg:items-start">
          {/* Ways to reach a person */}
          <div className="rounded-sm bg-charcoal-deep p-8 text-chalk sm:p-10 lg:py-14">
            <h1 className="text-[clamp(30px,4vw,52px)] leading-[1.14] text-gold-pale">{t("contact", "h1Panel")}</h1>
            <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-chalk/85">{t("contact", "panelLede")}</p>

            <dl className="mt-10 grid gap-6 sm:grid-cols-2">
              {email && (
                <div>
                  <dt className={panelLabel}>{t("contact", "email")}</dt>
                  <dd className="mt-1.5 text-sm"><a href={`mailto:${email}`} className={panelLink}>{email}</a></dd>
                </div>
              )}
              {/* tel: needs the digits unpunctuated; the label carries which
                  line it is, so the number itself is not repeated in words. */}
              <div>
                <dt className={panelLabel}>{t("contact", "phoneOffice")}</dt>
                <dd className="mt-1.5 text-sm">
                  <a href={`tel:${COMPANY_PHONE.office.replace(/-/g, "")}`} className={panelLink}>{COMPANY_PHONE.office}</a>
                </dd>
              </div>
              <div>
                <dt className={panelLabel}>{t("contact", "phoneMobile")}</dt>
                <dd className="mt-1.5 text-sm">
                  <a href={`tel:${COMPANY_PHONE.mobile.replace(/-/g, "")}`} className={panelLink}>{COMPANY_PHONE.mobile}</a>
                </dd>
              </div>
              <div>
                <dt className={panelLabel}>{t("contact", "company")}</dt>
                <dd className="mt-1.5 text-sm text-chalk/85">{COMPANY_NAME}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className={panelLabel}>{t("contact", "address")}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-chalk/85">
                  {address}
                  <a href={mapHref} target="_blank" rel="noreferrer" className={`mt-1.5 block text-xs font-semibold ${panelLink}`}>
                    {t("contact", "map")} →
                  </a>
                </dd>
              </div>
            </dl>

            <div className="mt-10 border-t border-chalk/20 pt-6">
              <p className={panelLabel}>{t("contact", "follow")}</p>
              <SocialIcons items={followLinks} tone="dark" lang={lang} className="mt-3" />
            </div>
          </div>

          {/* The card to write in. -ml-6 pulls it over the panel's edge from lg. */}
          <div className="mt-8 rounded-sm border border-hairline bg-white p-6 shadow-[0_14px_36px_rgba(0,0,0,0.10)] sm:p-8 lg:-ml-6 lg:mt-14">
            <ContactForm lang={lang} />
          </div>
        </div>

        <p className="mt-10 text-sm text-charcoal/70">
          {t("contact", "legalNote")}{" "}
          <Link href="/legal/tokusho" className="text-gold-dark underline underline-offset-4">{t("footer", "tokusho")}</Link>
        </p>
      </div>
    </section>
  );
}
