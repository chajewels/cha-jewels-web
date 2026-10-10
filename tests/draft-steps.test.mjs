// WEBSITE PAYMENT LIFECYCLE (task S4): the draft page's step 3 follows the
// method she chose at checkout, and the card / Paidy errors no longer tell her
// to "use bank transfer" (C1: her method is locked; switching is the order
// page's link, or contacting us). Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { draftStep3Key } = await import("@/lib/order-display");
const { dict } = await import("@/lib/i18n");

test("layaway draft: the deposit step, whatever the method", () => {
  assert.equal(draftStep3Key("layaway", undefined), "next3Layaway");
  assert.equal(draftStep3Key("layaway", "transfer"), "next3Layaway");
});

test("full payment: step 3 names her method", () => {
  assert.equal(draftStep3Key("full", "paidy"), "next3Paidy");
  assert.equal(draftStep3Key("full", "card"), "next3Card");
  assert.equal(draftStep3Key("full", "transfer"), "next3");
});

test("full payment from an older Hub (no method): the transfer step", () => {
  assert.equal(draftStep3Key("full", undefined), "next3");
});

test("the reworded errors never send her to bank transfer (paidy.errMismatch removed as unreachable, L4 2026-10-10)", () => {
  const keys = [
    ["paidy", "errFailed"],
    ["card", "errDeclined"], ["card", "errUnavailable"], ["card", "errFailed"],
  ];
  for (const [group, key] of keys) {
    const entry = dict[group][key];
    assert.ok(entry, `${group}.${key} exists`);
    assert.ok(!entry.ja.includes("銀行振込をご利用ください"), `${group}.${key} ja`);
    assert.ok(!/use bank transfer/i.test(entry.en), `${group}.${key} en`);
    assert.ok(entry.ja.includes("ほかの方法をご希望の場合はご連絡ください"), `${group}.${key} ja points to contact`);
  }
});

test("new step and amount keys exist in both languages", () => {
  assert.equal(dict.complete.next3Paidy.ja, "ペイディでお支払い — 確定メールのあとで");
  assert.equal(dict.complete.next3Card.ja, "カードでお支払い — 確定メールのあとで");
  assert.ok(dict.complete.next3Paidy.en && dict.complete.next3Card.en);
  assert.equal(dict.draft.amountToPay.ja, "お支払い予定額");
  assert.ok(dict.draft.amountToPay.en);
  assert.ok(dict.draft.nothingYet.ja.endsWith("お支払いはお控えください。"));
  assert.ok(!dict.orders.reservedNote.ja.includes("お振込先"));
  assert.ok(dict.orders.reservedNote.ja.includes("お支払い方法と期限"));
});

// Final review I-1: "Amount to pay" is a FULL-payment figure. On a layaway
// draft the Hub's total_after_points equals the total (points go to the
// deposit), so the page keeps its single "Total so far" row there.
test("draftAmountToPay: full payment with points → the Hub's after-points figure", async () => {
  const { draftAmountToPay } = await import("@/lib/order-display");
  assert.equal(draftAmountToPay({ mode: "full", points_value: 5000, total_after_points: 231000 }), 231000);
});
test("draftAmountToPay: null for a layaway draft, no points, or an older Hub", async () => {
  const { draftAmountToPay } = await import("@/lib/order-display");
  assert.equal(draftAmountToPay({ mode: "layaway", points_value: 5000, total_after_points: 236000 }), null);
  assert.equal(draftAmountToPay({ mode: "full", points_value: 0, total_after_points: 236000 }), null);
  assert.equal(draftAmountToPay({ mode: "full", points_value: 5000 }), null);
});

// Final review M-2: a question from staff blocks every way to pay, pay-card included.
test("needsInfo: only a needs_clarification decision blocks payment", async () => {
  const { needsInfo } = await import("@/lib/order-display");
  assert.equal(needsInfo({ status: "needs_clarification" }), true);
  assert.equal(needsInfo({ status: "rejected" }), false);
  assert.equal(needsInfo(null), false);
  assert.equal(needsInfo(undefined), false);
});

test("pay-card page redirects while staff need information", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync("app/account/orders/[id]/pay-card/page.tsx", "utf8");
  assert.ok(/needsInfo\(detail\.latest_decision\)/.test(src));
});

test("reservation page reads the method from the detail, not the order row (M-1)", async () => {
  const { readFileSync } = await import("node:fs");
  const src = readFileSync("app/checkout/complete/[order_id]/page.tsx", "utf8");
  assert.ok(src.includes("detail.chosen_method"));
  assert.ok(!src.includes("order.chosen_method"));
});
