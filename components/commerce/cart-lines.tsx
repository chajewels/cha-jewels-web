"use client";

import Image from "next/image";
import Link from "next/link";
import { useTransition } from "react";
import { removeFromCart, setCartQty } from "@/lib/cart-actions";
import { formatMoney } from "@/lib/utils";
import { tr, type Lang } from "@/lib/i18n";
import type { CartItem } from "@/lib/cart";
import { cartItemName } from "@/lib/catalog-i18n";

export function CartLines({ items, lang }: { items: CartItem[]; lang: Lang }) {
  const t = tr(lang);
  const [pending, start] = useTransition();

  return (
    <ul className="rule-grid grid gap-px" aria-busy={pending}>
      {items.map((item) => {
        // A one-of-a-kind piece has a single unit on the shelf; there is no
        // quantity decision to offer, so we state the fact instead.
        const oneOfAKind = item.stock_qty <= 1;
        const name = cartItemName(item, lang);
        return (
          <li key={item.variant_id} className="flex flex-wrap items-start gap-4 bg-velvet p-5">
            <div className="relative h-24 w-20 shrink-0 overflow-hidden border border-rule bg-velvet-deep">
              {item.image && (
                <Image src={item.image.url} alt={item.image.alt ?? name} fill sizes="80px" className="object-cover" />
              )}
            </div>
            <div className="min-w-[180px] flex-1">
              <Link href={`/products/${item.slug}`} className="font-display text-lg text-gold-pale hover:underline">
                {name}
              </Link>
              <p className="mt-1 text-xs text-champagne/55">
                SKU {item.sku}
                {item.size ? ` · ${item.size}` : ""}
                {item.stone ? ` · ${item.stone}` : ""}
              </p>
              {oneOfAKind ? (
                <p className="mt-2 text-xs text-champagne/55">{t("cart", "oneOfAKind")}</p>
              ) : (
                <label className="mt-2 flex items-center gap-2 text-xs text-champagne/70">
                  {t("cart", "qty")}
                  <select
                    className="border border-rule bg-velvet-deep px-2 py-1 text-champagne"
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
            <div className="text-right">
              <p className="font-display text-xl text-gold-pale">{formatMoney(item.line_total_jpy)}</p>
              <button
                type="button"
                disabled={pending}
                onClick={() => start(() => removeFromCart(item.variant_id).then(() => undefined))}
                className="mt-2 text-xs text-champagne/55 underline underline-offset-4 hover:text-champagne"
              >
                {t("cart", "remove")}
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
