// WEBSITE PAYMENT LIFECYCLE (Hub H6, 2026-10-05): the preview Hub stand-in
// (lib/fixtures.ts) mirrors the Hub's new optional fields — the latest
// reviewer decision, the customer method switch, the list-row state — and an
// order WITHOUT any of them (an older Hub) still reads cleanly.
// NEXT_PUBLIC_PREVIEW_REJECTED=1 adds the order whose Paidy payment was
// rejected. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.NEXT_PUBLIC_PREVIEW_REJECTED = "1";
const fx = await import("@/lib/fixtures");

test("the rejected-Paidy fixture carries the Hub's latest decision and offers a switch", () => {
  const row = fx.ordersFixture.find((o) => o.id === fx.REJECTED_ORDER_ID);
  assert.ok(row, "the rejected order is listed while the preview flag is on");
  assert.equal(row.chosen_method, "paidy");
  assert.equal(row.being_checked, false);
  assert.equal(typeof row.amount_due, "number");

  const detail = fx.orderFixture(fx.REJECTED_ORDER_ID);
  assert.ok(detail);
  assert.equal(detail.latest_decision?.status, "rejected");
  assert.equal(detail.latest_decision?.method, "paidy");
  assert.equal(typeof detail.latest_decision?.amount, "number");
  assert.equal(typeof detail.latest_decision?.decided_at, "string");
  assert.equal(detail.can_switch_method, true);
  assert.ok(Array.isArray(detail.switch_methods) && detail.switch_methods.length > 0);
  assert.ok(!detail.switch_methods.includes("paidy"), "the method she already has is never a switch target");
  assert.equal(detail.chosen_method, "paidy");
});

test("an order from an older Hub carries none of the new fields and still loads", () => {
  const detail = fx.orderFixture(fx.FIXTURE_ORDER_ID);
  assert.ok(detail);
  assert.equal(detail.latest_decision, undefined);
  assert.equal(detail.can_switch_method, undefined);
  assert.equal(detail.switch_methods, undefined);
  assert.equal(detail.order.chosen_method, undefined);
  assert.equal(detail.order.being_checked, undefined);
  assert.equal(detail.order.amount_due, undefined);
});

test("both fixtures read through orderDisplay (S1): the old-Hub one as before, the rejected one with its notice", async () => {
  const { orderDisplay } = await import("@/lib/order-display");
  const old = fx.orderFixture(fx.FIXTURE_ORDER_ID);
  const d = orderDisplay({ order: old.order, chosenMethod: old.chosen_method ?? old.order.chosen_method, beingChecked: old.order.being_checked ?? false, latestDecision: old.latest_decision });
  assert.deepEqual(d, { headlineKey: null, stage: 3, stage3Key: "stagePayment", notice: null, payBlocked: false });
  const rej = fx.orderFixture(fx.REJECTED_ORDER_ID);
  const r = orderDisplay({ order: rej.order, chosenMethod: rej.chosen_method, beingChecked: false, latestDecision: rej.latest_decision });
  assert.equal(r.notice, "rejected");
  assert.equal(r.stage3Key, "stagePaymentPaidy");
  assert.equal(r.payBlocked, false);
});
