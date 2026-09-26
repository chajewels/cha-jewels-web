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
/** Every photo of the piece, across variants, in Hub sort order. */
export function allImages(p: Product) {
  return p.product_variants.flatMap((v) => v.product_media).sort((a, b) => a.sort - b.sort);
}
export function primaryImage(p: Product) {
  return allImages(p)[0] ?? null;
}

const SHOWN_CUTOUT = new Set<string>(["ok", "auto_fixed", "approved"]);
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
