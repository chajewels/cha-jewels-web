"use server";

import { revalidatePath } from "next/cache";
import { readCart, writeCart, type CartLine } from "@/lib/cart";

/**
 * Cart mutations. Server Actions rather than a route handler: cookies can only
 * be written from an action or a handler, and an action keeps the client
 * components free of fetch plumbing.
 *
 * Quantity is clamped here as well as in the cart reader, because these are the
 * only two places a number reaches the cookie.
 */
const MAX_QTY = 20;

function merge(lines: CartLine[], add: CartLine): CartLine[] {
  const existing = lines.find((l) => l.v === add.v);
  if (!existing) return [...lines, add];
  return lines.map((l) =>
    l.v === add.v ? { ...l, q: Math.min(l.q + add.q, MAX_QTY) } : l,
  );
}

export async function addToCart(variantId: string, slug: string, qty = 1) {
  const clean = Math.max(1, Math.min(Math.floor(qty) || 1, MAX_QTY));
  if (!variantId || !slug) return;
  await writeCart(merge(await readCart(), { v: variantId, s: slug, q: clean }));
  revalidatePath("/cart");
}

export async function setCartQty(variantId: string, qty: number) {
  const clean = Math.max(0, Math.min(Math.floor(qty) || 0, MAX_QTY));
  const lines = await readCart();
  await writeCart(
    clean === 0
      ? lines.filter((l) => l.v !== variantId)
      : lines.map((l) => (l.v === variantId ? { ...l, q: clean } : l)),
  );
  revalidatePath("/cart");
}

export async function removeFromCart(variantId: string) {
  await writeCart((await readCart()).filter((l) => l.v !== variantId));
  revalidatePath("/cart");
}

export async function clearCart() {
  await writeCart([]);
  revalidatePath("/cart");
}
