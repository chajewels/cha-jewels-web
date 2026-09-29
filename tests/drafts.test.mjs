// Website orders (Hub PR 6 / storefront PR 7): the storefront's draft rules
// (lib/drafts.ts). Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const { isDraftPayResult, draftCompletePath, confirmedDestination, listableDraft } = await import(
  pathToFileURL(join(process.cwd(), "lib/drafts.ts")).href
);

test("a draft pay answer is recognised by draft_id, an order or plan answer is not", () => {
  assert.equal(isDraftPayResult({ draft_id: "d1", web_reference: "CJ-W-900070" }), true);
  assert.equal(isDraftPayResult({ order_id: "o1", web_reference: "CJ-W-900070" }), false);
  assert.equal(isDraftPayResult({ mode: "layaway", account_id: "a1" }), false);
  assert.equal(isDraftPayResult(null), false);
  assert.equal(isDraftPayResult({ draft_id: 12 }), false);
});

test("the draft page path is encoded", () => {
  assert.equal(draftCompletePath("abc"), "/checkout/complete/d/abc");
  assert.equal(draftCompletePath("a/b"), "/checkout/complete/d/a%2Fb");
});

test("a confirmed draft moves on to the real order or plan (W2-9); a waiting one stays", () => {
  assert.equal(confirmedDestination({ order_id: "o1", account_id: null }), "/account/orders/o1");
  assert.equal(confirmedDestination({ order_id: null, account_id: "a1" }), "/account/layaway/a1");
  assert.equal(confirmedDestination({ order_id: null, account_id: null }), null);
});

test("the account lists show waiting, declined and expired drafts, never a confirmed one", () => {
  assert.equal(listableDraft({ status: "to_confirm" }), true);
  assert.equal(listableDraft({ status: "declined" }), true);
  assert.equal(listableDraft({ status: "expired" }), true);
  assert.equal(listableDraft({ status: "confirmed" }), false);
});
