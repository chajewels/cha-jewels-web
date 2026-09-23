"use client";
import { useReveal } from "@/components/fx/reveal";

/**
 * The section break, drawing itself: the teal diamond turns into place, then
 * two gold hairlines run outward from it. Each line is an SVG path with
 * pathLength="1", drawn by moving its dash offset from 1 to 0 — really
 * drawn, not scaled. Ornament only — aria-hidden.
 *
 * A CSS transition on `data-reveal` (app/globals.css, `.drawn-divider`), not
 * motion: a fixed-time draw needs no animation runtime, and the homepage's
 * motion budget is spent where it has to be (docs/perf-baseline.md).
 *
 * Same visibility rule as every reveal (components/fx/reveal.tsx): rendered
 * finished from the server, and only drawn from nothing if it is measured
 * below the fold after hydration. Reduced motion: finished, always.
 */
export function DrawnDivider({ className = "" }: { className?: string }) {
  const { ref, state } = useReveal<HTMLDivElement>(0.6);
  return (
    <div ref={ref} aria-hidden="true" data-reveal={state} className={`drawn-divider flex items-center justify-center py-4 ${className}`}>
      <svg width="152" height="10" viewBox="0 0 152 10" fill="none">
        {/* Each line starts at the diamond and runs outward. */}
        <path d="M68 5H0" pathLength={1} className="drawn-divider__line stroke-gold" strokeWidth="1" />
        <path d="M84 5H152" pathLength={1} className="drawn-divider__line stroke-gold" strokeWidth="1" />
        <path d="M76 1L80 5L76 9L72 5Z" className="drawn-divider__diamond fill-teal" />
      </svg>
    </div>
  );
}
