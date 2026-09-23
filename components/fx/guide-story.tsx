"use client";
import { useEffect, useRef } from "react";
import { useReduced } from "@/components/fx/media";
import { ComponentStyle, mix } from "@/components/fx/component-style";

/**
 * The story's rules, inline (components/fx/component-style.tsx says why).
 *
 * NOTHING STARTS HIDDEN FROM THE SERVER. Without JavaScript, and under reduced
 * motion, the first pinned plate shows and every plate's detail is finished
 * (the gold bar at 75%, the stamp struck, the care list written). Only once
 * the story has hydrated with motion allowed (`data-armed`) do inactive
 * plates wait in their start pose — so a plate on screen at first paint is
 * never blanked.
 */
const CSS = `
@media (min-width: 1024px) {
  .fx-guide { display: grid; grid-template-columns: minmax(0,5fr) minmax(0,6fr); gap: clamp(40px,5vw,80px); }
  .fx-guide-step { display: flex; min-height: 78vh; flex-direction: column; justify-content: center; }
}
.fx-guide-pin { position: sticky; top: clamp(88px,12vh,128px); aspect-ratio: 4 / 5; max-height: calc(100vh - 160px); }
.fx-guide-step + .fx-guide-step { margin-top: 4rem; border-top: 1px solid var(--rule); padding-top: 4rem; }
@media (min-width: 1024px) { .fx-guide-step + .fx-guide-step { margin-top: 0; border-top: 0; padding-top: 0; } }
/* Inline (phone) plates are as tall as their facts need, never cut off. */
.fx-guide-inline { margin-bottom: 2rem; }
.fx-guide-inline > .gp { min-height: min(72vw, 340px); height: auto; }
@media (min-width: 1024px) { .fx-guide-inline { display: none; } }
.fx-guide-pin [data-plate] { position: absolute; inset: 0; transition: opacity var(--dur-reveal) var(--ease-lux), transform var(--dur-image) var(--ease-lux); }
.fx-guide-pin [data-plate]:not([data-plate="0"]) { opacity: 0; }
.fx-guide[data-step] .fx-guide-pin [data-plate] { opacity: 0; transform: scale(1.03); }
.fx-guide[data-step] .fx-guide-pin [data-plate][data-active] { opacity: 1; transform: none; }

.fx-bar-gold { transition: width var(--dur-image) var(--ease-lux) .15s; box-shadow: 0 0 14px ${mix("gold", 60)}; }
.fx-guide[data-armed] [data-plate]:not([data-active]) .fx-bar-gold { width: 0 !important; transition-duration: 0s; transition-delay: 0s; }

.fx-stamp { transition: transform var(--dur-reveal) var(--ease-lux) .1s, opacity var(--dur-micro) linear .1s, box-shadow var(--dur-image) var(--ease-lux) .1s; }
.fx-guide[data-armed] [data-plate]:not([data-active]) .fx-stamp { transform: scale(1.18); opacity: 0; box-shadow: none; transition-duration: 0s; transition-delay: 0s; }

.fx-care > li { transition: opacity var(--dur-reveal) var(--ease-lux), transform var(--dur-reveal) var(--ease-lux); transition-delay: calc(.15s + var(--i, 0) * var(--stagger-card, .12s)); }
.fx-guide[data-armed] [data-plate]:not([data-active]) .fx-care > li { opacity: 0; transform: translateY(10px); transition-duration: 0s; transition-delay: 0s; }

@media (prefers-reduced-motion: reduce) {
  .fx-guide-pin [data-plate], .fx-bar-gold, .fx-stamp, .fx-care > li { transition: none; }
}`;

/**
 * THE GOLD GUIDE AS A SCROLL STORY. The page lays it out (app/gold-guide):
 * on lg and up a pinned plate column beside the steps; below lg each step
 * carries its own plate inline, and the steps rise in one after another.
 *
 * This component only decides which step is being read — the one crossing
 * the middle of the screen — and marks it: `data-step` on the story, and
 * `data-active` on that step's plates (pinned and inline). CSS does the
 * rest: the pinned plate crossfades to the step's plate, and the active
 * plate plays its detail — the gold bar fills to 75%, the hallmark is struck,
 * the care points are written in.
 *
 * No scroll listener: one IntersectionObserver. Reduced motion: the pinned
 * plate still follows the step being read (that is content, not decoration),
 * but it changes instantly and every detail is already finished.
 */
export function GuideStory({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReduced();

  useEffect(() => {
    const box = ref.current;
    if (!box || reduced === null) return;
    const steps = [...box.querySelectorAll<HTMLElement>("[data-guide-step]")];
    const set = (i: number) => {
      box.dataset.step = String(i);
      box.querySelectorAll<HTMLElement>("[data-plate]").forEach((p) => {
        if (p.dataset.plate === String(i)) p.dataset.active = ""; else delete p.dataset.active;
      });
    };
    set(0);
    if (reduced) delete box.dataset.armed; else box.dataset.armed = "";
    // The step whose box crosses the middle band of the viewport is the one being read.
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) set(Number((e.target as HTMLElement).dataset.guideStep));
    }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [reduced]);

  return (
    <div ref={ref} className={`fx-guide ${className}`}>
      <ComponentStyle id="fx-guide" css={CSS} />
      {children}
    </div>
  );
}
