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
export function PriceBlock({ price, downPayment, lang, showReserve, sold = false, className }: {
  price: number;
  /** The variant's Hub figures; either may be absent (no rate, lookup failed). */
  downPayment: { jpy?: number | null; php?: number | null };
  lang: Lang;
  showReserve: boolean;
  /**
   * A sold piece keeps its price, muted (chalk/60, 5.9:1 — a fact customers
   * compare), and never struck through: a strike reads as a discount (D2-5).
   */
  sold?: boolean;
  className?: string;
}) {
  const t = tr(lang);
  const { jpy, php } = downPayment;
  // The sentence is the dictionary's; only the figure inside it is set in
  // Pale Gilt, so the split is around the {dp} slot, never a rewording.
  const [pre, post] = t("product", "orReserve", { dp: "\u0001" }).split("\u0001");
  return (
    <div className={cn("band-dark relative bg-charcoal-deep px-5 py-5 sm:px-6 sm:py-[22px]", className)}>
      {/* The gold rule on top (comp): the price card is a gilded band. */}
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgb(201_162_39/0),#C9A227_30%,#E8D28A_50%,#C9A227_70%,rgb(201_162_39/0))]" />
      <p className={cn("font-display text-[30px] leading-[1.1] [font-feature-settings:'lnum'_1,'tnum'_1] [font-variant-numeric:lining-nums_tabular-nums] sm:text-[38px]", sold ? "text-chalk/60" : "text-gold-pale")}>{formatMoney(price)}</p>
      {showReserve && !sold && isFigure(jpy) && isFigure(php) && (
        <p className="mt-2 text-sm leading-relaxed text-chalk/80 [font-variant-numeric:lining-nums_tabular-nums]">
          {pre}<b className="font-medium text-gold-pale">{formatYenPeso(jpy, php)}</b>{post}
        </p>
      )}
    </div>
  );
}
