// Paidy's N-Pay widget on the product page (owner W1–W5, 2026-10-03): shown
// only on a yen price of ¥3,000 or more, with Paidy's manual attributes
// exactly; the page gates it on hub.paidyWidget().enabled (W3).
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const { paidyWidgetAttrs, PAIDY_WIDGET_MIN_JPY, PAIDY_WIDGET_SRC } = await import(pathToFileURL(join(process.cwd(), "lib/paidy-widget.ts")).href);

test("the widget tag carries Paidy's attributes (W4) and the yen amount", () => {
  const a = paidyWidgetAttrs(20000);
  assert.deepEqual(a, {
    className: "_paidy-promotional-messaging",
    "data-amount": "20000",
    "data-alignment": "start",
    "data-font-size": "13px",
    "data-logo-color": "magenta",
    "data-display-installment-months": "",
  });
  // W5: 6/12-pay only after Paidy activates them — not yet. No pre_kyc (W4).
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
