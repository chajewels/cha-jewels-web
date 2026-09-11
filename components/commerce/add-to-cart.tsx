"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addToCart } from "@/lib/cart-actions";
import { tr, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

/**
 * Add to cart. Quantity is fixed at 1: these are one-of-a-kind pieces, and the
 * cart clamps to stock anyway. Disabled outright when nothing is on the shelf,
 * so the shopper never gets as far as a 409 at checkout.
 */
export function AddToCart({ variantId, slug, stockQty, lang, className }: {
  variantId: string; slug: string; stockQty: number; lang: Lang; className?: string;
}) {
  const t = tr(lang);
  const [pending, start] = useTransition();
  const [added, setAdded] = useState(false);
  const soldOut = stockQty <= 0;

  if (soldOut) {
    return (
      <p className={className}>
        <Button disabled className="w-full sm:w-auto">{t("cart", "soldOut")}</Button>
      </p>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={pending}
          onClick={() => start(async () => { await addToCart(variantId, slug, 1); setAdded(true); })}
          className="w-full sm:w-auto"
        >
          {added ? t("cart", "added") : t("cart", "add")}
        </Button>
        {added && (
          <Link href="/cart" className="text-sm text-gold-pale underline underline-offset-4">
            {t("cart", "viewCart")}
          </Link>
        )}
      </div>
    </div>
  );
}
