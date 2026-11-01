/**
 * ONE SCROLL LOCK for every dialog that holds the page still behind it: the
 * phone drawer (components/site/mobile-nav.tsx), the search sheet
 * (components/site/search-box.tsx), the layaway piece picker
 * (components/commerce/layaway-piece-picker.tsx), the catalog filter sheet
 * (components/catalog/catalog-grid.tsx) and the full-screen gallery viewer
 * (components/catalog/gallery-viewer.tsx).
 *
 * Each of them used to set `body.style.overflow = "hidden"` by hand. That
 * still stops the native scroll, but with Lenis mounted (P1,
 * docs/tasks/lumiere-p0-report.md §3.2) a wheel over the open dialog would
 * keep feeding Lenis's virtual scroll, and the page behind would move — or
 * jump the moment the dialog closed. So the lock does both: the overflow, and
 * `stop()` on the scroll store, which the Lenis controller turns into
 * `lenis.stop()` (components/lumiere/scroll-layout.tsx). On a page without
 * Lenis (/checkout, /account, /login, /auth) the store flag is harmless.
 *
 * Nested locks are counted: the second caller does not unlock the first.
 *
 * THE PAGE STAYS WHERE IT WAS (P3, the pre-existing bug: opening the phone
 * menu or the search sheet moved the page, and closing them left it near the
 * top). The cause is not the lock itself: when a dialog closes it hands focus
 * back to its trigger, and the trigger sits in the sticky header. Chrome's
 * scroll-into-view for an element inside a `position: sticky` box scrolls to
 * the box's STATIC position (the top of the document), not to where the box
 * is drawn — so the page jumped to the header's resting place (measured:
 * 840 → 428 → 16 px on /en/about at 375, Lenis on or off; a raw tap, not a
 * test artefact). Two guards, both here or next to here:
 *   1. the lock records `scrollY` and the release restores it (and tells
 *      Lenis, immediately, so its own position agrees) — nothing legitimate
 *      can move a locked page, so a difference at release is always the bug;
 *   2. `focusWithoutScroll` below is what every dialog uses to hand focus
 *      back — `focus({ preventScroll: true })` — so the jump never starts.
 *
 *   useEffect(() => lockScroll(), [open]);                  // release on cleanup
 *   const release = lockScroll(); … release();
 */
import { useScroll } from "@/lib/lumiere/scroll-store";

let depth = 0;
let previous: { body: string; html: string; y: number } | null = null;

/**
 * Focus an element without letting the browser scroll it into view — for a
 * dialog's own controls (already on screen: it is fixed) and for the trigger
 * focus returns to (in the sticky header, see above). Safe to call with null.
 */
export const focusWithoutScroll = (el: HTMLElement | null | undefined): void => {
  el?.focus({ preventScroll: true });
};

export interface ScrollLockOptions {
  /**
   * Also set `overflow: hidden` on `<html>`. The gallery viewer locks the root
   * (its scrollbar-width padding assumes the root scrollbar is gone); the
   * drawers and sheets lock the body, as they always did. Note `html` carries
   * `overflow-x: clip`, so a body `overflow: hidden` does not propagate to the
   * viewport — each dialog keeps the exact element it locked before P1.
   */
  root?: boolean;
}

export const lockScroll = ({ root = false }: ScrollLockOptions = {}): (() => void) => {
  if (typeof document === "undefined") return () => undefined;
  depth += 1;
  if (depth === 1) {
    previous = { body: document.body.style.overflow, html: document.documentElement.style.overflow, y: typeof window === "undefined" ? 0 : window.scrollY };
    document.body.style.overflow = "hidden";
    useScroll.getState().stop();
  }
  if (root) document.documentElement.style.overflow = "hidden";
  let released = false;
  return () => {
    if (released) return;
    released = true;
    depth = Math.max(0, depth - 1);
    if (depth === 0) {
      document.body.style.overflow = previous?.body ?? "";
      document.documentElement.style.overflow = previous?.html ?? "";
      const y = previous?.y;
      previous = null;
      // Guard 1: back to where the page was before the lock, if anything moved it.
      if (typeof window !== "undefined" && typeof y === "number" && Math.abs(window.scrollY - y) > 1) {
        window.scrollTo({ top: y, left: 0, behavior: "instant" as ScrollBehavior });
        useScroll.getState().lenis?.scrollTo(y, { immediate: true, force: true });
      }
      useScroll.getState().start();
    }
  };
};

/** How many locks are held — for tests and for the controller's own checks. */
export const scrollLockDepth = (): number => depth;
