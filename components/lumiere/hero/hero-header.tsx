"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { animated } from "@react-spring/web";

import { designUnit } from "@/lib/lumiere/design-unit";
import { BurgerButton, MenuOverlay } from "@/components/lumiere/site/menu-overlay";

import { range } from "./hero-geometry";
import { useHeroContent } from "./hero-content";
import { RollLink } from "./hero-hover";
import { ITEM_STAGGER, REVEAL, RevealItem, useRevealSpring } from "./hero-reveal";
import { TIMELINE } from "./hero.config";
import { useHeroProgress } from "./hero-progress";

/**
 * THE LUMIÈRE HEADER, carrying this site's chrome (adapted from the
 * reference's hero-header.tsx; report §7 P3 row, §8 "Logo", "Nav", D-3,
 * D-18, D-19):
 *
 *   left     the D-18 labels — Collections · Blog · About · Layaway (EN) /
 *            Jewelry Guide (JA) — rolling on hover, arriving one by one
 *   centre   the Cha Jewels badge and "Cha Jewels" in Instrument Serif (D-3)
 *            in place of the reference's wordmark artwork; the white copy
 *            fades in over it with the frame-3 inversion
 *   right    the site's own controls, rendered on the server and handed down:
 *            the JA/EN toggle (JA first), the account menu, the live cart
 *            count (CartBump), the search — and, since P3, the burger at
 *            every width (the menu lists every destination; a desktop reader
 *            needs it too)
 *   phone    the compact bar — search, cart and the burger — and the overlay,
 *            every existing destination in groups, each label rising out of
 *            its mask (components/lumiere/site/menu-overlay.tsx, shared with
 *            the site header on every other page)
 *
 * As in the reference the header lives inside the pinned hero and takes its
 * colour from the stage (`currentColor`); the fixed, recolouring header on
 * every other page is components/lumiere/site/site-header.tsx. The mobile
 * tab bar stays (D-19, root layout).
 */

/** Burger geometry, in px. The bars sit inside a 44px target. */
const BAR_WIDTH = 24;
/** Half the distance between the two bars at rest. */
const BAR_GAP = 3;
/** The lower bar is shorter when closed, full length once it forms the cross. */
const SHORT_BAR_RATIO = 0.66;

/**
 * The roll replaces the old dim: the label moves rather than fades.
 *
 * `inline-flex` and not `block`, and it matters. The roll's mask carries a
 * negative margin to hide the slack it needs around the glyphs, and inside a
 * plain block that margin collapses with the parent's — which shifts the link
 * instead of shrinking it, and the label ends up double its height. A flex
 * container does not collapse its items' margins, so the pull-back lands.
 */
const linkClass = "inline-flex";

const BADGE = { src: "/images/brand/logo-badge-192.webp", size: 192 } as const;
const MENU_ID = "hero-menu";

/** The badge + wordmark pair, in the current colour; `inverse` is the white copy. */
const Wordmark = ({ inverse = false }: { inverse?: boolean }) => (
  <span className="flex h-full items-center" style={{ gap: designUnit(8) }}>
    <Image
      src={BADGE.src}
      alt=""
      width={BADGE.size}
      height={BADGE.size}
      sizes="(max-width: 480px) 36px, 40px"
      priority
      // The badge is a gold coin on black (public/images/brand): it reads on
      // the paper and on the photograph alike, so it is never filtered —
      // `brightness-0 invert` turned it into a blank white disc (P2b item 3).
      className="block h-full w-auto"
    />
    <span className={`font-serif text-wordmark whitespace-nowrap ${inverse ? "text-content-inverse" : ""}`}>Cha Jewels</span>
  </span>
);

export const HeroHeader = () => {
  const { chrome } = useHeroContent();
  const { nav, utilities, menu, labels, homeHref } = chrome;
  const progress = useHeroProgress();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const compactBurger = useRef<HTMLButtonElement>(null);
  const wideBurger = useRef<HTMLButtonElement>(null);
  // The wordmark and the compact bar arrive as one; the desktop nav items carry
  // their own staggered entrances instead.
  const chromeReveal = useRevealSpring(REVEAL.chrome, 10);
  // 0 is the burger, 1 the cross. One value drives both bars (the compact
  // bar's own pair; the wide burger is the shared BurgerButton).
  const icon = { top: isMenuOpen ? 1 : 0 };

  const close = () => setIsMenuOpen(false);
  const utilityCount = 5;

  return (
    // The header's own z-index has to rise with the menu. At z-20 it opens a
    // stacking context that the overlay inside it cannot escape, so the
    // headline (z-30) and the bottom band paint straight through the menu.
    <header
      className={`pointer-events-none absolute inset-x-0 top-0 ${
        isMenuOpen ? "z-50" : "z-20"
      }`}
    >
      {/* The nav itself no longer carries the entrance — its items do, one after
          the next, so the bar assembles left to right rather than appearing as a
          block. */}
      <nav
        aria-label={labels.primary}
        className="pointer-events-auto absolute top-u-29 left-u-40 hidden lg:block"
      >
        {/* Type classes sit on the list, not the link: an inline `a` does not set
          its line box's strut, so the `li` would keep the inherited 24px
          leading and push the text below the Figma position. */}
        <ul className="flex list-none items-center gap-u-48 font-manrope text-nav font-medium uppercase">
          {nav.map((link, index) => (
            <RevealItem
              key={link.href}
              delay={REVEAL.chrome + index * ITEM_STAGGER}
            >
              <RollLink href={link.href} className={linkClass}>
                {link.label}
              </RollLink>
            </RevealItem>
          ))}
        </ul>
      </nav>

      {/* The mark: the badge and the name (D-3). The white copy of the NAME
          fades in over it with the frame-3 inversion; the badge artwork is the
          same in both states. */}
      <Link
        href={homeHref}
        aria-label={labels.home}
        className="pointer-events-auto absolute left-1/2 block -translate-x-1/2 -translate-y-1/2 top-[calc(29*var(--raw-unit-design)_+_22px)] lg:top-u-14 lg:translate-y-0"
        style={{ height: "var(--wordmark-height)" }}
      >
        <span className="relative block h-full">
          <Wordmark />
          <animated.span
            aria-hidden
            className="absolute inset-0"
            style={{
              opacity: progress.to((p) =>
                range(p, TIMELINE.invert[0], TIMELINE.invert[1]),
              ),
            }}
          >
            <Wordmark inverse />
          </animated.span>
        </span>
      </Link>

      {/* The right group: the site's own controls. Figma sets these at 16 and
          top 25, a pairing that only existed to make the larger cap-height sit
          level with the 14 menu. At a matched size they share the menu's top.
          Above the overlay while the menu is open, so the burger that opened
          it can close it. */}
      <nav
        aria-label={labels.account}
        className={`pointer-events-auto absolute top-u-29 right-u-40 hidden lg:block ${isMenuOpen ? "z-50 text-content" : ""}`}
      >
        {/* Continues the primary nav's count rather than restarting it, so the
            whole top line reads as one pass across the page. */}
        {/* `hero-utilities` (app/lumiere/sections.css): the site's controls carry
            their own charcoal classes; here they take the stage's `currentColor`
            — black on the paper, white over the photograph — so they stay
            legible through the inversion (P2b item 7). */}
        <ul className="hero-utilities flex list-none items-center gap-u-24 font-manrope text-nav font-medium uppercase">
          {[utilities.langSwitcher, utilities.account, utilities.cart, utilities.search].map((node, index) => (
            <RevealItem
              key={index}
              className="flex items-center"
              delay={REVEAL.chrome + (nav.length + index) * ITEM_STAGGER}
            >
              {node}
            </RevealItem>
          ))}
          <RevealItem className="flex items-center" delay={REVEAL.chrome + (nav.length + 4) * ITEM_STAGGER}>
            <BurgerButton buttonRef={wideBurger} open={isMenuOpen} onClick={() => setIsMenuOpen((open) => !open)} controls={MENU_ID} labels={labels} className="-mr-[10px]" />
          </RevealItem>
        </ul>
      </nav>

      {/* Compact bar. Below 1024 the two navs above stand down and their links
          move into the overlay — the cart stays out because it is the one thing
          a shopper reaches for without opening a menu. */}
      {/* z-50 puts the bar above the overlay: at z-20 the button that opens the
          menu sat underneath it, leaving no way to close it again. */}
      <animated.div
        data-reveal
        className={`pointer-events-auto absolute inset-x-0 top-u-29 z-50 flex items-center justify-between px-u-40 md:flex-row-reverse lg:hidden ${
          isMenuOpen ? "text-content" : ""
        }`}
        // Held at rest once the menu is open, or the bar would drift under the
        // overlay if the entrance were still running.
        style={isMenuOpen ? undefined : chromeReveal}
      >
        <span className="hero-utilities flex min-h-[44px] items-center gap-u-12 font-manrope text-nav font-medium uppercase">
          {utilities.search}
          {utilities.cart}
        </span>

        {/* The two bars cross into an X when the menu opens. Both are anchored
            on the same centre line and only ever move by transform, so the
            morph costs nothing and reverses cleanly if it is interrupted. */}
        <button
          ref={compactBurger}
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls={MENU_ID}
          onClick={() => setIsMenuOpen((open) => !open)}
          // The negative margin pulls the bars out to the gutter; once the row
          // reverses it has to pull the other way.
          className="relative -mr-[10px] size-[44px] md:-ml-[10px] md:mr-0"
        >
          <span className="sr-only">
            {isMenuOpen ? labels.closeMenu : labels.openMenu}
          </span>

          <span
            aria-hidden
            className="absolute top-1/2 right-[10px] block h-px bg-current transition-transform duration-300 md:right-auto md:left-[10px]"
            style={{
              width: BAR_WIDTH,
              transform: `translateY(${-BAR_GAP + BAR_GAP * icon.top}px) rotate(${45 * icon.top}deg)`,
            }}
          />
          <span
            aria-hidden
            className="absolute top-1/2 right-[10px] block h-px bg-current transition-[transform,width] duration-300 md:right-auto md:left-[10px]"
            style={{
              // The shorter bar grows to match as it becomes half of the cross.
              width: `${BAR_WIDTH * (SHORT_BAR_RATIO + (1 - SHORT_BAR_RATIO) * icon.top)}px`,
              transform: `translateY(${BAR_GAP - BAR_GAP * icon.top}px) rotate(${-45 * icon.top}deg)`,
            }}
          />
        </button>
      </animated.div>

      <MenuOverlay
        id={MENU_ID}
        open={isMenuOpen}
        onClose={close}
        nav={nav}
        menu={menu}
        utilities={{ langSwitcher: utilities.langSwitcher, account: utilities.account }}
        labels={labels}
        homeHref={homeHref}
        returnTo={compactBurger}
      />
      {/* Keeps the utility count in the reveal arithmetic honest when groups change. */}
      <span hidden data-utilities={utilityCount} />
    </header>
  );
};
