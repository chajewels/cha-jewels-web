"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { tr, type Lang } from "@/lib/i18n";
import { EASE_SHEEN, EASE_SLIDE, GALLERY, PHOTO_DIM, PHOTO_SETTLE, ZOOM } from "@/lib/motion";
import { useFinePointer, useReduced } from "@/components/fx/media";
import { ComponentStyle, mix } from "@/components/fx/component-style";
import { SIZES, cubic, passthrough, whenDecoded, type GalleryImage } from "@/components/catalog/gallery-shared";

export type { GalleryImage };

/**
 * The full-screen viewer is its own chunk, fetched the first time a reader
 * opens it — it is rendered only while open, and next/dynamic loads a module
 * when its component first renders. A visitor who never opens it never
 * downloads it.
 */
const GalleryViewer = dynamic(() => import("@/components/catalog/gallery-viewer").then((m) => m.GalleryViewer), { ssr: false });

/** A drag this far across the photo, or a flick this fast, changes photo. */
const DRAG_COMMIT = 0.2;
const FLICK_PX_PER_MS = 0.5;
const SLIDE = cubic(EASE_SLIDE);
const RELEASE = cubic(GALLERY.easeRelease);
const SHEEN = cubic(EASE_SHEEN);
/** The hover zoom shows the photo at ZOOM.hover× the stage: ask for that many pixels. */
const ZOOM_SIZES = "(min-width:768px) 100vw, 200vw";

type Side = -1 | 1;

/** The gallery's rules, inline (components/fx/component-style.tsx says why). */
const CSS = `
.fx-stage { touch-action: pan-y; user-select: none; -webkit-user-select: none; }
.fx-strip, .fx-slot, .fx-photo, .fx-shade, .fx-zoom { position: absolute; inset: 0; }
.fx-shade { background: #000; opacity: 0; pointer-events: none; }
.fx-sweep {
  position: absolute; top: -10%; bottom: -10%; left: 0; width: 55%; pointer-events: none; opacity: 0; mix-blend-mode: screen;
  background: linear-gradient(100deg, transparent 0%, ${mix("gold", 0)} 18%, ${mix("gold", 50)} 42%, ${mix("gold-pale", 80)} 50%, ${mix("gold", 50)} 58%, ${mix("gold", 0)} 82%, transparent 100%);
}
.fx-open { position: absolute; inset: 0; z-index: 5; background: transparent; border: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
.fx-stage[data-fine] .fx-open { cursor: zoom-in; }
.fx-open:focus-visible { outline: 2px solid var(--c-gold-dark); outline-offset: -4px; }
.fx-zoom {
  z-index: 2; pointer-events: none; opacity: 0; transform: scale(1); transform-origin: var(--zx, 50%) var(--zy, 50%);
  transition: opacity var(--dur-micro) var(--ease-lux), transform var(--dur-micro) var(--ease-lux);
}
.fx-stage[data-zoom] .fx-zoom { opacity: 1; transform: scale(var(--zoom)); }
.fx-zoom-hi { opacity: 0; transition: opacity var(--dur-micro) var(--ease-lux); }
.fx-zoom-hi[data-ready] { opacity: 1; }
.fx-num { position: relative; display: inline-block; min-width: 1ch; overflow: hidden; vertical-align: bottom; text-align: center; font-variant-numeric: tabular-nums; }
.fx-num > span { display: inline-block; }
.fx-num > .fx-num-ghost { position: absolute; inset: 0; }
.fx-thumbs { position: relative; }
.fx-bar {
  position: absolute; left: 0; bottom: 4px; height: 2px; width: var(--w, 0px);
  background: var(--c-gold); box-shadow: 0 0 8px ${mix("gold", 60)};
  transform: translateX(var(--x, 0px));
  transition: transform var(--dur-gallery-slide) var(--ease-slide), width var(--dur-gallery-slide) var(--ease-slide);
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) { .fx-zoom, .fx-zoom-hi, .fx-bar { transition: none; } }`;

/**
 * All of a piece's photos in Hub sort order: one large image plus a thumbnail
 * strip. Arrow keys, Home and End move through the set when the gallery has
 * focus; each thumbnail is a real button; alt text is the Hub's, falling back
 * to the product name.
 *
 * A SLIDE THE EYE CAN FOLLOW. The large image is a strip of three slots — the
 * previous photo, the one on screen, the next. Arrows, keys and thumbnails
 * slide the strip on EASE_SLIDE over GALLERY.slide (850 ms, the same on every
 * device — lib/motion.ts). EASE_LUX, used here before, was 90% done at
 * 200 ms, and between two dark photographs that read as a swap. While it
 * travels the leaving photo darkens under a black veil to PHOTO_DIM; the
 * arriving one comes out of that same darkness, settles from PHOTO_SETTLE to
 * 1 alongside the slide, and one band of gold light crosses it in the
 * direction of travel, landing as it settles (an overlay; the photo is never
 * recoloured). The "Photo 3 of 4" figure rolls to its new number and the
 * gold bar under the thumbnails slides, both over the same 850 ms.
 *
 * THE PHOTO MOVES WITH THE HAND. A finger (or pen) drag moves the strip 1:1,
 * the neighbour sliding in at the edge, darkened and slightly enlarged in
 * proportion to how far it has come. Let go past a fifth of the width, or
 * flick, and it completes from where the finger left it over what is left of
 * GALLERY.slide — never under GALLERY.releaseMin, however fast the flick;
 * otherwise it eases back over GALLERY.springBack. Neither overshoots.
 * Presses during a slide do not pile up: the latest one is remembered and
 * the gallery goes straight to it once the slide lands. A mouse does not drag: on a fine pointer the
 * photo is for zooming (below) and the arrows are there.
 *
 * ZOOM. On a fine pointer, hovering the photo zooms it ZOOM.hover× in place,
 * following the cursor. A photo's full-resolution file is requested the first
 * time the cursor rests on that photo (not on an arrow), never before, and
 * never for a photo that is only passed through; until it has decoded, the
 * photo already on screen is what zooms. Clicking or tapping the photo (it is
 * a button, so Enter works too) opens the full-screen viewer
 * (gallery-viewer.tsx, its own chunk, loaded on that first open).
 *
 * NOTHING GOES BLANK BETWEEN TWO PHOTOS. A slide does not start until the
 * photo it is sliding to has DECODED; until then the counter and the selected
 * thumbnail already answer the tap, and the photo on screen stays. Only a
 * drag can reveal a neighbour that is still loading, because the reader is
 * pulling it into view.
 *
 * WHAT LOADS WHEN. The first photo is the LCP element: it renders on the
 * first frame, untransformed, with priority. The next photo mounts after
 * hydration (offscreen in its slot); the previous one only once the reader
 * first touches the gallery.
 *
 * Reduced motion: no slide, veil, settle, sweep or roll — the photo changes in
 * place once it has decoded, and a swipe is a gesture rather than a drag. The
 * hover zoom and the viewer's zoom still work; they just do not animate.
 */
export function ProductGallery({ images, name, lang }: { images: GalleryImage[]; name: string; lang: Lang }) {
  const t = tr(lang);
  const n = images.length;
  const reduced = useReduced() === true;
  const fine = useFinePointer() === true;
  /** What the reader asked for — the counter and thumbnails follow this at once. */
  const [i, setI] = useState(0);
  /** The photo settled on screen. */
  const [shown, setShown] = useState(0);
  /** A non-adjacent target (a thumbnail jump) placed in a neighbour slot. */
  const [override, setOverride] = useState<{ side: Side; k: number } | null>(null);
  const [armed, setArmed] = useState(false);   // next slot mounted (after hydration)
  const [awake, setAwake] = useState(false);   // prev slot mounted (first interaction)
  /** The photo the hover zoom is for: set when the cursor first rests on it. */
  const [zoomFor, setZoomFor] = useState<number | null>(null);
  const [zoomReady, setZoomReady] = useState<string | null>(null);
  const [viewer, setViewer] = useState<{ k: number; aspect: number } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const busy = useRef(false);
  const queued = useRef<number | null>(null);
  const drag = useRef<{ x: number; y: number; t: number; dx: number; id: number; on: boolean; slop: number } | null>(null);
  /** A drag just ended: the click that follows it is not a request to open the viewer. */
  const dragged = useRef(false);
  const hoverFrame = useRef(0);
  const thumbs = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => { setArmed(true); }, []);
  useEffect(() => () => cancelAnimationFrame(hoverFrame.current), []);

  // Read through refs from callbacks that outlive a render (a queued jump runs
  // right after a slide commits, and must see the photo it committed).
  const shownRef = useRef(shown); shownRef.current = shown;
  const overrideRef = useRef(override); overrideRef.current = override;
  const slotIndex = (side: Side) =>
    overrideRef.current?.side === side ? overrideRef.current.k : (shownRef.current + side + n) % n;

  /** One layer of the slot on `side` (0 = on screen). */
  const part = (side: -1 | 0 | 1, cls: "fx-photo" | "fx-shade" | "fx-sweep") =>
    strip.current?.querySelector<HTMLElement>(`[data-side="${side}"] .${cls}`) ?? null;
  /** Drop the drag's inline styles, so the photos are back to their resting state. */
  const clearDrag = () => {
    strip.current?.querySelectorAll<HTMLElement>(".fx-photo, .fx-shade").forEach((el) => { el.style.transform = ""; el.style.opacity = ""; });
  };

  /**
   * Slide the strip from `fromPx` to the neighbour on `side`, then settle
   * there. `released`: the finger let go mid-drag, so continue at speed.
   */
  const slide = useCallback(async (side: Side, k: number, fromPx = 0, released = false) => {
    const el = strip.current;
    const box = stage.current;
    if (!el || !box) return;
    busy.current = true;
    delete box.dataset.zoom;
    await whenDecoded(part(side, "fx-photo")?.querySelector("img"));
    const w = box.clientWidth;
    if (!reduced && typeof el.animate === "function") {
      const p0 = Math.min(1, Math.abs(fromPx) / w); // how far the finger already took it
      const dur = 1000 * (released ? Math.max(GALLERY.releaseMin, GALLERY.slide * (1 - p0)) : GALLERY.slide);
      const easing = released ? RELEASE : SLIDE;
      const settle = dur + 1000 * (GALLERY.settle - GALLERY.slide);
      const travel = el.animate([{ transform: `translateX(${fromPx}px)` }, { transform: `translateX(${-side * w}px)` }], { duration: dur, easing, fill: "forwards" });
      // The leaving photo darkens as it goes; cancelled at commit, when it is offscreen.
      const leaving = part(0, "fx-shade")?.animate([{ opacity: PHOTO_DIM * p0 }, { opacity: PHOTO_DIM }], { duration: dur, easing, fill: "forwards" });
      // The arriving photo's own layers end at their resting values, so they
      // need no fill and simply run on after the commit, in the same element.
      part(side, "fx-shade")?.animate([{ opacity: PHOTO_DIM * (1 - p0) }, { opacity: 0 }], { duration: dur, easing });
      part(side, "fx-photo")?.animate(
        [{ transform: `scale(${PHOTO_SETTLE - (PHOTO_SETTLE - 1) * p0})` }, { transform: "scale(1)" }],
        { duration: settle, easing },
      );
      // One band of light crosses the arriving photo, travelling the way it does.
      const [a, b] = side === 1 ? ["190%", "-110%"] : ["-110%", "190%"];
      part(side, "fx-sweep")?.animate(
        [{ opacity: 1, transform: `translateX(${a}) skewX(-14deg)` }, { opacity: 1, transform: `translateX(${b}) skewX(-14deg)` }],
        { duration: settle - GALLERY.sweepDelay * 1000, delay: GALLERY.sweepDelay * 1000, easing: SHEEN },
      );
      clearDrag();
      await travel.finished.catch(() => undefined);
      // Commit the new photo and drop the transforms in ONE task, before the
      // next paint — the new centre slot is the same photo, at 0.
      flushSync(() => { setShown(k); setOverride(null); });
      travel.cancel();
      leaving?.cancel();
    } else {
      clearDrag();
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

  /** Show photo k at once, no slide: the viewer closing on a photo the reader moved to there. */
  const jump = useCallback((k: number) => {
    queued.current = null;
    flushSync(() => { setShown(k); setI(k); setOverride(null); setAwake(true); });
  }, []);

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

  /** Paint a drag: the strip under the finger, the veil and settle in proportion. */
  function paintDrag(dx: number) {
    const el = strip.current;
    const w = stage.current?.clientWidth ?? 1;
    if (!el) return;
    el.style.transform = `translateX(${dx}px)`;
    const p = Math.min(1, Math.abs(dx) / w);
    const s: Side = dx < 0 ? 1 : -1;
    const set = (node: HTMLElement | null, k: "opacity" | "transform", v: string) => { if (node) node.style[k] = v; };
    set(part(0, "fx-shade"), "opacity", String(PHOTO_DIM * p));
    set(part(s, "fx-shade"), "opacity", String(PHOTO_DIM * (1 - p)));
    set(part(s, "fx-photo"), "transform", `scale(${PHOTO_SETTLE - (PHOTO_SETTLE - 1) * p})`);
    set(part(-s as Side, "fx-shade"), "opacity", "");
    set(part(-s as Side, "fx-photo"), "transform", "");
  }

  // DRAG. Finger and pen only; touch-action: pan-y leaves vertical scrolling
  // to the browser, so only a sideways drag is ours.
  function down(e: React.PointerEvent<HTMLDivElement>) {
    dragged.current = false;
    if (n < 2 || busy.current || e.pointerType === "mouse") return;
    setAwake(true);
    // A swipe may start on an arrow (on a phone the arrows sit where a thumb
    // starts a swipe), but it needs twice the travel there, so a slightly
    // wobbly tap on the arrow is still a tap.
    const slop = (e.target as HTMLElement).closest("[data-nav]") ? 12 : 6;
    drag.current = { x: e.clientX, y: e.clientY, t: performance.now(), dx: 0, id: e.pointerId, on: false, slop };
  }
  function move(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse") return hover(e);
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.on) {
      if (Math.abs(dx) < d.slop && Math.abs(dy) < d.slop) return;
      if (Math.abs(dy) > Math.abs(dx)) { drag.current = null; return; } // a scroll, not a drag
      d.on = true;
      dragged.current = true;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      e.currentTarget.dataset.dragging = "";
    }
    d.dx = dx;
    if (!reduced) paintDrag(dx);
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
      void slide(side, k, reduced ? 0 : d.dx, true);
    } else if (strip.current && !reduced && typeof strip.current.animate === "function") {
      // Back where it was, on the same glide — no overshoot.
      const el = strip.current;
      const p = Math.min(1, Math.abs(d.dx) / w);
      const dur = GALLERY.springBack * 1000;
      el.animate([{ transform: `translateX(${d.dx}px)` }, { transform: "translateX(0px)" }], { duration: dur, easing: RELEASE });
      part(0, "fx-shade")?.animate([{ opacity: PHOTO_DIM * p }, { opacity: 0 }], { duration: dur, easing: RELEASE });
      // The neighbour that was peeking in goes back into its darkness.
      const s: Side = d.dx < 0 ? 1 : -1;
      part(s, "fx-shade")?.animate([{ opacity: PHOTO_DIM * (1 - p) }, { opacity: PHOTO_DIM }], { duration: dur, easing: RELEASE });
      part(s, "fx-photo")?.animate([{ transform: `scale(${PHOTO_SETTLE - (PHOTO_SETTLE - 1) * p})` }, { transform: `scale(${PHOTO_SETTLE})` }], { duration: dur, easing: RELEASE });
      el.style.transform = "";
      clearDrag();
    } else clearDrag();
  }

  // HOVER ZOOM (fine pointer). The cursor position goes into two custom
  // properties once per frame; nothing re-renders on move.
  function hover(e: React.PointerEvent<HTMLDivElement>) {
    const box = e.currentTarget;
    if (!fine) return;
    const { clientX, clientY } = e;
    const onPhoto = !(e.target as HTMLElement).closest("[data-nav]");
    cancelAnimationFrame(hoverFrame.current);
    hoverFrame.current = requestAnimationFrame(() => {
      if (!onPhoto || busy.current || viewer) { delete box.dataset.zoom; return; }
      // Only now, with the cursor on the photo itself (not an arrow), is its
      // full-resolution file asked for — and only this photo's.
      setZoomFor(shownRef.current);
      const r = box.getBoundingClientRect();
      box.style.setProperty("--zx", `${(((clientX - r.left) / r.width) * 100).toFixed(2)}%`);
      box.style.setProperty("--zy", `${(((clientY - r.top) / r.height) * 100).toFixed(2)}%`);
      box.dataset.zoom = "";
    });
  }
  function leave(e: React.PointerEvent<HTMLDivElement>) {
    cancelAnimationFrame(hoverFrame.current);
    delete e.currentTarget.dataset.zoom;
  }

  function open() {
    if (dragged.current) { dragged.current = false; return; }
    const img = part(0, "fx-photo")?.querySelector("img");
    const aspect = img?.naturalWidth ? img.naturalWidth / img.naturalHeight : 4 / 5;
    if (stage.current) delete stage.current.dataset.zoom;
    setViewer({ k: shownRef.current, aspect });
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
  const zoomUrl = images[shown].url;
  const zoomOn = zoomFor === shown;

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
        className="relative aspect-[4/5] overflow-hidden bg-chalk fx-stage"
        data-fine={fine ? "" : undefined}
        style={{ ["--zoom" as string]: ZOOM.hover }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerLeave={leave}
      >
        <div ref={strip} className="fx-strip">
          {slots.map(({ side, k }) => (
            // Keyed by PHOTO, so when a slide commits, the photo that slid in
            // keeps its <img> and simply becomes the centre slot — no remount,
            // no frame without a picture, and its settle and sweep run on.
            // (With exactly two photos, the neighbour on each side is the same
            // photo, so the side is part of the key there.) Only the centre
            // slot is announced.
            <div
              key={n === 2 ? `${k}:${side}` : String(k)}
              data-side={side}
              aria-hidden={side === 0 ? undefined : "true"}
              className="fx-slot overflow-hidden"
              style={side === 0 ? undefined : { transform: `translateX(${side * 100}%)` }}
            >
              <div className="fx-photo">
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
              <span aria-hidden="true" className="fx-shade" />
              <span aria-hidden="true" className="fx-sweep" />
            </div>
          ))}
        </div>
        {zoomOn && (
          <div aria-hidden="true" className="fx-zoom">
            {/* The photo already on screen (same URL and sizes: a cache hit)
                zooms at once; the full-resolution file fades over it once it
                has decoded. */}
            <Image src={zoomUrl} alt="" fill sizes={SIZES} draggable={false} className="object-cover" unoptimized={passthrough(zoomUrl)} />
            <Image
              key={zoomUrl}
              src={zoomUrl}
              alt=""
              fill
              sizes={ZOOM_SIZES}
              loading="eager"
              draggable={false}
              data-ready={zoomReady === zoomUrl ? "" : undefined}
              onLoad={(e) => { const done = () => setZoomReady(zoomUrl); e.currentTarget.decode().then(done, done); }}
              className="object-cover fx-zoom-hi"
              unoptimized={passthrough(zoomUrl)}
            />
          </div>
        )}
        <button ref={opener} type="button" className="fx-open" onClick={open}
          aria-label={t("product", "openPhoto", { n: String(shown + 1) })} aria-haspopup="dialog" />
        {n > 1 && (
          <>
            <button type="button" data-nav onClick={() => go(i - 1)} aria-label={t("product", "prevPhoto")}
              className="absolute left-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-sm border border-charcoal/60 bg-white/85 text-charcoal-deep backdrop-blur hover:border-gold-dark">
              <span aria-hidden="true">&lsaquo;</span>
            </button>
            <button type="button" data-nav onClick={() => go(i + 1)} aria-label={t("product", "nextPhoto")}
              className="absolute right-2 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-sm border border-charcoal/60 bg-white/85 text-charcoal-deep backdrop-blur hover:border-gold-dark">
              <span aria-hidden="true">&rsaquo;</span>
            </button>
            <Counter i={i} n={n} lang={lang} reduced={reduced} />
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
      {viewer && (
        <GalleryViewer
          images={images}
          name={name}
          lang={lang}
          start={viewer.k}
          aspect={viewer.aspect}
          getRect={() => stage.current?.getBoundingClientRect() ?? null}
          onJump={jump}
          onClosed={() => { setViewer(null); opener.current?.focus({ preventScroll: true }); }}
        />
      )}
    </div>
  );
}

/**
 * "Photo 3 of 4", with the figure ROLLING: the old number leaves upward and
 * the new one rises in (the other way when going back). The words come from
 * the dictionary, split around the number, so Japanese word order is kept.
 * Assistive tech hears the whole sentence once, from an sr-only copy.
 */
function Counter({ i, n, lang, reduced }: { i: number; n: number; lang: Lang; reduced: boolean }) {
  const t = tr(lang);
  const num = useRef<HTMLSpanElement>(null);
  const prev = useRef(i);
  useLayoutEffect(() => {
    const box = num.current; const from = prev.current; prev.current = i;
    const cur = box?.firstElementChild as HTMLElement | null;
    if (!box || !cur || from === i || reduced || typeof cur.animate !== "function") return;
    const d = (from === n - 1 && i === 0) || (i > from && !(from === 0 && i === n - 1)) ? 1 : -1;
    const ghost = document.createElement("span");
    ghost.className = "fx-num-ghost";
    ghost.textContent = String(from + 1);
    box.appendChild(ghost);
    const opts = { duration: GALLERY.slide * 1000, easing: SLIDE };
    ghost.animate([{ transform: "translateY(0)", opacity: 1 }, { transform: `translateY(${-d * 100}%)`, opacity: 0 }], { ...opts, fill: "forwards" })
      .finished.then(() => ghost.remove(), () => ghost.remove());
    cur.animate([{ transform: `translateY(${d * 100}%)`, opacity: 0 }, { transform: "translateY(0)", opacity: 1 }], opts);
  }, [i, n, reduced]);
  const [pre, post] = t("product", "photoOf", { n: "\u0001", total: String(n) }).split("\u0001");
  return (
    <p aria-live="polite" className="absolute bottom-2 right-2 z-10 rounded-sm border border-hairline bg-white/85 px-2 py-0.5 text-xs text-charcoal backdrop-blur">
      <span className="sr-only">{t("product", "photoOf", { n: String(i + 1), total: String(n) })}</span>
      <span aria-hidden="true">{pre}<span ref={num} className="fx-num"><span>{i + 1}</span></span>{post}</span>
    </p>
  );
}
