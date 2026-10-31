/**
 * Text as the Lumière engine takes it: a line is an array of runs, each run a
 * string with an optional italic face (the reference's `TextRun`,
 * src/data/mocks/home.ts). The helpers below are the Japanese path of
 * docs/tasks/lumiere-p0-report.md §5:
 *
 * - `runsFor(lines, lang)` — no italics on Japanese (there is no Mincho italic
 *   and the italic-capital trick does not exist in Japanese): every run of a
 *   JA line is roman.
 * - `letterUnits(text)` — the engine splits letters with `split("")`, i.e. by
 *   UTF-16 code unit. A surrogate pair (𠮷, an emoji) would come apart. Units
 *   are graphemes through `Intl.Segmenter` where the browser has it, else
 *   `Array.from` (code points), so a pair always stays one letter. Spaces are
 *   units too — the engine counts them (they travel as no-break spaces).
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

/** Letters in a run as the engine will count them once `toChildren` has split it. */
export const runLength = (run: TextRun): number => letterUnits(run.text).length;

/** True when every unit is one UTF-16 code unit — the engine's own split is then exact. */
export const isSimple = (text: string): boolean => letterUnits(text).length === text.length;

export const centreSplitIndex = (runs: readonly TextRun[], lang: Lang): number => {
  const total = runs.reduce((sum, run) => sum + runLength(run), 0);
  const middle = Math.floor(total / 2);
  if (lang !== "ja" || runs.length < 2) return middle;
  // The run boundary nearest the middle (never 0 or total: both halves must hold a letter).
  let seen = 0;
  let best = middle;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let i = 0; i < runs.length - 1; i++) {
    seen += runLength(runs[i]);
    const distance = Math.abs(seen - middle);
    if (seen > 0 && seen < total && distance < bestDistance) {
      best = seen;
      bestDistance = distance;
    }
  }
  return best;
};
