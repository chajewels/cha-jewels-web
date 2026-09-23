"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { tr, type Lang } from "@/lib/i18n";
import { DUR, EASE_GLIDE, EASE_SLIDE, ZOOM } from "@/lib/motion";
import { useReduced } from "@/components/fx/media";
import { ComponentStyle } from "@/components/fx/component-style";
import { SIZES, cubic, passthrough, whenDecoded, type GalleryImage } from "@/components/catalog/gallery-shared";

const SLIDE = cubic(EASE_SLIDE);
const GLIDE = cubic(EASE_GLIDE);
/** A sideways drag this far, or a flick, changes photo; a downward drag this far closes. */
const SWIPE_COMMIT = 0.2;
const DISMISS_PX = 110;
const FLICK_PX_PER_MS = 0.5;
/** Two taps this close in time and space are a double tap. */
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_PX = 30;

type Side = -1 | 1;
type Pt = { x: number; y: number };
type Gesture =
  | { kind: "pending" | "swipe" | "dismiss"; x0: number; y0: number; t0: number; id: number; dx: number; dy: number; mouse: boolean }
  | { kind: "pan"; x0: number; y0: number; tx0: number; ty0: number; id: number; moved: boolean; mouse: boolean }
  | { kind: "pinch"; d0: number; m0: Pt; z0: number; tx0: number; ty0: number };

/** The viewer's rules, inline (components/fx/component-style.tsx says why). */
const CSS = `
.vf-root { position: fixed; inset: 0; z-index: 100; touch-action: none; overscroll-behavior: contain; }
.vf-backdrop { position: absolute; inset: 0; background: var(--c-charcoal-deep); }
.vf-stage { position: absolute; inset: 0; overflow: hidden; user-select: none; -webkit-user-select: none; }
.vf-strip, .vf-slot { position: absolute; inset: 0; }
.vf-frame { position: absolute; inset: 56px 0; }
@media (min-width: 768px) { .vf-frame { inset: 64px 88px; } }
.vf-zoom { position: absolute; inset: 0; transform-origin: 50% 50%; }
.vf-hi { opacity: 0; transition: opacity var(--dur-micro) var(--ease-lux); }
.vf-hi[data-ready] { opacity: 1; }
.vf-stage[data-mouse] { cursor: zoom-in; }
.vf-stage[data-mouse][data-zoomed] { cursor: grab; }
.vf-btn {
  position: absolute; z-index: 2; display: grid; place-items: center; height: 44px; width: 44px; border-radius: 2px;
  border: 1px solid var(--c-gold); background: color-mix(in srgb, var(--c-charcoal-deep) 70%, transparent);
}
.vf-btn:hover { background: var(--c-charcoal-deep); }
.vf-btn:focus-visible { outline: 2px solid var(--c-gold-pale); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .vf-hi { transition: none; } }`;

/** The rect of an aspect-`a` photo fitted (contain) in `b`. */
function fit(a: number, b: DOMRect) {
  let w = b.width, h = w / a;
  if (h > b.height) { h = b.height; w = h * a; }
  return { x: b.x + (b.width - w) / 2, y: b.y + (b.height - h) / 2, w, h };
}

/**
 * The frame's transform and clip that make the photo inside it sit exactly
 * where it sits on the page — the same crop (the page photo is object-cover
 * in `s`), the same place — and the clip of the photo at rest. Transform
 * origin is the frame's centre, which is also the photo's.
 */
function flip(frame: HTMLElement, aspect: number, s: DOMRect) {
  const b = frame.getBoundingClientRect();
  const p = fit(aspect, b);
  const k = Math.max(s.width / p.w, s.height / p.h);
  const vw = s.width / k, vh = s.height / k;
  const cx = b.width / 2, cy = b.height / 2;
  const inset = (w: number, h: number) => `inset(${cy - h / 2}px ${cx - w / 2}px ${cy - h / 2}px ${cx - w / 2}px)`;
  return {
    transform: `translate(${s.x + s.width / 2 - (b.x + cx)}px, ${s.y + s.height / 2 - (b.y + cy)}px) scale(${k})`,
    clipPage: inset(vw, vh),
    clipRest: inset(p.w, p.h),
  };
}

/**
 * THE FULL-SCREEN VIEWER. Loaded as its own chunk the first time a reader
 * opens it (product-gallery.tsx).
 *
 *   opening   the photo grows out of its place on the page — same crop, same
 *             position — to the whole screen, over a charcoal backdrop that
 *             fades in. Closing is the same move backwards, into whichever
 *             photo the reader ended on (the page gallery switches to it,
 *             unseen, first).
 *   moving    arrows, ← →, or a sideways swipe that follows the finger; the
 *             neighbour is at the edge. Same EASE_SLIDE / EASE_GLIDE as the
 *             page gallery.
 *   zoom      pinch, or double-tap, on a phone; click on a desktop. Zoomed,
 *             one finger (or the mouse) pans, held inside the photo's edges.
 *   closing   the × button, Esc, a click on the backdrop, or a downward swipe
 *             that the photo follows as the backdrop fades.
 *
 * A modal dialog: focus moves to the close button, Tab is held inside, the
 * page behind cannot scroll, and focus goes back to the photo on the page
 * when it closes. Reduced motion: every change is instant, including the
 * open and close; pinch and pan still follow the fingers, because that is
 * the reader's own movement, not ours.
 */
export function GalleryViewer({ images, name, lang, start, aspect, getRect, onJump, onClosed }: {
  images: GalleryImage[]; name: string; lang: Lang; start: number; aspect: number;
  getRect: () => DOMRect | null; onJump: (k: number) => void; onClosed: () => void;
}) {
  const t = tr(lang);
  const n = images.length;
  const reduced = useReduced() !== false; // until known, do not animate
  const [idx, setIdx] = useState(start);
  const [mounted, setMounted] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const chrome = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const idxRef = useRef(idx); idxRef.current = idx;
  const busy = useRef(false);
  const closing = useRef(false);
  const zoom = useRef({ z: 1, tx: 0, ty: 0 });
  const pts = useRef(new Map<number, Pt>());
  const g = useRef<Gesture | null>(null);
  const lastTap = useRef<{ t: number; x: number; y: number } | null>(null);
  const fade = useRef(1); // backdrop opacity while a downward swipe is under way

  useEffect(() => { setMounted(true); }, []);

  const el = (side: -1 | 0 | 1, sel: string) => strip.current?.querySelector<HTMLElement>(`[data-side="${side}"] ${sel}`) ?? null;
  const frameEl = () => el(0, ".vf-frame");
  const zoomEl = () => el(0, ".vf-zoom");
  /** The photo's natural aspect, from whichever of its two images has loaded. */
  const photoAspect = () => {
    const img = [...(frameEl()?.querySelectorAll("img") ?? [])].reverse().find((m) => m.naturalWidth);
    return img ? img.naturalWidth / img.naturalHeight : aspect;
  };

  // ---- zoom -----------------------------------------------------------
  const clampZoom = (z: number, tx: number, ty: number) => {
    const f = frameEl();
    if (!f) return { z, tx: 0, ty: 0 };
    const p = fit(photoAspect(), f.getBoundingClientRect());
    const mx = Math.max(0, (p.w * z - window.innerWidth) / 2);
    const my = Math.max(0, (p.h * z - window.innerHeight) / 2);
    return { z, tx: Math.min(mx, Math.max(-mx, tx)), ty: Math.min(my, Math.max(-my, ty)) };
  };
  const applyZoom = (next: { z: number; tx: number; ty: number }, animate = false) => {
    const node = zoomEl();
    const from = node?.style.transform || "none";
    zoom.current = next;
    const to = next.z === 1 ? "" : `translate(${next.tx}px, ${next.ty}px) scale(${next.z})`;
    if (node) {
      node.style.transform = to;
      if (animate && !reduced && typeof node.animate === "function") {
        node.animate([{ transform: from }, { transform: to || "none" }], { duration: DUR.reveal * 500, easing: GLIDE });
      }
    }
    if (stage.current) {
      if (next.z > 1) stage.current.dataset.zoomed = ""; else delete stage.current.dataset.zoomed;
    }
  };
  /** Frame centre, in viewport px. */
  const centre = (): Pt => {
    const r = frameEl()?.getBoundingClientRect();
    return r ? { x: r.x + r.width / 2, y: r.y + r.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  };
  /** Zoom to ZOOM.tap at a point, keeping that point under the finger — or back out. */
  const toggleZoom = (p: Pt) => {
    if (zoom.current.z > 1) return applyZoom({ z: 1, tx: 0, ty: 0 }, true);
    const c = centre();
    const z = ZOOM.tap;
    applyZoom(clampZoom(z, (p.x - c.x) * (1 - z), (p.y - c.y) * (1 - z)), true);
  };
  const resetZoom = () => {
    zoom.current = { z: 1, tx: 0, ty: 0 };
    strip.current?.querySelectorAll<HTMLElement>(".vf-zoom").forEach((z) => { z.style.transform = ""; });
    if (stage.current) delete stage.current.dataset.zoomed;
  };

  // ---- open / close ---------------------------------------------------
  useLayoutEffect(() => {
    if (!mounted) return;
    const f = frameEl();
    const s = getRect();
    if (!reduced && f && s && typeof f.animate === "function") {
      const m = flip(f, aspect, s);
      const opts = { duration: DUR.expand * 1000, easing: GLIDE };
      f.animate([{ transform: m.transform, clipPath: m.clipPage }, { transform: "none", clipPath: m.clipRest }], opts);
      backdrop.current?.animate([{ opacity: 0 }, { opacity: 1 }], opts);
      chrome.current?.animate([{ opacity: 0 }, { opacity: 1 }], { ...opts, delay: opts.duration * 0.4, fill: "backwards" });
    }
    closeBtn.current?.focus({ preventScroll: true });
  }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = useCallback(async () => {
    if (closing.current) return;
    closing.current = true;
    // The page gallery switches to this photo now, behind the backdrop, so
    // the photo closes into the right place.
    onJump(idxRef.current);
    const f = frameEl();
    const s = getRect();
    if (reduced || !f || !s || typeof f.animate !== "function") return onClosed();
    const z = zoomEl();
    const zFrom = z?.style.transform || "none";
    const m = flip(f, photoAspect(), s);
    const opts = { duration: DUR.expand * 1000, easing: SLIDE, fill: "forwards" as const };
    const from = f.style.transform || "none";
    const anims = [
      f.animate([{ transform: from, clipPath: m.clipRest }, { transform: m.transform, clipPath: m.clipPage }], opts),
      backdrop.current?.animate([{ opacity: fade.current }, { opacity: 0 }], opts),
      chrome.current?.animate([{ opacity: 1 }, { opacity: 0 }], { ...opts, duration: opts.duration * 0.5 }),
      zFrom !== "none" ? z?.animate([{ transform: zFrom }, { transform: "none" }], opts) : undefined,
    ];
    await Promise.all(anims.map((a) => a?.finished.catch(() => undefined)));
    onClosed();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // The page behind does not scroll while the viewer is open.
  useLayoutEffect(() => {
    const html = document.documentElement, body = document.body;
    const bar = window.innerWidth - html.clientWidth;
    const was = { overflow: html.style.overflow, pad: body.style.paddingRight };
    html.style.overflow = "hidden";
    if (bar > 0) body.style.paddingRight = `${bar}px`;
    return () => { html.style.overflow = was.overflow; body.style.paddingRight = was.pad; };
  }, []);

  // Keys are heard at the document, not on the dialog: a click on the photo
  // (not focusable) moves focus to <body>, and Esc must still close.
  const keyRef = useRef(onKeyDown); keyRef.current = onKeyDown;
  useEffect(() => {
    const k = (e: KeyboardEvent) => keyRef.current(e);
    document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, []);

  // Focus stays inside: anything that lands outside is brought back.
  useEffect(() => {
    const keep = (e: FocusEvent) => {
      // Not while closing: the gallery is handing focus back to the page.
      if (!closing.current && root.current && !root.current.contains(e.target as Node)) closeBtn.current?.focus({ preventScroll: true });
    };
    document.addEventListener("focusin", keep);
    return () => document.removeEventListener("focusin", keep);
  }, []);

  // ---- moving between photos ------------------------------------------
  const slide = async (side: Side, fromPx = 0, released = false) => {
    const s = strip.current;
    if (!s || busy.current || n < 2) return;
    busy.current = true;
    const k = (idxRef.current + side + n) % n;
    await whenDecoded(el(side, "img") as HTMLImageElement | null);
    const w = stage.current?.clientWidth ?? window.innerWidth;
    if (!reduced && typeof s.animate === "function") {
      const p0 = Math.min(1, Math.abs(fromPx) / w);
      const dur = released ? Math.max(240, DUR.slide * 1000 * (1 - p0)) : DUR.slide * 1000;
      const a = s.animate([{ transform: `translateX(${fromPx}px)` }, { transform: `translateX(${-side * w}px)` }], { duration: dur, easing: released ? GLIDE : SLIDE, fill: "forwards" });
      await a.finished.catch(() => undefined);
      flushSync(() => setIdx(k));
      a.cancel();
    } else flushSync(() => setIdx(k));
    s.style.transform = "";
    resetZoom();
    busy.current = false;
  };

  // ---- gestures -------------------------------------------------------
  const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
  const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

  function down(e: React.PointerEvent<HTMLDivElement>) {
    if (closing.current || busy.current) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const z = zoom.current;
    if (pts.current.size === 2) {
      // A second finger: whatever the first was doing becomes a pinch.
      if (strip.current) strip.current.style.transform = "";
      const [a, b] = [...pts.current.values()];
      g.current = { kind: "pinch", d0: dist(a, b), m0: mid(a, b), z0: z.z, tx0: z.tx, ty0: z.ty };
    } else if (pts.current.size === 1) {
      g.current = z.z > 1
        ? { kind: "pan", x0: e.clientX, y0: e.clientY, tx0: z.tx, ty0: z.ty, id: e.pointerId, moved: false, mouse: e.pointerType === "mouse" }
        : { kind: "pending", x0: e.clientX, y0: e.clientY, t0: performance.now(), id: e.pointerId, dx: 0, dy: 0, mouse: e.pointerType === "mouse" };
    }
  }

  function move(e: React.PointerEvent<HTMLDivElement>) {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const s = g.current;
    if (!s) return;
    if (s.kind === "pinch") {
      const [a, b] = [...pts.current.values()];
      if (!a || !b) return;
      const m = mid(a, b);
      const z = Math.min(ZOOM.max, Math.max(1, (s.z0 * dist(a, b)) / Math.max(1, s.d0)));
      const c = centre();
      // Keep the point that was under the fingers under the fingers.
      const qx = (s.m0.x - c.x - s.tx0) / s.z0, qy = (s.m0.y - c.y - s.ty0) / s.z0;
      applyZoom(clampZoom(z, m.x - c.x - qx * z, m.y - c.y - qy * z));
      return;
    }
    if (s.kind === "pan") {
      if (e.pointerId !== s.id) return;
      if (!s.moved && Math.hypot(e.clientX - s.x0, e.clientY - s.y0) < 8) return;
      s.moved = true;
      applyZoom(clampZoom(zoom.current.z, s.tx0 + e.clientX - s.x0, s.ty0 + e.clientY - s.y0));
      return;
    }
    if (e.pointerId !== s.id) return;
    s.dx = e.clientX - s.x0; s.dy = e.clientY - s.y0;
    if (s.kind === "pending") {
      if (Math.abs(s.dx) < 8 && Math.abs(s.dy) < 8) return;
      if (Math.abs(s.dx) > Math.abs(s.dy)) { if (n > 1) s.kind = "swipe"; }
      else if (s.dy > 0) s.kind = "dismiss";
      if (s.kind === "pending") return;
    }
    if (s.kind === "swipe" && strip.current) {
      strip.current.style.transform = `translateX(${reduced ? 0 : s.dx}px)`;
    } else if (s.kind === "dismiss") {
      const f = frameEl();
      const dy = Math.max(0, s.dy);
      fade.current = 1 - Math.min(1, dy / (window.innerHeight * 0.5)) * 0.8;
      if (!reduced && f) f.style.transform = `translate(${s.dx * 0.3}px, ${dy}px) scale(${1 - Math.min(0.25, dy / window.innerHeight / 2)})`;
      if (!reduced && backdrop.current) backdrop.current.style.opacity = String(fade.current);
    }
  }

  function up(e: React.PointerEvent<HTMLDivElement>) {
    if (!pts.current.delete(e.pointerId)) return;
    const s = g.current;
    if (!s) return;
    if (s.kind === "pinch") {
      const rest = [...pts.current.entries()][0];
      if (zoom.current.z <= 1.02) { applyZoom({ z: 1, tx: 0, ty: 0 }, true); g.current = null; return; }
      g.current = rest ? { kind: "pan", x0: rest[1].x, y0: rest[1].y, tx0: zoom.current.tx, ty0: zoom.current.ty, id: rest[0], moved: true, mouse: false } : null;
      return;
    }
    if (e.pointerId !== ("id" in s ? s.id : -1)) return;
    g.current = null;
    if (s.kind === "pan" && s.moved) return;
    if (s.kind === "pending" || s.kind === "pan") {
      // A tap (a pan that never moved is one too, so a zoomed photo can be
      // tapped back out). Mouse: a click on the photo zooms in or out, a
      // click beside an unzoomed photo closes. Touch: two taps zoom.
      const p = { x: e.clientX, y: e.clientY };
      if (s.mouse) {
        const f = frameEl();
        const r = f && fit(photoAspect(), f.getBoundingClientRect());
        const onPhoto = r && p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
        if (onPhoto || zoom.current.z > 1) toggleZoom(p); else void close();
        return;
      }
      const l = lastTap.current;
      const now = performance.now();
      if (l && now - l.t < DOUBLE_TAP_MS && Math.hypot(p.x - l.x, p.y - l.y) < DOUBLE_TAP_PX) {
        lastTap.current = null;
        toggleZoom(p);
      } else lastTap.current = { t: now, ...p };
      return;
    }
    const v = Math.hypot(s.dx, s.dy) / Math.max(1, performance.now() - s.t0);
    if (s.kind === "swipe") {
      const w = stage.current?.clientWidth ?? window.innerWidth;
      if (Math.abs(s.dx) > w * SWIPE_COMMIT || v > FLICK_PX_PER_MS) void slide(s.dx < 0 ? 1 : -1, reduced ? 0 : s.dx, true);
      else if (strip.current) {
        const node = strip.current;
        if (!reduced && typeof node.animate === "function") node.animate([{ transform: `translateX(${s.dx}px)` }, { transform: "translateX(0px)" }], { duration: 300, easing: GLIDE });
        node.style.transform = "";
      }
      return;
    }
    // dismiss
    if (s.dy > DISMISS_PX || (s.dy > 20 && v > FLICK_PX_PER_MS)) { void close(); return; }
    const f = frameEl();
    if (f && !reduced && typeof f.animate === "function") {
      f.animate([{ transform: f.style.transform || "none" }, { transform: "none" }], { duration: 300, easing: GLIDE });
      backdrop.current?.animate([{ opacity: fade.current }, { opacity: 1 }], { duration: 300, easing: GLIDE });
    }
    if (f) f.style.transform = "";
    if (backdrop.current) backdrop.current.style.opacity = "";
    fade.current = 1;
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") { e.preventDefault(); void close(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); void slide(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); void slide(-1); }
    else if (e.key === "Tab") {
      const f = [...(root.current?.querySelectorAll<HTMLElement>("button") ?? [])];
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  if (!mounted) return null;
  const alt = (img: GalleryImage) => img.alt?.trim() || name;
  const slots: { side: -1 | 0 | 1; k: number }[] = [{ side: 0, k: idx }];
  if (n > 1) slots.push({ side: 1, k: (idx + 1) % n }, { side: -1, k: (idx - 1 + n) % n });

  return createPortal(
    <div ref={root} role="dialog" aria-modal="true" aria-label={`${t("product", "viewer")} — ${name}`} className="vf-root" tabIndex={-1} style={{ outline: "none" }}>
      <ComponentStyle id="fx-viewer" css={CSS} />
      <div ref={backdrop} className="vf-backdrop" />
      <div
        ref={stage}
        className="vf-stage"
        data-mouse={typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches ? "" : undefined}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        <div ref={strip} className="vf-strip">
          {slots.map(({ side, k }) => (
            <div key={n === 2 ? `${k}:${side}` : String(k)} data-side={side} aria-hidden={side === 0 ? undefined : "true"}
              className="vf-slot" style={side === 0 ? undefined : { transform: `translateX(${side * 100}%)` }}>
              <div className="vf-frame">
                <div className="vf-zoom">
                  {/* The page's own photo first (same URL: a cache hit, so the
                      opening move always has a picture), the full-screen file
                      fading over it once decoded. */}
                  <Image src={images[k].url} alt={side === 0 ? alt(images[k]) : ""} fill sizes={SIZES} loading="eager" draggable={false}
                    className="object-contain" unoptimized={passthrough(images[k].url)} />
                  <HiRes url={images[k].url} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div ref={chrome}>
        <p aria-live="polite" className="absolute left-4 top-3 z-[2] py-2.5 text-sm text-chalk">
          {t("product", "photoOf", { n: String(idx + 1), total: String(n) })}
        </p>
        <button ref={closeBtn} type="button" onClick={() => void close()} aria-label={t("product", "closeViewer")} className="vf-btn text-chalk right-3 top-1.5">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
        </button>
        {n > 1 && (
          <>
            <button type="button" onClick={() => void slide(-1)} aria-label={t("product", "prevPhoto")} className="vf-btn text-chalk left-3 top-1/2 -translate-y-1/2">
              <span aria-hidden="true" className="text-xl leading-none">&lsaquo;</span>
            </button>
            <button type="button" onClick={() => void slide(1)} aria-label={t("product", "nextPhoto")} className="vf-btn text-chalk right-3 top-1/2 -translate-y-1/2">
              <span aria-hidden="true" className="text-xl leading-none">&rsaquo;</span>
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

/** The full-screen file, shown once it has decoded. */
function HiRes({ url }: { url: string }) {
  const [ready, setReady] = useState(false);
  return (
    <Image src={url} alt="" fill sizes="100vw" loading="eager" draggable={false}
      data-ready={ready ? "" : undefined}
      onLoad={(e) => { const done = () => setReady(true); e.currentTarget.decode().then(done, done); }}
      className="object-contain vf-hi" unoptimized={passthrough(url)} />
  );
}
