// OD-15: the layaway gates judge the language the customer was shown.
// gateLang is the pure rule; the source guard pins the four gates to it.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const { gateLang } = await import("@/lib/i18n");
const { layawayOffered } = await import("@/lib/layaway-availability");

test("the two-tab table: what each (explicit, cookie) pair means for layaway", () => {
  const offered = (explicit, cookie) => layawayOffered(gateLang(explicit, cookie));
  assert.equal(offered("en", "ja"), true, "an English page is never refused for a stale Japanese cookie");
  assert.equal(offered("ja", "en"), false, "explicit Japanese always refuses, even with an English cookie");
  assert.equal(offered(undefined, "ja"), false, "no explicit language: the cookie rules, as before");
  assert.equal(offered(undefined, "en"), true);
  for (const bad of ["fr", "EN", "", 0, {}, null, "en-US"]) {
    assert.equal(offered(bad, "ja"), false, `invalid ${JSON.stringify(bad)} falls back to the cookie`);
    assert.equal(offered(bad, "en"), true, `invalid ${JSON.stringify(bad)} falls back to the cookie`);
  }
});

test("source guard: all four gates pass their explicit language, none is cookie-only", () => {
  const actions = readFileSync("lib/checkout-actions.ts", "utf8");
  assert.match(actions, /layawayOfferedNow\(input\.lang\)[\s\S]*LAYAWAY_UNAVAILABLE/, "quoteAction");
  assert.match(actions, /payLayawayAction\(quoteId: string, choice\?: \{ points: number \}, lang\?: string\)/, "payLayawayAction signature");
  assert.match(actions, /layawayOfferedNow\(lang\)/, "payLayawayAction gate");
  assert.match(actions, /pesoEstimateAction\(input: \{ mode: CheckoutMode; term_months: number; lang\?: string \}/, "pesoEstimateAction signature");
  assert.doesNotMatch(actions, /layawayOfferedNow\(\)/, "no cookie-only gate call remains in checkout-actions");
  const quote = readFileSync("lib/layaway.ts", "utf8");
  assert.match(quote, /layawayOfferedNow\(lang\)/, "layawayQuote");
  assert.doesNotMatch(quote, /layawayOfferedNow\(\)/);
});

test("source guard: callers pass the page language and money logic is untouched", () => {
  const flow = readFileSync("components/commerce/checkout-flow.tsx", "utf8");
  assert.match(flow, /payLayawayAction\(quote\.quote_id, \{ points \}, lang\)/);
  assert.match(flow, /pesoEstimateAction\(\{ mode, term_months: pesoTerm \|\| 6, lang \}\)/);
  assert.match(flow, /lang, \/\/ the page's language \(OD-15\)/);
  const calc = readFileSync("components/commerce/layaway-calculator.tsx", "utf8");
  assert.match(calc, /layawayQuote\(price, term, currency, lang\)/);
  // The agreement and term gates are still there, fail-closed and unconditional.
  const actions = readFileSync("lib/checkout-actions.ts", "utf8");
  assert.match(actions, /AGREEMENT_UNVERIFIED/);
  assert.match(actions, /AGREEMENT_REQUIRED/);
  assert.match(actions, /TERM_NOT_LAUNCHED/);
});
