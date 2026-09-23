"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { tr, type Lang } from "@/lib/i18n";
import { DUR, EASE_LUX } from "@/lib/motion";
import { useReduced } from "@/components/fx/media";
import { ComponentStyle, mix } from "@/components/fx/component-style";

export type GalleryImage = { url: string; alt: string | null };

/** next/image cannot optimise SVG or data URLs (fixtures use both); real Hub photos are optimised. */
const passthrough = (url: string) => url.startsWith("data:") || /\.svg(\?|$)/i.test(url);

const SIZES = "(min-width:768px) 50vw, 100vw";
/** A drag this far across the photo, or a flick this fast, changes photo. */
const DRAG_COMMIT = 0.2;
const FLICK_PX_PER_MS = 0.5;
const EASE = `cubic-bezier(${EASE_LUX.join(",")})`;

type Side = -1 | 1;

/** The gallery's rules, inline (components/fx/component-style.tsx says why). */
const CSS = `
.fx-stage { touch-action: pan-y; user-select: none; -webkit-user-select: none; }
.fx-stage[data-draggable] { cursor: grab; }
.fx-stage[data-dragging] { cursor: grabbing; }
.fx-strip, .fx-slot { position: absolute; inset: 0; }
.fx-thumbs { position: relative; }
.fx-bar {
  position: absolute; left: 0; bottom: 4px; height: 2px; width: var(--w, 0px);
  background: var(--c-gold); box-shadow: 0 0 8px ${mix("gold", 60)};
  transform: translateX(var(--x, 0px));
  transition: transform var(--dur-reveal) var(--ease-lux), width var(--dur-reveal) var(--ease-lux);
  pointer-events: none;
}`;

/**
 * All of a piece's photos in Hub sort order: one large image plus a thumbnail
 * strip. Arrow keys, Home and End move through the set when the gallery has
 * focus; each thumbnail is a real button; alt text is the Hub's, falling back
 * to the product name.
 *
 * THE PHOTO MOVES WITH THE HAND. The large image is a strip of three slots —
 * the previous photo, the one on screen, the next — side by side. Dragging
 * (finger or mouse) moves the strip with the pointer, the neighbour sliding
 * in beside it. Let go past a fifth of the width, or flick, and the strip
 * carries on to the neighbour on EASE_LUX: fast off the mark, long settle,
 * no overshoot. Otherwise it eases back. Arrows, keys and thumbnails play the
 * same slide. The arriving photo settles from 1.04 to 1 and crossfades up
 * from 0.75 while the leaving one dims — the slide reads as a change of
 * photograph, not a sheet of paper moving. A gold bar slides under the active
 * thumbnail. Transforms and opacity only, on the Web Animations API; nothing
 * re-renders during a drag.
 *
 * NOTHING GOES BLANK BETWEEN TWO PHOTOS (the rule of the gallery this
 * replaces). A slide does not start until the photo it is sliding to has
 * DECODED; until then the counter and the selected thumbnail already answer
 * the tap, and the photo on screen stays. Only a drag can reveal a neighbour
 * that is still loading, because the reader is pulling it into view.
 *
 * WHAT LOADS WHEN. The first photo is the LCP element: it renders on the
 * first frame, untransformed, with priority. The next photo mounts after
 * hydration (offscreen in its slot — the preload the old gallery did too);
 * the previous one only once the reader first touches the gallery, so a
 * visitor who never browses pays for one neighbour, as before.
 *
 * Reduced motion: no slide, no settle — the photo changes in place once it
 * has decoded, and a swipe is a gesture rather than a drag.
 */
export function ProductGallery({ images, name, lang }: { images: GalleryImage[]; name: string; lang: Lang }) {
  const t = tr(lang);
  const n = images.length;
  const reduced = useReduced() === true;
  /** What the reader asked for — the counter and thumbnails follow this at once. */
  const [i, setI] = useState(0);
  /** The photo settled on screen. */
  const [shown, setShown] = useState(0);
  /** A non-adjacent target (a thumbnail jump) placed in a neighbour slot. */
  const [override, setOverride] = useState<{ side: Side; k: number } | null>(null);
  const [armed, setArmed] = useState(false);   // next slot mounted (after hydration)
  const [awake, setAwake] = useState(false);   // prev slot mounted (first interaction)
  const stage = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const queued = useRef<number | null>(null);
  const drag = useRef<{ x: number; y: number; t: number; dx: number; id: number; on: boolean } | null>(null);
  const thumbs = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => { setArmed(true); }, []);

  // Read through refs from callbacks that outlive a render (a queued jump runs
  // right after a slide commits, and must see the photo it committed).
  const shownRef = useRef(shown); shownRef.current = shown;
  const overrideRef = useRef(override); overrideRef.current = override;
  const slotIndex = (side: Side) =>
    overrideRef.current?.side === side ? overrideRef.current.k : (shownRef.current + side + n) % n;

  /** Resolve when the photo in a slot has decoded (or cannot). */
  const decoded = (side: Side) => new Promise<void>((resolve) => {
    const img = strip.current?.querySelector<HTMLImageElement>(`[data-side="${side}"] img`);
    if (!img) return resolve();
    const go = () => img.decode().then(resolve, resolve);
    if (img.complete) go(); else img.addEventListener("load", go, { once: true });
    img.addEventListener("error", () => resolve(), { once: true });
  });

  /** Slide the strip from `fromPx` to the neighbour on `side`, then settle there. */
  const slide = useCallback(async (side: Side, k: number, fromPx = 0) => {
    const el = strip.current;
    const box = stage.current;
    if (!el || !box) return;
    busy.current = true;
    await decoded(side);
    const w = box.clientWidth;
    const dur = DUR.photo * 1000;
    if (!reduced && typeof el.animate === "function") {
      const incoming = el.querySelector<HTMLElement>(`[data-side="${side}"]`);
      const outgoing = el.querySelector<HTMLElement>(`[data-side="0"]`);
      const run = [
        el.animate([{ transform: `translateX(${fromPx}px)` }, { transform: `translateX(${-side * w}px)` }], { duration: dur, easing: EASE, fill: "forwards" }),
        incoming?.animate([{ transform: `translateX(${side * 100}%) scale(1.04)`, opacity: 0.75 }, { transform: `translateX(${side * 100}%) scale(1)`, opacity: 1 }], { duration: dur * 1.2, easing: EASE, fill: "forwards" }),
        outgoing?.animate([{ opacity: 1 }, { opacity: 0.5 }], { duration: dur, easing: EASE, fill: "forwards" }),
      ].filter(Boolean) as Animation[];
      await Promise.all(run.map((a) => a.finished.catch(() => undefined)));
      // Commit the new photo and drop the transforms in ONE task, before the
      // next paint — the new centre slot is the same photo, at 0.
      flushSync(() => { setShown(k); setOverride(null); });
      run.forEach((a) => a.cancel());
    } else {
      flushSync(() => { setShown(k); setOverride(null); });
    }
    el.style.transform = "";
    busy.current = false;
    const q = queued.current; queued.current = null;
    if (q !== null && q !== k) go(q);
  }, [reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Go to photo k: adjacent photos slide from their own side; a jump uses the side it lies on. */
  const go = useCallback((k: number) => {
    if (n < 2) return;
    k = ((k % n) + n) % n;
    setI(k);
    setAwake(true);
    if (busy.current) { queued.current = k; return; }
    const at = shownRef.current;
    if (k === at) return;
    const side: Side = k === (at + 1) % n ? 1 : k === (at - 1 + n) % n ? -1 : k > at ? 1 : -1;
    if (slotIndex(side) !== k) {
      // Put the target in the slot first; slide once it has rendered.
      setOverride({ side, k });
      requestAnimationFrame(() => requestAnimationFrame(() => void slide(side, k)));
    } else void slide(side, k);
  }, [n, slide]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep `i` honest if a slide settled somewhere else (a queued jump).
  useEffect(() => { if (!busy.current) setI((c) => (queued.current === null ? shown : c)); }, [shown]);

  // The gold bar under the active thumbnail, and the strip scrolled to it.
  useLayoutEffect(() => {
    const strip = thumbs.current; const b = bar.current;
    if (!strip || !b) return;
    const place = () => {
      const tab = strip.querySelector<HTMLElement>(`[data-i="${i}"]`);
      if (!tab) return;
      b.style.setProperty("--x", `${tab.offsetLeft}px`);
      b.style.setProperty("--w", `${tab.offsetWidth}px`);
    };
    place();
    strip.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [i]);

  // DRAG. Pointer events cover finger and mouse; touch-action: pan-y leaves
  // vertical scrolling to the browser, so only a sideways drag is ours.
  function down(e: React.PointerEvent<HTMLDivElement>) {
    if (n < 2 || busy.current || (e.pointerType === "mouse" && e.button !== 0)) return;
    if ((e.target as HTMLElement).closest("button")) return;
    setAwake(true);
    drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), dx: 0, id: e.pointerId, on: false };
  }
  function move(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.on) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      if (Math.abs(dy) > Math.abs(dx)) { drag.current = null; return; } // a scroll, not a drag
      d.on = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      e.currentTarget.dataset.dragging = "";
    }
    d.dx = dx;
    if (!reduced && strip.current) strip.current.style.transform = `translateX(${dx}px)`;
  }
  function up(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current; drag.current = null;
    delete e.currentTarget.dataset.dragging;
    if (!d || !d.on) return;
    const w = stage.current?.clientWidth ?? 1;
    const v = d.dx / Math.max(1, performance.now() - d.t);
    const commit = Math.abs(d.dx) > w * DRAG_COMMIT || Math.abs(v) > FLICK_PX_PER_MS;
    if (commit) {
      const side: Side = d.dx < 0 ? 1 : -1;
      const k = (shownRef.current + side + n) % n;
      setI(k);
      void slide(side, k, reduced ? 0 : d.dx);
    } else if (strip.current && !reduced && typeof strip.current.animate === "function") {
      const el = strip.current;
      el.animate([{ transform: `translateX(${d.dx}px)` }, { transform: "translateX(0px)" }], { duration: DUR.photo * 1000, easing: EASE })
        .finished.then(() => { el.style.transform = ""; }, () => undefined);
      el.style.transform = "";
    }
  }

  if (n === 0) return <div className="relative aspect-[4/5] bg-chalk" aria-hidden="true" />;
  const alt = (img: GalleryImage) => img.alt?.trim() || name;

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); }
    else if (e.key === "Home") { e.preventDefault(); go(0); }
    else if (e.key === "End") { e.preventDefault(); go(n - 1); }
  }

  const slots: { side: -1 | 0 | 1; k: number }[] = [{ side: 0, k: shown }];
  if (n > 1 && armed) slots.push({ side: 1, k: slotIndex(1) });
  if (n > 1 && (awake || override?.side === -1)) slots.push({ side: -1, k: slotIndex(-1) });

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={t("product", "gallery")}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-dark"
    >
      <ComponentStyle id="fx-gallery" css={CSS} />
      <div
        ref={stage}
        className={`relative aspect-[4/5] overflow-hidden bg-chalk fx-stage`}
        data-draggable={n > 1 ? "" : undefined}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        <div ref={strip} className="fx-strip">
          {slots.map(({ side, k }) => (
            // Keyed by PHOTO, so when a slide commits, the photo that slid in
            // keeps its <img> and simply becomes the centre slot — no remount,
            // no frame without a picture. (With exactly two photos, the
            // neighbour on each side is the same photo, so the side is part of
            // the key there.) Only the centre slot is announced.
            <div
              key={n === 2 ? `${k}:${side}` : String(k)}
              data-side={side}
              aria-hidden={side === 0 ? undefined : "true"}
              className="fx-slot"
              style={side === 0 ? undefined : { transform: `translateX(${side * 100}%)` }}
            >
              <Image
                src={images[k].url}
                alt={side === 0 ? alt(images[k]) : ""}
                fill
                sizes={SIZES}
                draggable={false}
                className="object-cover"
                priority={side === 0 && k === 0}
                unoptimized={passthrough(images[k].url)}
              />
            </div>
          ))}
        </div>
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(i - 1)} aria-label={t("product", "prevPhoto")}
              className="absolute left-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-sm border border-charcoal/60 bg-white/85 text-charcoal-deep backdrop-blur hover:border-gold-dark">
              <span aria-hidden="true">&lsaquo;</span>
            </button>
            <button type="button" onClick={() => go(i + 1)} aria-label={t("product", "nextPhoto")}
              className="absolute right-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-sm border border-charcoal/60 bg-white/85 text-charcoal-deep backdrop-blur hover:border-gold-dark">
              <span aria-hidden="true">&rsaquo;</span>
            </button>
            <p aria-live="polite" className="absolute bottom-2 right-2 z-10 rounded-sm border border-hairline bg-white/85 px-2 py-0.5 text-xs text-charcoal backdrop-blur">
              {t("product", "photoOf", { n: String(i + 1), total: String(n) })}
            </p>
          </>
        )}
      </div>
      {n > 1 && (
        <div ref={thumbs} role="tablist" aria-label={t("product", "gallery")}
          className={`mt-1.5 flex snap-x snap-mandatory gap-1.5 overflow-x-auto pb-2.5 [scrollbar-width:thin] fx-thumbs`}>
          {images.map((img, k) => (
            <button
              key={img.url + k}
              type="button"
              role="tab"
              data-i={k}
              aria-selected={k === i}
              aria-label={t("product", "photoOf", { n: String(k + 1), total: String(n) })}
              onClick={() => go(k)}
              className={`relative h-16 w-16 shrink-0 snap-start overflow-hidden border bg-chalk sm:h-20 sm:w-20 ${k === i ? "border-gold-dark" : "border-hairline opacity-70 hover:opacity-100"}`}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" loading="lazy" unoptimized={passthrough(img.url)} />
            </button>
          ))}
          <span ref={bar} aria-hidden="true" className="fx-bar" />
        </div>
      )}
    </div>
  );
}
