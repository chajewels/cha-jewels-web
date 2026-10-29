// SEO Step 3a (Master Plan §33.3): the Japanese heading font is fetched after load,
// on the Japanese home page only. Source-level and rule-level guards, in the repo's
// style. The rendered behaviour is checked in a real browser by
// scripts/check-jp-font-live.mjs. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const { deferJpFont } = await import("@/lib/jp-font-defer");
const read = (f) => readFileSync(join(process.cwd(), f), "utf8");
const css = read("app/globals.css");
const layout = read("app/layout.tsx");
const gate = read("components/site/jp-font-gate.tsx");

test("deferJpFont: the Japanese home page only", () => {
  assert.equal(deferJpFont("ja", "/ja"), true);
  assert.equal(deferJpFont("ja", "/ja/"), true);
});

test("deferJpFont: no other Japanese page, no English page, no missing path", () => {
  for (const p of ["/ja/collections/rings", "/ja/categories/preloved-jewelry", "/ja/about", "/ja/products/x", "/ja/legal/tokusho", "/jazz", "/", "/account", "/checkout", "", null, undefined]) {
    assert.equal(deferJpFont("ja", p), false, String(p));
  }
  for (const p of ["/en", "/ja", "/en/collections/rings", null]) assert.equal(deferJpFont("en", p), false, `en ${p}`);
});

test("globals.css: before window load, on a deferring page only, --font-jp is the metric-adjusted fallback, at top level (unlayered)", () => {
  const rule = 'html[data-jp-defer]:not([data-jp-font]) { --font-jp: "Noto Serif JP Fallback"; }';
  const at = css.indexOf(rule);
  assert.ok(at > 0, "the gate rule is present");
  let depth = 0;
  for (const ch of css.slice(0, at)) { if (ch === "{") depth++; else if (ch === "}") depth--; }
  assert.equal(depth, 0, "rule is not inside @layer or @media");
  assert.equal(css.split("html[data-jp-defer]:not([data-jp-font])").length - 1, 1, "exactly one rule keys off the attributes");
  assert.equal(css.includes("html:not([data-jp-font])"), false, "no rule defers the font on every page");
});

test("the heading rules still name --font-jp, so after load Noto Serif JP applies unchanged", () => {
  assert.match(css, /:lang\(ja\) \.hd-title \{ font-family: var\(--font-jp\)/);
  assert.match(css, /\.story-q:lang\(ja\) \{ font-family: var\(--font-jp\)/);
  assert.match(read("tailwind.config.ts"), /jp: \["var\(--font-jp\)"/);
});

test("layout: <html> carries data-jp-defer and the gate renders only when the page defers; the font declaration is unchanged", () => {
  assert.match(layout, /const deferJp = deferJpFont\(lang, h\.get\(PATH_HEADER\)\);/);
  assert.match(layout, /\{\.\.\.\(deferJp \? \{ "data-jp-defer": "" \} : \{\}\)\}/);
  assert.match(layout, /\{deferJp && <JpFontGate \/>\}/);
  assert.equal(layout.includes('lang === "ja" && <JpFontGate'), false, "the gate no longer renders on every Japanese page");
  assert.match(layout, /Noto_Serif_JP\(\{ subsets: \["latin"\], weight: \["500"\], variable: "--font-jp", display: "swap" \}\)/);
});

test("gate: sets data-jp-font on <html> at window load, or at once if already loaded; renders nothing", () => {
  assert.match(gate, /document\.readyState === "complete"/);
  assert.match(gate, /addEventListener\("load", on, \{ once: true \}\)/);
  assert.match(gate, /setAttribute\("data-jp-font", ""\)/);
  assert.match(gate, /removeEventListener\("load", on\)/);
  assert.match(gate, /return null;/);
});
