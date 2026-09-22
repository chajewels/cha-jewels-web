import type { Product, ProductVariant } from "@/lib/types";

/**
 * IS THIS PIECE BUYABLE? ONE ANSWER, ONE PLACE.
 *
 * Before 2026-09-22 five files each worked it out for themselves, from the same
 * `stock_qty`, and did not agree. A piece at zero stock was:
 *
 *   the product page   "Currently reserved", appended to the SKU line
 *   the product card   "Sold out", in a badge
 *   AddToCart          a disabled button reading "Sold out"
 *   ReserveWithLayaway absent — it returned null and left no trace
 *   the calculator     STILL RENDERED, inviting the shopper to reserve it
 *                      "with ¥45,000 and pay the rest monthly at 0% interest"
 *
 * So the same piece was reserved, sold out and financeable at once, depending
 * on where the shopper happened to be looking. That is not five bugs; it is one
 * missing definition, and this is the definition.
 *
 * THE THREE STATES:
 *
 *   available   there is stock. Today's behaviour, unchanged.
 *   reserved    listed, but not free — someone else is part-way through buying
 *               it. It may come back. Nothing invites a purchase.
 *   sold        gone. It is not coming back.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE HUB CANNOT YET TELL RESERVED FROM SOLD, AND THAT IS A GAP TO CLOSE.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `stock_qty` is one number and carries one fact: there is none on the shelf.
 * Nothing in the API says WHY — a piece held by an open layaway and a piece
 * that shipped last week look identical here (supabase/contracts/api.md).
 *
 * So `sold` is derived from the only other signal there is, `status`, and today
 * that signal almost never arrives: the Hub's catalog routes return active rows
 * and 404 the rest. In practice every out-of-stock piece reads RESERVED, which
 * is both the truthful reading — it is still listed, so it is being held — and
 * the kinder one, since it does not tell a shopper a piece is gone when it may
 * not be.
 *
 * The fix is a Hub field (a variant `availability`, or a reason on the zero).
 * Until it exists this function is where it plugs in, and `sold` is already
 * wired end to end so adding it is one line here and no line anywhere else.
 */
export type Availability = "available" | "reserved" | "sold";

/** The variant a page is showing. Used by the buy buttons and the cart. */
export function variantAvailability(variant: Pick<ProductVariant, "stock_qty"> | null | undefined, status?: Product["status"]): Availability {
  if (status === "archived") return "sold";
  if (!variant || !Number.isFinite(variant.stock_qty) || variant.stock_qty <= 0) return "reserved";
  return "available";
}

/**
 * The whole piece, for a card that shows no particular variant.
 *
 * A product with NO variants at all is `reserved`, not `available`: it is a row
 * with nothing to sell, and offering a button that adds nothing to a basket is
 * worse than saying the piece cannot be had right now.
 */
export function productAvailability(product: Pick<Product, "status" | "product_variants">): Availability {
  if (product.status === "archived") return "sold";
  const variants = product.product_variants ?? [];
  if (variants.length === 0) return "reserved";
  return variants.some((v) => Number.isFinite(v.stock_qty) && v.stock_qty > 0) ? "available" : "reserved";
}

/** Nothing may be added to a basket, reserved, or financed in these states. */
export const isBuyable = (a: Availability) => a === "available";

/** The dictionary key under `product` for the word shown to a customer. */
export const availabilityKey = (a: Availability) => (a === "sold" ? "sold" : "reserved") as "sold" | "reserved";
