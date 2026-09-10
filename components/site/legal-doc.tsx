import { dict } from "@/lib/i18n";
import type { LegalSection } from "@/lib/content/legal";

/**
 * Legal pages render BOTH languages on one page — Japanese first, then English —
 * rather than following the language cookie, so a reader can always check the
 * wording against the other version. The draft notice is not optional: these
 * texts have not been through legal review.
 */
export function LegalDoc({ titleJa, titleEn, sections }: { titleJa: string; titleEn: string; sections: LegalSection[] }) {
  return (
    <section className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[72ch]">
        <h1 className="text-[clamp(32px,4.6vw,64px)]" lang="ja">{titleJa}</h1>
        <p className="mt-2 font-display text-[clamp(20px,2.6vw,30px)] text-champagne/70">{titleEn}</p>
        <p className="mt-6 border border-gold px-4 py-3 text-sm text-gold-pale">
          <span lang="ja">{dict.legal.draft.ja}</span>
          <span className="text-champagne/60"> / {dict.legal.draft.en}</span>
        </p>

        <div lang="ja" className="mt-12">
          {sections.map((s) => (
            <div key={s.h.en} className="border-t border-rule py-6">
              <h2 className="font-display text-[clamp(20px,2.4vw,28px)] text-gold-pale">{s.h.ja}</h2>
              <ul className="mt-3 space-y-2 text-champagne/80">
                {s.body.ja.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div lang="en" className="mt-16">
          <p className="text-xs uppercase tracking-[0.14em] text-champagne/45">English</p>
          {sections.map((s) => (
            <div key={s.h.en} className="border-t border-rule py-6">
              <h2 className="font-display text-[clamp(20px,2.4vw,28px)] text-gold-pale">{s.h.en}</h2>
              <ul className="mt-3 space-y-2 text-champagne/80">
                {s.body.en.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
