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
import type Lenis from "lenis";

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
  // A click on an internal link while a smoothed scroll is still settling
  // stops the inertia, so Next's scroll-to-top on the new page is not
  // overwritten by the old target a frame later.
  stopInertiaOnNavigate: true,
} as const;

const LENIS_CLASSES = ["lenis", "lenis-smooth", "lenis-scrolling", "lenis-stopped", "lenis-locked", "lenis-autoToggle"];
/** A destroyed Lenis can still write its root classes once more (an animation frame already queued). Strip them now and for a moment after, so a route where Lenis is off never carries them. */
let stopStripping: (() => void) | null = null;
function stripLenisClasses() {
  const root = document.documentElement;
  stopStripping?.();
  const strip = () => { if (LENIS_CLASSES.some((c) => root.classList.contains(c))) root.classList.remove(...LENIS_CLASSES); };
  strip();
  const observer = new MutationObserver(strip);
  observer.observe(root, { attributes: true, attributeFilter: ["class"] });
  const timer = window.setTimeout(() => { stopStripping = null; observer.disconnect(); strip(); }, 800);
  // A new instance (the reader went back to a page where Lenis runs) ends the sweep at once, so its classes are never stripped.
  stopStripping = () => { stopStripping = null; window.clearTimeout(timer); observer.disconnect(); };
}

export function ScrollLayout() {
  const pathname = usePathname();
  const reduced = useReduced();
  const allowed = lenisAllowed(pathname);
  // `null` (not yet asked) counts as reduced: never start smoothing before the
  // client has answered, so motion never leaks to a reader who asked for none.
  const enabled = allowed && reduced === false;

  useEffect(() => {
    if (!enabled) return;
    // Loaded here, not at the top of the module: the controller sits in the
    // root layout, and a static import would put the library in the first
    // load of every page, /checkout and /account included, where no instance
    // is ever created. The effect may be cleaned up before the import lands.
    let cancelled = false;
    let lenis: Lenis | null = null;
    let unsubscribe: (() => void) | null = null;
    import("lenis").then(({ default: LenisCtor }) => {
      if (cancelled) return;
      stopStripping?.();
      lenis = new LenisCtor(LENIS_OPTIONS);
      useScroll.getState().setLenis(lenis);
      if (!useScroll.getState().isEnableScroll) lenis.stop();
      const instance = lenis;
      unsubscribe = subscribeToTicker((time) => instance.raf(time), everyFrame);
    });

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
      // The history entry the browser would have made (no duplicate when the
      // hash is already there), and the `hashchange` listeners it would have
      // told (components/faq/faq-nav.tsx follows the hash this way).
      if (location.hash !== url.hash) history.pushState(null, "", url.hash);
      else history.replaceState(null, "", url.hash);
      window.dispatchEvent(new HashChangeEvent("hashchange"));
      scrollTo(target);
      focusAnchorTarget(target);
    };
    document.addEventListener("click", onClick);

    return () => {
      cancelled = true;
      document.removeEventListener("click", onClick);
      // Unsubscribe before destroying — otherwise the ticker keeps calling
      // `raf` on a destroyed instance after unmount/HMR.
      unsubscribe?.();
      lenis?.destroy();
      // destroy() leaves the root classes behind when it lands mid-scroll (found P4b: a stale `lenis` on <html> after a soft navigation into /account)
      stripLenisClasses();
      if (lenis && useScroll.getState().lenis === lenis) useScroll.getState().setLenis(null);
    };
  }, [enabled]);

  // A route change re-measures the document: the new page has its own height,
  // and Next has already placed the scroll (top, or the restored position).
  useEffect(() => {
    useScroll.getState().lenis?.resize();
  }, [pathname]);

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
