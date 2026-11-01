"use client";

import { useRef } from "react";
import Link from "next/link";

import { Hover } from "@/components/common/robot-hover";
import { Inview } from "@/components/common/robot-inview";
import { springWeightSoft } from "@/lib/springs/config";

export interface NavItemProps {
  label: string;
  href: string;
  /** True where the item sits on brand red — the bar and type swap over. */
  onAccent?: boolean;
  delay?: number;
  className?: string;
  /**
   * Extra control rendered inside the item — the header search field. It is a
   * descendant, so pointing at it keeps the word in its hover state, which is
   * what makes the pair read as one control.
   */
  /** When set the label becomes a button: it operates something, not a link. */
  onActivate?: () => void;
}

/**
 * A navigation item — variant N5.
 *
 * A bar wipes in behind the word from its left edge and the type flips to the
 * opposite tone: the same gesture the catalogue band makes across a category
 * row, borrowed for the menus. Over cream the bar is brand red with paper type;
 * over the red blocks it inverts, or the bar would be invisible.
 *
 * The wipe is physical, so it is a spring; the colour flip underneath it is a
 * discrete swap on token-backed timing (ADR-0014).
 */
export const NavItem = ({
  label,
  href,
  onAccent = false,
  delay = 0,
  className = "",
  onActivate,
}: NavItemProps) => {
  const ref = useRef<HTMLLIElement>(null);

  return (
    <Inview
      tag="li"
      ref={ref}
      mode="once"
      delayIn={delay}
      from={{ opacity: 0, y: 12 }}
      to={{ opacity: 1, y: 0 }}
      config={springWeightSoft}
      className={`group/nav relative isolate shrink-0 ${className}`}
    >
      <Hover
        tag="span"
        trigger={ref}
        from={{ scaleX: 0 }}
        to={{ scaleX: 1 }}
        config={{ tension: 280, friction: 28 }}
        aria-hidden
        className={`absolute -inset-x-[0.42em] -inset-y-[0.2em] -z-10 block origin-left ${
          onAccent ? "bg-foreground-on-accent" : "bg-surface-accent"
        }`}
      />
      {onActivate ? (
        <button
          type="button"
          onClick={onActivate}
          className={`block whitespace-nowrap transition-colors duration-[var(--duration-fast)] ease-entrance [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] ${
            onAccent
              ? "group-hover/nav:text-foreground-accent"
              : "group-hover/nav:text-foreground-on-accent"
          }`}
        >
          {label}
        </button>
      ) : (
        <Link
          href={href}
          className={`block whitespace-nowrap transition-colors duration-[var(--duration-fast)] ease-entrance [text-box-edge:cap_alphabetic] [text-box-trim:trim-both] ${
            onAccent
              ? "group-hover/nav:text-foreground-accent"
              : "group-hover/nav:text-foreground-on-accent"
          }`}
        >
          {label}
        </Link>
      )}
    </Inview>
  );
};
