"use client";
import { useEffect, useState } from "react";
import { SHEEN_EVERY } from "@/lib/motion";

/**
 * THE HERO'S SIGNATURE: LIGHT CROSSING THE HEADLINE.
 *
 * A narrow window of light travels left to right across the headline, and
 * inside it the letters catch gold — chalk letters turn gold-pale with a gold
 * bloom, gold letters flare toward chalk. It passes once shortly after first
 * paint (the noticeability rule: seen within 3 s, no hover, no scroll), then
 * every SHEEN_EVERY seconds while the hero is on screen and nobody has paused.
 *
 * TRANSFORM ONLY, AND ONLY THE LETTERS. The obvious sheen is a gradient band
 * over the box, which lights the photo behind as much as the words and reads
 * as a loading shimmer. This is a masked WINDOW (overflow hidden, soft edges)
 * holding a second, aria-hidden copy of the headline. The window slides one
 * way and the copy inside slides the other by exactly the same distance, on
 * the same curve — so the copy stays glued over the real letters while the
 * window moves. Both are transforms; nothing repaints (app/globals.css,
 * `.hero-sheen`).
 *
 * The real headline is never touched: it paints first, at full opacity, and
 * is the thing the LCP rule protects. The copy is decoration over it.
 *
 * `on` comes from the Hero motion context: off screen, hidden tab or the
 * pause button unmounts the window entirely, so a paused hero never shows a
 * light frozen half-way across a word. Reduced motion hides it in CSS, which
 * is decided before the first paint.
 *
 * Starts playing from the SERVER markup: the first pass is a CSS animation
 * with a short delay, so it does not wait for hydration on a slow phone.
 */
export function HeroSheen({ on, delay, children }: { on: boolean; delay?: number; children: React.ReactNode }) {
  const [pass, setPass] = useState(0);
  useEffect(() => {
    if (!on) return;
    const id = setInterval(() => setPass((p) => p + 1), SHEEN_EVERY * 1000);
    return () => clearInterval(id);
  }, [on]);
  if (!on) return null;
  return (
    <span
      key={pass}
      aria-hidden="true"
      className="hero-sheen"
      // Later passes start at once; only the first waits for the page to land.
      style={pass > 0 ? { ["--sheen-delay" as string]: "0s" } : delay != null ? { ["--sheen-delay" as string]: `${delay}s` } : undefined}
    >
      <span className="hero-sheen__copy">{children}</span>
    </span>
  );
}
