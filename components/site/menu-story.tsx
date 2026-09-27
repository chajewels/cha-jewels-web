"use client";
import { useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
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
 * Company mega-menus (owner decision on PR #168, 2026-09-27: it replaces the
 * piece of the month and the contact card).
 *
 * THE SAME STORIES AND THE SAME RULES as the home page's Customer Stories
 * (lib/stories.ts): the customer's words exactly as the Hub returns them,
 * with their own line breaks (`whitespace-pre-wrap`); stars, item, name,
 * location and month + year as there; a layaway story on the English site only.
 * No typing animation here.
 *
 * LONG STORIES ARE NEVER CUT. The panel rotates through the stories that fit
 * it — the home section's own "l" and "m" sizes (up to 260 characters in
 * English, about 143 in Japanese) — and never shows part of one. Only if no
 * published story is that short does it take the longer ones, and then the
 * quote scrolls inside the panel (the whole text is still there), with a
 * keyboard-focusable scroll area.
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
      <blockquote
        lang={s.qLang}
        className={`mt-4 ${scrolls ? "max-h-[16rem] overflow-y-auto overscroll-contain pr-2 focus-visible:outline-offset-2" : ""}`}
        tabIndex={scrolls ? 0 : undefined}
      >
        <p className={`whitespace-pre-wrap text-[17px] leading-relaxed text-chalk ${s.qLang === "ja" ? "font-jp" : "font-display"}`}>{s.quote}</p>
      </blockquote>
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
