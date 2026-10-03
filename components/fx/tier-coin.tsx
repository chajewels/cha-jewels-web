"use client";
import { useRef, type ReactNode } from "react";
import { TIER_ICON as T } from "@/lib/motion";
import { useFinePointer, useReduced } from "@/components/fx/media";

/**
 * The tier medallion turned in the hand (owner decision A, 2026-10-03): on a
 * fine pointer the coin tilts a few degrees after the cursor and settles back
 * when it leaves. Writes two CSS variables the stylesheet
 * (tier-icon-style.tsx) applies as rotateX / rotateY under a perspective; no
 * layout, no re-render. Touch screens and reduced motion get the still coin.
 */
export function TierCoin({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);
  const fine = useFinePointer() === true;
  const reduced = useReduced() === true;
  const live = fine && !reduced;

  function move(e: React.PointerEvent<HTMLSpanElement>) {
    const el = ref.current;
    if (!el || !live) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--ti-ry", `${(x * 2 * T.tiltMax).toFixed(1)}deg`);
    el.style.setProperty("--ti-rx", `${(-y * 2 * T.tiltMax).toFixed(1)}deg`);
    el.dataset.tilting = "";
  }
  function leave() {
    const el = ref.current;
    if (!el) return;
    delete el.dataset.tilting;
    el.style.removeProperty("--ti-rx");
    el.style.removeProperty("--ti-ry");
  }
  return (
    <span ref={ref} className="ti-coin" onPointerMove={live ? move : undefined} onPointerLeave={live ? leave : undefined}>
      {children}
    </span>
  );
}
