import type { Lang } from "@/lib/i18n";
import { dict } from "@/lib/i18n";
import type { HubLayawayPlan, HubLayawayScheduleRow } from "@/lib/types";

/**
 * The Hub's account_status, as one plain phrase for the customer.
 *
 * The Hub distinguishes nine states because staff need them; a customer needs
 * four. A plan whose deposit lapsed is `cancelled` with `expired_at` stamped —
 * the same row, closed — so the closed states collapse into one word and the
 * page says separately what happened and that nothing is owed.
 */
export function planStatusLabel(plan: HubLayawayPlan, lang: Lang): { text: string; tone: "pending" | "good" | "dead" } {
  const k = (key: keyof typeof dict.plans) => dict.plans[key][lang];
  switch (plan.status) {
    case "completed":
      return { text: k("statusCompleted"), tone: "good" };
    case "cancelled":
    case "forfeited":
    case "final_forfeited":
    case "final_settlement":
      return { text: k("statusCancelled"), tone: "dead" };
    case "overdue":
      return { text: k("statusOverdue"), tone: "pending" };
    default:
      return { text: k("statusActive"), tone: "pending" };
  }
}

/** A plan that can still take money. Matches the Hub's own live-status list. */
export const isLivePlan = (plan: HubLayawayPlan) =>
  ["active", "overdue", "extension_active", "reactivated"].includes(plan.status);

/**
 * DISPLAY RULES: the row's state comes from `computed_status`, never from the
 * write-only caches beside it.
 */
export function rowStatusLabel(row: HubLayawayScheduleRow, lang: Lang): string {
  const k = (key: keyof typeof dict.plans) => dict.plans[key][lang];
  switch (row.computed_status) {
    case "paid": return k("rowPaid");
    case "partially_paid": return k("rowPartial");
    case "overdue": return k("rowOverdue");
    case "cancelled": return k("rowCancelled");
    default: return k("rowPending");
  }
}
