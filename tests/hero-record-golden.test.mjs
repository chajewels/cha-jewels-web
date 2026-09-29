// HERO_RECORD MODE UNCHANGED (hero order PART 4, 2026-09-29). While the Hub's
// switch is `hero_record` the category response carries no `hero_place` and no
// `picked_at`, and the deck must be exactly what it was before ticks mode
// existed. tests/golden/hero-record-deck.json was written by the code on
// develop BEFORE this change (9e29f57), from the preview catalogue
// (lib/fixtures.ts, no preview switches): every slide, both languages, with the
// empty-category switch off and on, plus stagePieces for every category.
// Regenerate only on purpose: UPDATE_GOLDEN=1 npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";

const { hub } = await import("@/lib/hub-api");
const fx = await import("@/lib/fixtures");
const { buildHeroDeck, stagePieces } = await import("@/lib/hero-deck");

const GOLDEN = new URL("./golden/hero-record-deck.json", import.meta.url);

async function snapshot() {
  // The test stand-in for the Hub client (tests/alias-hooks.mjs) answers from the fixtures.
  hub.category = async (slug) => {
    const c = fx.categories.find((x) => x.slug === slug);
    return c ? { ...c, products: fx.products.filter((p) => (p.category_slugs ?? []).includes(slug)) } : null;
  };
  const out = {};
  for (const lang of ["en", "ja"]) {
    for (const hide of ["", "1"]) {
      process.env.HERO_HIDE_EMPTY_CATEGORIES = hide;
      out[`deck:${lang}:hide=${hide || "off"}`] = await buildHeroDeck(lang, fx.categories);
    }
    for (const c of fx.categories) {
      out[`stage:${lang}:${c.slug}`] = stagePieces(fx.products.filter((p) => (p.category_slugs ?? []).includes(c.slug)), lang);
    }
  }
  delete process.env.HERO_HIDE_EMPTY_CATEGORIES;
  return JSON.parse(JSON.stringify(out));
}

test("hero_record mode: the deck and the category stages are exactly as before ticks mode", async () => {
  const now = await snapshot();
  if (process.env.UPDATE_GOLDEN === "1") writeFileSync(GOLDEN, `${JSON.stringify(now, null, 1)}\n`);
  assert.deepEqual(now, JSON.parse(readFileSync(GOLDEN, "utf8")));
});
