import { isFigure } from "@/lib/utils";

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
