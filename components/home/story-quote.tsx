import type { Story } from "@/lib/stories";

/**
 * THE TYPED QUOTE, shared by every place a customer story is typed: the home
 * page's Customer Stories (components/home/story-show.tsx) and the header's
 * mega-menu panels (components/site/menu-story.tsx; owner decision on PR #168,
 * 2026-09-27: the same typing, not a variant). Timings are STORY in
 * lib/motion.ts and the arithmetic lib/story-timing.ts, for both.
 *
 * TWO LAYERS, ONE BOX (the CSS is `.story-q` in app/globals.css):
 *   .story-q-full  the customer's words, whole, from the first paint — real
 *                  text for screen readers, search and copy. Transparent while
 *                  the quote is typing (`data-typing`).
 *   .story-q-type  aria-hidden: the typed part, the caret, and the untyped rest
 *                  in transparent ink — so the box is full size from the start
 *                  and every line breaks where the finished quote breaks.
 * The caller writes the typed and rest text straight into the two spans
 * (`typedRef`, `restRef`), once per new character; React is not involved.
 */
export function StoryQuote({ story, typing, typedRef, restRef, className = "" }: {
  story: Pick<Story, "quote" | "qLang" | "size">;
  typing: boolean;
  typedRef: (el: HTMLSpanElement | null) => void;
  restRef: (el: HTMLSpanElement | null) => void;
  className?: string;
}) {
  return (
    <blockquote className={`story-q ${className}`} data-size={story.size} data-typing={typing ? "" : undefined} lang={story.qLang}>
      <p className="story-q-full">{story.quote}</p>
      <p className="story-q-type" aria-hidden="true">
        <span ref={typedRef} />
        <span className="story-caret" />
        <span className="story-q-rest" ref={restRef} />
      </p>
    </blockquote>
  );
}

/**
 * How many characters are typed `tMs` into typing a quote of `length`
 * characters that takes `typeSec` seconds (storyTiming). A negative `tMs` is
 * the wait before the first character.
 */
export function typedCount(tMs: number, length: number, typeSec: number): number {
  return tMs <= 0 ? 0 : Math.min(length, Math.floor((tMs / 1000 / typeSec) * length));
}
