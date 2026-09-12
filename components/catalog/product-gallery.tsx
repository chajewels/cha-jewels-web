"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { tr, type Lang } from "@/lib/i18n";

export type GalleryImage = { url: string; alt: string | null };

/** next/image cannot optimise SVG or data URLs (fixtures use both); real Hub photos are optimised. */
const passthrough = (url: string) => url.startsWith("data:") || /\.svg(\?|$)/i.test(url);

/**
 * All of a piece's photos in Hub sort order: one large image plus a thumbnail
 * strip. The strip scrolls sideways on narrow screens; the large image swipes.
 * Arrow keys, Home and End move through the set when the gallery has focus;
 * each thumbnail is a real button. Only the first large image is eager — the
 * rest load when selected, and the thumbnails lazy-load as they scroll in.
 * Alt text comes from the Hub, falling back to the product name.
 */
export function ProductGallery({ images, name, lang }: { images: GalleryImage[]; name: string; lang: Lang }) {
  const t = tr(lang);
  const n = images.length;
  const [i, setI] = useState(0);
  const stripRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);

  const go = useCallback((d: number) => { if (n > 1) setI((c) => (c + d + n) % n); }, [n]);

  useEffect(() => {
    stripRef.current?.querySelector<HTMLElement>(`[data-i="${i}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [i]);

  if (n === 0) return <div className="relative aspect-[4/5] bg-velvet-deep" aria-hidden="true" />;
  const current = images[i];
  const alt = (img: GalleryImage) => img.alt?.trim() || name;

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
      className="outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-pale"
    >
      <div
        className="relative aspect-[4/5] overflow-hidden bg-velvet-deep"
        onTouchStart={(e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={(e) => {
          const s = touch.current; touch.current = null;
          if (!s) return;
          const dx = e.changedTouches[0].clientX - s.x;
          const dy = e.changedTouches[0].clientY - s.y;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
        }}
      >
        <Image
          key={current.url}
          src={current.url}
          alt={alt(current)}
          fill
          sizes="(min-width:768px) 50vw, 100vw"
          className="object-cover"
          priority={i === 0}
          loading={i === 0 ? undefined : "lazy"}
          unoptimized={passthrough(current.url)}
        />
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label={t("product", "prevPhoto")}
              className="absolute left-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-sm border border-rule bg-velvet/80 text-gold-pale backdrop-blur hover:border-gold">
              <span aria-hidden="true">&lsaquo;</span>
            </button>
            <button type="button" onClick={() => go(1)} aria-label={t("product", "nextPhoto")}
              className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-sm border border-rule bg-velvet/80 text-gold-pale backdrop-blur hover:border-gold">
              <span aria-hidden="true">&rsaquo;</span>
            </button>
            <p aria-live="polite" className="absolute bottom-2 right-2 rounded-sm bg-velvet/80 px-2 py-0.5 text-xs text-champagne/80 backdrop-blur">
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
              className={`relative h-16 w-16 shrink-0 snap-start overflow-hidden border bg-velvet-deep sm:h-20 sm:w-20 ${k === i ? "border-gold" : "border-rule opacity-70 hover:opacity-100"}`}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" loading="lazy" unoptimized={passthrough(img.url)} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
