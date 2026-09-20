import { COMPANY_ADDRESS, COMPANY_NAME } from "@/lib/content/legal";
import { tr, type Lang } from "@/lib/i18n";

/**
 * The letterhead, printed only. On screen it is absent: the page already shows
 * the reference in its own heading, and the customer knows whose site they are
 * on. On paper neither is true — a sheet that leaves the browser has to say
 * who issued it and about what.
 *
 * The company name and address are READ FROM lib/content/legal, never typed
 * here. They are identifiers: the file records that the registered name once
 * drifted between two pages, and an invoice is the worst place for a third
 * spelling. Changing the registered address changes this header with it.
 */
export function PrintHeader({
  lang, invoiceNumber, reference, date,
}: {
  lang: Lang;
  invoiceNumber: string | null;
  reference: string | null;
  date: string | null;
}) {
  const t = tr(lang);
  return (
    <div className="print-head hidden print:block">
      <div className="print-head__brand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/brand/logo-badge-96.webp" width={40} height={40} alt="" />
        <span className="font-display">Cha Jewels</span>
      </div>

      <dl className="print-head__meta">
        {invoiceNumber && (<><dt>{t("account", "invoiceNo")}</dt><dd>{invoiceNumber}</dd></>)}
        {reference && (<><dt>{t("orders", "reference")}</dt><dd>{reference}</dd></>)}
        {date && (<><dt>{t("orders", "placed")}</dt><dd>{date}</dd></>)}
      </dl>

      <div className="print-head__issuer">
        <p>{t("account", "issuedBy")}</p>
        <p>{COMPANY_NAME}</p>
        <p>{COMPANY_ADDRESS[lang]}</p>
      </div>
    </div>
  );
}
