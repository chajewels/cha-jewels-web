// The checkout order summary's figures (lib/checkout-summary.ts), above all the
// peso summary before the checkout quote exists.
// Run: npm run test:unit (node --test with --experimental-strip-types; the
// module imports only types, so node loads it directly).
import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const { checkoutSummary } = await import(
  pathToFileURL(join(process.cwd(), "lib/checkout-summary.ts")).href
);

const SUBTOTAL = 158980;
const idle = { status: "idle" };
const loading = { status: "loading" };
const unavailable = { status: "unavailable" };
const ok = { status: "ok", estimate: { total: 61682, deposit: 18505, monthly: 7196 } };
const pesoQuote = {
  quote_id: "q1", mode: "full", settlement_currency: "PHP",
  subtotal_jpy: 158980, shipping_jpy: 3000, total_jpy: 161980,
  subtotal_settlement: 61682, shipping_settlement: 1164, total_settlement: 62846,
};
const yenQuote = { ...pesoQuote, settlement_currency: "JPY", subtotal_settlement: null, shipping_settlement: null, total_settlement: null };

test("pesos, Step 1, estimate loaded: the Hub's peso figures, marked as an estimate, yen beside", () => {
  const s = checkoutSummary({ quote: null, intended: "PHP", subtotal: SUBTOTAL, mode: "full", peso: ok });
  assert.equal(s.currency, "PHP");
  assert.equal(s.subtotal, 61682);
  assert.equal(s.total, 61682);
  assert.equal(s.shipping, null);
  assert.equal(s.estimate, true);
  assert.equal(s.yenTotal, SUBTOTAL);
  assert.equal(s.pesoPending, false);
  // A full payment shows no plan figures.
  assert.equal(s.deposit, null);
  assert.equal(s.monthly, null);
});

test("pesos, Step 1, layaway: the estimate's deposit and monthly", () => {
  const s = checkoutSummary({ quote: null, intended: "PHP", subtotal: SUBTOTAL, mode: "layaway", peso: ok });
  assert.equal(s.deposit, 18505);
  assert.equal(s.monthly, 7196);
  assert.equal(s.total, 61682);
  assert.equal(s.estimate, true);
});

test("pesos, no rate or any failure: the yen figures and 'shown at the next step' — never a bare total", () => {
  const s = checkoutSummary({ quote: null, intended: "PHP", subtotal: SUBTOTAL, mode: "full", peso: unavailable });
  assert.equal(s.currency, "JPY");
  assert.equal(s.total, SUBTOTAL);
  assert.equal(s.subtotal, SUBTOTAL);
  assert.equal(s.pesoPending, true);
  assert.equal(s.estimate, false);
});

test("pesos, estimate still loading (or not asked yet): the yen figures, no note yet", () => {
  for (const peso of [loading, idle]) {
    const s = checkoutSummary({ quote: null, intended: "PHP", subtotal: SUBTOTAL, mode: "layaway", peso });
    assert.equal(s.currency, "JPY");
    assert.equal(s.total, SUBTOTAL);
    assert.equal(s.pesoPending, false);
    assert.equal(s.deposit, null);
  }
});

test("the total is never null before a quote, whatever the currency or estimate state", () => {
  for (const intended of ["JPY", "PHP"]) {
    for (const peso of [idle, loading, unavailable, ok]) {
      for (const mode of ["full", "layaway"]) {
        const s = checkoutSummary({ quote: null, intended, subtotal: SUBTOTAL, mode, peso });
        assert.notEqual(s.total, null, `${intended} ${peso.status} ${mode}`);
      }
    }
  }
});

test("a peso quote: its exact figures (not an estimate), with its own yen total beside", () => {
  const s = checkoutSummary({ quote: pesoQuote, intended: "PHP", subtotal: SUBTOTAL, mode: "full", peso: ok });
  assert.deepEqual(
    { c: s.currency, sub: s.subtotal, ship: s.shipping, tot: s.total, est: s.estimate, yen: s.yenTotal },
    { c: "PHP", sub: 61682, ship: 1164, tot: 62846, est: false, yen: 161980 },
  );
});

test("toggle moved to pesos after a yen quote: back to the estimate", () => {
  const s = checkoutSummary({ quote: yenQuote, intended: "PHP", subtotal: SUBTOTAL, mode: "full", peso: ok });
  assert.equal(s.estimate, true);
  assert.equal(s.total, 61682);
});

test("yen is unchanged: cart figures before a quote, the quote's after, no peso extras", () => {
  const pre = checkoutSummary({ quote: null, intended: "JPY", subtotal: SUBTOTAL, mode: "full", peso: ok });
  assert.deepEqual(
    { c: pre.currency, sub: pre.subtotal, ship: pre.shipping, tot: pre.total, est: pre.estimate, yen: pre.yenTotal, pend: pre.pesoPending },
    { c: "JPY", sub: SUBTOTAL, ship: null, tot: SUBTOTAL, est: false, yen: null, pend: false },
  );
  const post = checkoutSummary({ quote: yenQuote, intended: "JPY", subtotal: SUBTOTAL, mode: "full", peso: idle });
  assert.deepEqual({ tot: post.total, ship: post.shipping, yen: post.yenTotal }, { tot: 161980, ship: 3000, yen: null });
});
