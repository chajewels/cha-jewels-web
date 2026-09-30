import type { CheckoutMode } from "@/lib/types";

/**
 * "sign" is not a numbered step and is not in the stepper — see CheckoutFlow.
 */
export type CheckoutStep = 1 | 2 | 3 | "sign" | 4;

/**
 * WHERE CHECKOUT OPENS, and with what, for the `?quote=` return.
 *
 * Pure, so the rule is tested rather than trusted (no imports but types: the
 * unit test loads it under node --experimental-strip-types).
 *
 * - A rehydrated LAYAWAY quote lands on the signing step — always, signed or
 *   not (owner decision 2026-09-19): the customer has just come back from the
 *   agreement, and the signing step's "I have signed" carries them on.
 * - A rehydrated full-payment quote has nothing to sign and lands on Review
 *   (step 4 since the four-step checkout, D3-1: Details → Delivery → Payment
 *   → Review).
 * - No quote: the beginning.
 *
 * NOTHING LAYAWAY-RELATED ON THE JAPANESE SITE (owner decision 2026-09-25). A
 * customer who started layaway in English, opened the agreement in the same
 * tab and came back with the site in Japanese still carries a layaway quote in
 * `?quote=`. When layaway is not offered for the current language that quote
 * is dropped, with its signature, and checkout opens exactly like a fresh one:
 * Step 1, no quote, no agreement. The cart is not this function's business and
 * is untouched.
 */
export function initialCheckoutState<Q extends { mode?: CheckoutMode }, A>(
  quote: Q | null,
  agreement: A | null,
  layawayOk: boolean,
): { step: CheckoutStep; quote: Q | null; agreement: A | null } {
  if (!quote) return { step: 1, quote: null, agreement };
  if (quote.mode === "layaway") {
    if (!layawayOk) return { step: 1, quote: null, agreement: null };
    return { step: "sign", quote, agreement };
  }
  return { step: 4, quote, agreement };
}
