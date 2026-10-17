"use client";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { readViewed, recordViewed } from "@/lib/recently-viewed";
import type { Lang } from "@/lib/i18n";
import type { Product } from "@/lib/types";

/**
 * RECENTLY VIEWED (owner 2026-10-17), the last section of the product page.
 * On mount the piece on screen is recorded (lib/recently-viewed.ts, slugs
 * only); the others are fetched fresh from the Hub through
 * /api/recently-viewed and drawn with the same ProductCard and grid as
 * "Related pieces", so prices, the Sale strike, Sold and the origin badge are
 * the Hub's current answer. Nothing renders until the cards arrive: the server
 * HTML and the first client render are empty (no hydration mismatch, the ISR
 * page is untouched), and the section sits last, so nothing above it moves.
 */
export function RecentlyViewed({ currentSlug, lang, title }: { currentSlug: string; lang: Lang; title: string }) {
  const [pieces, setPieces] = useState<Product[]>([]);

  useEffect(() => {
    let store: Storage | null = null;
    try { store = window.localStorage; } catch { /* blocked site data */ }
    recordViewed(store, currentSlug);
    const others = readViewed(store).filter((s) => s !== currentSlug);
    if (!others.length) { setPieces([]); return; }
    const ctrl = new AbortController();
    fetch(`/api/recently-viewed?slugs=${others.map(encodeURIComponent).join(",")}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { products?: Product[] } | null) => setPieces(Array.isArray(d?.products) ? d.products.filter((p) => p.slug !== currentSlug) : []))
      .catch(() => { /* aborted or offline: the section stays absent */ });
    return () => ctrl.abort();
  }, [currentSlug]);

  if (!pieces.length) return null;
  return (
    <section aria-labelledby="pdp-recent" className="pb-16 pt-10 sm:pb-24 sm:pt-14">
      <div className="mb-6 flex items-end justify-between gap-5">
        <h2 id="pdp-recent" className="text-[clamp(30px,4vw,52px)] leading-[1.08]">{title}</h2>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-5 min-[834px]:grid-cols-3 min-[834px]:gap-x-6 min-[834px]:gap-y-8 lg:grid-cols-4">
        {pieces.map((x, i) => <ProductCard key={x.slug} product={x} lang={lang} index={i} />)}
      </div>
    </section>
  );
}
