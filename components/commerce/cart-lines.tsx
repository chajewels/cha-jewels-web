"use client";

import { Trash2 } from "lucide-react";
import { localePath } from "@/lib/locale";
import { availabilityKey, isBuyable, variantAvailability } from "@/lib/availability";
import Link from "next/link";
import { useTransition } from "react";
import { removeFromCart, setCartQty } from "@/lib/cart-actions";
import { formatMoney, formatWeight } from "@/lib/utils";
import { type Lang } from "@/lib/i18n-core";
import { trOf } from "@/lib/i18n-client";
import { cart as cartDict } from "@/lib/i18n/sections/cart";
import { collection as collectionDict } from "@/lib/i18n/sections/collection";
import { product as productDict } from "@/lib/i18n/sections/product";
import type { CartItem } from "@/lib/cart";
import { cartItemName } from "@/lib/catalog-i18n";
import { metalsLabel } from "@/lib/metals";
import { inputLight } from "@/lib/form-classes";
import { PieceWell } from "@/components/commerce/commerce-ui";

/**
 * THE CART LINES (build step 3; comp page-comps/cart-checkout "Cart"). Per
 * piece, one white card:
 *
 *   well    the product card's picture in a 1:1 chalk well, never cropped (D3-12)
 *   body    the Preloved badge; the EXACT Hub name (serif 18px, not display
 *           size); the spec line `metal · weight · stone` exactly as the Hub
 *           sends them (D3-13), SKU as a caption; then the status, the
 *           one-of-a-kind note or the quantity
 *   side    the yen price in lining figures, and Remove as a 44px target
 *           (audit: it measured 16px tall)
 */
export function CartLines({ items, lang }: { items: CartItem[]; lang: Lang }) {
  const t = trOf({ cart: cartDict, collection: collectionDict, product: productDict }, lang);
  const [pending, start] = useTransition();

  return (
    <ul className="icm-lines" aria-busy={pending}>
      {items.map((item) => {
        // A one-of-a-kind piece has a single unit on the shelf; there is no
        // quantity decision to offer, so we state the fact instead.
        const oneOfAKind = item.stock_qty <= 1;
        // The SAME status the card and the product page show, from the same
        // function. A piece can go to zero while it sits in a basket; the Hub
        // re-prices and re-checks stock at /checkout/quote and again when the
        // order is created, so this is a warning, not the gate.
        const avail = variantAvailability({ stock_qty: item.stock_qty });
        const name = cartItemName(item, lang);
        const spec = [
          item.metals.length ? metalsLabel(item.metals, lang) : null,
          formatWeight(item.weight_g),
          item.stone?.trim() || null,
        ].filter((x): x is string => !!x);
        return (
          <li key={item.variant_id} className="icm-line lm-rise">
            <Link href={localePath(`/products/${item.slug}`, lang)} tabIndex={-1} aria-hidden="true" className="icm-line__well block">
              <PieceWell image={item.picture} alt={name} />
            </Link>
            <div className="min-w-0">
              {item.condition === "Preloved" && (
                <span className="inline-flex min-h-6 items-center rounded-full border border-hairline bg-chalk px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-charcoal/80 [:lang(ja)_&]:normal-case [:lang(ja)_&]:tracking-[0.04em]">
                  {t("collection", "filterPreloved")}
                </span>
              )}
              <Link href={localePath(`/products/${item.slug}`, lang)} className="mt-1.5 block font-display text-[15px] leading-[1.45] text-charcoal-deep [font-variant-numeric:lining-nums] hover:underline sm:mt-2 sm:text-[18px]">
                {name}
              </Link>
              {spec.length > 0 && (
                <p className="cj-fig mt-1.5 text-[13px] font-medium tracking-[0.04em] text-gold-dark">{spec.join(" · ")}</p>
              )}
              <p className="mt-1 text-xs text-charcoal/70">SKU {item.sku}{item.size ? ` · ${item.size}` : ""}</p>
              {!isBuyable(avail) ? (
                <p className="mt-2 text-[13px] font-medium text-garnet">{t("product", availabilityKey(avail))}</p>
              ) : oneOfAKind ? (
                <p className="mt-2.5 inline-flex items-center gap-2 text-[13px] text-charcoal/75 before:h-1.5 before:w-1.5 before:rounded-full before:bg-gold">{t("cart", "oneOfAKind")}</p>
              ) : (
                <label className="mt-2 flex items-center gap-2 text-[13px] text-charcoal/75">
                  {t("cart", "qty")}
                  <select
                    className={`min-h-11 px-3 ${inputLight}`}
                    value={item.qty}
                    disabled={pending}
                    onChange={(e) => start(() => setCartQty(item.variant_id, Number(e.target.value)).then(() => undefined))}
                  >
                    {Array.from({ length: Math.min(item.stock_qty, 10) }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <div className="icm-line__side">
              <p className="cj-fig whitespace-nowrap font-display text-[20px] leading-tight text-charcoal-deep sm:text-[24px]">{formatMoney(item.line_total_jpy)}</p>
              <button
                type="button"
                disabled={pending}
                onClick={() => start(() => removeFromCart(item.variant_id).then(() => undefined))}
                aria-label={t("cart", "removeItem", { name })}
                className="inline-flex min-h-11 items-center gap-1.5 px-1 text-sm font-medium text-charcoal/80 underline underline-offset-4 hover:text-charcoal-deep sm:mt-1"
              >
                <Trash2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
                {t("cart", "remove")}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
