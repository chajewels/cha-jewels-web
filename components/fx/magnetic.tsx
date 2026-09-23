"use client";
// Pattern: the "magnetic button" and "shine border" components on 21st.dev
// (MIT, via Magic UI / community ports). Rewritten onto our tokens: CSS
// custom properties timed by lib/motion.ts, a CSS-only border, fine-pointer and reduced-motion
// guards. No code copied verbatim; no dependency added.
import { useRef } from "react";
import { MAGNET_MAX } from "@/lib/motion";
import { useFinePointer, useReduced } from "@/components/fx/media";

/**
 * A primary call to action that leans toward the pointer and lights a gold
 * border when it is hovered or focused.
 *
 * MAGNETIC: at most MAGNET_MAX px of travel. The offset is written to two CSS
 * custom properties and the element eases toward them over DUR.reveal on
 * EASE_LUX (app/globals.css, `.magnetic`) — so it trails the pointer and
 * settles without overshoot. That is a CSS transition rather than motion's
 * useSpring on purpose: the spring runtime cost gzipped kilobytes on the
 * homepage for a 6px lean (docs/perf-baseline.md), and a long ease-out
 * restarted on every pointer move reads the same. No React render per move.
 * Only under
 * (hover: hover) and (pointer: fine) and with reduced motion off — both
 * subscribed. Everywhere else the element simply does not move.
 *
 * SHINE BORDER: a 1.5px gold ring drawn outside the button (app/globals.css,
 * `.shine-border`), revealed on hover and on keyboard focus, with light
 * travelling around it. On touch there is no hover, so the ring passes once
 * when the page shows it — the gentler in-view version the brief asks for —
 * and the existing `.btn-press` scale is the tap feedback.
 *
 * The wrapper is an inline-flex span around the real <a>/<button>: focus,
 * keyboard activation and the accessible name are the child's, unchanged.
 */
export function Magnetic({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const fine = useFinePointer();
  const reduced = useReduced();
  const live = fine === true && reduced === false;

  function move(e: React.PointerEvent) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    el.style.setProperty("--mx", `${(Math.max(-1, Math.min(1, dx)) * MAGNET_MAX).toFixed(2)}px`);
    el.style.setProperty("--my", `${(Math.max(-1, Math.min(1, dy)) * MAGNET_MAX).toFixed(2)}px`);
  }
  function leave() { ref.current?.style.removeProperty("--mx"); ref.current?.style.removeProperty("--my"); }

  return (
    <span
      ref={ref}
      className={`shine-border inline-flex ${live ? "magnetic" : ""} ${className}`}
      onPointerMove={live ? move : undefined}
      onPointerLeave={live ? leave : undefined}
    >
      {children}
    </span>
  );
}
