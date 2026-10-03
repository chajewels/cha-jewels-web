// Search-result text (lib/meta-text.ts) — launch pass 2026-10-02.
// Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { join } from "node:path";

const { clampText, productTitle, productMetaDescription } = await import(pathToFileURL(join(process.cwd(), "lib/meta-text.ts")).href);

test("short product names keep the site template", () => {
  assert.equal(productTitle("R1013 Ring K18WG"), "R1013 Ring K18WG");
});

test("long product names are shown alone, without the suffix", () => {
  const long = "W1154 Watch Louis Vuitton Tambour Quartz Stainless Steel Shell 15-17.5cm [Preloved]";
  assert.deepEqual(productTitle(long), { absolute: long });
});

test("descriptions are clamped to 160 at a word, with an ellipsis", () => {
  const d = "word ".repeat(80);
  const out = clampText(d, 160);
  assert.ok(out.length <= 160, out.length);
  assert.ok(out.endsWith("…"));
  assert.ok(!out.includes("  "));
});

test("a product with no description gets a plain line in its language", () => {
  assert.equal(productMetaDescription("E10GS Earrings", null, "en"), "E10GS Earrings at Cha Jewels, Tokyo. Shipping worldwide.");
  assert.equal(productMetaDescription("E10GS ピアス", "", "ja"), "E10GS ピアス。Cha Jewels（東京）から世界中へ配送。");
});

test("the fallback never mentions layaway or an origin", () => {
  for (const lang of ["en", "ja"]) {
    const s = productMetaDescription("X", null, lang);
    assert.doesNotMatch(s, /layaway|分割|レイアウェイ|Made in Japan|日本製/i);
  }
});
