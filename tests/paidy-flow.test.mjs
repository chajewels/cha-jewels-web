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
  assert.deepEqual(flow.parseHold(JSON.stringify({ reason: "uncertain", since: T0, saw: false, paidyId: PAY })), { reason: "uncertain", since: T0, saw: false, paidyId: PAY, resent: false });
  assert.deepEqual(flow.parseHold(JSON.stringify({ reason: "uncertain", since: T0, saw: false, paidyId: PAY, resent: true })), { reason: "uncertain", since: T0, saw: false, paidyId: PAY, resent: true });
  assert.deepEqual(flow.parseHold(JSON.stringify({ reason: "uncertain", since: T0, saw: false, paidyId: "<script>" })), { reason: "uncertain", since: T0, saw: false });
});

test("L3: only a filing that never reached the Hub keeps the Paidy id", () => {
  for (const c of ["network", "timeout"]) {
    assert.deepEqual(flow.holdAfterFiling("uncertain", c, PAY, T0), { reason: "uncertain", since: T0, saw: false, paidyId: PAY, resent: false }, c);
  }
  // The Hub answered (it has seen the id), or the id is not one: nothing kept.
  for (const c of ["failed", "signed_out", "too_many_submissions", "paidy_not_offered"]) {
    assert.deepEqual(flow.holdAfterFiling("uncertain", c, PAY, T0), { reason: "uncertain", since: T0, saw: false }, c);
  }
  assert.deepEqual(flow.holdAfterFiling("releasing", "paidy_mismatch", PAY, T0), { reason: "releasing", since: T0, saw: false });
  assert.deepEqual(flow.holdAfterFiling("uncertain", "network", "nope", T0), { reason: "uncertain", since: T0, saw: false });
  assert.deepEqual(flow.holdAfterFiling("uncertain", "network", undefined, T0), { reason: "uncertain", since: T0, saw: false });
});

test("L3: the id is sent again exactly once", () => {
  const h = flow.holdAfterFiling("uncertain", "network", PAY, T0);
  assert.equal(flow.needsResend(h), true);
  assert.equal(flow.needsResend(null), false);
  assert.equal(flow.needsResend({ reason: "uncertain", since: T0, saw: false }), false);
  const after = flow.holdAfterResend(h, null);
  assert.equal(after.resent, true);
  assert.equal(flow.needsResend(after), false);
  assert.equal(after.reason, "uncertain");
  // A failed re-send is never sent a third time; the Hub's own release still applies.
  assert.equal(flow.needsResend(flow.holdAfterResend(h, "network")), false);
  assert.equal(flow.holdAfterResend(h, "network").reason, "uncertain");
  assert.equal(flow.holdAfterResend(h, "paidy_mismatch").reason, "releasing");
  assert.equal(flow.holdAfterResend(h, "submission_pending").reason, "uncertain");
});

test("L6: on reload — stale uncertain dropped, ended dropped, a pending re-send kept", () => {
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
  const p = flow.holdAfterFiling("uncertain", "timeout", PAY, T0);
  assert.equal(flow.holdOnLoad(p, false, T0 + 1000), "keep");
  assert.equal(flow.holdOnLoad(p, false, T0 + flow.PAIDY_HOLD_MAX_MS + 1), "keep");
  assert.equal(flow.holdOnLoad({ ...p, resent: true }, false, T0 + 1000), "drop");
});

test("L6: every tick — re-send first, then the hold's end, else ask the Hub again", () => {
  const u = { reason: "uncertain", since: T0, saw: false };
  assert.equal(flow.holdTick(u, false, T0 + 15_000), "poll");
  assert.equal(flow.holdTick(u, true, T0 + 15_000), "poll");
  assert.equal(flow.holdTick({ ...u, saw: true }, false, T0 + 15_000), "release");
  // The time limit is checked on every tick (a page left open ends with a reloaded one).
  assert.equal(flow.holdTick(u, true, T0 + flow.PAIDY_HOLD_MAX_MS), "release");
  const p = flow.holdAfterFiling("uncertain", "network", PAY, T0);
  assert.equal(flow.holdTick(p, false, T0 + 15_000), "resend");
  assert.equal(flow.holdTick({ ...p, saw: true }, false, T0 + 15_000), "resend");
  assert.equal(flow.holdTick({ ...p, resent: true }, false, T0 + 15_000), "poll");
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
