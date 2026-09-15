import { dict } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { LegalSection } from "@/lib/content/legal";

/**
 * Legal pages carry BOTH languages so a reader can always check the wording
 * against the other version — but they follow the language toggle for which
 * one comes first, and the heading is in the reader's own language.
 *
 * FIXED 2026-09-15 (reported by Cynthia): this component used to render
 * Japanese first and English far below it, whatever the toggle said, and the
 * <h1> was hardcoded to the Japanese title. Switching to English on
 * /legal/privacy or /legal/terms therefore looked like the toggle was broken —
 * the page opened with a Japanese headline and a full screen of Japanese body
 * text. Every other page on the site switched; these two did not. Keeping both
 * versions was deliberate and is preserved; leading with the wrong one was not.
 *
 * /legal/tokusho is a different case and is NOT built from this component: it
 * is statutory and stays Japanese whatever the toggle says.
 */
export function LegalDoc({
  lang,
  title,
  sections,
}: {
  lang: Lang;
  title: Record<Lang, string>;
  sections: LegalSection[];
}) {
  const other: Lang = lang === "ja" ? "en" : "ja";
  const otherLabel = other === "ja" ? dict.legal.japanese[lang] : dict.legal.english[lang];

  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[72ch]">
        <h1 className="text-[clamp(32px,4.6vw,64px)]" lang={lang}>{title[lang]}</h1>
        <p lang={other} className="mt-2 font-display text-[clamp(20px,2.6vw,30px)] text-champagne/70">{title[other]}</p>
        <p className="mt-6 border border-gold px-4 py-3 text-sm text-gold-pale">
          <span lang={lang}>{dict.legal.draft[lang]}</span>
          <span lang={other} className="text-champagne/60"> / {dict.legal.draft[other]}</span>
        </p>

        <div lang={lang} className="mt-12">
          {sections.map((s) => (
            <div key={s.h.en} className="border-t border-rule py-6">
              <h2 className="font-display text-[clamp(20px,2.4vw,28px)] text-gold-pale">{s.h[lang]}</h2>
              <ul className="mt-3 space-y-2 text-champagne/80">
                {s.body[lang].map((line) => <li key={line}>{line}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div lang={other} className="mt-16">
          <p className="text-xs uppercase tracking-[0.14em] text-champagne/45">
            {otherLabel} — {dict.legal.secondary[lang]}
          </p>
          {sections.map((s) => (
            <div key={s.h.en} className="border-t border-rule py-6">
              <h2 className="font-display text-[clamp(20px,2.4vw,28px)] text-gold-pale">{s.h[other]}</h2>
              <ul className="mt-3 space-y-2 text-champagne/80">
                {s.body[other].map((line) => <li key={line}>{line}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
