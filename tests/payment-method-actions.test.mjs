// WEBSITE PAYMENT LIFECYCLE (task S3): "Pay another way" after a rejected
// payment. The Hub's refusal codes (POST /orders/:id/payment-method, H6) map
// to three customer-facing lines (lib/switch-method-copy.ts). Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { switchErrorKey, isSwitchMethod } = await import("@/lib/switch-method-copy");

test("a payment in progress: the in-progress line", () => {
  assert.equal(switchErrorKey("payment_in_progress"), "switchInProgress");
});

test("the Hub no longer allows the switch: the not-allowed line", () => {
  for (const code of ["not_rejected", "not_payable", "method_not_offered", "method_requires_yen", "unchanged", "already_switched"]) {
    assert.equal(switchErrorKey(code), "switchNotAllowed", code);
  }
});

test("anything else (unknown, signed out, a network failure): the failed line", () => {
  for (const code of ["failed", "signed_out", "not_found", "bad_method", "something_new", ""]) {
    assert.equal(switchErrorKey(code), "switchFailed", code);
  }
});

test("only the three checkout methods can be asked for", () => {
  for (const m of ["transfer", "paidy", "card"]) assert.equal(isSwitchMethod(m), true, m);
  for (const m of ["square", "bank_transfer", "", null, undefined, 1]) assert.equal(isSwitchMethod(m), false, String(m));
});
