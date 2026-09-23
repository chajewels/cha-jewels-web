"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { DUR, STAGGER } from "@/lib/motion";
import { REDUCED, useReduced } from "@/components/fx/media";
import { isClientNavigation } from "@/components/fx/boot-marker";
import type { Lang } from "@/lib/i18n";
import { segment } from "@/components/fx/segment";

/**
 * A heading that rises into place unit by unit, each unit out of its own mask.
 *
 * UNITS. Japanese is split into graphemes and English into words, with
 * Intl.Segmenter — graphemes, not code points, so a character with a
 * combining mark or a surrogate pair stays whole. Japanese line breaking
 * (kinsoku) survives the split: closing punctuation and the long-vowel mark
 * are glued to the unit before them and opening brackets to the unit after
 * (components/fx/segment.ts). English keeps its real spaces between units,
 * so it wraps where it always did. Measured: the heading is the same height
 * split or plain, JA and EN, at 375 and 1440.
 *
 * MOTION. Each unit renders in its start pose (below its mask); two frames
 * later the wrapper flips to data-split="in" and CSS transitions every unit
 * up, delayed by its index (app/globals.css, "SPLIT TEXT"). No library.
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
export function SplitText({ text, lang, play, delay = 0, className }: {
  text: string; lang: Lang; play: boolean; delay?: number; className?: string;
}) {
  // `play` is only ever true on a client navigation, so the browser is there
  // to ask synchronously — waiting for the subscribed answer would paint the
  // plain heading for a frame and then snap it down into its masks.
  const [reducedNow] = useState(() => typeof window === "undefined" || window.matchMedia(REDUCED).matches);
  const reduced = useReduced() ?? reducedNow;
  const units = useMemo(() => segment(text, lang), [text, lang]);
  const [phase, setPhase] = useState<"from" | "in" | "done">("from");
  const live = play && !reduced;

  useEffect(() => {
    if (!live) return;
    // Two frames: the first commits the start pose, the second starts the move.
    let b = 0;
    const a = requestAnimationFrame(() => { b = requestAnimationFrame(() => setPhase("in")); });
    return () => { cancelAnimationFrame(a); cancelAnimationFrame(b); };
  }, [live]);
  useSettle(phase === "in", units.length, lang, delay, () => setPhase("done"));

  if (!live || phase === "done") return <span className={className}>{text}</span>;
  return <span className={className}><Units text={text} units={units} lang={lang} phase={phase} delay={delay} /></span>;
}

/**
 * ONE COPY AT REST. While the units rise, the sentence is in the DOM twice —
 * the sr-only copy for assistive tech and the masked units on screen — and a
 * reader who selected the heading copied it twice ("New on the benchNew on
 * the bench", owner report). So once the last unit has landed the heading
 * goes back to plain text (same height, measured), and during the rise the
 * sr-only copy is excluded from selection.
 */
function useSettle(rising: boolean, count: number, lang: Lang, delay: number, done: () => void) {
  useEffect(() => {
    if (!rising) return;
    const stagger = lang === "ja" ? STAGGER.base / 2 : STAGGER.base;
    const ms = (delay + count * stagger + DUR.reveal) * 1000 + 100;
    const id = setTimeout(done, ms);
    return () => clearTimeout(id);
    // `done` is a fresh closure each render; the timer only needs the numbers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rising, count, lang, delay]);
}

/** The sentence once for assistive tech, then the masked units. */
function Units({ text, units, lang, phase, delay = 0 }: {
  text: string; units: ReturnType<typeof segment>; lang: Lang; phase: "from" | "in"; delay?: number;
}) {
  const stagger = lang === "ja" ? STAGGER.base / 2 : STAGGER.base; // JA has ~3× the units
  let n = 0;
  return (
    <>
      <span className="sr-only" style={{ userSelect: "none", WebkitUserSelect: "none" }}>{text}</span>
      <span aria-hidden="true" data-split={phase} style={{ ["--split-stagger" as string]: `${stagger}s`, ["--split-delay" as string]: `${delay}s` }}>
        {units.map((u, i) =>
          u.space ? u.text : (
            <span key={i} className="split-unit">
              <span style={{ ["--u" as string]: n++ }}>{u.text}</span>
            </span>
          ),
        )}
      </span>
    </>
  );
}

/**
 * A section heading that rises in, unit by unit, when it scrolls into view.
 *
 * THE SERVER SENDS PLAIN TEXT. The split happens in the browser, after
 * hydration, and only for a heading measured below the fold: it is swapped
 * for its masked units in their start pose while nobody can see it, and rises
 * when it comes into view. So the HTML carries no extra bytes (on a slow
 * phone link every KB before the hero poster costs its LCP ~5 ms —
 * docs/perf-baseline.md), and a heading already on screen is never touched.
 * Reduced motion: plain text, always. Same units, kinsoku and heights as
 * SplitText.
 */
export function SplitHeading({ as: Tag = "h2", text, lang, className }: {
  as?: "h2" | "h3"; text: string; lang: Lang; className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduced = useReduced();
  const [phase, setPhase] = useState<"plain" | "from" | "in">("plain");
  const armed = useRef(false);
  const units = useMemo(() => segment(text, lang), [text, lang]);
  useSettle(phase === "in", units.length, lang, 0, () => setPhase("plain"));

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced === null) return;
    if (reduced) { setPhase("plain"); return; }
    if (armed.current) return;
    armed.current = true;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // on screen already
    setPhase("from");
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { io.disconnect(); setPhase("in"); }
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  return (
    <Tag ref={ref} className={className}>
      {phase === "plain" ? text : <Units text={text} units={units} lang={lang} phase={phase} />}
    </Tag>
  );
}

/**
 * A page title that rises in unit by unit when the reader ARRIVES by client
 * navigation (tapping a product card), and is plain text on a first load —
 * the LCP rule. Settles to plain text, like every split heading.
 */
export function NavHeading({ as: Tag = "h1", text, lang, className }: {
  as?: "h1" | "h2"; text: string; lang: Lang; className?: string;
}) {
  const [entering] = useState(isClientNavigation);
  return <Tag className={className}><SplitText text={text} lang={lang} play={entering} /></Tag>;
}
