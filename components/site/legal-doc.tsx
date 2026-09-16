import { dict } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import type { LegalSection } from "@/lib/content/legal";

/**
 * A legal page renders WHOLLY IN THE SELECTED LANGUAGE. EN means English —
 * title, draft notice, every heading and every line of body. Nothing from the
 * other language appears.
 *
 * TWO ROUNDS TO GET HERE, both reported by Cynthia; the history matters because
 * the middle state looked like a fix and was not.
 *
 *  - Originally these pages rendered Japanese first and English far below,
 *    whatever the toggle said, with the <h1> hardcoded to the Japanese title.
 *    Switching to English gave a Japanese headline and a full screen of
 *    Japanese body text. The stated intent was that a reader could always
 *    check the wording against the other version.
 *  - 2026-09-15 I made the reader's language LEAD and kept the other version
 *    below it, preserving that intent. That is not what the toggle promises.
 *    On EN the page still opened with the English title and the Japanese one
 *    beneath it, the draft notice still carried both languages either side of
 *    a slash, and the whole Japanese body was still there to scroll into.
 *    Half-switched reads as broken, not as bilingual.
 *  - 2026-09-16 (owner decision): one language, the selected one, end to end.
 *
 * The cross-checking intent is not lost — it is served by the toggle. Both
 * versions are one click apart, which is what a reader comparing wording
 * actually does. Do NOT reintroduce a second-language block here.
 *
 * /legal/tokusho is NOT built from this component. It is a Japanese statutory
 * disclosure and stays Japanese in both languages, with an English notice
 * saying so — see app/legal/tokusho/page.tsx.
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
  return (
    <section lang={lang} className="py-[clamp(48px,7vw,96px)]">
      <div className="wrap max-w-[72ch]">
        <h1 className="text-[clamp(32px,4.6vw,64px)]">{title[lang]}</h1>
        <p className="mt-6 border border-gold px-4 py-3 text-sm text-gold-pale">{dict.legal.draft[lang]}</p>

        <div className="mt-12">
          {sections.map((s) => (
            // Keyed on the English heading because it is stable across
            // languages — the key must not change when the toggle does.
            <div key={s.h.en} className="border-t border-rule py-6">
              <h2 className="font-display text-[clamp(20px,2.4vw,28px)] text-gold-pale">{s.h[lang]}</h2>
              {/* list-disc + marker, matching legal-articles.tsx. Preflight
                  strips ul markers, so they are asked for explicitly. Never a
                  generated-content escape -- see the note in that file. */}
              <ul className="mt-3 list-disc space-y-2 pl-5 text-champagne/80 marker:text-gold-pale">
                {s.body[lang].map((line) => <li key={line}>{line}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
