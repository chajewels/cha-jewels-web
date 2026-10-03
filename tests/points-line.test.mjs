// Loyalty points line on the product page (lib/points-line.ts), 2026-10-03.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const { pointsLineFrom, formatPoints } = await import(pathToFileURL(join(process.cwd(), "lib/points-line.ts")).href);

const V = "00000000-0000-4000-8000-000000000001";
const item = (over = {}) => ({ variant_id: V, eligible: true, points: 3000, base_points: 3000, promo_points: 0, multiplier: 2, tier: "Radiant", upgraded_to: null, ...over });
const preview = (over = {}, it = {}) => ({ enabled: true, enrolled: true, tier: "Radiant", multiplier: 2, items: [item(it)], ...over });

test("member: the Hub's figure, level and multiplier, unchanged", () => {
  assert.deepEqual(pointsLineFrom(preview(), V), { kind: "member", points: 3000, bonus: 0, tier: "Radiant", multiplier: 2, upgraded: false });
});

test("L1: the level this purchase takes her to", () => {
  const l = pointsLineFrom(preview({}, { tier: "Elite", upgraded_to: "Elite" }), V);
  assert.equal(l.upgraded, true);
  assert.equal(l.tier, "Elite");
});

test("L2: a running promotion shows its bonus separately", () => {
  const l = pointsLineFrom(preview({}, { points: 3600, promo_points: 600 }), V);
  assert.equal(l.points, 3000);
  assert.equal(l.bonus, 600);
});

test("L3: a signed-in non-member sees the join line with the entry-level figure", () => {
  assert.deepEqual(pointsLineFrom(preview({ enrolled: false, tier: null }, { base_points: 1500, points: 1500, tier: "Glimmer", multiplier: 1 }), V), { kind: "join", points: 1500 });
});

test("nothing is shown when there is nothing true to say", () => {
  assert.equal(pointsLineFrom(null, V), null);
  assert.equal(pointsLineFrom(preview({ enabled: false, items: [] }), V), null);
  assert.equal(pointsLineFrom(preview({}, { eligible: false, points: 0, base_points: 0 }), V), null);
  assert.equal(pointsLineFrom(preview({}, { variant_id: "other" }), V), null);
});

test("points are formatted with separators, never rounded up", () => {
  assert.equal(formatPoints(12000), "12,000");
  assert.equal(formatPoints(300), "300");
});
