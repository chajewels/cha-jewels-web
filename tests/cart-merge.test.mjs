// Cart reminders (storefront A5): the saved-cart merge rules (lib/cart-merge.ts).
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const { mergeCartLines, toHubLines, sameLines, MAX_CART_LINES } = await import(
  pathToFileURL(join(process.cwd(), "lib/cart-merge.ts")).href
);
const { CART_REMINDER_TEXT_VERSION } = await import(pathToFileURL(join(process.cwd(), "lib/cart-reminders.ts")).href);

test("union: cookie first, saved lines appended, the larger quantity wins", () => {
  const merged = mergeCartLines(
    [{ v: "a", s: "ring-a", q: 1 }, { v: "b", s: "ring-b", q: 2 }],
    [{ variant_id: "b", qty: 3, slug: "ring-b" }, { variant_id: "c", qty: 1, slug: "ring-c" }],
  );
  assert.deepEqual(merged, [{ v: "a", s: "ring-a", q: 1 }, { v: "b", s: "ring-b", q: 3 }, { v: "c", s: "ring-c", q: 1 }]);
});

test("an empty cookie takes the saved cart; an empty saved cart leaves the cookie as it was", () => {
  assert.deepEqual(mergeCartLines([], [{ variant_id: "a", qty: 2, slug: "ring-a" }]), [{ v: "a", s: "ring-a", q: 2 }]);
  const cookie = [{ v: "a", s: "ring-a", q: 1 }];
  assert.deepEqual(mergeCartLines(cookie, []), cookie);
});

test("a saved line the Hub no longer names (no slug) is dropped; quantities are clamped 1..20; 20 lines max", () => {
  assert.deepEqual(mergeCartLines([], [{ variant_id: "gone", qty: 1, slug: "" }]), []);
  assert.deepEqual(mergeCartLines([{ v: "a", s: "ring-a", q: 99 }], [{ variant_id: "b", qty: 0, slug: "ring-b" }]),
    [{ v: "a", s: "ring-a", q: 20 }, { v: "b", s: "ring-b", q: 1 }]);
  const many = Array.from({ length: 25 }, (_, i) => ({ variant_id: `v${i}`, qty: 1, slug: `s${i}` }));
  assert.equal(mergeCartLines([], many).length, MAX_CART_LINES);
  assert.equal(MAX_CART_LINES, 20);
});

test("what is sent to the Hub is variant, qty and slug only — never a price", () => {
  const sent = toHubLines([{ v: "a", s: "ring-a", q: 2 }, { v: "", s: "x", q: 1 }, { v: "b", s: "ring-b", q: 0 }]);
  assert.deepEqual(sent, [{ variant_id: "a", qty: 2, slug: "ring-a" }]);
  for (const line of sent) assert.deepEqual(Object.keys(line).sort(), ["qty", "slug", "variant_id"]);
});

test("sameLines is order- and quantity-sensitive, so a no-op merge writes no cookie", () => {
  assert.equal(sameLines([{ v: "a", s: "s", q: 1 }], [{ v: "a", s: "s", q: 1 }]), true);
  assert.equal(sameLines([{ v: "a", s: "s", q: 1 }], [{ v: "a", s: "s", q: 2 }]), false);
  assert.equal(sameLines([{ v: "a", s: "s", q: 1 }, { v: "b", s: "s", q: 1 }], [{ v: "b", s: "s", q: 1 }, { v: "a", s: "s", q: 1 }]), false);
});

test("the consent wording version is pinned (bump it with the words, never silently)", () => {
  assert.equal(CART_REMINDER_TEXT_VERSION, "cart-reminder-2026-10");
});
