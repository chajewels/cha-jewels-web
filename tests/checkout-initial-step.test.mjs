// Where checkout opens on a ?quote= return (lib/checkout-initial-step.ts).
// Run: npm run test:unit (node --test with --experimental-strip-types; the
// module imports only types, so node loads it directly).
import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const { initialCheckoutState } = await import(
  pathToFileURL(join(process.cwd(), "lib/checkout-initial-step.ts")).href
);

const layawayQuote = { quote_id: "q-lay", mode: "layaway", settlement_currency: "PHP", layaway: { term_months: 3 } };
const fullQuote = { quote_id: "q-full", mode: "full", settlement_currency: "JPY" };
const unsigned = { signed: false, version: null, signed_at: null };
const signed = { signed: true, version: "v3", signed_at: "2026-09-27T10:00:00Z" };
const EN = true; // layawayOffered("en")
const JA = false; // layawayOffered("ja")

test("JA + layaway quote: Step 1, quote and agreement dropped", () => {
  for (const agreement of [null, unsigned, signed]) {
    assert.deepEqual(initialCheckoutState(layawayQuote, agreement, JA), { step: 1, quote: null, agreement: null });
  }
});

test("EN + layaway quote, unsigned: signing step, quote kept", () => {
  assert.deepEqual(initialCheckoutState(layawayQuote, unsigned, EN), { step: "sign", quote: layawayQuote, agreement: unsigned });
  assert.deepEqual(initialCheckoutState(layawayQuote, null, EN), { step: "sign", quote: layawayQuote, agreement: null });
});

test("EN + layaway quote, signed: signing step (owner decision 2026-09-19), signature kept", () => {
  assert.deepEqual(initialCheckoutState(layawayQuote, signed, EN), { step: "sign", quote: layawayQuote, agreement: signed });
});

test("JA and EN + full quote: Review, quote kept", () => {
  for (const ok of [JA, EN]) {
    assert.deepEqual(initialCheckoutState(fullQuote, null, ok), { step: 2, quote: fullQuote, agreement: null });
  }
});

test("A quote without a mode (older Hub) is a full payment: Review in both languages", () => {
  const legacy = { quote_id: "q-old" };
  for (const ok of [JA, EN]) assert.equal(initialCheckoutState(legacy, null, ok).step, 2);
});

test("No quote: Step 1 in both languages", () => {
  for (const ok of [JA, EN]) {
    assert.deepEqual(initialCheckoutState(null, null, ok), { step: 1, quote: null, agreement: null });
  }
});
