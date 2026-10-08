// Paidy ato-barai on the order page (lib/paidy.ts), 2026-10-03.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const { paidyOffer, pendingSubmissions, paidyStatus } = await import(pathToFileURL(join(process.cwd(), "lib/paidy.ts")).href);

const checkout = (over = {}) => ({
  amount: 236800, currency: "JPY", buyer: { name1: "Preview Customer" },
  buyer_data: { user_id: "CJ-2026-00008", ltv: 0, account_registration_date: "2026-09-01" },
  order: { items: [{ quantity: 1, unit_price: 236000 }] }, shipping_address: { zip: "124-0012", line1: "1-1-1" }, ...over,
});
const detail = (paidy, order = {}) => ({ order: { currency: "JPY", ...order }, paidy });
const offer = (over = {}) => ({ offered: true, public_key: "pk_test_abc", test: true, checkout: checkout(), ...over });

test("the Hub's whole offer is rendered as sent", () => {
  const p = paidyOffer(detail(offer()));
  assert.ok(p);
  assert.equal(p.checkout.amount, 236800);
});

test("no offer, offered:false, or an older Hub → nothing", () => {
  assert.equal(paidyOffer(detail(undefined)), null);
  assert.equal(paidyOffer(detail(null)), null);
  assert.equal(paidyOffer(detail(offer({ offered: false }))), null);
});

test("an offer that cannot open a working window is refused", () => {
  assert.equal(paidyOffer(detail(offer({ public_key: "sk_test_never" }))), null);
  assert.equal(paidyOffer(detail(offer({ public_key: "" }))), null);
  assert.equal(paidyOffer(detail(offer({ checkout: checkout({ amount: 0 }) }))), null);
  assert.equal(paidyOffer(detail(offer({ checkout: checkout({ currency: "PHP" }) }))), null);
  assert.equal(paidyOffer(detail(offer({ checkout: checkout({ shipping_address: {} }) }))), null);
  assert.equal(paidyOffer(detail(offer(), { currency: "PHP" })), null);
});

test("only submitted / under_review count as pending", () => {
  const subs = [
    { id: "a", status: "submitted" }, { id: "b", status: "rejected" }, { id: "c", status: "under_review" }, { id: "d", status: "confirmed" },
  ];
  assert.deepEqual(pendingSubmissions({ pending_submissions: subs }).map((s) => s.id), ["a", "c"]);
  assert.deepEqual(pendingSubmissions({}), []);
});

test("the closed-callback status is read case-insensitively (Paidy sends lower case)", () => {
  assert.equal(paidyStatus("authorized"), "AUTHORIZED");
  assert.equal(paidyStatus("AUTHORIZED"), "AUTHORIZED");
  assert.equal(paidyStatus("rejected"), "REJECTED");
  assert.equal(paidyStatus("closed"), "CLOSED");
  // PA15A (2026-10-09): an answer we cannot read is UNKNOWN — it keeps the window.
  assert.equal(paidyStatus(undefined), "UNKNOWN");
  assert.equal(paidyStatus(""), "UNKNOWN");
  assert.equal(paidyStatus("anything-else"), "UNKNOWN");
});

// Follow-up 2026-10-04 (owner): while Paidy holds the order, no way to pay.
test("paidyProcessing follows the Hub's payment_state only", async () => {
  const { paidyProcessing } = await import(pathToFileURL(join(process.cwd(), "lib/paidy.ts")).href);
  assert.equal(paidyProcessing({ payment_state: "paidy_processing" }), true);
  assert.equal(paidyProcessing({ payment_state: "payment_pending" }), false);
  assert.equal(paidyProcessing({ payment_state: null }), false);
  assert.equal(paidyProcessing({}), false);
});
