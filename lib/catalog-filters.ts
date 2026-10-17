import type { ItemType } from "./types";

/**
 * THE CATALOG TOOLBAR IN THE ADDRESS BAR (owner report 2026-10-17: a link
 * copied after choosing New or Preloved opened on "All"). The five filters of
 * CatalogGrid as query parameters, so a shared link lands on the chosen group:
 *
 *   cond=new|preloved|sale   type=jewelry|watch|accessory   metal=<Hub stamp>
 *   stock=1 (same name as the search page)              sort=low|high
 *
 * A default removes its key, so a plain page keeps a plain URL; every other
 * parameter (lang…) is left untouched and in place. Pure: no React, no DOM.
 */
export type CatalogFilters = {
  cond: "all" | "new" | "preloved" | "sale";
  type: ItemType | null;
  metal: string | null;
  availOnly: boolean;
  sort: "newest" | "low" | "high";
};

export const DEFAULT_FILTERS: CatalogFilters = { cond: "all", type: null, metal: null, availOnly: false, sort: "newest" };

const KEYS = ["cond", "type", "metal", "stock", "sort"] as const;

/** Reads a query string (with or without "?"); an unknown or invalid value is that filter's default. Never throws. */
export function parseCatalogFilters(search: string, allowed: { types: ItemType[]; metals: string[] }): CatalogFilters {
  const f = { ...DEFAULT_FILTERS };
  let q: URLSearchParams;
  try { q = new URLSearchParams(search); } catch { return f; }
  const cond = q.get("cond");
  if (cond === "new" || cond === "preloved" || cond === "sale") f.cond = cond;
  const type = q.get("type")?.toLowerCase();
  if (type) f.type = allowed.types.find((t) => t.toLowerCase() === type) ?? null;
  const metal = q.get("metal")?.toUpperCase();
  if (metal) f.metal = allowed.metals.find((m) => m.toUpperCase() === metal) ?? null;
  f.availOnly = q.get("stock") === "1";
  const sort = q.get("sort");
  if (sort === "low" || sort === "high") f.sort = sort;
  return f;
}

/** The new query string: only the five keys are set or removed. "" when nothing remains, else "?a=b&c=d". */
export function catalogFiltersToSearch(current: string, f: CatalogFilters): string {
  let q: URLSearchParams;
  try { q = new URLSearchParams(current); } catch { q = new URLSearchParams(); }
  const want: Record<(typeof KEYS)[number], string | null> = {
    cond: f.cond === "all" ? null : f.cond,
    type: f.type ? f.type.toLowerCase() : null,
    metal: f.metal || null,
    stock: f.availOnly ? "1" : null,
    sort: f.sort === "newest" ? null : f.sort,
  };
  // set() keeps an existing key where it stands; a new one is appended.
  for (const k of KEYS) { const v = want[k]; if (v == null) q.delete(k); else q.set(k, v); }
  const s = q.toString();
  return s ? `?${s}` : "";
}
