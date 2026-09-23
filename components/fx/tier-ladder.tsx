"use client";
// Pattern: the "animated border" / "border beam" components on 21st.dev (MIT,
// Magic UI and community ports) for the crown tier's conic ring. Rewritten
// onto our tokens with an @property angle, IntersectionObserver and
// visibility pauses; no code copied verbatim, no dependency added.
import { useEffect, useRef } from "react";
import { LADDER } from "@/lib/motion";
import { useReduced } from "@/components/fx/media";
import { ComponentStyle, mix } from "@/components/fx/component-style";

/**
 * The ladder's rules, inline (components/fx/component-style.tsx says why).
 *
 * The rail runs the way the tiers are read: across the top of the row when
 * they sit side by side (lg), down the left edge when they stack. `--fill` is
 * 0..1, written once per frame; nothing re-renders on scroll.
 */
const CSS = `
.fx-ladder { position: relative; }
.fx-rail { position: absolute; pointer-events: none; background: var(--c-charcoal-deep); opacity: .08; }
.fx-rail-fill { position: absolute; pointer-events: none; background: linear-gradient(var(--fx-rail-dir, 180deg), var(--c-gold-dark), var(--c-gold), var(--c-gold-pale)); box-shadow: 0 0 10px ${mix("gold", 55)}; }
.fx-rail, .fx-rail-fill { left: -14px; top: 0; width: 2px; height: 100%; }
.fx-rail-fill { transform-origin: top; transform: scaleY(var(--fill, 0)); }
@media (min-width: 1024px) {
  .fx-rail, .fx-rail-fill { left: 0; top: -14px; height: 2px; width: 100%; }
  .fx-rail-fill { --fx-rail-dir: 90deg; transform-origin: left; transform: scaleX(var(--fill, 0)); }
}
.fx-ladder li { transition: box-shadow var(--dur-reveal) var(--ease-lux); }
.fx-ladder li[data-lit] { box-shadow: 0 0 0 1px var(--c-gold), inset 0 0 28px ${mix("gold", 14)}; }
.fx-ladder li[data-lit] h3 { color: var(--c-gold-dark); transition: color var(--dur-reveal) var(--ease-lux); }

/* THE CROWN TIER: light turning slowly around its edge. */
@property --fx-crown { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
.fx-ladder li[data-crown] { position: relative; isolation: isolate; }
.fx-ladder li[data-crown]::before {
  content: ""; position: absolute; inset: 0; z-index: -1; padding: 2px; pointer-events: none;
  background: conic-gradient(from var(--fx-crown), var(--c-gold-dark), var(--c-gold-pale), var(--c-gold), var(--c-gold-dark) 40%, var(--c-gold-pale) 55%, var(--c-gold) 75%, var(--c-gold-dark));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor; mask-composite: exclude;
  animation: fx-crown-turn var(--dur-crown-lap) linear infinite; animation-play-state: paused;
}
.fx-ladder[data-run] li[data-crown]::before { animation-play-state: running; }
@keyframes fx-crown-turn { to { --fx-crown: 360deg; } }
@media (prefers-reduced-motion: reduce) {
  .fx-ladder li, .fx-ladder li[data-lit] h3 { transition: none; }
  .fx-ladder li[data-crown]::before { animation: none; }
}`;

/**
 * THE LOYALTY TIER LADDER. Wraps the server-rendered <ol> of tiers (the tier
 * data is the Hub's and stays in the page).
 *
 *   rail     a gold line fills with scroll progress as the ladder crosses the
 *            viewport (LADDER.from → LADDER.to of its height).
 *   tiers    each tier card lights — gold edge, a soft inner glow, a gold
 *            title — when the rail's tip reaches it. Measured from the real
 *            layout, so a 2×2 grid lights row by row and a stack card by card.
 *   crown    the top tier (data-crown on its <li>) carries a slow conic
 *            metallic border, running only while the ladder is on screen and
 *            the tab is visible.
 *
 * Scroll work happens only while the ladder is on screen. Reduced motion: the
 * rail is full, every tier is lit and the crown border is still — the
 * finished state, with no movement.
 */
export function TierLadder({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReduced();

  useEffect(() => {
    const box = ref.current;
    if (!box || reduced === null) return;
    const items = [...box.querySelectorAll<HTMLElement>("li[data-tier]")];
    const lightAll = (on: boolean) => items.forEach((li) => { if (on) li.dataset.lit = ""; else delete li.dataset.lit; });
    if (reduced) {
      box.style.setProperty("--fill", "1");
      lightAll(true);
      delete box.dataset.run;
      return;
    }

    let frame = 0;
    let onScreen = false;
    const paint = () => {
      frame = 0;
      const r = box.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * LADDER.from - r.top) / (vh * (LADDER.from - LADDER.to))));
      box.style.setProperty("--fill", p.toFixed(4));
      // Across (lg) or down: which axis the rail runs on is whichever the
      // stylesheet chose — read it from the rail itself.
      const rail = box.querySelector<HTMLElement>(".fx-rail");
      const across = rail ? rail.offsetWidth > rail.offsetHeight : false;
      const tip = across ? r.left + r.width * p : r.top + r.height * p;
      for (const li of items) {
        const c = li.getBoundingClientRect();
        const start = across ? c.left : c.top;
        // A tier lights once the tip is a little way into it.
        if (p > 0 && tip >= start + 12) li.dataset.lit = ""; else delete li.dataset.lit;
      }
    };
    const request = () => { if (onScreen && !frame) frame = requestAnimationFrame(paint); };
    const run = () => { if (onScreen && document.visibilityState === "visible") box.dataset.run = ""; else delete box.dataset.run; };

    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; run(); request(); }, { rootMargin: "20% 0px" });
    io.observe(box);
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    document.addEventListener("visibilitychange", run);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      document.removeEventListener("visibilitychange", run);
    };
  }, [reduced]);

  return (
    <div ref={ref} className={`fx-ladder ${className}`}>
      <ComponentStyle id="fx-ladder" css={CSS} />
      <span aria-hidden="true" className="fx-rail" />
      <span aria-hidden="true" className="fx-rail-fill" />
      {children}
    </div>
  );
}
