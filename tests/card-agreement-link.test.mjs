// The signed context on the Card Purchase Agreement link (owner 5A, SQ20).
// Card.gs verifies it with the same shared secret: these tests pin the exact
// format both sides must agree on, and that no key means no token.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const mod = await import(pathToFileURL(join(process.cwd(), "lib/card-agreement-link.ts")).href);
const { cardAgreementContextToken, signCardAgreementContext, CARD_AGREEMENT_CTX_TTL_S } = mod;

const b64urlDecode = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
const input = { orderId: "12fea41d-557b-4630-b0d3-4d3ed34f9efc", customerId: "6f1c2a90-0000-4000-8000-000000000001", amountJpy: 236000 };

test("payload.base64url(HMAC-SHA256(key, payload)) with o, c, a, v:1 and e = now + 7 days", () => {
  const prev = process.env.AGREEMENT_LOOKUP_TOKEN;
  process.env.AGREEMENT_LOOKUP_TOKEN = "test-secret";
  try {
    const now = new Date("2026-10-04T00:00:00Z");
    const token = cardAgreementContextToken(input, now);
    assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, "base64url, no padding");
    const [payload, mac] = token.split(".");
    assert.deepEqual(JSON.parse(b64urlDecode(payload)), { o: input.orderId, c: input.customerId, a: 236000, v: 1, e: Math.floor(now.getTime() / 1000) + 7 * 86400 });
    assert.equal(CARD_AGREEMENT_CTX_TTL_S, 7 * 86400);
    // Exactly what Card.gs recomputes: HMAC over the base64url payload STRING.
    const expected = createHmac("sha256", "test-secret").update(payload).digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    assert.equal(mac, expected);
    // A different key gives a different signature.
    assert.notEqual(signCardAgreementContext(JSON.parse(b64urlDecode(payload)), "other"), token);
  } finally {
    if (prev === undefined) delete process.env.AGREEMENT_LOOKUP_TOKEN; else process.env.AGREEMENT_LOOKUP_TOKEN = prev;
  }
});

test("no key, or an input that is not whole, means no token (fail closed)", () => {
  const prev = process.env.AGREEMENT_LOOKUP_TOKEN;
  try {
    delete process.env.AGREEMENT_LOOKUP_TOKEN;
    assert.equal(cardAgreementContextToken(input), null);
    process.env.AGREEMENT_LOOKUP_TOKEN = "   ";
    assert.equal(cardAgreementContextToken(input), null);
    process.env.AGREEMENT_LOOKUP_TOKEN = "k";
    assert.equal(cardAgreementContextToken({ ...input, customerId: "" }), null);
    assert.equal(cardAgreementContextToken({ ...input, orderId: " " }), null);
    assert.equal(cardAgreementContextToken({ ...input, amountJpy: 0 }), null);
    assert.equal(cardAgreementContextToken({ ...input, amountJpy: 1.5 }), null);
    assert.ok(cardAgreementContextToken(input));
  } finally {
    if (prev === undefined) delete process.env.AGREEMENT_LOOKUP_TOKEN; else process.env.AGREEMENT_LOOKUP_TOKEN = prev;
  }
});

test("WEB-5: the context is signed with its own key when set, never the lookup token", () => {
  const prev = { look: process.env.AGREEMENT_LOOKUP_TOKEN, own: process.env.CARD_AGREEMENT_CTX_KEY };
  process.env.AGREEMENT_LOOKUP_TOKEN = "lookup-token-in-the-log";
  process.env.CARD_AGREEMENT_CTX_KEY = "own-ctx-key";
  try {
    const [payload, mac] = cardAgreementContextToken(input, new Date("2026-10-05T00:00:00Z")).split(".");
    const sig = (k) => createHmac("sha256", k).update(payload).digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    assert.equal(mac, sig("own-ctx-key"));
    assert.notEqual(mac, sig("lookup-token-in-the-log"));
    delete process.env.CARD_AGREEMENT_CTX_KEY;
    const [p2, m2] = cardAgreementContextToken(input, new Date("2026-10-05T00:00:00Z")).split(".");
    assert.equal(m2, createHmac("sha256", "lookup-token-in-the-log").update(p2).digest("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), "fallback until both sides have the new key");
  } finally {
    if (prev.look === undefined) delete process.env.AGREEMENT_LOOKUP_TOKEN; else process.env.AGREEMENT_LOOKUP_TOKEN = prev.look;
    if (prev.own === undefined) delete process.env.CARD_AGREEMENT_CTX_KEY; else process.env.CARD_AGREEMENT_CTX_KEY = prev.own;
  }
});
