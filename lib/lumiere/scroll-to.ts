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
 * The sticky header's height, so a target lands below it — the same 76px
 * `scroll-padding-top` the stylesheet gives the browser, read live from
 * `--hdr-h` when HeaderShell has published it.
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
  const elementOffset = el ? -headerOffset() + offset : offset;

  if (lenis && !reduced) {
    if (el) lenis.scrollTo(el, { offset: elementOffset, immediate });
    else lenis.scrollTo(Number(target) || 0, { offset, immediate });
    return;
  }
  const top = el ? el.getBoundingClientRect().top + window.scrollY + elementOffset : (Number(target) || 0) + offset;
  window.scrollTo({ top, behavior: immediate || reduced ? "instant" : "smooth" });
};

/**
 * Move focus the way a native anchor jump does — so the skip link (`#main`)
 * still hands the keyboard to the content — without scrolling again.
 */
export const focusAnchorTarget = (el: HTMLElement): void => {
  const focusable = el.matches("a[href], button, input, select, textarea, [tabindex]");
  if (!focusable) {
    el.setAttribute("tabindex", "-1");
    el.addEventListener("blur", () => el.removeAttribute("tabindex"), { once: true });
  }
  el.focus({ preventScroll: true });
};
