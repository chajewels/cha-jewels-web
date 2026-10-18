import { isFigure } from "@/lib/utils";
import { fromVariant } from "@/lib/product-facts";
import { isBuyable, productAvailability } from "@/lib/availability";
import type { Product } from "@/lib/types";

/**
 * THE SALE STRIKE (owner decisions 2026-10-15). On a sale the Hub sends the
 * sale price AS `price_jpy`, plus `full_price_jpy` (the regular price) and
 * `on_sale: true` on the variant. This decides one thing: which figure, if
 * any, is shown struck beside the price — the Hub's `full_price_jpy`, exactly
 * as sent. Nothing here is derived: no "% off", no difference
 * (scripts/check-money.mjs).
 *
 * D2-5 (revised 2026-10-15): a strike means a sale and only a sale — the Hub's
 * full_price_jpy struck beside the sale price. A sold piece is muted
 * (opacity/colour), never struck.
 */
export function struckFullPrice({ full, onSale, sold }: { full?: number | null; onSale?: boolean; sold?: boolean }): number | null {
  return onSale === true && !sold && isFigure(full) ? full : null;
}

/**
 * IS THIS PIECE IN THE SALE GRID? (owner decisions 2026-10-18). One answer for
 * the grid's Sale chip (components/catalog/catalog-section.tsx), the /sale page
 * and the header's Sale link, so the three can never disagree: the variant the
 * card prices (`fromVariant`) carries a struck full price — on sale, a Hub
 * full_price_jpy, and the piece not sold.
 */
export function saleListed(p: Product): boolean {
  const v = fromVariant(p);
  const sold = !isBuyable(productAvailability(p));
  return struckFullPrice({ full: v?.full_price_jpy, onSale: v?.on_sale, sold }) != null;
}
