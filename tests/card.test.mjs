// Card payment (Square) on the order page (lib/card.ts), S3 2026-10-04.
// The Hub decides whether a card is offered; these tests pin that this side
// refuses an answer that is not whole, matches the id family to the mode,
// and builds the signing link from the Hub's figures without touching them.
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const { cardOffer, squareAppFamily, squareSdkSrc, cardSignUrl, isSquareSourceId, CARD_TERMS_VERSION } = await import(pathToFileURL(join(process.cwd(), "lib/card.ts")).href);

const offer = (over = {}) => ({
  offered: true, app_id: "sandbox-sq0idb-Mk9qGP8muuv3drWnl66GuQ", location_id: "L1TQG8H202QYA",
  test: true, amount_jpy: 236000, agreement_required: true, agreement_min_jpy: 0, ...over,
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

test("the signing link carries the order id, the reference and the Hub's amount, untouched", () => {
  const u = new URL(cardSignUrl("12fea41d-557b-4630-b0d3-4d3ed34f9efc", "CJ-W-000123", 236000, "ja"));
  assert.equal(u.origin + u.pathname, "https://agreement.chajewelsjp.com/card.html");
  assert.equal(u.searchParams.get("order"), "12fea41d-557b-4630-b0d3-4d3ed34f9efc");
  assert.equal(u.searchParams.get("invoice"), "CJ-W-000123");
  assert.equal(u.searchParams.get("amount"), "236000");
  assert.equal(u.searchParams.get("lang"), "ja");
  const u2 = new URL(cardSignUrl("12fea41d-557b-4630-b0d3-4d3ed34f9efc", null, 0, "en"));
  assert.equal(u2.searchParams.has("invoice"), false);
  assert.equal(u2.searchParams.has("amount"), false);
  assert.equal(u2.searchParams.get("lang"), "en");
});

test("a Square token shape is checked before any round trip", () => {
  assert.equal(isSquareSourceId("cnon:CBASEKhd4Z0ULAFmv1z1i7D5Q7E"), true);
  assert.equal(isSquareSourceId("ccof:customer-card-id-ok"), false, "a card-on-file id never comes from this page");
  assert.equal(isSquareSourceId("short"), false);
  assert.equal(isSquareSourceId("has space in it"), false);
  assert.equal(isSquareSourceId(123), false);
  assert.equal(CARD_TERMS_VERSION, "card-terms-v1");
});
