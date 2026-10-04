// Card payment (Square) on the order page (lib/card.ts), S3 2026-10-04.
// The Hub decides whether a card is offered; these tests pin that this side
// refuses an answer that is not whole, matches the id family to the mode,
// and builds the signing link from the Hub's figures without touching them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { cardOffer, squareAppFamily, squareSdkSrc, cardSignUrl, isSquareSourceId, CARD_TERMS_VERSION, CARD_VERIFICATION, CARD_AGREEMENT_RESIGN, cardAgreementGate, cardBilling, cardRefusalCode } = await import(pathToFileURL(join(process.cwd(), "lib/card.ts")).href);
const { BILLING_COUNTRIES, UNMAPPED_COUNTRIES, billingCountryCode } = await import(pathToFileURL(join(process.cwd(), "lib/billing-countries.ts")).href);

const offer = (over = {}) => ({
  offered: true, app_id: "sandbox-sq0idb-Mk9qGP8muuv3drWnl66GuQ", location_id: "L1TQG8H202QYA",
  test: true, amount_jpy: 236000, agreement_required: true, agreement_min_jpy: 0,
  customer_id: "6f1c2a90-0000-4000-8000-000000000001", cardholder_name: "Maria Santos", ...over,
});
const detail = (card, order = {}) => ({ order: { currency: "JPY", ...order }, card });

test("a whole sandbox offer under test mode is rendered as-is", () => {
  const c = cardOffer(detail(offer()));
  assert.ok(c);
  assert.equal(c.amount_jpy, 236000);
  assert.equal(c.agreement_required, true);
});

test("a whole production offer under live mode is rendered", () => {
  assert.ok(cardOffer(detail(offer({ app_id: "sq0idp-AbCdEfGhIjKl", test: false }))));
});

test("nothing whole, nothing rendered", () => {
  assert.equal(cardOffer(detail(undefined)), null);
  assert.equal(cardOffer(detail(null)), null);
  assert.equal(cardOffer(detail(offer({ offered: false }))), null);
  assert.equal(cardOffer(detail(offer({ app_id: "" }))), null);
  assert.equal(cardOffer(detail(offer({ app_id: "sk_live_never" }))), null);
  assert.equal(cardOffer(detail(offer({ location_id: " " }))), null);
  assert.equal(cardOffer(detail(offer({ amount_jpy: 0 }))), null);
  assert.equal(cardOffer(detail(offer({ amount_jpy: 12.5 }))), null);
  assert.equal(cardOffer(detail(offer(), { currency: "PHP" })), null);
});

test("the id family must agree with the mode — never the wrong Square", () => {
  assert.equal(cardOffer(detail(offer({ app_id: "sq0idp-AbCdEfGhIjKl", test: true }))), null);
  assert.equal(cardOffer(detail(offer({ test: false }))), null);
  assert.equal(squareAppFamily("sandbox-sq0idb-Mk9qGP8muuv3drWnl66GuQ"), "sandbox");
  assert.equal(squareAppFamily("sq0idp-AbCdEfGhIjKl"), "production");
  assert.equal(squareAppFamily("sq0idb-x"), null);
});

test("the SDK follows the environment", () => {
  assert.equal(squareSdkSrc(true), "https://sandbox.web.squarecdn.com/v1/square.js");
  assert.equal(squareSdkSrc(false), "https://web.squarecdn.com/v1/square.js");
});

test("the signing link carries the order id, the reference, the Hub's amount and the signed context, untouched", () => {
  const u = new URL(cardSignUrl("12fea41d-557b-4630-b0d3-4d3ed34f9efc", "CJ-W-000123", 236000, "ja", "eyJv.sig"));
  assert.equal(u.origin + u.pathname, "https://agreement.chajewelsjp.com/card.html");
  assert.equal(u.searchParams.get("order"), "12fea41d-557b-4630-b0d3-4d3ed34f9efc");
  assert.equal(u.searchParams.get("invoice"), "CJ-W-000123");
  assert.equal(u.searchParams.get("amount"), "236000");
  assert.equal(u.searchParams.get("lang"), "ja");
  assert.equal(u.searchParams.get("ctx"), "eyJv.sig");
  const u2 = new URL(cardSignUrl("12fea41d-557b-4630-b0d3-4d3ed34f9efc", null, 0, "en", "x.y"));
  assert.equal(u2.searchParams.has("invoice"), false);
  assert.equal(u2.searchParams.has("amount"), false);
  assert.equal(u2.searchParams.get("lang"), "en");
});

// ---- the agreement gate (owner 5A, SQ20) ----
const signed = (over = {}) => ({ ok: true, signed: true, version: "card-2026-v1", signedAt: "2026-10-04T01:00:00Z", bound: true, customerId: offer().customer_id, amountJpy: 236000, ...over });

test("the gate passes only for THIS customer and THIS exact amount, and hands the Hub the lookup's answer", () => {
  const g = cardAgreementGate(signed(), offer());
  assert.equal(g.gate, "form");
  assert.deepEqual(g.agreement, { version: "card-2026-v1", signed_at: "2026-10-04T01:00:00Z", customer_id: offer().customer_id, amount_jpy: 236000, bound: true });
});

test("a changed amount asks for a new signature — strict equality, no tolerance", () => {
  assert.deepEqual(cardAgreementGate(signed({ amountJpy: 235999 }), offer()), { gate: "resign", reason: "amount" });
  assert.deepEqual(cardAgreementGate(signed({ amountJpy: 236001 }), offer()), { gate: "resign", reason: "amount" });
  assert.deepEqual(cardAgreementGate(signed({ amountJpy: null }), offer()), { gate: "resign", reason: "amount" });
});

test("an unbound (legacy) signature or another customer's asks for a new signature", () => {
  assert.deepEqual(cardAgreementGate(signed({ bound: false }), offer()), { gate: "resign", reason: "unbound" });
  assert.deepEqual(cardAgreementGate(signed({ customerId: "someone-else" }), offer()), { gate: "resign", reason: "unbound" });
  assert.deepEqual(cardAgreementGate(signed({ customerId: null }), offer()), { gate: "resign", reason: "unbound" });
});

test("not signed, could not check, and an older Hub without the customer id stay their own answers", () => {
  assert.deepEqual(cardAgreementGate({ ok: true, signed: false }, offer()), { gate: "sign" });
  assert.deepEqual(cardAgreementGate({ ok: false }, offer()), { gate: "unverified" });
  assert.deepEqual(cardAgreementGate(signed(), offer({ customer_id: undefined })), { gate: "unverified" });
  assert.equal(CARD_AGREEMENT_RESIGN, "agreement_resign");
});

// ---- the cardholder (owner 4A, SQ17) ----
const delivery = { line1: "1-2-3 Tateishi", line2: "Room 4", city: "Katsushika-ku", region: "Tokyo", postal_code: "124-0012", country: "JP" };
const form = (over = {}) => ({ name: "Maria Santos", sameAsDelivery: true, country: "", postalCode: "", state: "", city: "", line1: "", line2: "", ...over });

test("same as delivery: the delivery address, the cardholder's own name in one field", () => {
  const b = cardBilling(form(), { ...delivery, recipient_name: "Gift Recipient" });
  assert.equal(b.ok, true);
  assert.deepEqual(b.square, { givenName: "Maria Santos", addressLines: ["1-2-3 Tateishi", "Room 4"], city: "Katsushika-ku", state: "Tokyo", postalCode: "124-0012", countryCode: "JP" });
  assert.deepEqual(b.hub, { name: "Maria Santos", same_as_delivery: true, country: "JP", address_line_1: "1-2-3 Tateishi", address_line_2: "Room 4", locality: "Katsushika-ku", administrative_district_level_1: "Tokyo", postal_code: "124-0012" });
  assert.equal(JSON.stringify(b).includes("Gift Recipient"), false, "the recipient's name never reaches Square or the Hub");
  assert.equal("familyName" in b.square, false, "names are never split");
});

test("a typed billing address replaces the delivery address; the name is still the field", () => {
  const b = cardBilling(form({ name: "  Juan dela Cruz ", sameAsDelivery: false, country: "ph", city: "Makati", line1: "88 Ayala Ave", postalCode: "1226" }), delivery);
  assert.equal(b.ok, true);
  assert.deepEqual(b.square, { givenName: "Juan dela Cruz", addressLines: ["88 Ayala Ave"], city: "Makati", postalCode: "1226", countryCode: "PH" });
  assert.equal(b.hub.same_as_delivery, false);
  assert.equal(b.hub.country, "PH");
});

test("the cardholder name and a usable address are required", () => {
  assert.deepEqual(cardBilling(form({ name: "   " }), delivery), { ok: false, code: "billing_name_required" });
  assert.deepEqual(cardBilling(form(), null), { ok: false, code: "billing_address_required" });
  assert.deepEqual(cardBilling(form({ sameAsDelivery: false, country: "JP", city: "Tokyo" }), delivery), { ok: false, code: "billing_address_required" });
  assert.deepEqual(cardBilling(form({ sameAsDelivery: false, country: "ZZ", city: "Tokyo", line1: "x" }), delivery), { ok: false, code: "billing_address_required" });
});

test("every country in the Hub's list has an ISO code; Japan and the Philippines come first", () => {
  assert.deepEqual(UNMAPPED_COUNTRIES, []);
  assert.equal(BILLING_COUNTRIES[0].code, "JP");
  assert.equal(BILLING_COUNTRIES[1].code, "PH");
  const codes = BILLING_COUNTRIES.map((c) => c.code);
  assert.equal(new Set(codes).size, codes.length, "no code twice");
  assert.ok(codes.every((c) => /^[A-Z]{2}$/.test(c)));
  assert.equal(billingCountryCode("jp"), "JP");
  assert.equal(billingCountryCode("Japan"), null);
  assert.equal(billingCountryCode("VN"), "VN");
});

// ---- truthful outcomes (SQ22) ----
test("'nothing was charged' only where it is established; anything uncertain is 'unconfirmed'", () => {
  const c = (status, code, body = null) => cardRefusalCode({ status, code, body });
  assert.equal(c(402, "card_declined", { code: "GENERIC_DECLINE" }), "card_declined");
  assert.equal(c(402, "card_declined", { order_cancelled: true }), "card_declined_cancelled");
  assert.equal(c(409, "card_mismatch", { detail: "amount", hold: "voided" }), "card_mismatch");
  assert.equal(c(409, "card_mismatch", { detail: "INVALID_CARD_DATA" }), "failed", "a refused request is not a mismatch");
  assert.equal(c(409, "card_mismatch", { detail: "cancelled", hold: "voided" }), "failed");
  assert.equal(c(402, "card_declined", { code: "risk_high", hold: "held" }), "card_hold_unfiled", "an approved hold still on the card is never 'not charged'");
  assert.equal(c(402, "card_declined", { code: "risk_high", hold: "voided", order_cancelled: true }), "card_declined_cancelled");
  assert.equal(c(409, "card_mismatch", { hold: "void_pending" }), "card_mismatch_void_pending");
  assert.equal(c(409, "card_attempt_pending"), "card_attempt_pending");
  assert.equal(c(409, "amount_changed", { amount_jpy: 230000 }), "amount_changed");
  assert.equal(c(409, "agreement_missing"), "agreement_required");
  assert.equal(c(409, "agreement_resign"), "agreement_resign");
  assert.equal(c(409, "card_hold_unfiled"), "card_hold_unfiled");
  assert.equal(c(409, "paidy_in_progress", { hold: "voided" }), "submission_pending", "Paidy holds the order: no card payment");
  assert.equal(c(409, "payment_in_progress"), "submission_pending");
  assert.equal(c(429, "too_many_attempts", { scope: "order" }), "too_many_attempts");
  assert.equal(c(502, "card_unavailable"), "card_unavailable");
  assert.equal(c(500, null), "unconfirmed", "a Hub 5xx may come after Square answered");
  assert.equal(c(503, "something_new"), "unconfirmed");
  assert.equal(c(409, "something_new"), "unconfirmed");
  assert.equal(c(401, null), "signed_out");
  assert.equal(CARD_VERIFICATION, "sdk_tokenize_with_verification");
});

test("a Square token shape is checked before any round trip", () => {
  assert.equal(isSquareSourceId("cnon:CBASEKhd4Z0ULAFmv1z1i7D5Q7E"), true);
  assert.equal(isSquareSourceId("ccof:customer-card-id-ok"), false, "a card-on-file id never comes from this page");
  assert.equal(isSquareSourceId("short"), false);
  assert.equal(isSquareSourceId("has space in it"), false);
  assert.equal(isSquareSourceId(123), false);
  assert.equal(CARD_TERMS_VERSION, "card-terms-v1");
});
