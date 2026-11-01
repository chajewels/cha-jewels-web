"use client";

import Link from "next/link";
import { animated, easings, useSpring } from "@react-spring/web";

import { TextSwap } from "@/components/lumiere/common/text-swap";
import { designUnit } from "@/lib/lumiere/design-unit";

import { range } from "./hero-geometry";
import { useHeroContent } from "./hero-content";
import { HoverRoll, useHover } from "./hero-hover";
import { REVEAL, useRevealSpring } from "./hero-reveal";
import { SCROLL_CUE_OPACITY, TIMELINE } from "./hero.config";
import { ArrowIcon, ScrollIcon } from "./hero-icons";
import { useHeroProgress } from "./hero-progress";
import { TextRuns } from "./text-runs";

/** `Link` carries its own props through, so the spring can drive it directly. */
const AnimatedLink = animated(Link);

/**
 * The bottom band: the standfirst on the left, the scroll cue centred, and the
 * collection CTA on the right.
 *
 * Figma positions all three from the top of an 800-unit frame. Because the
 * section is now viewport-height, each is anchored to the bottom edge instead,
 * using the gap Figma leaves beneath it — so the band holds its position on
 * taller screens rather than drifting up.
 */
/**
 * The standfirst's word space, in `em` — Manrope's own, measured: 0.2. The handover runs the
 * words through the text engine's wrapping row, which sets its own gap.
 */
const TAGLINE_SPACE = 0.2;

/** Quicker than a heading's: the standfirst is three times as many letters. */
const TAGLINE_STAGGER = 10;

export interface HeroFooterProps {
  /** Frame 3's copy handover — see `TextSwap`. */
  isPhoto: boolean;
}

export const HeroFooter = ({ isPhoto }: HeroFooterProps) => {
  const { content } = useHeroContent();
  const progress = useHeroProgress();
  const taglineReveal = useRevealSpring(REVEAL.tagline);
  const ctaReveal = useRevealSpring(REVEAL.cta);
  const { hovered, handlers } = useHover();
  // 0 at rest, 1 on hover. One value drives the label, the arrow and the rule,
  // so the three can never fall out of step.
  const { hover } = useSpring({
    hover: hovered ? 1 : 0,
    config: { duration: 460, easing: easings.easeOutCubic },
  });

  // English runs through the engine's wrapping row; Japanese has no spaces to
  // wrap on, so it is set as the named lines of §13 rows 3–4 (§5.3).
  const wrap = content.taglineWraps ? { gap: TAGLINE_SPACE } : undefined;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20">
      {/* The three items share one baseline wherever there is room for them on
          one line — desktop and tablet. Only the phone stacks the standfirst
          above the CTA against the same left gutter. Which of the two it is
          lives in `--footer-*-bottom`, not here. */}
      <animated.p
        // Width in classes, not inline: an inline value outranks `lg:w-u-281`
        // and would pin the desktop measure to the phone's.
        className="absolute left-u-40 font-manrope text-body font-medium bottom-[var(--footer-tagline-bottom)] w-[min(calc(100vw-80*var(--raw-unit-design)),var(--footer-tagline-width))] lg:w-u-281"
        style={taglineReveal}
      >
        <TextSwap
          versions={[content.tagline, content.taglinePhoto]}
          active={isPhoto ? 1 : 0}
          wrap={wrap}
          stagger={TAGLINE_STAGGER}
        />
      </animated.p>

      {/* Opacity rather than a colour token: a token would pin this to black and
        override the inherited colour, which is what carries the frame-3
        inversion. The value rises with that inversion — Figma's 30% reads
        cleanly as black on the cream page, but the same 30% in white over a
        busy photograph does not. */}
      <animated.p
        className="absolute bottom-[var(--footer-cue-bottom)] left-1/2 hidden -translate-x-1/2 items-center gap-u-6 font-manrope text-caption font-medium uppercase md:flex"
        style={{
          opacity: progress.to((p) => {
            const t = range(p, TIMELINE.invert[0], TIMELINE.invert[1]);

            return (
              SCROLL_CUE_OPACITY.onPage +
              (SCROLL_CUE_OPACITY.onPhoto - SCROLL_CUE_OPACITY.onPage) * t
            );
          }),
        }}
      >
        <ScrollIcon />
        {content.scrollLabel}
      </animated.p>

      <AnimatedLink
        href={content.cta.href}
        // `md:` and `lg:` set the same pair, so this reaches the tablet without
        // the desktop rule changing meaning: from 768 up the CTA sits in the
        // right-hand corner opposite the standfirst. Only the phone keeps it on
        // the left, stacked underneath.
        className="pointer-events-auto absolute left-u-40 flex w-fit flex-col items-start gap-u-8 md:right-u-40 md:left-auto lg:right-u-40 lg:left-auto"
        style={{ bottom: "var(--footer-cta-bottom)", ...ctaReveal }}
        data-analytics="hero-cta"
        {...handlers}
      >
        <span className="flex items-center gap-u-12 font-serif text-utility uppercase tracking-utility">
          {/* The runs stay inside one inline box — as direct children of the flex
            container each would become its own item and pick up the gap. */}
          <HoverRoll active={hovered}>
            <TextRuns runs={content.cta.runs} />
          </HoverRoll>
          {/* The arrow leaves ahead of the label, which is what makes the pair
              read as departing rather than merely lighting up. */}
          <animated.span
            className="block will-change-transform"
            style={{
              transform: hover.to((t) => `translate3d(${t * 6}px, 0, 0)`),
            }}
          >
            <ArrowIcon />
          </animated.span>
        </span>
        {/* The rule redraws itself: it retracts to the right and comes back from
            the left, so the underline is struck again rather than dimmed. */}
        <span
          className="w-full overflow-hidden"
          style={{ height: designUnit(0.7) }}
        >
          <animated.span
            className="block h-full w-full origin-left bg-current"
            style={{
              transform: hover.to(
                (t) => `scaleX(${1 - Math.sin(Math.PI * t)})`,
              ),
              transformOrigin: hover.to((t) => (t < 0.5 ? "right" : "left")),
            }}
          />
        </span>
      </AnimatedLink>
    </div>
  );
};
