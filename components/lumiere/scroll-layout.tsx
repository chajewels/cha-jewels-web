"use client";

/**
 * THE LENIS CONTROLLER (adapted from the reference's src/layouts/scroll-layout.tsx;
 * docs/tasks/lumiere-p0-report.md §3.2, owner decision D-13).
 *
 * Mounted once in app/layout.tsx and renders nothing — unlike the reference it
 * wraps no element around the page, so the existing layout's `body > *`
 * children (the drawers' `inert` logic reads them) are untouched.
 *
 * It creates ONE window-scrolling Lenis (`smoothWheel`, `wheelMultiplier`
 * 0.65 — one notch covers less of the hero's long pin) and keeps it:
 *  - OFF on the transactional routes: `/checkout/**`, `/account/**`, `/login`,
 *    `/auth/**` (lib/lumiere/lenis-paths.ts). Navigating into one destroys the
 *    instance; navigating out creates it again.
 *  - NOT CREATED under `prefers-reduced-motion: reduce` (the setting is
 *    subscribed, so a change while the page is open is honoured).
 *  - Ticking on the shared animation ticker (lib/animation/ticker.ts), so the
 *    page runs one requestAnimationFrame for Lenis, the scroll stages and the
 *    springs (§10 step 5), never a loop of its own.
 *  - Stopped and started from the scroll store (lib/lumiere/scroll-store.ts),
 *    which is what lib/scroll-lock.ts drives for the dialogs.
 *  - In charge of in-page anchors: `html { scroll-behavior: smooth }` is gone
 *    from app/globals.css, and a click on a same-page `#hash` link glides
 *    through `lenis.scrollTo` (below the sticky header, focus moved like a
 *    native jump). On a page without Lenis the browser's own jump stands.
 *
 * Native scroll still happens — Lenis writes `scrollTop` each frame — so
 * `scrollY`, `getBoundingClientRect`, IntersectionObserver, `position: sticky`
 * and `scrollIntoView` keep working on every existing page. Inner scroll
 * containers carry `data-lenis-prevent`, so the wheel scrolls them, not the page.
 *
 * `window.scrollTo(0, 0)` on mount and the 300 ms hash re-scroll of the
 * reference are NOT ported: both would fight the browser's scroll
 * restoration on the existing pages.
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

import { subscribeToTicker } from "@/lib/animation/ticker";
import { lenisAllowed } from "@/lib/lumiere/lenis-paths";
import { useScroll } from "@/lib/lumiere/scroll-store";
import { focusAnchorTarget, scrollTo } from "@/lib/lumiere/scroll-to";
import { useReduced } from "@/components/fx/media";

/** Every frame: a smoothed scroll must not lag the wheel. */
const everyFrame = () => 0;

export const LENIS_OPTIONS = {
  smoothWheel: true,
  wheelMultiplier: 0.65,
  // The shared ticker drives `raf`; Lenis must not start a loop of its own.
  autoRaf: false,
  // Reduced motion is handled by not creating the instance at all; left on as
  // a second belt should the media query flip between render and effect.
  respectReducedMotion: true,
} as const;

export function ScrollLayout() {
  const pathname = usePathname();
  const reduced = useReduced();
  const allowed = lenisAllowed(pathname);
  // `null` (not yet asked) counts as reduced: never start smoothing before the
  // client has answered, so motion never leaks to a reader who asked for none.
  const enabled = allowed && reduced === false;

  useEffect(() => {
    if (!enabled) return;
    const lenis = new Lenis(LENIS_OPTIONS);
    useScroll.getState().setLenis(lenis);
    if (!useScroll.getState().isEnableScroll) lenis.stop();
    const unsubscribe = subscribeToTicker((time) => lenis.raf(time), everyFrame);

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href*='#']");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) return;
      const id = decodeURIComponent(url.hash.slice(1));
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      history.pushState(null, "", url.hash);
      scrollTo(target);
      focusAnchorTarget(target);
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      // Unsubscribe before destroying — otherwise the ticker keeps calling
      // `raf` on a destroyed instance after unmount/HMR.
      unsubscribe();
      lenis.destroy();
      if (useScroll.getState().lenis === lenis) useScroll.getState().setLenis(null);
    };
  }, [enabled]);

  // The store's flag → the instance, so a dialog's scroll lock stops the
  // smoothing as well as the native scroll (lib/scroll-lock.ts).
  const isEnableScroll = useScroll((state) => state.isEnableScroll);
  const lenis = useScroll((state) => state.lenis);
  useEffect(() => {
    if (!lenis) return;
    if (isEnableScroll) lenis.start();
    else lenis.stop();
  }, [isEnableScroll, lenis]);

  return null;
}
