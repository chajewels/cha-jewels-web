import { cache } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import type { Collection, Product } from "@/lib/types";
import * as fx from "@/lib/fixtures";
const FIXTURES = process.env.NEXT_PUBLIC_PREVIEW_FIXTURES === "1";
export type { Product } from "@/lib/types";
// Whitelisted columns only. Never add cost_basis or margin here.
const PRODUCT_COLS = "id, sku, slug, name, karat, weight_g, description_en, description_ja, description_tl, status, product_variants(id, size, stone, price_jpy, price_php, stock_qty, product_media(url, alt, sort))";

export const getCollections = cache(async (): Promise<Collection[]> => {
  if (FIXTURES) return fx.collections;
  const sb = await supabaseServer();
  const { data, error } = await sb.from("collections").select("id, slug, name, hero_media, description").order("name").returns<Collection[]>();
  if (error) throw error;
  return data ?? [];
});

export const getCollectionWithProducts = cache(async (slug: string): Promise<(Collection & { products: Product[] }) | null> => {
  if (FIXTURES) { const c = fx.collections.find((x) => x.slug === slug); return c ? { ...c, products: fx.products.filter((p) => p.col === slug) } : null; }
  const sb = await supabaseServer();
  const { data: col } = await sb.from("collections").select("id, slug, name, hero_media, description").eq("slug", slug).single<Collection>();
  if (!col) return null;
  const { data: rows } = await sb.from("collection_products").select(`sort, products(${PRODUCT_COLS})`).eq("collection_id", col.id).order("sort").returns<{ sort: number; products: Product | null }[]>();
  const products = (rows ?? []).map((r) => r.products).filter((p): p is Product => !!p && p.status === "active");
  return { ...col, products };
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  if (FIXTURES) return fx.products.find((p) => p.slug === slug) ?? null;
  const sb = await supabaseServer();
  const { data } = await sb.from("products").select(PRODUCT_COLS).eq("slug", slug).eq("status", "active").single<Product>();
  return data ?? null;
});

export const getFeaturedProducts = cache(async (limit = 8): Promise<Product[]> => {
  if (FIXTURES) return fx.products.slice(0, limit);
  const sb = await supabaseServer();
  const { data } = await sb.from("products").select(PRODUCT_COLS).eq("status", "active").order("created_at", { ascending: false }).limit(limit).returns<Product[]>();
  return data ?? [];
});

export function fromPrice(p: Product, region: "JP" | "PH") {
  const prices = p.product_variants.map((v) => (region === "PH" ? v.price_php ?? Infinity : v.price_jpy));
  const min = Math.min(...prices);
  return Number.isFinite(min) ? min : null;
}
export function primaryImage(p: Product) {
  const media = p.product_variants.flatMap((v) => v.product_media).sort((a, b) => a.sort - b.sort);
  return media[0] ?? null;
}
