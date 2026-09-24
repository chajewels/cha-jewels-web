"use client";
import { useEffect, useRef } from "react";
import { HEADER } from "@/lib/motion";
import { useReduced } from "@/components/fx/media";
import { ComponentStyle } from "@/components/fx/component-style";
import { CART_ADDED } from "@/components/fx/cart-bump";

const CSS = `
.fx-header { transition: transform var(--hdr-show) var(--ease-lux), background-color var(--dur-reveal) var(--ease-lux), box-shadow var(--dur-reveal) var(--ease-lux); }
.fx-header[data-solid] { background-color: color-mix(in srgb, var(--c-chalk) 95%, transparent); box-shadow: 0 1px 8px rgba(0,0,0,.06); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); }
.fx-header[data-hidden] { transform: translateY(-100%); transition-duration: var(--hdr-hide), var(--dur-reveal), var(--dur-reveal); transition-timing-function: cubic-bezier(.5, 0, .75, 0), var(--ease-lux), var(--ease-lux); }
@media (prefers-reduced-motion: reduce) { .fx-header { transition: none; } }`;

/**
 * The header's <header> element, with its scroll behaviour. The header's
 * content stays a server component (components/site/header.tsx) and is passed
 * in as children.
 *
 *   background  flat chalk, like the page, at the very top; past
 *               HEADER.solidAfter px it takes its frosted chalk, blur and
 *               shadow (`data-solid`).
 *   hide/show   going down the page (past HEADER.hideAfter) it slides away;
 *               any movement back up — more than HEADER.delta px — brings it
 *               back. It NEVER hides while one of its controls is open (any
 *               `aria-expanded="true"` inside it: the Company and Collections
 *               menus, the search suggestions, the account menu, the mobile
 *               drawer's trigger) or while focus is inside it; tabbing into a
 *               hidden header brings it back. It also comes back when a piece
 *               is added to the cart, so the bag's bump is seen.
 *
 * Reduced motion: it never hides, and the background changes without a
 * transition. One passive scroll listener, one frame per scroll burst.
 */
export function HeaderShell({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReduced();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced === null) return;
    let last = Math.max(0, window.scrollY);
    let frame = 0;
    // THE HEADER'S VISIBLE HEIGHT, for everything that sticks under it
    // (--hdr-h on <html>: the FAQ category column and bar, the About column).
    // Its full height while shown, 0 while hidden, so a sticky element slides
    // up with the header and back down with it instead of leaving a gap.
    const root = document.documentElement;
    const publish = () => root.style.setProperty("--hdr-h", el.dataset.hidden === undefined ? `${el.offsetHeight}px` : "0px");
    const show = () => { delete el.dataset.hidden; publish(); };
    const held = () => !!el.querySelector('[aria-expanded="true"]') || el.contains(document.activeElement);
    const tick = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      if (y > HEADER.solidAfter) el.dataset.solid = ""; else delete el.dataset.solid;
      const dy = y - last;
      if (Math.abs(dy) < HEADER.delta && y > HEADER.hideAfter) return; // a jitter, not a change of direction
      last = y;
      if (reduced || y <= HEADER.hideAfter || dy < 0 || held()) show();
      else { el.dataset.hidden = ""; publish(); }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(tick); };
    tick();
    publish();
    window.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("focusin", show);
    window.addEventListener(CART_ADDED, show);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      el.removeEventListener("focusin", show);
      window.removeEventListener(CART_ADDED, show);
    };
  }, [reduced]);

  return (
    <header
      ref={ref}
      className={`fx-header ${className}`}
      style={{ ["--hdr-hide" as string]: `${HEADER.hide}s`, ["--hdr-show" as string]: `${HEADER.show}s` }}
    >
      <ComponentStyle id="fx-header" css={CSS} />
      {children}
    </header>
  );
}
