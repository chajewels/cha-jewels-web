// QC P3-8 (task S5): a checkout refusal reads "sold out" ONLY for a genuine
// stock refusal. Every 409 the Hub's checkout routes can answer is listed here
// (website/index.ts CHECKOUT_ERROR_STATUS + the inline 409s of /checkout/*),
// with the code the customer sees. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { checkoutErrorCode } = await import("@/lib/checkout-error-code");

const HUB_CHECKOUT_409 = {
  // stock: someone bought it, or it was taken off sale
  out_of_stock: "sold_out",
  variant_missing: "sold_out",
  product_unavailable: "sold_out",
  // the quote aged out
  quote_expired: "expired",
  quote_already_used: "expired",
  // the rest are never "sold out"
  transfer_unavailable: "transfer_unavailable",
  below_plan_minimum: "below_plan_minimum",
  checkout_mode_not_draft: "failed",
  method_full_payment_only: "method_unavailable",
  method_requires_yen: "method_unavailable",
  method_unavailable: "method_unavailable",
  points_unavailable: "points_unavailable",
  points_not_enrolled: "points_unavailable",
  points_insufficient: "points_unavailable",
  points_exceed_subtotal: "points_unavailable",
  points_exceed_deposit: "points_unavailable",
};

test("every Hub checkout 409 maps to its own code", () => {
  for (const [code, want] of Object.entries(HUB_CHECKOUT_409)) {
    assert.equal(checkoutErrorCode({ status: 409, code }), want, code);
  }
});

test("an unlisted 409 is 'failed', never 'sold out'", () => {
  assert.equal(checkoutErrorCode({ status: 409, code: "something_new" }), "failed");
  assert.equal(checkoutErrorCode({ status: 409, code: null }), "failed");
});

test("auth and unknown failures", () => {
  assert.equal(checkoutErrorCode({ status: 401, code: null }), "signed_out");
  assert.equal(checkoutErrorCode({ status: 403, code: "forbidden" }), "signed_out");
  assert.equal(checkoutErrorCode({ status: 500, code: "boom" }), "failed");
  assert.equal(checkoutErrorCode(null), "failed");
});

test("codes kept from before", () => {
  assert.equal(checkoutErrorCode({ status: 404, code: "quote_not_found" }), "expired");
  assert.equal(checkoutErrorCode({ status: 400, code: "shipping_quote_required" }), "manual_quote");
  assert.equal(checkoutErrorCode({ status: 400, code: "agreement_missing" }), "agreement_required");
  assert.equal(checkoutErrorCode({ status: 503, code: "fx_rate_missing" }), "rate_unavailable");
  assert.equal(checkoutErrorCode({ status: 400, code: "bad_points" }), "points_unavailable");
});
