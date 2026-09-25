// No browser-side money maths in customer-facing code (owner rule 2026-09-25:
// every customer-facing money figure comes from the Hub; the storefront never
// computes or converts).
//
// What this catches is the arithmetic that shipped before the rule and was
// removed with it:
//   - a percentage applied to a price       Math.round(price * 0.3)
//   - a currency conversion                  toPhp(jpy, rate), jpy * jpy_php
//   - a hardcoded rate fallback              { jpy_php: 0.39 }
//   - a deposit percentage applied here      total * dp_percentage
// A down payment is the Hub's `down_payment_jpy` / `down_payment_php` (catalog)
// or `layaway_quote`'s `deposit` (calculator, checkout); a peso figure is the
// Hub's peso quote. Render them; never derive one.
//
// Scope: app/, components/, lib/. lib/fixtures.ts is excluded — it is the
// preview-only stand-in for the Hub (NEXT_PUBLIC_PREVIEW_FIXTURES), so it has
// to do the Hub's arithmetic to answer like one. It never runs in production.
//
// Not in scope: `price_jpy * qty` (a cart line, whole yen, re-priced by the Hub
// at /checkout/quote) — it neither converts nor applies a percentage.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOTS = ["app", "components", "lib"];
const EXCLUDE = new Set(["lib/fixtures.ts"]);

const MONEY = String.raw`\b[\w.?]*(?:price|jpy|php|amount|total|subtotal|deposit|down_?payment)\w*\)?`;
const DECIMAL = String.raw`\d*\.\d+\b`;
const RATE = String.raw`\b[\w.?]*(?:jpy_php|fx_rate|phpRate|php_rate|rate)\b`;
const PCT = String.raw`\b[\w.?]*(?:dp_percentage|down_payment_pct|dpPct)\b`;
const RULES = [
  { name: "toPhp / phpRate (browser currency conversion)", re: /\b(?:toPhp|phpRate)\b/ },
  { name: "a price multiplied or divided by a decimal (a percentage or a rate)", re: new RegExp(`${MONEY}\\s*[*/]\\s*${DECIMAL}|${DECIMAL}\\s*\\*\\s*${MONEY}`, "i") },
  { name: "arithmetic with an exchange rate", re: new RegExp(`[*/]\\s*${RATE}|${RATE}\\s*[*/]`) },
  { name: "arithmetic with a deposit percentage", re: new RegExp(`[*/]\\s*${PCT}|${PCT}\\s*[*/]`) },
  { name: "a hardcoded exchange rate", re: /\bjpy_php\s*:\s*\d*\.\d+/ },
];

// The guard proves itself on every run: each rule must still catch the code it
// was written for, and must not catch the known innocent lines in this repo.
// A pattern edited into uselessness fails here rather than passing silently.
const MUST_CATCH = [
  "formatMoney(Math.round(price * 0.3))",
  "const fmt = (jpy: number) => formatMoney(toPhp(jpy, phpRate), \"PHP\")",
  "export const toPhp = (jpy: number, rate: number) => Math.round(jpy * rate);",
  "hub.fx().catch(() => ({ jpy_php: 0.39, as_of: \"\" }))",
  "const php = Math.round(v.price_jpy * fx.jpy_php)",
  "const dp = Math.round(total * dp_percentage)",
  "0.3 * price",
];
const MUST_PASS = [
  "if (!reduced && f) f.style.transform = `translate(${s.dx * 0.3}px, ${dy}px)`",
  "line_total_jpy: variant.price_jpy * qty,",
  "@keyframes ti-g-star { 0% { transform: none; } ${f(gA * 0.35)}% { transform: scale(1.12); } }",
  "{formatYenPeso(dpJpy, dpPhp)}",
];

let failed = 0;
const fail = (msg) => { failed++; console.error(`✗ ${msg}`); };
const hits = (line) => RULES.filter((r) => r.re.test(line));
for (const s of MUST_CATCH) if (!hits(s).length) fail(`check-money no longer catches: ${s}`);
for (const s of MUST_PASS) for (const r of hits(s)) fail(`check-money wrongly flags (${r.name}): ${s}`);

// Comments are blanked (newlines kept, so line numbers stay true) before
// matching: the files explain the rule in prose, and prose is not maths.
const stripComments = (src) =>
  src
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/^\s*\/\/.*$/gm, "");

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx|mjs|js)$/.test(name)) files.push(p);
  }
};
for (const r of ROOTS) walk(r);

let scanned = 0;
for (const file of files) {
  const rel = relative(".", file);
  if (EXCLUDE.has(rel)) continue;
  scanned++;
  stripComments(readFileSync(file, "utf8")).split("\n").forEach((line, i) => {
    for (const r of hits(line)) fail(`${rel}:${i + 1} — ${r.name}\n    ${line.trim()}\n    Render the Hub's figure instead (CLAUDE.md, "Every customer-facing money figure comes from the Hub").`);
  });
}

if (failed) {
  console.error(`\ncheck:money failed (${failed}).`);
  process.exit(1);
}
console.log(`check:money OK — ${scanned} files, no browser-side money maths (${MUST_CATCH.length} regressions caught, ${MUST_PASS.length} innocents passed).`);
