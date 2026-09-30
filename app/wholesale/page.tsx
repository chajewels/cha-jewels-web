import { pageMeta } from "@/lib/page-meta";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { wholesaleBullets, wholesaleFigures } from "@/lib/content/wholesale";
import { INVOICE_REG_NO, SECONDHAND_PERMIT_NO } from "@/lib/content/legal";
import { InquiryForm } from "@/components/wholesale/inquiry-form";
import { Eyebrow } from "@/components/site/support-stage";
import { H_DISPLAY, LEDE_DARK, SEC, StageBand } from "@/components/site/brand-ui";

export const generateMetadata = () => pageMeta("wholesale");

/**
 * WHOLESALE (build step 5; comp page-comps/brand-programmes "wholesale").
 * One dark stage: the pitch, the three trade facts as a gold ledger (each
 * bullet's own figure set large beside it), and the permit and invoice
 * numbers; the request form beside it in a white card. The form and its
 * request are unchanged (components/wholesale/inquiry-form.tsx); its "Send me
 * the price list" is the page's one orange action, a contact action.
 */
export default async function WholesalePage() {
  const lang = await getLang();
  const t = tr(lang);
  const bullets = wholesaleBullets[lang];
  const figures = wholesaleFigures[lang];
  return (
    <StageBand>
      <div className={`wrap ${SEC} grid items-start gap-10 lg:grid-cols-[1.1fr_.9fr] lg:gap-16`}>
        <div>
          <Eyebrow dark rule>{t("nav", "wholesale")}</Eyebrow>
          <h1 className={`mt-4 max-w-[18ch] text-gold-pale ${H_DISPLAY}`}>{t("wholesale", "h1")}</h1>
          <p className={`mt-[18px] ${LEDE_DARK}`}>{t("wholesale", "lede")}</p>
          <ul className="mt-8 border border-rule">
            {bullets.map((b, i) => (
              <li key={b} className="grid gap-x-[18px] gap-y-1.5 border-b border-rule px-4 py-4 last:border-b-0 sm:grid-cols-[170px_1fr] sm:items-baseline sm:px-5">
                {figures[i] && <span aria-hidden="true" className="font-display text-2xl leading-tight text-gold-pale lining-nums">{figures[i]}</span>}
                <span className="text-[14.5px] leading-relaxed text-chalk/80">{b}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 grid border border-rule text-[13px] text-chalk/75 sm:grid-cols-2">
            <div className="flex flex-wrap gap-x-1.5 border-b border-rule px-4 py-3.5 sm:border-b-0 sm:border-r sm:px-5">
              <dt>{t("trust", "permit")}</dt>
              <dd className="lining-nums">{t("contact", "permitNo", { n: SECONDHAND_PERMIT_NO })}</dd>
            </div>
            <div className="flex flex-wrap gap-x-1.5 px-4 py-3.5 sm:px-5">
              <dt>{t("trust", "invoice")}</dt>
              <dd className="lining-nums">{INVOICE_REG_NO}</dd>
            </div>
          </dl>
        </div>
        <div data-surface="light">
          <InquiryForm lang={lang} heading={t("wholesale", "formH")} />
        </div>
      </div>
    </StageBand>
  );
}
