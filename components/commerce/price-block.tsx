import { formatMoney, type Region, cn } from "@/lib/utils";
import { tr, type Lang } from "@/lib/i18n";
/** Full price + the standard 30% reservation line. Presentational; the binding figure comes from layaway_quote. */
export function PriceBlock({ price, region, lang, className }: { price: number; region: Region; lang: Lang; className?: string }) {
  const t = tr(lang);
  return (
    <div className={cn("border-y border-rule py-4", className)}>
      <p className="font-display text-4xl text-gold-pale">{formatMoney(price, region)}</p>
      <p className="mt-1 text-sm text-champagne/70">{t("product", "orReserve", { dp: formatMoney(Math.round(price * 0.3), region) })}</p>
    </div>
  );
}
