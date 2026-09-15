import type { Lang } from "@/lib/i18n";
import { dict } from "@/lib/i18n";
import type { HubLayawayPlan, HubLayawayScheduleRow } from "@/lib/types";

type Key = keyof typeof dict.plans;
const k = (key: Key, lang: Lang) => dict.plans[key][lang];

/**
 * The Hub's account_status, as one plain phrase for the customer.
 *
 * REWRITTEN 2026-09-15, when this page started showing Hub-created plans.
 * It used to fold cancelled, forfeited, final_forfeited and final_settlement
 * into a single word, "Closed" — which was adequate while every plan here was
 * a web plan a few days old, and wrong the moment the page could show the
 * 53 forfeited and 2 in-settlement plans that exist. Those are not clerical
 * closures: money was paid, and what happens next differs. Each says what it
 * is, and `planNote` supplies the sentence that explains it.
 */
export function planStatusLabel(plan: HubLayawayPlan, lang: Lang): { text: string; tone: "pending" | "good" | "dead" } {
  switch (plan.status) {
    case "completed":
      return { text: k("statusCompleted", lang), tone: "good" };
    case "forfeited":
    case "final_forfeited":
      return { text: k("statusForfeited", lang), tone: "dead" };
    case "final_settlement":
      return { text: k("statusSettlement", lang), tone: "dead" };
    case "cancelled":
      return { text: k("statusCancelled", lang), tone: "dead" };
    case "overdue":
      return { text: k("statusOverdue", lang), tone: "pending" };
    case "extension_active":
      return { text: k("statusExtension", lang), tone: "pending" };
    default:
      return { text: k("statusActive", lang), tone: "pending" };
  }
}

/**
 * The one sentence a plan in this state needs, or null when the figures already
 * say everything.
 *
 * A closed plan NEVER gets an encouraging sentence here. A forfeited plan says
 * why it closed and offers a conversation; it does not invite a payment,
 * because the plan cannot take one.
 */
export function planNote(plan: HubLayawayPlan, lang: Lang): string | null {
  switch (plan.status) {
    case "completed": return k("noteCompleted", lang);
    case "forfeited":
    case "final_forfeited": return k("noteForfeited", lang);
    case "final_settlement": return k("noteSettlement", lang);
    case "cancelled": return plan.expired_at ? k("expiredNote", lang) : k("noteCancelled", lang);
    case "overdue": return k("noteOverdue", lang);
    case "extension_active": return k("noteExtension", lang);
    default: return null;
  }
}

/** A plan that can still take money. Matches the Hub's own live-status list. */
export const isLivePlan = (plan: HubLayawayPlan) =>
  ["active", "overdue", "extension_active", "reactivated"].includes(plan.status);

/** Closed, by any of the Hub's several routes to closed. */
export const isClosedPlan = (plan: HubLayawayPlan) =>
  ["cancelled", "forfeited", "final_forfeited", "final_settlement", "completed"].includes(plan.status);

/**
 * Whether `remaining_balance` may be presented as an amount to pay.
 *
 * It may not, on a closed plan. Every one of the 53 forfeited plans still
 * carries a positive remaining_balance in the Hub — that is the Hub's own
 * bookkeeping and correct there — so a closed plan labels the figure
 * "Unpaid when it closed" instead of "Still to pay", and never puts a payment
 * route beside it.
 */
export const remainingIsPayable = (plan: HubLayawayPlan) => isLivePlan(plan);

/** The honest label for whatever `remaining_balance` is on this plan. */
export const remainingLabel = (plan: HubLayawayPlan, lang: Lang) =>
  remainingIsPayable(plan) ? k("remaining", lang) : k("unpaidAtClosure", lang);

/**
 * Whether THIS SITE may offer a payment form for this plan.
 *
 * Only a plan that started here. Payment submission for a Hub-arranged plan
 * stays in the customer portal, and the Hub's POST /layaway/:id/pay keeps its
 * `source_channel = 'web'` filter to enforce that — so rendering a form for a
 * hub_manual plan would collect a receipt, upload it and then 404. The plan
 * page points at the portal instead.
 *
 * `source_channel` absent (an older Hub deploy that does not send it) is read
 * as "not web": refusing to show a form is the safe direction.
 */
export const canPayHere = (plan: HubLayawayPlan) =>
  isLivePlan(plan) && plan.source_channel === "web";

/**
 * DISPLAY RULES: the row's state comes from `computed_status`, never from the
 * write-only caches beside it.
 */
export function rowStatusLabel(row: HubLayawayScheduleRow, lang: Lang): string {
  switch (row.computed_status) {
    case "paid": return k("rowPaid", lang);
    case "partially_paid": return k("rowPartial", lang);
    case "overdue": return k("rowOverdue", lang);
    case "cancelled": return k("rowCancelled", lang);
    default: return k("rowPending", lang);
  }
}
