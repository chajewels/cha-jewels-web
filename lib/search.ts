import "server-only";
import { unstable_cache } from "next/cache";
import { hub } from "@/lib/hub-api";
import { productName } from "@/lib/catalog-i18n";
import { fromPrice, primaryImage } from "@/lib/queries/products";
import type { Lang } from "@/lib/i18n";
import type { Product } from "@/lib/types";

/**
 * Site search, computed on the storefront.
 *
 * The Hub's /catalog/products takes no `q`, so there is nothing to forward a
 * query to. Rather than add a Hub endpoint (Lovable's to own, not ours), the
 * storefront keeps a cached copy of the catalog and matches against it here.
 * The catalog is small — a few hundred one-of-a-kind pieces — so a linear scan
 * per query costs nothing next to a network round trip, and the index is shared
 * by every visitor for its 60s life.
 *
 * NOTHING HERE THROWS. Search is an accessory to browsing: a Hub outage must
 * degrade it to "no results", never break the header it is mounted in or the
 * page it is rendered on. Every entry point returns an empty result instead.
 */

/** A product plus the pre-normalized text it is matched against. */
type Entry = { product: Product; haystack: string; sku: string; names: string[]; brand: string };

import { normalize } from "@/lib/search-normalize";
export { normalize };

/**
 * Every field a piece can be found by, normalized separately and joined with a
 * newline. The separator matters: it is the one character `normalize` can never
 * produce, so a token can never match by spanning the seam between two fields
 * (a product named "Ring" with stone "Ruby" must not answer to "ringruby").
 */
function buildHaystack(p: Product): string {
  const fields: (string | null | undefined)[] = [
    p.sku,
    p.name,
    p.name_en,
    p.name_ja,
    p.brand,
    ...(p.metals ?? []),
    p.karat,
    p.description_en,
    p.description_ja,
    ...p.product_variants.flatMap((v) => [v.size, v.stone]),
  ];
  return fields
    .filter((f): f is string => typeof f === "string" && f.trim() !== "")
    .map(normalize)
    .join("\n");
}

function toEntry(p: Product): Entry {
  return {
    product: p,
    haystack: buildHaystack(p),
    sku: normalize(p.sku),
    names: [p.name, p.name_en, p.name_ja].filter((n): n is string => typeof n === "string" && n.trim() !== "").map(normalize),
    brand: normalize(p.brand ?? ""),
  };
}

/**
 * The index, cached for 60s under "search-index" and tagged "catalog" so the
 * Hub's revalidate webhook (app/api/revalidate/route.ts) drops it the moment a
 * product, variant or stock level changes. The normalization is done once per
 * index build rather than once per query.
 *
 * Archived and draft pieces are left out: a product the catalog will not show
 * must not be reachable by typing its name.
 */
const cachedIndex = unstable_cache(
  async (): Promise<Entry[]> => {
    const products = await hub.allProducts(5000);
    return products.filter((p) => p.status === "active").map(toEntry);
  },
  ["search-index"],
  { revalidate: 60, tags: ["catalog"] },
);

export async function loadIndex(): Promise<Entry[]> {
  try {
    return await cachedIndex();
  } catch {
    // A Hub outage, a missing key, a timeout — all the same answer. See the
    // header comment: search degrades, it does not fail.
    return [];
  }
}

export type SearchResult = { products: Product[]; total: number };

/**
 * Rank buckets, best first. Within a bucket the order is by display name, so
 * the same query always returns the same list in the same order — a dropdown
 * that reshuffles between keystrokes is worse than one that is merely wrong.
 */
function rank(e: Entry, needle: string): number {
  if (e.sku === needle) return 0;
  if (e.names.some((n) => n.startsWith(needle))) return 1;
  if (e.brand !== "" && e.brand.includes(needle)) return 2;
  return 3;
}

/**
 * Every token must appear somewhere in the haystack (AND, not OR): typing more
 * words narrows the list, which is what a shopper expects from a search box.
 */
export async function search(q: string, lang: Lang, limit = 8): Promise<SearchResult> {
  try {
    const tokens = q.split(/\s+/).map(normalize).filter((t) => t !== "");
    if (tokens.length === 0) return { products: [], total: 0 };

    const index = await loadIndex();
    const needle = normalize(q);
    const hits = index.filter((e) => tokens.every((tok) => e.haystack.includes(tok)));

    hits.sort((a, b) => {
      const d = rank(a, needle) - rank(b, needle);
      if (d !== 0) return d;
      return productName(a.product, lang).localeCompare(productName(b.product, lang), lang === "ja" ? "ja" : "en");
    });

    return { products: hits.slice(0, limit).map((e) => e.product), total: hits.length };
  } catch {
    return { products: [], total: 0 };
  }
}

/**
 * What the suggestion dropdown actually needs. The API answers with these
 * rather than whole Product objects: a keystroke-rate endpoint should not ship
 * every variant, every media row and both descriptions of eight pieces to draw
 * four lines of text and a thumbnail.
 */
export type Suggestion = { slug: string; sku: string; name: string; price: number | null; image: string | null };

export function toSuggestion(p: Product, lang: Lang): Suggestion {
  return {
    slug: p.slug,
    sku: p.sku,
    name: productName(p, lang),
    price: fromPrice(p),
    image: primaryImage(p)?.url ?? null,
  };
}
