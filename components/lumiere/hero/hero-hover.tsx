"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { animated, easings, useSpring } from "@react-spring/web";

/**
 * Hover behaviour for the hero's links.
 *
 * The label does not dim or underline — it rolls. The word travels up out of
 * its own line and an identical word arrives from below to take the place, so
 * the type never leaves the slot it was set in. It is the same mask the
 * headline enters through, which is why it belongs here rather than a colour
 * change borrowed from a dashboard.
 *
 * The padding is the whole trick. These labels are set with a cap-trimmed
 * leading — 0.8 of the size — so the line box is a good deal shorter than the
 * letters standing in it: 13px of box around 21px of glyph on the collections
 * link. A mask drawn to the box shaves the type top and bottom, and the flat
 * cut along the bottom reads as an underline the design never asked for.
 *
 * So each copy carries the room, and the mask is pulled back by the same amount
 * with a negative margin. Layout is untouched, the glyphs are whole, and the
 * understudy still sits exactly one copy below — which is what keeps the roll
 * landing on the line it left.
 */

/** Slack around each copy, in ems, so no letter meets the mask. */
const BLEED = "0.4em";

/** Quick away, long settle — the same shape as the entrance, a third the length. */
const CONFIG = { duration: 460, easing: easings.easeOutCubic } as const;

/**
 * Pointer state for an interactive element.
 *
 * Pointer events rather than mouse: a stylus and a trackpad both report here,
 * and a touch reports enter without ever reporting leave, so the roll would
 * stick. `pointercancel` is what unsticks it.
 */
export const useHover = () => {
  const [hovered, setHovered] = useState(false);

  return {
    hovered,
    handlers: {
      onPointerEnter: () => setHovered(true),
      onPointerLeave: () => setHovered(false),
      onPointerCancel: () => setHovered(false),
      onFocus: () => setHovered(true),
      onBlur: () => setHovered(false),
    },
  };
};

export interface HoverRollProps {
  children: ReactNode;
  active: boolean;
}

/**
 * A label that rolls one line upward on hover.
 *
 * The understudy is `aria-hidden` and absolutely placed: it must not be read
 * twice, and it must not add to the height — the mask is exactly one line tall
 * and the copy below it lives outside the flow.
 */
export const HoverRoll = ({ children, active }: HoverRollProps) => {
  const { t } = useSpring({
    t: active ? 1 : 0,
    config: CONFIG,
  });

  return (
    <span
      className="relative block overflow-hidden"
      style={{ marginBlock: `calc(${BLEED} * -1)` }}
    >
      <animated.span
        className="block will-change-transform"
        style={{
          transform: t.to((value) => `translate3d(0, ${-value * 100}%, 0)`),
        }}
      >
        <span className="block" style={{ paddingBlock: BLEED }}>
          {children}
        </span>
        <span
          aria-hidden
          className="absolute inset-x-0 top-full block"
          style={{ paddingBlock: BLEED }}
        >
          {children}
        </span>
      </animated.span>
    </span>
  );
};

export interface RollLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  /** The link is for the page on screen (aria-current). */
  current?: boolean;
}

/**
 * A link whose label rolls. Its own component because the hover state is a
 * hook, and these are rendered from a map.
 */
export const RollLink = ({
  href,
  children,
  className,
  onClick,
  current,
}: RollLinkProps) => {
  const { hovered, handlers } = useHover();

  return (
    <Link href={href} className={className} onClick={onClick} aria-current={current ? "page" : undefined} {...handlers}>
      <HoverRoll active={hovered}>{children}</HoverRoll>
    </Link>
  );
};
