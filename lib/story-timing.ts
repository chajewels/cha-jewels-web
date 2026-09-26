import { STORY } from "@/lib/motion";

/**
 * THE TYPING SLIDESHOW'S ARITHMETIC (components/home/story-show.tsx), in one
 * place so the server render (which picks the type size) and the browser
 * (which types and holds) count the same characters.
 *
 * A "character" is a grapheme: an emoji, a flag or a letter with a combining
 * mark is one step, never two halves. `Intl.Segmenter` is in every browser the
 * site supports and in Node; `Array.from` (code points) is the fallback.
 */

/** The language a quote is written in, which is not always the page's: a Japanese page shows the English quote when the Japanese one is missing. */
export type QuoteLang = "en" | "ja";

export function graphemes(text: string, lang: QuoteLang): string[] {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter(lang, { granularity: "grapheme" }).segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

/**
 * Seconds to type a story of `n` characters, and to hold it afterwards.
 *   type = n at the natural speed, capped at STORY.typeMax (long ones speed up)
 *   hold = reading time − typing time, clamped to [holdMin, holdMax]
 */
export function storyTiming(n: number, lang: QuoteLang): { type: number; hold: number } {
  const type = Math.min(n / STORY.typeCps[lang], STORY.typeMax);
  const read = n / STORY.readCps[lang];
  return { type, hold: Math.max(STORY.holdMin, Math.min(STORY.holdMax, read - type)) };
}

/**
 * The type size steps with length (large / medium / small), so a short story
 * fills the stage the way a long one does. Japanese carries more per
 * character, so its thresholds are 0.55 of the English ones.
 */
export function storySize(n: number, lang: QuoteLang): "l" | "m" | "s" {
  const k = lang === "ja" ? 0.55 : 1;
  return n <= 120 * k ? "l" : n <= 260 * k ? "m" : "s";
}
