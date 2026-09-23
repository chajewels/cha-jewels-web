"use client";
// Pattern: the "spotlight card" / "glowing border card" components on
// 21st.dev (MIT). Rewritten onto our tokens with CSS custom properties and
// pseudo-elements instead of extra DOM; fine-pointer, touch and
// reduced-motion paths added. No code copied verbatim; no dependency added.
import { useEffect, useRef } from "react";
import { useFinePointer, useReduced } from "@/components/fx/media";

/**
 * A dark tile with a soft gold light that follows the pointer inside it, and
 * lights the tile's own border where the pointer is nearest.
 *
 * No React state on pointer move: the position goes straight into two CSS
 * custom properties (--mx, --my), once per animation frame, and the glow and
 * the border are radial gradients on ::before / ::after that read them
 * (app/globals.css, `.spotlight`). A pointer sweeping across four tiles
 * re-renders nothing.
 *
 * Fine pointer only. On touch the tile's light rises once, from the upper
 * left, when the tile scrolls into view, and settles to a faint resting glow —
 * the gentler in-view version. Reduced motion: no light at all; the tile is
 * exactly what it was before this pass.
 */
export function Spotlight({ className = "", children }: { className?: string; children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const fine = useFinePointer();
  const reduced = useReduced();
  const frame = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || fine === null || reduced === null) return;
    if (reduced) { el.dataset.lit = "off"; return; }
    if (fine) { el.dataset.lit = "off"; return; }
    // Touch: light once when seen.
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.dataset.lit = "touch"; io.disconnect(); }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [fine, reduced]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const live = fine === true && reduced === false;
  function move(e: React.PointerEvent<HTMLElement>) {
    const el = e.currentTarget;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${clientX - r.left}px`);
      el.style.setProperty("--my", `${clientY - r.top}px`);
      el.dataset.lit = "on";
    });
  }
  function leave(e: React.PointerEvent<HTMLElement>) {
    cancelAnimationFrame(frame.current);
    e.currentTarget.dataset.lit = "off";
  }

  return (
    <article
      ref={ref}
      className={`spotlight ${className}`}
      onPointerMove={live ? move : undefined}
      onPointerLeave={live ? leave : undefined}
    >
      {children}
    </article>
  );
}
