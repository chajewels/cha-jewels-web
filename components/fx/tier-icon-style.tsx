"use client";
import { EASE_SHEEN, TIER_ICON as T } from "@/lib/motion";
import { ComponentStyle } from "@/components/fx/component-style";

/**
 * The tier medallions' rules (components/fx/tier-icon.tsx), rendered from a
 * CLIENT module so the page carries them once — a server component's <style>
 * is sent again in the RSC payload (docs/perf-baseline.md). Component CSS,
 * not utility classes: the root stylesheet is near its split point.
 *
 * WHO STARTS THEM. The ladder (components/fx/tier-ladder.tsx), not a second
 * observer: it marks a card `data-shown` the first time its rail reaches it,
 * and each medallion plays its entrance once on that attribute. `data-armed`
 * on the ladder (motion allowed, script running) is what lets the crown wait
 * lowered for its rise; without it — no script, reduced motion — every mark
 * is simply in place. `data-run` (on screen, tab visible) gates the two
 * idle loops, exactly like the Crown card's edge light.
 *
 * Transform and opacity only, on the SVG's own parts and two light overlays.
 */
const sheen = `cubic-bezier(${EASE_SHEEN.join(", ")})`;
const idleEnd = (T.shimmer / T.idleEvery) * 100;
const CSS = `
.ti { display: block; flex-shrink: 0; margin-bottom: 16px; }
.ti svg { display: block; overflow: visible; }
.ti .ti-sym, .ti .ti-sym > *, .ti .ti-glint, .ti .ti-rays, .ti .ti-flash { transform-box: fill-box; transform-origin: center; }
.ti .ti-glow, .ti .ti-facet-light, .ti .ti-shimmer { opacity: 0; }
.ti .ti-flash { opacity: 0; }

/* Glimmer: twinkle. */
li[data-shown] .ti[data-ti=glimmer] .ti-sym > polygon { animation: ti-twinkle ${T.twinkle}s var(--ease-lux) both; }
li[data-shown] .ti[data-ti=glimmer] .ti-glint { animation: ti-glint ${T.twinkle}s var(--ease-lux) both; }
li[data-shown] .ti[data-ti=glimmer] .ti-glow { animation: ti-pulse ${T.twinkle}s var(--ease-lux) both; }
@keyframes ti-twinkle { 0% { transform: none; } 35% { transform: scale(1.14); } 100% { transform: none; } }
@keyframes ti-glint { 0% { transform: scale(1); } 35% { transform: scale(1.7) rotate(45deg); } 100% { transform: none; } }
@keyframes ti-pulse { 0% { opacity: 0; } 35% { opacity: .55; } 100% { opacity: 0; } }

/* Radiant: the rays push out once, then a slow breath of light. */
li[data-shown] .ti[data-ti=radiant] .ti-rays { animation: ti-rays ${T.rays}s var(--ease-lux) both; }
li[data-shown] .ti[data-ti=radiant] .ti-glow { animation: ti-pulse ${T.rays}s var(--ease-lux) both, ti-breathe ${T.glow}s ${sheen} ${T.rays}s infinite; animation-play-state: running, paused; }
.fx-ladder[data-run] li[data-shown] .ti[data-ti=radiant] .ti-glow { animation-play-state: running, running; }
@keyframes ti-rays { 0% { transform: scale(.82); opacity: .3; } 40% { transform: scale(1.22); opacity: 1; } 100% { transform: none; opacity: 1; } }
@keyframes ti-breathe { 0%, 100% { opacity: 0; } 50% { opacity: .3; } }

/* Elite: light across the facets, a flash at the table. */
li[data-shown] .ti[data-ti=elite] .ti-facet-light { animation: ti-facets ${T.facets}s ${sheen} both; }
li[data-shown] .ti[data-ti=elite] .ti-flash { animation: ti-flash ${(T.facets * 0.5).toFixed(2)}s var(--ease-lux) ${(T.facets * T.flashAt).toFixed(2)}s both; }
@keyframes ti-facets { 0% { opacity: .85; transform: translateX(0) skewX(-18deg); } 85% { opacity: .85; } 100% { opacity: 0; transform: translateX(52px) skewX(-18deg); } }
@keyframes ti-flash { 0% { opacity: 0; transform: scale(.3); } 30% { opacity: 1; transform: scale(1.3); } 100% { opacity: 0; transform: scale(.6); } }

/* Crown VIP: rises into place, a gold shimmer; then a faint idle shimmer. */
.fx-ladder[data-armed] li:not([data-shown]) .ti[data-ti=crown] .ti-sym { transform: translateY(${T.riseFrom}px) scale(${T.scaleFrom}); }
li[data-shown] .ti[data-ti=crown] .ti-sym { animation: ti-rise ${T.rise}s var(--ease-lux) both; }
li[data-shown] .ti[data-ti=crown] .ti-shimmer {
  animation: ti-shimmer ${T.shimmer}s ${sheen} ${T.shimmerDelay}s both, ti-idle ${T.idleEvery}s ${sheen} ${T.shimmerDelay + T.idleEvery}s infinite;
  animation-play-state: running, paused; }
.fx-ladder[data-run] li[data-shown] .ti[data-ti=crown] .ti-shimmer { animation-play-state: running, running; }
@keyframes ti-rise { from { transform: translateY(${T.riseFrom}px) scale(${T.scaleFrom}); } to { transform: none; } }
@keyframes ti-shimmer { 0% { opacity: .9; transform: translateX(0) skewX(-18deg); } 85% { opacity: .9; } 100% { opacity: 0; transform: translateX(64px) skewX(-18deg); } }
@keyframes ti-idle {
  0% { opacity: ${T.idleOpacity}; transform: translateX(0) skewX(-18deg); }
  ${idleEnd.toFixed(1)}% { opacity: ${T.idleOpacity}; transform: translateX(64px) skewX(-18deg); }
  ${(idleEnd + 0.1).toFixed(1)}%, 100% { opacity: 0; transform: translateX(64px) skewX(-18deg); } }

@media (prefers-reduced-motion: reduce) {
  .ti *, .ti *::before { animation: none !important; }
  .fx-ladder[data-armed] li:not([data-shown]) .ti[data-ti=crown] .ti-sym { transform: none; }
}`;

export function TierIconStyle() {
  return <ComponentStyle id="fx-tier-icon" css={CSS} />;
}
