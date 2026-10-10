// Paidy QC PR-B (owner go 2026-10-09): the Paidy button's state rules
// (lib/paidy-flow.ts) and the Paidy wording guards. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const flow = await import(pathToFileURL(join(process.cwd(), "lib/paidy-flow.ts")).href);
const legal = await import(pathToFileURL(join(process.cwd(), "lib/content/legal.ts")).href);

const T0 = 1_000_000;

test("H3: a hold never ends on a timer alone before the Hub's window length", () => {
  assert.equal(flow.holdEnded({ since: T0, sawWindowOpen: false, windowOpen: false, now: T0 + 30_000 }), false);
  assert.equal(flow.holdEnded({ since: T0, sawWindowOpen: false, windowOpen: false, now: T0 + 29 * 60_000 }), false);
  assert.equal(flow.holdEnded({ since: T0, sawWindowOpen: false, windowOpen: true, now: T0 + 89 * 60_000 }), false);
  assert.equal(flow.holdEnded({ since: T0, sawWindowOpen: true, windowOpen: true, now: T0 + 10 * 60_000 }), false);
});

test("H3: the hold ends once the Hub showed the window open and then ended it", () => {
  assert.equal(flow.holdEnded({ since: T0, sawWindowOpen: true, windowOpen: false, now: T0 + 60_000 }), true);
});

test("H3 / second-hold fix: the hold ends after 90 minutes at the latest (window + hourly check)", () => {
  assert.equal(flow.PAIDY_HOLD_MAX_MS, 90 * 60_000);
  assert.equal(flow.holdEnded({ since: T0, sawWindowOpen: false, windowOpen: true, now: T0 + 90 * 60_000 }), true);
});

test("H3: after Paidy approved, the button never simply comes back", () => {
  assert.equal(flow.afterAuthorized(null), "filed");
  for (const c of ["failed", "signed_out", "timeout", "network"]) assert.equal(flow.afterAuthorized(c), "uncertain", c);
  for (const c of ["submission_pending", "payment_in_progress"]) assert.equal(flow.afterAuthorized(c), "refresh", c);
  // "releasing" only where the Hub itself releases the hold (review fix 3).
  assert.equal(flow.afterAuthorized("paidy_mismatch"), "releasing");
  for (const c of ["paidy_bad_id", "paidy_not_offered", "not_ready_for_payment", "too_many_submissions", "something_new"]) {
    assert.equal(flow.afterAuthorized(c), "uncertain", c);
  }
});

test("M8: an action that throws or never answers becomes a calm code", async () => {
  const fb = (code) => ({ ok: false, code });
  assert.deepEqual(await flow.safeAction(async () => { throw new Error("Failed to fetch"); }, 1000, fb), { ok: false, code: "network" });
  assert.deepEqual(await flow.safeAction(() => new Promise(() => {}), 20, fb), { ok: false, code: "timeout" });
  assert.deepEqual(await flow.safeAction(async () => ({ ok: true, data: 1 }), 1000, fb), { ok: true, data: 1 });
});

test("S-L2: Paidy opens only with a whole start answer", () => {
  const id = "0b3e4c2a-9f1d-4a6b-8c7e-1d2f3a4b5c6d";
  assert.equal(flow.startAnswerUsable({ attempt_id: id, checkout: { amount: 1000, currency: "JPY" } }), true);
  assert.equal(flow.startAnswerUsable({ attempt_id: id, checkout: { amount: 0, currency: "JPY" } }), false);
  assert.equal(flow.startAnswerUsable({ attempt_id: id, checkout: { amount: 1000, currency: "PHP" } }), false);
  assert.equal(flow.startAnswerUsable({ attempt_id: id, checkout: null }), false);
  assert.equal(flow.startAnswerUsable({ attempt_id: "nope", checkout: { amount: 1000, currency: "JPY" } }), false);
  assert.equal(flow.startAnswerUsable(null), false);
});

// --- L3 / L6 (Paidy QC 2026-10-10): the hold rules, out of the component ---

const PAY = "pay_asDHekoAAEkAmsmA";

test("L6: a stored hold is read only when it is one this code wrote", () => {
  assert.equal(flow.parseHold(null), null);
  assert.equal(flow.parseHold("not json"), null);
  assert.equal(flow.parseHold(JSON.stringify({ reason: "filed", since: T0, saw: false })), null);
  assert.equal(flow.parseHold(JSON.stringify({ reason: "uncertain", since: "x", saw: false })), null);
  assert.deepEqual(flow.parseHold(JSON.stringify({ reason: "uncertain", since: T0, saw: true })), { reason: "uncertain", since: T0, saw: true });
  assert.deepEqual(flow.parseHold(JSON.stringify({ reason: "releasing", since: T0 })), { reason: "releasing", since: T0, saw: false });
  // L3: a Paidy id survives only when it looks like one.
  const stored = { reason: "uncertain", since: T0, saw: false, paidyId: PAY, pending: true, resends: 1, failedAt: T0 + 5, page: "p1" };
  assert.deepEqual(flow.parseHold(JSON.stringify(stored)), stored);
  assert.deepEqual(flow.parseHold(JSON.stringify({ reason: "uncertain", since: T0, saw: false, paidyId: "<script>" })), { reason: "uncertain", since: T0, saw: false });
  // A count we cannot read never allows a re-send (fail closed, never a loop).
  assert.equal(flow.parseHold(JSON.stringify({ ...stored, resends: "x" })).resends, flow.PAIDY_MAX_RESENDS);
  assert.equal(flow.parseHold(JSON.stringify({ ...stored, resends: 99 })).resends, flow.PAIDY_MAX_RESENDS);
});

test("L3 / review L-1: the Paidy id is kept whenever the Hub never saw it", () => {
  // network / timeout: no answer. failed: a non-Hub error between the site's
  // server and the Hub, or a Hub 5xx before it read the id. signed_out: refused
  // before any Hub call (no session) or by the Hub's sign-in check before the body.
  for (const c of ["network", "timeout", "failed", "signed_out"]) {
    assert.equal(flow.hubNeverSawId(c), true, c);
    assert.deepEqual(flow.holdAfterFiling("uncertain", c, PAY, T0, "p1"), { reason: "uncertain", since: T0, saw: false, paidyId: PAY, pending: true, resends: 0, failedAt: T0, page: "p1" }, c);
  }
  // The Hub's own refusal of an id it has read: nothing to re-send.
  for (const c of ["too_many_submissions", "paidy_not_offered", "submission_pending", "not_ready_for_payment"]) {
    assert.equal(flow.hubNeverSawId(c), false, c);
    assert.deepEqual(flow.holdAfterFiling("uncertain", c, PAY, T0, "p1"), { reason: "uncertain", since: T0, saw: false }, c);
  }
  assert.equal(flow.hubNeverSawId(null), false);
  assert.deepEqual(flow.holdAfterFiling("releasing", "paidy_mismatch", PAY, T0, "p1"), { reason: "releasing", since: T0, saw: false });
  assert.deepEqual(flow.holdAfterFiling("uncertain", "network", "nope", T0, "p1"), { reason: "uncertain", since: T0, saw: false });
  assert.deepEqual(flow.holdAfterFiling("uncertain", "network", undefined, T0, "p1"), { reason: "uncertain", since: T0, saw: false });
});

test("M-1: no re-send at the moment of the failure — only one poll interval later", () => {
  const h = flow.holdAfterFiling("uncertain", "network", PAY, T0, "p1");
  assert.equal(flow.resendDue(h, T0, "p1"), false);
  assert.equal(flow.holdTick(h, false, T0, "p1"), "poll");
  assert.equal(flow.holdTick(h, false, T0 + flow.PAIDY_POLL_MS - 1, "p1"), "poll");
  assert.equal(flow.resendDue(h, T0 + flow.PAIDY_POLL_MS, "p1"), true);
  assert.equal(flow.holdTick(h, false, T0 + flow.PAIDY_POLL_MS, "p1"), "resend");
  // Even when the Hub's window already looks ended, the due re-send goes first.
  assert.equal(flow.holdTick({ ...h, saw: true }, false, T0 + flow.PAIDY_POLL_MS, "p1"), "resend");
  // And the hold is not released under an id the Hub has never seen while the first re-send is still to come.
  assert.equal(flow.holdTick({ ...h, saw: true }, false, T0 + 1000, "p1"), "poll");
});

test("M-1: at most two re-sends per approval, the second only after a reload, never a loop", () => {
  const P = flow.PAIDY_POLL_MS;
  let h = flow.holdAfterFiling("uncertain", "network", PAY, T0, "p1");
  // First re-send, same page, one interval later; counted before the call.
  h = flow.holdBeforeResend(h, T0 + P, "p1");
  assert.equal(h.resends, 1);
  assert.equal(flow.resendDue(h, T0 + 10 * P, "p1"), false, "never twice from one page load");
  h = flow.holdAfterResend(h, "network", T0 + P + 100);
  assert.equal(h.pending, true);
  // Same page: no further re-send, ever.
  assert.equal(flow.resendDue(h, T0 + 100 * P, "p1"), false);
  // Reload (new page id): kept on load, due one interval after the last failure.
  assert.equal(flow.holdOnLoad(h, false, T0 + P + 200), "keep");
  assert.equal(flow.resendDue(h, T0 + P + 200, "p2"), false);
  assert.equal(flow.holdTick(h, false, T0 + P + 200, "p2"), "poll");
  assert.equal(flow.resendDue(h, T0 + 2 * P + 100, "p2"), true);
  h = flow.holdBeforeResend(h, T0 + 2 * P + 100, "p2");
  h = flow.holdAfterResend(h, "timeout", T0 + 2 * P + 200);
  assert.equal(h.resends, flow.PAIDY_MAX_RESENDS);
  // Exhausted: no page, no time makes it due again.
  for (const page of ["p1", "p2", "p3"]) assert.equal(flow.resendDue(h, T0 + 1000 * P, page), false, page);
  assert.equal(flow.resendPossible(h), false);
  // A reload into an exhausted hold falls back to the normal rules (stale uncertain dropped).
  assert.equal(flow.holdOnLoad(h, false, T0 + 3 * P), "drop");
});

test("L3: any Hub answer to a re-send ends the re-sending", () => {
  const h = flow.holdBeforeResend(flow.holdAfterFiling("uncertain", "failed", PAY, T0, "p1"), T0 + 20_000, "p1");
  for (const c of [null, "submission_pending", "paidy_not_offered", "too_many_submissions"]) {
    const after = flow.holdAfterResend(h, c, T0 + 21_000);
    assert.equal(after.pending, false, String(c));
    assert.equal(after.reason, "uncertain", String(c));
    assert.equal(flow.resendDue(after, T0 + 1e9, "p9"), false, String(c));
  }
  assert.equal(flow.holdAfterResend(h, "paidy_mismatch", T0 + 21_000).reason, "releasing");
  for (const c of ["network", "timeout", "failed", "signed_out"]) assert.equal(flow.holdAfterResend(h, c, T0 + 21_000).pending, true, c);
});

test("L6: on reload — stale uncertain dropped, ended dropped, a possible re-send kept", () => {
  const u = { reason: "uncertain", since: T0, saw: false };
  const r = { reason: "releasing", since: T0, saw: false };
  assert.equal(flow.holdOnLoad(null, false, T0), "none");
  // An "uncertain" hold with no open window on the Hub is stale.
  assert.equal(flow.holdOnLoad(u, false, T0 + 1000), "drop");
  assert.equal(flow.holdOnLoad(u, true, T0 + 1000), "keep");
  assert.equal(flow.holdOnLoad({ ...u, saw: true }, true, T0 + 1000), "keep");
  // Past the Hub's window length: over.
  assert.equal(flow.holdOnLoad(u, true, T0 + flow.PAIDY_HOLD_MAX_MS), "drop");
  // A releasing hold waits for the Hub even with no open window, until it saw one end.
  assert.equal(flow.holdOnLoad(r, false, T0 + 1000), "keep");
  assert.equal(flow.holdOnLoad({ ...r, saw: true }, false, T0 + 1000), "drop");
  // L3: an approved id the Hub never received is sent first — even over the stale rule.
  const p = flow.holdAfterFiling("uncertain", "timeout", PAY, T0, "p1");
  assert.equal(flow.holdOnLoad(p, false, T0 + 1000), "keep");
  assert.equal(flow.holdOnLoad(p, false, T0 + flow.PAIDY_HOLD_MAX_MS + 1), "keep");
  assert.equal(flow.holdOnLoad({ ...p, pending: false }, false, T0 + 1000), "drop");
});

test("L6: every tick — a due re-send first, then the hold's end, else ask the Hub again", () => {
  const u = { reason: "uncertain", since: T0, saw: false };
  assert.equal(flow.holdTick(u, false, T0 + 15_000, "p1"), "poll");
  assert.equal(flow.holdTick(u, true, T0 + 15_000, "p1"), "poll");
  assert.equal(flow.holdTick({ ...u, saw: true }, false, T0 + 15_000, "p1"), "release");
  // The time limit is checked on every tick (a page left open ends with a reloaded one).
  assert.equal(flow.holdTick(u, true, T0 + flow.PAIDY_HOLD_MAX_MS, "p1"), "release");
  // A re-send that is possible only after a reload does not keep this page's hold.
  const once = flow.holdAfterResend(flow.holdBeforeResend(flow.holdAfterFiling("uncertain", "network", PAY, T0, "p1"), T0 + 15_000, "p1"), "network", T0 + 15_100);
  assert.equal(flow.holdTick({ ...once, saw: true }, false, T0 + 30_000, "p1"), "release");
});

test("review L-2: a permanent start refusal is 'not available', only a transient one is 'try again'", () => {
  // Unnamed Hub 4xx (409 method_not_chosen, 404 order_not_found …): permanent for this page.
  for (const st of [400, 404, 409, 422]) assert.equal(flow.startFailureCode("failed", st), "paidy_not_offered", String(st));
  // No Hub answer, or a Hub 5xx: transient.
  for (const st of [null, 500, 502, 503]) assert.equal(flow.startFailureCode("failed", st), "failed", String(st));
  // Codes already named pass through.
  for (const c of ["signed_out", "too_many_submissions", "billing_address_invalid", "not_ready_for_payment", "paidy_not_offered"]) {
    assert.equal(flow.startFailureCode(c, 409), c);
  }
  // And the page's mapping on top: "failed" → the start's try-again line; paidy_not_offered keeps its own.
  assert.deepEqual(flow.startRefusal(flow.startFailureCode("failed", 409)), { hold: false, code: "paidy_not_offered" });
  assert.deepEqual(flow.startRefusal(flow.startFailureCode("failed", 503)), { hold: false, code: "start_failed" });
});

test("L6: Paidy's closed-callback answer — file, hold or end the window", () => {
  assert.equal(flow.closedOutcome("AUTHORIZED", true), "file");
  // Approved but no id: never end the window.
  assert.equal(flow.closedOutcome("AUTHORIZED", false), "hold");
  assert.equal(flow.closedOutcome("REJECTED", true), "end_rejected");
  assert.equal(flow.closedOutcome("REJECTED", false), "end_rejected");
  assert.equal(flow.closedOutcome("CLOSED", true), "end_closed");
  assert.equal(flow.closedOutcome("CLOSED", false), "end_closed");
  // PA15A: an answer we cannot read is never a close.
  assert.equal(flow.closedOutcome("UNKNOWN", true), "hold");
  assert.equal(flow.closedOutcome("UNKNOWN", false), "hold");
});

test("M1 / L4: a refused start — payment_in_progress is the hold; failures get the start's words", () => {
  assert.deepEqual(flow.startRefusal("payment_in_progress"), { hold: true });
  for (const c of ["failed", "network", "timeout"]) assert.deepEqual(flow.startRefusal(c), { hold: false, code: "start_failed" }, c);
  for (const c of ["paidy_not_offered", "billing_address_invalid", "signed_out", "too_many_submissions", "not_ready_for_payment", "submission_pending"]) {
    assert.deepEqual(flow.startRefusal(c), { hold: false, code: c }, c);
  }
});

// --- Wording guards -------------------------------------------------------

const i18n = await import(pathToFileURL(join(process.cwd(), "lib/i18n.ts")).href);
const t = (lang) => i18n.tr(lang);

test("S-C1: the footer chip uses Paidy's prescribed name", () => {
  assert.match(t("ja")("footer", "paidy"), /あと払い（ペイディ）/);
  assert.doesNotMatch(t("ja")("footer", "paidy"), /Paidyあと払い/);
});

test("S-C3: the Japanese lede says who Paidy is for, like the English", () => {
  for (const k of ["lede", "lede612"]) {
    assert.match(t("ja")("paidy", k), /日本国内にお住まいのお客様向け/, k);
    assert.match(t("en")("paidy", k), /customers living in Japan/, k);
  }
});

test("S-C4 / widget rule: Paidy's condition is about the customer, never a delivery address", () => {
  for (const lang of ["en", "ja"]) {
    const why = t(lang)("checkout", "methodWhyPaidyJp");
    assert.doesNotMatch(why, /delivery address|お届け先/, lang);
  }
  assert.match(t("en")("checkout", "methodWhyPaidyJp"), /living in Japan/);
  assert.match(t("ja")("checkout", "methodWhyPaidyJp"), /日本国内にお住まい/);
});

test("M9: the declined and not-completed notices never say she closed Paidy herself", () => {
  for (const lang of ["en", "ja"]) {
    for (const k of ["rejected", "windowOpenTitle", "windowOpenBody", "windowOpenBodyNoReopen"]) {
      assert.doesNotMatch(t(lang)("paidy", k), /It looks like you closed|ようです|another way to pay\.$/, `${lang}.${k}`);
    }
  }
  assert.doesNotMatch(t("en")("paidy", "windowOpenBodyNoReopen"), /open Paidy again/);
  assert.match(t("en")("paidy", "windowOpenBody"), /open Paidy again/);
});

test("S-C2: the legal notice carries Paidy's own 特商法 wording", () => {
  const src = JSON.stringify(legal);
  // Owner 2026-10-10: コンビニ決済 stays listed until the owner says otherwise.
  assert.match(src, /コンビニ決済、あと払い（ペイディ）/);
  assert.match(src, /コンビニ払い（コンビニ設置端末）、銀行振込及び口座振替/);
  assert.match(src, /口座振替の場合は27日に引き落しとなります/);
  assert.match(src, /最大390円（税込）/);
});


test("L4: the start failure never speaks of recording; ja contact line ends with 。; errMismatch is gone", () => {
  assert.equal(t("en")("paidy", "errStartFailed"), "We could not open Paidy just now. Nothing was charged. Please try again in a moment.");
  assert.equal(t("ja")("paidy", "errStartFailed"), "ただいまペイディを開けませんでした。お支払いは発生していません。少し時間をおいて再度お試しください。");
  for (const lang of ["en", "ja"]) assert.doesNotMatch(t(lang)("paidy", "errStartFailed"), /record|登録/);
  assert.match(t("ja")("orders", "paidyContactToSwitch"), /。$/);
  assert.match(t("en")("orders", "paidyContactToSwitch"), /\.$/);
  assert.ok(!("errMismatch" in i18n.dict.paidy));
});

test("COD (owner 2026-10-10): the Paidy notices never list only transfer and card", () => {
  for (const lang of ["en", "ja"]) {
    for (const k of ["rejected", "windowOpenBody", "windowOpenBodyNoReopen"]) {
      const v = t(lang)("paidy", k);
      assert.doesNotMatch(v, /銀行振込とカード|bank transfer and card/, `${lang}.${k}`);
      assert.match(v, /他のお支払い方法|other ways to pay/, `${lang}.${k}`);
    }
  }
});
