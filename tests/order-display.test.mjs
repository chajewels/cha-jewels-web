// WEBSITE PAYMENT LIFECYCLE (task S1): one pure helper decides the order's
// headline, step line, step-3 label and decision notice from the Hub's own
// fields (lib/order-display.ts). An older Hub — no chosen method, no decision —
// reads exactly as before. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { orderDisplay, orderStage } = await import("@/lib/order-display");
const { orderStatusLabel } = await import("@/lib/order-status");

/** A confirmed, payable yen web order waiting for its money. */
const pending = {
  id: "o1", web_reference: "CJ-W-000001", invoice_number: "900001",
  status: "pending", payment_status: "pending_transfer", payment_method: "transfer",
  order_type: "SELF", currency: "JPY", total_amount: 236800, total_paid: 0,
  remaining_balance: 236800, shipping_fee: 800, transfer_due_at: null,
  recipient_name: null, gift_note: null, order_date: "2026-10-05",
  created_at: "2026-10-05T00:00:00Z", completed_at: null, cancelled_at: null,
  tracking_number: null, shipped_at: null,
  cancellation_reason: null, refund_status: null, refund_note: null, expired_at: null,
  awaiting_confirmation: false, ready_for_payment: true,
};
const decision = (status) => ({ status, method: "paidy", amount: 236800, decided_at: "2026-10-05T03:00:00Z", message: null });

test("transfer pending: the transfer step label and today's headline", () => {
  const d = orderDisplay({ order: pending, chosenMethod: "transfer", beingChecked: false });
  assert.equal(d.stage3Key, "stagePayment");
  assert.equal(d.stage, 3);
  assert.ok(d.headlineKey === null || d.headlineKey === "statusPendingTransfer");
  assert.equal(d.notice, null);
  assert.equal(d.payBlocked, false);
  assert.equal(orderStatusLabel(pending, "ja", "transfer").text, "お振込待ち");
});

test("Paidy pending: the Paidy step and 'Awaiting payment', never 'Awaiting transfer'", () => {
  const d = orderDisplay({ order: pending, chosenMethod: "paidy", beingChecked: false });
  assert.equal(d.stage3Key, "stagePaymentPaidy");
  assert.equal(d.stage, 3);
  assert.equal(orderStatusLabel(pending, "ja", "paidy").text, "お支払い待ち");
  assert.equal(orderStatusLabel(pending, "en", "paidy").text, "Awaiting payment");
  assert.equal(orderStatusLabel(pending, "ja", "paidy").tone, "pending");
});

test("card pending: the card step", () => {
  const d = orderDisplay({ order: pending, chosenMethod: "card", beingChecked: false });
  assert.equal(d.stage3Key, "stagePaymentCard");
  assert.equal(orderStatusLabel(pending, "en", "card").text, "Awaiting payment");
});

test("a payment being checked moves the line to step 4 and the headline to 'being checked'", () => {
  const d = orderDisplay({ order: pending, chosenMethod: "paidy", beingChecked: true });
  assert.equal(d.stage, 4);
  assert.equal(d.headlineKey, "pending");
  assert.equal(orderStage(pending, true), 4);
  assert.equal(orderStage(pending), 3);
});

test("being checked never revives a closed order", () => {
  const cancelled = { ...pending, status: "cancelled", payment_status: "cancelled" };
  assert.equal(orderStage(cancelled, true), null);
  const d = orderDisplay({ order: cancelled, chosenMethod: "paidy", beingChecked: true });
  assert.equal(d.stage, null);
  assert.equal(d.headlineKey, null);
});

test("a rejected submission: the rejected notice, she can still pay", () => {
  const d = orderDisplay({ order: pending, chosenMethod: "paidy", beingChecked: false, latestDecision: decision("rejected") });
  assert.equal(d.notice, "rejected");
  assert.equal(d.payBlocked, false);
});

test("staff asked a question: the needs-info notice and no way to pay until it is answered", () => {
  const d = orderDisplay({ order: pending, chosenMethod: "transfer", beingChecked: false, latestDecision: decision("needs_clarification") });
  assert.equal(d.notice, "needs_info");
  assert.equal(d.payBlocked, true);
});

test("an older Hub (no chosen method, no decision) reads exactly as today", () => {
  const d = orderDisplay({ order: pending, beingChecked: false });
  assert.deepEqual(d, { headlineKey: null, stage: 3, stage3Key: "stagePayment", notice: null, payBlocked: false });
  const n = orderDisplay({ order: pending, chosenMethod: null, beingChecked: false, latestDecision: null });
  assert.deepEqual(n, d);
  assert.equal(orderStatusLabel(pending, "ja").text, "お振込待ち");
  assert.equal(orderStatusLabel(pending, "en", null).text, "Awaiting transfer");
});

test("the other states keep today's stages and labels whatever the method", () => {
  const reserved = { ...pending, awaiting_confirmation: true, ready_for_payment: false, payment_status: "awaiting_confirmation" };
  assert.equal(orderStage(reserved), 1);
  assert.equal(orderStatusLabel(reserved, "en", "paidy").text, "Reserved — confirming your piece");
  const paid = { ...pending, payment_status: "paid", total_paid: 236800, remaining_balance: 0 };
  assert.equal(orderStage(paid), 4);
  assert.equal(orderStatusLabel(paid, "en", "card").text, "Paid");
  const shipped = { ...paid, shipped_at: "2026-10-06T00:00:00Z" };
  assert.equal(orderStage(shipped, true), 5);
});
