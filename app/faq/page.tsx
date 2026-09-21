import { pageMeta } from "@/lib/page-meta";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { answerText, faqSections } from "@/lib/content/faq";
import { Block } from "@/components/site/legal-articles";
import { JsonLd } from "@/components/site/json-ld";

export const generateMetadata = () => pageMeta("faq");

export default async function FaqPage() {
  const lang = await getLang();
  const t = tr(lang);

  // Same blocks for the visible answer and the structured data, so the two
  // cannot drift. answerText flattens; nothing is authored twice.
  const jsonLdItems = faqSections.flatMap((s) =>
    s.items.map((i) => ({ q: i.q[lang], a: answerText(i.a, lang) })),
  );

  return (
    <>
      <JsonLd type="faq" items={jsonLdItems} />
      <section className="surface-light bg-chalk text-charcoal-deep border-b border-hairline py-[clamp(48px,7vw,96px)]">
        <div className="wrap">
          <h1 className="max-w-[18ch] text-[clamp(36px,5.5vw,80px)]">{t("faq", "h1")}</h1>
          <p className="mt-5 max-w-[58ch] text-charcoal">{t("faq", "lede")}</p>
        </div>
      </section>
      <section lang={lang} className="surface-light bg-chalk text-charcoal-deep py-[clamp(48px,7vw,96px)]">
        <div className="wrap max-w-[72ch]">
          {/* Category heading in the legal pages' display face, over their gold
              hairline, so /faq reads as part of the same set. The accordion is
              kept deliberately: thirty-nine questions rendered flat is a wall,
              and a shopper looking for one answer should not scroll past the
              other thirty-eight. */}
          {faqSections.map((section) => (
            <section key={section.h.en} className="mt-12 first:mt-0">
              <h2 className="border-t border-hairline pt-6 font-display text-[clamp(20px,2.4vw,28px)] text-charcoal-deep">
                {section.h[lang]}
              </h2>
              {section.items.map((item) => (
                <details key={item.q.en} className="group border-b border-hairline py-5">
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 font-display text-[clamp(17px,2vw,22px)] text-charcoal-deep marker:hidden">
                    {item.q[lang]}
                    <span aria-hidden="true" className="shrink-0 text-charcoal/70 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  {item.a.map((block, i) => (
                    // Index is a safe key: an answer's blocks are a fixed,
                    // ordered list that never reorders or filters.
                    <Block key={i} block={block} lang={lang} />
                  ))}
                </details>
              ))}
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
