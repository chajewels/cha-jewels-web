"use client";

import Script from "next/script";
import { PAIDY_WIDGET_SRC, paidyWidgetAttrs } from "@/lib/paidy-widget";

/**
 * Paidy's N-Pay promotional widget under the product price (owner decisions
 * W1–W5, 2026-10-03). Attributes and the ¥3,000 floor: lib/paidy-widget.ts.
 *
 *   W1  product page only, right under the price band
 *   W2  EN and JA alike (the widget's own text is Paidy's Japanese)
 *   W3  shown ONLY while the Hub's paidy_mode is 'on' — the PAGE decides that
 *       from hub.paidyWidget(); this component never asks
 *
 * The price is the page's — one variant per piece, rendered on the server —
 * so there is no pm:refresh here; a page with a changing price must call
 * `_paidy('pm:refresh')` after updating data-amount. The script comes from
 * cdn.paidy.com, loaded lazily so it never blocks the page.
 */
export function PaidyWidget({ amountJpy, className = "" }: { amountJpy: number; className?: string }) {
  const attrs = paidyWidgetAttrs(amountJpy);
  if (!attrs) return null;
  return (
    <div className={className} data-testid="paidy-widget">
      <div {...attrs} />
      <Script src={PAIDY_WIDGET_SRC} strategy="lazyOnload" />
    </div>
  );
}
