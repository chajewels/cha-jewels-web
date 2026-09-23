"use client";
import { useEffect, useRef, useState } from "react";
import { DUR, EASE_LUX } from "@/lib/motion";
import { useReduced } from "@/components/fx/media";

/** cubic-bezier(x1, y1, x2, y2) as a function of time, the way CSS evaluates it. */
function bezier([x1, y1, x2, y2]: readonly number[]) {
  const a = (p1: number, p2: number) => 1 - 3 * p2 + 3 * p1;
  const b = (p1: number, p2: number) => 3 * p2 - 6 * p1;
  const c = (p1: number) => 3 * p1;
  const at = (t: number, p1: number, p2: number) => ((a(p1, p2) * t + b(p1, p2)) * t + c(p1)) * t;
  const slope = (t: number, p1: number, p2: number) => 3 * a(p1, p2) * t * t + 2 * b(p1, p2) * t + c(p1);
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 6; i++) { const s = slope(t, x1, x2); if (Math.abs(s) < 1e-6) break; t -= (at(t, x1, x2) - x) / s; }
    return at(Math.min(1, Math.max(0, t)), y1, y2);
  };
}
const ease = bezier(EASE_LUX);

/**
 * A figure that ROLLS to its new value — DISPLAY ONLY.
 *
 * `value` is exactly what the caller already had (here: the Hub's layaway
 * quote); nothing is computed from it but the frames in between. Each frame
 * shows `format(round(v))`, and the last frame is `format(value)` itself, so
 * what the reader is left with is character-for-character what the static
 * cell showed before — same amount, same rounding, same currency.
 *
 * Assistive tech hears the final figure once: the rolling digits are
 * aria-hidden and the exact value sits beside them in an sr-only span, so a
 * polite live region around the cells announces one change, not thirty.
 *
 * null shows the placeholder; the next real value rolls from the last real
 * value shown. Reduced motion: no roll. Uses the site's EASE_LUX curve over
 * DUR.reveal, as CSS would.
 */
export function RollingValue({ value, format, placeholder = "—" }: {
  value: number | null; format: (n: number) => string; placeholder?: string;
}) {
  const reduced = useReduced();
  const [shown, setShown] = useState<number | null>(value);
  const last = useRef<number | null>(value);
  const frame = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(frame.current);
    if (value === null) { setShown(null); return; }
    const from = last.current;
    last.current = value;
    if (from === null || from === value || reduced !== false) { setShown(value); return; }
    const t0 = performance.now();
    const dur = DUR.reveal * 1000;
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      if (p >= 1) { setShown(value); return; }
      setShown(from + (value - from) * ease(p));
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [value, reduced]);

  if (value === null || shown === null) return <>{placeholder}</>;
  const done = shown === value;
  return (
    <>
      <span aria-hidden="true" style={{ fontVariantNumeric: "tabular-nums" }}>{done ? format(value) : format(Math.round(shown))}</span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
