"use client";
import { useMemo, useState } from "react";
import * as m from "motion/react-m";
import type { Variants } from "motion/react";
import { STAGGER, T } from "@/lib/motion";
import { REDUCED, useReduced } from "@/components/fx/media";
import type { Lang } from "@/lib/i18n";
import { segment } from "@/components/fx/segment";

/**
 * A heading that rises into place unit by unit, each unit out of its own mask.
 *
 * UNITS. Japanese is split into graphemes and English into words, with
 * Intl.Segmenter — graphemes, not code points, so a character with a
 * combining mark or a surrogate pair stays whole. Japanese line breaking
 * (kinsoku) survives the split: closing punctuation and the long-vowel mark
 * are glued to the unit before them and opening brackets to the unit after,
 * so a line can still never start with 「。」 or end with 「「」. English keeps
 * its real spaces between units, so it wraps where it always did.
 *
 * ACCESSIBILITY. The sentence is in the DOM once, whole, for assistive tech
 * (`sr-only`); the animated units are `aria-hidden`. That is a visually-hidden
 * copy rather than an aria-label on the wrapper, which the brief suggested:
 * aria-label on a plain span has no role to attach to and is ignored by
 * several screen readers, whereas hidden text is read everywhere.
 *
 * `play` false (first page load — the LCP rule) or reduced motion on: plain
 * text, no spans, nothing hidden.
 */
const UNIT: Variants = {
  hidden: { y: "105%" },
  shown: { y: "0%", transition: T.reveal },
};

export function SplitText({ text, lang, play, delay = 0, className }: {
  text: string; lang: Lang; play: boolean; delay?: number; className?: string;
}) {
  // `play` is only ever true on a client navigation, so the browser is there
  // to ask synchronously — waiting for the subscribed answer would paint the
  // plain heading for a frame and then snap it down into its masks.
  const [reducedNow] = useState(() => typeof window === "undefined" || window.matchMedia(REDUCED).matches);
  const reduced = useReduced() ?? reducedNow;
  const units = useMemo(() => segment(text, lang), [text, lang]);
  if (!play || reduced) return <span className={className}>{text}</span>;
  const stagger = lang === "ja" ? STAGGER.base / 2 : STAGGER.base; // JA has ~3× the units
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <m.span
        aria-hidden="true"
        initial="hidden"
        animate="shown"
        variants={{ hidden: {}, shown: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      >
        {units.map((u, i) =>
          u.space ? u.text : (
            <span key={i} className="split-unit">
              <m.span className="inline-block" variants={UNIT}>{u.text}</m.span>
            </span>
          ),
        )}
      </m.span>
    </span>
  );
}
