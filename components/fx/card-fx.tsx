"use client";
// Pattern: the "3D tilt card" / "specular card" components on 21st.dev (MIT).
// Rewritten onto our tokens with CSS custom properties and a scoped CSS
// module; fine-pointer, touch and reduced-motion paths added. No code copied
// verbatim; no dependency added.
import { createContext, useContext, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { STAGGER, TILT_MAX, TILT_PERSPECTIVE } from "@/lib/motion";
import { useFinePointer, useReduced } from "@/components/fx/media";
import { useReveal } from "@/components/fx/reveal";
import { ComponentStyle, mix } from "@/components/fx/component-style";

/**
 * A PRODUCT CARD, MOVING. Wraps a card (the <Link> stays the interactive
 * element and the grid cell never changes size):
 *
 *   entrance   every card rises in as it scrolls into view, row by row left
 *              to right (index % 4 × STAGGER.card). Same visibility rule as
 *              every reveal: rendered finished from the server, hidden only
 *              if measured below the fold after hydration (components/fx/
 *              reveal.tsx) — so a card on screen at first paint never hides.
 *   mouse      tilts up to TILT_MAX° toward the pointer on an inner wrapper;
 *              a gold specular glint follows the pointer over the photo; the
 *              photo leans in to 1.04; a second photo, if the piece has one,
 *              crossfades in. A sold card (`quiet`) does none of this and
 *              does not press in under a finger: it still opens the piece,
 *              but nothing about it invites a purchase.
 *   touch      one band of gold light crosses the photo as the card comes
 *              into view; the card presses in under a finger.
 *   reduced    none of it — the card is exactly what it was.
 *
 * Pointer position goes into CSS custom properties once per frame; nothing
 * re-renders on move. The second photo is not fetched until the pointer
 * first rests on the card, so a page of cards does not download every
 * card's second photo up front, and a phone never does.
 */
const Hovered = createContext(false);

/** The cards' rules (components/fx/component-style.tsx says why inline). */
const CSS = `
.fx-card {
  position: relative; height: 100%;
  transform: perspective(var(--tilt-perspective)) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transition: transform var(--dur-reveal) var(--ease-lux);
}
.fx-card:not([data-tilt]) { transform: none; }
.fx-card[data-hover] { transition-duration: 120ms; }
.fx-img { transition: transform var(--dur-image) var(--ease-lux), opacity var(--dur-reveal) var(--ease-lux); }
.fx-card[data-hover] .fx-img { transform: scale(1.04); }
.fx-second { opacity: 0; }
.fx-card[data-hover] .fx-second[data-ready] { opacity: 1; }
.fx-glint {
  position: absolute; inset: 0; pointer-events: none; opacity: 0; mix-blend-mode: screen;
  background: radial-gradient(240px circle at var(--gx, 50%) var(--gy, 30%), ${mix("gold-pale", 55)}, ${mix("gold", 12)} 45%, transparent 70%);
  transition: opacity var(--dur-micro) var(--ease-lux);
}
.fx-card[data-hover] .fx-glint { opacity: 1; }
.fx-sweep {
  position: absolute; inset: -10% auto -10% 0; width: 60%; pointer-events: none; mix-blend-mode: screen;
  background: linear-gradient(100deg, transparent 0%, ${mix("gold-dark", 0)} 15%, ${mix("gold", 42)} 42%, ${mix("gold-pale", 66)} 50%, ${mix("gold", 42)} 58%, ${mix("gold-dark", 0)} 85%, transparent 100%);
  transform: translateX(-120%) skewX(-16deg);
}
.fx-card[data-glint] .fx-sweep { animation: fx-card-sweep var(--dur-sheen) var(--ease-sheen) 1 both; }
@keyframes fx-card-sweep { from { transform: translateX(-120%) skewX(-16deg); } to { transform: translateX(260%) skewX(-16deg); } }
.fx-card[data-quiet], .fx-card[data-quiet]:active, .fx-card[data-quiet] .fx-img { transform: none; }
.fx-card[data-quiet] .fx-glint, .fx-card[data-quiet] .fx-sweep, .fx-card[data-quiet] .fx-second { display: none; }
@media (hover: none) { .fx-card:not([data-quiet]):active { transform: scale(0.975); transition-duration: 120ms; } }
@media (prefers-reduced-motion: reduce) {
  .fx-card, .fx-card:active, .fx-card[data-hover] .fx-img { transform: none; }
  .fx-glint, .fx-sweep { display: none; }
}`;


export function CardFx({ index = 0, tilt = true, quiet = false, className = "", children }: {
  index?: number; tilt?: boolean; quiet?: boolean; className?: string; children: React.ReactNode;
}) {
  const { ref, state } = useReveal<HTMLDivElement>(0.2);
  const inner = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const fine = useFinePointer();
  const reduced = useReduced();
  const [hovered, setHovered] = useState(false);
  const live = fine === true && reduced === false;

  // Touch: the gold glint, once, when the card is well into view.
  useEffect(() => {
    const el = inner.current;
    if (!el || fine !== false || reduced !== false) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.dataset.glint = ""; io.disconnect(); }
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [fine, reduced]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function move(e: React.PointerEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const { clientX, clientY } = e;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      const px = (clientX - r.left) / r.width;
      const py = (clientY - r.top) / r.height;
      if (tilt) {
        el.style.setProperty("--rx", `${((0.5 - py) * 2 * TILT_MAX).toFixed(2)}deg`);
        el.style.setProperty("--ry", `${((px - 0.5) * 2 * TILT_MAX).toFixed(2)}deg`);
      }
      el.style.setProperty("--gx", `${Math.round(clientX - r.left)}px`);
      el.style.setProperty("--gy", `${Math.round(clientY - r.top)}px`);
    });
  }
  function enter(e: React.PointerEvent<HTMLDivElement>) { e.currentTarget.dataset.hover = ""; setHovered(true); }
  function leave(e: React.PointerEvent<HTMLDivElement>) {
    cancelAnimationFrame(frame.current);
    const el = e.currentTarget;
    delete el.dataset.hover;
    el.style.removeProperty("--rx"); el.style.removeProperty("--ry");
    setHovered(false);
  }

  return (
    <div ref={ref} data-reveal={state} className={className}>
      <ComponentStyle id="fx-card" css={CSS} />
      <div className="reveal-item h-full" style={{ ["--i" as string]: index % 4, ["--stagger" as string]: `${STAGGER.card}s` }}>
        <div
          ref={inner}
          className="fx-card"
          style={{ ["--tilt-perspective" as string]: `${TILT_PERSPECTIVE}px` }}
          data-tilt={tilt && live ? "" : undefined}
          data-quiet={quiet ? "" : undefined}
          onPointerEnter={live ? enter : undefined}
          onPointerMove={live ? move : undefined}
          onPointerLeave={live ? leave : undefined}
        >
          <Hovered.Provider value={hovered}>{children}</Hovered.Provider>
        </div>
      </div>
    </div>
  );
}

/**
 * The card's photo, with its glint layers and the hover-only second photo.
 * Goes inside the card's own `relative overflow-hidden` image box.
 */
export function CardMedia({ src, second, alt, sizes, dim = false, unoptimized = false }: {
  src: string; second?: string | null; alt: string; sizes: string; dim?: boolean; unoptimized?: boolean;
}) {
  const hovered = useContext(Hovered);
  const [armed, setArmed] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => { if (hovered && second) setArmed(true); }, [hovered, second]);
  return (
    <>
      <Image src={src} alt={alt} fill sizes={sizes} unoptimized={unoptimized} className={`object-cover fx-img ${dim ? "opacity-50" : ""}`} />
      {armed && second && (
        <Image
          src={second}
          alt=""
          aria-hidden="true"
          fill
          sizes={sizes}
          unoptimized={unoptimized}
          data-ready={ready ? "" : undefined}
          // Shown only once decoded: a half-loaded photo never fades in.
          onLoad={(e) => { const done = () => setReady(true); e.currentTarget.decode().then(done, done); }}
          className={`object-cover fx-img fx-second`}
        />
      )}
      <span aria-hidden="true" className="fx-glint" />
      <span aria-hidden="true" className="fx-sweep" />
    </>
  );
}
