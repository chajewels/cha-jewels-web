"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import { NavItem } from "@/views/home/motion/nav-item";
import { SearchOverlay } from "@/views/home/motion/search-overlay";
import { HERO_PRIMARY_NAV, HERO_UTILITY_NAV } from "@/data/mocks/home";

/**
 * Site header — Figma 2412:215.
 *
 * Lifted out of block 1 and fixed to the viewport so it stays pinned while the
 * page scrolls. Sections marked `data-header-accent` (the red manifesto and
 * footer) flip it to white; over the cream blocks it stays brand red.
 *
 * It also carries an opaque background in the same tone as the block beneath
 * it, so content passing under the bar is covered rather than tangled with it.
 *
 * The swap is a discrete two-state colour change, so it uses the narrow
 * CSS-transition exception with token-backed timing rather than a spring
 * (ADR-0014) — nothing here is scrubbed or interpolated by scroll position.
 */
export const SiteHeader = () => {
  const headerRef = useRef<HTMLElement>(null);
  const [onAccent, setOnAccent] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const header = headerRef.current;
      if (!header) return;

      // Sample the midline of the bar: whichever panel sits under it wins.
      const line = header.getBoundingClientRect().height / 2;
      const panels = document.querySelectorAll<HTMLElement>(
        "[data-header-accent]",
      );

      let accent = false;
      panels.forEach((panel) => {
        const rect = panel.getBoundingClientRect();
        if (rect.top <= line && rect.bottom > line) accent = true;
      });
      setOnAccent(accent);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const tone = onAccent
    ? "text-foreground-on-accent"
    : "text-foreground-accent";

  return (
    <header
      ref={headerRef}
      className={`fixed left-0 top-0 z-50 h-[4.5rem] w-full border-b-[0.08125rem] border-solid transition-colors duration-[var(--duration-normal)] ease-entrance at768:h-[4rem] at390:h-[3.1875rem] ${
        onAccent
          ? "border-foreground-on-accent bg-surface-accent"
          : "border-rule-accent bg-background"
      }`}
    >
      <Link
        href="#"
        className="absolute left-[2rem] top-[1.5rem] font-sans font-medium at1024:left-[1.5rem] at1024:top-[1.6875rem] at768:top-[1.375rem] at390:left-[1rem] at390:top-[0.9375rem]"
        aria-label="Halden — home"
      >
        <span
          className={`absolute left-0 top-[0.125rem] whitespace-nowrap text-label tracking-[0.14em] transition-colors duration-[var(--duration-normal)] ease-entrance ${tone}`}
        >
          HALDEN
        </span>
        {/* The mark follows the wordmark's tone — Figma 2412:216 made the whole
            lockup brand red; it used to carry a black override of its own. */}
        <span
          className={`absolute left-[4.4375rem] top-0 text-nano at1024:left-[4.4375rem] transition-colors duration-[var(--duration-normal)] ease-entrance ${tone}`}
        >
          ®
        </span>
      </Link>

      <nav
        aria-label="Primary"
        className="absolute left-1/2 top-[calc(50%+0.071875rem)] -translate-x-1/2 -translate-y-1/2 at768:left-[calc(50%-2.8125rem)] at390:hidden"
      >
        <ul
          className={`flex items-center gap-[2.5rem] font-display text-body font-bold tracking-[0.08em] transition-colors duration-[var(--duration-normal)] ease-entrance at1024:gap-[1.875rem] at768:gap-[1.25rem] at390:gap-[1rem] at390:text-label ${tone}`}
        >
          {HERO_PRIMARY_NAV.map((item, index) => (
            <NavItem
              key={item.label}
              label={item.label}
              href={item.href}
              onAccent={onAccent}
              delay={120 + index * 70}
            />
          ))}
        </ul>
      </nav>

      <nav
        aria-label="Account and basket"
        className="absolute left-[calc(50%+35.875rem)] top-[calc(50%+0.071875rem)] -translate-x-1/2 -translate-y-1/2 at1024:left-[calc(50%+24rem)] at768:left-[calc(50%+16.625rem)] at390:left-[calc(50%+6.171875rem)]"
      >
        <ul
          className={`flex items-center gap-[2.5rem] font-display text-body font-bold tracking-[0.08em] transition-colors duration-[var(--duration-normal)] ease-entrance at1024:gap-[1.875rem] at768:gap-[1.25rem] at390:gap-[1rem] at390:text-label ${tone}`}
        >
          {HERO_UTILITY_NAV.map((item, index) => (
            <NavItem
              key={item.label}
              label={item.label}
              href={item.href}
              onAccent={onAccent}
              delay={400 + index * 70}
              onActivate={
                item.label === "Search" ? () => setSearchOpen(true) : undefined
              }
            />
          ))}
        </ul>
      </nav>

      <SearchOverlay
        open={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          // Send the caret back where it came from, not to the top of the
          // page. SEARCH is the only item in the bar rendered as a button.
          headerRef.current?.querySelector("button")?.focus();
        }}
      />
    </header>
  );
};
