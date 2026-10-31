/**
 * Text as the Lumière engine takes it: a line is an array of runs, each run a
 * string with an optional italic face (the reference's `TextRun`,
 * src/data/mocks/home.ts). The helpers below are the Japanese path of
 * docs/tasks/lumiere-p0-report.md §5:
 *
 * - `runsFor(lines, lang)` — no italics on Japanese (there is no Mincho italic
 *   and the italic-capital trick does not exist in Japanese): every run of a
 *   JA line is roman.
 * - `letterUnits(text)` — graphemes, through `Intl.Segmenter` where the
 *   browser has it, else `Array.from` (code points). The engine splits a
 *   span's text with `split("")`, i.e. by UTF-16 code unit, so a grapheme
 *   beyond the BMP (𠮷, an emoji) would be drawn as two broken halves; the
 *   reveal hands such a grapheme over as a childless element instead, which
 *   the engine keeps whole as a static "node" token and does not count.
 *   `runLength` therefore counts letters AS THE ENGINE COUNTS THEM: one per
 *   code unit of every BMP grapheme (a combining mark is a letter of its own,
 *   as in the reference), none for a grapheme beyond the BMP. Spaces count —
 *   they travel as no-break spaces, which the engine treats as letters.
 * - `centreSplitIndex(runs, lang)` — a `centre` reveal opens from the middle
 *   letter outward. For Japanese the split falls on a run boundary instead (the
 *   caller breaks the line at the 。), so a phone never shows 「確かな素材。明 /
 *   確な情報。」; English keeps the reference's letter midpoint.
 *
 * Pure (no DOM), so tests/lumiere-text-runs.test.mjs covers it.
 */
import type { Lang } from "@/lib/i18n";

export interface TextRun {
  text: string;
  italic?: boolean;
}

export const runsFor = (lines: readonly TextRun[][], lang: Lang): TextRun[][] =>
  lang === "ja" ? lines.map((runs) => runs.map(({ text }) => ({ text }))) : lines.map((runs) => runs.map((run) => ({ ...run })));

let segmenter: Intl.Segmenter | null | undefined;
const graphemeSegmenter = (): Intl.Segmenter | null => {
  if (segmenter !== undefined) return segmenter;
  segmenter = typeof Intl !== "undefined" && "Segmenter" in Intl ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  return segmenter;
};

export const letterUnits = (text: string): string[] => {
  const seg = graphemeSegmenter();
  return seg ? Array.from(seg.segment(text), (s) => s.segment) : Array.from(text);
};

/** True when the grapheme holds a code point beyond the BMP (a surrogate pair in UTF-16). */
export const isAstral = (unit: string): boolean => /[\u{10000}-\u{10FFFF}]/u.test(unit);

/** Letters in a grapheme as the engine counts them: its code units, or none when it must travel as a node. */
export const engineLetters = (unit: string): number => (isAstral(unit) ? 0 : unit.length);

/** Letters in a run as the engine will count them once `toChildren` has split it. */
export const runLength = (run: TextRun): number => letterUnits(run.text).reduce((n, unit) => n + engineLetters(unit), 0);

/** True when no grapheme is astral — the engine's own split is then exact and the run goes over as one span. */
export const isSimple = (text: string): boolean => !letterUnits(text).some(isAstral);

/** Graphemes in a run — the index space `centreSplitIndex` and the reveal's `splitRuns` work in. */
export const graphemeCount = (run: TextRun): number => letterUnits(run.text).length;

export const centreSplitIndex = (runs: readonly TextRun[], lang: Lang): number => {
  const total = runs.reduce((sum, run) => sum + graphemeCount(run), 0);
  const middle = Math.floor(total / 2);
  if (lang !== "ja" || runs.length < 2) return middle;
  // The run boundary nearest the middle (never 0 or total: both halves must hold a letter).
  let seen = 0;
  let best = middle;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < runs.length - 1; i++) {
    seen += graphemeCount(runs[i]);
    const distance = Math.abs(seen - middle);
    if (seen > 0 && seen < total && distance < bestDistance) {
      best = seen;
      bestDistance = distance;
    }
  }
  return best;
};
