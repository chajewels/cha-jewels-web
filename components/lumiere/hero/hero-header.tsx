"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { animated, easings, useSpring } from "@react-spring/web";

import { designUnit } from "@/lib/lumiere/design-unit";
import { lockScroll } from "@/lib/scroll-lock";

import { range } from "./hero-geometry";
import { useHeroContent } from "./hero-content";
import { RollLink } from "./hero-hover";
import {
  ITEM_STAGGER,
  MENU_EXIT_MS,
  MENU_LEAD,
  MaskedItem,
  REVEAL,
  RevealItem,
  useRevealSpring,
} from "./hero-reveal";
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
 *            count (CartBump), the search
 *   phone    the compact bar — cart and the burger — and the overlay, every
 *            existing destination in groups, each label rising out of its mask
 *
 * As in the reference the header lives inside the pinned hero and takes its
 * colour from the stage (`currentColor`); P3 puts a fixed, recolouring header
 * on every page. The mobile tab bar stays (D-19, root layout).
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
  // Intent and presence are two different things. `isMenuOpen` is what the
  // button says; this is whether the panel is still in the DOM. Closing sets
  // the first to false and leaves the second true until the fade is over —
  // without it the overlay unmounts on the click and the menu does not leave,
  // it disappears.
  const [isMenuMounted, setIsMenuMounted] = useState(false);
  // The wordmark and the compact bar arrive as one; the desktop nav items carry
  // their own staggered entrances instead.
  const chromeReveal = useRevealSpring(REVEAL.chrome, 10);
  // The menu's divider, drawn out from the left between the two groups.
  const { divider } = useSpring({
    divider: isMenuOpen ? 1 : 0,
    delay: isMenuOpen ? MENU_LEAD + nav.length * ITEM_STAGGER : 0,
    config: { tension: 120, friction: 26 },
  });

  // 0 is the burger, 1 the cross. One value drives both bars, so they can never
  // fall out of step with each other or with the button's state.
  const icon = useSpring({
    top: isMenuOpen ? 1 : 0,
    config: { tension: 320, friction: 26 },
  });

  // A menu that covers the screen must not leave the page scrolling underneath
  // — the shared lock, so Lenis stops with it (lib/scroll-lock.ts).
  useEffect(() => {
    if (!isMenuOpen) return;
    return lockScroll();
  }, [isMenuOpen]);

  // Mount on the way in, unmount a beat after the way out.
  useEffect(() => {
    if (isMenuOpen) {
      setIsMenuMounted(true);

      return;
    }

    if (!isMenuMounted) return;

    const id = setTimeout(() => setIsMenuMounted(false), MENU_EXIT_MS);

    return () => clearTimeout(id);
  }, [isMenuOpen, isMenuMounted]);

  const panel = useSpring({
    opacity: isMenuOpen ? 1 : 0,
    config: { duration: MENU_EXIT_MS, easing: easings.easeOutCubic },
  });

  const close = () => setIsMenuOpen(false);
  const utilityCount = 4;
  let menuIndex = 0;

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
          level with the 14 menu. At a matched size they share the menu's top. */}
      <nav
        aria-label={labels.account}
        className="pointer-events-auto absolute top-u-29 right-u-40 hidden lg:block"
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
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="hero-menu"
          onClick={() => setIsMenuOpen((open) => !open)}
          // The negative margin pulls the bars out to the gutter; once the row
          // reverses it has to pull the other way.
          className="relative -mr-[10px] size-[44px] md:-ml-[10px] md:mr-0"
        >
          <span className="sr-only">
            {isMenuOpen ? labels.closeMenu : labels.openMenu}
          </span>

          <animated.span
            aria-hidden
            className="absolute top-1/2 right-[10px] block h-px bg-current md:right-auto md:left-[10px]"
            style={{
              width: BAR_WIDTH,
              transform: icon.top.to(
                (t) =>
                  `translateY(${-BAR_GAP + BAR_GAP * t}px) rotate(${45 * t}deg)`,
              ),
            }}
          />
          <animated.span
            aria-hidden
            className="absolute top-1/2 right-[10px] block h-px bg-current md:right-auto md:left-[10px]"
            style={{
              // The shorter bar grows to match as it becomes half of the cross.
              width: icon.top.to(
                (t) =>
                  `${BAR_WIDTH * (SHORT_BAR_RATIO + (1 - SHORT_BAR_RATIO) * t)}px`,
              ),
              transform: icon.top.to(
                (t) =>
                  `translateY(${BAR_GAP - BAR_GAP * t}px) rotate(${-45 * t}deg)`,
              ),
            }}
          />
        </button>
      </animated.div>

      {isMenuMounted && (
        <animated.div
          id="hero-menu"
          role="dialog"
          aria-modal="true"
          aria-label={labels.menu}
          // Spacing here is in real pixels, not the spacing scale. That scale is
          // one design unit — `gap-u-24` would mean 24 x 0.72 = 17px — which is
          // right for reproducing Figma and wrong for a menu that has to stand
          // on its own at any size.
          // Padding carries the safe area itself rather than delegating to
          // `inset-safe`. That utility *sets* padding, so on a phone without a
          // notch it resolves to 0 and wipes out the gutter.
          // Scrolls inside (every existing link is listed), not the page.
          data-lenis-prevent
          className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-surface text-content lg:hidden"
          style={{
            paddingLeft: "max(24px, env(safe-area-inset-left))",
            paddingRight: "max(24px, env(safe-area-inset-right))",
            paddingTop: "max(88px, env(safe-area-inset-top))",
            paddingBottom: "max(32px, env(safe-area-inset-bottom))",
            opacity: panel.opacity,
            // A panel on its way out must not still be catching taps meant for
            // the page underneath.
            pointerEvents: isMenuOpen ? "auto" : "none",
          }}
        >
          <div className="my-auto">
            {/* The primary labels get the headline's treatment: each rises out
                from behind its own edge, one after the next. The mask sits
                inside the link rather than around it, so the 44px tap target
                is untouched. */}
            <nav aria-label={labels.primary}>
              <ul className="flex list-none flex-col gap-[4px] font-serif">
                {nav.map((link, index) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={close}
                      // min-height, not padding alone: the tap target has to
                      // hold 44px even when the type clamps down on a short
                      // screen.
                      className="flex min-h-[44px] items-center text-[clamp(28px,8vw,34px)] leading-[1.2]"
                    >
                      <MaskedItem
                        active={isMenuOpen}
                        delay={MENU_LEAD + index * ITEM_STAGGER}
                      >
                        {link.label}
                      </MaskedItem>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* The rule draws itself out from the left on the same beat as the
                item it separates, so the divider arrives with the group rather
                than sitting there waiting for it. */}
            <animated.span
              aria-hidden
              className="my-[20px] block w-[48px] origin-left bg-current opacity-30"
              style={{ height: designUnit(0.7), scaleX: divider }}
            />

            {/* Every other destination the site has, in its groups — the
                collections, the categories, the company pages, the guides, the
                account — in the small face, each still rising on its own beat. */}
            {menu.map((group) => (
              <nav key={group.title} aria-label={group.title} className="mb-[20px]">
                <p className="mb-[6px] font-manrope text-[11px] font-medium uppercase tracking-utility opacity-50">{group.title}</p>
                <ul className="flex list-none flex-col gap-0 font-serif">
                  {group.links.map((link) => {
                    const delay = MENU_LEAD + (nav.length + 1 + menuIndex++) * ITEM_STAGGER;
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={close}
                          className="flex min-h-[40px] items-center text-[clamp(18px,5vw,22px)] leading-[1.2]"
                        >
                          <MaskedItem active={isMenuOpen} delay={Math.min(delay, MENU_LEAD + 14 * ITEM_STAGGER)}>
                            {link.label}
                          </MaskedItem>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            ))}

            {/* The language toggle and the account, as the site renders them. */}
            <div className="mt-[8px] flex flex-wrap items-center gap-[16px] font-manrope text-nav font-medium uppercase">
              {utilities.langSwitcher}
              {utilities.account}
            </div>
          </div>
        </animated.div>
      )}
      {/* Keeps the utility count in the reveal arithmetic honest when groups change. */}
      <span hidden data-utilities={utilityCount} />
    </header>
  );
};
