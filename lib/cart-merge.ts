import type { CartLine } from "@/lib/cart";
import type { HubCartLine } from "@/lib/types";

/**
 * Pure rules for the saved cart (cart reminders, Hub docs/CART-REMINDERS.md).
 * No cookies, no network — tests/cart-merge.test.mjs imports this directly.
 *
 * The browser cookie is the cart. The Hub holds a copy for a signed-in
 * customer so a reminder email can list the pieces and so the cart can be
 * restored on another device. The two are reconciled in exactly one way:
 */
export const MAX_CART_LINES = 20;
const MAX_QTY = 20;

const clampQty = (q: number) => Math.max(1, Math.min(Math.floor(q) || 1, MAX_QTY));

/**
 * UNION, larger quantity wins, the cookie's order first, capped at 20 lines.
 * Used at sign-in (cookie ∪ saved) and by /cart/restore. A line the Hub no
 * longer knows (no slug) is skipped — it cannot be rendered anyway.
 */
export function mergeCartLines(cookie: CartLine[], saved: HubCartLine[]): CartLine[] {
  const out: CartLine[] = [];
  const byVariant = new Map<string, CartLine>();
  for (const l of cookie) {
    if (!l.v || !l.s) continue;
    const prev = byVariant.get(l.v);
    if (prev) { prev.q = Math.max(prev.q, clampQty(l.q)); continue; }
    const line = { v: l.v, s: l.s, q: clampQty(l.q) };
    byVariant.set(l.v, line);
    out.push(line);
  }
  for (const l of saved) {
    if (!l.variant_id || !l.slug) continue;
    const prev = byVariant.get(l.variant_id);
    if (prev) { prev.q = Math.max(prev.q, clampQty(l.qty)); continue; }
    const line = { v: l.variant_id, s: l.slug, q: clampQty(l.qty) };
    byVariant.set(l.variant_id, line);
    out.push(line);
  }
  return out.slice(0, MAX_CART_LINES);
}

/** The cookie lines in the shape `PUT /me/cart` takes. */
export function toHubLines(lines: CartLine[]): { variant_id: string; qty: number; slug: string }[] {
  return lines.filter((l) => l.v && l.s && l.q > 0).slice(0, MAX_CART_LINES)
    .map((l) => ({ variant_id: l.v, qty: clampQty(l.q), slug: l.s }));
}

/** True when the merge would change what the cookie holds (so a no-op sign-in writes nothing). */
export function sameLines(a: CartLine[], b: CartLine[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((l, i) => l.v === b[i].v && l.s === b[i].s && l.q === b[i].q);
}
