import { formatMoney, cn } from "@/lib/utils";
import type { Lang } from "@/lib/i18n";
import { showroomCopy } from "@/lib/i18n-showroom";
/** The Hub calculator below owns all reservation amounts; do not duplicate its math here. */
export function PriceBlock({ price, lang, className }: { price: number; lang: Lang; className?: string }) {
  return (
    <div className={cn("border-y border-rule py-4", className)}>
      <p className="text-3xl tabular-nums text-gold-pale sm:text-4xl">{formatMoney(price)}</p>
      <a href="#layaway-quote" className="mt-2 inline-flex min-h-11 items-center text-sm text-gold-pale underline underline-offset-4">{showroomCopy[lang].layawayInfo}</a>
    </div>
  );
}
