"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { addToCart } from "@/lib/cart-actions";
import { tr, type Lang } from "@/lib/i18n";
import { trackAddToCart } from "@/lib/analytics";
import { availabilityKey, isBuyable, type Availability } from "@/lib/availability";
import { Button } from "@/components/ui/button";
import { CART_ADDED } from "@/components/fx/cart-bump";
import { ComponentStyle } from "@/components/fx/component-style";

/**
 * Add to cart. Quantity is fixed at 1: these are one-of-a-kind pieces, and the
 * cart clamps to stock anyway. Disabled outright when nothing is on the shelf,
 * so the shopper never gets as far as a 409 at checkout.
 *
 * CONFIRMED, THEN CELEBRATED. Only once the Server Action has returned does
 * the button morph (charcoal, gold check drawing in, "Added to cart") and the
 * header bag bump once (components/fx/cart-bump.tsx). A failed add throws
 * before either happens, so nothing ever confirms an add that did not happen.
 */
/**
 * The confirmation's rules, inline (components/fx/component-style.tsx says why):
 * charcoal-deep with gold-pale text (10.62:1, the price block's own pair) and
 * a check that draws itself. Reduced motion: the state changes, nothing draws.
 */
const CSS = `
.fx-added { background-color: var(--c-charcoal-deep) !important; border-color: var(--c-charcoal-deep) !important; color: var(--c-gold-pale) !important; }
.fx-check path { stroke-dasharray: 1; stroke-dashoffset: 1; animation: fx-draw-check var(--dur-draw) var(--ease-lux) var(--dur-micro) forwards; }
@keyframes fx-draw-check { to { stroke-dashoffset: 0; } }
@media (prefers-reduced-motion: reduce) { .fx-check path { stroke-dashoffset: 0; } }`;

export function AddToCart({ variantId, slug, sku, availability, lang, className }: {
  variantId: string; slug: string; sku: string; availability: Availability; lang: Lang; className?: string;
}) {
  const t = tr(lang);
  const [pending, start] = useTransition();
  const [added, setAdded] = useState(false);

  // THE BUTTON SAYS WHAT THE BADGE SAYS. It read "Sold out" from its own
  // `stockQty <= 0` while the page's badge said "Currently reserved" about the
  // same piece. It takes the decided status now (lib/availability.ts) rather
  // than a number it has to interpret.
  //
  // AND A SOLD PIECE HAS NO BUTTON AT ALL. A disabled <Button> at 70% opacity
  // still looked like an orange call to action, pressed in under a finger and
  // took a hover colour. It is a statement now: a muted label in the button's
  // footprint (so the column does not jump), chalk with a hairline edge and
  // charcoal/70 text (4.9:1, scripts/check-contrast.mjs), default cursor, not
  // focusable, nothing on hover or press. Screen readers read the word.
  if (!isBuyable(availability)) {
    return (
      <p className={className}>
        <span className="inline-flex min-h-12 w-full cursor-default select-none items-center justify-center gap-2 rounded-sm border border-hairline bg-chalk px-6 py-3 text-[15px] tracking-wide text-charcoal/70 sm:w-auto">
          {t("product", availabilityKey(availability))}
        </span>
      </p>
    );
  }

  return (
    <div className={className}>
      <ComponentStyle id="fx-add-to-cart" css={CSS} />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          disabled={pending}
          onClick={() => start(async () => {
            await addToCart(variantId, slug, 1);
            setAdded(true);
            window.dispatchEvent(new Event(CART_ADDED));
            trackAddToCart(sku, lang);
          })}
          className={`w-full sm:w-auto ${added ? "fx-added" : ""}`}
        >
          {added && (
            <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 fx-check`} fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          {added ? t("cart", "added") : t("cart", "add")}
        </Button>
        {added && (
          <Link href="/cart" className="text-sm text-gold-dark underline underline-offset-4">
            {t("cart", "viewCart")}
          </Link>
        )}
      </div>
    </div>
  );
}
