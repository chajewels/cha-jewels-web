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
import type { GalleryItem } from "@/lib/product-media";

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
.fx-well { background: #F5F5F2; }
.fx-cut { position: absolute; inset: 11%; filter: drop-shadow(0 26px 24px rgb(35 29 18 / .20)); }
.fx-round {
  display: grid; place-items: center; width: 44px; height: 44px; border-radius: 9999px;
  border: 1px solid rgb(34 34 34 / .45); background: rgb(245 245 242 / .85); color: var(--c-charcoal-deep);
  transition: border-color var(--dur-micro) var(--ease-lux);
}
.fx-round:hover { border-color: var(--c-gold-dark); }
.fx-ctr { font-family: var(--font-display), Georgia, serif; font-size: 15px; line-height: 1; padding: 6px 10px; background: rgb(245 245 242 / .85); color: var(--c-charcoal-deep); font-variant-numeric: lining-nums tabular-nums; font-feature-settings: "lnum" 1, "tnum" 1; }
.fx-rail > button[aria-selected="true"] { border-color: var(--c-gold-dark); box-shadow: inset 0 0 0 1px var(--c-gold-dark); }
.fx-vid { position: absolute; inset: 0; background: #15120f; }
.fx-vid video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; }
@media (prefers-reduced-motion: reduce) { .fx-zoom, .fx-zoom-hi, .fx-bar, .fx-round { transition: none; } }`;

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
export function ProductGallery({ items, name, lang, badge }: { items: GalleryItem[]; name: string; lang: Lang; badge?: React.ReactNode }) {
  const t = tr(lang);
  const images = items;
  const n = images.length;
  // The viewer shows the Hub's own photos (never a cut-out, never the video),
  // so a reader zooming in sees the real picture. Gallery index <-> viewer index.
  const photos: GalleryImage[] = [];
  const toViewer: number[] = [];
  const toGallery: number[] = [];
  items.forEach((m, k) => {
    if (m.kind === "video") { toViewer.push(-1); return; }
    toViewer.push(photos.length); toGallery.push(k);
    photos.push({ url: m.original, alt: m.alt });
  });
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
      if (!onPhoto || busy.current || viewer || images[shownRef.current]?.kind === "video") { delete box.dataset.zoom; return; }
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
    const k = toViewer[shownRef.current];
    if (k == null || k < 0) return;
    const img = part(0, "fx-photo")?.querySelector("img");
    const aspect = img?.naturalWidth ? img.naturalWidth / img.naturalHeight : 1;
    if (stage.current) delete stage.current.dataset.zoom;
    setViewer({ k, aspect });
  }

  if (n === 0) return <div className="relative aspect-square fx-well" aria-hidden="true" />;
  const alt = (m: GalleryItem) => (m.kind === "video" ? "" : m.alt?.trim() || name);
  const onVideo = images[shown]?.kind === "video";

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); }
    else if (e.key === "Home") { e.preventDefault(); go(0); }
    else if (e.key === "End") { e.preventDefault(); go(n - 1); }
  }

  const slots: { side: -1 | 0 | 1; k: number }[] = [{ side: 0, k: shown }];
  if (n > 1 && armed) slots.push({ side: 1, k: slotIndex(1) });
  if (n > 1 && (awake || override?.side === -1)) slots.push({ side: -1, k: slotIndex(-1) });
  const cur = images[shown];
  const zoomUrl = cur.src;
  const zoomOn = zoomFor === shown && cur.kind !== "video";
  /** One slot's picture: the cut-out standing in the well, the whole photo contained, or the video. */
  const picture = (m: GalleryItem, k: number, side: -1 | 0 | 1) =>
    m.kind === "video" ? (
      <GalleryVideo src={m.src} poster={m.poster} active={side === 0 && k === shown} reduced={reduced} lang={lang} />
    ) : m.kind === "cut" ? (
      <span className="fx-cut">
        <Image src={m.src} alt={side === 0 ? alt(m) : ""} fill sizes={SIZES} draggable={false} className="object-contain" priority={side === 0 && k === 0} unoptimized={passthrough(m.src)} />
      </span>
    ) : (
      <Image src={m.src} alt={side === 0 ? alt(m) : ""} fill sizes={SIZES} draggable={false} className="object-contain" priority={side === 0 && k === 0} unoptimized={passthrough(m.src)} />
    );

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={t("product", "gallery")}
      tabIndex={0}
      onKeyDown={onKeyDown}
      // Desktop: the thumbnail rail on the left of the square well. Phone and
      // tablet: the strip under it (comp page-comps/product-collection).
      className={`outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-dark ${n > 1 ? "lg:grid lg:grid-cols-[76px_minmax(0,1fr)] lg:gap-3.5" : ""}`}
    >
      <ComponentStyle id="fx-gallery" css={CSS} />
      <div
        ref={stage}
        className="relative aspect-square overflow-hidden fx-well fx-stage outline outline-1 -outline-offset-1 outline-hairline lg:order-2"
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
              <div className="fx-photo">{picture(images[k], k, side)}</div>
              <span aria-hidden="true" className="fx-shade" />
              <span aria-hidden="true" className="fx-sweep" />
            </div>
          ))}
        </div>
        {zoomOn && (
          <div aria-hidden="true" className="fx-zoom fx-well">
            {/* The picture already on screen (same URL and sizes: a cache hit)
                zooms at once; the full-resolution file fades over it once it
                has decoded. A cut-out zooms as a cut-out, in its well. */}
            <span className={cur.kind === "cut" ? "fx-cut" : "absolute inset-0"}>
              <Image src={zoomUrl} alt="" fill sizes={SIZES} draggable={false} className="object-contain" unoptimized={passthrough(zoomUrl)} />
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
                className="object-contain fx-zoom-hi"
                unoptimized={passthrough(zoomUrl)}
              />
            </span>
          </div>
        )}
        {!onVideo && (
          // A click or tap anywhere on the photo opens the viewer; for the
          // keyboard and assistive tech that is the round Full screen button,
          // so this layer stays out of the tab order and the tree.
          <button type="button" className="fx-open" onClick={open} tabIndex={-1} aria-hidden="true" />
        )}
        {badge && <div className="pointer-events-none absolute left-4 top-4 z-10 flex gap-1.5">{badge}</div>}
        {!onVideo && (
          <button ref={opener} type="button" data-nav onClick={open} aria-label={t("pdp", "fullScreen")} aria-haspopup="dialog"
            className="fx-round absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
          </button>
        )}
        {n > 1 && (
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex items-center justify-between sm:inset-x-4 sm:bottom-4">
            <Counter i={i} n={n} lang={lang} reduced={reduced} />
            <span className="pointer-events-auto hidden gap-2 sm:flex">
              <button type="button" data-nav onClick={() => go(i - 1)} aria-label={t("product", "prevPhoto")} className="fx-round">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg>
              </button>
              <button type="button" data-nav onClick={() => go(i + 1)} aria-label={t("product", "nextPhoto")} className="fx-round">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
              </button>
            </span>
          </div>
        )}
      </div>
      {n > 1 && (
        <div ref={thumbs} role="tablist" aria-label={t("product", "gallery")}
          className="fx-rail mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:order-1 lg:mt-0 lg:flex-col lg:overflow-visible lg:pb-0">
          {images.map((m, k) => (
            <button
              key={m.src + k}
              type="button"
              role="tab"
              data-i={k}
              aria-selected={k === i}
              aria-label={m.kind === "video" ? t("pdp", "video") : t("product", "photoOf", { n: String(k + 1), total: String(n) })}
              onClick={() => go(k)}
              className={`relative grid h-[58px] w-[58px] shrink-0 place-items-center overflow-hidden border border-hairline lg:h-[76px] lg:w-[76px] ${m.kind === "video" ? "bg-charcoal-deep text-gold-pale" : "fx-well"}`}
            >
              {m.kind === "video" ? (
                <span className="flex flex-col items-center gap-1 text-[10px] font-semibold uppercase leading-none tracking-[0.08em]">
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z" /></svg>
                  {t("pdp", "video")}
                </span>
              ) : (
                <span className={m.kind === "cut" ? "absolute inset-[7%]" : "absolute inset-0"}>
                  <Image src={m.src} alt="" fill sizes="80px" className="object-contain" loading="lazy" unoptimized={passthrough(m.src)} />
                </span>
              )}
            </button>
          ))}
          <span ref={bar} aria-hidden="true" className="hidden" />
        </div>
      )}
      {viewer && (
        <GalleryViewer
          images={photos}
          name={name}
          lang={lang}
          start={viewer.k}
          aspect={viewer.aspect}
          getRect={() => stage.current?.getBoundingClientRect() ?? null}
          onJump={(k) => jump(toGallery[k] ?? 0)}
          onClosed={() => { setViewer(null); (opener.current ?? stage.current)?.focus({ preventScroll: true }); }}
        />
      )}
    </div>
  );
}

/**
 * THE VIDEO SLOT (D2-1: the Hub has no video field yet; with one, the slot
 * appears third among the photos). Muted, looping, inline, in the same square
 * frame. It plays only while it is the slide on screen, and never on its own
 * for a reader who asked for reduced motion: they see the poster, and the
 * round button plays it. Anyone can pause it (WCAG 2.2.2).
 */
function GalleryVideo({ src, poster, active, reduced, lang }: { src: string; poster: string | null; active: boolean; reduced: boolean; lang: Lang }) {
  const t = tr(lang);
  const ref = useRef<HTMLVideoElement>(null);
  const [want, setWant] = useState<boolean | null>(null); // the reader's own choice, once made
  const [playing, setPlaying] = useState(false);
  const play = active && (want ?? !reduced);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (play) v.play().catch(() => setPlaying(false)); else v.pause();
  }, [play]);
  return (
    <span className="fx-vid">
      <video ref={ref} src={src} poster={poster ?? undefined} muted loop playsInline preload={active ? "metadata" : "none"}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      {active && (
        <button type="button" data-nav onClick={() => setWant(!playing)} aria-label={t("pdp", playing ? "videoPause" : "videoPlay")}
          className="fx-round absolute right-3 top-3 z-10 sm:right-4 sm:top-4">
          {playing
            ? <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
            : <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z" /></svg>}
        </button>
      )}
    </span>
  );
}

const pad = (k: number) => String(k).padStart(2, "0");

/**
 * "03 / 07", with the figure ROLLING: the old number leaves upward and the
 * new one rises in (the other way when going back). Assistive tech hears the
 * dictionary sentence ("Photo 3 of 7") once, from an sr-only copy.
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
    ghost.textContent = pad(from + 1);
    box.appendChild(ghost);
    const opts = { duration: GALLERY.slide * 1000, easing: SLIDE };
    ghost.animate([{ transform: "translateY(0)", opacity: 1 }, { transform: `translateY(${-d * 100}%)`, opacity: 0 }], { ...opts, fill: "forwards" })
      .finished.then(() => ghost.remove(), () => ghost.remove());
    cur.animate([{ transform: `translateY(${d * 100}%)`, opacity: 0 }, { transform: "translateY(0)", opacity: 1 }], opts);
  }, [i, n, reduced]);
  // "01 / 07" in lining figures (comp); the sentence is for assistive tech.
  return (
    <p aria-live="polite" className="fx-ctr">
      <span className="sr-only">{t("product", "photoOf", { n: String(i + 1), total: String(n) })}</span>
      <span aria-hidden="true"><span ref={num} className="fx-num"><span>{pad(i + 1)}</span></span> / {pad(n)}</span>
    </p>
  );
}
