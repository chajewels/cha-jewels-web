"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { tr, type Lang } from "@/lib/i18n";

export type GalleryImage = { url: string; alt: string | null };

/** next/image cannot optimise SVG or data URLs (fixtures use both); real Hub photos are optimised. */
const passthrough = (url: string) => url.startsWith("data:") || /\.svg(\?|$)/i.test(url);

const FADE_MS = 200;
const SIZES = "(min-width:768px) 50vw, 100vw";

/**
 * All of a piece's photos in Hub sort order: one large image plus a thumbnail
 * strip. The strip scrolls sideways on narrow screens; the large image swipes.
 * Arrow keys, Home and End move through the set when the gallery has focus;
 * each thumbnail is a real button. Alt text comes from the Hub, falling back
 * to the product name.
 *
 * NOTHING GOES BLANK BETWEEN TWO PHOTOS.
 *
 * The large image used to be a single <Image> keyed on its URL, so choosing a
 * thumbnail unmounted the photo being looked at and mounted an empty box in
 * its place — the chalk background showed through for as long as the next file
 * took, which on a phone is most of a second per tap. The reader was punished
 * for browsing.
 *
 * Two layers now. The one on the bottom is whatever is currently painted. The
 * requested one is mounted ON TOP at opacity 0 — mounted, so it loads through
 * the same optimised URL and srcset the visible layer would use, rather than
 * a second copy fetched by hand — and it is only faded in once it has actually
 * DECODED. onLoad alone is not enough: the bytes can be there while the frame
 * is not, and fading in on load still shows a blank for a beat on a large
 * photo. Because the incoming layer is already sitting on top at opacity 0,
 * the fade IS the crossfade; no third layer is needed.
 *
 * `i` is what the reader asked for and updates immediately, so the counter,
 * the selected thumbnail and the strip all respond to the tap at once. `shown`
 * is what is painted, and only catches up when the new photo is ready. Tapping
 * five thumbnails quickly leaves `i` on the fifth and never shows the first
 * four: each incoming layer unmounts as the next replaces it, and the decode
 * that comes back late is dropped by the `wanted` check.
 *
 * Under reduced motion the blanket rule in globals.css removes the transition,
 * so the swap is instant — still decode-gated, so still never blank. The
 * commit is on a timer rather than transitionend for exactly that reason: with
 * no transition, transitionend never fires and the top layer would stay up.
 */
export function ProductGallery({ images, name, lang }: { images: GalleryImage[]; name: string; lang: Lang }) {
  const t = tr(lang);
  const n = images.length;
  /** What the reader asked for. */
  const [i, setI] = useState(0);
  /** What is actually on screen. Catches up to `i` once the photo has decoded. */
  const [shown, setShown] = useState(0);
  /** The incoming layer has decoded and may be faded in. */
  const [ready, setReady] = useState(false);
  /**
   * Mounted yet? The adjacent photo is preloaded, but not in the first paint —
   * it would be competing with the LCP image for the same connection.
   */
  const [armed, setArmed] = useState(false);
  const wanted = useRef(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback((d: number) => { if (n > 1) setI((c) => (c + d + n) % n); }, [n]);

  useEffect(() => { setArmed(true); }, []);
  useEffect(() => { wanted.current = i; setReady(false); }, [i]);

  useEffect(() => {
    stripRef.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [i]);

  // The incoming layer has finished its fade: adopt it as the visible one. The
  // layer then unmounts, and the layer below is already the same photo.
  useEffect(() => {
    if (!ready || i === shown) return;
    const id = setTimeout(() => { setShown(i); setReady(false); }, FADE_MS);
    return () => clearTimeout(id);
  }, [ready, i, shown]);

  if (n === 0) return <div className="relative aspect-[4/5] bg-chalk" aria-hidden="true" />;
  const alt = (img: GalleryImage) => img.alt?.trim() || name;
  const incoming = i === shown ? null : i;
  // ONE neighbour, not the whole set: enough that the common next tap is
  // instant, not so much that opening a ten-photo piece downloads ten photos.
  const adjacent = n > 1 ? (i + 1) % n : null;
  const preload = armed && adjacent !== null && adjacent !== shown && adjacent !== incoming ? adjacent : null;

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
    else if (e.key === "Home") { e.preventDefault(); setI(0); }
    else if (e.key === "End") { e.preventDefault(); setI(n - 1); }
  }

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={t("product", "gallery")}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-dark"
    >
      <div
        className="relative aspect-[4/5] overflow-hidden bg-chalk"
        onTouchStart={(e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={(e) => {
          const s = touch.current; touch.current = null;
          if (!s) return;
          const dx = e.changedTouches[0].clientX - s.x;
          const dy = e.changedTouches[0].clientY - s.y;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
        }}
      >
        {/* The photo on screen. 4:5 box is the parent's and never moves. */}
        <Image
          key={images[shown].url}
          src={images[shown].url}
          alt={alt(images[shown])}
          fill
          sizes={SIZES}
          className="object-cover"
          priority={shown === 0}
          unoptimized={passthrough(images[shown].url)}
        />
        {/* The requested photo, invisible until it has decoded. */}
        {incoming !== null && (
          <Image
            key={images[incoming].url}
            src={images[incoming].url}
            alt={alt(images[incoming])}
            fill
            sizes={SIZES}
            onLoad={(e) => {
              const el = e.currentTarget;
              const k = incoming;
              const show = () => { if (wanted.current === k) setReady(true); };
              // decode() rejects on a detached or broken image; that is not a
              // reason to leave the reader on the old photo for ever.
              el.decode().then(show, show);
            }}
            className={`object-cover transition-opacity duration-200 ${ready ? "opacity-100" : "opacity-0"}`}
            unoptimized={passthrough(images[incoming].url)}
          />
        )}
        {/* Warm the next one. aria-hidden and inert to the pointer: it is a
            fetch wearing an <img>, not part of the gallery. */}
        {preload !== null && (
          <Image
            key={`preload-${images[preload].url}`}
            src={images[preload].url}
            alt=""
            aria-hidden="true"
            fill
            sizes={SIZES}
            className="pointer-events-none object-cover opacity-0"
            unoptimized={passthrough(images[preload].url)}
          />
        )}
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label={t("product", "prevPhoto")}
              className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-sm border border-charcoal/60 bg-white/85 text-charcoal-deep backdrop-blur hover:border-gold-dark">
              <span aria-hidden="true">&lsaquo;</span>
            </button>
            <button type="button" onClick={() => go(1)} aria-label={t("product", "nextPhoto")}
              className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-sm border border-charcoal/60 bg-white/85 text-charcoal-deep backdrop-blur hover:border-gold-dark">
              <span aria-hidden="true">&rsaquo;</span>
            </button>
            <p aria-live="polite" className="absolute bottom-2 right-2 rounded-sm border border-hairline bg-white/85 px-2 py-0.5 text-xs text-charcoal backdrop-blur">
              {t("product", "photoOf", { n: String(i + 1), total: String(n) })}
            </p>
          </>
        )}
      </div>
      {n > 1 && (
        <div ref={stripRef} role="tablist" aria-label={t("product", "gallery")}
          className="mt-1.5 flex snap-x snap-mandatory gap-1.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {images.map((img, k) => (
            <button
              key={img.url + k}
              type="button"
              role="tab"
              data-i={k}
              aria-selected={k === i}
              aria-label={t("product", "photoOf", { n: String(k + 1), total: String(n) })}
              onClick={() => setI(k)}
              className={`relative h-16 w-16 shrink-0 snap-start overflow-hidden border bg-chalk sm:h-20 sm:w-20 ${k === i ? "border-gold-dark" : "border-hairline opacity-70 hover:opacity-100"}`}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" loading="lazy" unoptimized={passthrough(img.url)} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
