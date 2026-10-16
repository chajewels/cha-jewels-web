// ARTICLE COMMENTS (owner plan C1–C8, 2026-10-16): the body bounds the form and
// the Server Action share, and how a Hub answer becomes the one code the form
// renders (lib/comments.ts runCommentAction, with a mock Hub call).
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";

const { COMMENT_MIN, COMMENT_MAX, cleanCommentBody, commentFailure, runCommentAction } = await import("@/lib/comments");

class FakeHubError extends Error {
  constructor(status, code, requestId = null) { super("hub"); this.status = status; this.code = code; this.requestId = requestId; }
}
const live = { jwt: "jwt-1", expired: false };

test("bounds are the Hub's: 1–1000 characters after trimming", () => {
  assert.equal(COMMENT_MIN, 1);
  assert.equal(COMMENT_MAX, 1000);
  assert.equal(cleanCommentBody("  hello \n"), "hello");
  assert.equal(cleanCommentBody("a"), "a");
  assert.equal(cleanCommentBody("x".repeat(1000)), "x".repeat(1000));
  assert.equal(cleanCommentBody(`  ${"x".repeat(1000)}  `), "x".repeat(1000), "surrounding spaces do not count");
  assert.equal(cleanCommentBody("x".repeat(1001)), null);
  for (const bad of ["", "   ", "\n\t", null, undefined, 42, {}]) assert.equal(cleanCommentBody(bad), null, String(bad));
});

test("no session or an expired one → sign_in, and the Hub is never asked", async () => {
  let called = 0;
  const call = async () => { called++; return {}; };
  assert.deepEqual(await runCommentAction(null, "hi", call), { ok: false, code: "sign_in", requestId: null });
  assert.deepEqual(await runCommentAction({ jwt: "x", expired: true }, "hi", call), { ok: false, code: "sign_in", requestId: null });
  assert.equal(called, 0);
});

test("a body outside the bounds → body_invalid before the Hub is asked", async () => {
  let called = 0;
  const call = async () => { called++; return {}; };
  assert.equal((await runCommentAction(live, "   ", call)).code, "body_invalid");
  assert.equal((await runCommentAction(live, "x".repeat(1001), call)).code, "body_invalid");
  assert.equal(called, 0);
});

test("success: the trimmed body and the JWT reach the Hub; onSuccess runs once", async () => {
  const seen = [];
  let revalidated = 0;
  const res = await runCommentAction(live, "  nice article  ", async (jwt, body) => { seen.push([jwt, body]); return { id: "c1" }; }, () => revalidated++);
  assert.deepEqual(res, { ok: true, data: { id: "c1" } });
  assert.deepEqual(seen, [["jwt-1", "nice article"]]);
  assert.equal(revalidated, 1);
});

test("a delete sends no body and skips the bounds check", async () => {
  const res = await runCommentAction(live, undefined, async (_jwt, body) => ({ body }));
  assert.deepEqual(res, { ok: true, data: { body: "" } });
});

test("every documented Hub refusal maps to its own code, with the Hub's Ref", async () => {
  const cases = [
    [401, "customer_auth_required", "sign_in"],
    [403, "email_unverified", "email_unverified"],
    [422, "email_required_for_account", "email_required_for_account"],
    [404, "customer_not_linked", "customer_not_linked"],
    [404, "not_found", "not_found"],
    [409, "comments_closed", "comments_closed"],
    [409, "comment_locked", "comment_locked"],
    [422, "body_invalid", "body_invalid"],
    [429, "rate_limited", "rate_limited"],
    [422, "lang_invalid", "error"],
    [500, null, "error"],
    [502, "something_new", "error"],
  ];
  for (const [status, code, want] of cases) {
    let revalidated = 0;
    const res = await runCommentAction(live, "hi", async () => { throw new FakeHubError(status, code, "req-9"); }, () => revalidated++);
    assert.deepEqual(res, { ok: false, code: want, requestId: "req-9" }, `${status} ${code}`);
    assert.equal(revalidated, 0, "nothing is revalidated on a refusal");
  }
});

test("a 401 with no code is still sign_in; the Hub cannot smuggle in 'sign_in' or 'error' as a code", () => {
  assert.equal(commentFailure(new FakeHubError(401, null)).code, "sign_in");
  assert.equal(commentFailure(new FakeHubError(400, "sign_in")).code, "error");
});

test("a network failure (not a HubError) → error with no Ref; never throws", async () => {
  const res = await runCommentAction(live, "hi", async () => { throw new TypeError("fetch failed"); });
  assert.deepEqual(res, { ok: false, code: "error", requestId: null });
  assert.deepEqual(commentFailure(undefined), { ok: false, code: "error", requestId: null });
});
