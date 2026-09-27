import "server-only";
import { hub, SECONDARY_TIMEOUT_MS } from "@/lib/hub-api";
import { inStockVariant, within } from "@/lib/hero-deck";
import type { Category, Collection, Product } from "@/lib/types";

/**
 * WHAT A PRODUCT OR GRID PAGE KNOWS ABOUT THE REST OF THE CATALOGUE (step 2
 * build). The Hub's product carries its categories but not its collections,
 * so a piece's collection is found by reading the collections — the same
 * cached reads (60 s, tag "catalog") the header's Collections menu already
 * makes for its counts (lib/frame-menu.ts), so no new traffic. Every read here
 * is secondary: it gives up after SECONDARY_TIMEOUT_MS and costs the page a
 * crumb or a row of related pieces, never the page.
 *
 * "Available" is the hero's rule: active, with a variant in stock
 * (`inStockVariant`). Nothing here reads or compares a price.
 */
const soft = <T,>(p: Promise<T>, fallback: T) => within(p, SECONDARY_TIMEOUT_MS).catch(() => fallback);

export const isAvailable = (p: Product) => inStockVariant(p) !== null;

export type CollectionWithProducts = Collection & { products: Product[] };

/** Every collection with its pieces, in the Hub's order. */
export async function collectionsWithProducts(): Promise<CollectionWithProducts[]> {
  const cols = await soft(hub.collections(), [] as Collection[]);
  const full = await Promise.all(cols.map((c) => soft(hub.collection(c.slug), null)));
  return full.filter((c): c is CollectionWithProducts => !!c);
}

/** The first collection (Hub order) that holds this piece. */
export function collectionOf(p: Product, cols: CollectionWithProducts[]): CollectionWithProducts | null {
  return cols.find((c) => c.products.some((x) => x.id === p.id || x.slug === p.slug)) ?? null;
}

/** The piece's first category, for the crumb and the specification ledger. */
export async function categoryOf(p: Product): Promise<Category | null> {
  const slug = p.category_slugs?.[0];
  if (!slug) return null;
  const cats = await soft(hub.categories(), [] as Category[]);
  return cats.find((c) => c.slug === slug) ?? null;
}

/** The whole active catalogue (the search index's cached read). */
export const catalogue = () => soft(hub.allProducts(), [] as Product[]);

const uniq = (list: Product[], not: Product) => {
  const seen = new Set<string>([not.slug]);
  return list.filter((x) => (seen.has(x.slug) ? false : (seen.add(x.slug), true)));
};

/**
 * Related pieces (comp: 4 real available pieces): the same collection first,
 * then the same condition, then anything available — in the Hub's order.
 */
export function relatedPieces(p: Product, col: CollectionWithProducts | null, all: Product[], n = 4, exclude: Product[] = []): Product[] {
  const skip = new Set(exclude.map((x) => x.slug));
  const pool = all.filter((x) => isAvailable(x) && !skip.has(x.slug));
  const inCol = (col?.products ?? []).filter((x) => isAvailable(x) && !skip.has(x.slug));
  const cond = pool.filter((x) => (x.condition ?? "New") === (p.condition ?? "New"));
  return uniq([...inCol, ...cond, ...pool], p).slice(0, n);
}

/**
 * The sold page's three closest AVAILABLE pieces (comp: same category or
 * brand, then preloved), so a sold piece is never a dead end.
 */
export function soldAlternatives(p: Product, all: Product[], n = 3): Product[] {
  const pool = all.filter(isAvailable);
  const cats = new Set(p.category_slugs ?? []);
  const brand = p.brand?.trim().toLowerCase();
  const near = pool.filter((x) => (x.category_slugs ?? []).some((c) => cats.has(c)) || (!!brand && x.brand?.trim().toLowerCase() === brand));
  const cond = pool.filter((x) => (x.condition ?? "New") === (p.condition ?? "New"));
  return uniq([...near, ...cond, ...pool], p).slice(0, n);
}

/** Collections that have available pieces, with the count (the empty grid's way on). */
export function stockedCollections(cols: CollectionWithProducts[]): { col: CollectionWithProducts; n: number }[] {
  return cols.map((col) => ({ col, n: col.products.filter(isAvailable).length })).filter((x) => x.n > 0);
}
