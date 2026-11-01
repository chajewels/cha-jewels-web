"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { animated, easings, useSpring } from "@react-spring/web";

import { designUnit } from "@/lib/lumiere/design-unit";
import { focusWithoutScroll, lockScroll } from "@/lib/scroll-lock";
import type { HeroNavLink } from "@/components/lumiere/hero/hero-content";
import { ITEM_STAGGER, MENU_EXIT_MS, MENU_LEAD, MaskedItem } from "@/components/lumiere/hero/hero-reveal";

/**
 * THE LUMIÈRE MENU — the full-screen panel behind the burger, shared by the
 * hero's header on the home (components/lumiere/hero/hero-header.tsx, where
 * it was written for P2) and the fixed site header on every other page
 * (components/lumiere/site/site-header.tsx, P3). Every existing destination
 * is listed: the D-18 labels in the display face, then the categories, the
 * Hub's collections, the company pages and the guides in groups, the language
 * toggle and the account, and the Messenger action (report §8 "Nav").
 *
 * A dialog, and it behaves like one (P3): `role="dialog"` + `aria-modal`,
 * Escape closes, Tab is kept inside, focus moves to the first item on open
 * and back to the trigger on close — WITHOUT SCROLLING either way
 * (lib/scroll-lock.ts explains the jump a sticky header's trigger caused).
 * The page behind is locked through the shared lock, so Lenis stops with it.
 *
 * `portal`: the site header is sticky with a backdrop filter, which makes it
 * the containing block of anything fixed inside it — so there the panel is
 * portalled to <body> and carries its own top row (the wordmark and a close
 * control). The hero's header keeps it inline under its morphing burger.
 */
export interface MenuGroup {
  title: string;
  links: HeroNavLink[];
}

export interface MenuOverlayProps {
  id: string;
  open: boolean;
  onClose: () => void;
  nav: HeroNavLink[];
  menu: MenuGroup[];
  utilities: { langSwitcher: ReactNode; account: ReactNode };
  labels: { menu: string; closeMenu: string; primary: string; home: string };
  homeHref: string;
  messenger?: { href: string; label: string } | null;
  portal?: boolean;
  /** The trigger focus returns to on close. */
  returnTo?: RefObject<HTMLElement | null>;
}

const BADGE = { src: "/images/brand/logo-badge-192.webp", size: 192 } as const;

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

export const MenuOverlay = ({ id, open, onClose, nav, menu, utilities, labels, homeHref, messenger = null, portal = false, returnTo }: MenuOverlayProps) => {
  // Intent and presence are two different things: `open` is what the button
  // says; `mounted` is whether the panel is still in the DOM while it fades.
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const timer = setTimeout(() => setMounted(false), MENU_EXIT_MS);
    return () => clearTimeout(timer);
  }, [open, mounted]);

  // The portal host, created on mount so the server renders nothing for it.
  useEffect(() => {
    if (!portal || !mounted) return;
    const el = document.createElement("div");
    document.body.appendChild(el);
    setHost(el);
    return () => {
      el.remove();
      setHost(null);
    };
  }, [portal, mounted]);

  // A menu that covers the screen must not leave the page scrolling underneath.
  useEffect(() => {
    if (!open) return;
    return lockScroll();
  }, [open]);

  // Focus in on open (once the panel exists — the portal host arrives a render
  // later), back to the trigger on close — neither moves the page.
  useEffect(() => {
    if (!open || (portal && !host)) return;
    const trigger = returnTo?.current ?? null;
    const id = requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      focusWithoutScroll(first);
    });
    return () => {
      cancelAnimationFrame(id);
      focusWithoutScroll(trigger);
    };
  }, [open, portal, host, returnTo]);

  // Escape closes; Tab stays inside the dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !panel.contains(active))) {
        e.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!e.shiftKey && (active === last || !panel.contains(active))) {
        e.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const panel = useSpring({
    opacity: open ? 1 : 0,
    config: { duration: MENU_EXIT_MS, easing: easings.easeOutCubic },
  });
  // The menu's divider, drawn out from the left between the two groups.
  const { divider } = useSpring({
    divider: open ? 1 : 0,
    delay: open ? MENU_LEAD + nav.length * ITEM_STAGGER : 0,
    config: { tension: 120, friction: 26 },
  });

  if (!mounted) return null;
  let menuIndex = 0;

  const dialog = (
    <animated.div
      ref={panelRef}
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label={labels.menu}
      // Spacing in real pixels, not the design unit: a menu has to stand on
      // its own at any size. The padding carries the safe area itself.
      // Scrolls inside (every existing link is listed), not the page.
      data-lenis-prevent
      className={`lm-menu fixed inset-0 flex flex-col overflow-y-auto bg-surface text-content ${portal ? "z-[70]" : "z-40"}`}
      style={{
        paddingLeft: "max(24px, env(safe-area-inset-left))",
        paddingRight: "max(24px, env(safe-area-inset-right))",
        paddingTop: portal ? "max(16px, env(safe-area-inset-top))" : "max(88px, env(safe-area-inset-top))",
        paddingBottom: "max(32px, env(safe-area-inset-bottom))",
        opacity: panel.opacity,
        // A panel on its way out must not still be catching taps meant for the page.
        pointerEvents: open ? "auto" : "none",
      }}
    >
      {portal && (
        <div className="lm-menu__top flex shrink-0 items-center justify-between">
          <Link href={homeHref} aria-label={labels.home} onClick={onClose} className="flex items-center" style={{ gap: designUnit(8), height: "var(--wordmark-height)" }}>
            <Image src={BADGE.src} alt="" width={BADGE.size} height={BADGE.size} sizes="40px" className="block h-full w-auto" />
            <span className="font-serif text-wordmark whitespace-nowrap">Cha Jewels</span>
          </Link>
          <button type="button" onClick={onClose} aria-label={labels.closeMenu} className="lm-chrome__icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" /></svg>
          </button>
        </div>
      )}

      <div className="my-auto">
        {/* The primary labels get the headline's treatment: each rises out
            from behind its own edge, one after the next. */}
        <nav aria-label={labels.primary}>
          <ul className="flex list-none flex-col gap-[4px] font-serif">
            {nav.map((link, index) => (
              <li key={link.href}>
                <Link href={link.href} onClick={onClose} className="flex min-h-[44px] items-center text-[clamp(28px,8vw,34px)] leading-[1.2]">
                  <MaskedItem active={open} delay={MENU_LEAD + index * ITEM_STAGGER}>
                    {link.label}
                  </MaskedItem>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <animated.span aria-hidden className="my-[20px] block w-[48px] origin-left bg-current opacity-30" style={{ height: designUnit(0.7), scaleX: divider }} />

        {/* Every other destination the site has, in its groups, in the small
            face, each still rising on its own beat. On a wide screen the
            groups sit side by side (lm-menu__groups). */}
        <div className="lm-menu__groups">
          {menu.map((group) => (
            <nav key={group.title} aria-label={group.title} className="mb-[20px]">
              <p className="mb-[6px] font-manrope text-[11px] font-medium uppercase tracking-utility opacity-50">{group.title}</p>
              <ul className="flex list-none flex-col gap-0 font-serif">
                {group.links.map((link) => {
                  const delay = MENU_LEAD + (nav.length + 1 + menuIndex++) * ITEM_STAGGER;
                  return (
                    <li key={link.href}>
                      <Link href={link.href} onClick={onClose} className="flex min-h-[40px] items-center text-[clamp(18px,5vw,22px)] leading-[1.2]">
                        <MaskedItem active={open} delay={Math.min(delay, MENU_LEAD + 14 * ITEM_STAGGER)}>
                          {link.label}
                        </MaskedItem>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ))}
        </div>

        {/* The language toggle and the account, as the site renders them; the
            Messenger action as the phone drawer carried it. */}
        <div className="hero-utilities mt-[8px] flex flex-wrap items-center gap-[16px] font-manrope text-nav font-medium uppercase">
          {utilities.langSwitcher}
          {utilities.account}
          {messenger && (
            <a href={messenger.href} target="_blank" rel="noopener noreferrer" className="lm-pill lm-pill--outline" data-analytics="menu-messenger">
              {messenger.label}
            </a>
          )}
        </div>
      </div>
    </animated.div>
  );

  if (!portal) return dialog;
  return host ? createPortal(dialog, host) : null;
};

/** Burger geometry, in px. The bars sit inside a 44px target. */
const BAR_WIDTH = 24;
/** Half the distance between the two bars at rest. */
const BAR_GAP = 3;
/** The lower bar is shorter when closed, full length once it forms the cross. */
const SHORT_BAR_RATIO = 0.66;

export interface BurgerButtonProps {
  open: boolean;
  onClick: () => void;
  controls: string;
  labels: { openMenu: string; closeMenu: string };
  className?: string;
  /** Which edge the bars sit against inside the 44px box. */
  side?: "left" | "right";
  buttonRef?: RefObject<HTMLButtonElement | null>;
}

/**
 * The two bars that cross into an X when the menu opens. Both are anchored on
 * the same centre line and only ever move by transform, so the morph costs
 * nothing and reverses cleanly if it is interrupted.
 */
export const BurgerButton = ({ open, onClick, controls, labels, className = "", side = "right", buttonRef }: BurgerButtonProps) => {
  const icon = useSpring({ top: open ? 1 : 0, config: { tension: 320, friction: 26 } });
  const edge = side === "right" ? "right-[10px]" : "left-[10px]";
  return (
    <button ref={buttonRef} type="button" aria-expanded={open} aria-controls={controls} onClick={onClick} className={`relative size-[44px] ${className}`}>
      <span className="sr-only">{open ? labels.closeMenu : labels.openMenu}</span>
      <animated.span
        aria-hidden
        className={`absolute top-1/2 block h-px bg-current ${edge}`}
        style={{ width: BAR_WIDTH, transform: icon.top.to((t) => `translateY(${-BAR_GAP + BAR_GAP * t}px) rotate(${45 * t}deg)`) }}
      />
      <animated.span
        aria-hidden
        className={`absolute top-1/2 block h-px bg-current ${edge}`}
        style={{
          width: icon.top.to((t) => `${BAR_WIDTH * (SHORT_BAR_RATIO + (1 - SHORT_BAR_RATIO) * t)}px`),
          transform: icon.top.to((t) => `translateY(${BAR_GAP - BAR_GAP * t}px) rotate(${-45 * t}deg)`),
        }}
      />
    </button>
  );
};
