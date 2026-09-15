import "server-only";
import { cookies } from "next/headers";
import { getProductBySlug, primaryImage } from "@/lib/queries/products";
import type { Product, ProductVariant } from "@/lib/types";

/**
 * The cart lives in a cookie, not a database row.
 *
 * Why: a shopper can fill a cart before signing in, and a server component has
 * to be able to read it to render /cart and /checkout. A cookie satisfies both
 * without giving anonymous visitors a table to write to.
 *
 * What is stored is deliberately minimal — variant id, product slug, quantity.
 * Prices and stock are NEVER stored: they are re-read from the Hub on every
 * render, so a price change or a sold-out piece shows up immediately instead of
 * being frozen into the cookie at add-to-cart time. The Hub re-prices again at
 * /checkout/quote and once more inside create_web_order_atomic, so the cookie
 * is never trusted for money.
 */
export const CART_COOKIE = "cj-cart";
const MAX_LINES = 20;
/** A year. The cookie holds no personal data — just what someone was browsing. */
const MAX_AGE = 60 * 60 * 24 * 365;

export type CartLine = { v: string; s: string; q: number };

/** A cart line joined to live product data, ready to render. */
export type CartItem = {
  variant_id: string;
  slug: string;
  qty: number;
  /** English name; `name_ja` is the Hub-generated Japanese, null until generated. Pick via lib/catalog-i18n. */
  name: string;
  name_ja: string | null;
  sku: string;
  size: string | null;
  stone: string | null;
  unit_price_jpy: number;
  line_total_jpy: number;
  stock_qty: number;
  image: { url: string; alt: string | null } | null;
};

function parse(raw: string | undefined): CartLine[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((l): CartLine | null => {
        const v = typeof l?.v === "string" ? l.v : "";
        const s = typeof l?.s === "string" ? l.s : "";
        const q = Math.floor(Number(l?.q));
        return v && s && Number.isFinite(q) && q > 0 ? { v, s, q } : null;
      })
      .filter((l): l is CartLine => l !== null)
      .slice(0, MAX_LINES);
  } catch {
    // A malformed cookie is an empty cart, never a crash.
    return [];
  }
}

export async function readCart(): Promise<CartLine[]> {
  return parse((await cookies()).get(CART_COOKIE)?.value);
}

/** Only callable from a Server Action or Route Handler — Next forbids writing cookies during render. */
export async function writeCart(lines: CartLine[]) {
  const jar = await cookies();
  const kept = lines.filter((l) => l.q > 0).slice(0, MAX_LINES);
  if (kept.length === 0) {
    jar.delete(CART_COOKIE);
    return;
  }
  jar.set(CART_COOKIE, JSON.stringify(kept), {
    path: "/",
    maxAge: MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function cartCount(): Promise<number> {
  return (await readCart()).reduce((n, l) => n + l.q, 0);
}

function findVariant(product: Product, variantId: string): ProductVariant | undefined {
  return product.product_variants.find((v) => v.id === variantId);
}

/**
 * Joins the cookie to live catalogue data. A line whose product or variant has
 * gone away is dropped rather than rendered as a blank row — the caller is told
 * how many disappeared so it can say so.
 */
export async function hydrateCart(lines: CartLine[]): Promise<{ items: CartItem[]; dropped: number }> {
  const products = await Promise.all(
    [...new Set(lines.map((l) => l.s))].map(async (slug) => [slug, await getProductBySlug(slug)] as const),
  );
  const bySlug = new Map(products);

  const items: CartItem[] = [];
  let dropped = 0;
  for (const line of lines) {
    const product = bySlug.get(line.s) ?? null;
    const variant = product ? findVariant(product, line.v) : undefined;
    if (!product || !variant) {
      dropped++;
      continue;
    }
    const img = primaryImage(product);
    // Never offer more than is on the shelf, even if the cookie says otherwise.
    const qty = Math.max(1, Math.min(line.q, Math.max(variant.stock_qty, 0) || line.q));
    items.push({
      variant_id: variant.id,
      slug: product.slug,
      qty,
      name: product.name_en ?? product.name,
      name_ja: product.name_ja ?? null,
      sku: product.sku,
      size: variant.size,
      stone: variant.stone,
      unit_price_jpy: variant.price_jpy,
      line_total_jpy: variant.price_jpy * qty,
      stock_qty: variant.stock_qty,
      image: img ? { url: img.url, alt: img.alt } : null,
    });
  }
  return { items, dropped };
}

export const cartSubtotal = (items: CartItem[]) => items.reduce((n, i) => n + i.line_total_jpy, 0);
