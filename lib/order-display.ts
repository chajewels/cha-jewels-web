import { isAwaitingConfirmation, isReadyForPayment } from "@/lib/reservation";
import { isClosedOrder, orderStatusKey, orderStatusLabel } from "@/lib/order-status";
import { tr, type Lang } from "@/lib/i18n";
import type { CheckoutMethod, CheckoutMode, HubLatestDecision, HubOrder } from "@/lib/types";

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
export type DisplayMethod = "transfer" | "paidy" | "card" | "cod";

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
export function orderStage(o: HubOrder, beingChecked?: boolean, cod?: boolean): 1 | 2 | 3 | 4 | 5 | null {
  if (isClosedOrder(o) || o.payment_status === "refunded" || o.payment_status === "failed") return null;
  if (isAwaitingConfirmation(o)) return 1;
  // CASH ON DELIVERY (Hub 2026-10-10): the parcel ships BEFORE she pays, so
  // the line is reserved → confirmed → shipped → pay on delivery → payment
  // received (codStageKeys). A tick is never put on a step that has not
  // happened: shipped-but-unpaid lights "Pay on delivery", not "Payment received".
  if (cod) {
    if (o.payment_status === "paid" || o.status === "completed") return 5;
    if (o.shipped_at) return 4;
    if (o.payment_status === "pending_transfer") return isReadyForPayment(o) ? 3 : 2;
    return null;
  }
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
  stage3Key: "stagePayment" | "stagePaymentPaidy" | "stagePaymentCard" | "stageShipCod";
  /** Steps 4 and 5: "Payment received", "Shipped" — swapped round for cash on delivery. */
  stage4Key: "stagePaid" | "stagePaymentCod";
  stage5Key: "stageShipped" | "stagePaid";
  /**
   * The current step is still in progress, not done: a payment she made is being checked
   * (a card held, not yet charged; a transfer or Paidy payment awaiting review). The line
   * lights step 4 but does not tick "Payment received" until the Hub records the money
   * (go-live rehearsal 2026-10-09).
   */
  stageInProgress: boolean;
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
  const cod = chosenMethod === "cod";
  const base = orderStage(order, false, cod);
  // A COD payment is never "being checked" on her side: the courier collects.
  const checking = !cod && beingChecked && base === 3;
  const stage = cod ? base : orderStage(order, beingChecked);

  const stage3Key = chosenMethod === "paidy" ? "stagePaymentPaidy"
    : chosenMethod === "card" ? "stagePaymentCard"
    : cod ? "stageShipCod"
    : "stagePayment";
  const stage4Key = cod ? "stagePaymentCod" : "stagePaid";
  const stage5Key = cod ? "stagePaid" : "stageShipped";

  // A payment being checked is the headline; otherwise Paidy / card name the
  // wait as a payment, and transfer (or an older Hub) keeps orderStatusLabel.
  const headlineKey: OrderDisplay["headlineKey"] = checking ? "pending"
    : orderStatusKey(order, chosenMethod).key === "statusPendingPayment" ? "statusPendingPayment"
    : null;

  // R17 (task S3): the notice is about her LAST payment. It goes while a new
  // one is being checked, and on an order that is no longer open.
  const noticeShown = !beingChecked && order.status === "pending";
  const notice = !noticeShown ? null
    : latestDecision?.status === "rejected" ? "rejected"
    : latestDecision?.status === "needs_clarification" ? "needs_info"
    : null;

  return { headlineKey, stage, stage3Key, stage4Key, stage5Key, stageInProgress: checking, notice, payBlocked: latestDecision?.status === "needs_clarification" };
}

/**
 * The status of one order in the order list and on the account home (task
 * S3): "being checked" while the Hub says a payment is (`being_checked`) and
 * the order is waiting for its money, otherwise the label for the method she
 * chose (`chosen_method`). An older Hub sends neither, and the row reads as
 * before.
 */
/**
 * One step of the status line (components/account/order-progress.tsx). A tick
 * means DONE: only the steps before the current one are ticked. The current
 * step is lit and shows its number — never a tick (owner 2026-10-09: step 3
 * "Payment" was ticked before she had paid; go-live UI-1: "Payment received"
 * was ticked while the payment was still being checked). `label` picks the
 * screen-reader wording so a reader hears what a sighted customer sees:
 * "(now)", or "(being checked)" while a payment is under review.
 */
export function progressStep(n: number, stage: number, inProgress: boolean): { done: boolean; now: boolean; label: "stageNow" | "stageChecking" | "stageDone" | null } {
  const now = n === stage;
  const done = n < stage;
  return { done, now, label: now ? (inProgress ? "stageChecking" : "stageNow") : done ? "stageDone" : null };
}

export function orderRowStatus(o: HubOrder, lang: Lang): ReturnType<typeof orderStatusLabel> {
  const d = orderDisplay({ order: o, chosenMethod: o.chosen_method ?? null, beingChecked: o.being_checked === true });
  if (d.headlineKey === "pending") return { tone: "pending", text: tr(lang)("orders", "pending") };
  return orderStatusLabel(o, lang, o.chosen_method ?? null);
}

/**
 * The draft page's step 3 (task S4): a layaway draft's deposit step, or the
 * full payment step for the method she chose at checkout. An older Hub sends no
 * method, and the step reads as the transfer one, as before.
 */
export function draftStep3Key(mode: CheckoutMode, method: CheckoutMethod | undefined): "next3" | "next3Layaway" | "next3Paidy" | "next3Card" | "next3Cod" {
  if (mode === "layaway") return "next3Layaway";
  if (method === "paidy") return "next3Paidy";
  if (method === "card") return "next3Card";
  if (method === "cod") return "next3Cod";
  return "next3";
}

/**
 * C1 (task S4): the order page shows ONLY the pay box for the method she
 * chose. The Hub is the authority — it already sends no Paidy block on a card
 * order and no card block on a Paidy order (`method_not_chosen`) — and this
 * only ever NARROWS what it sent, never widens it. An order with no chosen
 * method (not made on the website, or an older Hub) shows what the Hub offers,
 * with the bank details underneath, as before.
 *
 * Cash on delivery (Hub 2026-10-10): NO pay box at all — the courier collects
 * when the parcel arrives (the Hub also sends no bank details, no Paidy, no card).
 */
export function payBoxes(input: { chosen: DisplayMethod | null; paidyOffered: boolean; cardOffered: boolean; transferSent?: boolean }): { paidy: boolean; card: boolean; transfer: boolean } {
  const { chosen, paidyOffered, cardOffered, transferSent = false } = input;
  if (chosen === "cod") return { paidy: false, card: false, transfer: false };
  return {
    paidy: paidyOffered && (chosen === null || chosen === "paidy"),
    card: cardOffered && (chosen === null || chosen === "card"),
    // F-11 / D-QC4 (owner 2026-10-09): she chose card, the Hub no longer offers
    // it and sends bank details instead — show them, so she always has a way to pay.
    transfer: chosen === null || chosen === "transfer" || (chosen === "card" && !cardOffered && transferSent),
  };
}

/** F-11 / D-QC4: she chose card, card is not offered, and the Hub sent bank details in its place. */
export function cardFallsBackToTransfer(input: { chosen: DisplayMethod | null; cardOffered: boolean; transferSent: boolean }): boolean {
  return input.chosen === "card" && !input.cardOffered && input.transferSent;
}

/**
 * The draft page's "Amount to pay" (final review I-1): the Hub's
 * total_after_points, on a FULL-payment draft that used points only. On a
 * layaway draft the Hub sends the total there (points go to the deposit), so
 * the page keeps its single "Total so far" row. Never computed here.
 */
export function draftAmountToPay(d: { mode: CheckoutMode; points_value?: number | null; total_after_points?: number | null }): number | null {
  if (d.mode !== "full") return null;
  if (!(Number(d.points_value ?? 0) > 0)) return null;
  if (d.total_after_points == null) return null;
  return Number(d.total_after_points);
}

/** Staff asked her a question (needs clarification): no way to pay, on any page (final review M-2). */
export function needsInfo(decision: Pick<HubLatestDecision, "status"> | null | undefined): boolean {
  return decision?.status === "needs_clarification";
}
