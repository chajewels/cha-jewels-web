import type { ItemType } from "./types";

/**
 * THE CATALOG TOOLBAR IN THE ADDRESS BAR (owner report 2026-10-17: a link
 * copied after choosing New or Preloved opened on "All"). The filters of
 * CatalogGrid as query parameters, so a shared link lands on the chosen group:
 *
 *   cond=new|preloved|sale   type=jewelry|watch|accessory   metal=<Hub stamp>
 *   kind=<collection slug>   brand=<Hub brand, exactly as written>
 *   stock=1 (same name as the search page)   sort=oldest|low|high
 *
 * A default removes its key, so a plain page keeps a plain URL; every other
 * parameter (lang…) is left untouched and in place. Pure: no React, no DOM.
 */
export type CatalogFilters = {
  cond: "all" | "new" | "preloved" | "sale";
  type: ItemType | null;
  /** A collection slug from the pieces' `collection_slugs` (owner 2026-10-27). */
  kind: string | null;
  /** A `brand` exactly as the Hub writes it (owner 2026-10-27). */
  brand: string | null;
  metal: string | null;
  availOnly: boolean;
  /** "newest" is the Hub's own list order; "oldest" is that order reversed. */
  sort: "newest" | "oldest" | "low" | "high";
};

export const DEFAULT_FILTERS: CatalogFilters = { cond: "all", type: null, kind: null, brand: null, metal: null, availOnly: false, sort: "newest" };

const KEYS = ["cond", "type", "kind", "brand", "metal", "stock", "sort"] as const;

/**
 * Reads a query string (with or without "?"); an unknown or invalid value is that filter's default. Never throws.
 * `allowed` is the page's own options: a type, kind, brand or metal the page does not show is ignored. A kind
 * (a slug) and a metal match in any case; a brand matches only exactly, so two spellings stay two brands.
 */
export function parseCatalogFilters(search: string, allowed: { types: ItemType[]; metals: string[]; kinds?: string[]; brands?: string[] }): CatalogFilters {
  const f = { ...DEFAULT_FILTERS };
  let q: URLSearchParams;
  try { q = new URLSearchParams(search); } catch { return f; }
  const cond = q.get("cond");
  if (cond === "new" || cond === "preloved" || cond === "sale") f.cond = cond;
  const type = q.get("type")?.toLowerCase();
  if (type) f.type = allowed.types.find((t) => t.toLowerCase() === type) ?? null;
  const kind = q.get("kind")?.toLowerCase();
  if (kind) f.kind = (allowed.kinds ?? []).find((k) => k.toLowerCase() === kind) ?? null;
  const brand = q.get("brand");
  if (brand) f.brand = (allowed.brands ?? []).find((b) => b === brand) ?? null;
  const metal = q.get("metal")?.toUpperCase();
  if (metal) f.metal = allowed.metals.find((m) => m.toUpperCase() === metal) ?? null;
  f.availOnly = q.get("stock") === "1";
  const sort = q.get("sort");
  if (sort === "oldest" || sort === "low" || sort === "high") f.sort = sort;
  return f;
}

/** The new query string: only the filter keys are set or removed. "" when nothing remains, else "?a=b&c=d". */
export function catalogFiltersToSearch(current: string, f: CatalogFilters): string {
  let q: URLSearchParams;
  try { q = new URLSearchParams(current); } catch { q = new URLSearchParams(); }
  const want: Record<(typeof KEYS)[number], string | null> = {
    cond: f.cond === "all" ? null : f.cond,
    type: f.type ? f.type.toLowerCase() : null,
    kind: f.kind || null,
    brand: f.brand || null,
    metal: f.metal || null,
    stock: f.availOnly ? "1" : null,
    sort: f.sort === "newest" ? null : f.sort,
  };
  // set() keeps an existing key where it stands; a new one is appended.
  for (const k of KEYS) { const v = want[k]; if (v == null) q.delete(k); else q.set(k, v); }
  const s = q.toString();
  return s ? `?${s}` : "";
}
