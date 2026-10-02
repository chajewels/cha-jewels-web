import { cache } from "react";
import { hub } from "@/lib/hub-api";
import type { Product, ProductMedia } from "@/lib/types";
export type { Product } from "@/lib/types";
// Thin cached wrappers over the Hub API. Components import from here and never see the transport.
export const getCollections = cache(() => hub.collections());
export const getCollectionWithProducts = cache((slug: string) => hub.collection(slug));
export const getProductBySlug = cache((slug: string) => hub.product(slug));
export const getFeaturedProducts = cache((limit = 8) => hub.featured(limit));

export function fromPrice(p: Product) {
  const prices = p.product_variants.map((v) => v.price_jpy);
  const min = Math.min(...prices);
  return Number.isFinite(min) ? min : null;
}
/**
 * The variant whose price `fromPrice` shows. A card's "reserve from" figure is
 * that variant's Hub down payment, so the reserve line always belongs to the
 * price printed beside it.
 */
export function fromVariant(p: Product) {
  const min = fromPrice(p);
  return min == null ? null : p.product_variants.find((v) => v.price_jpy === min) ?? null;
}
/**
 * Every photo of the piece, across variants, in Hub sort order, each URL once:
 * a photo shared by two variants is kept at its first place only. The hero
 * cut-out workflow builds its list the same way (scripts/hero-cutouts/run.py
 * `all_images`), so the hero's photo window and the cut window are one list.
 */
export function allImages(p: Product) {
  const seen = new Set<string>();
  return p.product_variants.flatMap((v) => v.product_media).sort((a, b) => a.sort - b.sort).filter((m) => {
    if (typeof m.url !== "string" || !m.url) return true;
    if (seen.has(m.url)) return false;
    seen.add(m.url);
    return true;
  });
}
export function primaryImage(p: Product) {
  return allImages(p)[0] ?? null;
}

// APPROVAL FIRST (owner 2026-10-02, Hub migration 20261026100000): only a staff-approved cut-out is shown.
const SHOWN_CUTOUT = new Set<string>(["approved"]);
/**
 * A photo's cut-out, when the Hub has one that may be shown: status ok,
 * auto_fixed or approved, with a URL and real dimensions. Anything else —
 * absent, null, held for review, rejected, failed or malformed — is null, and
 * the caller shows the whole original photo instead.
 */
export function usableCutout(m: ProductMedia | null | undefined): { url: string; width: number; height: number } | null {
  const c = m?.cutout;
  if (!c || typeof c.url !== "string" || !c.url.trim() || !SHOWN_CUTOUT.has(c.status)) return null;
  if (!(Number.isFinite(c.width) && c.width > 0 && Number.isFinite(c.height) && c.height > 0)) return null;
  return { url: c.url, width: c.width, height: c.height };
}
