"use client";

import Script from "next/script";
import { PAIDY_WIDGET_SRC, paidyWidgetAttrs } from "@/lib/paidy-widget";
import { tr, type Lang } from "@/lib/i18n";

/**
 * Paidy's N-Pay promotional widget under the product price (owner decisions
 * W1–W5, 2026-10-03). Attributes and the ¥3,000 floor: lib/paidy-widget.ts.
 *
 *   W1  product page only, right under the price band
 *   W2  EN and JA alike (the widget's own text is Paidy's Japanese)
 *   W3  shown ONLY while the Hub's paidy_mode is 'on' — the PAGE decides that
 *       from hub.paidyWidget(); this component never asks
 *   W6  (owner 2026-10-03 22:01 / 22:04) the widget is NOT hidden from
 *       visitors abroad; the condition is printed right under it, EN and JA,
 *       on every product page — and the condition is WHO the customer is
 *       (lives in Japan: Japanese mobile number, Paidy's identity check,
 *       pays in Japan), never "a delivery address in Japan". The order page's
 *       Paidy button is separately refused by the Hub for any order without a
 *       complete Japanese address (paidy-rules.ts); the note is information,
 *       the Hub is the guard.
 *
 * The price is the page's — one variant per piece, rendered on the server —
 * so there is no pm:refresh here; a page with a changing price must call
 * `_paidy('pm:refresh')` after updating data-amount. The script comes from
 * cdn.paidy.com, loaded lazily so it never blocks the page.
 */
export function PaidyWidget({ amountJpy, lang, className = "" }: { amountJpy: number; lang: Lang; className?: string }) {
  const attrs = paidyWidgetAttrs(amountJpy);
  if (!attrs) return null;
  const t = tr(lang);
  return (
    <div className={className} data-testid="paidy-widget">
      <div {...attrs} />
      <p className="mt-1 text-[12px] leading-snug text-charcoal/70 [:lang(ja)_&]:text-[12px]" data-testid="paidy-widget-note">
        {t("paidy", "widgetNote")}
      </p>
      <Script src={PAIDY_WIDGET_SRC} strategy="lazyOnload" />
    </div>
  );
}
