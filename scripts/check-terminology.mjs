// Fails the build if forbidden gold terminology — or an unsourced origin claim —
// appears anywhere in source or content.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// Country-branded gold as a purity claim, in English and Japanese. Banned
// everywhere in this repo, no exceptions. (Customer testimonials are Hub data
// and are shown as written; this rule covers Cha Jewels' own text.)
const forbidden = [
  /\b(?:japan(?:ese)?|saudi|italian|italy|dubai|hk|hong kong|chinese|thai|korean|philippine|filipino)\s+gold\b/i,
  /(?:日本|サウジ|イタリア|ドバイ|香港|中国|タイ|韓国)の?ゴールド/,
  /日本金/,
];

// An origin claim is DATA: it may be rendered only by OriginBadge, from the
// product's `origin` field. Hardcoded anywhere else it is an assertion about
// pieces nobody checked — branded and preloved items included. The list covers
// the phrases that make the same claim without the literal "made in Japan".
const originClaims = [
  /\bmade in japan\b/i,
  /日本製/,
  /\bcrafted in japan\b/i,
  /\bjapanese (?:workshops?|craftsmanship|artisans?)\b/i,
  /\bjewelry from japan\b/i,
  /日本で仕立て/,
  /日本の工房/,
  /日本のものづくり/,
];
const originAllowed = new Set(["components/catalog/origin-badge.tsx"]);
// lib/i18n.ts holds OriginBadge's own string (product.originJapan) and the
// clarifier (brand.originNote). Only those two lines are exempt, not the file:
// any other origin phrase in the dictionary fails like it would anywhere else.
const i18nOriginKeys = /\b(?:originJapan|originNote):/;

// THE ONLY SITE-WIDE ORIGIN WORDING (owner decision 2026-09-25), by exact
// text. Each phrase is removed from the line before the line is checked, so
// anything else on the same line is still caught. Change a word of any of them
// and the check fails until this list changes with it. Add nothing here
// without an owner decision.
const originExempt = [
  // The clarifier, lib/i18n.ts brand.originNote (footer, hero, About, FAQ).
  "Our new jewelry is made in Japan. Preloved branded pieces are made by their original brands and authenticated in Japan.",
  "新品ジュエリーはすべて日本製。中古ブランド品は各ブランドの製品で、日本で真贋鑑定済みです。",
  // The FAQ question the clarifier answers (the live Hub row; preview copy in
  // lib/content/faq.ts).
  "Is everything made in Japan?",
  "すべて日本製ですか？",
  // About, English closing: "new pieces" qualifies the claim the same way the
  // clarifier does.
  "From new pieces made in Japan",
];
const withoutExempt = (line) => originExempt.reduce((l, phrase) => l.split(phrase).join(" "), line);

const skip = new Set(["node_modules", ".next", ".git"]);
let hits = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!/\.(tsx?|mdx?|json|sql|css)$/.test(name) || name === "check-terminology.mjs" || name === "CLAUDE.md") continue;
    const rel = relative(process.cwd(), p).split("\\").join("/");
    const lines = readFileSync(p, "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const re of forbidden) if (re.test(line)) { hits++; console.error(`${p}:${i + 1}: forbidden term -> ${line.trim()}`); }
      const exempt = originAllowed.has(rel) || (rel === "lib/i18n.ts" && i18nOriginKeys.test(line));
      if (!exempt) {
        const rest = withoutExempt(line);
        for (const re of originClaims) if (re.test(rest)) { hits++; console.error(`${p}:${i + 1}: hardcoded origin claim (only OriginBadge may render this, from product data) -> ${line.trim()}`); }
      }
    });
  }
}
walk(process.cwd());
if (hits) { console.error(`\n${hits} problem(s). Describe purity as "K18 gold"; origin comes only from product data via OriginBadge.`); process.exit(1); }
console.log("Terminology check passed.");
