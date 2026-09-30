import { pageMeta } from "@/lib/page-meta";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { getFaq } from "@/lib/faq";
import { JsonLd } from "@/components/site/json-ld";
import { contactEmail, follow } from "@/lib/settings";
import { COMPANY_PHONE } from "@/lib/content/legal";
import { Eyebrow, MessengerCta } from "@/components/site/support-stage";
import { FaqNav, FaqStyle } from "@/components/faq/faq-nav";

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
      <section className="pb-[clamp(48px,7vw,88px)] pt-[clamp(40px,6vw,88px)]">
        <div className="wrap">
          <Eyebrow rule>{t("navMenu", "company")}</Eyebrow>
          <h1 className="mt-3.5 max-w-[18ch] text-[clamp(34px,4.6vw,60px)] leading-[1.08] text-charcoal-deep [:lang(ja)_&]:text-[clamp(28px,3.4vw,44px)] [:lang(ja)_&]:leading-[1.35]">{t("faq", "h1")}</h1>
          <p className="mt-[18px] max-w-[60ch] text-[17px] leading-[1.75] text-charcoal/85 [:lang(ja)_&]:text-[15.5px]">{t("faq", "lede")}</p>
        </div>
        <div className="wrap fx-faq mt-8 lg:mt-11">
          <div className="fx-faq-side">
            <FaqNav
              label={t("faq", "categories")}
              items={sections.map((s) => ({ slug: s.slug, heading: s.heading, count: s.items.length, countLabel: t("support", "questions", { n: String(s.items.length) }) }))}
            />
          </div>
          <div lang={lang} className="fx-faq-main">
            {/* The accordion is kept deliberately: forty questions rendered flat
                is a wall, and a shopper looking for one answer should not scroll
                past the rest. Rows are 60px with a 32px round ± control. */}
            {sections.map((section) => (
              // `id` is what makes a section linkable — the footer's layaway
              // link is /faq#payments-and-layaway. The page CSS sets its
              // scroll-margin so the heading clears the header (and, on phones,
              // the section bar).
              <section key={section.key} id={section.slug} className="mb-11 last:mb-0">
                <h2 className="mb-3.5 text-[clamp(22px,2.2vw,28px)] text-charcoal-deep [:lang(ja)_&]:text-[clamp(19px,2vw,24px)] [:lang(ja)_&]:leading-[1.5]">
                  {section.heading}
                </h2>
                <div className="border-b border-hairline">
                  {section.items.map((item) => (
                    <details key={item.key} className="group border-t border-hairline">
                      <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-5 py-3 text-[16px] font-medium leading-normal text-charcoal-deep [&::-webkit-details-marker]:hidden [:lang(ja)_&]:text-[15.5px]">
                        <span className="min-w-0">{item.question}</span>
                        <span aria-hidden="true" className="grid h-8 w-8 flex-none place-items-center rounded-full border border-gold-dark/60 text-gold-dark">
                          <span className="group-open:hidden">+</span>
                          <span className="hidden group-open:inline">−</span>
                        </span>
                      </summary>
                      {/* Markdown from lib/markdown.ts, which escapes its input
                          before parsing it — there is no path from an answer to
                          a tag. `.faq-answer` in globals.css styles it. */}
                      <div className="faq-answer pb-5 text-charcoal/85 lg:pr-[60px]" dangerouslySetInnerHTML={{ __html: item.answerHtml }} />
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </section>

      {/* Not answered here? A person answers (comp: the page ends on the dark band). */}
      <section className="band-dark relative overflow-hidden bg-charcoal-deep text-chalk">
        <div aria-hidden="true" className="cs-pool" />
        <div className="wrap relative flex flex-wrap items-center justify-between gap-5 py-10 sm:py-14">
          <div>
            <p className="font-display text-[clamp(22px,2.4vw,30px)] leading-snug text-gold-pale [:lang(ja)_&]:text-[clamp(19px,2vw,24px)]">{t("support", "askH")}</p>
            <p className="mt-1.5 text-sm text-chalk/80">
              {email && <><a href={`mailto:${email}`} className="text-chalk underline-offset-4 hover:underline">{email}</a> · </>}
              <a href={`tel:${COMPANY_PHONE.office.replace(/-/g, "")}`} className="cj-fig text-chalk underline-offset-4 hover:underline">{COMPANY_PHONE.office}</a>
            </p>
          </div>
          {messenger && <MessengerCta href={messenger} label={t("social", "messengerButton")} />}
        </div>
      </section>
    </>
  );
}
