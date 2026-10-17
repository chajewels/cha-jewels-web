/**
 * RECENTLY VIEWED (owner 2026-10-17): the pieces this browser opened, shown at
 * the foot of the product page (components/catalog/recently-viewed.tsx).
 *
 * One record in localStorage, `cj-viewed` = { v: 1, slugs: string[] }: most
 * recent first, no duplicates, at most 12. Slugs only — never a price, a name
 * or a photo — so nothing stored can go stale: every figure on the cards is
 * the Hub's fresh answer (app/api/recently-viewed/route.ts). Anything else
 * under the key reads as empty.
 *
 * First-party functional storage, not advertising: it is not behind the
 * advertising consent (lib/consent.ts covers only the Meta Pixel and the
 * Google Ads tag). Every storage access is caught: a private window, blocked
 * site data or a full quota costs the list, never the page.
 */

export const VIEWED_KEY = "cj-viewed";
export const VIEWED_MAX = 12;

type StorageLike = Pick<Storage, "getItem" | "setItem">;

/** A Hub slug as it appears in a product URL. */
export function isSlug(s: unknown): s is string {
  return typeof s === "string" && s.length > 0 && s.length <= 200 && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(s);
}

/** The stored slugs, most recent first, or [] for anything that is not exactly one record. Never throws. */
export function readViewed(store: StorageLike | null | undefined): string[] {
  let raw: string | null = null;
  try { raw = store?.getItem(VIEWED_KEY) ?? null; } catch { return []; }
  if (!raw) return [];
  let v: unknown;
  try { v = JSON.parse(raw); } catch { return []; }
  if (!v || typeof v !== "object") return [];
  const r = v as Record<string, unknown>;
  if (r.v !== 1 || !Array.isArray(r.slugs) || !r.slugs.every(isSlug)) return [];
  return [...new Set(r.slugs as string[])].slice(0, VIEWED_MAX);
}

/** Moves `slug` to the front, trims to 12, and returns the new list. A storage that refuses the write is ignored. */
export function recordViewed(store: StorageLike | null | undefined, slug: string): string[] {
  if (!isSlug(slug)) return readViewed(store);
  const slugs = [slug, ...readViewed(store).filter((s) => s !== slug)].slice(0, VIEWED_MAX);
  try { store?.setItem(VIEWED_KEY, JSON.stringify({ v: 1, slugs })); } catch { /* private window, quota: the list is lost, the page is not */ }
  return slugs;
}
