"use client";
import { useEffect, useRef, useState } from "react";
import { STAGGER } from "@/lib/motion";
import { useReduced } from "@/components/fx/media";

export type RevealState = "hidden" | "shown";

/**
 * THE SERVER RENDERS IT VISIBLE. IT HIDES ITSELF ONLY IF NOBODY CAN SEE IT.
 *
 * The usual in-view reveal ships `opacity: 0` in the HTML and fades in on
 * hydration — which, for anything that happens to sit above the fold on a
 * tall screen, is exactly the hidden-on-first-load the LCP rule forbids, and
 * a blank section for anyone whose JavaScript is slow. So the markup here is
 * the finished state. After hydration, an element that is still BELOW the
 * fold is set to its hidden pose instantly — off screen, so no one sees it
 * go — and plays its entrance when it scrolls in, once. An element already on
 * screen at that moment simply stays: there is no fold to guess at, because
 * it is measured.
 *
 * Reduced motion (live): never hides, and if the setting turns on mid-visit
 * anything still hidden is shown at once.
 *
 * The state is written to `data-reveal` and CSS plays the entrance
 * (app/globals.css, "REVEAL"). No animation library: every entrance on the
 * homepage is a fixed-time transition from one pose to another, which CSS
 * does with no runtime at all — and on a slow phone link the runtime's bytes
 * were measured delaying the hero poster, the page's LCP (docs/perf-baseline.md).
 */
export function useReveal<T extends Element>(amount = 0.25) {
  const ref = useRef<T>(null);
  const reduced = useReduced();
  const [state, setState] = useState<RevealState>("shown");
  const armed = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced === null) return;
    if (reduced) { setState("shown"); return; }
    if (armed.current) return;
    armed.current = true;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // on screen already: leave it be
    setState("hidden");
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setState("shown"); io.disconnect(); }
    }, { threshold: amount });
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, amount]);

  return { ref, state };
}

/**
 * A group whose items arrive one after another. The group owns the state;
 * each <RevealItem index={i}> rises and fades in at i × `stagger`. Anything
 * else inside can follow the same `data-reveal` in CSS — the collection
 * cards' hairline and photo wipe do (components/fx/card-entrance.tsx).
 */
export function RevealGroup({ className, children, stagger = STAGGER.base, amount = 0.15 }: {
  className?: string; children: React.ReactNode; stagger?: number; amount?: number;
}) {
  const { ref, state } = useReveal<HTMLDivElement>(amount);
  return (
    <div ref={ref} className={className} data-reveal={state} style={{ ["--stagger" as string]: `${stagger}s` }}>
      {children}
    </div>
  );
}

export function RevealItem({ index, className = "", children }: { index: number; className?: string; children: React.ReactNode }) {
  return <div className={`reveal-item ${className}`} style={{ ["--i" as string]: index }}>{children}</div>;
}
