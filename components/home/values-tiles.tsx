"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Hammer, Scale, ShieldCheck, Sparkles } from "lucide-react";
import { VALUE_BURST } from "@/lib/motion";
import { segment } from "@/components/fx/segment";
import { useReduced } from "@/components/fx/media";
import { graphemes } from "@/lib/story-timing";
import type { Lang } from "@/lib/i18n";

const ICONS = [Sparkles, Scale, Hammer, ShieldCheck];

type Tile = "plain" | "armed" | "play";
type Letter = { ch: string; d: number };
type Piece = { text: string; units: { space: boolean; text: string; letters: Letter[] }[] };

/**
 * THE FOUR VALUE TILES, AND THEIR TEXT BURST. Owner approval 2026-09-26: text
 * only. When a tile is on screen, its title and then its description arrive
 * letter by letter, each letter with a quick gold-pale flash and a small pop,
 * settling to the text's own colour. No card glow, no rays, no particles
 * (DESIGN.md "no particles" stands). Timings: VALUE_BURST in lib/motion.ts.
 *
 * IN ORDER, AND ONLY WHEN SEEN. The tiles play 1 → 2 → 3 → 4. Each waits for
 * two things: the tile before it to be nearly done (the next starts
 * VALUE_BURST.overlap before the last letter settles), and its own tile to be
 * VALUE_BURST.inView on screen at that moment. On a desktop the four tiles come into view
 * together, so they simply run in sequence; on a phone they are stacked and
 * each one starts when the reader reaches it.
 *
 * THE SERVER RENDERS THE TEXT, PLAIN AND VISIBLE — for search, screen readers
 * and a slow phone alike. After hydration, only a tile off screen is
 * "armed": its text becomes an `sr-only` copy (the whole sentence, read once)
 * plus an `aria-hidden` row of letters that are transparent until they play.
 * Nobody sees a tile go blank, because it is off screen when it does. A tile
 * already on screen stays as it is. When a tile's last letter has settled, it
 * goes back to plain text: no letter spans left behind.
 *
 * EVERY TIME THE SECTION COMES INTO VIEW (owner decision 2026-09-27; it was
 * once per visit). When the whole section has left the viewport it is reset —
 * pending letters cancelled, all four tiles armed — so the next entry, from
 * either direction, replays 1 → 2 → 3 → 4 from the start. Leaving mid-sequence
 * stops it cleanly: the reset happens off screen, so no half-finished letters
 * are ever seen. Reduced motion: never armed — the text is simply there, and
 * nothing replays.
 *
 * LINE BREAKS DO NOT MOVE. English splits into words (each an unbreakable
 * inline-block of letters, real spaces between them) and Japanese into
 * characters with kinsoku kept (components/fx/segment.ts), so the lines break
 * where the plain text breaks. Kerning is off while the letters are split
 * (`.vb-on`), matching the split letters' own advance widths.
 */
export function ValuesTiles({ values, lang }: { values: { h: string; p: string }[]; lang: Lang }) {
  const reduced = useReduced();
  const [tiles, setTiles] = useState<Tile[]>(() => values.map(() => "plain"));
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  // Every letter's delay, from the start of its tile, and the tile's length.
  const plans = useMemo(() => values.map(({ h, p }) => {
    const cps = VALUE_BURST.cps[lang];
    let k = 0;
    const piece = (text: string, start: number): Piece => ({
      text,
      units: segment(text, lang).map((u) => ({
        space: u.space,
        text: u.text,
        letters: u.space ? [] : graphemes(u.text, lang).map((ch) => ({ ch, d: start + k++ / cps })),
      })),
    });
    const title = piece(h, 0);
    const titleLen = k;
    k = 0;
    const descStart = titleLen / cps + VALUE_BURST.beat;
    const desc = piece(p, descStart);
    const lastLetter = descStart + Math.max(0, k - 1) / cps;
    return { title, desc, total: lastLetter + VALUE_BURST.letter };
  }), [values, lang]);

  useEffect(() => {
    if (reduced === null) return;
    if (reduced) { setTiles(values.map(() => "plain")); return; }

    const els = refs.current;
    const n = values.length;
    /** Each tile at least VALUE_BURST.inView on screen, now. */
    const seen = values.map(() => false);
    /** Each tile at least partly on screen, now: all false = the section has left. */
    const near = values.map(() => false);
    let timers: ReturnType<typeof setTimeout>[] = [];
    let running = false;   // a sequence may start or continue
    let pristine = false;  // every tile armed and none played yet
    let next = 0;          // the tile whose turn it is
    let readyAt = 0;       // performance.now() at which `next` may start
    const clear = () => { timers.forEach(clearTimeout); timers = []; };

    // THE RESET. Only ever while the whole section is off screen, so nobody
    // sees a tile go blank: every pending letter, turn and settle is cancelled
    // and all four tiles go back to armed, ready to replay from tile 1.
    const arm = () => {
      clear();
      running = true; pristine = true; next = 0; readyAt = 0;
      setTiles(values.map(() => "armed"));
    };

    const run = () => {
      if (!running || next >= n || !seen[next]) return;
      const wait = readyAt - performance.now();
      if (wait > 0) { timers.push(setTimeout(run, wait)); return; }
      const i = next;
      pristine = false;
      setTiles((t) => t.map((s, j) => (j === i ? "play" : s)));
      const total = plans[i].total * 1000;
      readyAt = performance.now() + total - VALUE_BURST.overlap * 1000;
      // Settled: back to plain text, no letter spans left behind.
      timers.push(setTimeout(() => setTiles((t) => t.map((s, j) => (j === i ? "plain" : s))), total));
      next = i + 1;
      if (next >= n) running = false;
      run();
    };

    // FIRST LOAD, as approved: a tile already on screen keeps its text and
    // counts as played; the ones still below the fold are armed and play in
    // order when reached.
    const below = els.map((el) => !!el && el.getBoundingClientRect().top >= window.innerHeight);
    if (below.every(Boolean)) arm();
    else if (below.some(Boolean)) {
      setTiles(below.map((a) => (a ? "armed" : "plain")));
      running = true;
      next = below.indexOf(true);
    }

    // `seen` is "on screen NOW": a tile whose turn comes after the reader has
    // scrolled past it waits, armed, until they are back.
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const i = els.indexOf(e.target as HTMLDivElement);
        if (i >= 0) seen[i] = e.isIntersecting;
      }
      run();
    }, { threshold: VALUE_BURST.inView });
    // EVERY ENTRY REPLAYS (owner decision 2026-09-27; it was once per visit).
    // When the last part of the section leaves the viewport, it is reset, so
    // the next entry — from below or from above — plays 1 → 2 → 3 → 4 again.
    const vis = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const i = els.indexOf(e.target as HTMLDivElement);
        if (i >= 0) near[i] = e.isIntersecting;
      }
      if (!near.some(Boolean) && !pristine) arm();
    }, { threshold: 0 });
    els.forEach((el) => { if (el) { io.observe(el); vis.observe(el); } });
    return () => { io.disconnect(); vis.disconnect(); clear(); };
    // Runs once the setting is known; the plan is fixed for the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced]);

  return (
    <>
      {values.map(({ h, p }, i) => {
        const Icon = ICONS[i % ICONS.length];
        const state = tiles[i];
        return (
          <div
            key={h}
            ref={(el) => { refs.current[i] = el; }}
            data-burst={state}
            className="flex w-full flex-col gap-2 rounded-sm bg-charcoal p-5 text-chalk shadow-sm lg:p-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-widest text-gold-pale" aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
              <Icon aria-hidden="true" className="h-5 w-5 text-gold-pale" />
            </div>
            <h3 className="font-display text-xl text-chalk lg:text-2xl">{state === "plain" ? h : <Burst piece={plans[i].title} />}</h3>
            <p className="text-sm leading-relaxed text-chalk/75">{state === "plain" ? p : <Burst piece={plans[i].desc} />}</p>
          </div>
        );
      })}
    </>
  );
}

/** The sentence once for assistive tech, and its letters on screen. */
function Burst({ piece }: { piece: Piece }) {
  return (
    <>
      <span className="sr-only">{piece.text}</span>
      <span className="vb-on" aria-hidden="true">
        {piece.units.map((u, i) => u.space ? u.text : (
          <span key={i} className="vb-w">
            {u.letters.map((l, j) => <span key={j} className="vb-l" style={{ animationDelay: `${l.d.toFixed(3)}s` }}>{l.ch}</span>)}
          </span>
        ))}
      </span>
    </>
  );
}
