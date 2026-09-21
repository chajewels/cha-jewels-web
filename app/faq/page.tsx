import { pageMeta } from "@/lib/page-meta";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { getFaq } from "@/lib/faq";
import { JsonLd } from "@/components/site/json-ld";

export const generateMetadata = () => pageMeta("faq");

export default async function FaqPage() {
  const lang = await getLang();
  const t = tr(lang);
  // The Hub's FAQ if it has one, this repo's otherwise — all of one or all of
  // the other, never a mixture. lib/faq.ts says why.
  const { sections } = await getFaq(lang);

  // Same markdown for the visible answer and for the structured data, flattened
  // by the renderer rather than by a second stripper, so the two cannot drift.
  // Google must never be shown an answer a reader cannot find on the page.
  const jsonLdItems = sections.flatMap((s) => s.items.map((i) => ({ q: i.question, a: i.answerText })));

  return (
    <>
      <JsonLd type="faq" items={jsonLdItems} />
      <section className="border-b border-hairline py-[clamp(48px,7vw,96px)]">
        <div className="wrap">
          <h1 className="max-w-[18ch] text-[clamp(36px,5.5vw,80px)]">{t("faq", "h1")}</h1>
          <p className="mt-5 max-w-[58ch] text-charcoal">{t("faq", "lede")}</p>
        </div>
      </section>
      <section lang={lang} className="py-[clamp(48px,7vw,96px)]">
        <div className="wrap max-w-[72ch]">
          {/* Category heading in the legal pages' display face, over their gold
              hairline, so /faq reads as part of the same set. The accordion is
              kept deliberately: thirty-nine questions rendered flat is a wall,
              and a shopper looking for one answer should not scroll past the
              other thirty-eight. */}
          {sections.map((section) => (
            <section key={section.key} className="mt-12 first:mt-0">
              <h2 className="border-t border-hairline pt-6 font-display text-[clamp(20px,2.4vw,28px)] text-charcoal-deep">
                {section.heading}
              </h2>
              {section.items.map((item) => (
                <details key={item.key} className="group border-b border-hairline py-5">
                  <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 font-display text-[clamp(17px,2vw,22px)] text-charcoal-deep marker:hidden">
                    {item.question}
                    <span aria-hidden="true" className="shrink-0 text-charcoal/70 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  {/* Markdown from lib/markdown.ts, which escapes its input
                      before parsing it — there is no path from an answer to a
                      tag. `.faq-answer` in globals.css keeps the look the
                      LegalBlock renderer gave these answers, so moving the
                      SOURCE of the FAQ did not also restyle it. */}
                  <div className="faq-answer" dangerouslySetInnerHTML={{ __html: item.answerHtml }} />
                </details>
              ))}
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
