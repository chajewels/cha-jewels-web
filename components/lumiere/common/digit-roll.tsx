"use client";

import { animated, useSpring } from "@react-spring/web";
import { useEffect, useRef, useState } from "react";

import { useReduced } from "@/components/fx/media";

/**
 * NUMBERS THAT ROLL INTO PLACE — the Brewns digit-roll mechanic
 * (docs/design-refs/brewns/digit-roll.tsx.txt; docs/tasks/lumiere-redesign.md
 * §7 "Brewns template (mechanics only)"), ported for this site:
 *
 *  - the mechanic is kept whole: a transparent copy of the string holds the
 *    box, the baseline and the accessibility text; the visible glyphs are an
 *    out-of-flow overlay where every digit is a ten-cell column
 *    (`height: 1000%`, one cell per figure) clipped to one cell and sprung to
 *    `translateY(-d × 10%)` with the reference's `{ tension: 90, friction: 26 }`,
 *    staggered 70 ms per digit; everything that is not a digit is printed in
 *    place;
 *  - the reference rolls once, on arrival (its `Inview mode="once"`). Here a
 *    figure may CHANGE while it is on screen — the layaway calculator's
 *    quote, as the reader moves the term — so a column rolls again from the
 *    figure it showed to the one it shows now (the string is the Hub's
 *    formatted figure; nothing is computed from it, scripts/check-money.mjs);
 *  - the reference's call sites were monospace. Ours are Instrument Serif, so
 *    each column is laid over ITS OWN glyph of the transparent copy — a
 *    per-character box rather than one overlay — and digits are set with
 *    tabular figures, so every cell in a column is the width of the glyph it
 *    covers;
 *  - reduced motion: the spring is immediate, the figure simply there.
 */
const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;
const ROLL = { tension: 90, friction: 26 } as const;
const STAGGER_MS = 70;

const isDigit = (char: string) => /\d/.test(char);

export interface DigitRollProps {
  /** The finished string. Digits roll into place; everything else is printed. */
  value: string;
  /** Milliseconds between neighbouring digits. */
  stagger?: number;
  /** Milliseconds before the first digit moves (after `ready`). */
  delayIn?: number;
  /**
   * Gate: the roll plays once this is true (the caller's in-view flag). Until
   * then every column rests on 0 — the pose the reference holds before it is
   * seen. Defaults to true.
   */
  ready?: boolean;
  className?: string;
}

export const DigitRoll = ({ value, stagger = STAGGER_MS, delayIn = 0, ready = true, className }: DigitRollProps) => {
  const chars = Array.from(value);
  let order = 0;
  return (
    <span className={`lm-roll ${className ?? ""}`.trim()}>
      {/* The whole figure, once, for assistive tech and the clipboard. */}
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="lm-roll__row">
        {chars.map((char, index) =>
          isDigit(char) ? (
            <Column key={index} digit={Number(char)} delay={delayIn + order++ * stagger} ready={ready} />
          ) : (
            <span key={index} className="lm-roll__char">
              {char}
            </span>
          ),
        )}
      </span>
    </span>
  );
};

/** One digit: a transparent copy of the glyph holding the box, the ten-cell stack over it. */
const Column = ({ digit, delay, ready }: { digit: number; delay: number; ready: boolean }) => {
  const reduced = useReduced();
  // The figure the column last showed: a change rolls from there, not from 0.
  const shown = useRef(ready ? digit : 0);
  const [, force] = useState(0);
  useEffect(() => {
    if (ready) shown.current = digit;
    force((n) => n + 1);
  }, [digit, ready]);

  const target = ready ? digit : 0;
  const { y } = useSpring({
    from: { y: -shown.current * 10 },
    to: { y: -target * 10 },
    delay: ready ? delay : 0,
    config: ROLL,
    immediate: reduced !== false,
  });

  return (
    <span className="lm-roll__col">
      {/* Transparent, in flow: holds the glyph's own width and the baseline. */}
      <span className="lm-roll__hold">{digit}</span>
      {/* Taller than the line box by 0.35em each way (the reference's
          `-inset-y-[0.35em]`): out of flow, so it costs no layout, and it
          gives the digit clearance from the clip edge. Each of the ten cells
          is exactly this window tall, so a 10 % step lands the next figure
          on the same spot. */}
      <span className="lm-roll__win">
        <animated.span className="lm-roll__stack" style={{ transform: y.to((v) => `translateY(${v}%)`) }}>
          {DIGITS.map((d) => (
            <span key={d} className="lm-roll__cell">
              {d}
            </span>
          ))}
        </animated.span>
      </span>
    </span>
  );
};
