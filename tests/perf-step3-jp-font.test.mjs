// SEO Step 3 (Master Plan §33.3): the Japanese heading font is fetched after load.
// Source-level guards, in the repo's style. Run: npm run test:unit.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const read = (f) => readFileSync(join(process.cwd(), f), "utf8");
const css = read("app/globals.css");
const layout = read("app/layout.tsx");
const gate = read("components/site/jp-font-gate.tsx");

test("globals.css: before window load --font-jp is the metric-adjusted fallback, at top level (unlayered)", () => {
  const rule = 'html:not([data-jp-font]) { --font-jp: "Noto Serif JP Fallback"; }';
  const at = css.indexOf(rule);
  assert.ok(at > 0, "the gate rule is present");
  // brace depth 0 at the rule = outside @layer / @media, so it outranks next/font's unlayered class
  let depth = 0;
  for (const ch of css.slice(0, at)) { if (ch === "{") depth++; else if (ch === "}") depth--; }
  assert.equal(depth, 0, "rule is not inside @layer or @media");
  assert.equal(css.split("html:not([data-jp-font])").length - 1, 1, "exactly one rule keys off the attribute");
});

test("the heading rules still name --font-jp, so after load Noto Serif JP applies unchanged", () => {
  assert.match(css, /:lang\(ja\) \.hd-title \{ font-family: var\(--font-jp\)/);
  assert.match(css, /\.story-q:lang\(ja\) \{ font-family: var\(--font-jp\)/);
  assert.match(read("tailwind.config.ts"), /jp: \["var\(--font-jp\)"/);
});

test("layout: the gate renders on the Japanese site only, and the font declaration is unchanged", () => {
  assert.match(layout, /\{lang === "ja" && <JpFontGate \/>\}/);
  assert.match(layout, /Noto_Serif_JP\(\{ subsets: \["latin"\], weight: \["500"\], variable: "--font-jp", display: "swap" \}\)/);
});

test("gate: sets data-jp-font on <html> at window load, or at once if already loaded; renders nothing", () => {
  assert.match(gate, /document\.readyState === "complete"/);
  assert.match(gate, /addEventListener\("load", on, \{ once: true \}\)/);
  assert.match(gate, /setAttribute\("data-jp-font", ""\)/);
  assert.match(gate, /removeEventListener\("load", on\)/);
  assert.match(gate, /return null;/);
});
