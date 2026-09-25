import { formatMoney, formatYenPeso, isFigure, cn } from "@/lib/utils";
import { tr, type Lang } from "@/lib/i18n";
/**
 * Full price + the reservation line. Presentational: the reserve figures are
 * the Hub's (`down_payment_jpy` / `down_payment_php` on the variant, from
 * layaway_quote — for the piece alone, owner decision D1), shown as
 * "¥21,894 (₱8,699)" (D3). Nothing here computes a percentage or converts a
 * currency. If the Hub sent either figure short, the line is not rendered at
 * all — there is no fallback maths (scripts/check-money.mjs).
 *
 * THIS IS THE ONE DARK ELEMENT LEFT ON THE PRODUCT PAGE. The page around it
 * went light in Phase 4 Group B; the price did not. It is the figure the whole
 * page is built to deliver, and on a light page a charcoal number in a hairline
 * box reads as one more row of specification. Keeping the block dark makes it
 * the thing the eye lands on, and lets the price stay gold-pale — the gold that
 * works on charcoal and is 1.37:1 on chalk, so it could not have survived the
 * crossing any other way.
 *
 * `.band-dark` restores `--rule` to the gold hairline for this subtree, so any
 * divider drawn inside the block is the dark-surface one rather than the grey
 * the light page sets. See app/globals.css.
 *
 * THE RESERVE LINE IS THE CALLER'S DECISION (and then the Hub's figures'). It is an invitation to layaway,
 * so it renders only when `showReserve` is true: the piece is buyable
 * (lib/availability) AND layaway is offered in this language
 * (lib/layaway-availability — English only, owner rule). A sold piece, or any
 * Japanese page, shows the price alone.
 *
 * Both tokens here are measured on charcoal-deep, not on the page: gold-pale
 * 10.62:1 and chalk/75 8.73:1, from the Phase 3 table.
 */
export function PriceBlock({ price, downPayment, lang, showReserve, className }: {
  price: number;
  /** The variant's Hub figures; either may be absent (no rate, lookup failed). */
  downPayment: { jpy?: number | null; php?: number | null };
  lang: Lang;
  showReserve: boolean;
  className?: string;
}) {
  const t = tr(lang);
  const { jpy, php } = downPayment;
  return (
    <div className={cn("band-dark bg-charcoal-deep p-5", className)}>
      <p className="font-display text-4xl text-gold-pale">{formatMoney(price)}</p>
      {showReserve && isFigure(jpy) && isFigure(php) && <p className="mt-1 text-sm text-chalk/75">{t("product", "orReserve", { dp: formatYenPeso(jpy, php) })}</p>}
    </div>
  );
}
