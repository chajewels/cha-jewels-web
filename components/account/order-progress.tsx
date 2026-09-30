import { Check } from "lucide-react";
import { tr, type Lang } from "@/lib/i18n";
import { isAwaitingConfirmation, isReadyForPayment } from "@/lib/reservation";
import { isClosedOrder } from "@/lib/order-status";
import type { HubOrder } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * THE ORDER'S STATUS LINE (build step 4; comp page-comps/account-signin
 * "Order detail"): reserved → piece confirmed → payment details / transfer →
 * payment received → shipped. Every stage up to where the order is now is
 * ticked; the current one is lit.
 *
 * Where the order is comes from the Hub's own fields, read the same way the
 * status badge reads them (lib/order-status.ts). An order that ended —
 * cancelled, expired, refunded, failed — gets no line: its page says what
 * happened instead.
 */
export function orderStage(o: HubOrder): 1 | 2 | 3 | 4 | 5 | null {
  if (isClosedOrder(o) || o.payment_status === "refunded" || o.payment_status === "failed") return null;
  if (isAwaitingConfirmation(o)) return 1;
  if (o.shipped_at) return 5;
  if (o.payment_status === "paid" || o.status === "completed") return 4;
  if (o.payment_status === "pending_transfer") return isReadyForPayment(o) ? 3 : 2;
  return null;
}

export function OrderProgress({ lang, stage }: { lang: Lang; stage: 1 | 2 | 3 | 4 | 5 }) {
  const t = tr(lang);
  const stages = [t("orders", "stageReserved"), t("orders", "stageConfirmed"), t("orders", "stagePayment"), t("orders", "stagePaid"), t("orders", "stageShipped")];
  return (
    <ol aria-label={t("orders", "progress")} className="mb-6 grid grid-cols-5 border-t border-hairline">
      {stages.map((s, i) => {
        const n = i + 1;
        const done = n <= stage;
        const now = n === stage;
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
            <span className="sr-only">{now ? t("orders", "stageNow", { stage: s }) : done ? t("orders", "stageDone", { stage: s }) : s}</span>
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
