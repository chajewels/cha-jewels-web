import { cache } from "react";
import { hub } from "@/lib/hub-api";
import type { Product } from "@/lib/types";
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
export function primaryImage(p: Product) {
  const media = p.product_variants.flatMap((v) => v.product_media).sort((a, b) => a.sort - b.sort);
  return media[0] ?? null;
}
