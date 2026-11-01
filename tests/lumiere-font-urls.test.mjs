// The home-only font preload (lib/lumiere/font-urls.ts) names next/font's
// built URLs as constants. next/font/local names each emitted file by
// loader-utils' `[hash]` of the file content — xxhash64, hex — so the constants
// are recomputed here from the committed files with Next's own loader-utils.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { getHashDigest } = require("next/dist/compiled/loader-utils3");
const { LUMIERE_FONT_FILES, LUMIERE_FONT_DIR, lumiereFontUrl, heroFontKeys } = await import("@/lib/lumiere/font-urls");

test("every preloaded hash is xxhash64 of the committed font file (next-font-loader's [hash])", () => {
  for (const [key, { file, hash }] of Object.entries(LUMIERE_FONT_FILES)) {
    const bytes = readFileSync(`${LUMIERE_FONT_DIR}/${file}`);
    assert.equal(getHashDigest(bytes, "xxhash64", "hex", 9999), hash, `${key}: ${file}`);
    assert.equal(lumiereFontUrl(key), `/_next/static/media/${hash}.woff2`);
  }
});

test("the hero preloads the serif (+ italic in English) and Manrope, never Inter Tight", () => {
  assert.deepEqual(heroFontKeys("en"), ["instrumentSerif", "instrumentSerifItalic", "manrope"]);
  assert.deepEqual(heroFontKeys("ja"), ["instrumentSerif", "manrope"]);
  for (const lang of ["en", "ja"]) assert.ok(!heroFontKeys(lang).includes("interTight"));
});

test("app/fonts.ts still loads exactly these files with preload off and no size-adjust (the URL has no suffix)", () => {
  const fonts = readFileSync("app/fonts.ts", "utf8");
  for (const { file } of Object.values(LUMIERE_FONT_FILES)) assert.ok(fonts.includes(`/${file}"`), file);
  assert.equal((fonts.match(/^\s+preload: false,/gm) ?? []).length, 3);
  assert.equal((fonts.match(/^\s+adjustFontFallback: false,/gm) ?? []).length, 3);
});
