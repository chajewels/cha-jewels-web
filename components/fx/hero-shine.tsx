"use client";
import { useEffect, useState } from "react";
import ShinyText from "@/components/fx/shiny-text";
import { useHeroMotion } from "@/components/home/hero";

/**
 * THE HEADLINE'S GILT LINE: LIGHT PASSING OVER POLISHED GOLD (owner request
 * 2026-10-26). React Bits' ShinyText (components/fx/shiny-text.tsx, installed
 * with `npx shadcn@latest add @react-bits/ShinyText-TS-TW` — never edit it
 * here, re-install it) over the hero's second headline line, EN and JA. It
 * replaces the one-time `.hd-gilt` sweep on that line; the category slides'
 * titles keep `.hd-gilt`.
 *
 * GOLD FROM THE TOKENS. ShinyText mixes its colours on a canvas, which cannot
 * read `var()`, so the first render paints `var(--c-gold)` (flat gold from the
 * server markup, before hydration) and the mount swaps in the same tokens
 * resolved from :root (tailwind.config.ts) — the same colour, so nothing moves.
 *
 * SLOW AND QUIET. One pass every SPEED + PAUSE seconds, gold to gold-pale and
 * back, a soft wide band. The letters are never lighter than gold-pale nor
 * darker than gold, so the line reads the same mid-sweep as at rest.
 *
 * STILL: reduced motion (ShinyText reads the media query itself and keeps the
 * flat base colour), the pause button, off screen, a hidden tab, or another
 * slide up — all `disabled`, which shows static gold, never a band frozen
 * half-way across a word.
 */
const SPEED = 5;
const PAUSE = 2.5;

export function HeroShine({ children }: { children: React.ReactNode }) {
  const { sheenOn, active } = useHeroMotion();
  const [tone, setTone] = useState({ color: "var(--c-gold)", shine: "var(--c-gold-pale)" });
  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    const color = root.getPropertyValue("--c-gold").trim();
    const shine = root.getPropertyValue("--c-gold-pale").trim();
    if (color && shine) setTone({ color, shine });
  }, []);
  return (
    <ShinyText
      color={tone.color}
      shineColor={tone.shine}
      speed={SPEED}
      delay={PAUSE}
      angle={110}
      shineWidth={36}
      softness={1}
      disabled={!sheenOn || active !== 0}
    >
      {children}
    </ShinyText>
  );
}
