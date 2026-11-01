"use client";

import { animated } from "@react-spring/web";

import {
  LETTER_REVEAL,
  LetterReveal,
  letterCount,
} from "@/components/lumiere/common/letter-reveal";
import type { TextRun } from "@/lib/lumiere/text-runs";
import { useInView } from "@/hooks/use-in-view";
import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { useEnterSpring } from "@/components/lumiere/hero/hero-reveal";

import { capTrim, capTrimSerif } from "./cap-trim";
import { PARALLAX, TYPE } from "./collections.config";

/**
 * The collections header, entering.
 *
 * The display lines come in letter by letter out of a blur — the site's
 * heading entrance (`LetterReveal`), the same as the first screen's headline,
 * the run carried on from one line into the next. The standfirst under them
 * lifts and fades: a letter-by-letter entrance on a 16px line reads as a trick
 * where on a serif this size it reads as typesetting.
 *
 * The trigger is the difference. On the first screen the gate is the preloader
 * — that block is already on screen when the page opens. This one is below the
 * fold, so it waits until it is looked at, and then it stays arrived: an
 * entrance that replays on the way back up is a slideshow, and by then the
 * reader has read it.
 *
 * A client leaf rather than a client section: the cards, the grid and the
 * photographs stay on the server, and only the header carries the runtime.
 */

/** After the heading's first line, so the standfirst follows rather than races. */
const LEAD_DELAY = 420;

/** Each heading line starts where the one before it ends. */
const startsOf = (lines: readonly TextRun[][]) =>
  lines.map((_, index) =>
    lines.slice(0, index).reduce((total, line) => total + letterCount(line), 0),
  );

export interface CollectionsRevealProps {
  /** §13 row 8, two named lines. */
  heading: TextRun[][];
  /** §13 row 9. */
  lead: string;
}

export const CollectionsReveal = ({ heading, lead: leadText }: CollectionsRevealProps) => {
  const headingStarts = startsOf(heading);
  const [ref, seen] = useInView<HTMLHeadingElement>();
  const lead = useEnterSpring(seen, LEAD_DELAY);
  // Measured on the section, not the heading — the heading moves with it.
  const drift = useScrollProgress(ref, { measureParent: true });

  return (
    <>
      <animated.h2
        ref={ref}
        id="collections-heading"
        className="collections__heading font-serif text-collections-heading"
        style={{
          ...capTrimSerif(TYPE.heading.size, TYPE.heading.leading),
          // Against the page, a little: the headline sits back from the cards.
          transform: drift.to(
            (p) => `translate3d(0, ${(-p * PARALLAX.heading).toFixed(4)}em, 0)`,
          ),
        }}
      >
        {heading.map((line, index) => (
          <LetterReveal
            key={index}
            runs={line}
            ready={seen}
            delay={headingStarts[index] * LETTER_REVEAL.stagger}
          />
        ))}
      </animated.h2>

      <animated.p
        className="collections__lead font-tight text-collections-lead"
        style={{
          ...capTrim(TYPE.lead.size, TYPE.lead.leading, TYPE.lead.cap),
          ...lead,
        }}
      >
        {leadText}
      </animated.p>
    </>
  );
};
