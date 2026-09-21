import { formatMoney, cn } from "@/lib/utils";
import { tr, type Lang } from "@/lib/i18n";
/**
 * Full price + the standard 30% reservation line. Presentational; the binding
 * figure comes from layaway_quote.
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
 * Both tokens here are measured on charcoal-deep, not on the page: gold-pale
 * 10.62:1 and chalk/75 8.73:1, from the Phase 3 table.
 */
export function PriceBlock({ price, lang, className }: { price: number; lang: Lang; className?: string }) {
  const t = tr(lang);
  return (
    <div className={cn("band-dark bg-charcoal-deep p-5", className)}>
      <p className="font-display text-4xl text-gold-pale">{formatMoney(price)}</p>
      <p className="mt-1 text-sm text-chalk/75">{t("product", "orReserve", { dp: formatMoney(Math.round(price * 0.3)) })}</p>
    </div>
  );
}
