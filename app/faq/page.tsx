import { pageMeta } from "@/lib/page-meta";
import { tr } from "@/lib/i18n";
import { getLang } from "@/lib/i18n-server";
import { faqItems } from "@/lib/content/faq";
import { JsonLd } from "@/components/site/json-ld";

export const generateMetadata = () => pageMeta("faq");

export default async function FaqPage() {
  const lang = await getLang();
  const t = tr(lang);
  // Same source as the visible answers, so the structured data cannot drift.
  const jsonLdItems = faqItems.map((i) => ({ q: i.q[lang], a: i.a[lang] }));
  return (
    <>
      <JsonLd type="faq" items={jsonLdItems} />
      <section className="border-b border-rule-soft py-[clamp(48px,7vw,96px)]">
        <div className="wrap">
          <h1 className="max-w-[18ch] text-[clamp(36px,5.5vw,80px)]">{t("faq", "h1")}</h1>
          <p className="mt-5 max-w-[58ch] text-champagne/80">{t("faq", "lede")}</p>
        </div>
      </section>
      <section className="py-[clamp(48px,7vw,96px)]">
        <div className="wrap max-w-[72ch]">
          {faqItems.map((item) => (
            <details key={item.q.en} className="group border-b border-rule py-5">
              <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 font-display text-[clamp(19px,2.2vw,26px)] text-gold-pale marker:hidden">
                {item.q[lang]}
                <span aria-hidden="true" className="shrink-0 text-champagne/45 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 max-w-[62ch] text-champagne/80">{item.a[lang]}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
