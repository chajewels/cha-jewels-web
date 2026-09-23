"use client";
import { useReveal } from "@/components/fx/reveal";

/**
 * A large gold opening quotation mark that draws itself when the testimonials
 * come into view: the outline traces round (SVG pathLength + dash offset),
 * then the gold fills in. Ornament only — aria-hidden.
 *
 * Same visibility rule as every reveal (components/fx/reveal.tsx): rendered
 * finished from the server, drawn from nothing only if measured below the
 * fold after hydration. Reduced motion: finished, always. CSS in
 * app/globals.css, "QUOTE MARK".
 */
// Two teardrop commas, the shape of a “ set in a high-contrast serif.
const COMMA = (x: number) =>
  `M${x + 20} 4C${x + 9} 8 ${x + 3} 16 ${x + 3} 28c0 8 5 13 11 13s10-4 10-10c0-6-4-10-10-10-1 0-2 0-3 1 1-7 6-12 14-15z`;

export function QuoteMark({ className = "" }: { className?: string }) {
  const { ref, state } = useReveal<HTMLDivElement>(0.6);
  return (
    <div ref={ref} aria-hidden="true" data-reveal={state} className={`quote-mark ${className}`}>
      <svg width="64" height="46" viewBox="0 0 58 44" fill="none">
        <path d={COMMA(0)} pathLength={1} className="quote-mark__path" />
        <path d={COMMA(30)} pathLength={1} className="quote-mark__path" style={{ ["--q" as string]: 1 }} />
      </svg>
    </div>
  );
}
