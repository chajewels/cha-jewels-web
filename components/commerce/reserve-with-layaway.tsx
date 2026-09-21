"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/lib/cart-actions";
import { trackAddToCart } from "@/lib/analytics";
import { tr, type Lang } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

/**
 * "Reserve with layaway" on the product page.
 *
 * It adds the piece to the cart and sends the shopper to checkout with layaway
 * pre-selected, rather than opening a second checkout of its own. One basket,
 * one address step, one set of transfer instructions — the payment choice is a
 * step inside that flow, not a parallel route that would have to be kept in
 * step with it.
 *
 * Nothing is reserved by pressing this. The piece comes off the shelf only when
 * the plan is created at the end of checkout, so an abandoned basket never sits
 * on a one-of-a-kind piece.
 */
export function ReserveWithLayaway({ variantId, slug, sku, stockQty, lang, className }: {
  variantId: string; slug: string; sku: string; stockQty: number; lang: Lang; className?: string;
}) {
  const t = tr(lang);
  const router = useRouter();
  const [pending, start] = useTransition();

  if (stockQty <= 0) return null;

  return (
    <div className={className}>
      <Button
        variant="ghost-light"
        disabled={pending}
        className="w-full sm:w-auto"
        onClick={() => start(async () => {
          await addToCart(variantId, slug, 1);
          // Same event as the plain cart button: this is a cart addition that
          // landed. Telling the two intents apart would need a third property,
          // which Vercel Pro does not allow — see lib/analytics.ts.
          trackAddToCart(sku, lang);
          router.push("/checkout?mode=layaway");
        })}
      >
        {pending ? t("checkout", "reserving") : t("product", "reserveCta")}
      </Button>
      <p className="mt-2 text-xs text-charcoal/70">{t("product", "reserveNote")}</p>
    </div>
  );
}
