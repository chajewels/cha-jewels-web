import { pageMeta } from "@/lib/page-meta";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { wholesaleBullets, wholesaleFigures } from "@/lib/content/wholesale";
import { INVOICE_REG_NO, SECONDHAND_PERMIT_NO } from "@/lib/content/legal";
import { InquiryForm } from "@/components/wholesale/inquiry-form";
import { PageHead, PageSection } from "@/components/lumiere/page/page-head";

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
    <>
      <PageHead tone="ink" eyebrow={t("nav", "wholesale")} title={t("wholesale", "h1")} lead={t("wholesale", "lede")} />
      <PageSection tone="ink" className="!pt-0">
        <div className="ic-split ic-split--wholesale">
          <div className="lm-rise">
            <ul className="ic-terms">
              {bullets.map((b, i) => (
                <li key={b} className="ic-term">
                  {figures[i] && <span aria-hidden="true" className="ic-term__fig">{figures[i]}</span>}
                  <span className="ic-term__text">{b}</span>
                </li>
              ))}
            </ul>
            <dl className="ic-facts">
              <div className="ic-fact">
                <dt>{t("trust", "permit")}</dt>
                <dd>{t("contact", "permitNo", { n: SECONDHAND_PERMIT_NO })}</dd>
              </div>
              <div className="ic-fact">
                <dt>{t("trust", "invoice")}</dt>
                <dd>{INVOICE_REG_NO}</dd>
              </div>
            </dl>
          </div>
          <div data-surface="light" className="lm-rise">
            <InquiryForm lang={lang} heading={t("wholesale", "formH")} />
          </div>
        </div>
      </PageSection>
    </>
  );
}
