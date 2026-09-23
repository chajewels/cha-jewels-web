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
 * THE TWO STATES (owner decision 2026-09-23):
 *
 *   available   there is stock. Today's behaviour, unchanged.
 *   sold        no stock. Reads "Sold" (JA 売約済み). Nothing invites a purchase.
 *
 * There is no "reserved" state. It existed until 2026-09-23 on the reasoning
 * that a listed piece at zero stock is probably being held by someone else's
 * layaway, and might come back. The owner decided otherwise: every out-of-stock
 * piece reads Sold, never Reserved. `stock_qty` does not say WHY a piece is at
 * zero (supabase/contracts/api.md), and the customer does not need to know —
 * they cannot buy it either way.
 */
export type Availability = "available" | "sold";

/** The variant a page is showing. Used by the buy buttons and the cart. */
export function variantAvailability(variant: Pick<ProductVariant, "stock_qty"> | null | undefined, status?: Product["status"]): Availability {
  if (status === "archived") return "sold";
  if (!variant || !Number.isFinite(variant.stock_qty) || variant.stock_qty <= 0) return "sold";
  return "available";
}

/**
 * The whole piece, for a card that shows no particular variant.
 *
 * A product with NO variants at all is `sold`, not `available`: it is a row
 * with nothing to sell, and offering a button that adds nothing to a basket is
 * worse than saying the piece cannot be had.
 */
export function productAvailability(product: Pick<Product, "status" | "product_variants">): Availability {
  if (product.status === "archived") return "sold";
  const variants = product.product_variants ?? [];
  if (variants.length === 0) return "sold";
  return variants.some((v) => Number.isFinite(v.stock_qty) && v.stock_qty > 0) ? "available" : "sold";
}

/** Nothing may be added to a basket, reserved, or financed in these states. */
export const isBuyable = (a: Availability) => a === "available";

/**
 * The dictionary key under `product` for the word shown to a customer. Every
 * state that is not buyable reads "sold"; the argument stays so a future state
 * with its own word is added here and nowhere else.
 */
export const availabilityKey = (a: Availability): "sold" => {
  void a;
  return "sold";
};
