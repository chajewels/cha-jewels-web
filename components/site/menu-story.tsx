"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { STORY } from "@/lib/motion";
import { graphemes, storyTiming } from "@/lib/story-timing";
import { StoryQuote, typedCount } from "@/components/home/story-quote";
import type { Lang } from "@/lib/i18n";
import type { Story } from "@/lib/stories";

/**
 * Where the rotation is, shared by BOTH menus and kept for the life of the
 * page: every time either menu opens it shows the next story, so two opens in
 * a row never show the same one (with two or more stories). It starts at a
 * random story, so the first open is not always the Hub's first testimonial.
 * The panel exists only while a menu is open, and only in the browser, so the
 * random start can never differ between server and client HTML.
 */
let cursor = -1;

/**
 * A customer story in the dark right-hand panel of the Collections and
 * Company mega-menus (owner decisions on PR #168, 2026-09-27: it replaces the
 * piece of the month and the contact card, and it TYPES like the home page).
 *
 * THE SAME STORIES AND THE SAME RULES as the home page's Customer Stories
 * (lib/stories.ts): the customer's words exactly as the Hub returns them,
 * with their own line breaks; stars, item, name, location and month + year as
 * there; a layaway story on the English site only.
 *
 * THE SAME TYPING. The quote is the home section's own typed quote
 * (components/home/story-quote.tsx): the whole text is in the page from the
 * first paint for screen readers, and an aria-hidden layer types over it,
 * holding every line where the finished quote breaks — the panel is full size
 * from the start and nothing re-wraps. Speed is STORY (lib/motion.ts: 35
 * characters a second in English, 18 in Japanese, 4.5 s at most), counted by
 * lib/story-timing.ts, after the same STORY.lead pause.
 *
 *   - Every open types its story from the start; the panel mounts on open.
 *   - Tap or click the story: it completes at once.
 *   - The menu closes (Escape, Tab out, a click elsewhere, the pointer
 *     leaving): the panel unmounts and its frame loop is cancelled — nothing
 *     half-typed is left. The next open is the next story, from the start.
 *   - Reduced motion: the story is simply there, complete. The setting is read
 *     when the panel mounts, so there is no typed frame to swap afterwards.
 *
 * LONG STORIES ARE NEVER CUT. The panel rotates through the stories that fit
 * it — the home section's "l" and "m" sizes (up to 260 characters in English,
 * about 143 in Japanese). Only if no published story is that short does it
 * take the longer ones, and then the quote scrolls inside the panel (the
 * whole text is still there), with a keyboard-focusable scroll area.
 */
export function MenuStory({ stories, lang, eyebrow, moreLabel }: { stories: Story[]; lang: Lang; eyebrow: string; moreLabel: string }) {
  const fits = stories.filter((s) => s.size !== "s");
  const pool = fits.length > 0 ? fits : stories;
  const [index] = useState(() => {
    if (pool.length === 0) return -1;
    cursor = cursor < 0 ? Math.floor(Math.random() * pool.length) : (cursor + 1) % pool.length;
    return cursor;
  });
  const s = pool[index];
  const [typing, setTyping] = useState(
    () => !!s && typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const typed = useRef<HTMLSpanElement | null>(null);
  const rest = useRef<HTMLSpanElement | null>(null);

  // THE LOOP: one requestAnimationFrame while the story types, the same count
  // per frame as the home section. It ends when the last character is in, on
  // a tap, or when the panel unmounts.
  useEffect(() => {
    if (!typing || !s) return;
    const g = graphemes(s.quote, s.qLang);
    const { type } = storyTiming(g.length, s.qLang);
    const paint = (n: number) => {
      if (typed.current) typed.current.textContent = g.slice(0, n).join("");
      if (rest.current) rest.current.textContent = g.slice(n).join("");
    };
    paint(0);
    let t = -STORY.lead * 1000;
    let shown = 0;
    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      t += Math.min(now - last, 100);
      last = now;
      const n = typedCount(t, g.length, type);
      if (n !== shown) { shown = n; paint(n); }
      if (n >= g.length) { setTyping(false); return; }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [typing, s]);

  if (!s) return <div aria-hidden="true" />;
  const scrolls = fits.length === 0;
  const label = `text-[11px] font-semibold text-gold-pale ${lang === "en" ? "uppercase tracking-[0.14em]" : "tracking-[0.05em]"}`;

  return (
    <figure data-surface="dark" className="band-dark flex min-w-0 flex-col self-start bg-charcoal-deep p-6 text-chalk">
      <p className={`flex items-center gap-3 ${label}`}>
        <span aria-hidden="true" className="h-px w-7 bg-gold" />{eyebrow}
      </p>
      {s.rating != null && (
        <span role="img" aria-label={`${s.rating} / 5`} className="mt-5 flex gap-1 text-gold">
          {[0, 1, 2, 3, 4].map((k) => <Star key={k} aria-hidden="true" className={`h-4 w-4 ${k < s.rating! ? "fill-current" : "opacity-30"}`} />)}
        </span>
      )}
      {/* A tap or click completes a typing story; a finished one ignores it. */}
      <div
        onClick={() => setTyping(false)}
        className={`mt-4 ${typing ? "cursor-pointer" : ""} ${scrolls ? "max-h-[16rem] overflow-y-auto overscroll-contain pr-2 focus-visible:outline-offset-2" : ""}`}
        tabIndex={scrolls ? 0 : undefined}
      >
        <StoryQuote
          story={s}
          typing={typing}
          typedRef={(el) => { typed.current = el; }}
          restRef={(el) => { rest.current = el; }}
          className="menu-story-q"
        />
      </div>
      <figcaption className="mt-5 border-t border-rule pt-4">
        <p className="text-sm font-medium text-gold-pale">{s.name}</p>
        {(s.item || s.location || s.date) && (
          <p className="mt-1 text-xs leading-relaxed text-chalk/75">
            {[s.item, s.location].filter(Boolean).join(" · ")}
            {(s.item || s.location) && s.date && " · "}
            {s.date && <time dateTime={s.date.iso}>{s.date.label}</time>}
          </p>
        )}
      </figcaption>
      <Link role="menuitem" tabIndex={-1} href="/#customer-stories" className="mt-5 inline-flex min-h-11 w-fit items-center border-b border-gold-pale/70 text-sm font-medium text-gold-pale hover:border-gold-pale">
        {moreLabel}
      </Link>
    </figure>
  );
}
