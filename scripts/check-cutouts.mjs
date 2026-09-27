// Keeps the hero's cut-outs and the product cut-outs apart (owner rule
// 2026-09-28): the HERO shows only cut-outs made by the original tool
// (BiRefNet-general via rembg: the Hub's `hero_cutout`, else the bundled set in
// lib/hero-cutouts.ts); PRODUCT pages and cards show only the Hub's Photoroom
// `cutout`, else the normal photo. Before this rule the bundled hero cut-outs
// were shown on eight product pages (lib/product-media.ts), and the Hub's
// Photoroom cut-out would have taken over the hero the day the Hub sent it.
//
//   1. The bundled interim set is gone (PR 5): nothing imports lib/hero-cutouts.
//   2. The product side (lib/product-media.ts, components/catalog/*, app/products/**)
//      never names a hero cut-out.
//   3. lib/hero-deck.ts never reads a Hub photo's Photoroom `cutout`: no
//      `.cutout` access at all, and usableCutout only on a hero record.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

let failed = 0;
const fail = (msg) => { failed++; console.error(`✗ ${msg}`); };

// Asserting on code, not prose: comments are stripped first.
const stripComments = (src) =>
  src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/([^:])\/\/.*$/gm, "$1");

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { if (name !== "node_modules" && !name.startsWith(".")) out.push(...walk(p)); }
    else if (/\.(ts|tsx|mjs|js)$/.test(name)) out.push(p);
  }
  return out;
}
const code = (f) => stripComments(readFileSync(f, "utf8"));

// 1.
for (const f of [...walk("app"), ...walk("components"), ...walk("lib")]) {
  const rel = relative(".", f);
  if (/["']@\/lib\/hero-cutouts["']|["'][./]+hero-cutouts["']/.test(code(f))) {
    fail(`${rel} imports lib/hero-cutouts — the bundled set was removed; hero cut-outs come from the Hub's hero record only.`);
  }
}

// 2.
const productSide = [
  "lib/product-media.ts",
  ...walk("components/catalog").filter((f) => !f.endsWith("category-stage.tsx")),
  ...walk("app/products"),
];
for (const f of productSide) {
  const m = code(f).match(/hero_cutout|heroCutout|bundledCutout|hero-cutouts/);
  if (m) fail(`${relative(".", f)} names \`${m[0]}\` — product pages and cards use the Photoroom cut-out or the normal photo only.`);
}

// 3.
const deck = code("lib/hero-deck.ts");
const access = deck.match(/\.cutout\b/g) ?? [];
if (access.length) fail(`lib/hero-deck.ts reads \`.cutout\` (${access.length}×) — the Hub's Photoroom cut-out never reaches the hero.`);
for (const call of deck.match(/usableCutout\([^)]*\)/g) ?? []) {
  if (!/cutout: h \}/.test(call)) fail(`lib/hero-deck.ts: ${call} — usableCutout may only check the hero record (h).`);
}
if (!/export function heroCutout\(/.test(deck)) fail("lib/hero-deck.ts: heroCutout (the one seam for hero cut-outs) is missing.");

if (failed) {
  console.error(`\ncheck:cutouts — ${failed} problem(s). Hero = original tool only; products = Photoroom / normal photos only.`);
  process.exit(1);
}
console.log("check:cutouts — hero and product cut-outs are separate.");
