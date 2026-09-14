import { track } from "@vercel/analytics";

/**
 * The single door to the analytics provider. Every call site goes through the
 * helpers here, so swapping Vercel for something else is one file.
 *
 * WHAT THIS MEASURES, AND WHAT IT DELIBERATELY DOES NOT
 * ----------------------------------------------------
 * The browser is only trusted for what the browser can actually see: a product
 * was looked at, and a cart addition resolved. It is NOT the source of truth for
 * orders or payments. A click on "pay" is not `create_web_order_atomic`
 * succeeding, and it is certainly not a CSR confirming a bank transfer days
 * later. Those come from the Hub — see docs/measurement-log.md.
 *
 * There is no per-visitor join between the two sides and none is implied: these
 * events carry no order reference, because a visitor browsing products does not
 * have one yet. The two sides are read as aggregates side by side.
 *
 * PROPERTY BUDGET — Vercel Pro allows TWO custom properties per event. Both
 * events spend them on `sku` and `lang`. Adding a third silently costs money
 * (Web Analytics Plus), so it is an owner decision, not a code decision.
 */

/** Vercel Pro's ceiling. Exported so the guard below can be asserted in a test. */
export const MAX_EVENT_PROPERTIES = 2;

type EventProps = { sku: string; lang: string };

/**
 * Whether this browser should emit at all.
 *
 * Excluded, and each for its own reason:
 *  - anything that is not a Vercel *production* deployment (previews would
 *    pollute the baseline with our own clicks),
 *  - fixture mode, which renders invented products whose SKUs are not real,
 *  - localhost, which covers `next dev`, `next start` and any tunnel to it.
 *
 * Read at call time rather than module load: `window` does not exist while the
 * module is being evaluated on the server.
 */
export function analyticsEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_VERCEL_ENV !== "production") return false;
  if (process.env.NEXT_PUBLIC_PREVIEW_FIXTURES === "1") return false;
  if (typeof window === "undefined") return false;
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1" || h === "::1" || h.endsWith(".local")) return false;
  return true;
}

/**
 * Fire and forget. Analytics must never throw into a render, block an
 * interaction, or interrupt shopping, so every failure is swallowed here —
 * a missing script, a blocked request, an ad blocker, a provider outage.
 * There is no user-visible consequence of analytics failing, ever.
 */
function emit(name: string, props: EventProps): void {
  if (!analyticsEnabled()) return;
  try {
    track(name, { sku: props.sku, lang: props.lang });
  } catch {
    // Intentionally silent. See above.
  }
}

/**
 * Product views already counted in this JavaScript context.
 *
 * Module scope, not component state, so one entry survives everything that
 * would otherwise double-count: React re-renders, Strict Mode's deliberate
 * double-invocation of effects in development, a remount, client-side
 * navigation away and back, and the language toggle (which is a navigation to
 * the same path with `?lang=`, in the same document).
 *
 * Keyed on SKU ALONE, not SKU+lang, on purpose: a shopper toggling to English
 * has not viewed a second product, and counting them twice would inflate every
 * bilingual visitor. The trade is that `lang` records the language the piece
 * was FIRST seen in, which is the honest reading of "the language they browsed
 * in" anyway.
 *
 * A full page reload clears this, and that is correct — a fresh document is a
 * fresh view.
 */
const viewedSkus = new Set<string>();

/** Test seam. Not used by application code. */
export function __resetViewedForTest(): void {
  viewedSkus.clear();
}

/** Product detail page, once per SKU per page-load session. */
export function trackProductView(sku: string, lang: string): void {
  if (!sku) return;
  if (viewedSkus.has(sku)) return;
  viewedSkus.add(sku);
  emit("product_view", { sku, lang });
}

/**
 * A cart addition that actually landed. Call this only after the server action
 * has resolved without throwing — never from the click handler itself, or the
 * number measures intent rather than additions.
 */
export function trackAddToCart(sku: string, lang: string): void {
  if (!sku) return;
  emit("add_to_cart", { sku, lang });
}
