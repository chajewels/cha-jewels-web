import type { ItemType } from "./types";

/**
 * THE CATALOG TOOLBAR IN THE ADDRESS BAR (owner report 2026-10-17: a link
 * copied after choosing New or Preloved opened on "All"). The filters of
 * CatalogGrid as query parameters, so a shared link lands on the chosen group:
 *
 *   cond=new,preloved,sale   type=jewelry,watch,accessory   metal=<Hub stamps>
 *   kind=<collection slugs>  brand=<Hub brands, exactly as written>
 *   stock=1 (same name as the search page)   sort=oldest|low|high
 *
 * MULTI-SELECT (owner 2026-10-27, compact toolbar): a group carries several
 * values, comma-separated (kind=rings,earrings&brand=Cartier,BVLGARI) — OR
 * within a group, AND across groups (CatalogGrid). A one-value link from
 * before (PR #381, kind=rings) reads as a one-value list. The value list is
 * split on the RAW commas before decoding, so a Hub brand that itself holds a
 * comma travels as %2C and stays one brand.
 *
 * A default removes its key, so a plain page keeps a plain URL; every other
 * parameter (lang…) is left untouched, as written, and in place. Pure: no
 * React, no DOM.
 */
export type CondValue = "new" | "preloved" | "sale";
export type CatalogFilters = {
  /** Nothing ticked = "All". */
  cond: CondValue[];
  type: ItemType[];
  /** Collection slugs from the pieces' `collection_slugs` (owner 2026-10-27). */
  kind: string[];
  /** `brand` values exactly as the Hub writes them (owner 2026-10-27). */
  brand: string[];
  metal: string[];
  availOnly: boolean;
  /** "newest" is the Hub's own list order; "oldest" is that order reversed. */
  sort: "newest" | "oldest" | "low" | "high";
};

export const DEFAULT_FILTERS: CatalogFilters = { cond: [], type: [], kind: [], brand: [], metal: [], availOnly: false, sort: "newest" };

const KEYS = ["cond", "type", "kind", "brand", "metal", "stock", "sort"] as const;
type Key = (typeof KEYS)[number];
const isKey = (k: string): k is Key => (KEYS as readonly string[]).includes(k);
const CONDS: CondValue[] = ["new", "preloved", "sale"];

/** application/x-www-form-urlencoded as URLSearchParams writes it (space → "+"); "," inside a value is always escaped. */
const enc = (s: string) => encodeURIComponent(s).replace(/%20/g, "+");
const dec = (s: string) => { try { return decodeURIComponent(s.replace(/\+/g, " ")); } catch { return null; } };

/** The query as segments, in order: the decoded key, the RAW value, and the segment exactly as written. */
function segments(search: string): { key: string; raw: string; text: string }[] {
  const s = search.startsWith("?") ? search.slice(1) : search;
  return s.split("&").filter(Boolean).map((text) => {
    const i = text.indexOf("=");
    return { key: dec(i < 0 ? text : text.slice(0, i)) ?? "", raw: i < 0 ? "" : text.slice(i + 1), text };
  });
}

/**
 * The values of one key, each matched to the page's own options by `same`;
 * unknown values and repeats dropped, in the order the link gives them. A part
 * that does not match whole is tried split on decoded commas too, so a list
 * whose commas were escaped on the way (kind=rings%2Cearrings) still opens.
 */
function list<T extends string>(raws: string[], options: readonly T[], same: (option: T, value: string) => boolean): T[] {
  const out: T[] = [];
  const take = (v: string) => { const hit = options.find((o) => same(o, v)); if (hit && !out.includes(hit)) out.push(hit); return !!hit; };
  for (const r of raws) for (const part of r.split(",")) {
    const v = dec(part)?.trim();
    if (!v) continue;
    if (!take(v) && v.includes(",")) v.split(",").map((x) => x.trim()).filter(Boolean).forEach(take);
  }
  return out;
}

const anyCase = (o: string, v: string) => o.toLowerCase() === v.toLowerCase();

/**
 * Reads a query string (with or without "?"); an unknown or invalid value is ignored. Never throws.
 * `allowed` is the page's own options: a type, kind, brand or metal the page does not show is ignored. A type,
 * kind (a slug) and metal match in any case; a brand matches only exactly, so two spellings stay two brands.
 */
export function parseCatalogFilters(search: string, allowed: { types: ItemType[]; metals: string[]; kinds?: string[]; brands?: string[] }): CatalogFilters {
  const f: CatalogFilters = { ...DEFAULT_FILTERS };
  let segs: ReturnType<typeof segments>;
  try { segs = segments(search); } catch { return f; }
  const raws = (k: Key) => segs.filter((s) => s.key === k).map((s) => s.raw);
  const first = (k: Key) => { const r = raws(k)[0]; return r === undefined ? null : dec(r); };
  f.cond = list(raws("cond"), CONDS, (o, v) => o === v);
  f.type = list(raws("type"), allowed.types, anyCase);
  f.kind = list(raws("kind"), allowed.kinds ?? [], anyCase);
  f.brand = list(raws("brand"), allowed.brands ?? [], (o, v) => o === v);
  f.metal = list(raws("metal"), allowed.metals, anyCase);
  f.availOnly = first("stock") === "1";
  const sort = first("sort");
  if (sort === "oldest" || sort === "low" || sort === "high") f.sort = sort;
  return f;
}

/** The new query string: only the filter keys are set or removed. "" when nothing remains, else "?a=b&c=d". */
export function catalogFiltersToSearch(current: string, f: CatalogFilters): string {
  let segs: ReturnType<typeof segments>;
  try { segs = segments(current); } catch { segs = []; }
  const csv = (vs: string[]) => (vs.length ? vs.map(enc).join(",") : null);
  const want: Record<Key, string | null> = {
    cond: csv(f.cond),
    type: csv(f.type.map((t) => t.toLowerCase())),
    kind: csv(f.kind),
    brand: csv(f.brand),
    metal: csv(f.metal),
    stock: f.availOnly ? "1" : null,
    sort: f.sort === "newest" ? null : f.sort,
  };
  // A filter key already present keeps its place (its first occurrence); a new one is appended.
  const out: string[] = [];
  const placed = new Set<Key>();
  for (const s of segs) {
    if (!isKey(s.key)) { out.push(s.text); continue; }
    if (placed.has(s.key)) continue;
    placed.add(s.key);
    const w = want[s.key];
    if (w != null) out.push(`${s.key}=${w}`);
  }
  for (const k of KEYS) if (!placed.has(k) && want[k] != null) out.push(`${k}=${want[k]}`);
  return out.length ? `?${out.join("&")}` : "";
}
