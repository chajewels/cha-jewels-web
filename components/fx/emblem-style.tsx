"use client";
import { DUR, EMBLEM } from "@/lib/motion";
import { ComponentStyle, mix } from "@/components/fx/component-style";

/**
 * The emblems' rules (components/fx/emblem.tsx), rendered from a CLIENT
 * module so the page carries them once — a server component's <style> is
 * sent again in the RSC payload (docs/perf-baseline.md). The rules, inline (components/fx/component-style.tsx says why —
 * and docs/perf-baseline.md: new styling goes here, not into utility classes,
 * or the root stylesheet splits in two).
 */
const CSS = `
.fx-emblem { position: relative; display: block; flex-shrink: 0; width: var(--em-sm); height: var(--em-sm); border-radius: 50%; }
@media (min-width: 1024px) { .fx-emblem { width: var(--em-lg); height: var(--em-lg); } }
.fx-emblem-coin { position: absolute; inset: 0; border-radius: 50%;
  animation: fx-emblem-coin ${DUR.image}s var(--ease-lux) both; }
.fx-emblem-coin img { display: block; width: 100%; height: 100%; border-radius: 50%; box-shadow: 0 6px 18px ${mix("gold-dark", 18)}; }
.fx-emblem-sweep { position: absolute; inset: 0; overflow: hidden; border-radius: 50%; pointer-events: none; }
.fx-emblem-sweep::after { content: ""; position: absolute; top: -10%; bottom: -10%; left: 0; width: 45%; mix-blend-mode: screen; opacity: 0;
  background: linear-gradient(100deg, transparent, ${mix("gold", 45)} 40%, ${mix("gold-pale", 80)} 50%, ${mix("gold", 45)} 60%, transparent);
  animation: fx-emblem-sweep ${DUR.sheen}s var(--ease-sheen) ${EMBLEM.sweepDelay}s 1 both; }
@keyframes fx-emblem-coin { from { transform: perspective(700px) rotateY(${EMBLEM.turn}deg) scale(${EMBLEM.from}); } to { transform: none; } }
@keyframes fx-emblem-sweep {
  0% { opacity: 1; transform: translateX(-130%) skewX(-16deg); }
  100% { opacity: 1; transform: translateX(260%) skewX(-16deg); }
}
@media (prefers-reduced-motion: reduce) { .fx-emblem-coin, .fx-emblem-sweep::after { animation: none; } }`;

export function EmblemStyle() {
  return <ComponentStyle id="fx-emblem" css={CSS} />;
}
