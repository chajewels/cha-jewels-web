"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { animated, easings, useSpring } from "@react-spring/web";

import { designUnit } from "@/lib/lumiere/design-unit";
import type { Lang } from "@/lib/i18n-core";
import type { HeroChrome } from "@/components/lumiere/hero/hero-content";
import { RollLink } from "@/components/lumiere/hero/hero-hover";
import { ITEM_STAGGER } from "@/components/lumiere/hero/hero-reveal";
import { CrawlLinks, type CrawlLink } from "@/components/site/crawl-links";
import { isClientNavigation } from "@/components/fx/boot-marker";
import { useReduced } from "@/components/fx/media";
import { CART_ADDED } from "@/components/fx/cart-bump";

import { BurgerButton, MenuOverlay } from "./menu-overlay";

/**
 * THE LUMIÈRE SITE HEADER — the fixed bar on every page but the home (P3;
 * report §7 P3 row, §8 "Nav"; docs/design-refs/halden/site-header.tsx for
 * the recolouring). The same chrome as the hero's header (components/lumiere/
 * hero/hero-header.tsx, built from the same data — components/lumiere/site/
 * chrome-data.tsx):
 *
 *   left    the D-18 labels, rolling on hover (from lg)
 *   centre  the Cha Jewels badge and the name in Instrument Serif (D-3)
 *   right   the site's own controls — the JA/EN toggle, the account, the
 *           live cart count, the search — and the burger, at every width
 *           (the menu lists every destination; a desktop reader needs it too)
 *
 * HALDEN'S RECOLOURING: the bar samples what sits under its midline on every
 * scroll frame — a dark band (`DARK_PANELS`: the dark bands the existing
 * pages use, the Lumière footer and stages) flips it to black with white
 * type; over paper it is frosted bone with black type. A discrete two-state
 * swap on token timing (the one CSS-transition case, ADR-0014); nothing is
 * scrubbed.
 *
 * THE CONTRACTS the old header set are kept: `sticky top-0 z-40` (the
 * announcement bar scrolls away above it, the page body is not covered),
 * `--hdr-h` on <html> for everything that sticks under it (the FAQ column
 * and bar, the catalogue filter bar, the About column), `aria-expanded`
 * on its controls, and the cart bump. It does not hide on the way down the
 * page: Halden's bar stays, and a header that is always there is one a
 * reader never has to fetch back.
 *
 * On the first page load nothing starts hidden (the LCP rule in
 * components/fx/boot-marker.tsx); on a client navigation the labels arrive
 * one after another, as on the home.
 */
export interface SiteHeaderProps {
  lang: Lang;
  chrome: HeroChrome;
  crawl: CrawlLink[];
  messenger: { href: string; label: string } | null;
}

/** Panels that flip the bar to its dark state when they pass under it. */
const DARK_PANELS = ".band-dark, .bg-charcoal-deep, [data-surface=\"dark\"], [data-chrome-tone=\"dark\"], .footer--cha, .featured, .loyalty";

/** The label for the page on screen (by its path, without the language prefix and any hash). */
const isCurrent = (path: string | null, href: string): boolean => {
  const bare = (v: string) => v.split(/[?#]/)[0].replace(/^\/(en|ja)(?=\/|$)/, "").replace(/\/$/, "") || "/";
  const here = bare(path ?? "/"), there = bare(href);
  return there !== "/" && (here === there || here.startsWith(there + "/"));
};

const BADGE = { src: "/images/brand/logo-badge-192.webp", size: 192 } as const;
const MENU_ID = "site-menu";
const ENTRANCE = { duration: 880, easing: easings.easeOutCubic } as const;

const Item = ({ index, play, children, className = "" }: { index: number; play: boolean; children: React.ReactNode; className?: string }) => {
  const reduced = useReduced();
  const { t } = useSpring({
    from: { t: play ? 0 : 1 },
    to: { t: 1 },
    delay: play ? 120 + index * ITEM_STAGGER : 0,
    immediate: !play || reduced !== false,
    config: ENTRANCE,
  });
  return (
    <animated.li className={className} style={{ opacity: t, transform: t.to((v) => `translate3d(0, ${(1 - v) * 10}px, 0)`) }}>
      {children}
    </animated.li>
  );
};

export const SiteHeader = ({ lang, chrome, crawl, messenger }: SiteHeaderProps) => {
  const { nav, utilities, menu, labels, homeHref } = chrome;
  const ref = useRef<HTMLElement>(null);
  const burger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const path = usePathname();
  // Entrances only on a client navigation (boot-marker.tsx); read once.
  const [play] = useState(() => isClientNavigation());

  // The tone under the bar, and the bar's height for whatever sticks under it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    let frame = 0;
    const measure = () => {
      frame = 0;
      // The bar's midline in viewport coordinates (it is sticky, not fixed:
      // at the top of the page the announcement bar sits above it).
      const bar = el.getBoundingClientRect();
      const line = bar.top + bar.height / 2;
      let onDark = false;
      for (const panel of document.querySelectorAll<HTMLElement>(DARK_PANELS)) {
        const rect = panel.getBoundingClientRect();
        if (rect.height > 0 && rect.top <= line && rect.bottom > line) { onDark = true; break; }
      }
      setDark(onDark);
      root.style.setProperty("--hdr-h", `${el.offsetHeight}px`);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener(CART_ADDED, schedule);
    const observer = new ResizeObserver(schedule);
    observer.observe(el);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener(CART_ADDED, schedule);
      observer.disconnect();
    };
  }, []);

  const utilityNodes = [utilities.langSwitcher, utilities.account, utilities.cart, utilities.search];

  return (
    <header ref={ref} data-site-header data-tone={dark ? "dark" : "light"} className="lm-site-header sticky top-0 z-[60]">
      <div className="lm-site-header__bar">
        <nav aria-label={labels.primary} className="lm-site-header__nav hidden lg:block">
          <ul className={`flex list-none items-center gap-u-40 font-manrope text-nav font-medium ${lang === "en" ? "uppercase" : ""}`}>
            {nav.map((link, index) => (
              <Item key={link.href} index={index} play={play}>
                <RollLink href={link.href} className="inline-flex" current={isCurrent(path, link.href)}>{link.label}</RollLink>
              </Item>
            ))}
          </ul>
        </nav>

        <Link href={homeHref} aria-label={labels.home} className="lm-site-header__mark" style={{ height: "var(--wordmark-height)" }}>
          <span className="flex h-full items-center" style={{ gap: designUnit(8) }}>
            <Image src={BADGE.src} alt="" width={BADGE.size} height={BADGE.size} sizes="(max-width: 480px) 36px, 40px" priority className="block h-full w-auto" />
            <span className="lm-site-header__name font-serif text-wordmark whitespace-nowrap">Cha Jewels</span>
          </span>
        </Link>

        <nav aria-label={labels.account} className="lm-site-header__tools">
          <ul className={`hero-utilities flex list-none items-center gap-u-16 font-manrope text-nav font-medium ${lang === "en" ? "uppercase" : ""}`}>
            {utilityNodes.map((node, index) => (
              <Item key={index} index={nav.length + index} play={play} className={`flex items-center${index < 2 ? " lm-site-header__wide" : ""}`}>
                {node}
              </Item>
            ))}
            <Item index={nav.length + utilityNodes.length} play={play} className="flex items-center">
              <BurgerButton buttonRef={burger} open={open} onClick={() => setOpen((o) => !o)} controls={MENU_ID} labels={labels} className="-mr-[10px]" />
            </Item>
          </ul>
        </nav>
      </div>

      {/* Closed: the menu's destinations as a hidden list in the initial HTML. */}
      {!open && <CrawlLinks links={crawl} />}

      <MenuOverlay
        id={MENU_ID}
        open={open}
        onClose={() => setOpen(false)}
        nav={nav}
        menu={menu}
        utilities={{ langSwitcher: utilities.langSwitcher, account: utilities.account }}
        labels={labels}
        homeHref={homeHref}
        messenger={messenger}
        portal
        returnTo={burger}
      />
    </header>
  );
};
