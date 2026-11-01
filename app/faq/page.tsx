import { pageMeta } from "@/lib/page-meta";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { getFaq } from "@/lib/faq";
import { JsonLd } from "@/components/site/json-ld";
import { contactEmail, follow } from "@/lib/settings";
import { COMPANY_PHONE } from "@/lib/content/legal";
import { MessengerCta } from "@/components/site/support-stage";
import { FaqNav, FaqStyle } from "@/components/faq/faq-nav";
import { Emblem } from "@/components/fx/emblem";
import { PageHead, PageSection } from "@/components/lumiere/page/page-head";

export const generateMetadata = () => pageMeta("faq");


export default async function FaqPage() {
  const lang = await getLang();
  const t = tr(lang);
  // From the Hub. A Hub that cannot answer throws rather than returning an
  // empty list, so this page is never rendered — and never cached — blank.
  const sections = await getFaq(lang);

  // Same markdown for the visible answer and for the structured data, flattened
  // by the renderer rather than by a second stripper, so the two cannot drift.
  // Google must never be shown an answer a reader cannot find on the page.
  const jsonLdItems = sections.flatMap((s) => s.items.map((i) => ({ q: i.question, a: i.answerText })));

  const messenger = await follow().then((links) => links.find((l) => l.key === "messenger")?.href ?? null, () => null);
  const email = await contactEmail().catch(() => null);

  return (
    <>
      <JsonLd type="faq" items={jsonLdItems} />
      <FaqStyle />
      <PageHead
        eyebrow={t("navMenu", "company")}
        title={t("faq", "h1")}
        lead={t("faq", "lede")}
        aside={<Emblem name="faq" sm={96} lg={128} />}
      />
      <PageSection tone="sheet">
        <div className="fx-faq">
          <div className="fx-faq-side">
            <FaqNav
              label={t("faq", "categories")}
              items={sections.map((s) => ({ slug: s.slug, heading: s.heading, count: s.items.length, countLabel: t("support", "questions", { n: String(s.items.length) }) }))}
            />
          </div>
          <div lang={lang} className="fx-faq-main">
            {/* The accordion is kept deliberately: forty questions rendered flat
                is a wall, and a shopper looking for one answer should not scroll
                past the rest. Each group is a plate; rows are rounded, with a
                36px pill +/- control. */}
            {sections.map((section) => (
              // `id` is what makes a section linkable — the footer's layaway
              // link is /faq#payments-and-layaway. The page CSS sets its
              // scroll-margin so the heading clears the header (and, on phones,
              // the section bar).
              <section key={section.key} id={section.slug} className="ic-faqgroup lm-plate">
                <h2 className="lm-h2 font-display">{section.heading}</h2>
                <div className="ic-faq-rows">
                  {section.items.map((item) => (
                    <details key={item.key} className="ic-faq-row group">
                      <summary>
                        <span className="min-w-0">{item.question}</span>
                        <span aria-hidden="true" className="ic-faq-pm">
                          <span className="group-open:hidden">+</span>
                          <span className="hidden group-open:inline">−</span>
                        </span>
                      </summary>
                      {/* Markdown from lib/markdown.ts, which escapes its input
                          before parsing it — there is no path from an answer to
                          a tag. `.faq-answer` in globals.css styles it. */}
                      <div className="faq-answer ic-faq-answer text-charcoal/85" dangerouslySetInnerHTML={{ __html: item.answerHtml }} />
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </PageSection>

      {/* Not answered here? A person answers: the page ends on a black band. */}
      <PageSection tone="ink">
        <div className="ic-ask">
          <div>
            <p className="ic-ask__title font-display">{t("support", "askH")}</p>
            <p className="ic-ask__body">
              {email && <><a href={`mailto:${email}`} className="text-white underline-offset-4 hover:underline">{email}</a> · </>}
              <a href={`tel:${COMPANY_PHONE.office.replace(/-/g, "")}`} className="cj-fig text-white underline-offset-4 hover:underline">{COMPANY_PHONE.office}</a>
            </p>
          </div>
          {messenger && <MessengerCta href={messenger} label={t("social", "messengerButton")} className="ic-btn-light" />}
        </div>
      </PageSection>
    </>
  );
}
