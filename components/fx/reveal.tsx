"use client";
import { useEffect, useRef, useState } from "react";
import * as m from "motion/react-m";
import type { Variants } from "motion/react";
import { RISE, STAGGER, T } from "@/lib/motion";
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

/** Rise + fade. `hidden` is instant: it only ever happens off screen. */
export const RISE_VARIANTS: Variants = {
  hidden: { opacity: 0, y: RISE, transition: { duration: 0 } },
  shown: { opacity: 1, y: 0, transition: T.reveal },
};

/**
 * A grid whose items arrive one after another. The group owns the state and
 * the stagger; each <RevealItem> (or any `m` element with "hidden"/"shown"
 * variants of its own) inherits it.
 *
 * The state is also on the element as `data-reveal`, so an entrance that is
 * only a timed CSS transition — the collection cards' hairline and wipe
 * (components/fx/card-entrance.tsx) — can follow it without shipping any
 * motion code of its own.
 */
export function RevealGroup({ className, children, stagger = STAGGER.base, amount = 0.15 }: {
  className?: string; children: React.ReactNode; stagger?: number; amount?: number;
}) {
  const { ref, state } = useReveal<HTMLDivElement>(amount);
  return (
    <m.div
      ref={ref}
      className={className}
      data-reveal={state}
      initial={false}
      animate={state}
      variants={{ hidden: {}, shown: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </m.div>
  );
}

export function RevealItem({ className, children }: { className?: string; children: React.ReactNode }) {
  return <m.div className={className} variants={RISE_VARIANTS}>{children}</m.div>;
}
