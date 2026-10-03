// Weight is shown with two decimals everywhere on the site (owner, 2026-10-03):
// the Hub stores weight_g as numeric(8,2) and its editor shows "8.80" (Hub
// #326), but JSON drops the trailing zero (8.80 → 8.8) and the site printed
// the raw number — "8.8 g" on the product page, cards, cart and brand pages.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const { formatWeight } = await import(pathToFileURL(join(process.cwd(), "lib/utils.ts")).href);

test("a weight is always two decimals with the unit", () => {
  assert.equal(formatWeight(8.8), "8.80 g");
  assert.equal(formatWeight(19), "19.00 g");
  assert.equal(formatWeight(2.2), "2.20 g");
  assert.equal(formatWeight(16.2), "16.20 g");
  assert.equal(formatWeight(0.98), "0.98 g");
  assert.equal(formatWeight(3.345), "3.35 g");
});

test("no weight → no line, never 0.00 g", () => {
  assert.equal(formatWeight(null), null);
  assert.equal(formatWeight(undefined), null);
  assert.equal(formatWeight(0), null);
  assert.equal(formatWeight(Number.NaN), null);
});
