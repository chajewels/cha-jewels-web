"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Star } from "lucide-react";
import { STAGGER, STORY } from "@/lib/motion";
import { graphemes, storyTiming, type QuoteLang } from "@/lib/story-timing";
import { useFinePointer, useReduced } from "@/components/fx/media";

/** One story as the server prepared it (components/home/testimonials.tsx). `quote` is the Hub's text, untouched. */
export type Story = {
  id: string;
  quote: string;
  qLang: QuoteLang;
  size: "l" | "m" | "s";
  name: string;
  item: string | null;
  rating: number | null;
  location: string | null;
  date: { iso: string; label: string } | null;
};

type Labels = { prev: string; next: string; pause: string; play: string; upNext: string };

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * CUSTOMER STORIES: ONE STORY AT A TIME, TYPED. Owner approval 2026-09-26,
 * built as comped (reference/section-comps/NOTES.md). Timings: STORY in
 * lib/motion.ts; the arithmetic: lib/story-timing.ts.
 *
 * TWO LAYERS, ONE BOX. Each quote is in the page as whole, real text from the
 * first paint (`.story-q-full`): screen readers, search, find-in-page and copy
 * get every word at once. While a story types, that text is transparent and an
 * `aria-hidden` layer on top shows the typed part, the caret, and the untyped
 * rest in transparent ink. Because the rest is still there, every line breaks
 * where the finished quote breaks — no word jumps down a line as it is typed.
 * The typing writes two spans' text directly, once per new character; React
 * re-renders only when a story changes phase.
 *
 * NO HEIGHT CHANGE. Every story sits in the same grid cell, so the stage is
 * always as tall as the tallest story and the page below never moves.
 *
 * THE SERVER RENDERS STORY 1 COMPLETE. After hydration, a stage still below the
 * fold is reset to type its first story when it is seen (nobody watches it
 * empty); a stage already on screen keeps the finished story and holds.
 *
 * BEHAVIOUR.
 *   - Tap or click a typing story: it completes at once and the hold starts. A
 *     finished story ignores taps, so a stray tap never skips one.
 *   - Pause completes the current story, then nothing moves. Previous and next
 *     still work while paused, and each story arrives complete.
 *   - Swipe (touch): a horizontal drag past STORY.swipe px changes story;
 *     vertical scrolling is untouched (`touch-action: pan-y`).
 *   - The hold stands still under a resting mouse, while keyboard focus is in
 *     the section, off screen and in a hidden tab. Typing waits off screen and
 *     in a hidden tab too; the loop does not run at all then.
 *
 * CAROUSEL SEMANTICS (WAI-ARIA carousel pattern): the section is the carousel
 * (testimonials.tsx), each story a "slide" labelled "3 / 16", inactive stories
 * `inert`, and the stage is `aria-live="off"` while it plays by itself and
 * "polite" when it does not, so a story is announced only when the reader
 * changed it.
 *
 * REDUCED MOTION: every story complete, no typing, no auto-advance, no pause
 * button and no progress line — decided by CSS for the controls and by never
 * starting the engine, so there is nothing to swap after mount.
 */
export function StoryShow({ stories, labels, head }: { stories: Story[]; labels: Labels; head: React.ReactNode }) {
  const count = stories.length;
  const [cur, setCur] = useState(0);
  const [leaving, setLeaving] = useState<{ i: number; done: boolean } | null>(null);
  const [entering, setEntering] = useState(false);
  const [done, setDone] = useState(true);
  const [paused, setPaused] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const reduced = useReduced();
  const fine = useFinePointer();
  // Not yet known (null) counts as still: motion starts only once the reader's
  // setting has been read.
  const still = reduced !== false;

  const stageRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLElement>(null);
  const typedRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const restRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  // The engine's clock, read every frame. `t` is ms into the current phase;
  // typing starts from a negative `t`, the wait before the first character.
  const eng = useRef({ cur: 0, phase: "hold" as "type" | "hold", t: 0, shown: -1, paused: false, still: true, hover: false, focus: false, armed: false });

  const meta = useMemo(() => stories.map((s) => {
    const g = graphemes(s.quote, s.qLang);
    return { g, ...storyTiming(g.length, s.qLang) };
  }), [stories]);

  const paint = useCallback((i: number, n: number) => {
    const typed = typedRefs.current[i], rest = restRefs.current[i], g = meta[i].g;
    if (typed) typed.textContent = g.slice(0, n).join("");
    if (rest) rest.textContent = g.slice(n).join("");
  }, [meta]);

  const progress = (f: number) => {
    if (progRef.current) progRef.current.style.transform = `scaleX(${Math.min(1, Math.max(0, f))})`;
  };

  const complete = useCallback(() => {
    const e = eng.current;
    if (e.phase === "type") { e.phase = "hold"; e.t = 0; }
    setDone(true);
  }, []);

  const go = useCallback((to: number) => {
    const e = eng.current;
    if (count < 2) return;
    const i = ((to % count) + count) % count;
    if (i === e.cur) return;
    setLeaving({ i: e.cur, done: e.phase === "hold" });
    e.cur = i;
    setCur(i);
    progress(0);
    if (e.paused || e.still) {
      e.phase = "hold"; e.t = 0; setDone(true);
    } else {
      // The old story leaves, the name and stars settle, then the first character.
      e.phase = "type"; e.t = -(STORY.out + STORY.lead) * 1000; e.shown = -1;
      paint(i, 0);
      setDone(false);
    }
    timers.current.forEach(clearTimeout);
    timers.current = [setTimeout(() => setLeaving(null), STORY.out * 1000)];
    if (!e.still) {
      setEntering(true);
      timers.current.push(setTimeout(() => setEntering(false), STORY.in * 1000));
    }
  }, [count, paint]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Reduced motion known (or changed mid-visit).
  useEffect(() => {
    const e = eng.current;
    e.still = still;
    if (reduced === null) return;
    if (reduced) { complete(); return; }
    if (e.armed) return;
    e.armed = true;
    // Below the fold at hydration: story 1 will type when it is seen. On screen
    // already: it stays finished — nothing is taken back from a reader.
    const stage = stageRef.current;
    if (stage && stage.getBoundingClientRect().top >= window.innerHeight) {
      e.phase = "type"; e.t = -STORY.lead * 1000; e.shown = -1;
      paint(e.cur, 0);
      setDone(false);
    }
  }, [reduced, still, complete, paint]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const io = new IntersectionObserver(([x]) => setOnScreen(x.isIntersecting), { threshold: 0.35 });
    io.observe(stage);
    const vis = () => setTabVisible(document.visibilityState === "visible");
    vis();
    document.addEventListener("visibilitychange", vis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, []);

  // THE LOOP. One requestAnimationFrame, running only while the stage is on
  // screen, the tab is visible, and the reader has not paused or asked for no
  // motion.
  useEffect(() => {
    if (still || paused || !onScreen || !tabVisible) return;
    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      const e = eng.current, m = meta[e.cur];
      const dt = Math.min(now - last, 100);
      last = now;
      if (e.phase === "type") {
        e.t += dt;
        const n = e.t <= 0 ? 0 : Math.min(m.g.length, Math.floor((e.t / 1000 / m.type) * m.g.length));
        if (n !== e.shown) { e.shown = n; paint(e.cur, n); }
        progress(Math.max(0, e.t / 1000) / (m.type + m.hold));
        if (n >= m.g.length) complete();
      } else {
        if (count < 2) return; // one story: typed once, then it simply stays
        if (!e.hover && !e.focus) e.t += dt;
        progress((m.type + e.t / 1000) / (m.type + m.hold));
        if (e.t >= m.hold * 1000) go(e.cur + 1);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [still, paused, onScreen, tabVisible, meta, count, paint, complete, go]);

  const toggle = () => {
    const p = !paused;
    setPaused(p);
    eng.current.paused = p;
    if (p) { complete(); progress(0); }
  };

  const upNext = Array.from({ length: Math.min(3, count - 1) }, (_, j) => (cur + 1 + j) % count);

  return (
    <div
      className="story-grid"
      // Keyboard focus anywhere in the section holds the countdown. Only focus
      // that shows a ring: a mouse click on "next" focuses the button in some
      // browsers, and that must not stop the show.
      onFocus={(ev) => { eng.current.focus = ev.target instanceof HTMLElement && ev.target.matches(":focus-visible"); }}
      onBlur={() => { eng.current.focus = false; }}
    >
      <div className="story-head">{head}</div>

      {count > 1 && (
        <div className="story-next">
          <p className="story-label" aria-hidden="true">{labels.upNext}</p>
          <ol aria-label={labels.upNext}>
            {upNext.map((i, j) => (
              <li key={`${cur}-${i}`} style={{ animationDelay: `${j * STAGGER.card}s` }}>
                <button type="button" onClick={() => go(i)}>
                  <span className="story-next-name">{stories[i].name}</span>
                  {stories[i].item && <span className="story-next-item">{stories[i].item}</span>}
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div
        ref={stageRef}
        className="story-stage"
        aria-live={still || paused ? "polite" : "off"}
        onClick={() => {
          if (swiped.current) { swiped.current = false; return; }
          if (eng.current.phase === "type") complete();
        }}
        onMouseEnter={() => { if (fine) eng.current.hover = true; }}
        onMouseLeave={() => { eng.current.hover = false; }}
        onPointerDown={(ev) => { swipe.current = ev.pointerType === "mouse" ? null : { x: ev.clientX, y: ev.clientY }; }}
        onPointerCancel={() => { swipe.current = null; }}
        onPointerUp={(ev) => {
          const s = swipe.current;
          swipe.current = null;
          if (!s) return;
          const dx = ev.clientX - s.x, dy = ev.clientY - s.y;
          if (Math.abs(dx) > STORY.swipe && Math.abs(dx) > Math.abs(dy)) {
            swiped.current = true;
            go(eng.current.cur + (dx < 0 ? 1 : -1));
          }
        }}
      >
        {stories.map((s, i) => {
          const on = i === cur;
          const leave = !on && leaving?.i === i;
          const isDone = on ? done : leave ? leaving.done : true;
          return (
            <article
              key={s.id}
              className="story"
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} / ${count}`}
              data-on={on ? "" : undefined}
              data-leave={leave ? "" : undefined}
              data-enter={on && entering ? "" : undefined}
              data-done={isDone ? "" : undefined}
              inert={!on}
            >
              <div className="story-top">
                {s.rating != null ? (
                  <span role="img" className="story-stars" aria-label={`${s.rating} / 5`}>
                    {[0, 1, 2, 3, 4].map((k) => <Star key={k} aria-hidden="true" className={k < s.rating! ? "fill-current" : "opacity-30"} />)}
                  </span>
                ) : <span />}
                {s.item && <span className="story-chip"><span aria-hidden="true" className="story-chip-dot" /><span className="truncate">{s.item}</span></span>}
              </div>
              <blockquote className="story-q" data-size={s.size} lang={s.qLang}>
                <p className="story-q-full">{s.quote}</p>
                <p className="story-q-type" aria-hidden="true">
                  <span ref={(el) => { typedRefs.current[i] = el; }} />
                  <span className="story-caret" />
                  <span className="story-q-rest" ref={(el) => { restRefs.current[i] = el; }} />
                </p>
              </blockquote>
              <div className="story-who">
                <p className="story-name">{s.name}</p>
                {(s.location || s.date) && (
                  <p className="story-meta">
                    {s.location}
                    {s.location && s.date && " · "}
                    {s.date && <time dateTime={s.date.iso}>{s.date.label}</time>}
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {count > 1 && (
        <div className="story-ctrl">
          <p className="story-count" aria-hidden="true">{pad(cur + 1)}<span> / {pad(count)}</span></p>
          <div className="story-prog" aria-hidden="true"><i ref={progRef} /></div>
          <div className="story-btns">
            <button type="button" className="story-round" aria-label={labels.prev} onClick={() => go(eng.current.cur - 1)}>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m15 5-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" className="story-round story-pause" aria-label={paused ? labels.play : labels.pause} onClick={toggle}>
              {paused
                ? <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z" /></svg>
                : <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M7 5h3.2v14H7zM13.8 5H17v14h-3.2z" /></svg>}
            </button>
            <button type="button" className="story-round" aria-label={labels.next} onClick={() => go(eng.current.cur + 1)}>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m9 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
