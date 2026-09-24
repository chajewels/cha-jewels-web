"use client";
import { TIER_ICON as T } from "@/lib/motion";
import { ComponentStyle } from "@/components/fx/component-style";

/**
 * The tier medallions' rules (components/fx/tier-icon.tsx), rendered from a
 * CLIENT module so the page carries them once — a server component's <style>
 * is sent again in the RSC payload (docs/perf-baseline.md). Component CSS,
 * not utility classes: the root stylesheet is near its split point.
 *
 * WHO STARTS THEM. The ladder (components/fx/tier-ladder.tsx), not a second
 * observer. It marks a card `data-shown` when the reading line reaches it —
 * the ARRIVAL plays — and `data-vis` while it is on screen; a card wholly off
 * screen loses both, so the arrival replays on its return. `data-armed` on
 * the ladder (motion allowed, script running) lets the crown wait lowered
 * for its rise; without it — no script, reduced motion — every mark is simply
 * in place. `data-run` (ladder on screen, tab visible) plus `data-vis` gate
 * the IDLE loops, which follow each arrival and are paused otherwise.
 *
 * Each animated part carries a list: its arrival (once, `both`), then its
 * idle loop, delayed by the arrival's length plus the tier's offset. The
 * arrival holds its end state until the loop takes over. Transform and
 * opacity only, on the SVG's parts and light overlays; nothing bounces.
 */
const pc = (sec: number, every: number) => (sec / every) * 100;
const f = (n: number) => n.toFixed(2);
const RUN = ".fx-ladder[data-run] li[data-vis][data-shown]";
const SHOWN = "li[data-shown]";

// Idle starts: the arrival's length plus the tier's own offset (lib/motion.ts).
const dG = T.twinkle + T.offset.glimmer;
const dR = T.rays + T.offset.radiant;
const dE = T.facets + T.offset.elite;
const dC = Math.max(T.rise, T.shimmerDelay + T.shimmer) + T.offset.crown;

// Where each idle pulse sits inside its period, as keyframe percentages.
const gA = pc(T.twinkle, T.glimmerEvery);
const eS = pc(T.facets * 0.85, T.eliteEvery);
const eF = pc(T.facets * T.flashAt, T.eliteEvery);
const eF2 = pc(T.facets * T.flashAt + 0.2, T.eliteEvery);
const eF3 = pc(T.facets * T.flashAt + 0.7, T.eliteEvery);
const cS = pc(T.shimmer, T.crownEvery);

const CSS = `
.ti { display: block; flex-shrink: 0; margin-bottom: 16px; width: var(--ti-sm); height: var(--ti-sm); }
@media (min-width: 1024px) { .ti { width: var(--ti-lg); height: var(--ti-lg); } }
.ti svg { display: block; width: 100%; height: 100%; overflow: visible; }
.ti .ti-sym, .ti .ti-star, .ti .ti-rays { transform-box: view-box; transform-origin: 32px 32px; }
.ti .ti-glint, .ti .ti-flash { transform-box: fill-box; transform-origin: center; }
.ti .ti-glow, .ti .ti-facet-light, .ti .ti-shimmer, .ti .ti-flash { opacity: 0; }

/* GLIMMER — arrival: a twinkle. Idle: the twinkle again every glimmerEvery. */
${SHOWN} .ti[data-ti=glimmer] .ti-star { animation: ti-twinkle ${T.twinkle}s var(--ease-lux) both, ti-g-star ${T.glimmerEvery}s var(--ease-sheen) ${f(dG)}s infinite; animation-play-state: running, paused; }
${SHOWN} .ti[data-ti=glimmer] .ti-glint { animation: ti-glint ${T.twinkle}s var(--ease-lux) both, ti-g-glint ${T.glimmerEvery}s var(--ease-sheen) ${f(dG)}s infinite; animation-play-state: running, paused; }
${SHOWN} .ti[data-ti=glimmer] .ti-glow { animation: ti-pulse ${T.twinkle}s var(--ease-lux) both, ti-g-glow ${T.glimmerEvery}s var(--ease-sheen) ${f(dG)}s infinite; animation-play-state: running, paused; }
@keyframes ti-twinkle { 0% { transform: none; } 35% { transform: scale(1.14); } 100% { transform: none; } }
@keyframes ti-glint { 0% { transform: none; } 35% { transform: scale(1.7) rotate(45deg); } 100% { transform: none; } }
@keyframes ti-pulse { 0% { opacity: 0; } 35% { opacity: .55; } 100% { opacity: 0; } }
@keyframes ti-g-star { 0% { transform: none; } ${f(gA * 0.35)}% { transform: scale(1.12); } ${f(gA)}%, 100% { transform: none; } }
@keyframes ti-g-glint { 0% { transform: none; } ${f(gA * 0.35)}% { transform: scale(1.7) rotate(45deg); } ${f(gA)}%, 100% { transform: none; } }
@keyframes ti-g-glow { 0% { opacity: 0; } ${f(gA * 0.35)}% { opacity: .5; } ${f(gA)}%, 100% { opacity: 0; } }

/* RADIANT — arrival: the rays push out. Idle: they turn slowly, and a soft
   light breathes over star and rays. */
${SHOWN} .ti[data-ti=radiant] .ti-rays { animation: ti-rays ${T.rays}s var(--ease-lux) both, ti-r-turn ${T.raysTurn}s linear ${f(dR)}s infinite; animation-play-state: running, paused; }
${SHOWN} .ti[data-ti=radiant] .ti-glow { animation: ti-pulse ${T.rays}s var(--ease-lux) both, ti-r-glow ${T.raysPulse}s var(--ease-sheen) ${f(dR)}s infinite; animation-play-state: running, paused; }
@keyframes ti-rays { 0% { transform: scale(.82); opacity: .3; } 40% { transform: scale(1.22); opacity: 1; } 100% { transform: none; opacity: 1; } }
@keyframes ti-r-turn { from { transform: none; } to { transform: rotate(360deg); } }
@keyframes ti-r-glow { 0%, 100% { opacity: 0; } 50% { opacity: .42; } }

/* ELITE — arrival and idle alike: light across the facets, a flash at the table. */
${SHOWN} .ti[data-ti=elite] .ti-facet-light { animation: ti-facets ${T.facets}s var(--ease-sheen) both, ti-e-sweep ${T.eliteEvery}s linear ${f(dE)}s infinite; animation-play-state: running, paused; }
${SHOWN} .ti[data-ti=elite] .ti-flash { animation: ti-flash ${f(T.facets * 0.5)}s var(--ease-lux) ${f(T.facets * T.flashAt)}s both, ti-e-flash ${T.eliteEvery}s linear ${f(dE)}s infinite; animation-play-state: running, paused; }
@keyframes ti-facets { 0% { opacity: .85; transform: translateX(0) skewX(-18deg); } 85% { opacity: .85; } 100% { opacity: 0; transform: translateX(52px) skewX(-18deg); } }
@keyframes ti-flash { 0% { opacity: 0; transform: scale(.3); } 30% { opacity: 1; transform: scale(1.3); } 100% { opacity: 0; transform: scale(.6); } }
@keyframes ti-e-sweep {
  0% { opacity: .85; transform: translateX(0) skewX(-18deg); animation-timing-function: var(--ease-sheen); }
  ${f(eS)}% { opacity: .85; transform: translateX(46px) skewX(-18deg); }
  ${f(eS * 1.18)}%, 100% { opacity: 0; transform: translateX(52px) skewX(-18deg); } }
@keyframes ti-e-flash {
  0%, ${f(eF)}% { opacity: 0; transform: scale(.3); }
  ${f(eF2)}% { opacity: 1; transform: scale(1.3); }
  ${f(eF3)}%, 100% { opacity: 0; transform: scale(.6); } }

/* CROWN VIP — arrival: rises into place as a gold shimmer crosses it. Idle:
   a gentle float, and the shimmer again every crownEvery. */
.fx-ladder[data-armed] li:not([data-shown]) .ti[data-ti=crown] .ti-sym { transform: translateY(${T.riseFrom}px) scale(${T.scaleFrom}); }
${SHOWN} .ti[data-ti=crown] .ti-sym { animation: ti-rise ${T.rise}s var(--ease-lux) both, ti-c-float ${f(T.floatEvery / 2)}s var(--ease-sheen) ${f(dC)}s infinite alternate; animation-play-state: running, paused; }
${SHOWN} .ti[data-ti=crown] .ti-shimmer { animation: ti-shimmer ${T.shimmer}s var(--ease-sheen) ${T.shimmerDelay}s both, ti-c-shim ${T.crownEvery}s var(--ease-sheen) ${f(dC)}s infinite; animation-play-state: running, paused; }
@keyframes ti-rise { from { transform: translateY(${T.riseFrom}px) scale(${T.scaleFrom}); } to { transform: none; } }
@keyframes ti-c-float { from { transform: none; } to { transform: translateY(-${T.float}px); } }
@keyframes ti-shimmer { 0% { opacity: .9; transform: translateX(0) skewX(-18deg); } 85% { opacity: .9; } 100% { opacity: 0; transform: translateX(64px) skewX(-18deg); } }
@keyframes ti-c-shim {
  0% { opacity: .7; transform: translateX(0) skewX(-18deg); }
  ${f(cS * 0.85)}% { opacity: .7; }
  ${f(cS)}%, 100% { opacity: 0; transform: translateX(64px) skewX(-18deg); } }

/* The loops run only on screen, in a visible tab. */
${RUN} .ti .ti-star, ${RUN} .ti .ti-glint, ${RUN} .ti .ti-glow, ${RUN} .ti .ti-rays,
${RUN} .ti .ti-facet-light, ${RUN} .ti .ti-flash, ${RUN} .ti .ti-sym, ${RUN} .ti .ti-shimmer { animation-play-state: running, running; }

@media (prefers-reduced-motion: reduce) {
  .ti * { animation: none !important; }
  .fx-ladder[data-armed] li:not([data-shown]) .ti[data-ti=crown] .ti-sym { transform: none; }
}`;

export function TierIconStyle() {
  return <ComponentStyle id="fx-tier-icon" css={CSS} />;
}
