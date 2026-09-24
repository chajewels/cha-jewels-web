import type { Lang } from "@/lib/i18n";
import type { Tone } from "@/lib/order-status";
import { dict } from "@/lib/i18n";
import { isAwaitingConfirmation, isReadyForPayment } from "@/lib/reservation";
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
export function planStatusLabel(plan: HubLayawayPlan, lang: Lang): { text: string; tone: Tone } {
  // A reservation staff have not confirmed (Hub A2). Its status is "active",
  // which would otherwise read as a plan in progress. The Hub's flag is
  // live-only, so a declined or lapsed reservation falls through to cancelled.
  if (isAwaitingConfirmation(plan)) return { text: k("statusReserved", lang), tone: "pending" };
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
  if (isAwaitingConfirmation(plan)) return k("noteReserved", lang);
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
 * It may not, on a closed plan. Every one of the 50 forfeited plans still
 * carries a positive remaining_balance in the Hub — that is the Hub's own
 * bookkeeping and correct there — so a closed plan labels the figure
 * "Unpaid when it closed" instead of "Still to pay", and never puts a payment
 * route beside it.
 */
export const remainingIsPayable = (plan: HubLayawayPlan) => isLivePlan(plan);

/**
 * Whether the plan has a remaining balance worth naming at all.
 *
 * FIXED 2026-09-15, found in acceptance. The label used to key on CLOSURE
 * alone: any plan that was not live got "Unpaid when it closed". That is right
 * for a forfeited plan and wrong for a completed one, and completed is by far
 * the commonest closed state — 902 of the 954 closed real plans, every one of
 * them with `remaining_balance` exactly 0.00. Those rows read:
 *
 *     [Paid in full]   ₱0   "Unpaid when it closed · Plan total ₱26,000"
 *
 * a badge and a caption contradicting each other on one row, shown to exactly
 * the customers who had paid everything off.
 *
 * Closure is not the question. A balance above zero is. `> 0` rather than
 * `!== 0` also keeps an overpaid plan out of the "unpaid" branch: TEST-004 paid
 * ₱17,500 against a ₱15,000 total, and while the Hub floors remaining_balance
 * at 0.00 today, a negative would otherwise print as an unpaid amount.
 */
export const hasOutstandingBalance = (plan: HubLayawayPlan) => Number(plan.remaining_balance) > 0;

/**
 * The headline figure for a plan row, and what to call it.
 *
 * Three cases, because a single figure cannot mean the same thing in all of
 * them:
 *
 *   live                  remaining is money to pay      -> "Still to pay", gold
 *   closed, balance > 0   remaining is what was lost     -> "Unpaid when it closed", dim
 *   closed, nothing left  remaining is a meaningless 0   -> show the plan total, dim
 *
 * The third case says NOTHING about unpaid amounts, which is the whole point:
 * the badge above it already says the plan is paid in full, and the figures
 * must agree with it.
 *
 * `emphasise` keeps #26's rule intact — a closed plan's figure is never gold —
 * and is derived here rather than at the call site so the caption and the
 * colour cannot drift apart.
 */
export type PlanFigure = {
  /** The amount to print large. */
  amount: number;
  /** What that amount is, already translated. */
  label: string;
  /** Whether to append "· Plan total X". False when the figure IS the total. */
  withPlanTotal: boolean;
  /** Gold only on a live plan. */
  emphasise: boolean;
};

export function planFigure(plan: HubLayawayPlan, lang: Lang): PlanFigure {
  if (isLivePlan(plan)) {
    return { amount: Number(plan.remaining_balance), label: k("remaining", lang), withPlanTotal: true, emphasise: true };
  }
  if (hasOutstandingBalance(plan)) {
    return { amount: Number(plan.remaining_balance), label: k("unpaidAtClosure", lang), withPlanTotal: true, emphasise: false };
  }
  return { amount: Number(plan.total_amount), label: k("total", lang), withPlanTotal: false, emphasise: false };
}

/**
 * Whether the plan detail's third figure — the remaining-balance cell — should
 * be rendered at all.
 *
 * On a settled closed plan it should not. The two cells beside it already read
 * "Plan total ₱26,000 · Paid so far ₱26,000", which says everything; a third
 * cell reading "Unpaid when it closed ₱0" only contradicts the badge.
 */
export const showsRemainingFigure = (plan: HubLayawayPlan) =>
  isLivePlan(plan) || hasOutstandingBalance(plan);

/** The honest label for `remaining_balance` wherever that figure is shown. */
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
  isLivePlan(plan) && plan.source_channel === "web" && isReadyForPayment(plan);

/**
 * Whether bank details may be shown for this plan at all.
 *
 * Not before staff confirm a reservation (owner rule, Hub A2): the Hub already
 * sends no methods then, and this keeps the heading and the "contact us"
 * fallback from rendering around an empty list. A Hub-arranged plan is never a
 * reservation, so it is unaffected.
 */
export const showsPaymentDetails = (plan: HubLayawayPlan) =>
  isLivePlan(plan) && isReadyForPayment(plan);

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
