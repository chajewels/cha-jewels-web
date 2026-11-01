"use client";

import { useRef } from "react";
import Image from "next/image";
import { animated, easings, to, useSpring } from "@react-spring/web";

import { useScrollProgress } from "@/hooks/use-scroll-progress";
import { useWindowSize } from "@/hooks/use-window-size";
import { useHasLoaded, useLiftedEarly } from "@/lib/lumiere/preload-store";
import { designUnit } from "@/lib/lumiere/design-unit";

import {
  type CardState,
  cardOpacityAt,
  cardStateAt,
  clusterStateAt,
  frameTwoCanvasRatio,
  frameTwoOffsetScale,
  heroStateAt,
  isCompactFor,
  radiusScaleAt,
  range,
  toTransform,
  unitPxFor,
} from "./hero-geometry";
import {
  CARD,
  FLIPPED_POSITIONS,
  FLIPPED_POSITIONS_WIDE,
  FRAME_2,
  FRAME_3_PARALLAX,
  HERO_INTRO,
  HERO_TILT,
  PENDANT,
  PENDANT_FOG,
  TIMELINE,
  resolveCardPlacements,
} from "./hero.config";
import { useHeroContent } from "./hero-content";
import { HeroPendant } from "./hero-pendant";
import { useHeroProgress } from "./hero-progress";
import { useHeroTilt } from "./use-hero-tilt";

const placements = resolveCardPlacements();
const CLUSTER_COUNT = placements.length;

const easeOutCubic = (x: number) => 1 - (1 - x) ** 3;

/** Even gaps between the eight cards' starts over the entrance. */
const INTRO_GAP = (1 - HERO_INTRO.cardSpan) / (CLUSTER_COUNT - 1);

/**
 * How far card `index` has come up, 0…1, at intro time `t` (0…1, linear).
 * Clockwise by index — card 0 stands at 12 o'clock and the ring counts round.
 */
const appearAt = (index: number, t: number) =>
  easeOutCubic(range(t, index * INTRO_GAP, index * INTRO_GAP + HERO_INTRO.cardSpan));

/**
 * A card swung `degrees` along the ring about the cluster's centre — its place
 * on the circle and its own turn together, so the ring moves as one dial.
 */
const swungBy = <T extends CardState>(
  state: T,
  degrees: number,
  centre: { dx: number; dy: number },
): T => {
  if (degrees === 0) return state;
  const radians = (degrees * Math.PI) / 180;
  const x = state.x - centre.dx;
  const y = state.y - centre.dy;
  return {
    ...state,
    x: centre.dx + x * Math.cos(radians) - y * Math.sin(radians),
    y: centre.dy + x * Math.sin(radians) + y * Math.cos(radians),
    rotate: state.rotate + degrees,
  };
};

/** Below this (radians) the ring counts as square and drops its 3D transform. */
const TILT_EPSILON = 0.0005;

/**
 * Encoder quality for the two photographs that end up full-screen. The
 * reference used 95; the performance plan (docs/tasks/lumiere-p0-report.md
 * §10 step 1) sets 82 — the hero photo at q95 was the reference's mobile LCP
 * item — and the WebP masters under public/lumiere/ are re-encoded sources.
 */
const PHOTO_QUALITY = 82;

/**
 * The radial cluster: eight cards on a circle, with the chain-and-pendant
 * centrepiece behind them.
 *
 * Every card is anchored at the stage centre and placed purely by `transform`,
 * so the scrub never touches layout. Card 6 leaves the formation after frame 2
 * and grows until it covers the viewport.
 */
export const HeroCluster = () => {
  const { content } = useHeroContent();
  const heroCards = content.cards;
  const frame3 = content.frame3;
  const progress = useHeroProgress();
  const tilt = useHeroTilt();
  // The entrance (HERO_INTRO): linear time, eased per card and for the spin.
  const hasLoaded = useHasLoaded();
  const liftedEarly = useLiftedEarly();
  // `from` is the RESTING pose, so the server renders the ring arrived — what
  // the inline cap shows when it lifts the curtain before hydration (P2b).
  // Under the gate the spring snaps to 0 at mount (immediate, unseen) and
  // plays the entrance when the gate lifts; after an early lift it lands at 1.
  const { intro } = useSpring({
    from: { intro: 1 },
    intro: hasLoaded ? 1 : 0,
    delay: hasLoaded && !liftedEarly ? HERO_INTRO.delay : 0,
    immediate: !hasLoaded || liftedEarly,
    config: { duration: HERO_INTRO.duration, easing: easings.linear },
  });
  // Where the pinned stage is in the viewport: 0 for the whole pin, falling to
  // -1 as the hero scrolls away — drives the frame-3 photograph's exit parallax.
  const rootRef = useRef<HTMLDivElement>(null);
  const exit = useScrollProgress(rootRef);
  const { width, height } = useWindowSize();
  // Animated transforms are resolved to pixels here rather than left as calc()
  // expressions — see the note on `toTransform`.
  const unitPx = unitPxFor(width, height);
  const offsetScale = frameTwoOffsetScale(width);
  const canvasRatio = frameTwoCanvasRatio(width, height, unitPx);
  const isCompact = isCompactFor(width);
  const flipped = isCompact ? FLIPPED_POSITIONS : FLIPPED_POSITIONS_WIDE;
  // The frame-3 lag is meant in screen terms — a share of the distance scrolled
  // — but the photograph's transform is a percentage of the card's own height,
  // and at frame 3 the card is drawn well taller than the screen. This is the
  // screen's height as a share of that card, to convert one into the other.
  const frameThreeCardPx =
    CARD.height * unitPx * heroStateAt(1, width, height, unitPx, offsetScale).scale;
  const screenPerCard = frameThreeCardPx > 0 ? height / frameThreeCardPx : 0;

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0">
      {/* Position lives on the outer element and animation on the inner one.
          Both on the same node meant a CSS `translate` and a spring-driven
          `transform` fighting over where the pendant sits, and the pendant lost
          — it drifted off the centre of the ring. Separated, each owns one job. */}
      <div
        className="absolute left-1/2"
        style={{
          // Both dimensions come from tokens now. Desktop sizes the artwork off
          // the design unit and lets the chain fall where Figma draws it;
          // compact widths size it off the ring's own height, so the chain is
          // as long as the screen above the ring demands. The two cases have
          // nothing in common but the aspect ratio, so neither is expressed in
          // terms of the other.
          width: "var(--pendant-width)",
          height: "var(--pendant-height)",
          top: "var(--pendant-top)",
          // The nudge corrects for the artwork, not the layout: in the compact
          // file the oval is drawn a few pixels left of the frame's centre, and
          // at this size that reads as the pendant hanging off-centre in the
          // ring.
          translate:
            "calc(-50% + var(--pendant-nudge-x, 0px)) var(--pendant-shift, 0)",
        }}
      >
        <animated.div
          className="h-full w-full"
          style={{
            // Dissolves into a haze where it hangs as the cluster starts to
            // grow — no movement (PENDANT_FOG). `none` at rest, so the scene is
            // not filtered, or held on its own layer, while it is looked at.
            filter: progress.to((p) => {
              const fog = range(p, TIMELINE.pendantExit[0], TIMELINE.pendantExit[1]);
              if (fog <= 0) return "none";
              const wash = PENDANT_FOG.wash * fog;
              return `blur(${(PENDANT_FOG.blur * fog * unitPx).toFixed(2)}px) contrast(${(1 - wash).toFixed(3)}) brightness(${(1 + wash * 0.6).toFixed(3)})`;
            }),
            // Eased in, so the haze has time to gather before the form goes.
            opacity: progress.to((p) => {
              const fog = range(p, TIMELINE.pendantExit[0], TIMELINE.pendantExit[1]);
              return 1 - fog * fog * (3 - 2 * fog);
            }),
          }}
        >
          {/* The 3D pendant over its poster. The wrapper above still owns the
              box and this element the exit; the scene only fills the box. */}
          <HeroPendant tilt={tilt} />
        </animated.div>
      </div>

      {/* The ring tilts toward the cursor with the pendant — one spring, one
          fade-out (see HERO_TILT). It pivots on the ring's own centre, the
          point the pendant hangs over, so the two turn about the same axis.
          At rest the transform is `none`, not a zero rotation: a 3D transform
          would keep the plane on its own layer and soften the hero card as it
          grows to fill the screen. */}
      <animated.ul
        className="absolute inset-0 list-none"
        style={{
          transformOrigin: "50% var(--ring-top)",
          transform: to([tilt.x, tilt.y, progress], (x, y, p) => {
            const weight =
              1 - range(p, TIMELINE.pendantExit[0], TIMELINE.pendantExit[1]);
            const yaw = x * HERO_TILT.yaw * weight;
            const pitch = y * HERO_TILT.pitch * weight;
            if (Math.abs(yaw) < TILT_EPSILON && Math.abs(pitch) < TILT_EPSILON) {
              return "none";
            }
            return `perspective(var(--hero-tilt-perspective)) rotateX(${pitch}rad) rotateY(${yaw}rad)`;
          }),
        }}
      >
        {placements.map((placement, index) => {
          const card = heroCards[index];
          const isHero = index === FRAME_2.heroIndex;
          const stateAt = (p: number) =>
            isHero
              ? heroStateAt(p, width, height, unitPx, offsetScale)
              : cardStateAt(index, p, offsetScale, canvasRatio);
          const isFlipped = flipped.includes(placement.position);

          return (
            <animated.li
              key={placement.position}
              data-card={placement.position}
              /* `will-change` is deliberately absent on the hero card. It
                 promotes the element to a layer rasterised at its layout size —
                 105x124 — which the GPU then stretches fourteenfold, and no
                 amount of source resolution survives that. The other seven keep
                 the hint: they never grow, so they only gain from it. */
              className={`absolute left-1/2 overflow-hidden${
                isHero ? "" : " will-change-transform"
              }`}
              style={{
                // Not a `max-lg:` class: a Tailwind variant written last in a
                // template literal butts against the `${` and the scanner lifts
                // the bare utility out of the middle of the token, emitting a
                // rule that matches nothing. The custom property cannot be
                // mis-scanned, and it is the same one the pendant hangs from,
                // so the two cannot drift apart.
                top: "var(--ring-top)",
                width: designUnit(CARD.width),
                height: designUnit(CARD.height),
                zIndex: isHero ? 2 : 1,
                transform: to([progress, intro], (p, t) => {
                  const appear = appearAt(index, t);
                  const spin = -HERO_INTRO.spin * (1 - easeOutCubic(t));
                  const state = swungBy(
                    stateAt(p),
                    spin,
                    clusterStateAt(p, offsetScale, canvasRatio),
                  );
                  const grow =
                    HERO_INTRO.scaleFrom + (1 - HERO_INTRO.scaleFrom) * appear;
                  return toTransform(
                    grow === 1 ? state : { ...state, scale: state.scale * grow },
                    unitPx,
                    isFlipped,
                  );
                }),
                opacity: isHero
                  ? intro.to((t) => appearAt(index, t))
                  : to([progress, intro], (p, t) =>
                      cardOpacityAt(p) * appearAt(index, t),
                    ),
                // `none` once arrived, so a settled card is never filtered.
                filter: intro.to((t) => {
                  const appear = appearAt(index, t);
                  return appear >= 1
                    ? "none"
                    : `blur(${((1 - appear) * HERO_INTRO.blur * unitPx).toFixed(2)}px)`;
                }),
                borderRadius: isHero
                  ? progress.to(
                      (p) =>
                        `${heroStateAt(p, width, height, unitPx, offsetScale).radius * radiusScaleAt(p, unitPx, isCompact)}px`,
                    )
                  : designUnit(CARD.radius),
              }}
            >
              {/* These photographs are grainy by design, and film grain is
                    the first thing lossy compression destroys — at the default
                    quality of 75 it breaks into visible blocks once the hero
                    card is scaled up to fill the screen. */}
              <Image
                src={card.image.src}
                alt={card.image.alt}
                fill
                // The hero card grows to the whole screen; every other card is
                // drawn at CARD.width design units — 7.3vw at 1440 and above,
                // 25vw on a phone where the compact ring scales up (measured
                // 105 px on a 412 screen; Lighthouse "image delivery", P2 A).
                sizes={isHero ? "100vw" : "(max-width: 767.98px) 26vw, (max-width: 1439.98px) 14vw, 8vw"}
                quality={PHOTO_QUALITY}
                priority
                className="object-cover"
                style={{ objectPosition: card.objectPosition }}
              />

              {/* The frame-3 photograph, revealed inside the same element —
                    never a swap, so the growth stays continuous. */}
              {isHero && (
                <animated.div
                  className="absolute inset-0"
                  style={{
                    opacity: progress.to((p) =>
                      range(p, TIMELINE.crossfade[0], TIMELINE.crossfade[1]),
                    ),
                    // Exit parallax — 0 for the whole pin, then lagging the
                    // page by `FRAME_3_PARALLAX` as the hero scrolls away.
                    transform: exit.to(
                      (e) =>
                        `translate3d(0, ${(Math.max(0, -e) * FRAME_3_PARALLAX * screenPerCard * 100).toFixed(3)}%, 0)`,
                    ),
                  }}
                >
                  <Image
                    src={frame3.src}
                    alt={frame3.alt}
                    fill
                    sizes="100vw"
                    quality={PHOTO_QUALITY}
                    // Eager, not `priority`: it is first seen at hero progress
                    // 0.75, and as a preloaded high-priority request (169 KB at
                    // q 95 on a phone) it queued ahead of the LCP poster. The
                    // preloader still waits for it ([data-preload]).
                    loading="eager"
                    className="object-cover"
                    style={{ objectPosition: "var(--frame3-crop)" }}
                  />
                </animated.div>
              )}
            </animated.li>
          );
        })}
      </animated.ul>
    </div>
  );
};
