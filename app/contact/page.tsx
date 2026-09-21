import Link from "next/link";
import { pageMeta } from "@/lib/page-meta";
import { getLang } from "@/lib/i18n-server";
import { tr, type Lang } from "@/lib/i18n";
import { COMPANY_ADDRESS, COMPANY_NAME, COMPANY_PHONE, tokusho } from "@/lib/content/legal";
import { FOLLOW } from "@/lib/social";
import { SocialIcons } from "@/components/site/social-icons";

export const generateMetadata = () => pageMeta("contact");

/**
 * Contact — a light page whose every VALUE comes from lib/content/legal.ts.
 *
 * Nothing here is typed. The company name and the registered address are the
 * same constants the statutory tokusho page and the invoice header print
 * (components/account/print-header.tsx does the same), and the email is read
 * out of the tokusho rows by its key. A contact detail that changes changes in
 * one file, and this page cannot drift from the statutory one.
 *
 * The two telephone numbers were held off this page while their digits were
 * unconfirmed. The owner confirmed them on 2026-09-21, so they are published
 * here as tel: links, from COMPANY_PHONE — the same constant the statutory
 * tokusho row builds its combined display string from.
 *
 * STILL NO OPENING HOURS: they are in no source file, and are not invented
 * here.
 */
function tokushoValue(keyEn: string, lang: Lang): string | null {
  return tokusho.rows.find((r) => r.k.en === keyEn)?.v[lang] ?? null;
}

export default async function Contact() {
  const lang = await getLang();
  const t = tr(lang);
  const address = COMPANY_ADDRESS[lang];
  const email = tokushoValue("Email", lang);
  // Built from the address rather than a stored place id, so it follows the
  // address if that ever changes.
  const mapHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <section className="bg-chalk py-[clamp(48px,7vw,96px)] text-charcoal">
      <div className="wrap max-w-2xl">
        <h1 className="text-[clamp(32px,5vw,64px)] leading-[1.12] text-charcoal-deep">{t("contact", "h1")}</h1>
        <p className="mt-4 text-[17px] leading-relaxed text-charcoal-deep">{t("contact", "intro")}</p>

        <dl className="mt-10 space-y-6 border-t border-hairline pt-8">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/70">{t("contact", "company")}</dt>
            <dd className="mt-1.5 text-[17px] text-charcoal-deep">{COMPANY_NAME}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/70">{t("contact", "address")}</dt>
            <dd className="mt-1.5 text-[17px] leading-relaxed text-charcoal-deep">
              {address}
              <a
                href={mapHref}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 block text-sm font-semibold text-gold-dark underline-offset-4 hover:underline"
              >
                {t("contact", "map")} →
              </a>
            </dd>
          </div>
          {email && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/70">{t("contact", "email")}</dt>
              <dd className="mt-1.5 text-[17px]">
                <a href={`mailto:${email}`} className="text-gold-dark underline-offset-4 hover:underline">{email}</a>
              </dd>
            </div>
          )}
          {/* tel: needs the digits unpunctuated; the label carries which line
              it is, so the number itself is not repeated in words. */}
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/70">{t("contact", "phoneOffice")}</dt>
            <dd className="mt-1.5 text-[17px]">
              <a href={`tel:${COMPANY_PHONE.office.replace(/-/g, "")}`} className="text-gold-dark underline-offset-4 hover:underline">{COMPANY_PHONE.office}</a>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/70">{t("contact", "phoneMobile")}</dt>
            <dd className="mt-1.5 text-[17px]">
              <a href={`tel:${COMPANY_PHONE.mobile.replace(/-/g, "")}`} className="text-gold-dark underline-offset-4 hover:underline">{COMPANY_PHONE.mobile}</a>
            </dd>
          </div>
        </dl>

        <div className="mt-10 border-t border-hairline pt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-charcoal/70">{t("contact", "follow")}</p>
          <SocialIcons items={FOLLOW} tone="light" lang={lang} className="mt-3" />
        </div>

        <p className="mt-10 text-sm text-charcoal/70">
          {t("contact", "legalNote")}{" "}
          <Link href="/legal/tokusho" className="text-gold-dark underline underline-offset-4">{t("footer", "tokusho")}</Link>
        </p>
      </div>
    </section>
  );
}
