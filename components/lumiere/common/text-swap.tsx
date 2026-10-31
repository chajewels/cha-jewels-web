"use client";

// Ported from the Lumière reference (src/components/common/text-swap.tsx);
// `TextRun` now comes from lib/lumiere/text-runs.ts.

import { useState, type ReactNode } from "react";
import { animated, easings, useSpring } from "@react-spring/web";

import {
  LETTER_REVEAL,
  LetterReveal,
  letterCount,
} from "@/components/lumiere/common/letter-reveal";
import type { TextRun } from "@/lib/lumiere/text-runs";

/**
 * Copy that hands over to other copy in place — the hero's frame 3, the
 * featured piece's name.
 *
 * The outgoing words dissolve whole over `exit` ms, fading into the same blur
 * the letters come out of, so they read as the arrival played backwards, only
 * faster and all at once. The incoming words resolve letter by letter
 * (`LetterReveal`) from `enterAfter` ms, so the two overlap rather than leave
 * the space empty.
 */
export const TEXT_SWAP_TIMING = {
  exit: 420,
  enterAfter: 160,
} as const;

/** Each line starts where the one before it ends. */
const lineStarts = (lines: readonly TextRun[][]) =>
  lines.map((_, index) =>
    lines.slice(0, index).reduce((total, runs) => total + letterCount(runs), 0),
  );

interface VersionProps {
  lines: readonly TextRun[][];
  wrap?: { gap: number };
  stagger: number;
}

const Leaving = ({
  lines,
  wrap,
  stagger,
  onDone,
}: VersionProps & { onDone: () => void }) => {
  const { t } = useSpring({
    from: { t: 1 },
    to: { t: 0 },
    config: { duration: TEXT_SWAP_TIMING.exit, easing: easings.easeInCubic },
    onRest: onDone,
  });

  return (
    <animated.span
      aria-hidden
      className="block"
      style={{
        gridArea: "1 / 1",
        opacity: t,
        filter: t.to(
          (v) =>
            `blur(${((1 - v) * parseFloat(LETTER_REVEAL.blur)).toFixed(4)}em)`,
        ),
      }}
    >
      {lines.map((runs, index) => (
        <LetterReveal
          key={index}
          runs={runs}
          wrap={wrap}
          stagger={stagger}
          still
        />
      ))}
    </animated.span>
  );
};

export interface TextSwapProps {
  /** Every version of the copy, each as its lines of runs. */
  versions: readonly TextRun[][][];
  /** Which version is showing. */
  active: number;
  /**
   * The first version's own entrance: letter by letter once `ready`, from
   * `delay`. Off, it is simply there.
   */
  first?: { ready: boolean; delay: number };
  /** Running text that wraps to its box — see `LetterReveal`'s `wrap`. */
  wrap?: { gap: number };
  stagger?: number;
}

/**
 * All versions share one grid cell, so the box is always the largest of them
 * and nothing around it moves when the words change; the ones not showing
 * stay as invisible stand-ins, out of the accessibility tree.
 *
 * Each handover is a remount of the incoming version, so its letter-by-letter
 * entrance replays every time, in either direction.
 */
export const TextSwap = ({
  versions,
  active,
  first,
  wrap,
  stagger = LETTER_REVEAL.stagger,
}: TextSwapProps) => {
  // Derived from the prop during render rather than in an effect, so the
  // outgoing copy is in place on the very frame the incoming one starts.
  const [prevActive, setPrevActive] = useState(active);
  const [swaps, setSwaps] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  if (active !== prevActive) {
    setPrevActive(active);
    setLeaving(prevActive);
    setSwaps((count) => count + 1);
  }

  return (
    <span className="grid">
      {versions.map((lines, index) => {
        if (index === leaving && index !== active) {
          return (
            <Leaving
              key={`leaving-${index}-${swaps}`}
              lines={lines}
              wrap={wrap}
              stagger={stagger}
              onDone={() => setLeaving(null)}
            />
          );
        }

        if (index !== active) {
          return (
            <span
              key={`idle-${index}`}
              aria-hidden
              className="block"
              style={{ gridArea: "1 / 1" }}
            >
              {lines.map((runs, line) => (
                <LetterReveal
                  key={line}
                  runs={runs}
                  wrap={wrap}
                  ready={false}
                />
              ))}
            </span>
          );
        }

        const starts = lineStarts(lines);
        const isFirstShowing = swaps === 0;
        const base = isFirstShowing
          ? (first?.delay ?? 0)
          : TEXT_SWAP_TIMING.enterAfter;
        return (
          <span
            key={`active-${index}-${swaps}`}
            className="block"
            style={{ gridArea: "1 / 1" }}
          >
            {lines.map((runs, line) => (
              <LetterReveal
                key={line}
                runs={runs}
                wrap={wrap}
                stagger={stagger}
                still={isFirstShowing && !first}
                ready={isFirstShowing && first ? first.ready : true}
                // a swap (not the first entrance): blur per word, not per letter
                wordBlur={!isFirstShowing}
                delay={base + starts[line] * stagger}
                // A swap plays as soon as it happens; whatever holds it is
                // already on screen.
                rootMargin="0px"
              />
            ))}
          </span>
        );
      })}
    </span>
  );
};

interface FadeLayerProps {
  shown: boolean;
  children: ReactNode;
}

const FadeLayer = ({ shown, children }: FadeLayerProps) => {
  const { t } = useSpring({
    t: shown ? 1 : 0,
    config: { duration: TEXT_SWAP_TIMING.exit, easing: easings.easeOutCubic },
  });

  return (
    <animated.span
      aria-hidden={!shown}
      className="flex items-center justify-center"
      style={{
        gridArea: "1 / 1",
        opacity: t,
        filter: t.to((v) =>
          v >= 1
            ? "none"
            : `blur(${((1 - v) * parseFloat(LETTER_REVEAL.blur)).toFixed(4)}em)`,
        ),
        visibility: t.to((v) => (v <= 0.001 ? "hidden" : "visible")),
      }}
    >
      {children}
    </animated.span>
  );
};

export interface FadeSwapProps {
  /** One node per version. */
  items: readonly ReactNode[];
  active: number;
  className?: string;
}

/**
 * The short counterpart to `TextSwap`, for small type and mixed content (a
 * price, a list with separators): the versions cross-fade through the same
 * blur, whole rather than letter by letter. All share one grid cell, so the
 * box holds the widest and its surroundings never shift; every version stays
 * mounted, so the crossfade simply reverses on the way back.
 */
export const FadeSwap = ({ items, active, className }: FadeSwapProps) => (
  <span className={`grid ${className ?? ""}`}>
    {items.map((item, index) => (
      <FadeLayer key={index} shown={index === active}>
        {item}
      </FadeLayer>
    ))}
  </span>
);
