"use client";
import { useEffect, useRef } from "react";
import { ComponentStyle } from "@/components/fx/component-style";

/**
 * From lg up the column stays put beside a long column of text. Its top is
 * the header's visible height (--hdr-h, components/site/header-shell.tsx)
 * plus 24px — the /why-cha-jewels offset while the header shows — and it
 * slides with the header when the header hides or returns.
 *
 * A COLUMN TALLER THAN THE SCREEN is never cut off: its top becomes
 * `min(header + 24px, 100vh − its own height − 24px)`, so it scrolls with the
 * page until its bottom is in view and then holds there. --col-h is measured
 * with a ResizeObserver; nothing re-renders.
 *
 * Sticky within its grid cell (align-self: start), so it stops with the
 * section and can never ride over the footer. Below lg: an ordinary block.
 */
const CSS = `
@media (min-width: 1024px) {
  .fx-sticky-col { position: sticky; align-self: start;
    top: min(calc(var(--hdr-h, 68px) + 24px), calc(100vh - var(--col-h, 0px) - 24px));
    transition: top var(--dur-hdr-show) var(--ease-lux); }
}
@media (prefers-reduced-motion: reduce) { .fx-sticky-col { transition: none; } }`;

export function StickyColumn({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => el.style.setProperty("--col-h", `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} className={`fx-sticky-col ${className}`}>
      <ComponentStyle id="fx-sticky-col" css={CSS} />
      {children}
    </div>
  );
}
