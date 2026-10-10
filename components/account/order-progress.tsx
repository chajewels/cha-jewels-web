import { Check } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";
import { progressStep, type OrderDisplay } from "@/lib/order-display";
import { cn } from "@/lib/utils";

/**
 * THE ORDER'S STATUS LINE (build step 4; comp page-comps/account-signin
 * "Order detail"): reserved → piece confirmed → payment → payment received →
 * shipped. Every stage before the current one is ticked; the current one is
 * lit and shows its number, never a tick (progressStep). Where the order is, and what step 3 is called (transfer, Paidy or
 * card), is decided in lib/order-display.ts; `orderStage` moved there with the
 * payment lifecycle (S1) and is re-exported here for older imports.
 */
export { orderStage } from "@/lib/order-display";

export function OrderProgress({ lang, stage, stage3Key = "stagePayment", stage4Key = "stagePaid", stage5Key = "stageShipped", inProgress = false }: { lang: Lang; stage: 1 | 2 | 3 | 4 | 5; stage3Key?: OrderDisplay["stage3Key"]; stage4Key?: OrderDisplay["stage4Key"]; stage5Key?: OrderDisplay["stage5Key"]; inProgress?: boolean }) {
  const t = tr(lang);
  // Cash on delivery swaps steps 3–5 (shipped → pay on delivery → payment received): orderDisplay decides.
  const stages = [t("orders", "stageReserved"), t("orders", "stageConfirmed"), t("orders", stage3Key), t("orders", stage4Key), t("orders", stage5Key)];
  return (
    <ol aria-label={t("orders", "progress")} className="mb-6 grid grid-cols-5 border-t border-hairline">
      {stages.map((s, i) => {
        const n = i + 1;
        const { done, now, label } = progressStep(n, stage, inProgress);
        return (
          <li
            key={s}
            aria-current={now ? "step" : undefined}
            className={cn(
              "relative flex flex-col gap-1 pr-1 pt-3 text-[11px] font-medium leading-snug sm:flex-row sm:items-baseline sm:gap-2.5 sm:pr-3 sm:pt-4 sm:text-[13px]",
              now ? "text-charcoal-deep" : done ? "text-charcoal/80" : "text-charcoal/70",
            )}
          >
            <span aria-hidden="true" className={cn("absolute -top-px left-0 right-0 h-0.5", done ? "bg-gold-dark" : "bg-transparent")} />
            <span className="sr-only">{label ? t("orders", label, { stage: s }) : s}</span>
            <span aria-hidden="true" className={cn("cj-fig font-display text-[17px] leading-none sm:text-[20px]", done ? "text-gold-dark" : "text-charcoal/70")}>
              {done ? <Check className="inline h-4 w-4" strokeWidth={2} /> : n}
            </span>
            <span aria-hidden="true">{s}</span>
          </li>
        );
      })}
    </ol>
  );
}
