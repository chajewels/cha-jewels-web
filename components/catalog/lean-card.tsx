"use client";

import { useRef, type ReactNode } from "react";

/**
 * THE CARD THAT LEANS TO THE CURSOR (Brewns, mechanics only — docs/design-refs/
 * brewns/: the card tilts a few degrees toward the pointer and lifts). A pure
 * CSS transform written from the pointer on a fine pointer only (never touch:
 * a sticky lean would freeze under a finger); no WebGL, no model — the product
 * cards stay 3D-free (D-4). Reduced motion and coarse pointers: no lean.
 */
const MAX_DEG = 5;

export function LeanCard({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const set = (rx: number, ry: number, lift: number) => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      el.style.setProperty("--lean-x", `${rx.toFixed(2)}deg`);
      el.style.setProperty("--lean-y", `${ry.toFixed(2)}deg`);
      el.style.setProperty("--lean-z", `${lift}px`);
    });
  };
  const ok = () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)").matches;
  return (
    <div
      ref={ref}
      className="lean"
      onPointerMove={(e) => {
        if (!ok()) return;
        const r = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        set(-py * MAX_DEG * 2, px * MAX_DEG * 2, 10);
      }}
      onPointerLeave={() => set(0, 0, 0)}
    >
      {children}
    </div>
  );
}
