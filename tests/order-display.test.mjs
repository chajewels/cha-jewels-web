// WEBSITE PAYMENT LIFECYCLE (task S1): one pure helper decides the order's
// headline, step line, step-3 label and decision notice from the Hub's own
// fields (lib/order-display.ts). An older Hub — no chosen method, no decision —
// reads exactly as before. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { orderDisplay, orderStage, progressStep } = await import("@/lib/order-display");
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
  assert.equal(d.stageInProgress, true, "step 4 is lit but not ticked while the payment is checked");
  assert.equal(orderDisplay({ order: pending, chosenMethod: "card", beingChecked: false }).stageInProgress, false);
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
  assert.deepEqual(d, { headlineKey: null, stage: 3, stage3Key: "stagePayment", stageInProgress: false, notice: null, payBlocked: false });
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

// R17 (controller ruling, task S3): the decision notice is about the LAST
// payment, so it goes while a new one is being checked, and on an order that
// is no longer open.
test("the decision notice is hidden while a new payment is being checked", () => {
  const d = orderDisplay({ order: pending, chosenMethod: "transfer", beingChecked: true, latestDecision: decision("rejected") });
  assert.equal(d.notice, null);
  const q = orderDisplay({ order: pending, chosenMethod: "transfer", beingChecked: true, latestDecision: decision("needs_clarification") });
  assert.equal(q.notice, null);
});

test("the decision notice is hidden on an order that is not open", () => {
  for (const o of [
    { ...pending, status: "cancelled", payment_status: "cancelled" },
    { ...pending, status: "expired" },
    { ...pending, status: "completed", payment_status: "paid", total_paid: 236800, remaining_balance: 0 },
  ]) {
    const d = orderDisplay({ order: o, chosenMethod: "paidy", beingChecked: false, latestDecision: decision("rejected") });
    assert.equal(d.notice, null, o.status);
  }
});

test("a list row reads 'being checked' while a payment is checked, else the method's label", async () => {
  const { orderRowStatus } = await import("@/lib/order-display");
  assert.deepEqual(orderRowStatus({ ...pending, chosen_method: "paidy", being_checked: true }, "ja"), { tone: "pending", text: "お支払いを確認中です" });
  assert.equal(orderRowStatus({ ...pending, chosen_method: "paidy", being_checked: false }, "ja").text, "お支払い待ち");
  assert.equal(orderRowStatus({ ...pending, chosen_method: "card" }, "en").text, "Awaiting payment");
  // An older Hub (no fields): exactly today's label.
  assert.deepEqual(orderRowStatus(pending, "en"), orderStatusLabel(pending, "en"));
});

// TASK S4 (C1): the order page shows ONLY the pay box for her chosen method.
// The Hub is the authority (it sends no other block); the page never widens it.
test("payBoxes: a Paidy order never shows the card box, and the reverse", async () => {
  const { payBoxes } = await import("@/lib/order-display");
  assert.deepEqual(payBoxes({ chosen: "paidy", paidyOffered: true, cardOffered: true }), { paidy: true, card: false, transfer: false });
  assert.deepEqual(payBoxes({ chosen: "card", paidyOffered: true, cardOffered: true }), { paidy: false, card: true, transfer: false });
  assert.deepEqual(payBoxes({ chosen: "transfer", paidyOffered: true, cardOffered: true }), { paidy: false, card: false, transfer: true });
});

test("payBoxes: an order with no chosen method shows what the Hub offers", async () => {
  const { payBoxes } = await import("@/lib/order-display");
  assert.deepEqual(payBoxes({ chosen: null, paidyOffered: true, cardOffered: true }), { paidy: true, card: true, transfer: true });
  assert.deepEqual(payBoxes({ chosen: null, paidyOffered: false, cardOffered: false }), { paidy: false, card: false, transfer: true });
});

test("payBoxes: never shows a box the Hub did not offer", async () => {
  const { payBoxes } = await import("@/lib/order-display");
  assert.deepEqual(payBoxes({ chosen: "paidy", paidyOffered: false, cardOffered: true }), { paidy: false, card: false, transfer: false });
});

test("fixture: the rejected-Paidy preview order carries no card block (C1)", async () => {
  const { orderFixture } = await import("@/lib/fixtures");
  const { ordersFixture } = await import("@/lib/fixtures");
  for (const o of ordersFixture) {
    const d = orderFixture(o.id);
    if (d?.chosen_method === "paidy") assert.equal(d.card ?? null, null, o.id);
    if (d?.chosen_method === "card") assert.equal(d.paidy ?? null, null, o.id);
  }
});

test("switch button reports its open state (final review M-3)", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync("components/commerce/switch-method.tsx", "utf8");
  assert.ok(src.includes("aria-expanded={open}"));
  assert.ok(!src.includes("aria-expanded={false}"));
  assert.ok(src.includes("aria-controls={panelId}"));
});

test("payBoxes: card chosen but no longer offered — the Hub's bank details are shown (F-11 / D-QC4)", async () => {
  const { payBoxes, cardFallsBackToTransfer } = await import("@/lib/order-display");
  assert.deepEqual(payBoxes({ chosen: "card", paidyOffered: false, cardOffered: false, transferSent: true }), { paidy: false, card: false, transfer: true });
  assert.deepEqual(payBoxes({ chosen: "card", paidyOffered: false, cardOffered: false, transferSent: false }), { paidy: false, card: false, transfer: false });
  assert.deepEqual(payBoxes({ chosen: "card", paidyOffered: false, cardOffered: true, transferSent: true }), { paidy: false, card: true, transfer: false });
  assert.equal(cardFallsBackToTransfer({ chosen: "card", cardOffered: false, transferSent: true }), true);
  assert.equal(cardFallsBackToTransfer({ chosen: "paidy", cardOffered: false, transferSent: true }), false);
});

test("UI-1: the status line never ticks 'Payment received' while the payment is being checked", () => {
  // Stage 4 reached but still being checked: lit, not ticked, read as "being checked".
  assert.deepEqual(progressStep(4, 4, true), { done: false, now: true, label: "stageChecking" });
  // Earlier steps stay ticked.
  assert.deepEqual(progressStep(3, 4, true), { done: true, now: false, label: "stageDone" });
  // Once recorded, the same step is ticked and read as "now".
  assert.deepEqual(progressStep(4, 4, false), { done: true, now: true, label: "stageNow" });
  // A later step is neither.
  assert.deepEqual(progressStep(5, 4, true), { done: false, now: false, label: null });
});

test("UI-1: a paid order is never 'in progress', even if a check flag is still set", () => {
  const paid = { ...pending, payment_status: "paid", total_paid: 236800, remaining_balance: 0 };
  const d = orderDisplay({ order: paid, chosenMethod: "card", beingChecked: true });
  assert.equal(d.stage, 4);
  assert.equal(d.stageInProgress, false);
});
