"use client";

/**
 * Ported from the Lumière reference (src/components/common/letter-reveal.tsx).
 * Changes for this site (docs/tasks/lumiere-p0-report.md §5, §6):
 *  - the engine is `spring-text-engine` directly (the reference's robot-form
 *    wrapper is not ported);
 *  - `TextRun` comes from lib/lumiere/text-runs.ts, with its Japanese path:
 *    a grapheme beyond the BMP is handed to the engine as a static node so no
 *    surrogate pair comes apart (letters are counted as the engine counts
 *    them), and a `centre` line in Japanese splits at a run boundary (the 。),
 *    never mid-word;
 *  - the `!` important modifier is Tailwind 3.4's prefix form (`!block`).
 */

import { easings } from "@react-spring/web";
import { useEffect, useRef, type ReactNode } from "react";
import TextEngine from "spring-text-engine";

import type { Lang } from "@/lib/i18n";
import { centreSplitIndex, isAstral, isSimple, letterUnits, runLength, type TextRun } from "@/lib/lumiere/text-runs";

export type { TextRun };

/**
 * The site's heading entrance: letter by letter, each glyph coming up out of a
 * blur as it fades in. Nothing moves — the type develops in place.
 *
 * Built on `spring-text-engine`; this is a preset over it, not a text
 * animation of its own.
 *
 * Quick to start and slow to finish: the letters follow each other closely and
 * each one is legible almost at once (an expo ease-out), then takes its time
 * coming fully into focus — so the line reads early and keeps sharpening.
 */
export const LETTER_REVEAL = {
  /** Between one letter and the next, in ms. */
  stagger: 24,
  /** Each letter's own fade and focus, in ms. */
  duration: 1300,
  /** How out of focus a letter starts, in `em` of its own size. */
  blur: "0.28em",
  /** A little inside the viewport before it plays, as the other entrances. */
  rootMargin: "0px 0px -15% 0px",
} as const;

const LETTER_CONFIG = {
  duration: LETTER_REVEAL.duration,
  easing: easings.easeOutExpo,
} as const;

/**
 * Which way the letters run.
 * - `forward` — first to last, as the line reads (a line set from the left).
 * - `backward` — last to first (a line set from the right edge).
 * - `centre` — from the middle out to both ends at once (a centred line).
 */
export type LetterDirection = "forward" | "backward" | "centre";

/**
 * Letters in a line, as the engine counts them. Every space is handed over as
 * a no-break space (see `toChildren`), which the engine treats as a letter, so
 * spaces count — this is the number that lines up with its stagger. A grapheme
 * beyond the BMP travels as an uncounted node (see `toChildren`), so it is not
 * counted here either (`runLength`).
 */
export const letterCount = (runs: readonly TextRun[]): number =>
  runs.reduce((total, run) => total + runLength(run), 0);

/**
 * The runs as the engine's children.
 *
 * The engine makes every span a word of its own and splits plain text on
 * spaces, then sets its words apart with a gap of its own. These headings
 * change face mid-word (the italic capitals), so a span boundary is not a word
 * boundary — left to the engine, "Jewelry" came apart at the J. So every
 * space is handed over as a no-break space, which the engine does not split
 * on: each run stays one word, and the spaces are real glyphs at the face's own
 * width (see the container below).
 *
 * A run whose text holds a grapheme beyond the BMP (a surrogate pair in
 * UTF-16 — the engine splits a span's text with `split("")` and would draw the
 * two halves as two broken glyphs) is handed over in pieces: the BMP stretches
 * as ordinary text spans, and each astral grapheme as a span with NO children
 * (its glyph written through `dangerouslySetInnerHTML`). The engine finds no
 * words in a childless element and keeps it as a static "node" token: the
 * glyph is drawn whole, simply present rather than revealed, and not counted —
 * which is what `runLength` counts too, so the staggers stay aligned. The
 * spans sit inline in the `!block` container, so nothing about layout changes.
 */
const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const toChildren = (runs: readonly TextRun[]) =>
  runs.flatMap((run, index) => {
    const text = run.text.replace(/ /g, " ");
    const className = run.italic ? "italic" : undefined;
    if (isSimple(text)) return [<span key={index} className={className}>{text}</span>];
    const pieces: { text: string; node: boolean }[] = [];
    for (const unit of letterUnits(text)) {
      const last = pieces[pieces.length - 1];
      if (isAstral(unit)) pieces.push({ text: unit, node: true });
      else if (last && !last.node) last.text += unit;
      else pieces.push({ text: unit, node: false });
    }
    return pieces.map((piece, i) =>
      piece.node ? (
        <span key={`${index}-${i}`} className={className} dangerouslySetInnerHTML={{ __html: escapeHtml(piece.text) }} />
      ) : (
        <span key={`${index}-${i}`} className={className}>{piece.text}</span>
      ),
    );
  });

const plainText = (runs: readonly TextRun[]) => runs.map((run) => run.text).join("");

/** Splits runs at a grapheme index (the index space of `centreSplitIndex`), keeping each side's faces. */
const splitRuns = (runs: readonly TextRun[], at: number): [TextRun[], TextRun[]] => {
  const left: TextRun[] = [];
  const right: TextRun[] = [];
  let seen = 0;
  for (const run of runs) {
    const units = letterUnits(run.text);
    const end = seen + units.length;
    if (end <= at) left.push(run);
    else if (seen >= at) right.push(run);
    else {
      left.push({ ...run, text: units.slice(0, at - seen).join("") });
      right.push({ ...run, text: units.slice(at - seen).join("") });
    }
    seen = end;
  }
  return [left, right];
};

const BLUR_EM = parseFloat(LETTER_REVEAL.blur);
const LETTER_FADE = { opacity: 0 } as const;
const LETTER_SHOWN = { opacity: 1 } as const;
const LETTER_BLURRED = { opacity: 0, filter: `blur(${LETTER_REVEAL.blur})` } as const;
const LETTER_SHARP = { opacity: 1, filter: "blur(0em)" } as const;

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/**
 * Per-word blur (the hero's text swap, reference owner decision 2026-10-30):
 * the letters keep their own fade on the engine, and the blur is one filter per
 * word (`.line-word`, the engine's word box), following the letters' curve from
 * the word's middle letter. Per letter, every blurred glyph was a filter layer
 * re-rastered each frame; at the hero's photo transition that was part of a
 * 59–75 ms phone frame. A word carries no filter before its first letter
 * starts or once it is sharp.
 */
const WordBlur = ({
  delay,
  stagger,
  children,
}: {
  delay: number;
  stagger: number;
  children: ReactNode;
}) => {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    let raf = 0;
    let origin = 0;
    const words = () => [...box.querySelectorAll<HTMLElement>(".line-word")];
    // each word's first and middle letter, by the engine's letter order
    let spans: { el: HTMLElement; first: number; middle: number }[] = [];
    const measure = () => {
      let index = 0;
      spans = words().map((el) => {
        const letters = Math.max(1, el.children.length);
        const at = (i: number) => delay + i * stagger;
        const first = Math.min(at(index), at(index + letters - 1));
        const middle = at(index + Math.floor((letters - 1) / 2));
        index += letters;
        return { el, first, middle };
      });
    };
    const frame = (now: number) => {
      if (!origin) origin = now;
      // the engine splits its text in an effect of its own: measure until its
      // word boxes are there
      if (!spans.length) measure();
      const t = now - origin;
      let busy = false;
      for (const { el, first, middle } of spans) {
        if (t < first) {
          el.style.filter = "";
          busy = true;
          continue;
        }
        const k = easeOutExpo(Math.max(0, t - middle) / LETTER_REVEAL.duration);
        const blur = BLUR_EM * (1 - k);
        if (blur < 0.002) {
          el.style.filter = "";
        } else {
          el.style.filter = `blur(${blur.toFixed(4)}em)`;
          busy = true;
        }
      }
      if (busy || !spans.length) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      words().forEach((el) => (el.style.filter = ""));
    };
  }, [delay, stagger]);

  return (
    <span ref={ref} className="contents">
      {children}
    </span>
  );
};

interface EngineLineProps {
  runs: readonly TextRun[];
  delay: number;
  stagger: number;
  /** `!block` for a whole line, `!inline-block` for one half of a split line. */
  display: "!block" | "!inline-block";
  seo: boolean;
  rootMargin: string;
  className?: string;
  /** One blur per word instead of per letter (`WordBlur`). */
  wordBlur?: boolean;
}

const EngineLine = ({
  runs,
  delay,
  stagger,
  display,
  seo,
  rootMargin,
  className,
  wordBlur = false,
}: EngineLineProps) => {
  const engine = (
    <TextEngine
      tag="span"
      mode="once"
      rootMargin={rootMargin}
      seo={seo}
      // A block of inline words rather than the engine's flex row: the words
      // carry their own spaces now, so they sit as text does — kerned by the
      // face, aligned by the parent's `text-align` — and `nowrap` keeps a word
      // from breaking at a change of face.
      className={`${display} whitespace-nowrap ${className ?? ""}`}
      letterIn={wordBlur ? LETTER_SHOWN : LETTER_SHARP}
      letterOut={wordBlur ? LETTER_FADE : LETTER_BLURRED}
      // The engine's delay is `delayIn + index × stagger`; a negative stagger
      // with the start moved to the far end runs the letters last to first.
      letterStagger={stagger}
      letterConfig={LETTER_CONFIG}
      delayIn={delay}
    >
      {toChildren(runs)}
    </TextEngine>
  );
  return wordBlur ? (
    <WordBlur delay={delay} stagger={stagger}>
      {engine}
    </WordBlur>
  ) : (
    engine
  );
};

export interface LetterRevealProps {
  /** One line of the heading. Line breaks are the caller's: one per line. */
  runs: readonly TextRun[];
  /** ms before the first letter — offset lines so the run carries across. */
  delay?: number;
  /** Which way the letters run — see `LetterDirection`. */
  direction?: LetterDirection;
  /** Between letters, in ms; the preset's by default. */
  stagger?: number;
  /**
   * Hold the entrance until this is true (the hero waits for the preloader).
   * Until then the line is an invisible copy of itself, so the box keeps its
   * size and nothing shifts when the letters arrive.
   */
  ready?: boolean;
  /** Draw the line as plain text, already arrived — no entrance at all. */
  still?: boolean;
  /**
   * Running text that wraps to its box, rather than a set line. The words are
   * left to the engine's own wrapping row, `gap` apart (in `em` — the face's
   * own space), so the runs must not change face mid-word. EN only (§5): a
   * Japanese line has no spaces for the engine to wrap on — give it named lines.
   */
  wrap?: { gap: number };
  /**
   * When the line counts as in view. The preset waits until it is 15% inside
   * the viewport; something that lives near the bottom edge (the hero's
   * standfirst) would never get that far, so it plays at `0px`.
   */
  rootMargin?: string;
  className?: string;
  /** The blur per word, not per letter — the hero's text swap (`WordBlur`). */
  wordBlur?: boolean;
  /**
   * The line's language: a Japanese `centre` line splits at a run boundary
   * (the caller breaks the runs at the 。), never through a word. English by default.
   */
  lang?: Lang;
}

export const LetterReveal = ({
  runs,
  delay = 0,
  direction = "forward",
  stagger = LETTER_REVEAL.stagger,
  ready = true,
  still = false,
  wrap,
  rootMargin = LETTER_REVEAL.rootMargin,
  className,
  wordBlur = false,
  lang = "en",
}: LetterRevealProps) => {
  if (!ready || still) {
    const setting = wrap ? "" : "whitespace-nowrap";
    return (
      <span
        className={`block ${setting} ${ready ? "" : "invisible"} ${className ?? ""}`}
      >
        {wrap ? plainText(runs) : toChildren(runs)}
      </span>
    );
  }

  if (wrap) {
    const engine = (
      <TextEngine
        tag="span"
        mode="once"
        rootMargin={rootMargin}
        className={className}
        columnGap={wrap.gap}
        letterIn={wordBlur ? LETTER_SHOWN : LETTER_SHARP}
        letterOut={wordBlur ? LETTER_FADE : LETTER_BLURRED}
        letterStagger={stagger}
        letterConfig={LETTER_CONFIG}
        delayIn={delay}
      >
        {plainText(runs)}
      </TextEngine>
    );
    return wordBlur ? (
      <WordBlur delay={delay} stagger={stagger}>
        {engine}
      </WordBlur>
    ) : (
      engine
    );
  }

  const count = letterCount(runs);

  if (direction === "centre") {
    // Two engines meeting in the middle: the left half runs last to first and
    // the right half first to last, both from the same moment, so the line
    // opens outward from its centre. Split mid-word if need be — the halves
    // are inline, so they join with no seam. Each half's crawler copy is off
    // and one whole copy stands in for both, or a reader would hear the word
    // at the split broken in two. Japanese splits at a run boundary instead.
    const [left, right] = splitRuns(runs, centreSplitIndex(runs, lang));
    const leftCount = letterCount(left);
    return (
      <span className={`block whitespace-nowrap ${className ?? ""}`}>
        <span className="sr-only">{plainText(runs)}</span>
        <span aria-hidden>
          <EngineLine
            runs={left}
            delay={delay + Math.max(0, leftCount - 1) * stagger}
            stagger={-stagger}
            display="!inline-block"
            seo={false}
            rootMargin={rootMargin}
          />
          <EngineLine
            runs={right}
            delay={delay}
            stagger={stagger}
            display="!inline-block"
            seo={false}
            rootMargin={rootMargin}
          />
        </span>
      </span>
    );
  }

  const isBackward = direction === "backward";
  return (
    <EngineLine
      runs={runs}
      delay={isBackward ? delay + Math.max(0, count - 1) * stagger : delay}
      stagger={isBackward ? -stagger : stagger}
      display="!block"
      seo
      rootMargin={rootMargin}
      className={className}
      wordBlur={wordBlur}
    />
  );
};
