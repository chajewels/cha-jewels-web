/**
 * Programmatic scrolling with Lenis in charge (adapted from the reference's
 * src/utils/scroll-to.ts). Through `lenis.scrollTo` when an instance exists,
 * so the page glides the way a wheel does; through `window.scrollTo` on the
 * pages that have no Lenis (/checkout, /account, /login, /auth — D-13) and
 * under reduced motion, where the jump is instant.
 *
 * `html { scroll-behavior: smooth }` is gone from app/globals.css (it fought
 * Lenis's per-frame `scrollTop` writes), so every in-page anchor comes through
 * here — see `components/lumiere/scroll-layout.tsx`.
 */
import { useScroll } from "@/lib/lumiere/scroll-store";

/**
 * The sticky header's height for the NATIVE fallback only: the same 76px
 * `scroll-padding-top` the stylesheet gives the browser, read live from
 * `--hdr-h` when HeaderShell has published it. Lenis needs no help here — its
 * `scrollTo(element)` already subtracts the root's `scroll-padding-top` and
 * the target's `scroll-margin-top` (lenis.mjs, `scrollTo`), so adding the
 * header again would land every anchor twice as far down.
 */
export const headerOffset = (): number => {
  if (typeof document === "undefined") return 0;
  const raw = getComputedStyle(document.documentElement).getPropertyValue("--hdr-h").trim();
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : 76;
};

export interface ScrollToOptions {
  immediate?: boolean;
  /** Extra offset in px (negative lifts the target); the header offset is already applied to elements. */
  offset?: number;
}

export const scrollTo = (target: string | number | HTMLElement, { immediate = false, offset = 0 }: ScrollToOptions = {}): void => {
  if (typeof window === "undefined") return;
  const el = typeof target === "string" ? document.getElementById(target.replace(/^#/, "")) : target instanceof HTMLElement ? target : null;
  if (typeof target === "string" && !el) return;
  const lenis = useScroll.getState().lenis;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (lenis && !reduced) {
    // Lenis applies scroll-padding-top and scroll-margin-top itself.
    lenis.scrollTo(el ?? (Number(target) || 0), { offset, immediate });
    return;
  }
  // Native: the browser's `window.scrollTo` applies neither, so the header
  // offset and the target's scroll-margin are applied here.
  const margin = el ? parseFloat(getComputedStyle(el).scrollMarginTop) || 0 : 0;
  const top = el ? el.getBoundingClientRect().top + window.scrollY - headerOffset() - margin + offset : (Number(target) || 0) + offset;
  window.scrollTo({ top, behavior: immediate || reduced ? "instant" : "smooth" });
};

/**
 * Move focus the way a native anchor jump does — so the skip link (`#main`)
 * still hands the keyboard to the content — without scrolling again.
 */
export const focusAnchorTarget = (el: HTMLElement): void => {
  const focusable = el.matches("a[href], button, input, select, textarea, [tabindex]");
  if (!focusable) {
    // A temporary programmatic focus target, as the browser's own sequential
    // focus start point: no ring (`<main>` would otherwise be outlined whole),
    // and the attribute leaves with the focus.
    el.setAttribute("tabindex", "-1");
    const outline = el.style.outline;
    el.style.outline = "none";
    el.addEventListener("blur", () => { el.removeAttribute("tabindex"); el.style.outline = outline; }, { once: true });
  }
  el.focus({ preventScroll: true });
};
