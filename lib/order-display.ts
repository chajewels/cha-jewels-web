import { isAwaitingConfirmation, isReadyForPayment } from "@/lib/reservation";
import { isClosedOrder, orderStatusKey } from "@/lib/order-status";
import type { HubLatestDecision, HubOrder } from "@/lib/types";

/**
 * WEBSITE PAYMENT LIFECYCLE (task S1, 2026-10-05). How an order reads to her —
 * the headline, the five-step line, the step-3 label and the reviewer's notice
 * — decided in ONE pure place from the Hub's own fields: the method she chose
 * (`chosen_method`), whether a payment is being checked (an open submission or
 * a payment lock, `being_checked` / `pending_submissions` / `payment_state`)
 * and the newest decision (`latest_decision`). Nothing here computes money.
 *
 * Every input is optional on the Hub side: an older Hub sends no method and no
 * decision, and the order then reads exactly as it did before (transfer
 * wording, no notice).
 */
export type DisplayMethod = "transfer" | "paidy" | "card";

/**
 * THE ORDER'S STATUS LINE (build step 4; comp page-comps/account-signin
 * "Order detail"): reserved → piece confirmed → payment → payment received →
 * shipped. An order that ended — cancelled, expired, refunded, failed — gets
 * no line: its page says what happened instead.
 *
 * `beingChecked` (S1): a payment she has made is waiting for review, so step 3
 * is done from her side and the line moves to step 4. It never revives a
 * closed order and never moves a reservation or a shipped order.
 */
export function orderStage(o: HubOrder, beingChecked?: boolean): 1 | 2 | 3 | 4 | 5 | null {
  if (isClosedOrder(o) || o.payment_status === "refunded" || o.payment_status === "failed") return null;
  if (isAwaitingConfirmation(o)) return 1;
  if (o.shipped_at) return 5;
  if (o.payment_status === "paid" || o.status === "completed") return 4;
  if (o.payment_status === "pending_transfer") {
    if (!isReadyForPayment(o)) return 2;
    return beingChecked ? 4 : 3;
  }
  return null;
}

export type OrderDisplay = {
  /** null: use orderStatusLabel(order, lang, chosenMethod). */
  headlineKey: "pending" | "statusPendingTransfer" | "statusPendingPayment" | null;
  stage: 1 | 2 | 3 | 4 | 5 | null;
  stage3Key: "stagePayment" | "stagePaymentPaidy" | "stagePaymentCard";
  notice: "rejected" | "needs_info" | null;
  /** Staff asked her a question: no way to pay is offered until it is answered. */
  payBlocked: boolean;
};

export function orderDisplay(input: {
  order: HubOrder;
  chosenMethod?: DisplayMethod | null;
  beingChecked: boolean;
  latestDecision?: HubLatestDecision | null;
}): OrderDisplay {
  const { order, chosenMethod, beingChecked, latestDecision } = input;
  const base = orderStage(order);
  const checking = beingChecked && base === 3;
  const stage = orderStage(order, beingChecked);

  const stage3Key = chosenMethod === "paidy" ? "stagePaymentPaidy"
    : chosenMethod === "card" ? "stagePaymentCard"
    : "stagePayment";

  // A payment being checked is the headline; otherwise Paidy / card name the
  // wait as a payment, and transfer (or an older Hub) keeps orderStatusLabel.
  const headlineKey: OrderDisplay["headlineKey"] = checking ? "pending"
    : orderStatusKey(order, chosenMethod).key === "statusPendingPayment" ? "statusPendingPayment"
    : null;

  const notice = latestDecision?.status === "rejected" ? "rejected"
    : latestDecision?.status === "needs_clarification" ? "needs_info"
    : null;

  return { headlineKey, stage, stage3Key, notice, payBlocked: latestDecision?.status === "needs_clarification" };
}
