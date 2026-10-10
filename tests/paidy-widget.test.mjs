// Paidy's N-Pay widget on the product page (owner W1–W5, 2026-10-03): shown
// only on a yen price of ¥3,000 or more, with Paidy's manual attributes
// exactly; the page gates it on hub.paidyWidget().enabled (W3).
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const { paidyWidgetAttrs, paidy612Active, PAIDY_6_12_FROM, PAIDY_WIDGET_MIN_JPY, PAIDY_WIDGET_SRC } = await import(pathToFileURL(join(process.cwd(), "lib/paidy-widget.ts")).href);

test("the widget tag carries Paidy's attributes (W4) and the yen amount", () => {
  const a = paidyWidgetAttrs(20000, Date.parse("2026-10-31T23:59:59+09:00"));
  assert.deepEqual(a, {
    className: "_paidy-promotional-messaging",
    "data-amount": "20000",
    "data-alignment": "start",
    "data-font-size": "13px",
    "data-logo-color": "magenta",
    "data-display-installment-months": "",
  });
  // W5: before 1 Nov 2026 (JST) no 6/12-pay flags. No pre_kyc (W4).
  assert.ok(!("data-6-pay-enabled" in a) && !("data-12-pay-enabled" in a) && !("data-widget-version" in a));
  assert.equal(PAIDY_WIDGET_SRC, "https://cdn.paidy.com/promotional-messaging/general/paidy-upsell-widget.js");
});

test("nothing under ¥3,000, and nothing for a non-integer amount", () => {
  assert.equal(PAIDY_WIDGET_MIN_JPY, 3000);
  assert.equal(paidyWidgetAttrs(2999), null);
  assert.equal(paidyWidgetAttrs(3000.5), null);
  assert.equal(paidyWidgetAttrs(Number.NaN), null);
  assert.ok(paidyWidgetAttrs(3000));
});

test("6回・12回 switch on by themselves at 1 Nov 2026 00:00 Japan time (Paidy's notice)", () => {
  assert.equal(PAIDY_6_12_FROM, Date.parse("2026-10-31T15:00:00Z"));
  assert.equal(paidy612Active(Date.parse("2026-10-31T23:59:59.999+09:00")), false);
  assert.equal(paidy612Active(Date.parse("2026-11-01T00:00:00+09:00")), true);
  const on = paidyWidgetAttrs(20000, Date.parse("2026-11-01T00:00:00+09:00"));
  assert.equal(on["data-6-pay-enabled"], "");
  assert.equal(on["data-12-pay-enabled"], "");
  assert.equal(on["data-amount"], "20000");
});

test("the 6/12 copy exists in both languages and names the minimums and the fee footnote", async () => {
  const { dict } = await import(pathToFileURL(join(process.cwd(), "lib/i18n.ts")).href);
  const p = dict.paidy, c = dict.checkout;
  for (const k of ["lede", "lede612"]) for (const l of ["ja", "en"]) assert.ok(p[k][l], `${k}.${l}`);
  assert.match(p.lede612.ja, /3回・6回・12回/);
  assert.match(p.lede612.ja, /口座振替・銀行振込のみ無料/);
  assert.match(p.lede612.ja, /12回は12,000円以上/);
  assert.match(p.lede.ja, /口座振替・銀行振込のみ無料/);
  assert.match(p.lede612.en, /3, 6 or 12/);
  assert.match(c.methodPaidyNote612.ja, /3回・6回・12回/);
  assert.match(c.methodPaidyNote612.en, /3, 6 or 12/);
});
