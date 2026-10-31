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
 *   useEffect(() => lockScroll(), [open]);                  // release on cleanup
 *   const release = lockScroll(); … release();
 */
import { useScroll } from "@/lib/lumiere/scroll-store";

let depth = 0;
let previous: { body: string; html: string } | null = null;

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
    previous = { body: document.body.style.overflow, html: document.documentElement.style.overflow };
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
      previous = null;
      useScroll.getState().start();
    }
  };
};

/** How many locks are held — for tests and for the controller's own checks. */
export const scrollLockDepth = (): number => depth;
