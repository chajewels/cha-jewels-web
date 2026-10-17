"use client";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/catalog/product-card";
import { readViewed, recordViewed } from "@/lib/recently-viewed";
import type { Lang } from "@/lib/i18n";
import type { Product } from "@/lib/types";

/**
 * RECENTLY VIEWED (owner decision 2026-10-17, superseding PR #361's
 * placement): shown on the HOME page, above the layaway band (on the Japanese
 * home, which has no band, between Values and Collections); RECORDED on the
 * product page, which shows nothing of it.
 *
 * The browser keeps slugs only (lib/recently-viewed.ts); the cards are fetched
 * fresh from the Hub through /api/recently-viewed and drawn with the same
 * ProductCard as every grid, so prices, the Sale strike, Sold and the origin
 * badge are the Hub's current answer. Both halves render nothing on the server
 * and on the first client render (no hydration mismatch, ISR untouched).
 */

/** The product page's half: remembers the visit, renders nothing. */
export function RecordView({ slug }: { slug: string }) {
  useEffect(() => {
    let store: Storage | null = null;
    try { store = window.localStorage; } catch { /* blocked site data */ }
    recordViewed(store, slug);
  }, [slug]);
  return null;
}

/** The home page's half: the last `limit` pieces viewed, most recent first; absent until it has cards. */
export function RecentlyViewed({ lang, title, limit = 8 }: { lang: Lang; title: string; limit?: number }) {
  const [pieces, setPieces] = useState<Product[]>([]);

  useEffect(() => {
    let store: Storage | null = null;
    try { store = window.localStorage; } catch { /* blocked site data */ }
    const slugs = readViewed(store).slice(0, limit);
    if (!slugs.length) return;
    const ctrl = new AbortController();
    fetch(`/api/recently-viewed?slugs=${slugs.map(encodeURIComponent).join(",")}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { products?: Product[] } | null) => setPieces(Array.isArray(d?.products) ? d.products : []))
      .catch(() => { /* aborted or offline: the section stays absent */ });
    return () => ctrl.abort();
  }, [limit]);

  if (!pieces.length) return null;
  return (
    <section aria-labelledby="home-recent" className="border-t border-hairline py-16 lg:py-20">
      <div className="wrap">
        <div className="mb-6 flex items-end justify-between gap-5">
          <h2 id="home-recent" className="text-[clamp(30px,4vw,52px)] leading-[1.08]">{title}</h2>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 min-[834px]:grid-cols-3 min-[834px]:gap-x-6 min-[834px]:gap-y-8 lg:grid-cols-4">
          {pieces.map((x, i) => <ProductCard key={x.slug} product={x} lang={lang} index={i} />)}
        </div>
      </div>
    </section>
  );
}
