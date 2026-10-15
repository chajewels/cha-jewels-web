// COUPON CODES at checkout (Hub la-tracking #527, owner 2026-10-15). The Hub
// validates and prices every code; the storefront cleans what she types, names
// the Hub's refusal and renders the Hub's figures. These tests pin the pure
// helpers and the preview Hub stand-in's contract.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { couponTyped, normalizeCouponCode, couponErrorKey, isCouponError, appliedCoupon, choiceCoupon, COUPON_ERRORS } = await import("@/lib/coupon");
const { checkoutErrorCode } = await import("@/lib/checkout-error-code");
const { amountToPayAfterPoints, layawayTotalAfterCoupon } = await import("@/lib/checkout-summary");
const { dict } = await import("@/lib/i18n");
const fx = await import("@/lib/fixtures");

test("the input box: upper-cased as typed, only A–Z 0–9 and -, at most 20", () => {
  assert.equal(couponTyped("welcome10"), "WELCOME10");
  assert.equal(couponTyped("sale 2026!"), "SALE2026");
  assert.equal(couponTyped("vip-gold_x"), "VIP-GOLDX");
  assert.equal(couponTyped("a".repeat(25)), "A".repeat(20));
});

test("the normaliser: lowercase → upper, strips spaces; rejects over 20 or bad characters", () => {
  assert.equal(normalizeCouponCode("test10"), "TEST10");
  assert.equal(normalizeCouponCode("  te st 10 "), "TEST10");
  assert.equal(normalizeCouponCode("SUMMER-26"), "SUMMER-26");
  assert.equal(normalizeCouponCode("A".repeat(20)), "A".repeat(20));
  assert.equal(normalizeCouponCode("A".repeat(21)), null);
  assert.equal(normalizeCouponCode("TEN%OFF"), null);
  assert.equal(normalizeCouponCode("クーポン"), null);
  assert.equal(normalizeCouponCode(""), null);
  assert.equal(normalizeCouponCode("   "), null);
  assert.equal(normalizeCouponCode(null), null);
  assert.equal(normalizeCouponCode(10), null);
});

test("every Hub refusal passes through the checkout error mapper untouched, with its own en + ja copy", () => {
  for (const code of COUPON_ERRORS) {
    assert.equal(isCouponError(code), true);
    assert.equal(checkoutErrorCode({ status: 409, code }), code);
    const entry = dict.checkout[couponErrorKey(code)];
    assert.ok(entry && entry.en && entry.ja, `copy for ${code}`);
  }
  assert.equal(couponErrorKey("coupon_min_subtotal"), "couponMinSubtotal");
  assert.ok(dict.checkout.couponMinSubtotal.en.includes("{min}") && dict.checkout.couponMinSubtotal.ja.includes("{min}"));
  // Not a coupon code: the existing mapping is unchanged.
  assert.equal(isCouponError("points_exceed_max"), false);
  assert.equal(checkoutErrorCode({ status: 409, code: "points_exceed_max" }), "points_unavailable");
});

test("a coupon row needs a code and a discount (an older Hub sends neither)", () => {
  assert.deepEqual(appliedCoupon({ coupon_code: "TEST10", coupon_discount: 23600 }), { code: "TEST10", discount: 23600 });
  assert.equal(appliedCoupon({}), null);
  assert.equal(appliedCoupon({ coupon_code: "TEST10", coupon_discount: 0 }), null);
  assert.equal(appliedCoupon({ coupon_code: null, coupon_discount: 500 }), null);
  assert.equal(appliedCoupon(null), null);
  assert.deepEqual(choiceCoupon({ code: "TEST10", kind: "percent", value: 10, discount_jpy: 100, discount: 100, error: null }), { code: "TEST10", discount: 100 });
  assert.equal(choiceCoupon({ code: "NOPE", error: "coupon_not_found" }), null);
  assert.equal(choiceCoupon(null), null);
});

test("headline: an applied coupon makes the Hub's total after it the figure, with no points or COD", () => {
  assert.equal(amountToPayAfterPoints({ mode: "full", quoteShown: true, pointsChosen: 0, totalAfterPoints: 212400, couponDiscount: 23600 }), 212400);
  // No coupon, no points, no COD: unchanged (no override).
  assert.equal(amountToPayAfterPoints({ mode: "full", quoteShown: true, pointsChosen: 0, totalAfterPoints: 236000, couponDiscount: 0 }), null);
  assert.equal(amountToPayAfterPoints({ mode: "full", quoteShown: false, pointsChosen: 0, totalAfterPoints: 212400, couponDiscount: 23600 }), null);
  assert.equal(amountToPayAfterPoints({ mode: "layaway", quoteShown: true, pointsChosen: 0, totalAfterPoints: 212400, couponDiscount: 23600 }), null);
  // Layaway: the Hub's total after the coupon; with points too there is none (null).
  assert.equal(layawayTotalAfterCoupon({ quoteShown: true, pointsChosen: 0, totalAfterPoints: 212400, couponDiscount: 23600 }), 212400);
  assert.equal(layawayTotalAfterCoupon({ quoteShown: true, pointsChosen: 500, totalAfterPoints: 211900, couponDiscount: 23600 }), null);
  assert.equal(layawayTotalAfterCoupon({ quoteShown: true, pointsChosen: 0, totalAfterPoints: 236000, couponDiscount: 0 }), undefined);
});

test("preview Hub: no coupon by default, TEST10 applies 10 % of the pieces, another code is refused", () => {
  const quote = fx.quoteFixture({ items: [{ variant_id: fx.products[0].product_variants[0].id, qty: 1 }], order_type: "SELF" });
  assert.equal(quote.coupon, null);
  assert.equal(quote.totals.coupon_discount, 0);
  const pieces = quote.subtotal_jpy;

  assert.equal(fx.fixtureCouponRefusal({ coupon_code: "test10" }), null);
  const applied = fx.checkoutChoiceFixture({ method: "transfer", points: 0, coupon_code: "TEST10" });
  assert.equal(applied.coupon.code, "TEST10");
  assert.equal(applied.coupon.error, null);
  assert.equal(applied.coupon.discount, Math.round(pieces / 10));
  assert.equal(applied.totals.coupon_discount, applied.coupon.discount);
  assert.equal(applied.totals.total_after_points, quote.totals.total_after_points - applied.coupon.discount);

  // Absent keeps it; GET /checkout/quote/:id carries it.
  assert.equal(fx.checkoutChoiceFixture({ method: "transfer", points: 0 }).coupon.code, "TEST10");
  assert.equal(fx.quoteByIdFixture("quote-fixture").coupon.code, "TEST10");

  assert.deepEqual(fx.fixtureCouponRefusal({ coupon_code: "nope" }), { error: "coupon_not_found", code: "NOPE" });
  assert.equal(fx.fixtureCouponRefusal({ coupon_code: "" }), null);
  assert.equal(fx.fixtureCouponRefusal({}), null);

  // "" removes it.
  const removed = fx.checkoutChoiceFixture({ method: "transfer", points: 0, coupon_code: "" });
  assert.equal(removed.coupon, null);
  assert.equal(removed.totals.total_after_points, quote.totals.total_after_points);
});

test("preview Hub: a layaway re-read after the coupon carries the plan priced on pieces − coupon", () => {
  const body = { items: [{ variant_id: fx.products[0].product_variants[0].id, qty: 1 }], order_type: "SELF", mode: "layaway", term_months: 3 };
  const before = fx.quoteFixture(body);
  fx.checkoutChoiceFixture({ method: "transfer", points: 0, coupon_code: "TEST10" });
  const after = fx.quoteByIdFixture(before.quote_id);
  assert.ok(after.layaway.deposit < before.layaway.deposit);
  assert.equal(after.quote_id, before.quote_id);
  assert.equal(fx.quoteByIdFixture("another-quote"), null);
});
