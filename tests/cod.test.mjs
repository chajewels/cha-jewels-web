// CASH ON DELIVERY (代金引換, Hub 2026-10-10; owner plan cod-plan-2026-10-10).
// The storefront renders the Hub's COD option, fee and order state; it never
// brackets a fee or judges the limit. These tests pin the pure helpers that
// decide what she sees, and the preview Hub stand-in's contract.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { orderDisplay, orderStage, payBoxes, draftStep3Key, progressStep } = await import("@/lib/order-display");
const { orderStatusLabel, orderStatusKey } = await import("@/lib/order-status");
const { methodWhyKey } = await import("@/lib/checkout-method-why");
const { checkoutErrorCode } = await import("@/lib/checkout-error-code");
const { switchErrorKey, isSwitchMethod } = await import("@/lib/switch-method-copy");
const { amountToPayAfterPoints } = await import("@/lib/checkout-summary");
const { dict } = await import("@/lib/i18n");
const fx = await import("@/lib/fixtures");

/** A confirmed COD order: nothing to pay before delivery. */
const codOrder = {
  id: "o-cod", web_reference: "CJ-W-000777", invoice_number: "900777",
  status: "pending", payment_status: "pending_transfer", payment_method: "cod",
  order_type: "SELF", currency: "JPY", total_amount: 26150, total_paid: 0,
  remaining_balance: 26150, shipping_fee: 0, cod_fee: 1150, transfer_due_at: null,
  recipient_name: null, gift_note: null, order_date: "2026-10-10",
  created_at: "2026-10-10T00:00:00Z", completed_at: null, cancelled_at: null,
  tracking_number: null, shipped_at: null,
  cancellation_reason: null, refund_status: null, refund_note: null, expired_at: null,
  awaiting_confirmation: false, ready_for_payment: true,
};

test("COD pending: 'Ships soon — pay on delivery', never 'Awaiting transfer', in both languages", () => {
  assert.equal(orderStatusKey(codOrder, "cod").key, "statusPendingCod");
  assert.equal(orderStatusLabel(codOrder, "en", "cod").text, "Ships soon — pay on delivery");
  assert.equal(orderStatusLabel(codOrder, "ja", "cod").text, "発送準備中（代金引換）");
  assert.equal(orderStatusLabel(codOrder, "ja", "cod").tone, "pending");
});

test("COD order page: NO pay box at all, whatever the Hub happens to offer", () => {
  assert.deepEqual(payBoxes({ chosen: "cod", paidyOffered: true, cardOffered: true, transferSent: true }), { paidy: false, card: false, transfer: false });
  assert.deepEqual(payBoxes({ chosen: "cod", paidyOffered: false, cardOffered: false, transferSent: false }), { paidy: false, card: false, transfer: false });
  // The other methods are unchanged.
  assert.equal(payBoxes({ chosen: "transfer", paidyOffered: false, cardOffered: false, transferSent: true }).transfer, true);
});

test("COD status line: confirmed → shipped (now) → pay on delivery → payment received, a tick only on what happened", () => {
  const d = orderDisplay({ order: codOrder, chosenMethod: "cod", beingChecked: false });
  assert.equal(d.stage3Key, "stageShipCod");
  assert.equal(d.stage4Key, "stagePaymentCod");
  assert.equal(d.stage5Key, "stagePaid");
  assert.equal(d.stage, 3, "confirmed, not yet shipped: step 3 'Shipped' is the current one");
  assert.equal(d.stageInProgress, false);
  assert.equal(dict.orders.stagePaymentCod.en, "Pay on delivery");
  assert.equal(dict.orders.stagePaymentCod.ja, "代金引換");

  const shipped = { ...codOrder, shipped_at: "2026-10-11T02:00:00Z" };
  const s = orderDisplay({ order: shipped, chosenMethod: "cod", beingChecked: false });
  assert.equal(s.stage, 4, "shipped but not paid: 'Pay on delivery' is now");
  assert.equal(progressStep(5, s.stage, false).done, false, "'Payment received' is never ticked before the money");

  const paid = { ...shipped, status: "completed", payment_status: "paid", total_paid: 26150, remaining_balance: 0 };
  assert.equal(orderDisplay({ order: paid, chosenMethod: "cod", beingChecked: false }).stage, 5);

  const reserved = { ...codOrder, awaiting_confirmation: true, payment_status: "awaiting_confirmation" };
  assert.equal(orderStage(reserved, false, true), 1);
  const cancelled = { ...codOrder, status: "cancelled", payment_status: "cancelled" };
  assert.equal(orderDisplay({ order: cancelled, chosenMethod: "cod", beingChecked: false }).stage, null);
});

test("a COD order is never 'being checked' on her side — the courier collects", () => {
  const d = orderDisplay({ order: codOrder, chosenMethod: "cod", beingChecked: true });
  assert.equal(d.stageInProgress, false);
  assert.equal(d.stage, 3);
});

test("other methods keep their status line exactly as before", () => {
  const t = { ...codOrder, payment_method: "transfer", cod_fee: null };
  const d = orderDisplay({ order: t, chosenMethod: "transfer", beingChecked: false });
  assert.deepEqual([d.stage3Key, d.stage4Key, d.stage5Key, d.stage], ["stagePayment", "stagePaid", "stageShipped", 3]);
});

test("the draft page's step 3 for COD", () => {
  assert.equal(draftStep3Key("full", "cod"), "next3Cod");
  assert.equal(draftStep3Key("layaway", "cod"), "next3Layaway");
});

test("checkout: every reason the Hub gives COD has its own words, in both languages", () => {
  const reasons = ["layaway", "currency_not_yen", "off", "address_not_jp", "nothing_to_collect", "over_cod_limit"];
  const keys = reasons.map((reason) => methodWhyKey({ method: "cod", reason }));
  assert.deepEqual(keys, ["methodWhyCodLayaway", "methodWhyCodYen", "methodWhyCodOff", "methodWhyCodJp", "methodWhyCodNothing", "methodWhyCodLimit"]);
  for (const k of keys) {
    assert.ok(dict.checkout[k]?.en && dict.checkout[k]?.ja, `${k} has EN and JA copy`);
    assert.doesNotMatch(dict.checkout[k].ja, /分割予約|レイアウェイ/, `${k} (ja) never names layaway`);
  }
  // Paidy / card wording unchanged.
  assert.equal(methodWhyKey({ method: "paidy", reason: "address_not_jp" }), "methodWhyPaidyJp");
  assert.equal(methodWhyKey({ method: "card", reason: "currency_not_yen" }), "methodWhyCardYen");
  assert.equal(methodWhyKey({ method: "paidy", reason: "off" }), "methodWhyOff");
});

test("checkout: the Hub's COD refusals at choice / pay read as 'pick another method'", () => {
  assert.equal(checkoutErrorCode({ status: 409, code: "over_cod_limit" }), "method_unavailable");
  assert.equal(checkoutErrorCode({ status: 409, code: "cod_nothing_to_collect" }), "method_unavailable");
});

test("checkout: the COD fee makes the Hub's total_after_points the headline, with or without points", () => {
  assert.equal(amountToPayAfterPoints({ mode: "full", quoteShown: true, pointsChosen: 0, totalAfterPoints: 26150, codFee: 1150 }), 26150);
  assert.equal(amountToPayAfterPoints({ mode: "full", quoteShown: true, pointsChosen: 1000, totalAfterPoints: 25150, codFee: 1150 }), 25150);
  assert.equal(amountToPayAfterPoints({ mode: "full", quoteShown: true, pointsChosen: 0, totalAfterPoints: 25000, codFee: 0 }), null);
});

test("switch: COD is a method she may be offered; the Hub's COD refusals read as 'can no longer be changed'", () => {
  assert.equal(isSwitchMethod("cod"), true);
  assert.equal(isSwitchMethod("cash"), false);
  for (const c of ["method_unavailable", "over_cod_limit", "cod_nothing_to_collect"]) assert.equal(switchErrorKey(c), "switchNotAllowed");
});

test("preview Hub stand-in: the COD option carries the Hub's fee and the totals include it", () => {
  // Default preview context: a ¥236,000 yen full payment (preview addresses are in Japan).
  const none = fx.checkoutChoiceFixture({ method: "transfer", points: 0 });
  const cod = none.payment_options.find((o) => o.method === "cod");
  assert.ok(cod, "the cod option is listed");
  assert.equal(cod.offered, true);
  assert.equal(cod.reason, null);
  assert.equal(cod.fee_jpy, 1810);
  assert.equal(none.totals.cod_fee, 0, "no fee until COD is chosen");

  const chosen = fx.checkoutChoiceFixture({ method: "cod", points: 0 });
  assert.equal(chosen.totals.cod_fee, 1810);
  assert.equal(chosen.totals.total_after_points, 236000 + 1810);
  assert.equal(chosen.totals.due_now_after_points, 236000 + 1810);
  // The other three options keep their shape (no fee_jpy).
  for (const o of chosen.payment_options.filter((x) => x.method !== "cod")) assert.equal("fee_jpy" in o, false);
});
