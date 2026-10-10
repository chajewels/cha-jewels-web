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
  assert.equal(flow.holdEnded({ since: T0, sawWindowOpen: true, windowOpen: true, now: T0 + 10 * 60_000 }), false);
});

test("H3: the hold ends once the Hub showed the window open and then ended it", () => {
  assert.equal(flow.holdEnded({ since: T0, sawWindowOpen: true, windowOpen: false, now: T0 + 60_000 }), true);
});

test("H3: the hold ends after the Hub's own 30-minute window at the latest", () => {
  assert.equal(flow.PAIDY_HOLD_MAX_MS, 30 * 60_000);
  assert.equal(flow.holdEnded({ since: T0, sawWindowOpen: false, windowOpen: true, now: T0 + 30 * 60_000 }), true);
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

